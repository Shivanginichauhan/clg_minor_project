-- ==============================================================================
-- UNIVERSITY EXAMINATION AND ACADEMIC MANAGEMENT SYSTEM (UEAMS)
-- INITIAL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) MIGRATION
-- MCA Minor Project - PostgreSQLi / Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'faculty', 'administrator', 'dean');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE exam_schedule_status AS ENUM ('draft', 'submitted', 'approved', 'published');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE marks_status AS ENUM ('draft', 'submitted', 'verified');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE result_status AS ENUM ('draft', 'pending_approval', 'approved', 'published');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    phone VARCHAR(20),
    status user_status NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    head_of_department_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PROGRAMS TABLE (e.g., MCA, B.Tech, MBA)
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    degree_level VARCHAR(50) NOT NULL DEFAULT 'postgraduate',
    total_semesters INT NOT NULL DEFAULT 4 CHECK (total_semesters > 0 AND total_semesters <= 12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ACADEMIC SESSIONS TABLE (e.g., 2025-2026)
CREATE TABLE IF NOT EXISTS public.academic_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_session_dates CHECK (end_date > start_date)
);

-- 7. SEMESTERS TABLE
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    semester_number INT NOT NULL CHECK (semester_number >= 1 AND semester_number <= 12),
    term_type VARCHAR(10) NOT NULL DEFAULT 'odd' CHECK (term_type IN ('odd', 'even', 'summer')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (program_id, session_id, semester_number),
    CONSTRAINT chk_semester_dates CHECK (end_date > start_date)
);

-- 8. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    credits NUMERIC(3,1) NOT NULL DEFAULT 4.0 CHECK (credits > 0),
    semester_number INT NOT NULL CHECK (semester_number >= 1 AND semester_number <= 12),
    type VARCHAR(20) NOT NULL DEFAULT 'theory' CHECK (type IN ('theory', 'practical', 'elective', 'project')),
    max_internal_marks NUMERIC(5,2) NOT NULL DEFAULT 40.00 CHECK (max_internal_marks >= 0),
    max_external_marks NUMERIC(5,2) NOT NULL DEFAULT 60.00 CHECK (max_external_marks >= 0),
    pass_percentage NUMERIC(5,2) NOT NULL DEFAULT 40.00 CHECK (pass_percentage > 0 AND pass_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    enrollment_number VARCHAR(50) UNIQUE NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
    current_semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    admission_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    date_of_birth DATE,
    gender VARCHAR(20),
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. FACULTY TABLE
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    designation VARCHAR(100) NOT NULL DEFAULT 'Assistant Professor',
    specialization VARCHAR(150),
    joining_date DATE,
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ENROLLMENTS TABLE (Students enrolled in subjects per semester)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'dropped', 'completed')),
    UNIQUE (student_id, semester_id, subject_id)
);

-- 12. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status attendance_status NOT NULL DEFAULT 'present',
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (subject_id, student_id, date)
);

-- 13. EXAMINATIONS TABLE
CREATE TABLE IF NOT EXISTS public.examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    exam_type VARCHAR(30) NOT NULL DEFAULT 'regular' CHECK (exam_type IN ('regular', 'supplementary', 'improvement')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_exam_dates CHECK (end_date >= start_date)
);

-- 14. EXAM SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.exam_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status exam_schedule_status NOT NULL DEFAULT 'draft',
    reviewed_by_dean_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (examination_id, subject_id),
    CONSTRAINT chk_exam_times CHECK (end_time > start_time)
);

-- 15. EXAM FORMS / ADMIT CARDS TABLE
CREATE TABLE IF NOT EXISTS public.exam_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'exempted')),
    fee_amount NUMERIC(8,2) NOT NULL DEFAULT 1500.00,
    status VARCHAR(30) NOT NULL DEFAULT 'approved' CHECK (status IN ('submitted', 'approved', 'rejected', 'admit_card_generated')),
    admit_card_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (examination_id, student_id)
);

-- 16. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(30) UNIQUE NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor INT NOT NULL DEFAULT 1,
    capacity INT NOT NULL CHECK (capacity > 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. SEATING ARRANGEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.seating_arrangements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    seat_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_schedule_id, student_id),
    UNIQUE (exam_schedule_id, room_id, seat_number)
);

