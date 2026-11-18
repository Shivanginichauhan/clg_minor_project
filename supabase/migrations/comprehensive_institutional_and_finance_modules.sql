-- ==============================================================================
-- UNIVERSITY EXAMINATION AND ACADEMIC MANAGEMENT SYSTEM (UEAMS)
-- MIGRATION: COMPREHENSIVE INSTITUTIONAL, FINANCE, ASSET & DUAL-GOVERNANCE TABLES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CAMPUSES (MULTI-TENANCY)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campuses (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    is_main BOOLEAN DEFAULT false,
    total_students INT DEFAULT 0,
    total_faculty INT DEFAULT 0,
    active_programs INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read campuses" ON public.campuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage campuses" ON public.campuses FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

-- ------------------------------------------------------------------------------
-- 2. ACADEMIC TERMS MASTER & UNIVERSITY EVENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_terms_master (
    id VARCHAR(50) PRIMARY KEY,
    term_name VARCHAR(150) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    instructional_days INT DEFAULT 90,
    exam_start_date DATE NOT NULL,
    exam_end_date DATE NOT NULL,
    admission_start DATE,
    admission_end DATE,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('UPCOMING', 'ACTIVE', 'CONCLUDED')),
    gazetted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.academic_terms_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read terms master" ON public.academic_terms_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage terms" ON public.academic_terms_master FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

CREATE TABLE IF NOT EXISTS public.university_events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('HOLIDAY', 'EXAM_WINDOW', 'ACADEMIC_EVENT', 'STATUTORY_MEETING')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    affects_instruction BOOLEAN DEFAULT true,
    public_circular_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.university_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read university events" ON public.university_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage events" ON public.university_events FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

-- ------------------------------------------------------------------------------
-- 3. FEE STRUCTURES, STUDENT FEE RECORDS, RECEIPTS & REFUNDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id VARCHAR(50) PRIMARY KEY,
    program_code VARCHAR(50) NOT NULL,
    program_name VARCHAR(150) NOT NULL,
    semester INT NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    tuition_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    lab_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    library_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    exam_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    development_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read fee structures" ON public.fee_structures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage fee structures" ON public.fee_structures FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

CREATE TABLE IF NOT EXISTS public.student_fee_records (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    program VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    total_billed NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
    scholarship_offset NUMERIC(10, 2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'DUE' CHECK (status IN ('PAID', 'PARTIAL', 'DUE', 'OVERDUE')),
    last_payment_date DATE,
    hall_ticket_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_fee_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own fee record" ON public.student_fee_records FOR SELECT TO authenticated USING (
    student_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);
CREATE POLICY "Admins manage student fee records" ON public.student_fee_records FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

CREATE TABLE IF NOT EXISTS public.fee_receipts (
    id VARCHAR(50) PRIMARY KEY,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    program VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL,
    heads JSONB DEFAULT '[]'::jsonb,
    date DATE NOT NULL,
    cashier VARCHAR(150) NOT NULL,
    status VARCHAR(30) DEFAULT 'VALID' CHECK (status IN ('VALID', 'CANCELLED')),
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fee_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own receipts" ON public.fee_receipts FOR SELECT TO authenticated USING (
    student_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);
CREATE POLICY "Admins manage receipts" ON public.fee_receipts FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

CREATE TABLE IF NOT EXISTS public.fee_refunds (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    reason TEXT NOT NULL,
    amount_requested NUMERIC(10, 2) NOT NULL,
    amount_approved NUMERIC(10, 2),
    status VARCHAR(40) DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'DISBURSED', 'REJECTED')),
    applied_date DATE NOT NULL,
    approver VARCHAR(150),
    approval_date DATE,
    bank_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fee_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read fee refunds" ON public.fee_refunds FOR SELECT TO authenticated USING (
    student_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);
CREATE POLICY "Admins manage refunds" ON public.fee_refunds FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

-- ------------------------------------------------------------------------------
-- 4. SYSTEM BACKUPS & BULK IMPORT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_backups (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('SCHEDULED', 'MANUAL_SNAPSHOT', 'PRE_IMPORT_BACKUP')),
    record_count INT NOT NULL DEFAULT 0,
    size_kb NUMERIC(10, 2) NOT NULL DEFAULT 0,
    file_name VARCHAR(255) NOT NULL,
    checksum VARCHAR(100) NOT NULL,
    created_by VARCHAR(150) NOT NULL,
    status VARCHAR(30) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'CORRUPTED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage backups" ON public.system_backups FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

CREATE TABLE IF NOT EXISTS public.bulk_import_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    total_records INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    imported_by VARCHAR(150) NOT NULL,
    can_rollback BOOLEAN DEFAULT true,
    is_rolled_back BOOLEAN DEFAULT false,
    rolled_back_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bulk_import_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage bulk imports" ON public.bulk_import_logs FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

