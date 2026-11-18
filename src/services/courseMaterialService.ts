export interface SyllabusUnit {
  unitNumber: number;
  title: string;
  topics: string[];
  status: 'completed' | 'in_progress' | 'upcoming';
  completionPercent: number;
}

export interface MaterialItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  unitNumber: number;
  title: string;
  type: 'slides' | 'notes' | 'lab_manual' | 'question_bank';
  fileFormat: 'PDF' | 'PPTX' | 'ZIP';
  fileSize: string;
  uploadedAt: string;
  downloadsCount: number;
  uploadedBy: {
    name: string;
    designation: string;
    email: string;
    officeHours: string;
    cabin: string;
  };
}

const INITIAL_MATERIALS: MaterialItem[] = [
  {
    id: 'mat-001',
    subjectCode: 'MCA-201',
    subjectName: 'Advanced Database Management Systems',
    unitNumber: 1,
    title: 'Distributed Transaction Processing & 2-Phase Commit Protocol',
    type: 'slides',
    fileFormat: 'PDF',
    fileSize: '4.2 MB',
    uploadedAt: '2026-04-10',
    downloadsCount: 142,
    uploadedBy: {
      name: 'Prof. Ananya Sen',
      designation: 'Associate Professor & HOD',
      email: 'ananya.sen@university.edu',
      officeHours: 'Mon / Wed 3:00 PM - 5:00 PM',
      cabin: 'Academic Block B, Room 304'
    }
  },
  {
    id: 'mat-002',
    subjectCode: 'MCA-201',
    subjectName: 'Advanced Database Management Systems',
    unitNumber: 2,
    title: 'NoSQL CAP Theorem, Partitioning & Cassandra CQL Cheatsheet',
    type: 'notes',
    fileFormat: 'PDF',
    fileSize: '2.1 MB',
    uploadedAt: '2026-04-18',
    downloadsCount: 98,
    uploadedBy: {
      name: 'Prof. Ananya Sen',
      designation: 'Associate Professor & HOD',
      email: 'ananya.sen@university.edu',
      officeHours: 'Mon / Wed 3:00 PM - 5:00 PM',
      cabin: 'Academic Block B, Room 304'
    }
  },
  {
    id: 'mat-003',
    subjectCode: 'MCA-202',
    subjectName: 'Cloud Computing & Microservices',
    unitNumber: 1,
    title: 'Docker Containerization & Kubernetes Multi-Node Ingress Config',
    type: 'lab_manual',
    fileFormat: 'PDF',
    fileSize: '5.8 MB',
    uploadedAt: '2026-04-12',
    downloadsCount: 184,
    uploadedBy: {
      name: 'Dr. Vikram Rao',
      designation: 'Professor (Cloud Systems)',
      email: 'vikram.rao@university.edu',
      officeHours: 'Tue / Thu 2:00 PM - 4:00 PM',
      cabin: 'Computing Center, Cabin 12'
    }
  },
  {
    id: 'mat-004',
    subjectCode: 'MCA-203',
    subjectName: 'Computer Networks & Internet Protocols',
    unitNumber: 1,
    title: 'BGP Routing, Autonomous Systems & Route Hijacking Labs',
    type: 'notes',
    fileFormat: 'PDF',
    fileSize: '3.4 MB',
    uploadedAt: '2026-04-15',
    downloadsCount: 110,
    uploadedBy: {
      name: 'Dr. Ramesh K. Verma',
      designation: 'Assistant Professor',
      email: 'ramesh.verma@university.edu',
      officeHours: 'Fri 10:00 AM - 1:00 PM',
      cabin: 'Electronics Wing, Room 208'
    }
  },
  {
    id: 'mat-005',
    subjectCode: 'MCA-201',
    subjectName: 'Advanced Database Management Systems',
    unitNumber: 3,
    title: 'Last 5 Years Solved Midterm & End-Term Question Bank',
    type: 'question_bank',
    fileFormat: 'PDF',
    fileSize: '6.1 MB',
    uploadedAt: '2026-04-22',
    downloadsCount: 312,
    uploadedBy: {
      name: 'Prof. Ananya Sen',
      designation: 'Associate Professor & HOD',
      email: 'ananya.sen@university.edu',
      officeHours: 'Mon / Wed 3:00 PM - 5:00 PM',
      cabin: 'Academic Block B, Room 304'
    }
  }
];

