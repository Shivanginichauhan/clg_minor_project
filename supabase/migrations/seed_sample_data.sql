-- ==============================================================================
-- UNIVERSITY EXAMINATION AND ACADEMIC MANAGEMENT SYSTEM (UEAMS)
-- SAMPLE REFERENCE SEED DATA (ACADEMIC STRUCTURE, SUBJECTS & ROOMS)
-- ==============================================================================

-- 1. SEED DEPARTMENTS
INSERT INTO public.departments (id, code, name, description) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'CSE', 'Department of Computer Science & Engineering', 'Postgraduate & Undergraduate computing disciplines, AI, and Software Systems'),
    ('a0000000-0000-0000-0000-000000000002', 'IT', 'Department of Information Technology', 'Cloud Architecture, Cybersecurity, and Distributed Enterprise Systems'),
    ('a0000000-0000-0000-0000-000000000003', 'ECE', 'Department of Electronics & Communication', 'Embedded Systems, VLSI Design, and Signal Processing')
ON CONFLICT (code) DO NOTHING;

-- 2. SEED ACADEMIC SESSIONS
INSERT INTO public.academic_sessions (id, name, start_date, end_date, is_current) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Academic Year 2025 - 2026', '2025-07-01', '2026-06-30', TRUE),
    ('b0000000-0000-0000-0000-000000000002', 'Academic Year 2024 - 2025', '2024-07-01', '2025-06-30', FALSE)
ON CONFLICT (name) DO NOTHING;

-- 3. SEED PROGRAMS
INSERT INTO public.programs (id, department_id, code, name, degree_level, total_semesters) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'MCA', 'Master of Computer Applications', 'postgraduate', 4),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'BTECH-CSE', 'Bachelor of Technology (CSE)', 'undergraduate', 8),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'MTECH-DS', 'Master of Technology (Data Science)', 'postgraduate', 4)
ON CONFLICT (code) DO NOTHING;

-- 4. SEED SEMESTERS (For MCA)
INSERT INTO public.semesters (id, program_id, session_id, semester_number, term_type, start_date, end_date, is_active) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 1, 'odd', '2025-07-15', '2025-12-20', FALSE),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 2, 'even', '2026-01-10', '2026-06-15', TRUE),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 3, 'odd', '2025-07-15', '2025-12-20', FALSE),
    ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 4, 'even', '2026-01-10', '2026-06-15', TRUE)
ON CONFLICT (program_id, session_id, semester_number) DO NOTHING;

-- 5. SEED SUBJECTS (For MCA Semester 1 & 2)
INSERT INTO public.subjects (id, department_id, program_id, code, name, credits, semester_number, type, max_internal_marks, max_external_marks, pass_percentage) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'MCA-101', 'Advanced Data Structures & Algorithms', 4.0, 1, 'theory', 40.00, 60.00, 40.00),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'MCA-102', 'Relational Database Management Systems', 4.0, 1, 'theory', 40.00, 60.00, 40.00),
    ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'MCA-103', 'Object Oriented Software Engineering', 3.0, 1, 'theory', 40.00, 60.00, 40.00),
    ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'MCA-201', 'Cloud Computing & Distributed Systems', 4.0, 2, 'theory', 40.00, 60.00, 40.00),
    ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'MCA-202', 'Full Stack Web Architecture', 4.0, 2, 'theory', 40.00, 60.00, 40.00),
    ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'MCA-203', 'Machine Learning Foundations', 3.0, 2, 'theory', 40.00, 60.00, 40.00)
ON CONFLICT (code) DO NOTHING;

-- 6. SEED EXAMINATION ROOMS
INSERT INTO public.rooms (id, room_number, building, floor, capacity, is_available) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'LH-101', 'APJ Abdul Kalam Academic Block', 1, 60, TRUE),
    ('f0000000-0000-0000-0000-000000000002', 'LH-102', 'APJ Abdul Kalam Academic Block', 1, 60, TRUE),
    ('f0000000-0000-0000-0000-000000000003', 'AUD-01', 'Central Administrative & Exam Complex', 2, 120, TRUE),
    ('f0000000-0000-0000-0000-000000000004', 'LAB-301', 'Computing Center Building', 3, 40, TRUE)
ON CONFLICT (room_number) DO NOTHING;
