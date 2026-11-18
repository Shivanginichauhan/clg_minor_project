import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  SemesterResultWithDetails,
  SubjectResultItem,
  RevaluationApplication,
  UGC_GRADE_SCALE,
  initialResults,
  initialRevaluations,
} from '../data/mockResults.js';
import { auditService } from './auditService.js';
import { marksService } from './marksService.js';
import { deanService } from './deanService.js';

export const resultsService = {
  revaluationStore: [...initialRevaluations] as RevaluationApplication[],

  /**
   * Grade Letter & Grade Point Calculator based on UGC / AICTE standard
   */
  calculateGrade(totalMarks: number, isAbsent: boolean = false): {
    grade_letter: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F' | 'AB';
    grade_point: number;
    is_passed: boolean;
  } {
    if (isAbsent) {
      return { grade_letter: 'AB', grade_point: 0, is_passed: false };
    }
    if (totalMarks >= 90) return { grade_letter: 'O', grade_point: 10, is_passed: true };
    if (totalMarks >= 80) return { grade_letter: 'A+', grade_point: 9, is_passed: true };
    if (totalMarks >= 70) return { grade_letter: 'A', grade_point: 8, is_passed: true };
    if (totalMarks >= 60) return { grade_letter: 'B+', grade_point: 7, is_passed: true };
    if (totalMarks >= 50) return { grade_letter: 'B', grade_point: 6, is_passed: true };
    if (totalMarks >= 45) return { grade_letter: 'C', grade_point: 5, is_passed: true };
    if (totalMarks >= 40) return { grade_letter: 'P', grade_point: 4, is_passed: true };
    return { grade_letter: 'F', grade_point: 0, is_passed: false };
  },

  /**
   * Get all results from Supabase (with fallback to tabulated marks)
   */
  async getResults(filters?: {
    examinationId?: string;
    programId?: string;
    semesterNumber?: number;
    status?: string;
    studentId?: string;
    search?: string;
  }): Promise<SemesterResultWithDetails[]> {
    if (!isSupabaseConfigured) return initialResults;

    let list: SemesterResultWithDetails[] = [];

    // Attempt direct results table query
    try {
      let query = supabase
        .from('results')
        .select(`
          *,
          student:students(*, profile:profiles(*), department:departments(*), program:programs(*)),
          examination:examinations(*),
          semester:semesters(*),
          subjects:result_subjects(*, subject:subjects(*))
        `)
        .order('created_at', { ascending: false });

      if (filters?.examinationId && filters.examinationId !== 'all') {
        query = query.eq('examination_id', filters.examinationId);
      }
      if (filters?.studentId) {
        query = query.eq('student_id', filters.studentId);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('result_status', filters.status);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        list = data.map((row: any) => {
          const student = row.student || {};
          const profile = student.profile || {};
          const program = student.program || {};
          const department = student.department || {};
          const exam = row.examination || {};

          return {
            id: row.id,
            student_id: row.student_id,
            examination_id: row.examination_id,
            semester_id: row.semester_id,
            sgpa: Number(row.sgpa || 0),
            cgpa: Number(row.cgpa || 0),
            total_credits: row.total_credits || 0,
            earned_credits: row.earned_credits || 0,
            result_status: row.result_status || 'draft',
            approved_by_dean_id: row.approved_by_dean_id,
            approved_at: row.approved_at,
            published_at: row.published_at,
            student_name: profile.full_name || 'Student',
            roll_number: student.roll_number || '',
            enrollment_number: student.enrollment_number || '',
            program_id: program.id || '',
            program_name: program.name || '',
            department_id: department.id || '',
            department_name: department.name || '',
            semester_number: row.semester?.semester_number || 2,
            academic_session: '2025-2026',
            examination_name: exam.name || 'University Examinations',
            examination_type: 'regular',
            total_credits_registered: row.total_credits || 20,
            total_credits_earned: row.earned_credits || 20,
            total_credit_points: Number(row.sgpa || 0) * (row.total_credits || 20),
            percentage_equivalent: Number(row.cgpa || row.sgpa || 0) * 9.5,
            overall_result: 'PASS',
            division: 'First Class with Distinction',
            remarks: 'Qualified for next semester',
            subjects: (row.subjects || []).map((sub: any) => ({
              subject_id: sub.subject_id,
              subject_code: sub.subject?.code || '',
              subject_name: sub.subject?.name || '',
              subject_type: sub.subject?.type || 'theory',
              credits: sub.credits || sub.subject?.credits || 4,
              internal_marks: sub.internal_marks || 0,
              max_internal: 30,
              external_marks: sub.external_marks || 0,
              max_external: 70,
              total_marks: sub.total_marks || 0,
              max_total: 100,
              grace_marks: 0,
              letter_grade: sub.grade || 'P',
              grade_point: sub.grade_point || 4,
              credit_points: (sub.credits || 4) * (sub.grade_point || 4),
              status: sub.status === 'passed' ? 'PASS' : 'FAIL',
            })),
          } as unknown as SemesterResultWithDetails;
        });
      }
    } catch {
      // Ignored - fallback will compute from marks table
    }

    // Fallback: If results table is empty or affected by Postgres recursion policy, compute from marks
    if (list.length === 0) {
      try {
        const marks = await marksService.getAllMarks({
          examinationId: filters?.examinationId,
          studentId: filters?.studentId,
        });

        if (marks.length > 0) {
          // Group marks by student_id
          const byStudent: Record<string, typeof marks> = {};
          marks.forEach((m) => {
            if (!byStudent[m.student_id]) byStudent[m.student_id] = [];
            byStudent[m.student_id].push(m);
          });

          list = Object.entries(byStudent).map(([stuId, stuMarks]) => {
            const first = stuMarks[0];
            let totCredits = 0;
            let totPoints = 0;
            let earnedCredits = 0;
            let hasFail = false;

            const subItems: SubjectResultItem[] = stuMarks.map((m) => {
              const creds = m.subject_credits || 4;
              const pt = m.grade_point || 4;
              const pts = creds * pt;
              totCredits += creds;
              totPoints += pts;
              if (m.is_passed) earnedCredits += creds;
              else hasFail = true;

              return {
                subject_id: m.subject_id,
                subject_code: m.subject_code,
                subject_name: m.subject_name,
                subject_type: m.subject_type as any,
                credits: creds,
                internal_marks: m.internal_marks || 0,
                max_internal: 30,
                external_marks: m.external_marks || 0,
                max_external: 70,
                total_marks: m.total_marks || 0,
                max_total: 100,
                grace_marks: 0,
                letter_grade: m.grade_letter as any,
                grade_point: pt,
                credit_points: pts,
                status: m.is_passed ? 'PASS' : 'FAIL',
              };
            });

            const sgpa = totCredits > 0 ? Number((totPoints / totCredits).toFixed(2)) : 0;
            const anyPublished = stuMarks.some((m) => (m.status as string) === 'published');
            const anyApproved = stuMarks.some((m) => (m.status as string) === 'dean_approved' || (m.status as string) === 'approved');
            const resStatus = anyPublished ? 'published' : anyApproved ? 'approved' : 'draft';

            return {
              id: `res-${stuId}-${first.examination_id}`,
              student_id: stuId,
              examination_id: first.examination_id,
              semester_id: 'sem-mca-2',
              sgpa,
              cgpa: sgpa,
              total_credits: totCredits,
              earned_credits: earnedCredits,
              result_status: resStatus,
              student_name: first.student_name,
              roll_number: first.roll_number,
              enrollment_number: first.enrollment_number,
              program_id: 'prog-001',
              program_name: first.program_name || 'Master of Computer Applications',
              department_id: 'dept-001',
              department_name: 'Computer Science & Engineering',
              semester_number: 2,
              academic_session: '2025-2026',
              examination_name: 'MCA Semester 2 Regular Examination 2026',
              examination_type: 'regular',
              total_credits_registered: totCredits,
              total_credits_earned: earnedCredits,
              total_credit_points: totPoints,
              percentage_equivalent: Number((sgpa * 9.5).toFixed(1)),
              overall_result: hasFail ? 'PROMOTED_WITH_ARREARS' : 'PASS',
              overall_status: hasFail ? 'PROMOTED_WITH_ARREARS' : 'PASS',
              division: sgpa >= 7.5 ? 'First Class with Distinction' : sgpa >= 6.0 ? 'First Class' : 'Second Class',
              remarks: hasFail ? 'Backlog examination required' : 'Promoted to next academic term',
              subjects: subItems,
            } as unknown as SemesterResultWithDetails;
          });
        }
      } catch (err) {
        console.warn('[RESULTS] Marks tabulation fallback warning:', err);
      }
    }

    if (list.length === 0) {
      list = initialResults;
    }

    if (filters?.programId && filters.programId !== 'all') {
      list = list.filter((r) => r.program_id === filters.programId);
    }
    if (filters?.semesterNumber) {
      list = list.filter((r) => r.semester_number === filters.semesterNumber);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.student_name.toLowerCase().includes(q) ||
          r.roll_number.toLowerCase().includes(q) ||
          r.enrollment_number.toLowerCase().includes(q)
      );
    }

    return list;
  },

  async getResultById(id: string): Promise<SemesterResultWithDetails | undefined> {
    const list = await this.getResults();
    return list.find((r) => r.id === id);
  },

  /**
   * Dean Result Approval
   */
  async approveResults(resultIds: string[], deanId: string): Promise<number> {
    if (!isSupabaseConfigured) return resultIds.length;

    // 1. Update marks table status to 'dean_approved' in Supabase
    try {
      const studentIds = resultIds
        .filter((id) => id.startsWith('res-'))
        .map((id) => id.split('-')[1]);

      let marksQuery = supabase
        .from('marks')
        .update({ status: 'dean_approved', updated_at: new Date().toISOString() });

      if (studentIds.length > 0) {
        marksQuery = marksQuery.in('student_id', studentIds);
      }
      await marksQuery;
    } catch (e) {
      console.warn('[RESULTS] Warning updating marks approval status:', e);
    }

    // 2. Also try updating results table if it exists
    try {
      await supabase
        .from('results')
        .update({
          result_status: 'approved',
          approved_by_dean_id: deanId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in('id', resultIds);
    } catch {}

    auditService.logEvent({
      action: 'APPROVE',
      entity_type: 'result',
      entity_id: resultIds[0] || 'bulk',
      description: `Academic Dean approved ${resultIds.length} semester result gazettes.`,
      severity: 'info',
      user_id: deanId,
      user_name: 'Academic Dean',
      role: 'dean',
    });

    return resultIds.length;
  },

  /**
   * Publish Approved Results to Student Portals
   */
  async publishResults(resultIdsOrExamId: string[] | string, publisherIdOrProgramId?: string): Promise<number> {
    if (!isSupabaseConfigured) return 0;

    const examId = typeof resultIdsOrExamId === 'string' ? resultIdsOrExamId : undefined;

    // 1. Update marks table in Supabase to 'published'
    try {
      let marksQuery = supabase
        .from('marks')
        .update({ status: 'published', updated_at: new Date().toISOString() });

      if (examId && examId !== 'all') {
        marksQuery = marksQuery.eq('examination_id', examId);
      } else if (Array.isArray(resultIdsOrExamId)) {
        const studentIds = resultIdsOrExamId
          .filter((id) => id.startsWith('res-'))
          .map((id) => id.split('-')[1]);
        if (studentIds.length > 0) {
          marksQuery = marksQuery.in('student_id', studentIds);
        }
      }
      await marksQuery;
    } catch (e) {
      console.warn('[RESULTS] Warning publishing marks:', e);
    }

    // 2. Also attempt updating results table
    try {
      let ids: string[] = [];
      if (Array.isArray(resultIdsOrExamId)) {
        ids = resultIdsOrExamId;
      } else {
        const results = await this.getResults({ examinationId: resultIdsOrExamId });
        ids = results.map((r) => r.id);
      }

      if (ids.length > 0) {
        await supabase
          .from('results')
          .update({
            result_status: 'published',
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in('id', ids);
      }
    } catch {}

    return 1;
  },

  /**
   * Revaluation applications
   */
  async getRevaluations(filters?: { studentId?: string }): Promise<RevaluationApplication[]> {
    if (filters?.studentId) {
      return this.revaluationStore.filter((r) => r.student_id === filters.studentId);
    }
    return this.revaluationStore;
  },

  resolveRevaluation(
    applicationId: string,
    revisedMarksOrResolution: any,
    remarks?: string,
    resolvedBy?: string
  ): RevaluationApplication | undefined {
    const idx = this.revaluationStore.findIndex((a) => a.id === applicationId);
    if (idx === -1) return undefined;
    const numMarks = typeof revisedMarksOrResolution === 'number' ? revisedMarksOrResolution : Number(revisedMarksOrResolution) || 0;
    const resolved = this.resolveRevaluationApplication(
      this.revaluationStore[idx],
      numMarks,
      remarks || 'Scrutiny resolved',
      resolvedBy || 'Controller of Examinations'
    );
    this.revaluationStore[idx] = resolved;
    return resolved;
  },

  tabulateCohortResults(
    examIdOrProgramId: string,
    programIdOrSemester: string | number,
    semesterOrExamId?: string | number
  ): SemesterResultWithDetails[] {
    const list = [...initialResults];
    return list.map((r) => {
      const regCredits = r.subjects?.reduce((sum, s) => sum + s.credits, 0) || r.total_credits_registered || 24;
      const earnedCredits = r.subjects?.filter((s) => s.status === 'PASS').reduce((sum, s) => sum + s.credits, 0) || r.total_credits_earned;
      const totalPoints = r.subjects?.reduce((sum, s) => sum + s.credit_points, 0) || r.total_credit_points || 0;
      const sgpa = regCredits > 0 ? Number((totalPoints / regCredits).toFixed(2)) : r.sgpa;
      const hasFails = r.subjects?.some((s) => s.status === 'FAIL' || s.letter_grade === 'F');
      const overallStatus: 'PASS' | 'PROMOTED_WITH_ARREARS' | 'FAIL' | 'WITHHELD' =
        r.overall_status === 'WITHHELD'
          ? 'WITHHELD'
          : hasFails
          ? (earnedCredits >= 12 ? 'PROMOTED_WITH_ARREARS' : 'FAIL')
          : 'PASS';

      return {
        ...r,
        total_credits_registered: regCredits,
        total_credits_earned: earnedCredits,
        total_credit_points: totalPoints,
        sgpa,
        overall_status: overallStatus,
      };
    });
  },

  async getStudentResult(studentId: string): Promise<SemesterResultWithDetails | null> {
    const list = await this.getResults({ studentId });
    return list[0] || null;
  },

  async deanApproveResults(
    resultIdsOrExamId: string[] | string,
    deanIdOrProgramId?: string,
    profileId?: string,
    profileName?: string,
    remarks?: string,
    deanPin?: string
  ): Promise<number> {
    if (!deanPin) {
      throw new Error('Statutory Sign-Off Rejected: Dean Authorization PIN is required.');
    }
    const check = deanService.verifyDeanPin(deanPin, profileId);
    if (!check.valid) {
      throw new Error(`Statutory Sign-Off Rejected: ${check.error || 'Invalid Dean Authorization PIN.'}`);
    }

    if (Array.isArray(resultIdsOrExamId)) {
      return this.approveResults(resultIdsOrExamId, deanIdOrProgramId || 'dean');
    }

    const examId = resultIdsOrExamId;
    // Update all marks for this examination to dean_approved
    try {
      let q = supabase
        .from('marks')
        .update({ status: 'dean_approved', updated_at: new Date().toISOString() });
      if (examId && examId !== 'all') {
        q = q.eq('examination_id', examId);
      }
      await q;
    } catch (e) {
      console.warn('[RESULTS] Warning updating examination marks for dean approval:', e);
    }

    const results = await this.getResults({ examinationId: resultIdsOrExamId });
    const ids = results.map((r) => r.id);
    if (ids.length > 0) {
      return this.approveResults(ids, profileId || 'dean');
    }
    return 1;
  },

  async toggleWithholdStatus(resultId: string, isWithheldOrReason: boolean | string, reason?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const status = typeof isWithheldOrReason === 'boolean'
      ? (isWithheldOrReason ? 'withheld' : 'published')
      : 'withheld';

    await supabase
      .from('results')
      .update({
        result_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resultId);
  },

  exportTabulationRegisterCSV(examIdOrFilters?: any, programId?: string): string {
    return 'Roll Number,Student Name,Program,SGPA,CGPA,Result\n';
  },

  applyForRevaluation(payload: {
    student_id: string;
    student_name: string;
    roll_number: string;
    examination_id: string;
    examination_name: string;
    subject_id: string;
    subject_code: string;
    subject_name: string;
    service_type: 're_evaluation' | 're_totaling' | 'answer_script_copy';
    original_marks: number;
    original_grade: string;
    fee_amount: number;
    payment_status: 'paid' | 'pending' | 'exempted';
    payment_reference: string;
    answer_script_url?: string;
  }): RevaluationApplication {
    if (payload.original_marks < 0 || payload.original_marks > 100) {
      throw new Error('Original marks must be between 0 and 100.');
    }
    if (payload.fee_amount < 0) {
      throw new Error('Fee amount cannot be negative.');
    }

    const isCopyRequested = payload.service_type === 'answer_script_copy';
    return {
      id: `rev-${Date.now()}`,
      application_number: `REV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      ...payload,
      status: 'applied',
      applied_at: new Date().toISOString(),
      digitized_copy_available: isCopyRequested,
      answer_script_url: payload.answer_script_url || (isCopyRequested ? `/documents/scripts/${payload.roll_number}_${payload.subject_code}.pdf` : undefined),
    };
  },

  resolveRevaluationApplication(
    app: RevaluationApplication,
    revisedMarks: number,
    remarks: string,
    evaluatorName: string
  ): RevaluationApplication {
    if (revisedMarks < 0 || revisedMarks > 100) {
      throw new Error('Revised marks must be between 0 and 100.');
    }

    const marksDifference = revisedMarks - app.original_marks;
    const isChanged = marksDifference !== 0;
    const newGrade = this.calculateGrade(revisedMarks);

    const updatedApp: RevaluationApplication = {
      ...app,
      revised_marks: revisedMarks,
      revised_grade: newGrade.grade_letter,
      marks_difference: marksDifference,
      status: isChanged ? 'revised' : 'no_change',
      assigned_evaluator_name: evaluatorName,
      scrutiny_remarks: remarks,
      resolved_at: new Date().toISOString(),
      resolved_by: evaluatorName,
    };

    auditService.logEvent({
      action: 'UPDATE',
      entity_type: 'result',
      entity_id: app.id,
      description: `Revaluation completed for ${app.roll_number} in ${app.subject_code}: Score changed by ${marksDifference > 0 ? '+' : ''}${marksDifference} marks.`,
      severity: isChanged ? 'warning' : 'info',
      user_id: 'admin',
      user_name: evaluatorName,
      role: 'administrator',
    });

    // Automatically synchronize student's grade sheet and recompute SGPA/credits
    const targetResult = initialResults.find(
      (r) => r.student_id === app.student_id || r.roll_number === app.roll_number
    );
    if (targetResult && targetResult.subjects) {
      const sub = targetResult.subjects.find(
        (s) => s.subject_id === app.subject_id || s.subject_code === app.subject_code
      );
      if (sub) {
        sub.total_marks = revisedMarks;
        sub.external_marks = Math.max(0, revisedMarks - (sub.internal_marks || 0));
        sub.letter_grade = newGrade.grade_letter;
        sub.grade_point = newGrade.grade_point;
        sub.credit_points = sub.credits * newGrade.grade_point;
        sub.status = newGrade.is_passed ? 'PASS' : 'FAIL';

        const regCredits = targetResult.subjects.reduce((sum, s) => sum + s.credits, 0) || targetResult.total_credits_registered || 24;
        const totalPoints = targetResult.subjects.reduce((sum, s) => sum + s.credit_points, 0);
        const earned = targetResult.subjects.filter((s) => s.status === 'PASS').reduce((sum, s) => sum + s.credits, 0);
        targetResult.total_credit_points = totalPoints;
        targetResult.total_credits_earned = earned;
        targetResult.sgpa = Number((totalPoints / regCredits).toFixed(2));
        targetResult.percentage_equivalent = Number((targetResult.sgpa * 9.5).toFixed(1));
        const hasFail = targetResult.subjects.some((s) => s.status === 'FAIL');
        targetResult.overall_status = hasFail ? 'PROMOTED_WITH_ARREARS' : 'PASS';
      }
    }

    return updatedApp;
  },
};
