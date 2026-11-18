import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { enrollmentService, EnrollmentWithDetails } from '../../services/enrollmentService.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { studentFacultyService } from '../../services/studentFacultyService.js';
import { SubjectWithDetails } from '../../data/mockAcademics.js';
import {
  BookOpen,
  GraduationCap,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

export const CourseEnrollmentsPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isElectiveModalOpen, setIsElectiveModalOpen] = useState<boolean>(false);
  const [dropModalTarget, setDropModalTarget] = useState<{ id: string; name: string } | null>(null);
  const [previewSyllabus, setPreviewSyllabus] = useState<SubjectWithDetails | null>(null);
  const [studentRecord, setStudentRecord] = useState<any>(null);
  const [maxAllowedCredits, setMaxAllowedCredits] = useState<number>(24);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [studentEnrs, subjects, studentsList, programsList] = await Promise.all([
        enrollmentService.getEnrollmentsByStudent(user.id),
        academicStructureService.getSubjects(),
        studentFacultyService.getStudents(),
        academicStructureService.getPrograms(),
      ]);

      setEnrollments(studentEnrs);
      setAllSubjects(subjects);

      const foundStudent = studentsList.find((s) => s.user_id === user.id || s.id === user.id);
      setStudentRecord(foundStudent || null);

      if (foundStudent?.program_id) {
        const prog = programsList.find((p) => p.id === foundStudent.program_id);
        const cap = (prog as any)?.max_credits_per_semester || (prog?.degree_level === 'undergraduate' ? 28 : 24);
        setMaxAllowedCredits(cap);
      }
    } catch (err) {
      console.error('Failed to load course enrollments', err);
    } finally {
      setLoading(false);
    }
  };

  const totalCredits = enrollments.reduce((acc, curr) => acc + (curr.subject?.credits || 0), 0);

  // Available elective subjects that student hasn't enrolled in yet
  const enrolledSubjectIds = new Set(enrollments.map((e) => e.subject_id));
  const availableElectives = allSubjects.filter(
    (sub) => sub.type === 'elective' && !enrolledSubjectIds.has(sub.id)
  );

  const handleEnrollElective = async (subjectId: string) => {
    if (!user?.id) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const resolvedSemesterId =
        (user.user_metadata?.current_semester_id as string | undefined) ||
        studentRecord?.current_semester_id ||
        enrollments[0]?.semester_id;

      if (!resolvedSemesterId) {
        throw new Error('Current semester not set on your profile — contact Admin.');
      }

      await enrollmentService.enrollStudent({
        student_id: user.id,
        subject_id: subjectId,
        semester_id: resolvedSemesterId,
      });

      setMessage({ type: 'success', text: 'Elective course registration confirmed successfully!' });
      setIsElectiveModalOpen(false);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to register elective.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDrop = async () => {
    if (!dropModalTarget) return;

    setActionLoading(true);
    setMessage(null);
    try {
      await enrollmentService.dropEnrollment(dropModalTarget.id);
      setMessage({ type: 'success', text: `Course "${dropModalTarget.name}" dropped successfully.` });
      setDropModalTarget(null);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to drop course.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  if (!user) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#0F2747]">Please sign in to view your course registrations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Course Registration &amp; Electives
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                Academic Curriculum &amp; Electives
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Course Registrations &amp; Credit Ledger
            </h1>
            <p className="text-xs text-[#64748B]">
              Review your enrolled courses, manage open electives, and verify credit limits for the active semester.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintSlip}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Registration Slip</span>
            </button>
            <button
              onClick={() => setIsElectiveModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Elective</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 border print:hidden ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss notification">&times;</button>
        </div>
      )}

      {/* Credit & Semester Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Enrolled Subjects</span>
            <BookOpen className="w-4 h-4 text-[#1E5AA8]" />
          </div>
          <div className="text-2xl font-bold text-[#0F2747]">{enrollments.length} Courses</div>
          <p className="text-[11px] text-[#64748B]">Theory, Practical &amp; Electives</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Total Earnable Credits</span>
            <Sparkles className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-[#1E5AA8]">{totalCredits.toFixed(1)} / {maxAllowedCredits}</div>
          <p className="text-[11px] text-[#64748B]">Within statutory credit capacity</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Active Semester</span>
            <GraduationCap className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-bold text-[#0F2747]">Semester 2</div>
          <p className="text-[11px] text-[#64748B]">Master of Computer Applications</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Registration Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">Verified</div>
          <p className="text-[11px] text-[#64748B]">Academic Office Cleared</p>
        </div>

      </div>

      {/* Enrolled Courses Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1E5AA8]" />
              Registered Course Catalog &bull; Active Semester
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              {user?.user_metadata?.roll_number ? (
                <>Roll No: <strong className="text-[#172033]">{user.user_metadata.roll_number as string}</strong> &bull; </>
              ) : null}
              {profile?.full_name || user?.email}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Course Code</th>
                <th className="py-3.5 px-4">Course Title &amp; Syllabus</th>
                <th className="py-3.5 px-4 text-center">Type</th>
                <th className="py-3.5 px-4 text-center">Credits</th>
                <th className="py-3.5 px-4 text-center">Internal Marks</th>
                <th className="py-3.5 px-4 text-center">External Exam</th>
                <th className="py-3.5 px-4 text-center">Pass %</th>
                <th className="py-3.5 px-4 text-center print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((enr) => {
                const sub = enr.subject;
                if (!sub) return null;
                const isElective = sub.type === 'elective';

                return (
                  <tr key={enr.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1E5AA8]">
                      {sub.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#172033] text-xs">{sub.name}</div>
                      <div className="text-[11px] text-[#64748B]">
                        {sub.department?.name || 'Department of Computer Science'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          sub.type === 'theory'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : sub.type === 'practical'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sub.type === 'elective'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sub.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#172033]">
                      {sub.credits}.0
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                      {sub.max_internal_marks}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                      {sub.max_external_marks}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-emerald-700 font-semibold">
                      {sub.pass_percentage}%
                    </td>
                    <td className="py-3.5 px-4 text-center print:hidden">
                      {isElective ? (
                        <button
                          onClick={() => setDropModalTarget({ id: enr.id, name: sub.name })}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                          title="Drop Elective"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-semibold">Mandatory</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-[#172033]">
              <tr>
                <td colSpan={3} className="py-3 px-4 uppercase text-[11px] text-[#64748B]">
                  Total Cumulative Semester Weightage
                </td>
                <td className="py-3 px-4 text-center text-[#1E5AA8] font-extrabold text-sm">
                  {totalCredits}.0
                </td>
                <td colSpan={4} className="py-3 px-4 text-right text-xs text-[#64748B]">
                  {enrollments.length} Total Registered Courses
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal: Register Open / Department Elective */}
      {isElectiveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#1E5AA8]" />
                  Elective Course Registration
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Select an open/departmental elective for Semester 2
                </p>
              </div>
              <button
                onClick={() => setIsElectiveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
                aria-label="Close elective courses modal"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {availableElectives.length === 0 ? (
                <div className="text-center py-6 text-[#64748B] text-xs">
                  No additional elective courses available for registration in this semester.
                </div>
              ) : (
                availableElectives.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#1E5AA8]">{sub.code}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            {sub.credits} Credits
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#172033] mt-1">{sub.name}</h4>
                        <p className="text-[11px] text-[#64748B]">{sub.department?.name}</p>
                      </div>

                      <button
                        onClick={() => handleEnrollElective(sub.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition flex-shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        Enroll Now
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-[#64748B] pt-2 border-t border-slate-200">
                      <span>Internal: {sub.max_internal_marks}M</span>
                      <span>External Exam: {sub.max_external_marks}M</span>
                      <span>Pass: {sub.pass_percentage}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 text-right">
              <button
                onClick={() => setIsElectiveModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Drop Course Confirmation Modal */}
      {dropModalTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F2747]">Drop Elective Course</h3>
              <button
                onClick={() => setDropModalTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-xs cursor-pointer"
                aria-label="Close drop course modal"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to drop <strong>{dropModalTarget.name}</strong> from your active semester registration?
              Your enrolled credits will be reduced accordingly.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDropModalTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Keep Course
              </button>
              <button
                type="button"
                onClick={handleConfirmDrop}
                disabled={actionLoading}
                className="btn-3d-secondary px-5 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 border-rose-600 cursor-pointer shadow-sm"
              >
                {actionLoading ? 'Dropping...' : 'Confirm Drop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Syllabus Preview Modal */}
      {previewSyllabus && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#1E5AA8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {previewSyllabus.code}
                </span>
                <h3 className="text-base font-bold text-[#0F2747] mt-1">{previewSyllabus.name}</h3>
                <p className="text-xs text-slate-500">
                  {previewSyllabus.credits} Credits &bull; Type: <span className="capitalize">{previewSyllabus.type}</span>
                </p>
              </div>
              <button
                onClick={() => setPreviewSyllabus(null)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-xs cursor-pointer"
                aria-label="Close syllabus preview modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-72 overflow-y-auto pr-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Module 1: Foundations &amp; Core Architecture</span>
                <p className="text-slate-700 leading-relaxed">
                  Introduction to distributed transaction boundaries, concurrency control theory, ACID vs BASE models, and consensus protocols.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Module 2: Practical Implementations &amp; Lab Work</span>
                <p className="text-slate-700 leading-relaxed">
                  Query optimization algorithms, execution plans, horizontal scaling with sharding, and real-time streaming architectures.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Evaluation Scheme</span>
                <p className="text-slate-700">
                  Continuous Internal Assessment (CIA): <strong>{previewSyllabus.max_internal_marks} Marks</strong> &bull; End-Semester External Examination: <strong>{previewSyllabus.max_external_marks} Marks</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setPreviewSyllabus(null)}
                className="px-4 py-2 text-xs font-bold bg-[#0F2747] text-white hover:bg-[#1E5AA8] rounded-xl cursor-pointer"
              >
                Close Syllabus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
