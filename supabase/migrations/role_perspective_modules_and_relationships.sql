-- ==============================================================================
-- UNIVERSITY EXAMINATION AND ACADEMIC MANAGEMENT SYSTEM (UEAMS)
-- MIGRATION: ROLE-PERSPECTIVE EXTENSIONS (STUDENT, DEAN, FACULTY)
-- ==============================================================================
-- 1. Student Personal & Academic Dossier Expansion (public.students, public.student_documents)
-- 2. Master Curricular Timetable & Academic Calendar (public.timetable_slots, public.academic_calendar_events)
-- 3. Student Examination Registration & Docket System (public.exam_registrations, public.exam_registration_papers)
-- 4. Scholarship Sanction & Merit Endorsement System (public.scholarship_schemes, public.scholarship_applications, public.scholarship_documents)
-- 5. Complete Foreign Key Relationships, Indexes & Strict RLS Enforcement
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- SECTION 1: EXTEND STUDENTS TABLE FOR COMPREHENSIVE DOSSIER
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.students
  ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10) DEFAULT 'O+',
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS father_name VARCHAR(255) DEFAULT 'Not Specified',
  ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255) DEFAULT 'Not Specified',
  ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20) DEFAULT '+91 98000 00000',
  ADD COLUMN IF NOT EXISTS permanent_address TEXT DEFAULT 'Main Campus Hostel, Civil Lines',
  ADD COLUMN IF NOT EXISTS current_address TEXT DEFAULT 'Main Campus Hostel, Civil Lines',
  ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4, 2) DEFAULT 8.50,
  ADD COLUMN IF NOT EXISTS credits_earned INT DEFAULT 24,
  ADD COLUMN IF NOT EXISTS academic_standing VARCHAR(100) DEFAULT 'Regular Matriculated Scholar';

-- Student Documents Locker Table
CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL CHECK (document_type IN (
        '10th_marksheet',
        '12th_marksheet',
        'degree_certificate',
        'identity_proof',
        'domicile_certificate',
        'category_certificate',
        'anti_ragging_affidavit'
    )),
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_docs_student ON public.student_documents(student_id);

-- ------------------------------------------------------------------------------
-- SECTION 2: CLASS TIMETABLE & ACADEMIC CALENDAR TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.timetable_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    room_number VARCHAR(50) NOT NULL,
    building VARCHAR(100) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 8),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'lecture' CHECK (type IN ('lecture', 'lab', 'tutorial', 'seminar')),
    batch VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Clash prevention constraints
    CONSTRAINT uq_timetable_room_slot UNIQUE (room_number, day_of_week, period_number),
    CONSTRAINT uq_timetable_faculty_slot UNIQUE (faculty_id, day_of_week, period_number)
);

CREATE INDEX IF NOT EXISTS idx_timetable_sem ON public.timetable_slots(semester_id);
CREATE INDEX IF NOT EXISTS idx_timetable_faculty ON public.timetable_slots(faculty_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON public.timetable_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_subject ON public.timetable_slots(subject_id);

-- University Academic Calendar Events
CREATE TABLE IF NOT EXISTS public.academic_calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('lecture', 'exam', 'holiday', 'event', 'deadline')),
    description TEXT,
    venue VARCHAR(100),
    start_time TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_date ON public.academic_calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_session ON public.academic_calendar_events(session_id);