-- 18. FACULTY EXAM DUTIES TABLE
CREATE TABLE IF NOT EXISTS public.faculty_exam_duties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    duty_role VARCHAR(50) NOT NULL DEFAULT 'invigilator' CHECK (duty_role IN ('invigilator', 'reliever', 'chief_superintendent')),
    status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'completed')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_schedule_id, faculty_id)
);

-- 19. MARKS TABLE
CREATE TABLE IF NOT EXISTS public.marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    entered_by_faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE RESTRICT,
    internal_marks NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (internal_marks >= 0),
    external_marks NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (external_marks >= 0),
    practical_marks NUMERIC(5,2) DEFAULT 0.00 CHECK (practical_marks >= 0),
    total_marks NUMERIC(5,2) GENERATED ALWAYS AS (internal_marks + external_marks + COALESCE(practical_marks, 0)) STORED,
    grade VARCHAR(5),
    grade_point NUMERIC(3,1),
    status marks_status NOT NULL DEFAULT 'draft',
    verified_by_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, subject_id, examination_id)
);

-- 20. RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    total_credits NUMERIC(4,1) NOT NULL DEFAULT 0.0,
    sgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (sgpa >= 0.00 AND sgpa <= 10.00),
    cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    result_status result_status NOT NULL DEFAULT 'draft',
    approved_by_dean_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, examination_id, semester_id)
);

-- 21. RESULT SUBJECT DETAILS TABLE
CREATE TABLE IF NOT EXISTS public.result_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    marks_id UUID REFERENCES public.marks(id) ON DELETE SET NULL,
    grade VARCHAR(5) NOT NULL,
    grade_point NUMERIC(3,1) NOT NULL,
    credits NUMERIC(3,1) NOT NULL,
    is_passed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. NOTICES TABLE
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_audience VARCHAR(30) NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'faculty', 'administrators', 'deans')),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(150),
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    entity_name VARCHAR(255),
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'security', 'critical')),
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_program ON public.students(program_id, current_semester_id);
CREATE INDEX IF NOT EXISTS idx_faculty_user_id ON public.faculty(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_department ON public.faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_subject ON public.enrollments(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_date ON public.attendance(subject_id, date);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam ON public.exam_schedules(examination_id);
CREATE INDEX IF NOT EXISTS idx_marks_student_exam ON public.marks(student_id, examination_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON public.results(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at);

-- ==============================================================================
-- HELPER SECURITY FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Function to get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Role check helpers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrator'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_dean()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dean'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'faculty'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Trigger to automatically create a profile when a new user signs up in Supabase Auth
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
        role = CASE 
            WHEN public.profiles.role = 'student'::user_role AND v_role <> 'student'::user_role THEN v_role 
            ELSE public.profiles.role 
        END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOUNDATION
-- ==============================================================================

-- Security Helper Functions (required for RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrator'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_dean()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dean'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'faculty'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seating_arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_exam_duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin() OR public.is_dean() OR public.is_faculty());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

-- 3. Academic Structure Policies (Public read for authenticated users, Admin manage)
DROP POLICY IF EXISTS "Authenticated users can read departments" ON public.departments;
CREATE POLICY "Authenticated users can read departments" ON public.departments
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
CREATE POLICY "Admins can manage departments" ON public.departments
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can read programs" ON public.programs;
CREATE POLICY "Authenticated users can read programs" ON public.programs
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;
CREATE POLICY "Admins can manage programs" ON public.programs
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can read sessions" ON public.academic_sessions;
CREATE POLICY "Authenticated users can read sessions" ON public.academic_sessions
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage sessions" ON public.academic_sessions;
CREATE POLICY "Admins can manage sessions" ON public.academic_sessions
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can read semesters" ON public.semesters;
CREATE POLICY "Authenticated users can read semesters" ON public.semesters
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage semesters" ON public.semesters;
CREATE POLICY "Admins can manage semesters" ON public.semesters
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can read subjects" ON public.subjects;
CREATE POLICY "Authenticated users can read subjects" ON public.subjects
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins can manage subjects" ON public.subjects
    FOR ALL USING (public.is_admin());

-- 4. Students & Faculty Policies
DROP POLICY IF EXISTS "Students read own record" ON public.students;
CREATE POLICY "Students read own record" ON public.students
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin() OR public.is_dean() OR public.is_faculty());

DROP POLICY IF EXISTS "Admins manage student records" ON public.students;
CREATE POLICY "Admins manage student records" ON public.students
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Faculty read own record" ON public.faculty;
CREATE POLICY "Faculty read own record" ON public.faculty
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin() OR public.is_dean());

DROP POLICY IF EXISTS "Admins manage faculty records" ON public.faculty;
CREATE POLICY "Admins manage faculty records" ON public.faculty
    FOR ALL USING (public.is_admin());

-- 5. Enrollments & Attendance Policies
DROP POLICY IF EXISTS "Students view own enrollments" ON public.enrollments;
CREATE POLICY "Students view own enrollments" ON public.enrollments
    FOR SELECT TO authenticated USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) 
        OR public.is_admin() OR public.is_dean() OR public.is_faculty()
    );

