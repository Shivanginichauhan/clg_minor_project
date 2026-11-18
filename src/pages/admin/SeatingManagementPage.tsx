import React, { useState, useEffect } from 'react';
import {
  DoorOpen,
  LayoutGrid,
  Users,
  ShieldCheck,
  Printer,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  UserCheck,
  Layers,
  Sparkles,
  Sliders,
  Calendar,
  Search,
  Eye,
  Check,
  X,
  FileText
} from 'lucide-react';
import {
  seatingService,
  RoomWithLayout,
  SeatingArrangementWithDetails,
  FacultyExamDutyWithDetails,
  RoomDoorNotice
} from '../../services/seatingService.js';
import { examService } from '../../services/examService.js';
import { ExamCycleWithDetails, ExamScheduleWithDetails } from '../../data/mockExams.js';
import { studentFacultyService } from '../../services/studentFacultyService.js';

export const SeatingManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'allocation' | 'halls' | 'duties' | 'door_charts'>('allocation');

  // Exam Cycles & Schedules
  const [exams, setExams] = useState<ExamCycleWithDetails[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [schedules, setSchedules] = useState<ExamScheduleWithDetails[]>([]);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);

  // Rooms & Seating State
  const [rooms, setRooms] = useState<RoomWithLayout[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<'interleaved_anti_cheat' | 'sequential'>('interleaved_anti_cheat');
  const [seatingList, setSeatingList] = useState<SeatingArrangementWithDetails[]>([]);
  const [selectedGridRoomId, setSelectedGridRoomId] = useState<string>('');

  // Invigilation Duties
  const [duties, setDuties] = useState<FacultyExamDutyWithDetails[]>([]);
  const [dutyFilterRole, setDutyFilterRole] = useState<string>('all');

  // Modals & Notices
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    room_number: '',
    building: 'APJ Abdul Kalam Academic Block',
    floor: 1,
    capacity: 60,
    rows: 6,
    columns: 10,
    is_available: true,
  });

  const [selectedSeatForModal, setSelectedSeatForModal] = useState<SeatingArrangementWithDetails | null>(null);
  const [doorNoticeData, setDoorNoticeData] = useState<RoomDoorNotice | null>(null);
  const [doorNoticeRoomId, setDoorNoticeRoomId] = useState<string>('');
  const [doorNoticeDate, setDoorNoticeDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [doorNoticeSession, setDoorNoticeSession] = useState<'morning' | 'afternoon'>('morning');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const allExams = await examService.getExaminations();
      setExams(allExams);

      const activeOrFirst = allExams[0];
      const currentExamId = selectedExamId || (activeOrFirst ? activeOrFirst.id : '');
      setSelectedExamId(currentExamId);

      const allRooms = (await examService.getRooms()).map((r) => {
        const configuredCols = (r as any).columns || 10;
        const configuredRows = (r as any).rows || Math.ceil((r.capacity || 60) / configuredCols);
        return {
          ...r,
          rows: configuredRows,
          columns: configuredCols,
        };
      }) as RoomWithLayout[];
      setRooms(allRooms);
      if (!selectedGridRoomId && allRooms.length > 0) {
        setSelectedGridRoomId(allRooms[0].id);
      }
      if (!doorNoticeRoomId && allRooms.length > 0) {
        setDoorNoticeRoomId(allRooms[0].id);
      }
      if (selectedRoomIds.length === 0) {
        setSelectedRoomIds(allRooms.map((r) => r.id));
      }

      if (currentExamId) {
        const exSchedules = await examService.getSchedules(currentExamId);
        setSchedules(exSchedules);
        if (selectedScheduleIds.length === 0) {
          setSelectedScheduleIds(exSchedules.map((s) => s.id));
        }
      }

      const allDuties = await seatingService.getFacultyDuties();
      setDuties(allDuties);

      const currentSeating = await seatingService.getSeatingArrangements();
      setSeatingList(currentSeating);
    } catch (err) {
      console.error('Failed to load seating data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedExamId]);

  useEffect(() => {
    if (doorNoticeRoomId) {
      const notice = seatingService.generateRoomDoorNotice(doorNoticeRoomId, doorNoticeDate, doorNoticeSession);
      setDoorNoticeData(notice);
    }
  }, [doorNoticeRoomId, doorNoticeDate, doorNoticeSession, seatingList, duties]);

  // Execute 1-Click Algorithmic Seating Allocation
  const handleRunAllocation = () => {
    if (!selectedExamId) {
      setMessage({ type: 'error', text: 'Please select an examination cycle.' });
      return;
    }
    if (selectedScheduleIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one paper schedule to allocate.' });
      return;
    }
    if (selectedRoomIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one examination hall.' });
      return;
    }

    try {
      const result = seatingService.autoAllocateSeating({
        examinationId: selectedExamId,
        examScheduleIds: selectedScheduleIds,
        roomIds: selectedRoomIds,
        strategy,
      });

      setMessage({
        type: 'success',
        text: `Algorithmic Seating generated successfully! ${result.totalAllocated} candidates allocated across ${result.roomsUtilized} examination halls using ${
          strategy === 'interleaved_anti_cheat' ? 'Anti-Malpractice Interleaving' : 'Sequential Packing'
        }.`,
      });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to allocate seating.' });
    }
  };

  // 1-Click Auto-Roster Faculty Invigilation Duties
  const handleAutoRosterDuties = () => {
    if (!selectedExamId) return;
    try {
      const res = seatingService.autoAssignInvigilators(selectedExamId);
      setMessage({
        type: 'success',
        text: `Invigilation duty roster generated! ${res.totalAssigned} duty slots assigned with workload balance.`,
      });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to auto-assign duties.' });
    }
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomData.room_number.trim()) {
      setMessage({ type: 'error', text: 'Please provide a valid Room Number.' });
      return;
    }

    try {
      seatingService.createRoom(newRoomData);
      setMessage({ type: 'success', text: `Hall ${newRoomData.room_number} added to examination infrastructure.` });
      setIsAddRoomModalOpen(false);
      setNewRoomData({
        room_number: '',
        building: 'APJ Abdul Kalam Academic Block',
        floor: 1,
        capacity: 60,
        rows: 6,
        columns: 10,
        is_available: true,
      });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create room.' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Seating grid calculations for selected hall
  const currentGridRoom = rooms.find((r) => r.id === selectedGridRoomId) || rooms[0];
  const roomSeating = seatingList.filter((s) => s.room_id === currentGridRoom?.id);

  // Group seating by Row and Col coordinates
  const deskMatrix: Record<string, SeatingArrangementWithDetails> = {};
  roomSeating.forEach((s) => {
    const key = `${s.row_index || 1}-${s.col_index || 1}`;
    deskMatrix[key] = s;
  });

  const totalCapacitySum = rooms
    .filter((r) => selectedRoomIds.includes(r.id))
    .reduce((acc, r) => acc + r.capacity, 0);

  const filteredDuties = duties.filter((d) => {
    if (dutyFilterRole !== 'all' && d.duty_role !== dutyFilterRole) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner (Hidden during print) */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200">
                Examination Infrastructure &bull; Hall Logistics
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                Automated Seating, Room Allocation &amp; Invigilation Rostering
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Automated Seating &amp; Examination Hall Allocation
            </h1>
            <p className="text-xs text-[#64748B]">
              Algorithmic desk distribution, anti-malpractice cohort interleaving, faculty invigilation rosters, and room door notices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => seatingService.exportSeatingCSV(selectedExamId || 'all')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Master Seating CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Active View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`print:hidden p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Stats Cards (Hidden during print) */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Total Candidates Seated</span>
            <Users className="w-4 h-4 text-[#1E5AA8]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F2747]">{seatingList.length} Students</div>
          <p className="text-[11px] text-[#64748B]">Across verified room matrices</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Exam Halls &amp; Capacity</span>
            <DoorOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">{rooms.length} Halls</div>
          <p className="text-[11px] text-[#64748B]">{rooms.reduce((a, r) => a + r.capacity, 0)} total seat capacity</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Invigilation Duties</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700">{duties.length} Rostered</div>
          <p className="text-[11px] text-[#64748B]">{duties.filter((d) => d.status === 'confirmed').length} confirmed</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Anti-Malpractice Mode</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-800">Interleaved</div>
          <p className="text-[11px] text-[#64748B]">Alternating cohort dispersion</p>
        </div>
      </div>

      {/* Tabs Navigation (Hidden during print) */}
      <div className="print:hidden flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('allocation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'allocation'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Algorithmic Seating Allocation Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('halls')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'halls'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Halls &amp; Room Infrastructure ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('duties')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'duties'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Faculty Invigilation Roster ({duties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('door_charts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'door_charts'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Printable Door Charts &amp; Attendance Sheets</span>
        </button>
      </div>

      {/* TAB 1: Algorithmic Seating Allocation Engine */}
      {activeTab === 'allocation' && (
        <div className="space-y-6">
          
          {/* Allocation Config Card */}
          <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#1E5AA8]" />
                  <span>Seating Generator Configuration</span>
                </h3>
                <p className="text-xs text-[#64748B]">
                  Select target examination papers, candidate cohorts, and designated rooms for automated seat assignments.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunAllocation}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1E5AA8] hover:bg-[#0F2747] text-white shadow-md flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Algorithmic Allocation</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Col 1: Cycle & Strategy */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#0F2747]">Target Examination Cycle:</label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] font-semibold focus:outline-none focus:border-[#1E5AA8]"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#0F2747]">Seating Distribution Strategy:</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="strategy"
                        checked={strategy === 'interleaved_anti_cheat'}
                        onChange={() => setStrategy('interleaved_anti_cheat')}
                        className="mt-0.5 text-[#1E5AA8]"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-[#0F2747] block">Interleaved Anti-Malpractice Pattern</span>
                        <span className="text-[#64748B] text-[11px]">
                          Alternates students of different degree cohorts or subjects diagonally across adjacent desks.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="strategy"
                        checked={strategy === 'sequential'}
                        onChange={() => setStrategy('sequential')}
                        className="mt-0.5 text-[#1E5AA8]"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-[#0F2747] block">Sequential Roll Number Packing</span>
                        <span className="text-[#64748B] text-[11px]">
                          Allocates students consecutively in ascending roll number order per degree branch.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Col 2: Target Schedules / Papers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0F2747]">Select Examination Papers:</label>
                  <button
                    onClick={() =>
                      setSelectedScheduleIds(
                        selectedScheduleIds.length === schedules.length ? [] : schedules.map((s) => s.id)
                      )
                    }
                    className="text-[11px] text-[#1E5AA8] font-semibold hover:underline"
                  >
                    {selectedScheduleIds.length === schedules.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {schedules.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs">No papers mapped to this cycle.</div>
                  ) : (
                    schedules.map((sch) => (
                      <label
                        key={sch.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs hover:border-slate-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedScheduleIds.includes(sch.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedScheduleIds([...selectedScheduleIds, sch.id]);
                            } else {
                              setSelectedScheduleIds(selectedScheduleIds.filter((id) => id !== sch.id));
                            }
                          }}
                          className="text-[#1E5AA8] rounded"
                        />
                        <div className="truncate flex-1">
                          <span className="font-bold font-mono text-[#1E5AA8] mr-1">{sch.subject_code}</span>
                          <span className="text-[#172033] font-medium">{sch.subject_name}</span>
                          <div className="text-[10px] text-[#64748B]">
                            {sch.exam_date} &bull; {sch.session_type?.toUpperCase()} &bull; {sch.program_name}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Col 3: Target Examination Halls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0F2747]">Designated Examination Halls:</label>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold">
                    Capacity: {totalCapacitySum} Seats
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {rooms.map((room) => (
                    <label
                      key={room.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs hover:border-slate-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedRoomIds.includes(room.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoomIds([...selectedRoomIds, room.id]);
                            } else {
                              setSelectedRoomIds(selectedRoomIds.filter((id) => id !== room.id));
                            }
                          }}
                          className="text-[#1E5AA8] rounded"
                        />
                        <div>
                          <strong className="text-[#0F2747]">{room.room_number}</strong>
                          <span className="text-[10px] text-[#64748B] block">{room.building} (Floor {room.floor})</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#1E5AA8]">{room.capacity} seats</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Interactive Visual Seating Grid / Room Matrix View */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-[#1E5AA8]" />
                  <span>Interactive Examination Hall Matrix &bull; {currentGridRoom?.room_number}</span>
                </h3>
                <p className="text-xs text-[#64748B]">
                  Live desk layout ({currentGridRoom?.rows} Rows &times; {currentGridRoom?.columns} Columns). Click any desk to inspect candidate details.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-[#0F2747] whitespace-nowrap">Switch Hall:</label>
                <select
                  value={selectedGridRoomId}
                  onChange={(e) => setSelectedGridRoomId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#172033] font-bold focus:outline-none focus:border-[#1E5AA8]"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_number} ({r.capacity} seats) &bull; {r.building}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Stage / Invigilator Dais Banner */}
            <div className="p-3 bg-slate-900 text-white rounded-xl text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-xs">
              <Building className="w-4 h-4 text-amber-400" />
              <span>INVIGILATOR DAIS / FRONT BLACKBOARD STAGE &bull; {currentGridRoom?.room_number}</span>
            </div>

            {/* Seating Grid Map */}
            {currentGridRoom && (
              <div className="overflow-x-auto pb-4">
                <div
                  className="grid gap-2 min-w-[700px]"
                  style={{
                    gridTemplateColumns: `repeat(${currentGridRoom.columns}, minmax(80px, 1fr))`,
                  }}
                >
                  {Array.from({ length: currentGridRoom.rows }).map((_, rIdx) => {
                    const rowNum = rIdx + 1;
                    return Array.from({ length: currentGridRoom.columns }).map((__, cIdx) => {
                      const colNum = cIdx + 1;
                      const deskKey = `${rowNum}-${colNum}`;
                      const arrangement = deskMatrix[deskKey];

                      const isOccupied = !!arrangement;
                      const isMCA = arrangement?.program_name?.includes('MCA');
                      const isBTech = arrangement?.program_name?.includes('Technology');

                      return (
                        <div
                          key={deskKey}
                          onClick={() => arrangement && setSelectedSeatForModal(arrangement)}
                          className={`p-2 rounded-xl border text-left transition relative group ${
                            isOccupied
                              ? isMCA
                                ? 'bg-blue-50/80 border-blue-200 hover:border-blue-400 hover:shadow-sm cursor-pointer'
                                : 'bg-purple-50/80 border-purple-200 hover:border-purple-400 hover:shadow-sm cursor-pointer'
                              : 'bg-slate-50/50 border-dashed border-slate-200 opacity-60'
                          }`}
                        >
                          {/* Desk Label */}
                          <div className="flex items-center justify-between text-[9px] font-mono text-[#64748B] mb-1">
                            <span>R{rowNum}C{colNum}</span>
                            {isOccupied && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                          </div>

                          {isOccupied ? (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold font-mono text-[#0F2747] block truncate">
                                {arrangement.roll_number}
                              </span>
                              <span className="text-[9px] text-[#172033] font-medium block truncate">
                                {arrangement.student_name}
                              </span>
                              <div className="flex items-center justify-between pt-0.5">
                                <span
                                  className={`text-[8px] font-mono font-bold px-1 rounded ${
                                    isMCA ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                  }`}
                                >
                                  {arrangement.subject_code}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-9 flex items-center justify-center text-[10px] text-slate-300 font-mono">
                              Empty
                            </div>
                          )}
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            )}

            {/* Grid Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-[#64748B]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-300" />
                  <span>Master of Computer Applications (MCA)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-purple-50 border border-purple-300" />
                  <span>Bachelor of Technology (CSE)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-50 border border-dashed border-slate-300" />
                  <span>Available / Vacant Desk</span>
                </div>
              </div>

              <div className="font-mono text-xs font-bold text-[#0F2747]">
                Room Occupancy: {roomSeating.length} / {currentGridRoom?.capacity} Desks ({((roomSeating.length / (currentGridRoom?.capacity || 1)) * 100).toFixed(0)}%)
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: Halls & Room Infrastructure */}
      {activeTab === 'halls' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">Examination Hall &amp; Room Infrastructure</h3>
              <p className="text-xs text-[#64748B]">
                Configure seating dimensions, rows &times; columns layout, and physical hall parameters.
              </p>
            </div>

            <button
              onClick={() => setIsAddRoomModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Examination Hall</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Floor {room.floor} &bull; {room.building}
                    </span>
                    <h4 className="text-lg font-bold text-[#0F2747]">{room.room_number}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      room.is_available
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {room.is_available ? 'Available' : 'Maintenance'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Seating Capacity:</span>
                    <strong className="text-sm font-bold text-[#1E5AA8]">{room.capacity} Desks</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Grid Layout:</span>
                    <strong className="font-mono text-slate-800">{room.rows} R &times; {room.columns} C</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Allotted in active cycles:</span>
                  <strong className="text-slate-900 font-bold">
                    {seatingList.filter((s) => s.room_id === room.id).length} seated
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Faculty Invigilation Duty Rostering */}
      {activeTab === 'duties' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  <span>Faculty Examination Invigilation Roster</span>
                </h3>
                <p className="text-xs text-[#64748B]">
                  Statutory supervision duty distribution across all examination centers and session blocks.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleAutoRosterDuties}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1E5AA8] hover:bg-[#0F2747] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-Roster Invigilators (Workload Balanced)</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-[#0F2747]">Filter Role:</span>
              {['all', 'chief_superintendent', 'invigilator', 'reliever'].map((role) => (
                <button
                  key={role}
                  onClick={() => setDutyFilterRole(role)}
                  className={`px-3 py-1 rounded-lg font-semibold uppercase tracking-wider text-[10px] transition cursor-pointer ${
                    dutyFilterRole === role
                      ? 'bg-[#0F2747] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Duties Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Faculty Appointee</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Exam Session &amp; Date</th>
                    <th className="py-3 px-4">Venue Hall</th>
                    <th className="py-3 px-4 text-center">Candidates</th>
                    <th className="py-3 px-4 text-center">Duty Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDuties.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#64748B]">
                        No invigilation duties mapped yet. Click 'Auto-Roster Invigilators' to generate assignments.
                      </td>
                    </tr>
                  ) : (
                    filteredDuties.map((duty) => (
                      <tr key={duty.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={duty.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                              alt={duty.faculty_name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <strong className="text-[#0F2747] block">{duty.faculty_name}</strong>
                              <span className="text-[11px] text-[#64748B] font-mono">
                                {duty.employee_id} &bull; {duty.department_name}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              duty.duty_role === 'chief_superintendent'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : duty.duty_role === 'invigilator'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {duty.duty_role.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-[#0F2747]">{duty.exam_date}</div>
                          <div className="text-[11px] text-[#64748B] font-mono">
                            {duty.start_time} - {duty.end_time} ({duty.session_type?.toUpperCase()})
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-[#172033]">{duty.room_number}</div>
                          <div className="text-[10px] text-[#64748B] truncate max-w-[140px]">{duty.building}</div>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                          {duty.total_candidates || 30}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              duty.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : duty.status === 'completed'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {duty.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Printable Door Charts & Attendance Registers */}
      {activeTab === 'door_charts' && (
        <div className="space-y-6">
          
          {/* Controls Bar (Hidden during print) */}
          <div className="print:hidden bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <label className="font-bold text-[#0F2747] block mb-1">Select Examination Hall:</label>
                <select
                  value={doorNoticeRoomId}
                  onChange={(e) => setDoorNoticeRoomId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#172033] font-bold focus:outline-none focus:border-[#1E5AA8]"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_number} &bull; {r.building}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0F2747] block mb-1">Exam Date:</label>
                <input
                  type="date"
                  value={doorNoticeDate}
                  onChange={(e) => setDoorNoticeDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#172033] font-bold focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F2747] block mb-1">Session Slot:</label>
                <select
                  value={doorNoticeSession}
                  onChange={(e) => setDoorNoticeSession(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#172033] font-bold focus:outline-none focus:border-[#1E5AA8]"
                >
                  <option value="morning">Morning Slot (10:00 AM - 01:00 PM)</option>
                  <option value="afternoon">Afternoon Slot (02:00 PM - 05:00 PM)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Room Door Notice</span>
            </button>
          </div>

          {/* Printable Room Door Notice Document */}
          {doorNoticeData && (
            <div
              id="printable-room-door-notice"
              className="bg-white border-2 border-slate-800 rounded-2xl p-8 shadow-md space-y-6 print:border-none print:shadow-none print:p-0 print:m-0"
            >
              {/* Institutional Header */}
              <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
                <h2 className="text-xl font-extrabold uppercase tracking-wide text-[#0F2747]">
                  University Examination &amp; Academic Management System
                </h2>
                <p className="text-xs uppercase font-bold text-[#1E5AA8] tracking-widest">
                  OFFICE OF THE CONTROLLER OF EXAMINATIONS &bull; SEATING ALLOCATION NOTICE
                </p>
                <div className="inline-block mt-2 px-6 py-1.5 rounded-full bg-slate-900 text-white font-extrabold text-sm uppercase tracking-widest">
                  EXAMINATION HALL DOOR NOTICE
                </div>
              </div>

              {/* Hall Meta Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-300 text-xs">
                <div>
                  <span className="text-[#64748B] block text-[11px]">Hall Number:</span>
                  <strong className="text-lg font-extrabold text-[#0F2747]">{doorNoticeData.room_number}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Building Complex:</span>
                  <strong className="text-slate-900">{doorNoticeData.building} (Floor {doorNoticeData.floor})</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Examination Date &amp; Slot:</span>
                  <strong className="text-slate-900">{doorNoticeData.exam_date} &bull; {doorNoticeData.time_window}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Total Allotted Candidates:</span>
                  <strong className="text-lg font-mono font-bold text-[#1E5AA8]">{doorNoticeData.total_candidates} Candidates</strong>
                </div>
              </div>

              {/* Roll Number Range Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2747]">
                  Candidate Roll Number Distribution in this Hall:
                </h4>

                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-[#0F2747] uppercase font-bold border-b border-slate-300 text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Subject Code &amp; Title</th>
                      <th className="py-2.5 px-3">Degree Program</th>
                      <th className="py-2.5 px-3">From Roll Number</th>
                      <th className="py-2.5 px-3">To Roll Number</th>
                      <th className="py-2.5 px-3 text-center">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {doorNoticeData.cohort_summaries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-[#64748B]">
                          No candidates allocated to this hall for the selected slot. Run Algorithmic Allocation first.
                        </td>
                      </tr>
                    ) : (
                      doorNoticeData.cohort_summaries.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <strong className="font-mono text-[#1E5AA8]">{c.subject_code}</strong>
                            <div className="text-[11px] text-slate-800">{c.subject_name}</div>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {c.program_name} (Sem {c.semester_number})
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{c.roll_start}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{c.roll_end}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-[#0F2747]">
                            {c.candidate_count}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Invigilation Appointees Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-2 text-xs">
                <h5 className="font-bold text-[#0F2747] uppercase tracking-wider text-[11px]">
                  Authorized Examination Officials on Duty:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Chief Superintendent:</span>
                    <strong className="text-slate-900">{doorNoticeData.chief_superintendent}</strong>
                  </div>
                  {doorNoticeData.invigilators.map((inv, idx) => (
                    <div key={idx}>
                      <span className="text-[#64748B] block text-[10px]">{inv.role}:</span>
                      <strong className="text-slate-900">{inv.faculty_name} ({inv.department_name})</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anti-Malpractice Footer Notice */}
              <div className="pt-4 border-t-2 border-slate-800 text-[10px] text-slate-600 space-y-1">
                <p className="font-bold uppercase text-slate-900">
                  Notice: Entry to Examination Hall without valid Hall Ticket &amp; University ID is strictly barred.
                </p>
                <p>
                  Candidates must sit strictly on their allotted desk numbers. Any unauthorized seat exchange will be treated as an examination offense under Act 14.
                </p>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Modal: Add New Examination Hall */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-[#1E5AA8]" />
                Add Examination Hall / Room
              </h3>
              <button
                onClick={() => setIsAddRoomModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Hall / Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LH-301"
                    value={newRoomData.room_number}
                    onChange={(e) => setNewRoomData({ ...newRoomData, room_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Floor Number</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={newRoomData.floor}
                    onChange={(e) => setNewRoomData({ ...newRoomData, floor: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Building Complex</label>
                <input
                  type="text"
                  value={newRoomData.building}
                  onChange={(e) => setNewRoomData({ ...newRoomData, building: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Total Capacity</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={newRoomData.capacity}
                    onChange={(e) => {
                      const cap = parseInt(e.target.value) || 60;
                      setNewRoomData({ ...newRoomData, capacity: cap });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Rows (R)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newRoomData.rows}
                    onChange={(e) => setNewRoomData({ ...newRoomData, rows: parseInt(e.target.value) || 6 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Columns (C)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newRoomData.columns}
                    onChange={(e) => setNewRoomData({ ...newRoomData, columns: parseInt(e.target.value) || 10 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer"
                >
                  Save Examination Hall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Candidate Desk Inspector */}
      {selectedSeatForModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1E5AA8]" />
                Desk Details &bull; {selectedSeatForModal.seat_number}
              </h3>
              <button
                onClick={() => setSelectedSeatForModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={selectedSeatForModal.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={selectedSeatForModal.student_name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <strong className="text-sm text-[#0F2747] block">{selectedSeatForModal.student_name}</strong>
                  <span className="font-mono text-[#1E5AA8] font-bold block">{selectedSeatForModal.roll_number}</span>
                  <span className="text-[#64748B] text-[11px]">{selectedSeatForModal.program_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Subject Code:</span>
                  <span className="font-mono font-bold text-[#1E5AA8]">{selectedSeatForModal.subject_code}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Subject Title:</span>
                  <span className="font-medium text-slate-800">{selectedSeatForModal.subject_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Exam Date &amp; Slot:</span>
                  <span className="font-medium text-slate-800">{selectedSeatForModal.exam_date} ({selectedSeatForModal.session_type?.toUpperCase()})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Hall &amp; Desk Number:</span>
                  <span className="font-bold text-[#0F2747]">{selectedSeatForModal.room_number} &bull; {selectedSeatForModal.seat_number}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Main Answer Booklet No:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedSeatForModal.booklet_number || 'MB-2026-PENDING'}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedSeatForModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] text-white hover:bg-[#1E5AA8] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
