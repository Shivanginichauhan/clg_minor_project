import { resultsService } from './resultsService.js';
import { attendanceService } from './attendanceService.js';

export interface SemesterTrend {
  semester: string;
  sgpa: number;
  class_average: number;
  credits: number;
}

export interface SubjectAnalytics {
  subject_code: string;
  subject_name: string;
  student_score: number;
  class_average: number;
  highest_score: number;
  percentile: number;
  attendance_percent: number;
  assessment_breakdown: {
    quiz1: { score: number; max: number };
    quiz2: { score: number; max: number };
    midterm: { score: number; max: number };
    assignment: { score: number; max: number };
  };
  status: 'strong' | 'moderate' | 'needs_attention';
  recommendation: string;
}

export interface PerformanceAnalyticsData {
  currentCGPA: number;
  classRank: number;
  totalStudents: number;
  percentile: number;
  semesterTrends: SemesterTrend[];
  subjects: SubjectAnalytics[];
  strengths: string[];
  weaknesses: string[];
}

const DEFAULT_ANALYTICS: PerformanceAnalyticsData = {
  currentCGPA: 8.84,
  classRank: 4,
  totalStudents: 68,
  percentile: 94.1,
  semesterTrends: [
    { semester: 'Sem 1 (Fall 2025)', sgpa: 8.80, class_average: 7.42, credits: 24 },
    { semester: 'Sem 2 (Spring 2026)', sgpa: 8.88, class_average: 7.55, credits: 22 },
  ],
  subjects: [
    {
      subject_code: 'MCA-201',
      subject_name: 'Advanced Database Management Systems',
      student_score: 88,
      class_average: 74,
      highest_score: 94,
      percentile: 91,
      attendance_percent: 72.5,
      assessment_breakdown: {
        quiz1: { score: 18, max: 20 },
        quiz2: { score: 17, max: 20 },
        midterm: { score: 27, max: 30 },
        assignment: { score: 26, max: 30 }
      },
      status: 'needs_attention',
      recommendation: 'Theoretical understanding is exceptional (top 9%), but attendance is 72.5% (statutory risk). Attend next 3 lectures to avoid exam debarment.'
    },
    {
      subject_code: 'MCA-202',
      subject_name: 'Cloud Computing & Microservices',
      student_score: 92,
      class_average: 71,
      highest_score: 95,
      percentile: 97,
      attendance_percent: 92.0,
      assessment_breakdown: {
        quiz1: { score: 20, max: 20 },
        quiz2: { score: 19, max: 20 },
        midterm: { score: 28, max: 30 },
        assignment: { score: 25, max: 30 }
      },
      status: 'strong',
      recommendation: 'Top performer in container orchestration and cloud infra. Recommended for industry certification voucher.'
    },
    {
      subject_code: 'MCA-203',
      subject_name: 'Computer Networks & Internet Protocols',
      student_score: 82,
      class_average: 76,
      highest_score: 91,
      percentile: 78,
      attendance_percent: 86.5,
      assessment_breakdown: {
        quiz1: { score: 15, max: 20 },
        quiz2: { score: 16, max: 20 },
        midterm: { score: 24, max: 30 },
        assignment: { score: 27, max: 30 }
      },
      status: 'moderate',
      recommendation: 'Strong in lab simulations; recommend reviewing BGP routing policies and Subnetting calculations.'
    },
    {
      subject_code: 'MCA-204',
      subject_name: 'Software Engineering & Agile',
      student_score: 90,
      class_average: 78,
      highest_score: 93,
      percentile: 93,
      attendance_percent: 89.0,
      assessment_breakdown: {
        quiz1: { score: 19, max: 20 },
        quiz2: { score: 18, max: 20 },
        midterm: { score: 27, max: 30 },
        assignment: { score: 26, max: 30 }
      },
      status: 'strong',
      recommendation: 'Consistently high in sprint documentation and TDD coverage analysis.'
    }
  ],
  strengths: [
    'Cloud Systems & Microservices (Top 3% of cohort)',
    'Database Query Optimization & Relational Algebra',
    'Practical Laboratory Implementations'
  ],
  weaknesses: [
    'MCA-201 Attendance Compliance (72.5% vs 75% threshold)',
    'Network Routing Theory & Protocol Edge-Cases'
  ]
};

