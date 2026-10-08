import React, { useState, useEffect, useMemo } from 'react';
import { STATUS_COLORS } from '../constants';
import { AttendanceStatus, Student, ClassGroup, Language, AttendanceRecord } from '../types';
import { Check, X, Clock, AlertTriangle, Save, Wifi, RefreshCw, CloudUpload, Search, LayoutGrid, List, AlertOctagon } from 'lucide-react';
import { TRANSLATIONS } from '../translations';

interface RegisterProps {
  students: Student[];
  classes: ClassGroup[];
  isOnline: boolean;
  lang: Language;
  onAttendanceSubmit: (records: AttendanceRecord[]) => void;
  attendanceRecords: AttendanceRecord[];
}

interface PendingSubmission {
  id: string;
  classId: string;
  date: string;
  attendance: Record<string, AttendanceStatus>;
  timestamp: string;
}

export const Register: React.FC<RegisterProps> = ({ students: allStudents, classes, isOnline, lang, onAttendanceSubmit, attendanceRecords }) => {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [pendingStudentIds, setPendingStudentIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // UX State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  
  const t = TRANSLATIONS[lang];

  const currentClass = classes.find(c => c.id === selectedClassId);
  
  const students = useMemo(() => {
    const classStudents = allStudents.filter(s => currentClass?.students.includes(s.id));
    if (!searchTerm) return classStudents;
    return classStudents.filter(s => {
        const nameToSearch = (lang === 'hi' && s.nameHi) ? s.nameHi : s.name;
        return nameToSearch.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [allStudents, currentClass, searchTerm, lang]);

  // Load Attendance State
  useEffect(() => {
    if (selectedClassId && date) {
        // 1. Check Draft
        const draftKey = `draft_${selectedClassId}_${date}`;
        const savedDraft = localStorage.getItem(draftKey);
        
        if (savedDraft) {
            try { 
                setAttendance(JSON.parse(savedDraft));
                return;
            } catch (e) {}
        }

        // 2. Check Pending Offline
        const storedPending = localStorage.getItem('pendingRegisters');
        let foundInPending = false;
        if (storedPending) {
            try {
                const queue: PendingSubmission[] = JSON.parse(storedPending);
                const pendingSub = queue.find(q => q.classId === selectedClassId && q.date === date);
                if (pendingSub) {
                    setAttendance(pendingSub.attendance);
                    foundInPending = true;
                }
            } catch (e) {}
        }
        
        if (foundInPending) return;

        // 3. Global Records
        const relevantRecords = attendanceRecords.filter(r => 
            r.date === date && currentClass?.students.includes(r.studentId)
        );
        
        if (relevantRecords.length > 0) {
             const map: Record<string, AttendanceStatus> = {};
             relevantRecords.forEach(r => {
                 map[r.studentId] = r.status;
             });
             setAttendance(map);
        } else {
             // 4. Default
             setAttendance({});
        }
    }
  }, [selectedClassId, date, currentClass, attendanceRecords, pendingSyncCount]);

  useEffect(() => {
    if (selectedClassId && date && Object.keys(attendance).length > 0) {
        const draftKey = `draft_${selectedClassId}_${date}`;
        localStorage.setItem(draftKey, JSON.stringify(attendance));
    }
  }, [attendance, selectedClassId, date]);

  useEffect(() => {
    checkPendingSyncs();
  }, [isOnline, selectedClassId, date]);

  const checkPendingSyncs = () => {
    const stored = localStorage.getItem('pendingRegisters');
    if (stored) {
      try {
        const queue: PendingSubmission[] = JSON.parse(stored);
        setPendingSyncCount(queue.length);

        const currentViewPendingIds = new Set<string>();
        queue.forEach(submission => {
          if (submission.classId === selectedClassId && submission.date === date) {
            Object.keys(submission.attendance).forEach(studentId => {
              currentViewPendingIds.add(studentId);
            });
          }
        });
        setPendingStudentIds(currentViewPendingIds);
      } catch (e) {
        setPendingSyncCount(0);
        setPendingStudentIds(new Set());
      }
    } else {
      setPendingSyncCount(0);
      setPendingStudentIds(new Set());
    }
  };

  const syncPendingData = async (silent = false) => {
    const stored = localStorage.getItem('pendingRegisters');
    if (!stored) return;
    
    const queue: PendingSubmission[] = JSON.parse(stored);
    if (queue.length === 0) return;

    setIsSyncing(true);
    setSyncError(null);
    
    try {
        if (!navigator.onLine) {
            throw new Error("Offline");
        }

        const allNewRecords: AttendanceRecord[] = [];
        queue.forEach(submission => {
            Object.entries(submission.attendance).forEach(([studentId, status]) => {
                allNewRecords.push({
                    id: `${studentId}-${submission.date}`,
                    studentId,
                    date: submission.date,
                    status: status,
                    notes: 'Synced from offline'
                });
            });
        });

        // Small delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 800));
        
        onAttendanceSubmit(allNewRecords);
        
        localStorage.removeItem('pendingRegisters');
        checkPendingSyncs(); 
        
        if (!silent) {
             // Optional: notify success
        }
    } catch (e) {
        console.error("Sync error", e);
        setSyncError(t.syncFailedDesc);
    } finally {
        setIsSyncing(false);
    }
  };

  // Background Sync Interval
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
        if (!isSyncing && !syncError) {
            const stored = localStorage.getItem('pendingRegisters');
            if (stored && JSON.parse(stored).length > 0) {
                syncPendingData(true);
            }
        }
    }, 15000); 
    return () => clearInterval(interval);
  }, [isOnline, isSyncing, syncError]);

  // Auto-sync on connection restore
  useEffect(() => {
    if (isOnline && pendingSyncCount > 0 && !isSyncing) {
        syncPendingData(true);
    }
  }, [isOnline, pendingSyncCount]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const cycleStatus = (studentId: string) => {
    const current = attendance[studentId] || AttendanceStatus.PRESENT;
    let next: AttendanceStatus;
    if (current === AttendanceStatus.PRESENT) next = AttendanceStatus.ABSENT;
    else if (current === AttendanceStatus.ABSENT) next = AttendanceStatus.LATE;
    else next = AttendanceStatus.PRESENT;
    
    handleStatusChange(studentId, next);
  };

  const markAll = (status: AttendanceStatus) => {
    setAttendance(prev => {
      const next = { ...prev };
      students.forEach(s => {
        next[s.id] = status;
      });
      return next;
    });
  };

  const handleSubmit = () => {
    const classAttendance: Record<string, AttendanceStatus> = {};
    const recordsToSubmit: AttendanceRecord[] = [];
    const studentsToSubmit = allStudents.filter(s => currentClass?.students.includes(s.id));

    studentsToSubmit.forEach(s => {
      const status = attendance[s.id] || AttendanceStatus.PRESENT;
      classAttendance[s.id] = status;
      
      recordsToSubmit.push({
          id: `${s.id}-${date}`,
          studentId: s.id,
          date: date,
          status: status
      });
    });

    // 1. Always submit to Global State immediately so UI updates instantly
    onAttendanceSubmit(recordsToSubmit);
    localStorage.removeItem(`draft_${selectedClassId}_${date}`);

    // 2. If Offline or Network Fails, Queue it for "Sync"
    // (In this local-first app, onAttendanceSubmit handles the local storage, 
    // so we only strictly need the queue if we were trying to hit a real API. 
    // But to maintain the requested "Offline Mode" architecture:)
    if (!isOnline) {
        saveToOfflineQueue(classAttendance);
    } else {
        // If online, we assume success. In a real app with API, 
        // we'd wrap this in a try/catch and fallback to saveToOfflineQueue on error.
    }
    
    alert(`Attendance submitted successfully for ${currentClass?.name}.`);
  };

  const saveToOfflineQueue = (classAttendance: Record<string, AttendanceStatus>) => {
      const submission: PendingSubmission = {
          id: Date.now().toString(),
          classId: selectedClassId,
          date: date,
          attendance: classAttendance,
          timestamp: new Date().toISOString()
      };

      const stored = localStorage.getItem('pendingRegisters');
      const queue: PendingSubmission[] = stored ? JSON.parse(stored) : [];
      const filteredQueue = queue.filter(q => !(q.classId === selectedClassId && q.date === date));
      filteredQueue.push(submission);
      
      localStorage.setItem('pendingRegisters', JSON.stringify(filteredQueue));
      checkPendingSyncs();
  };

  const handleSync = () => {
    if (!isOnline) {
        alert("Still offline. Cannot sync.");
        return;
    }
    syncPendingData(false);
  };

  const getCardStyle = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case AttendanceStatus.ABSENT:
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case AttendanceStatus.LATE:
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-white border-gray-200 hover:bg-gray-50';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return <Check size={18} className="text-green-600" />;
      case AttendanceStatus.ABSENT: return <X size={18} className="text-red-600" />;
      case AttendanceStatus.LATE: return <Clock size={18} className="text-yellow-600" />;
      default: return null;
    }
  };

  const getDisplayName = (student: Student) => {
      return (lang === 'hi' && student.nameHi) ? student.nameHi : student.name;
  };

  const getDisplayGuardian = (student: Student) => {
      return (lang === 'hi' && student.guardianNameHi) ? student.guardianNameHi : student.guardianName;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Offline Sync Banner - Success/Info */}
      {pendingSyncCount > 0 && isOnline && !syncError && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <RefreshCw size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-blue-900">{t.syncReq}</h3>
                    <p className="text-sm text-blue-700">{pendingSyncCount} {t.syncDesc} (Auto-syncing...)</p>
                </div>
            </div>
            <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="whitespace-nowrap flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
            >
                {isSyncing ? (
                    <>
                        <RefreshCw className="animate-spin" size={16} />
                        Syncing...
                    </>
                ) : (
                    <>
                        <Wifi size={16} />
                        {t.sync}
                    </>
                )}
            </button>
          </div>
      )}

      {/* Sync Error Banner */}
      {syncError && isOnline && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
             <div className="flex items-center gap-3">
                 <div className="bg-red-100 p-2 rounded-full text-red-600">
                     <AlertOctagon size={20} />
                 </div>
                 <div>
                     <h3 className="font-semibold text-red-900">{t.syncFailed}</h3>
                     <p className="text-sm text-red-700">{syncError}</p>
                 </div>
             </div>
             <button 
                 onClick={handleSync}
                 disabled={isSyncing}
                 className="whitespace-nowrap flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-70"
             >
                 {isSyncing ? (
                     <>
                         <RefreshCw className="animate-spin" size={16} />
                         Retrying...
                     </>
                 ) : (
                     <>
                         <RefreshCw size={16} />
                         {t.retrySync}
                     </>
                 )}
             </button>
          </div>
      )}

      {/* Pending Offline Banner (When Offline) */}
      {pendingSyncCount > 0 && !isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-2 text-yellow-800 text-sm">
             <AlertTriangle size={16} />
             <span>{pendingSyncCount} {t.pendingUploads}</span>
          </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.dailyRegister}</h1>
            <p className="text-gray-500">{t.markAttendance} {date}</p>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <select 
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 flex-1 md:flex-none"
                >
                    {classes.map(c => (
                        <option key={c.id} value={c.id}>
                        {c.name.startsWith('Class ') ? c.name.replace('Class ', `${t.classLabel} `) : c.name}
                        </option>
                    ))}
                </select>
                <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 flex-1 md:flex-none"
                />
            </div>
        </div>

        {/* Filters and View Toggles */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder={t.searchRegister}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                 <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title={t.gridView}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title={t.listView}
                    >
                        <List size={18} />
                    </button>
                 </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Bulk Actions Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3 justify-between items-center">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                {students.length} {t.students} 
                {viewMode === 'grid' && (
                    <span className="hidden sm:inline text-xs font-normal text-gray-500 ml-2">({t.tapToMark})</span>
                )}
            </span>
            <div className="flex gap-2">
                <button 
                  onClick={() => markAll(AttendanceStatus.PRESENT)} 
                  className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors shadow-sm"
                >
                  {t.markAllPresent}
                </button>
                <button 
                  onClick={() => markAll(AttendanceStatus.ABSENT)} 
                  className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors shadow-sm"
                >
                  {t.markAllAbsent}
                </button>
                <button 
                  onClick={() => markAll(AttendanceStatus.LATE)} 
                  className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200 transition-colors shadow-sm"
                >
                  {t.markAllLate}
                </button>
            </div>
        </div>
        
        {/* Content Area */}
        {viewMode === 'list' ? (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium">{t.student}</th>
                    <th className="p-4 font-medium hidden sm:table-cell">{t.rollNo}</th>
                    <th className="p-4 font-medium text-center">{t.status}</th>
                    <th className="p-4 font-medium text-right">{t.actions}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {students.map((student, index) => {
                        const currentStatus = attendance[student.id] || AttendanceStatus.PRESENT;
                        const isPendingSync = pendingStudentIds.has(student.id);

                        return (
                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                            {student.photo ? <img src={student.photo} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">{student.name.charAt(0)}</div>}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{getDisplayName(student)}</div>
                                            <div className="text-xs text-gray-500">{t.guardian}: {getDisplayGuardian(student)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-500 hidden sm:table-cell">#{index + 1}</td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[currentStatus]}`}>
                                          {currentStatus}
                                      </span>
                                      {isPendingSync && (
                                        <div className="group relative">
                                          <CloudUpload size={16} className="text-yellow-500 animate-pulse" />
                                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Pending Sync
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleStatusChange(student.id, AttendanceStatus.PRESENT)}
                                            className={`p-2 rounded-lg transition-all ${currentStatus === AttendanceStatus.PRESENT ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleStatusChange(student.id, AttendanceStatus.ABSENT)}
                                            className={`p-2 rounded-lg transition-all ${currentStatus === AttendanceStatus.ABSENT ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            <X size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleStatusChange(student.id, AttendanceStatus.LATE)}
                                            className={`p-2 rounded-lg transition-all ${currentStatus === AttendanceStatus.LATE ? 'bg-yellow-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            <Clock size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                </table>
            </div>
        ) : (
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {students.map((student) => {
                    const currentStatus = attendance[student.id] || AttendanceStatus.PRESENT;
                    const isPendingSync = pendingStudentIds.has(student.id);
                    
                    return (
                        <div 
                            key={student.id}
                            onClick={() => cycleStatus(student.id)}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-95 flex flex-col items-center text-center gap-3 select-none ${getCardStyle(currentStatus)}`}
                        >
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-white shadow-sm overflow-hidden flex-shrink-0 border-2 border-white">
                                    {student.photo ? (
                                        <img src={student.photo} alt="" className="w-full h-full object-cover"/>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400 bg-gray-100">
                                            {student.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className={`absolute bottom-0 right-0 p-1 rounded-full bg-white shadow-sm border ${
                                    currentStatus === AttendanceStatus.PRESENT ? 'border-green-200' :
                                    currentStatus === AttendanceStatus.ABSENT ? 'border-red-200' :
                                    'border-yellow-200'
                                }`}>
                                    {getStatusIcon(currentStatus)}
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm leading-tight">{getDisplayName(student)}</h3>
                                <p className={`text-xs font-medium mt-1 uppercase tracking-wide
                                    ${currentStatus === AttendanceStatus.PRESENT ? 'text-green-700' : ''}
                                    ${currentStatus === AttendanceStatus.ABSENT ? 'text-red-700' : ''}
                                    ${currentStatus === AttendanceStatus.LATE ? 'text-yellow-700' : ''}
                                `}>
                                    {currentStatus}
                                </p>
                            </div>

                            {isPendingSync && (
                                <div className="absolute top-2 right-2">
                                     <CloudUpload size={14} className="text-yellow-500" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      <div className="flex justify-end pt-4 pb-8">
        <button 
            onClick={handleSubmit}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-transform transform active:scale-95 w-full md:w-auto justify-center bg-indigo-600 hover:bg-indigo-700`}
        >
            <Save size={24} />
            {isOnline ? t.submit : t.saveOffline}
        </button>
      </div>
    </div>
  );
};