-- ------------------------------------------------------------------------------
-- SECTION 3: EXAM APPLICATIONS & PAPER REGISTRATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_no VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    total_papers_count INT NOT NULL DEFAULT 0,
    total_credits INT NOT NULL DEFAULT 0,
    examination_fee NUMERIC(10, 2) NOT NULL DEFAULT 1800.00,
    backlog_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    marksheet_fee NUMERIC(10, 2) NOT NULL DEFAULT 250.00,
    total_amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 2050.00,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'exempted')),
    payment_transaction_id VARCHAR(100),
    attendance_percentage NUMERIC(5, 2) NOT NULL CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
    is_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending_dean_review', 'rejected')),
    admit_card_available BOOLEAN NOT NULL DEFAULT TRUE,
    exam_center VARCHAR(255) NOT NULL DEFAULT 'Center 01 - University Main Examination Complex, North Block',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- One application per student per examination cycle
    CONSTRAINT uq_student_exam_reg UNIQUE (student_id, examination_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_reg_student ON public.exam_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_reg_examination ON public.exam_registrations(examination_id);
CREATE INDEX IF NOT EXISTS idx_exam_reg_app_no ON public.exam_registrations(application_no);

-- Individual Papers Enrolled in Examination Form
CREATE TABLE IF NOT EXISTS public.exam_registration_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES public.exam_registrations(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    paper_type VARCHAR(30) NOT NULL DEFAULT 'regular' CHECK (paper_type IN ('regular', 'backlog', 'improvement')),
    credits INT NOT NULL DEFAULT 4,
    fee NUMERIC(10, 2) NOT NULL DEFAULT 350.00,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_reg_paper UNIQUE (registration_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_reg_papers_reg ON public.exam_registration_papers(registration_id);
CREATE INDEX IF NOT EXISTS idx_reg_papers_subject ON public.exam_registration_papers(subject_id);

-- ------------------------------------------------------------------------------
-- SECTION 4: SCHOLARSHIPS & FINANCIAL AID SCHEMES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scholarship_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Merit-Based', 'Need-Based', 'Girls Empowerment', 'Special Category', 'Sports / Research')),
    amount_per_annum NUMERIC(10, 2) NOT NULL CHECK (amount_per_annum > 0),
    eligibility TEXT NOT NULL,
    min_cgpa NUMERIC(4, 2),
    max_family_income NUMERIC(12, 2),
    deadline DATE NOT NULL,
    description TEXT,
    badge VARCHAR(50) DEFAULT 'University Verified',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scholarship_schemes_status ON public.scholarship_schemes(status);

-- Student Scholarship Applications
CREATE TABLE IF NOT EXISTS public.scholarship_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_no VARCHAR(50) UNIQUE NOT NULL,
    scheme_id UUID NOT NULL REFERENCES public.scholarship_schemes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    annual_family_income NUMERIC(12, 2) NOT NULL CHECK (annual_family_income >= 0),
    category VARCHAR(30) NOT NULL DEFAULT 'General' CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'EWS')),
    cgpa NUMERIC(4, 2) NOT NULL CHECK (cgpa >= 0 AND cgpa <= 10.0),
    bank_name VARCHAR(150) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    applied_amount NUMERIC(10, 2) NOT NULL,
    sanctioned_amount NUMERIC(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'submitted',
        'verified_by_advisor',
        'sanctioned_by_dean',
        'disbursed',
        'rejected'
    )),
    dean_remarks TEXT,
    dean_pin_signed BOOLEAN DEFAULT FALSE,
    sanctioned_at TIMESTAMPTZ,
    disbursement_date DATE,
    utr_number VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scholarship_apps_student ON public.scholarship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_apps_scheme ON public.scholarship_applications(scheme_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_apps_status ON public.scholarship_applications(status);

-- Scholarship Documents Attached to Application
CREATE TABLE IF NOT EXISTS public.scholarship_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.scholarship_applications(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL DEFAULT 'PDF',
    file_url TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sch_docs_app ON public.scholarship_documents(application_id);

-- ------------------------------------------------------------------------------
-- SECTION 5: ROW LEVEL SECURITY (RLS) FOR ALL NEW TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_registration_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_documents ENABLE ROW LEVEL SECURITY;

-- 1. Policies: student_documents
DROP POLICY IF EXISTS "student_docs_select_policy" ON public.student_documents;
CREATE POLICY "student_docs_select_policy" ON public.student_documents
    FOR SELECT TO authenticated
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_admin()
        OR public.is_dean()
    );

DROP POLICY IF EXISTS "student_docs_insert_policy" ON public.student_documents;
CREATE POLICY "student_docs_insert_policy" ON public.student_documents
    FOR INSERT TO authenticated
    WITH CHECK (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_admin()
    );

-- 2. Policies: timetable_slots
DROP POLICY IF EXISTS "timetable_slots_select_policy" ON public.timetable_slots;
CREATE POLICY "timetable_slots_select_policy" ON public.timetable_slots
    FOR SELECT TO authenticated
    USING (TRUE); -- Curricular timetable is public to all authenticated institution users

DROP POLICY IF EXISTS "timetable_slots_modify_policy" ON public.timetable_slots;
CREATE POLICY "timetable_slots_modify_policy" ON public.timetable_slots
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_dean())
    WITH CHECK (public.is_admin() OR public.is_dean());

-- 3. Policies: academic_calendar_events
DROP POLICY IF EXISTS "academic_calendar_select_policy" ON public.academic_calendar_events;
CREATE POLICY "academic_calendar_select_policy" ON public.academic_calendar_events
    FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "academic_calendar_modify_policy" ON public.academic_calendar_events;
CREATE POLICY "academic_calendar_modify_policy" ON public.academic_calendar_events
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_dean())
    WITH CHECK (public.is_admin() OR public.is_dean());

-- 4. Policies: exam_registrations & papers
DROP POLICY IF EXISTS "exam_reg_select_policy" ON public.exam_registrations;
CREATE POLICY "exam_reg_select_policy" ON public.exam_registrations
    FOR SELECT TO authenticated
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_admin()
        OR public.is_dean()
    );