class PerformanceAnalyticsService {
  async getAnalytics(studentId?: string): Promise<PerformanceAnalyticsData> {
    await new Promise((r) => setTimeout(r, 60));
    if (!studentId) return DEFAULT_ANALYTICS;

    try {
      const [res, att] = await Promise.all([
        resultsService.getStudentResult(studentId),
        attendanceService.getStudentAttendanceOverview(studentId),
      ]);

      if (!res) return DEFAULT_ANALYTICS;

      const cgpa = res.cgpa || res.sgpa || 8.84;
      const rank = Math.max(1, Math.min(68, Math.round((10 - cgpa) * 4 + 1)));
      const percentile = Math.min(99.4, Math.round(((68 - rank + 1) / 68) * 100 * 10) / 10);

      const subjects: SubjectAnalytics[] = res.subjects.map((sub, idx) => {
        const attReport = att.subjectReports.find((r) => r.subject.code === sub.subject_code || r.subject.id === sub.subject_id);
        const attPct = attReport ? attReport.percentage : (idx === 0 ? 72.5 : 88.0);
        const isDanger = attPct < 75;
        const isStrong = sub.total_marks >= 85;

        return {
          subject_code: sub.subject_code,
          subject_name: sub.subject_name,
          student_score: sub.total_marks,
          class_average: 74,
          highest_score: Math.max(sub.total_marks, 92),
          percentile: isStrong ? 92 : 78,
          attendance_percent: attPct,
          assessment_breakdown: {
            quiz1: { score: Math.round(sub.internal_marks * 0.4), max: 20 },
            quiz2: { score: Math.round(sub.internal_marks * 0.4), max: 20 },
            midterm: { score: Math.round(sub.external_marks * 0.5), max: 30 },
            assignment: { score: Math.round(sub.internal_marks * 0.2), max: 30 }
          },
          status: isDanger ? 'needs_attention' : isStrong ? 'strong' : 'moderate',
          recommendation: isDanger
            ? `Attendance is ${attPct.toFixed(1)}% (statutory risk). Must attend upcoming lectures to maintain eligibility.`
            : isStrong
            ? 'Outstanding performance. Recommended for advanced elective track.'
            : 'Consistent performance. Regular revision of practical labs suggested.'
        };
      });

      const dangerSubjects = subjects.filter((s) => s.status === 'needs_attention');
      const strengths = subjects.filter((s) => s.status === 'strong').map((s) => `${s.subject_name} (${s.subject_code})`);
      const weaknesses = dangerSubjects.map((s) => `${s.subject_code} Attendance Compliance (${s.attendance_percent.toFixed(1)}% vs 75% threshold)`);

      if (weaknesses.length === 0) {
        weaknesses.push('Targeting top 5 percentile for Chancellor Honor Roll distinction');
      }

      return {
        currentCGPA: cgpa,
        classRank: rank,
        totalStudents: 68,
        percentile,
        semesterTrends: [
          { semester: 'Sem 1 (Fall 2025)', sgpa: res.sgpa || 8.80, class_average: 7.42, credits: 24 },
          { semester: 'Sem 2 (Spring 2026)', sgpa: res.cgpa || 8.88, class_average: 7.55, credits: 22 },
        ],
        subjects: subjects.length > 0 ? subjects : DEFAULT_ANALYTICS.subjects,
        strengths: strengths.length > 0 ? strengths : DEFAULT_ANALYTICS.strengths,
        weaknesses,
      };
    } catch {
      return DEFAULT_ANALYTICS;
    }
  }
}

export const performanceAnalyticsService = new PerformanceAnalyticsService();
