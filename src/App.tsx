import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';
import { DashboardLayout } from './components/layout/DashboardLayout.js';
import { HomePage } from './pages/common/HomePage.js';


// ── Lazy-loaded page bundles (split by route) ──────────────────────────────
// Auth
const LoginPage              = lazy(() => import('./pages/auth/LoginPage.js').then(m => ({ default: m.LoginPage })));
const SignupPage             = lazy(() => import('./pages/auth/SignupPage.js').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage     = lazy(() => import('./pages/auth/ForgotPasswordPage.js').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage      = lazy(() => import('./pages/auth/ResetPasswordPage.js').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage        = lazy(() => import('./pages/auth/VerifyEmailPage.js').then(m => ({ default: m.VerifyEmailPage })));
const UnauthorizedPage       = lazy(() => import('./pages/auth/UnauthorizedPage.js').then(m => ({ default: m.UnauthorizedPage })));
const NotFoundPage           = lazy(() => import('./pages/common/NotFoundPage.js').then(m => ({ default: m.NotFoundPage })));
const DocumentVerificationPage = lazy(() => import('./pages/public/DocumentVerificationPage.js').then(m => ({ default: m.DocumentVerificationPage })));

// Dashboards
const StudentDashboard       = lazy(() => import('./pages/dashboard/StudentDashboard.js').then(m => ({ default: m.StudentDashboard })));
const FacultyDashboard       = lazy(() => import('./pages/dashboard/FacultyDashboard.js').then(m => ({ default: m.FacultyDashboard })));
const AdminDashboard         = lazy(() => import('./pages/dashboard/AdminDashboard.js').then(m => ({ default: m.AdminDashboard })));
const DeanDashboard          = lazy(() => import('./pages/dashboard/DeanDashboard.js').then(m => ({ default: m.DeanDashboard })));

// Common
const ProfileSettingsPage    = lazy(() => import('./pages/common/ProfileSettingsPage.js').then(m => ({ default: m.ProfileSettingsPage })));

// Dev
const SchemaExplorerPage     = lazy(() => import('./pages/dev/SchemaExplorerPage.js').then(m => ({ default: m.SchemaExplorerPage })));

// Student Portal
const CourseEnrollmentsPage  = lazy(() => import('./pages/student/CourseEnrollmentsPage.js').then(m => ({ default: m.CourseEnrollmentsPage })));
const StudentAttendancePage  = lazy(() => import('./pages/student/StudentAttendancePage.js').then(m => ({ default: m.StudentAttendancePage })));
const StudentExaminationsPage= lazy(() => import('./pages/student/StudentExaminationsPage.js').then(m => ({ default: m.StudentExaminationsPage })));
const StudentResultsPage     = lazy(() => import('./pages/student/StudentResultsPage.js').then(m => ({ default: m.StudentResultsPage })));
const NoticeBoardPage        = lazy(() => import('./pages/student/NoticeBoardPage.js').then(m => ({ default: m.NoticeBoardPage })));
const StudentTimetablePage   = lazy(() => import('./pages/student/StudentTimetablePage.js').then(m => ({ default: m.StudentTimetablePage })));
const ExamApplicationPage    = lazy(() => import('./pages/student/ExamApplicationPage.js').then(m => ({ default: m.ExamApplicationPage })));
const ScholarshipPage        = lazy(() => import('./pages/student/ScholarshipPage.js').then(m => ({ default: m.ScholarshipPage })));
const AssignmentsPage        = lazy(() => import('./pages/student/AssignmentsPage.js').then(m => ({ default: m.AssignmentsPage })));
const DegreeProgressPage     = lazy(() => import('./pages/student/DegreeProgressPage.js').then(m => ({ default: m.DegreeProgressPage })));
const DocumentsVaultPage     = lazy(() => import('./pages/student/DocumentsVaultPage.js').then(m => ({ default: m.DocumentsVaultPage })));
const StudentFeesPage        = lazy(() => import('./pages/student/StudentFeesPage.js').then(m => ({ default: m.StudentFeesPage })));
const GrievancePage          = lazy(() => import('./pages/student/GrievancePage.js').then(m => ({ default: m.GrievancePage })));
const NotificationsPage      = lazy(() => import('./pages/student/NotificationsPage.js').then(m => ({ default: m.NotificationsPage })));
const PerformanceAnalyticsPage = lazy(() => import('./pages/student/PerformanceAnalyticsPage.js').then(m => ({ default: m.PerformanceAnalyticsPage })));
const CourseMaterialsPage    = lazy(() => import('./pages/student/CourseMaterialsPage.js').then(m => ({ default: m.CourseMaterialsPage })));
const MyRequestsPage         = lazy(() => import('./pages/student/MyRequestsPage.js').then(m => ({ default: m.MyRequestsPage })));

// Faculty Portal
const AssignedSubjectsPage   = lazy(() => import('./pages/faculty/AssignedSubjectsPage.js').then(m => ({ default: m.AssignedSubjectsPage })));
const AttendanceRegisterPage = lazy(() => import('./pages/faculty/AttendanceRegisterPage.js').then(m => ({ default: m.AttendanceRegisterPage })));
const InvigilationDutiesPage = lazy(() => import('./pages/faculty/InvigilationDutiesPage.js').then(m => ({ default: m.InvigilationDutiesPage })));
const MarksEntryPage         = lazy(() => import('./pages/faculty/MarksEntryPage.js').then(m => ({ default: m.MarksEntryPage })));
const FacultyTimetablePage   = lazy(() => import('./pages/faculty/FacultyTimetablePage.js').then(m => ({ default: m.FacultyTimetablePage })));
const ClassMentorshipPage    = lazy(() => import('./pages/faculty/ClassMentorshipPage.js').then(m => ({ default: m.ClassMentorshipPage })));
const FacultyLeavePage       = lazy(() => import('./pages/faculty/FacultyLeavePage.js').then(m => ({ default: m.FacultyLeavePage })));
const FacultyMaterialsPage   = lazy(() => import('./pages/faculty/FacultyMaterialsPage.js').then(m => ({ default: m.FacultyMaterialsPage })));
const FacultyAssignmentsPage = lazy(() => import('./pages/faculty/FacultyAssignmentsPage.js').then(m => ({ default: m.FacultyAssignmentsPage })));
const LessonPlanPage         = lazy(() => import('./pages/faculty/LessonPlanPage.js').then(m => ({ default: m.LessonPlanPage })));
const COAttainmentPage       = lazy(() => import('./pages/faculty/COAttainmentPage.js').then(m => ({ default: m.COAttainmentPage })));
const WorkloadPage           = lazy(() => import('./pages/faculty/WorkloadPage.js').then(m => ({ default: m.WorkloadPage })));
const FacultyAnnouncementsPage = lazy(() => import('./pages/faculty/FacultyAnnouncementsPage.js').then(m => ({ default: m.FacultyAnnouncementsPage })));
const QuestionPaperBuilderPage = lazy(() => import('./pages/faculty/QuestionPaperBuilderPage.js').then(m => ({ default: m.QuestionPaperBuilderPage })));
const ResearchProfilePage    = lazy(() => import('./pages/faculty/ResearchProfilePage.js').then(m => ({ default: m.ResearchProfilePage })));
const AccreditationEvidencePage = lazy(() => import('./pages/faculty/AccreditationEvidencePage.js').then(m => ({ default: m.AccreditationEvidencePage })));

// Admin Portal
const UserManagementPage     = lazy(() => import('./pages/admin/UserManagementPage.js').then(m => ({ default: m.UserManagementPage })));
const AccountManagementPage  = lazy(() => import('./pages/admin/AccountManagementPage.js').then(m => ({ default: m.AccountManagementPage })));
const AcademicStructurePage  = lazy(() => import('./pages/admin/AcademicStructurePage.js').then(m => ({ default: m.AcademicStructurePage })));
const AttendanceManagementPage = lazy(() => import('./pages/admin/AttendanceManagementPage.js').then(m => ({ default: m.AttendanceManagementPage })));
const ExamManagementPage     = lazy(() => import('./pages/admin/ExamManagementPage.js').then(m => ({ default: m.ExamManagementPage })));
const SeatingManagementPage  = lazy(() => import('./pages/admin/SeatingManagementPage.js').then(m => ({ default: m.SeatingManagementPage })));
const MarksManagementPage    = lazy(() => import('./pages/admin/MarksManagementPage.js').then(m => ({ default: m.MarksManagementPage })));
const ResultsManagementPage  = lazy(() => import('./pages/admin/ResultsManagementPage.js').then(m => ({ default: m.ResultsManagementPage })));
const RevaluationManagementPage = lazy(() => import('./pages/admin/RevaluationManagementPage.js').then(m => ({ default: m.RevaluationManagementPage })));
const NoticeManagementPage   = lazy(() => import('./pages/admin/NoticeManagementPage.js').then(m => ({ default: m.NoticeManagementPage })));
const AuditLogViewerPage     = lazy(() => import('./pages/admin/AuditLogViewerPage.js').then(m => ({ default: m.AuditLogViewerPage })));
const BulkDataImportPage     = lazy(() => import('./pages/admin/BulkDataImportPage.js').then(m => ({ default: m.BulkDataImportPage })));
const FeeManagementPage      = lazy(() => import('./pages/admin/FeeManagementPage.js').then(m => ({ default: m.FeeManagementPage })));
const AdminCalendarManagementPage = lazy(() => import('./pages/admin/AdminCalendarManagementPage.js').then(m => ({ default: m.AdminCalendarManagementPage })));
const AdminGrievanceManagementPage = lazy(() => import('./pages/admin/AdminGrievanceManagementPage.js').then(m => ({ default: m.AdminGrievanceManagementPage })));
const BackupRestorePage      = lazy(() => import('./pages/admin/BackupRestorePage.js').then(m => ({ default: m.BackupRestorePage })));
const ReportBuilderPage      = lazy(() => import('./pages/admin/ReportBuilderPage.js').then(m => ({ default: m.ReportBuilderPage })));
const LibraryAssetPage       = lazy(() => import('./pages/admin/LibraryAssetPage.js').then(m => ({ default: m.LibraryAssetPage })));
const RolePermissionPage     = lazy(() => import('./pages/admin/RolePermissionPage.js').then(m => ({ default: m.RolePermissionPage })));
const CommunicationDispatcherPage = lazy(() => import('./pages/admin/CommunicationDispatcherPage.js').then(m => ({ default: m.CommunicationDispatcherPage })));
const DualApprovalPage        = lazy(() => import('./pages/admin/DualApprovalPage.js').then(m => ({ default: m.DualApprovalPage })));
const PlacementAlumniPage     = lazy(() => import('./pages/admin/PlacementAlumniPage.js').then(m => ({ default: m.PlacementAlumniPage })));

// Dean Portal
const ExamApprovalPage       = lazy(() => import('./pages/dean/ExamApprovalPage.js').then(m => ({ default: m.ExamApprovalPage })));
const ResultsApprovalPage    = lazy(() => import('./pages/dean/ResultsApprovalPage.js').then(m => ({ default: m.ResultsApprovalPage })));
const AcademicReportsPage    = lazy(() => import('./pages/dean/AcademicReportsPage.js').then(m => ({ default: m.AcademicReportsPage })));
const DeanScholarshipPage    = lazy(() => import('./pages/dean/DeanScholarshipPage.js').then(m => ({ default: m.DeanScholarshipPage })));
const DeanTimetablePage      = lazy(() => import('./pages/dean/DeanTimetablePage.js').then(m => ({ default: m.DeanTimetablePage })));
const DeanFacultyLeavePage   = lazy(() => import('./pages/dean/DeanFacultyLeavePage.js').then(m => ({ default: m.DeanFacultyLeavePage })));
const DeanGrievancePage      = lazy(() => import('./pages/dean/DeanGrievancePage.js').then(m => ({ default: m.DeanGrievancePage })));
const CurriculumApprovalPage = lazy(() => import('./pages/dean/CurriculumApprovalPage.js').then(m => ({ default: m.CurriculumApprovalPage })));
const AccreditationCompliancePage = lazy(() => import('./pages/dean/AccreditationCompliancePage.js').then(m => ({ default: m.AccreditationCompliancePage })));
const DeanBudgetPage         = lazy(() => import('./pages/dean/DeanBudgetPage.js').then(m => ({ default: m.DeanBudgetPage })));
const DeanResearchOversightPage = lazy(() => import('./pages/dean/DeanResearchOversightPage.js').then(m => ({ default: m.DeanResearchOversightPage })));
const AcademicCalendarPage   = lazy(() => import('./pages/dean/AcademicCalendarPage.js').then(m => ({ default: m.AcademicCalendarPage })));
const PlacementOversightPage = lazy(() => import('./pages/dean/PlacementOversightPage.js').then(m => ({ default: m.PlacementOversightPage })));
const DeanAuditLogPage       = lazy(() => import('./pages/dean/DeanAuditLogPage.js').then(m => ({ default: m.DeanAuditLogPage })));

// ── Suspense loading fallback ───────────────────────────────────────────────
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
    <div className="text-center space-y-3">
      <div className="w-9 h-9 border-2 border-[#1E5AA8] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-semibold text-[#64748B]">Loading...</p>
    </div>
  </div>
);


// Root redirector based on authenticated user role
const RootRedirector: React.FC = () => {
  const { user, profile, role, loading } = useAuth();

  // If session is loading or if user is authenticated but role is still resolving, hold loader
  if (loading || (user && !role)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#172033]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#1E5AA8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#64748B]">Loading University Examination &amp; Academic Management Portal...</p>
        </div>
      </div>
    );
  }

  if (user || profile) {
    if (role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
    if (role === 'administrator') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'dean') return <Navigate to="/dean/dashboard" replace />;
    // Fallback for authenticated user with unknown role
    return <Navigate to="/login" replace />;
  }

  // Unauthenticated – show the public homepage
  return <HomePage />;
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Root – Smart redirect: logged-in → dashboard, guests → homepage */}
          <Route path="/" element={<RootRedirector />} />
          <Route path="/home" element={<HomePage />} />

          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Public Official Credential Verification Routes */}
          <Route path="/verify" element={<DocumentVerificationPage />} />
          <Route path="/verify/:type/:id" element={<DocumentVerificationPage />} />
          <Route path="/verify/hall-ticket/:id" element={<DocumentVerificationPage />} />
          <Route path="/verify/hallticket/:id" element={<DocumentVerificationPage />} />
          <Route path="/verify/result/:id" element={<DocumentVerificationPage />} />
          <Route path="/verify/transcript/:id" element={<DocumentVerificationPage />} />
          <Route path="/verify/exam/:id" element={<DocumentVerificationPage />} />

          {/* Administrator Route Aliases - prevent 404s */}
          <Route path="/administrator/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/administrator/*" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/administrator" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Developer Schema Hub — Admin Only */}
          <Route
            path="/dev/schema"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <DashboardLayout>
                  <SchemaExplorerPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Student Portal */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <StudentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student', 'faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <ProfileSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/enrollments"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <CourseEnrollmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <StudentAttendancePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/examinations"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <StudentExaminationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/hall-ticket"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <StudentExaminationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <StudentResultsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/transcript"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <StudentResultsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notices"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <NoticeBoardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/timetable"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <StudentTimetablePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/schedule"
            element={<Navigate to="/student/timetable" replace />}
          />
          <Route
            path="/student/exam-apply"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <ExamApplicationPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam-registration"
            element={<Navigate to="/student/exam-apply" replace />}
          />
          <Route
            path="/student/scholarships"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <ScholarshipPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/scholarship"
            element={<Navigate to="/student/scholarships" replace />}
          />
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <AssignmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/degree-progress"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <DegreeProgressPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/documents"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <DocumentsVaultPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/vault"
            element={<Navigate to="/student/documents" replace />}
          />
          <Route
            path="/student/fees"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <StudentFeesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/fee"
            element={<Navigate to="/student/fees" replace />}
          />
          <Route
            path="/student/grievance"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <GrievancePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/support"
            element={<Navigate to="/student/grievance" replace />}
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <NotificationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/analytics"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <PerformanceAnalyticsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/materials"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <CourseMaterialsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/course-materials"
            element={<Navigate to="/student/materials" replace />}
          />
          <Route
            path="/student/notes"
            element={<Navigate to="/student/materials" replace />}
          />
          <Route
            path="/student/requests"
            element={
              <ProtectedRoute allowedRoles={['student', 'administrator', 'dean']}>
                <DashboardLayout>
                  <MyRequestsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/my-requests"
            element={<Navigate to="/student/requests" replace />}
          />

          {/* Faculty Portal */}
          <Route
            path="/faculty/dashboard"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <FacultyDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/profile"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <ProfileSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/subjects"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <AssignedSubjectsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/attendance"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <AttendanceRegisterPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/invigilation"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <InvigilationDutiesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/exam-duties"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <InvigilationDutiesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/marks"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <MarksEntryPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/marks-entry"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <MarksEntryPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/notices"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <NoticeBoardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/timetable"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <FacultyTimetablePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/schedule"
            element={<Navigate to="/faculty/timetable" replace />}
          />
          <Route
            path="/faculty/mentorship"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <ClassMentorshipPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/leave"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <FacultyLeavePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/leaves"
            element={<Navigate to="/faculty/leave" replace />}
          />
          <Route
            path="/faculty/materials"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <FacultyMaterialsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/course-materials"
            element={<Navigate to="/faculty/materials" replace />}
          />
          <Route
            path="/faculty/assignments"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <FacultyAssignmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/tasks"
            element={<Navigate to="/faculty/assignments" replace />}
          />
          <Route
            path="/faculty/lesson-plan"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <LessonPlanPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/syllabus"
            element={<Navigate to="/faculty/lesson-plan" replace />}
          />
          <Route
            path="/faculty/co-attainment"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <COAttainmentPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/workload"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <WorkloadPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/announcements"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <FacultyAnnouncementsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/question-paper"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <QuestionPaperBuilderPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/research"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <ResearchProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/accreditation"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'administrator', 'dean']}>
                <DashboardLayout>
                  <AccreditationEvidencePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Administrator Portal */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <DashboardLayout>
                  <ProfileSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/accounts"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <DashboardLayout>
                  <AccountManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/academics"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <AcademicStructurePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/academic-structure"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <AcademicStructurePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <AttendanceManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/enrollments"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <CourseEnrollmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <ExamManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/examinations"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <ExamManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/seating"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <SeatingManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/seating-arrangement"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <SeatingManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faculty-duties"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <SeatingManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/marks-verify"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <MarksManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/marks"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <MarksManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/results"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <ResultsManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/revaluation"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <RevaluationManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/results-approval"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <ResultsApprovalPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <UserManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <UserManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faculty"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <UserManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/deans"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <DashboardLayout>
                  <AccountManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <AcademicStructurePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/programs"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <AcademicStructurePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <AcademicStructurePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/semesters"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <AcademicStructurePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notices"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <NoticeManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <AuditLogViewerPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bulk-import"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <BulkDataImportPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fees"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <FeeManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/calendar"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <AdminCalendarManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/grievances"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <AdminGrievanceManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/backups"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <BackupRestorePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <ReportBuilderPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/library-assets"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <LibraryAssetPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <DashboardLayout>
                  <RolePermissionPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dispatcher"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <CommunicationDispatcherPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dual-approvals"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <DashboardLayout>
                  <DualApprovalPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/placements"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <PlacementAlumniPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/accreditation"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <AccreditationCompliancePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/bulk-import"
            element={
              <ProtectedRoute allowedRoles={['administrator', 'dean']}>
                <DashboardLayout>
                  <BulkDataImportPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Dean Executive Portal */}
          <Route
            path="/dean"
            element={<Navigate to="/dean/dashboard" replace />}
          />
          <Route
            path="/dean/dashboard"
            element={
              <ProtectedRoute allowedRoles={['dean']}>
                <DashboardLayout>
                  <DeanDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/profile"
            element={
              <ProtectedRoute allowedRoles={['dean']}>
                <DashboardLayout>
                  <ProfileSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/attendance"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <AttendanceManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/seating"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <SeatingManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/exam-approvals"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <ExamApprovalPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/exams"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <ExamApprovalPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/schedules"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <ExamApprovalPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/marks-moderation"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <MarksManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/results-approval"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <ResultsApprovalPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/results"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <ResultsApprovalPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/faculty"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <UserManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/students"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <UserManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/notices"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <NoticeManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/audit"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <AuditLogViewerPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/reports"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <AcademicReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/scholarships"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <DeanScholarshipPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/scholarship"
            element={<Navigate to="/dean/scholarships" replace />}
          />
          <Route
            path="/dean/timetables"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <DeanTimetablePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/timetables-audit"
            element={<Navigate to="/dean/timetables" replace />}
          />
          <Route
            path="/dean/faculty-leave"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <DeanFacultyLeavePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/grievances"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <DeanGrievancePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/curriculum"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <CurriculumApprovalPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/compliance"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <AccreditationCompliancePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/budget"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <DeanBudgetPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/research"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <DeanResearchOversightPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/academic-calendar"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <AcademicCalendarPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/placements"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <PlacementOversightPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/audit-log"
            element={
              <ProtectedRoute allowedRoles={['dean', 'administrator']}>
                <DashboardLayout>
                  <DeanAuditLogPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 — Page Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
