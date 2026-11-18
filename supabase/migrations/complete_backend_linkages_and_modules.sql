-- ==============================================================================
-- UNIVERSITY EXAMINATION AND ACADEMIC MANAGEMENT SYSTEM (UEAMS)
-- MIGRATION: COMPLETE BACKEND ARCHITECTURE & ROLE MODULE LINKAGES
-- ==============================================================================
-- 1. Student Statutory Clearances (public.student_clearances)
-- 2. Exam Registration Extensions (candidate_type, fees, contact, guardian info)
-- 3. Student Achievements & Extracurricular Certification (public.student_achievements)
-- 4. Faculty Class Mentorship Directorate (public.faculty_mentorship_cohorts, public.student_mentorship_records, public.mentorship_guardian_alerts)
-- 5. Timetable Substitute & Leave Proxy System (public.timetable_slots columns, public.faculty_leave_proxies)
-- 6. Comprehensive Foreign Keys, Indexes, RLS Policies & Production Seed Data
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- SECTION 1: STUDENT STATUTORY CLEARANCE TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_clearances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    accounts_cleared BOOLEAN NOT NULL DEFAULT TRUE,
    accounts_dues_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    accounts_cleared_at TIMESTAMPTZ,
    library_cleared BOOLEAN NOT NULL DEFAULT TRUE,
    library_overdue_books_count INT NOT NULL DEFAULT 0,
    library_cleared_at TIMESTAMPTZ,
    attendance_percentage NUMERIC(5, 2) NOT NULL DEFAULT 88.00,
    attendance_cleared BOOLEAN NOT NULL DEFAULT TRUE,
    mentor_approval BOOLEAN NOT NULL DEFAULT TRUE,
    mentor_condoned BOOLEAN NOT NULL DEFAULT FALSE,
    mentor_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    mentor_approved_at TIMESTAMPTZ,
    can_apply_for_exam BOOLEAN NOT NULL DEFAULT TRUE,
    overall_status VARCHAR(50) NOT NULL DEFAULT 'cleared' CHECK (overall_status IN ('cleared', 'action_required', 'blocked')),
    noc_reference VARCHAR(100) NOT NULL DEFAULT 'NOC-REG-2026-MCA-0819',
    cleared_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_sem_clearance UNIQUE (student_id, semester_id)
);

CREATE INDEX IF NOT EXISTS idx_clearance_student ON public.student_clearances(student_id);
CREATE INDEX IF NOT EXISTS idx_clearance_semester ON public.student_clearances(semester_id);
CREATE INDEX IF NOT EXISTS idx_clearance_status ON public.student_clearances(overall_status);

-- ------------------------------------------------------------------------------
-- SECTION 2: EXAM REGISTRATION EXTENSIONS
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.exam_registrations
  ADD COLUMN IF NOT EXISTS candidate_type VARCHAR(50) DEFAULT 'Regular' CHECK (candidate_type IN ('Regular', 'Ex-Student / Re-appear', 'Improvement')),
  ADD COLUMN IF NOT EXISTS center_fee NUMERIC(10, 2) DEFAULT 200.00,
  ADD COLUMN IF NOT EXISTS student_phone VARCHAR(20) DEFAULT '+91 98765 43210',
  ADD COLUMN IF NOT EXISTS student_email VARCHAR(150) DEFAULT 'rahul.mca@university.edu',
  ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255) DEFAULT 'Mr. Ramesh Sharma',
  ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20) DEFAULT '+91 98111 22334',
  ADD COLUMN IF NOT EXISTS correspondence_address TEXT DEFAULT 'B-402, Nilgiri Heights, University Enclave',
  ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'General';

-- ------------------------------------------------------------------------------
-- SECTION 3: STUDENT ACHIEVEMENTS & CERTIFICATES LOCKER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'Hackathon / Competition',
        'Industry Internship',
        'Professional Certification',
        'Research Paper / Publication',
        'Sports & Athletics',
        'Cultural & Fine Arts'
    )),
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    credential_id VARCHAR(100),
    credential_url TEXT,
    certificate_file_url TEXT NOT NULL,
    badge VARCHAR(50) DEFAULT 'Department Verified',
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    verified_by UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_student ON public.student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.student_achievements(category);