const INITIAL_SYLLABUS_PROGRESS: Record<string, SyllabusUnit[]> = {
  'MCA-201': [
    { unitNumber: 1, title: 'Distributed DBMS & Concurrency Architecture', topics: ['2PC Protocol', 'Sagas', 'Vector Clocks'], status: 'completed', completionPercent: 100 },
    { unitNumber: 2, title: 'NoSQL, Cassandra & Graph Stores', topics: ['CAP Theorem', 'LSM-Trees', 'Gremlin'], status: 'completed', completionPercent: 100 },
    { unitNumber: 3, title: 'Query Optimization & Cost Estimations', topics: ['Heuristic Rewriting', 'Join Order', 'System R'], status: 'in_progress', completionPercent: 65 },
    { unitNumber: 4, title: 'Distributed Recovery & Paxos Consensus', topics: ['Raft', 'Paxos', 'Byzantine Fault Tolerance'], status: 'upcoming', completionPercent: 0 }
  ],
  'MCA-202': [
    { unitNumber: 1, title: 'Virtualization & Microservices Architecture', topics: ['Cgroups', 'Namespace', 'Docker'], status: 'completed', completionPercent: 100 },
    { unitNumber: 2, title: 'Kubernetes Pods, Services & Ingress Controllers', topics: ['Deployments', 'StatefulSets', 'Traefik'], status: 'in_progress', completionPercent: 75 },
    { unitNumber: 3, title: 'Service Mesh & Observability', topics: ['Istio', 'Prometheus', 'Grafana'], status: 'upcoming', completionPercent: 0 }
  ],
  'MCA-203': [
    { unitNumber: 1, title: 'Advanced IP Routing & BGP', topics: ['eBGP', 'iBGP', 'AS Path Filter'], status: 'completed', completionPercent: 100 },
    { unitNumber: 2, title: 'Transport Protocols & Congestion Control', topics: ['TCP BBR', 'QUIC', 'ECN'], status: 'in_progress', completionPercent: 50 },
    { unitNumber: 3, title: 'Software Defined Networking (SDN)', topics: ['OpenFlow', 'Mininet', 'ONOS'], status: 'upcoming', completionPercent: 0 }
  ]
};

const STORAGE_KEY = 'ueams_course_materials';

class CourseMaterialService {
  private getStoredMaterials(): MaterialItem[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MATERIALS));
      return INITIAL_MATERIALS;
    }
    return JSON.parse(raw);
  }

  async getMaterials(subjectCode?: string): Promise<MaterialItem[]> {
    await new Promise((r) => setTimeout(r, 40));
    const list = this.getStoredMaterials();
    if (!subjectCode || subjectCode === 'all') return list;
    return list.filter((m) => m.subjectCode === subjectCode);
  }

  async uploadMaterial(item: Omit<MaterialItem, 'id' | 'uploadedAt' | 'downloadsCount'>): Promise<MaterialItem> {
    const list = this.getStoredMaterials();
    const newItem: MaterialItem = {
      ...item,
      id: `mat-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
      downloadsCount: 0,
    };
    const updated = [newItem, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newItem;
  }

  async deleteMaterial(id: string): Promise<void> {
    const list = this.getStoredMaterials();
    const updated = list.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async getSyllabusUnits(subjectCode: string): Promise<SyllabusUnit[]> {
    const raw = localStorage.getItem('ueams_syllabus_progress');
    if (raw) {
      try {
        const stored = JSON.parse(raw);
        if (stored[subjectCode] && stored[subjectCode].length > 0) {
          return stored[subjectCode];
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_SYLLABUS_PROGRESS[subjectCode] || [
      { unitNumber: 1, title: 'Core Foundations & Principles', topics: ['Unit 1 Concepts', 'Foundations'], status: 'completed', completionPercent: 100 },
      { unitNumber: 2, title: 'Advanced Architectures & Systems', topics: ['Unit 2 Execution', 'Deep Dive'], status: 'in_progress', completionPercent: 60 },
      { unitNumber: 3, title: 'Emerging Frameworks & Applications', topics: ['Applied Solutions', 'Project Case Studies'], status: 'upcoming', completionPercent: 0 }
    ];
  }

  downloadMaterial(item: MaterialItem): void {
    const content = `========================================================\nITM UNIVERSITY - ACADEMIC REPOSITORY MATERIAL\n========================================================\nSubject: ${item.subjectCode} - ${item.subjectName}\nUnit: Unit ${item.unitNumber}\nResource: ${item.title}\nFormat: ${item.fileFormat} (${item.fileSize})\nUploaded By: ${item.uploadedBy.name} (${item.uploadedBy.designation})\nOffice: ${item.uploadedBy.cabin} &bull; Hours: ${item.uploadedBy.officeHours}\nDirect Email: ${item.uploadedBy.email}\nDate: ${item.uploadedAt}\n\n[Certified Digital Lecture Material - Authorized for Student Study Only]\n========================================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.subjectCode}_Unit${item.unitNumber}_${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const courseMaterialService = new CourseMaterialService();