-- ------------------------------------------------------------------------------
-- 5. CUSTOM ROLES & DISPATCH CAMPAIGNS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custom_roles (
    id VARCHAR(50) PRIMARY KEY,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(150) NOT NULL,
    description TEXT,
    department_scoped BOOLEAN DEFAULT false,
    scope_department VARCHAR(100),
    is_system_reserved BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '{}'::jsonb,
    assigned_users_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage custom roles" ON public.custom_roles FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

CREATE TABLE IF NOT EXISTS public.dispatch_campaigns (
    id VARCHAR(50) PRIMARY KEY,
    campaign_name VARCHAR(200) NOT NULL,
    channel VARCHAR(30) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'IN_PORTAL_ALERT', 'OMNICHANNEL')),
    target_audience VARCHAR(50) NOT NULL,
    target_program VARCHAR(100),
    subject VARCHAR(255) NOT NULL,
    body_template TEXT NOT NULL,
    total_recipients INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    bounced_count INT DEFAULT 0,
    scheduled_for TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    dispatched_by VARCHAR(150) NOT NULL,
    status VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'DISPATCHED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dispatch_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage dispatch campaigns" ON public.dispatch_campaigns FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

-- ------------------------------------------------------------------------------
-- 6. LIBRARY & LABORATORY ASSETS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.library_books (
    id VARCHAR(50) PRIMARY KEY,
    isbn VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    shelf_location VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read library books" ON public.library_books FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage library books" ON public.library_books FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

CREATE TABLE IF NOT EXISTS public.library_circulation (
    id VARCHAR(50) PRIMARY KEY,
    book_id VARCHAR(50) NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
    book_title VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) NOT NULL,
    borrower_type VARCHAR(20) NOT NULL CHECK (borrower_type IN ('STUDENT', 'FACULTY')),
    borrower_id VARCHAR(100) NOT NULL,
    borrower_name VARCHAR(150) NOT NULL,
    roll_or_emp_id VARCHAR(50) NOT NULL,
    issued_date DATE NOT NULL,
    due_date DATE NOT NULL,
    returned_date DATE,
    fine_amount NUMERIC(8, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'RETURNED', 'OVERDUE', 'LOST')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.library_circulation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own circulation" ON public.library_circulation FOR SELECT TO authenticated USING (
    borrower_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);
CREATE POLICY "Admins manage circulation" ON public.library_circulation FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

