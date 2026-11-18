# Apex University - Examination & Academic Management System (UEAMS)

A comprehensive role-based examination lifecycle and academic management platform built for modern universities and higher education institutions.

---

## 📌 Project Overview

**University Examination & Academic Management System (UEAMS)** streamlines the complete university examination and academic workflow. The system eliminates manual paperwork and disjointed spreadsheets by centralizing course allocation, student attendance registers, invigilation duty rosters, exam timetable generation, hall tickets, continuous internal evaluations (CIE), semester results publishing, and administrative audits.

---

## 👥 Role-Based Modules & Key Features

### 🎓 1. Student Portal
* **Dashboard Overview:** Real-time summary of current semester GPA, overall attendance percentage, upcoming examinations, and latest notifications.
* **Course Enrollments:** View enrolled core and elective subjects along with credits and appointed faculty.
* **Attendance Register:** Subject-wise breakdown of lectures held, attended, and eligibility status (safe/shortage warning).
* **Examinations & Hall Ticket:** View finalized exam schedules, room numbers, seat allocations, and download digital hall tickets.
* **Results & Transcripts:** Detailed semester-by-semester grade cards, credit points, SGPA/CGPA calculations, and revaluation requests.
* **Notice Board:** Departmental and university-wide circulars and announcements.

### 👨‍🏫 2. Faculty Portal
* **Assigned Subjects:** Overview of teaching allotments, class cohorts, and syllabus progress.
* **Attendance Management:** Daily lecture attendance recording with bulk marking and percentage tracking.
* **Marks Entry & Assessment:** Secure entry portal for Internal Assessments (CIE), mid-term tests, practicals, and semester-end exam evaluations.
* **Invigilation Duties:** Detailed schedule of examination halls, timings, and reporting guidelines for invigilation duties.

### 🏛️ 3. Administrator Portal
* **Academic Structure Management:** Setup and maintain Departments, Academic Sessions, Degree Programs, and Subject Curriculums.
* **User & Account Directory:** Manage Student, Faculty, and Staff accounts, profile updates, and role assignments.
* **Exam Management:** Create examination sessions, define date sheets, timing slots, and candidate lists.
* **Seating Arrangement:** Automated room and seat layout allocation to prevent student malpractice.
* **Marks & Results Processing:** Centralized ledger to lock marks, compute grade curves, and manage revaluations.
* **System Audit Logs:** Immutable logs tracking all administrative actions, grading updates, and security events.

### 📜 4. Dean / Executive Portal
* **Exam Schedule Approvals:** Multi-level approval workflow for finalized examination timetables and duty charts.
* **Result Moderation & Release:** Review consolidated results, pass/fail percentages, and authorize official publication.
* **Academic Reports & Analytics:** University-wide analytics on department pass rates, student attendance trends, and faculty distribution.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, React Router v7
* **Styling & UI:** Tailwind CSS, Lucide React (Icons), Motion
* **Data Visualization:** Recharts (Analytics, Pass-rate charts, Attendance trends)
* **Backend & Auth:** Supabase (PostgreSQL, Row-Level Security, JWT Auth)
* **Build System:** Vite

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher recommended)
* npm or bun package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Ensure your `.env` file contains your Supabase credentials:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will start at: `http://localhost:3000`

4. **Production Build:**
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```
├── src/
│   ├── components/       # Reusable UI components (Sidebar, Navbar, Modals, Layout)
│   ├── contexts/         # Authentication & State Management (AuthContext)
│   ├── data/             # Academic data models and fallbacks
│   ├── lib/              # Client libraries & Supabase configuration
│   ├── pages/
│   │   ├── admin/        # Administrative control pages
│   │   ├── auth/         # Login, Signup, Password recovery
│   │   ├── dashboard/    # Dedicated dashboards per role
│   │   ├── dean/         # Dean review, approval, and report views
│   │   ├── faculty/      # Faculty duties, grading, attendance
│   │   └── student/      # Student grades, hall tickets, schedule
│   ├── services/         # API & Database Service Layer
│   ├── types/            # TypeScript schemas & Database types
│   ├── App.tsx           # Role-based Routing and guards
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styling & Tailwind directives
├── index.html            # HTML document entry
├── vite.config.ts        # Vite configuration
└── package.json          # Project dependencies & scripts
```

---

## 📄 License
This project is developed for Academic Examination & Management purposes. All rights reserved.