DROP POLICY IF EXISTS "Admins manage enrollments" ON public.enrollments;
CREATE POLICY "Admins manage enrollments" ON public.enrollments
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Students view own attendance" ON public.attendance;
CREATE POLICY "Students view own attendance" ON public.attendance
    FOR SELECT TO authenticated USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) 
        OR public.is_admin() OR public.is_dean() OR public.is_faculty()
    );

DROP POLICY IF EXISTS "Faculty and Admin manage attendance" ON public.attendance;
CREATE POLICY "Faculty and Admin manage attendance" ON public.attendance
    FOR ALL USING (public.is_faculty() OR public.is_admin());

-- 6. Examinations & Schedules Policies
DROP POLICY IF EXISTS "View published examinations" ON public.examinations;
CREATE POLICY "View published examinations" ON public.examinations
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage examinations" ON public.examinations;
CREATE POLICY "Admins manage examinations" ON public.examinations
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "View exam schedules" ON public.exam_schedules;
CREATE POLICY "View exam schedules" ON public.exam_schedules
    FOR SELECT TO authenticated USING (
        status = 'published' 
        OR public.is_admin() 
        OR public.is_dean() 
        OR public.is_faculty()
    );

DROP POLICY IF EXISTS "Admins manage exam schedules" ON public.exam_schedules;
CREATE POLICY "Admins manage exam schedules" ON public.exam_schedules
    FOR ALL USING (public.is_admin() OR public.is_dean());

-- 7. Marks Policies
DROP POLICY IF EXISTS "Students view verified/published marks" ON public.marks;
CREATE POLICY "Students view verified/published marks" ON public.marks
    FOR SELECT TO authenticated USING (
        (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) AND status = 'verified')
        OR public.is_faculty() OR public.is_admin() OR public.is_dean()
    );

DROP POLICY IF EXISTS "Faculty insert and update marks for assigned subjects" ON public.marks;
CREATE POLICY "Faculty insert and update marks for assigned subjects" ON public.marks
    FOR ALL USING (public.is_faculty() OR public.is_admin());

-- 8. Results Policies
DROP POLICY IF EXISTS "Students view approved and published results" ON public.results;
CREATE POLICY "Students view approved and published results" ON public.results
    FOR SELECT TO authenticated USING (
        (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) AND result_status = 'published')
        OR public.is_admin() OR public.is_dean() OR public.is_faculty()
    );

DROP POLICY IF EXISTS "Deans and Admins manage results" ON public.results;
CREATE POLICY "Deans and Admins manage results" ON public.results
    FOR ALL USING (public.is_dean() OR public.is_admin());

DROP POLICY IF EXISTS "View result subject breakdowns" ON public.result_subjects;
CREATE POLICY "View result subject breakdowns" ON public.result_subjects
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage result subject breakdowns" ON public.result_subjects;
CREATE POLICY "Admins manage result subject breakdowns" ON public.result_subjects
    FOR ALL USING (public.is_admin() OR public.is_dean());

-- 9. Notices Policies
DROP POLICY IF EXISTS "All authenticated users view notices" ON public.notices;
CREATE POLICY "All authenticated users view notices" ON public.notices
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and Deans publish notices" ON public.notices;
CREATE POLICY "Admins and Deans publish notices" ON public.notices
    FOR ALL USING (public.is_admin() OR public.is_dean());

-- 10. Audit Logs Policies
DROP POLICY IF EXISTS "Admins and Deans view audit logs" ON public.audit_logs;
CREATE POLICY "Admins and Deans view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated USING (public.is_admin() OR public.is_dean());

DROP POLICY IF EXISTS "System inserts audit logs" ON public.audit_logs;
CREATE POLICY "System inserts audit logs" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);