CREATE TABLE IF NOT EXISTS public.lab_assets (
    id VARCHAR(50) PRIMARY KEY,
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    lab_name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    purchase_date DATE NOT NULL,
    warranty_expiry DATE NOT NULL,
    last_maintenance DATE,
    status VARCHAR(30) DEFAULT 'OPERATIONAL' CHECK (status IN ('OPERATIONAL', 'UNDER_MAINTENANCE', 'DECOMMISSIONED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lab_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read lab assets" ON public.lab_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage lab assets" ON public.lab_assets FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

-- ------------------------------------------------------------------------------
-- 7. TWO-PERSON APPROVAL (MAKER-CHECKER) DESK
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.maker_checker_requests (
    id VARCHAR(50) PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_entity VARCHAR(150) NOT NULL,
    requested_by VARCHAR(150) NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    payload JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(40) DEFAULT 'PENDING_SECOND_APPROVAL' CHECK (status IN ('PENDING_SECOND_APPROVAL', 'AUTHORIZED', 'REJECTED')),
    authorized_by VARCHAR(150),
    authorized_at TIMESTAMPTZ,
    authorization_notes TEXT,
    security_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.maker_checker_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage maker checker" ON public.maker_checker_requests FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

-- ------------------------------------------------------------------------------
-- 8. PLACEMENT DRIVES & ALUMNI PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placement_drives (
    id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    role VARCHAR(150) NOT NULL,
    package_ctc_lpa NUMERIC(6, 2) NOT NULL,
    drive_date DATE NOT NULL,
    eligible_programs TEXT[] DEFAULT ARRAY['MCA', 'BTECH_CSE'],
    min_cgpa NUMERIC(4, 2) DEFAULT 6.5,
    total_registered INT DEFAULT 0,
    selected_count INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ONGOING', 'CONCLUDED')),
    recruiter_contact VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read placement drives" ON public.placement_drives FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage placement drives" ON public.placement_drives FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

CREATE TABLE IF NOT EXISTS public.alumni_profiles (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    graduation_year INT NOT NULL,
    program VARCHAR(100) NOT NULL,
    company VARCHAR(150) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    location VARCHAR(100) NOT NULL,
    linkedin_url TEXT,
    email VARCHAR(150) NOT NULL,
    mentorship_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read alumni profiles" ON public.alumni_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage alumni profiles" ON public.alumni_profiles FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

-- ------------------------------------------------------------------------------
-- 9. ACCREDITATION CRITERIA (NAAC / NBA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accreditation_criteria (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    weightage INT NOT NULL,
    score_attained NUMERIC(6, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'COMPLIANT' CHECK (status IN ('COMPLIANT', 'SUBMITTED', 'NEEDS_REVIEW', 'GAP_IDENTIFIED')),
    lead_evaluator VARCHAR(150) NOT NULL,
    key_indicators JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.accreditation_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read accreditation" ON public.accreditation_criteria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage accreditation" ON public.accreditation_criteria FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

-- ------------------------------------------------------------------------------
-- 10. MEDICAL CONDONATIONS (ATTENDANCE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medical_condonations (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    subject_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    medical_doc_url TEXT,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    missed_classes_count INT NOT NULL DEFAULT 1,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by VARCHAR(150),
    review_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medical_condonations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own condonations" ON public.medical_condonations FOR SELECT TO authenticated USING (
    student_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean', 'faculty'))
);
CREATE POLICY "Students create own condonations" ON public.medical_condonations FOR INSERT TO authenticated WITH CHECK (
    student_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);
CREATE POLICY "Admins & Deans review condonations" ON public.medical_condonations FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'dean'))
);

-- ==============================================================================
-- INITIAL SEED DATA FOR COMPREHENSIVE INSTITUTIONAL MODULES
-- ==============================================================================
INSERT INTO public.campuses (id, code, name, city, is_main, total_students, total_faculty, active_programs)
VALUES
    ('camp-main', 'MAIN', 'ITM University Main Campus', 'Gwalior', true, 4200, 310, 24),
    ('camp-south', 'SOUTH', 'ITM City Campus (South)', 'Gwalior', false, 1800, 140, 12),
    ('camp-tech', 'TECH', 'ITM Institute of Technology & Research', 'Gwalior', false, 1250, 95, 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.academic_terms_master (id, term_name, academic_year, start_date, end_date, instructional_days, exam_start_date, exam_end_date, status, gazetted)
VALUES
    ('term-even-2026', 'Even Semester 2025-26', '2025-2026', '2026-01-05', '2026-05-08', 92, '2026-05-18', '2026-06-10', 'ACTIVE', true),
    ('term-odd-2026', 'Odd Semester 2026-27', '2026-2027', '2026-07-20', '2026-11-20', 94, '2026-11-30', '2026-12-22', 'UPCOMING', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fee_structures (id, program_code, program_name, semester, academic_year, tuition_fee, lab_fee, library_fee, exam_fee, development_fee, total_fee, due_date)
VALUES
    ('fs-mca-sem2', 'MCA', 'Master of Computer Applications', 2, '2025-2026', 50000, 8500, 4500, 3000, 2500, 68500, '2026-05-15'),
    ('fs-btech-sem4', 'BTECH_CSE', 'B.Tech Computer Science & Engineering', 4, '2025-2026', 65000, 12000, 5000, 3500, 4500, 90000, '2026-05-15'),
    ('fs-mba-sem2', 'MBA', 'Master of Business Administration', 2, '2025-2026', 55000, 4000, 6000, 3000, 3000, 71000, '2026-05-20')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.library_books (id, isbn, title, author, category, total_copies, available_copies, shelf_location)
VALUES
    ('book-001', '978-0134685991', 'Effective Java (3rd Edition)', 'Joshua Bloch', 'Computer Science', 15, 9, 'Shelf CS-04-B'),
    ('book-002', '978-0262033848', 'Introduction to Algorithms (CLRS)', 'Cormen, Leiserson, Rivest, Stein', 'Computer Science', 25, 12, 'Shelf CS-01-A'),
    ('book-003', '978-0132350884', 'Clean Code', 'Robert C. Martin', 'Software Engineering', 18, 5, 'Shelf SE-02-C')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.placement_drives (id, company_name, role, package_ctc_lpa, drive_date, eligible_programs, min_cgpa, total_registered, selected_count, status, recruiter_contact)
VALUES
    ('drive-001', 'Amazon AWS India', 'Cloud Solutions Architect Trainee', 24.50, '2026-05-12', ARRAY['MCA', 'BTECH_CSE'], 7.50, 64, 8, 'UPCOMING', 'aws-campus-india@amazon.com'),
    ('drive-002', 'TCS Digital', 'Systems Software Engineer', 9.00, '2026-04-18', ARRAY['MCA', 'BTECH_CSE', 'MBA'], 6.50, 112, 28, 'CONCLUDED', 'campus.careers@tcs.com'),
    ('drive-003', 'Microsoft IDC', 'Software Development Engineer (SDE-1)', 32.00, '2026-05-25', ARRAY['MCA', 'BTECH_CSE'], 8.00, 48, 4, 'UPCOMING', 'msft-recruiting@microsoft.com')
ON CONFLICT (id) DO NOTHING;