-- ------------------------------------------------------------------------------
-- SECTION 4: FACULTY CLASS MENTORSHIP DIRECTORATE TABLES
-- ------------------------------------------------------------------------------
-- 1. Mentorship Cohort Assignments (e.g. Mentor for MCA Semester 2, Section A)
CREATE TABLE IF NOT EXISTS public.faculty_mentorship_cohorts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    section VARCHAR(20) NOT NULL DEFAULT 'Section A',
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    cohort_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_faculty_cohort UNIQUE (program_id, semester_id, section, session_id)
);

CREATE INDEX IF NOT EXISTS idx_cohort_faculty ON public.faculty_mentorship_cohorts(faculty_id);
CREATE INDEX IF NOT EXISTS idx_cohort_semester ON public.faculty_mentorship_cohorts(semester_id);

-- 2. Student Mentorship Roster Records
CREATE TABLE IF NOT EXISTS public.student_mentorship_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cohort_id UUID NOT NULL REFERENCES public.faculty_mentorship_cohorts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    attendance_percentage NUMERIC(5, 2) NOT NULL DEFAULT 88.00,
    total_lectures INT NOT NULL DEFAULT 140,
    attended_lectures INT NOT NULL DEFAULT 123,
    cgpa NUMERIC(4, 2) NOT NULL DEFAULT 8.50,
    backlog_count INT NOT NULL DEFAULT 0,
    no_dues_status VARCHAR(30) NOT NULL DEFAULT 'cleared' CHECK (no_dues_status IN ('cleared', 'accounts_pending', 'library_pending')),
    mentor_approval_status VARCHAR(30) NOT NULL DEFAULT 'approved' CHECK (mentor_approval_status IN ('approved', 'pending', 'condoned', 'rejected')),
    condonation_reason TEXT,
    condoned_at TIMESTAMPTZ,
    counseling_notes TEXT,
    last_counseled_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_mentorship UNIQUE (cohort_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_mentorship_student ON public.student_mentorship_records(student_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_cohort ON public.student_mentorship_records(cohort_id);

-- 3. Proctorial Alerts Dispatched to Guardians / Parents
CREATE TABLE IF NOT EXISTS public.mentorship_guardian_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('shortage', 'dues', 'counseling', 'appreciation')),
    message TEXT NOT NULL,
    sent_to_phone VARCHAR(20),
    sent_to_email VARCHAR(150),
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'delivered',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardian_alerts_student ON public.mentorship_guardian_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_guardian_alerts_faculty ON public.mentorship_guardian_alerts(faculty_id);

-- ------------------------------------------------------------------------------
-- SECTION 5: TIMETABLE SUBSTITUTE / PROXY EXTENSIONS & PROXY TABLE
-- ------------------------------------------------------------------------------
-- Add substitute columns to timetable_slots
ALTER TABLE IF EXISTS public.timetable_slots
  ADD COLUMN IF NOT EXISTS substitute_faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS substitute_date DATE,
  ADD COLUMN IF NOT EXISTS substitute_reason VARCHAR(255),
  ADD COLUMN IF NOT EXISTS substitute_notes TEXT,
  ADD COLUMN IF NOT EXISTS substitute_status VARCHAR(50) DEFAULT 'none' CHECK (substitute_status IN ('none', 'arranged', 'confirmed', 'completed', 'revoked'));

-- Dedicated Proxy / Leave Adjustment Log Table
CREATE TABLE IF NOT EXISTS public.faculty_leave_proxies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES public.timetable_slots(id) ON DELETE CASCADE,
    original_faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    substitute_faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    leave_type VARCHAR(100) NOT NULL CHECK (leave_type IN (
        'Casual Leave (CL)',
        'Academic / Conference Duty (OD)',
        'Medical Leave',
        'Official University Deputation',
        'Personal Emergency'
    )),
    handover_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'arranged' CHECK (status IN ('arranged', 'confirmed', 'completed', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proxies_slot ON public.faculty_leave_proxies(slot_id);
CREATE INDEX IF NOT EXISTS idx_proxies_substitute ON public.faculty_leave_proxies(substitute_faculty_id);
CREATE INDEX IF NOT EXISTS idx_proxies_date ON public.faculty_leave_proxies(leave_date);

-- ------------------------------------------------------------------------------
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.student_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_mentorship_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_mentorship_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_guardian_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_leave_proxies ENABLE ROW LEVEL SECURITY;

-- 1. student_clearances policies
DROP POLICY IF EXISTS "student_clearances_select_policy" ON public.student_clearances;
CREATE POLICY "student_clearances_select_policy" ON public.student_clearances
    FOR SELECT TO authenticated
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_faculty()
        OR public.is_admin()
        OR public.is_dean()
    );

DROP POLICY IF EXISTS "student_clearances_modify_policy" ON public.student_clearances;
CREATE POLICY "student_clearances_modify_policy" ON public.student_clearances
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_dean() OR public.is_faculty())
    WITH CHECK (public.is_admin() OR public.is_dean() OR public.is_faculty());

-- 2. student_achievements policies
DROP POLICY IF EXISTS "student_achievements_select_policy" ON public.student_achievements;
CREATE POLICY "student_achievements_select_policy" ON public.student_achievements
    FOR SELECT TO authenticated
    USING (TRUE); -- Achievements are public portfolio items within institution

DROP POLICY IF EXISTS "student_achievements_insert_policy" ON public.student_achievements;
CREATE POLICY "student_achievements_insert_policy" ON public.student_achievements
    FOR INSERT TO authenticated
    WITH CHECK (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "student_achievements_modify_policy" ON public.student_achievements;
CREATE POLICY "student_achievements_modify_policy" ON public.student_achievements
    FOR UPDATE TO authenticated
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_faculty()
        OR public.is_admin()
    );

-- 3. faculty_mentorship_cohorts & records policies
DROP POLICY IF EXISTS "mentorship_cohorts_select_policy" ON public.faculty_mentorship_cohorts;
CREATE POLICY "mentorship_cohorts_select_policy" ON public.faculty_mentorship_cohorts
    FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "mentorship_records_select_policy" ON public.student_mentorship_records;
CREATE POLICY "mentorship_records_select_policy" ON public.student_mentorship_records
    FOR SELECT TO authenticated
    USING (
        cohort_id IN (SELECT id FROM public.faculty_mentorship_cohorts WHERE faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid()))
        OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_admin()
        OR public.is_dean()
    );

