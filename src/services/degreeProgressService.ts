import { resultsService } from './resultsService.js';
import { enrollmentService } from './enrollmentService.js';

export interface CreditCategory {
  id: string;
  name: string;
  required: number;
  earned: number;
  in_progress: number;
  color: string;
  description: string;
  items: Array<{
    code: string;
    title: string;
    credits: number;
    status: 'completed' | 'in_progress' | 'pending';
    grade?: string;
    semester?: string;
  }>;
}

export interface DegreeProgressSummary {
  programName: string;
  degreeLevel: string;
  totalRequiredCredits: number;
  totalEarnedCredits: number;
  totalInProgressCredits: number;
  currentCGPA: number;
  standing: string;
  matriculationYear: string;
  expectedGraduation: string;
  backlogsCount: number;
  categories: CreditCategory[];
}

export interface WhatIfSimulationResult {
  electiveChosen: string;
  projectedCredits: number;
  projectedCGPA: number;
  onTrack: boolean;
  notes: string[];
}

const DEFAULT_DEGREE_PROGRESS: DegreeProgressSummary = {
  programName: 'Master of Computer Applications (MCA)',
  degreeLevel: 'Postgraduate (CBCS)',
  totalRequiredCredits: 88,
  totalEarnedCredits: 42,
  totalInProgressCredits: 22,
  currentCGPA: 8.84,
  standing: 'First Class with Distinction',
  matriculationYear: '2025',
  expectedGraduation: 'July 2027',
  backlogsCount: 0,
  categories: [
    {
      id: 'core_theory',
      name: 'Program Core (Theory)',
      required: 44,
      earned: 24,
      in_progress: 12,
      color: '#1E5AA8',
      description: 'Foundational computer science theory and system architecture courses.',
      items: [
        { code: 'MCA-101', title: 'Data Structures & Algorithms', credits: 4, status: 'completed', grade: 'A+', semester: 'Sem 1' },
        { code: 'MCA-102', title: 'Computer System Architecture', credits: 4, status: 'completed', grade: 'A', semester: 'Sem 1' },
        { code: 'MCA-103', title: 'Discrete Mathematical Structures', credits: 4, status: 'completed', grade: 'A+', semester: 'Sem 1' },
        { code: 'MCA-104', title: 'Operating Systems & System Programming', credits: 4, status: 'completed', grade: 'O', semester: 'Sem 1' },
        { code: 'MCA-201', title: 'Advanced Database Management Systems', credits: 4, status: 'in_progress', semester: 'Sem 2' },
        { code: 'MCA-203', title: 'Computer Networks & Protocols', credits: 4, status: 'in_progress', semester: 'Sem 2' },
        { code: 'MCA-204', title: 'Software Engineering & Agile', credits: 4, status: 'in_progress', semester: 'Sem 2' },
        { code: 'MCA-301', title: 'Distributed Systems & Blockchain', credits: 4, status: 'pending', semester: 'Sem 3' },
        { code: 'MCA-302', title: 'Artificial Intelligence & Machine Learning', credits: 4, status: 'pending', semester: 'Sem 3' }
      ]
    },
    {
      id: 'electives',
      name: 'Discipline Specific Electives (DSE)',
      required: 16,
      earned: 4,
      in_progress: 4,
      color: '#D97706',
      description: 'Specialization tracks in Cloud, Data Science, Cyber Security, or Mobile Apps.',
      items: [
        { code: 'MCA-105', title: 'Object Oriented Programming in Java', credits: 4, status: 'completed', grade: 'A', semester: 'Sem 1' },
        { code: 'MCA-202', title: 'Cloud Computing & Microservices', credits: 4, status: 'in_progress', semester: 'Sem 2' },
        { code: 'DSE-01', title: 'Track Elective II (e.g. Big Data Analytics)', credits: 4, status: 'pending', semester: 'Sem 3' },
        { code: 'DSE-02', title: 'Track Elective III (e.g. DevSecOps)', credits: 4, status: 'pending', semester: 'Sem 4' }
      ]
    },
    {
      id: 'practicals',
      name: 'Practical & Laboratory',
      required: 16,
      earned: 10,
      in_progress: 6,
      color: '#059669',
      description: 'Hands-on practical programming laboratory sessions.',
      items: [
        { code: 'MCA-106', title: 'Data Structures Lab (C++/Java)', credits: 3, status: 'completed', grade: 'O', semester: 'Sem 1' },
        { code: 'MCA-107', title: 'OS & Linux Shell Scripting Lab', credits: 3, status: 'completed', grade: 'A+', semester: 'Sem 1' },
        { code: 'MCA-205', title: 'RDBMS & Query Optimization Lab', credits: 3, status: 'in_progress', semester: 'Sem 2' },
        { code: 'MCA-206', title: 'Cloud Infrastructure & Networks Lab', credits: 3, status: 'in_progress', semester: 'Sem 2' }
      ]
    },
    {
      id: 'internship_project',
      name: 'Industry Internship & Capstone Project',
      required: 12,
      earned: 4,
      in_progress: 0,
      color: '#7C3AED',
      description: 'Mandatory industrial summer internship and final semester research capstone project.',
      items: [
        { code: 'MCA-PR1', title: 'Mini Project & Technical Seminar', credits: 4, status: 'completed', grade: 'A+', semester: 'Sem 1' },
        { code: 'MCA-INT', title: 'Industrial Summer Internship (8 Weeks)', credits: 4, status: 'pending', semester: 'Summer 2026' },
        { code: 'MCA-CAP', title: 'Final Major Capstone Project & Viva', credits: 4, status: 'pending', semester: 'Sem 4' }
      ]
    }
  ]
};

