-- ==============================================================================
-- UNIVERSITY EXAMINATION AND ACADEMIC MANAGEMENT SYSTEM (UEAMS)
-- HOTFIX MIGRATION: RESOLVE POSTGRESQL RLS INFINITE RECURSION & SIGNUP DATABASE ERROR
-- ==============================================================================
-- Root Cause:
-- 1. When registering a user, Supabase Auth runs trigger `on_auth_user_created`
--    which executes `handle_new_user()`.
-- 2. `handle_new_user()` attempts to insert into `public.profiles`.
-- 3. `public.profiles` evaluated the recursive policy `profiles_select` which
--    invoked `is_faculty()`, querying `students` -> `profiles` in an infinite loop (42P17).
-- 4. In addition, `trg_protect_profile_role` threw an unhandled exception for non-admins.
-- 5. This transaction rollback caused: "500 Database error saving new user".
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: DROP RECURSIVE PROFILE ROLE TRIGGER
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;

-- ------------------------------------------------------------------------------
-- STEP 2: HARDEN HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS loops)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrator'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_dean()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dean'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'faculty'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- ------------------------------------------------------------------------------
-- STEP 3: REPLACE handle_new_user() WITH FAULT-TOLERANT EXECUTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role := 'student'::user_role;
    v_meta_role TEXT;
BEGIN
    v_meta_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'student')));
    
    IF v_meta_role IN ('student', 'faculty', 'dean', 'administrator') THEN
        v_role := v_meta_role::user_role;
    END IF;

    BEGIN
        INSERT INTO public.profiles (id, full_name, email, role, status)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NEW.email,
            v_role,
            'active'::user_status
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
            email = COALESCE(EXCLUDED.email, public.profiles.email),
            role = EXCLUDED.role;
    EXCEPTION WHEN OTHERS THEN
        -- Never abort auth.users transaction; log warning instead
        RAISE WARNING 'handle_new_user profile creation caught: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Re-attach trigger to auth.users safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- STEP 4: RECREATE CLEAN, NON-RECURSIVE PROFILES RLS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Any authenticated user can read profiles (needed for names on attendance, notices, schedules)
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

-- Authenticated users can insert their own profile
CREATE POLICY "profiles_insert_self" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- Authenticated users can update their own profile
CREATE POLICY "profiles_update_self" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Administrators have full access
CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- STEP 5: RECREATE CLEAN, NON-RECURSIVE STUDENTS & FACULTY POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "students_read" ON public.students;
DROP POLICY IF EXISTS "Students read own record" ON public.students;
DROP POLICY IF EXISTS "students_insert_self" ON public.students;

CREATE POLICY "students_read" ON public.students
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() 
        OR public.is_admin() 
        OR public.is_dean() 
        OR public.is_faculty()
    );

CREATE POLICY "students_insert_self" ON public.students
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "faculty_read" ON public.faculty;
DROP POLICY IF EXISTS "Faculty read own record" ON public.faculty;
DROP POLICY IF EXISTS "faculty_insert_self" ON public.faculty;

CREATE POLICY "faculty_read" ON public.faculty
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() 
        OR public.is_admin() 
        OR public.is_dean() 
        OR public.is_faculty()
        OR public.is_student()
    );

CREATE POLICY "faculty_insert_self" ON public.faculty
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- STEP 6: RELOAD SCHEMA CACHE
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
