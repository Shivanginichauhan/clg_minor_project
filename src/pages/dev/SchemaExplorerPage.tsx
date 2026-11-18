import React, { useState, useEffect } from 'react';
import {
  Database,
  Shield,
  KeyRound,
  FileCode2,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronRight,
  Server,
  ArrowLeft
} from 'lucide-react';
import { testSupabaseConnection, ConnectionTestResult } from '../../lib/supabase.js';
import { schemaTables } from '../../data/schemaData.js';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';

export const SchemaExplorerPage: React.FC = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'setup' | 'sql' | 'schema' | 'roadmap'>('setup');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionTestResult | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTable, setExpandedTable] = useState<string | null>('profiles');

  const fullSqlMigration = `-- ==============================================================================
-- UNIVERSITY EXAMINATION AND ACADEMIC MANAGEMENT SYSTEM (UEAMS)
-- INITIAL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) MIGRATION
-- MCA Minor Project - PostgreSQL / Supabase
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

-- 5. PROGRAMS TABLE
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

-- 6. ACADEMIC SESSIONS TABLE
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

-- 11. ENROLLMENTS TABLE
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
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    description TEXT NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS & Policies
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

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin() OR public.is_dean() OR public.is_faculty());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());
`;

  const runConnectionCheck = async () => {
    setIsTestingConnection(true);
    const result = await testSupabaseConnection();
    setConnectionStatus(result);
    setIsTestingConnection(false);
  };

  useEffect(() => {
    runConnectionCheck();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(fullSqlMigration);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const filteredTables = schemaTables.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  const categories = [
    { id: 'all', label: 'All Tables (21)' },
    { id: 'core', label: 'Core & Users (3)' },
    { id: 'academic', label: 'Academic Hierarchy (6)' },
    { id: 'exam', label: 'Exam Lifecycle (6)' },
    { id: 'results', label: 'Marks & Results (3)' },
    { id: 'system', label: 'Notices & Audit (2)' },
  ];

  const phases = [
    { num: 1, title: 'Supabase Setup & Schema Foundation', desc: 'Normalized PostgreSQL schema, RLS policies, trigger handlers & types', status: 'COMPLETED' },
    { num: 2, title: 'Supabase Authentication & Session State', desc: 'Secure login, profile auto-sync, RBAC guard & route protections', status: 'COMPLETED' },
    { num: 3, title: 'Student & Faculty Management', desc: 'Student admissions, enrollment codes, faculty appointments & rosters', status: 'COMPLETED' },
    { num: 4, title: 'Department, Program & Subject Structure', desc: 'Academic session calendar, syllabus credits, semesters & offerings', status: 'COMPLETED' },
    { num: 5, title: 'Enrollment & Daily Attendance', desc: 'Semester registrations, faculty attendance registers & student tracking', status: 'COMPLETED' },
    { num: 6, title: 'Examination & Dean Schedule Approval', desc: 'Exam cycle setup, timetable generation & Dean review workflow', status: 'COMPLETED' },
    { num: 7, title: 'Rooms, Seating & Faculty Duties', desc: 'Hall allocation, desk distribution & invigilation duty roster', status: 'COMPLETED' },
    { num: 8, title: 'Faculty Marks Entry & Admin Verification', desc: 'Continuous assessments, practical scores & administrative signoff', status: 'COMPLETED' },
    { num: 9, title: 'Results Processing, Dean Signoff & Publishing', desc: 'SGPA/CGPA calculations, Dean authorization & student transcript release', status: 'COMPLETED' },
    { num: 10, title: 'Circular Notices, Reports & Audit Trails', desc: 'Targeted broadcast notices, PDF-ready analytics & security audit logs', status: 'COMPLETED' },
    { num: 11, title: 'Comprehensive Role Dashboards', desc: 'Full interactive portals for Student, Faculty, Administrator & Dean', status: 'COMPLETED' },
    { num: 12, title: 'Security Hardening & QA Testing', desc: 'Zod schemas, RLS policy boundary validation & workflow tests', status: 'COMPLETED' },
    { num: 13, title: 'Demo Seed Data & Workflow Simulation', desc: 'Realistic university dataset for end-to-end academic demonstration', status: 'COMPLETED' },
    { num: 14, title: 'MCA Documentation & Defense Guide', desc: 'ER diagrams, DFDs, use cases, project report & presentation notes', status: 'COMPLETED' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to={role ? `/${role}/dashboard` : '/login'}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Database Schema &amp; Developer Hub
            </h1>
            <p className="text-xs text-slate-400">
              Complete reference for 21 PostgreSQL tables, Supabase RLS security, and the 14-phase roadmap.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runConnectionCheck}
            disabled={isTestingConnection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
            <span>Check Supabase Connection</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'setup'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Setup &amp; Diagnostics</span>
        </button>
        
        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'sql'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>PostgreSQL Script</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'schema'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Schema Dictionary (21 Tables)</span>
        </button>

        <button
          onClick={() => setActiveTab('roadmap')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'roadmap'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>14-Phase Project Roadmap</span>
        </button>
      </div>

      {/* Tab 1: Setup */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Relational Engine</span>
              <div className="text-base font-bold text-white">PostgreSQL via Supabase</div>
              <p className="text-xs text-slate-400">Strict FKs, CHECK constraints, triggers</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Authentication</span>
              <div className="text-base font-bold text-indigo-400">Phase 2 Completed</div>
              <p className="text-xs text-slate-400">RBAC session context, guards &amp; 4 role portals</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Next Step</span>
              <div className="text-base font-bold text-emerald-400">Phase 3 Ready</div>
              <p className="text-xs text-slate-400">Student &amp; Faculty Management modules</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Connection Diagnostics</span>
            </div>
            <p className="text-xs text-slate-300">
              {connectionStatus?.message || 'Testing Supabase connection...'}
            </p>
            {connectionStatus?.url && (
              <p className="text-xs font-mono text-slate-400">Endpoint: {connectionStatus.url}</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: SQL Script */}
      {activeTab === 'sql' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Full SQL Migration Script</h3>
            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied!' : 'Copy Script'}</span>
            </button>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto font-mono text-xs text-indigo-200/90 leading-relaxed">
            <pre>{fullSqlMigration}</pre>
          </div>
        </div>
      )}

      {/* Tab 3: Schema Dictionary */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredTables.map((table) => {
              const isExpanded = expandedTable === table.name;
              return (
                <div key={table.name} className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden">
                  <button
                    onClick={() => setExpandedTable(isExpanded ? null : table.name)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                      <span className="font-mono font-bold text-xs text-indigo-300">public.{table.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded uppercase font-semibold bg-slate-800 text-slate-400">{table.category}</span>
                    </div>
                    <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-md">{table.description}</span>
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
                      <p className="text-xs text-slate-300">{table.description}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-mono">
                              <th className="py-2 pr-4">Column</th>
                              <th className="py-2 pr-4">Type</th>
                              <th className="py-2 pr-4">Constraints</th>
                              <th className="py-2">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50 font-mono">
                            {table.columns.map((col) => (
                              <tr key={col.name} className="text-slate-300">
                                <td className="py-2 pr-4 font-bold text-white">{col.name}</td>
                                <td className="py-2 pr-4 text-indigo-300">{col.type}</td>
                                <td className="py-2 pr-4 text-amber-300/90 text-[11px]">{col.constraint || '-'}</td>
                                <td className="py-2 text-slate-400 font-sans text-xs">{col.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Project Lifecycle Roadmap (14 Phases)</h3>
          <div className="space-y-2.5">
            {phases.map((p) => (
              <div key={p.num} className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xs font-bold font-mono">
                    {p.num}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{p.title}</h4>
                    <p className="text-[11px] text-slate-400">{p.desc}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  p.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : p.status === 'READY'
                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
