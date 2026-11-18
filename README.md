<div align="center">

# 🏛️ UEAMS &bull; University Examination & Academic Management System
### *Unified Digital Backbone for Statutory University Examination Governance*

[![Live Demo](https://img.shields.io/badge/LIVE%20DEMO-sivangni--ueams.vercel.app-1E5AA8?style=for-the-badge&logo=vercel&logoColor=white)](https://sivangni-ueams.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GITHUB-Shivanginichauhan%2Fclg__minor__project-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Shivanginichauhan/clg_minor_project)
[![Built with GSAP](https://img.shields.io/badge/ANIMATED%20WITH-GSAP%203-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://gsap.com)

<p align="center">
  <img src="https://img.shields.io/badge/React%2019-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript%205-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS%203-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/NAAC-A%2B%2B%20Accredited-F59E0B?style=flat-square" alt="NAAC A++" />
  <img src="https://img.shields.io/badge/UGC-CBCS%2010--Point%20Scale-1E5AA8?style=flat-square" alt="UGC Scale" />
</p>

<p align="center">
  <b>Eliminating disjointed spreadsheets and paperwork through automated 75% attendance safeguarding, heuristic anti-malpractice seating layouts, QR-signed admit cards, Continuous Internal Evaluation (CIE) locking, and Dean-authorized gazette publication.</b>
</p>

---

[🌐 Explore Live Application](https://sivangni-ueams.vercel.app) &bull;
[✨ Key Innovations](#-key-innovations) &bull;
[👥 Stakeholder Portals](#-role-based-portals) &bull;
[🔄 Examination Lifecycle](#-5-stage-examination-lifecycle) &bull;
[🔑 Demo Credentials](#-instant-demo-credentials) &bull;
[🚀 Quickstart](#-getting-started)

---

</div>

<br />

## 🌟 Key Innovations

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✨ Precision Examination Governance • Designed for High-Integrity Academics │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **⚡ GSAP 3 & ScrollTrigger Animations**: Fluid 60fps choreographed entrance sequences, scroll-driven stats tally, sinusoidal floating credentials, and zero-flicker role tab transitions engineered via `@gsap/react`.
- **🛡️ 75% Attendance Threshold Engine**: Automated continuous auditing of classroom lecture registers with proactive condonation alerts (65–75%) and automatic admit card withhold triggers (<65%).
- **🪑 Anti-Malpractice Seating Algorithm**: Heuristic classroom layout allocator ensuring adjacent students never belong to the same cohort or receive the same question paper variant.
- **🎫 Cryptographic Digital Hall Tickets**: One-click generation of Dean-signed admit cards featuring dynamically encoded verification tokens and QR authenticity validation.
- **🔒 Tamper-Proof Marks Ledger**: Multi-tiered Continuous Internal Evaluation (CIE) & End-Semester score entry system with timestamped freeze deadlines and immutable Supabase audit logging.
- **📜 Dean Gazette & Transcript Engine**: Statutory moderation curves, SGPA/CGPA normalization under the UGC-CBCS 10-point scale, and authorized e-tabulation registry publishing.

---

## 👥 Role-Based Portals

The application implements granular **Row-Level Security (RLS)** in Supabase to provide bespoke digital workspaces tailored for each university stakeholder:

| Portal | Primary Beneficiaries | Core Capabilities & Workflows |
|:---|:---|:---|
| 🎓 **Student Portal** | Students, Candidates, Alumni | Attendance register tracker, syllabus milestones, digital admit card download, SGPA/CGPA grade sheets, fee clearance verification, and online revaluation filing. |
| 👨‍🏫 **Faculty Portal** | Professors, Lecturers, Evaluators | One-click daily lecture attendance marking, CIE internal marks lockable sheets, syllabus milestone registers, invigilation duty schedules, and CO-PO attainment evidence. |
| 🏛️ **Controller & Admin** | Examination Cell, Registrars | Academic structure configuration (Departments, Curriculums, Sessions), anti-cheating room layout generator, datesheet builder, fee structures, and audit trail analysis. |
| 📜 **Dean & Executive** | Deans, Vice-Chancellor, Academic Council | Statutory datesheet sign-offs, grade curve moderation, institution-wide pass/fail performance analytics, and official university gazette cryptographic sealing. |

---

## 🔄 5-Stage Examination Lifecycle

```mermaid
flowchart LR
    A["01. Course & Attendance\n75% Threshold Auditing"] --> B["02. Seating Algorithm\nAnti-Copy Desking Heuristics"]
    B --> C["03. QR Hall Tickets\nCryptographically Signed"]
    C --> D["04. CIE & Marks Entry\nImmutable Dual-Lock Ledger"]
    D --> E["05. Dean Gazette\nUGC 10-Pt SGPA/CGPA Release"]

    style A fill:#1E5AA8,stroke:#0F2747,stroke-width:2px,color:#fff
    style B fill:#3B82F6,stroke:#1D4ED8,stroke-width:2px,color:#fff
    style C fill:#6366F1,stroke:#4338CA,stroke-width:2px,color:#fff
    style D fill:#8B5CF6,stroke:#6D28D9,stroke-width:2px,color:#fff
    style E fill:#10B981,stroke:#047857,stroke-width:2px,color:#fff
```

---

## 🔑 Instant Demo Credentials

Try any persona instantly with one click on the [Sign In Page](https://sivangni-ueams.vercel.app/login) using the built-in quick fill buttons, or enter the credentials below:

```
Common Password for all demo accounts: Password123!
```

| Persona | Role | Email | Access Scope |
|:---|:---|:---|:---|
| 🎓 **Student** | `student` | `student@university.edu` | View Hall Ticket, SGPA/CGPA, 89.4% Attendance |
| 👨‍🏫 **Faculty** | `faculty` | `faculty@university.edu` | Grade Book, Lecture Attendance, Invigilation Roster |
| 🛡️ **Administrator** | `administrator` | `admin@university.edu` | Seating Allocations, Curriculums, Timetables, Audits |
| 👑 **Dean** | `dean` | `dean@university.edu` | Gazette Sign-Off, Normalization, Analytics |

---

## 🛠️ Tech Architecture

<div align="center">

| Layer | Technologies |
|:---|:---|
| **Core Framework** | **React 19**, TypeScript 5, Vite 6 |
| **Animation Engine** | **GreenSock (GSAP 3)**, `@gsap/react`, ScrollTrigger, Custom Eases |
| **Styling & Design** | **Tailwind CSS 3**, CSS Variables, Dark/Light Theming, Lucide Icons |
| **Data & Routing** | **React Router v7**, Recharts (Data Visualizations) |
| **Backend & Database** | **Supabase** (PostgreSQL 15, Row-Level Security, JWT Auth, Triggers) |
| **Deployment** | **Vercel** with custom SPA rewrites (`vercel.json`) & GitHub Actions |

</div>

---

## 🚀 Getting Started

Follow these steps to run the complete environment locally:

### 1. Clone the Repository
```bash
git clone https://github.com/Shivanginichauhan/clg_minor_project.git
cd clg_minor_project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the project root (reference [`.env.example`](.env.example)):
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

### 4. Launch Development Server
```bash
npm run dev
```
Open your browser and navigate to: **`http://localhost:3000`**

### 5. Production Compilation
```bash
npm run build
npm run preview
```

---

## 📂 Project Architecture

```
clg_minor_project/
├── public/                 # Static assets and favicon
├── src/
│   ├── components/         # Modular reusable components
│   │   ├── admin/          # Course allocation, department & faculty modals
│   │   ├── auth/           # Protected routes, profile & password modals
│   │   ├── common/         # Sticky navigation, footer, university crest, theme toggle
│   │   └── layout/         # Dynamic role-based dashboard shell
│   ├── contexts/           # Authentication and Theme global context providers
│   ├── data/               # Mock data fallbacks for exams, attendance, notices
│   ├── lib/                # Supabase client instantiation
│   ├── pages/
│   │   ├── admin/          # Seating layouts, marks lock, audit trail, reports
│   │   ├── auth/           # Login, Signup, Forgot/Reset password, Verification
│   │   ├── common/         # Animated landing page (HomePage) with GSAP
│   │   ├── dashboard/      # Role-specific analytics landing pages
│   │   ├── dean/           # Gazette release, timetable approvals, grievances
│   │   ├── faculty/        # Daily attendance registers, CIE marks, invigilation
│   │   └── student/        # Hall ticket viewer, semester transcript, fees
│   ├── services/           # Supabase DB operations with robust offline fallback
│   ├── types/              # Database models, schemas, and enum definitions
│   ├── App.tsx             # Master route table with RBAC guards
│   ├── main.tsx            # Application bootstrapping
│   └── index.css           # Tailwind base styles, custom scrollbars, orbs
├── supabase/               # SQL schema migrations, RLS hardening, mock seeds
├── vercel.json             # Vercel SPA client-side rewrite rules
└── package.json            # Scripts and project dependencies
```

---

## 👩‍💻 Author & Maintainer

<div align="center">

### **Shivangi Chauhan**
[![GitHub](https://img.shields.io/badge/GitHub-Shivanginichauhan-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Shivanginichauhan)
[![Repository](https://img.shields.io/badge/Repository-clg__minor__project-1E5AA8?style=for-the-badge&logo=git&logoColor=white)](https://github.com/Shivanginichauhan/clg_minor_project)

*Crafted with precision for University Examination & Academic Governance.*

---

<p align="center">
  ⭐ If you find this project valuable, please consider giving it a star on GitHub! ⭐
</p>

</div>