DROP POLICY IF EXISTS "mentorship_records_modify_policy" ON public.student_mentorship_records;
CREATE POLICY "mentorship_records_modify_policy" ON public.student_mentorship_records
    FOR ALL TO authenticated
    USING (
        cohort_id IN (SELECT id FROM public.faculty_mentorship_cohorts WHERE faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid()))
        OR public.is_admin()
        OR public.is_dean()
    );

-- 4. mentorship_guardian_alerts policies
DROP POLICY IF EXISTS "guardian_alerts_select_policy" ON public.mentorship_guardian_alerts;
CREATE POLICY "guardian_alerts_select_policy" ON public.mentorship_guardian_alerts
    FOR SELECT TO authenticated
    USING (
        faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
        OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "guardian_alerts_insert_policy" ON public.mentorship_guardian_alerts;
CREATE POLICY "guardian_alerts_insert_policy" ON public.mentorship_guardian_alerts
    FOR INSERT TO authenticated
    WITH CHECK (
        faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
        OR public.is_admin()
    );

-- 5. faculty_leave_proxies policies
DROP POLICY IF EXISTS "leave_proxies_select_policy" ON public.faculty_leave_proxies;
CREATE POLICY "leave_proxies_select_policy" ON public.faculty_leave_proxies
    FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "leave_proxies_modify_policy" ON public.faculty_leave_proxies;
CREATE POLICY "leave_proxies_modify_policy" ON public.faculty_leave_proxies
    FOR ALL TO authenticated
    USING (public.is_faculty() OR public.is_admin() OR public.is_dean());