DROP POLICY IF EXISTS "exam_reg_insert_policy" ON public.exam_registrations;
CREATE POLICY "exam_reg_insert_policy" ON public.exam_registrations
    FOR INSERT TO authenticated
    WITH CHECK (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "exam_reg_papers_select_policy" ON public.exam_registration_papers;
CREATE POLICY "exam_reg_papers_select_policy" ON public.exam_registration_papers
    FOR SELECT TO authenticated
    USING (
        registration_id IN (
            SELECT id FROM public.exam_registrations 
            WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        )
        OR public.is_admin()
        OR public.is_dean()
    );

DROP POLICY IF EXISTS "exam_reg_papers_insert_policy" ON public.exam_registration_papers;
CREATE POLICY "exam_reg_papers_insert_policy" ON public.exam_registration_papers
    FOR INSERT TO authenticated
    WITH CHECK (
        registration_id IN (
            SELECT id FROM public.exam_registrations 
            WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        )
        OR public.is_admin()
    );

-- 5. Policies: scholarship_schemes
DROP POLICY IF EXISTS "scholarship_schemes_select_policy" ON public.scholarship_schemes;
CREATE POLICY "scholarship_schemes_select_policy" ON public.scholarship_schemes
    FOR SELECT TO authenticated
    USING (TRUE); -- All students and faculty can browse active scholarship schemes

DROP POLICY IF EXISTS "scholarship_schemes_modify_policy" ON public.scholarship_schemes;
CREATE POLICY "scholarship_schemes_modify_policy" ON public.scholarship_schemes
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_dean())
    WITH CHECK (public.is_admin() OR public.is_dean());

-- 6. Policies: scholarship_applications & documents
DROP POLICY IF EXISTS "scholarship_apps_select_policy" ON public.scholarship_applications;
CREATE POLICY "scholarship_apps_select_policy" ON public.scholarship_applications
    FOR SELECT TO authenticated
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_admin()
        OR public.is_dean()
    );

DROP POLICY IF EXISTS "scholarship_apps_insert_policy" ON public.scholarship_applications;
CREATE POLICY "scholarship_apps_insert_policy" ON public.scholarship_applications
    FOR INSERT TO authenticated
    WITH CHECK (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "scholarship_apps_update_policy" ON public.scholarship_applications;
CREATE POLICY "scholarship_apps_update_policy" ON public.scholarship_applications
    FOR UPDATE TO authenticated
    USING (public.is_admin() OR public.is_dean())
    WITH CHECK (public.is_admin() OR public.is_dean());

DROP POLICY IF EXISTS "scholarship_docs_select_policy" ON public.scholarship_documents;
CREATE POLICY "scholarship_docs_select_policy" ON public.scholarship_documents
    FOR SELECT TO authenticated
    USING (
        application_id IN (
            SELECT id FROM public.scholarship_applications
            WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        )
        OR public.is_admin()
        OR public.is_dean()
    );

DROP POLICY IF EXISTS "scholarship_docs_insert_policy" ON public.scholarship_documents;
CREATE POLICY "scholarship_docs_insert_policy" ON public.scholarship_documents
    FOR INSERT TO authenticated
    WITH CHECK (
        application_id IN (
            SELECT id FROM public.scholarship_applications
            WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        )
        OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- SECTION 6: SEED PRODUCTION DATA FOR ROLE WORKFLOWS
-- ------------------------------------------------------------------------------
-- Seed Scholarship Schemes
INSERT INTO public.scholarship_schemes (id, name, provider, category, amount_per_annum, eligibility, min_cgpa, deadline, description, badge)
VALUES
('77000000-0000-0000-0000-000000000001', 'Chancellor Academic Excellence Merit Scholarship', 'University Board of Governors & Chancellor Endowment Fund', 'Merit-Based', 50000.00, 'Matriculated regular PG & UG scholars holding CGPA >= 8.50 with no backlogs in any semester.', 8.50, '2026-06-30', 'Premier institutional financial honor instituted to reward top-tier scholarly performers with direct fee subsidies and laptop/research bursaries.', 'Chancellor Seal'),
('77000000-0000-0000-0000-000000000002', 'National Post-Matric Higher Education Scholarship', 'Ministry of Education & Social Justice, Govt. of India', 'Need-Based', 35000.00, 'Annual gross parental family income below INR 4,50,000 per annum with verified income certificate.', NULL, '2026-07-15', 'Central sector scheme for meritorious university scholars from economically weaker backgrounds to cover living and academic expenses.', 'National Portal'),
('77000000-0000-0000-0000-000000000003', 'AICTE Pragati Scheme for Women Scholars', 'All India Council for Technical Education (AICTE)', 'Girls Empowerment', 50000.00, 'Exclusively for female scholars admitted into technical MCA, B.Tech, or M.Tech degree tracks.', NULL, '2026-08-30', 'Special initiative dedicated to empowering young women scholars pursuing technical excellence and software engineering leadership.', 'AICTE Direct'),
('77000000-0000-0000-0000-000000000004', 'University Full Tuition Fee Waiver (TFW) Scheme', 'University Statutory Welfare Council', 'Need-Based', 42000.00, 'Annual parental income under INR 2,50,000 with minimum 75% attendance record in current semester.', NULL, '2026-06-25', 'Statutory 100% tuition concession granted directly onto semester accounts by the Office of the Dean.', '100% Tuition')
ON CONFLICT (id) DO NOTHING;