class DegreeProgressService {
  async getDegreeProgress(studentId?: string): Promise<DegreeProgressSummary> {
    await new Promise((r) => setTimeout(r, 60));
    if (!studentId) return DEFAULT_DEGREE_PROGRESS;

    try {
      const [res, enrollments] = await Promise.all([
        resultsService.getStudentResult(studentId),
        enrollmentService.getEnrollmentsByStudent(studentId),
      ]);

      if (!res && (!enrollments || enrollments.length === 0)) {
        return DEFAULT_DEGREE_PROGRESS;
      }

      const cgpa = res?.cgpa || res?.sgpa || 8.5;
      const earnedCredits = res?.total_credits || (res?.subjects ? res.subjects.filter(s => s.letter_grade !== 'F' && s.letter_grade !== 'AB').reduce((acc, s) => acc + s.credits, 0) : 24);
      const inProgressCredits = enrollments.reduce((acc, e) => acc + (e.subject?.credits || 0), 0) || 22;
      const backlogs = res ? res.subjects.filter(s => s.letter_grade === 'F' || s.letter_grade === 'AB').length : 0;
      const standing = cgpa >= 8.5 ? 'First Class with Distinction' : cgpa >= 7.5 ? 'First Class' : 'Second Class';

      return {
        ...DEFAULT_DEGREE_PROGRESS,
        programName: res?.program_name || DEFAULT_DEGREE_PROGRESS.programName,
        currentCGPA: cgpa,
        totalEarnedCredits: earnedCredits,
        totalInProgressCredits: inProgressCredits,
        backlogsCount: backlogs,
        standing,
      };
    } catch {
      return DEFAULT_DEGREE_PROGRESS;
    }
  }

  simulateWhatIf(
    currentSummary: DegreeProgressSummary,
    selectedElective: string,
    targetFutureGradeAvg: number // 7 to 10
  ): WhatIfSimulationResult {
    const remainingCredits = currentSummary.totalRequiredCredits - currentSummary.totalEarnedCredits;
    const currentPoints = currentSummary.currentCGPA * currentSummary.totalEarnedCredits;
    const futurePoints = targetFutureGradeAvg * remainingCredits;
    const projectedCGPA = parseFloat(((currentPoints + futurePoints) / currentSummary.totalRequiredCredits).toFixed(2));

    const onTrack = projectedCGPA >= 6.5;

    const notes = [
      `Selecting "${selectedElective}" fulfills Category DSE requirements (4 credits).`,
      `Targeting average GPA of ${targetFutureGradeAvg.toFixed(1)} across remaining semesters projects a graduating CGPA of ${projectedCGPA}.`,
      projectedCGPA >= 8.5
        ? 'Qualified for Degree with First Class & Distinction (Gold Honor Roll).'
        : projectedCGPA >= 7.5
        ? 'Qualified for Degree with First Class.'
        : 'Meets minimum statutory graduation criteria.'
    ];

    return {
      electiveChosen: selectedElective,
      projectedCredits: currentSummary.totalRequiredCredits,
      projectedCGPA,
      onTrack,
      notes
    };
  }
}

export const degreeProgressService = new DegreeProgressService();
