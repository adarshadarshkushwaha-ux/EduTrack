
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, UserCheck, Scan, Menu, X, CloudOff, GraduationCap, LogOut, Settings as SettingsIcon, Languages, School, Sparkles } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Register } from './components/Register';
import { Scanner } from './components/Scanner';
import { Interventions } from './components/Interventions';
import { StudentsList } from './components/StudentsList';
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { AICopilot } from './components/AICopilot';
import { buildDemoHistory, withRates } from './services/aiInsights';
import { NavItem, Student, ClassGroup, AppSettings, Language, AttendanceRecord, AttendanceStatus } from './types';
import { MOCK_STUDENTS, MOCK_CLASSES } from './constants';
import { TRANSLATIONS } from './translations';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Persistence Keys - Incremented to v3 to force load of new students with Hindi names
  const STORAGE_KEYS = {
    STUDENTS: 'eduTrack_students_v3',
    CLASSES: 'eduTrack_classes_v3',
    SETTINGS: 'eduTrack_settings_v3',
    LANG: 'eduTrack_language_v3',
    ATTENDANCE: 'eduTrack_attendance_v3'
  };

  // Initialize language from localStorage or default to 'en'
  const [language, setLanguage] = useState<Language>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.LANG);
        return (saved === 'en' || saved === 'hi') ? saved : 'en';
    } catch (e) {
        return 'en';
    }
  });

  // Initialize State from Local Storage or Constants with Error Handling
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : MOCK_STUDENTS;
    } catch (e) {
      console.error("Failed to load students from storage:", e);
      return MOCK_STUDENTS;
    }
  });

  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return saved ? JSON.parse(saved) : MOCK_CLASSES;
    } catch (e) {
      console.error("Failed to load classes from storage:", e);
      return MOCK_CLASSES;
    }
  });

  // Attendance History State
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load attendance from storage:", e);
      return [];
    }
  });
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : {
          schoolName: 'Rural High School',
          lateThreshold: '08:30',
          enableAutoExcuse: false,
          autoExcuseKeywords: ['sick', 'doctor', 'fever', 'emergency']
      };
    } catch (e) {
      return {
          schoolName: 'Rural High School',
          lateThreshold: '08:30',
          enableAutoExcuse: false,
          autoExcuseKeywords: ['sick', 'doctor', 'fever', 'emergency']
      };
    }
  });

  const t = TRANSLATIONS[language];

  // Persist Data Effects with Error Handling
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error("Failed to save students to storage (Quota exceeded?):", e);
    }
  }, [students, STORAGE_KEYS.STUDENTS]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    } catch (e) {
      console.error("Failed to save classes to storage:", e);
    }
  }, [classes, STORAGE_KEYS.CLASSES]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
    } catch (e) {
      console.error("Failed to save attendance to storage:", e);
    }
  }, [attendanceRecords, STORAGE_KEYS.ATTENDANCE]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings to storage:", e);
    }
  }, [settings, STORAGE_KEYS.SETTINGS]);

  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_KEYS.LANG, language);
    } catch (e) {
        console.error("Failed to save language preference:", e);
    }
  }, [language, STORAGE_KEYS.LANG]);

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  /**
   * Helper to ensure a student is correctly assigned to a ClassGroup based on their grade.
   * Creates the ClassGroup if it doesn't exist.
   */
  const syncStudentToClass = (student: Student, currentClasses: ClassGroup[]): ClassGroup[] => {
    const studentGrade = student.grade.toUpperCase().trim();
    const normalizedStudentGrade = studentGrade.replace(/^CLASS\s+/i, '');

    let newClasses = currentClasses.map(c => ({
        ...c,
        students: c.students.filter(id => id !== student.id)
    }));

    const existingClassIndex = newClasses.findIndex(c => {
         const normalizedClassName = c.name.toUpperCase().replace(/^CLASS\s+/i, '').trim();
         return normalizedClassName === normalizedStudentGrade;
    });

    if (existingClassIndex >= 0) {
        newClasses[existingClassIndex].students.push(student.id);
    } else {
        const newClassId = `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        newClasses.push({
            id: newClassId,
            name: `Class ${normalizedStudentGrade}`,
            teacher: 'Unassigned',
            students: [student.id]
        });
    }

    return newClasses.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => {
      if (s.id === updatedStudent.id) {
        // Preserve the authoritative attendanceRate from state to prevent stale overwrites from edit forms
        return { ...updatedStudent, attendanceRate: s.attendanceRate };
      }
      return s;
    }));
    setClasses(prev => syncStudentToClass(updatedStudent, prev));
  };

  const handleAddStudent = (newStudent: Student) => {
    setStudents(prev => [...prev, newStudent]);
    setClasses(prev => syncStudentToClass(newStudent, prev));
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setClasses(prev => prev.map(c => ({
        ...c,
        students: c.students.filter(id => id !== studentId)
    })));
  };

  const handleBulkAddStudents = (newStudents: Student[]) => {
    setStudents(prev => [...prev, ...newStudents]);
    setClasses(prev => {
        let tempClasses = [...prev];
        newStudents.forEach(s => {
            tempClasses = syncStudentToClass(s, tempClasses);
        });
        return tempClasses;
    });
  };

  const handleAssignClass = (studentId: string, newClassId: string) => {
    setClasses(prevClasses => prevClasses.map(c => {
      if (c.id === newClassId) {
        return c.students.includes(studentId) 
          ? c 
          : { ...c, students: [...c.students, studentId] };
      } else {
        return c.students.includes(studentId) 
          ? { ...c, students: c.students.filter(id => id !== studentId) } 
          : c;
      }
    }));

    const targetClass = classes.find(c => c.id === newClassId);
    if (targetClass) {
      const derivedGrade = targetClass.name.replace(/^Class\s+/i, '');
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, grade: derivedGrade } : s));
    }
  };

  const handleAttendanceSubmit = (newRecords: AttendanceRecord[]) => {
    // 1. Calculate updated history based on current state
    // We filter out old records for the same student/date to allow updates
    const cleanPrev = attendanceRecords.filter(p => 
      !newRecords.some(n => n.studentId === p.studentId && n.date === p.date)
    );
    
    const updatedRecords = [...cleanPrev, ...newRecords];
    setAttendanceRecords(updatedRecords);

    // 2. Update individual student attendance rates
    // This optimization ensures stats are always fresh without full re-renders calculating on the fly
    const affectedStudentIds = new Set(newRecords.map(r => r.studentId));
    
    setStudents(prevStudents => {
      return prevStudents.map(student => {
        if (affectedStudentIds.has(student.id)) {
          const studentHistory = updatedRecords.filter(r => r.studentId === student.id);
          
          const totalSessions = studentHistory.length;
          
          // If no history, assume 100% (default state) or maintain current
          if (totalSessions === 0) return student;

          // Refined Calculation:
          // Rate = (Present + Late) / (Total - Excused) * 100
          // Excused absences are removed from the denominator (neutral impact)
          
          const excusedCount = studentHistory.filter(r => r.status === AttendanceStatus.EXCUSED).length;
          const effectiveTotal = totalSessions - excusedCount;
          
          let newRate = 100;

          if (effectiveTotal > 0) {
              const presentCount = studentHistory.filter(r => 
                r.status === AttendanceStatus.PRESENT || 
                r.status === AttendanceStatus.LATE
              ).length;
              
              newRate = Math.round((presentCount / effectiveTotal) * 100);
          } else {
              // If all sessions are excused, or effective total is 0, we default to 100%
              // This gives the student the benefit of the doubt
              newRate = 100;
          }
          
          return { ...student, attendanceRate: newRate };
        }
        return student;
      });
    });
  };

  const handleSeedDemo = () => {
    const history = buildDemoHistory(students);
    setAttendanceRecords(history);
    setStudents(prev => withRates(prev, history));
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', label: t.overview, icon: LayoutDashboard },
    { id: 'students', label: t.students, icon: GraduationCap },
    { id: 'register', label: t.attendance, icon: UserCheck },
    { id: 'scanner', label: t.scanner, icon: Scan },
    { id: 'interventions', label: t.interventions, icon: Users },
    { id: 'copilot', label: t.copilot, icon: Sparkles },
    { id: 'settings', label: t.settings, icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard totalStudents={students.length} students={students} attendanceRecords={attendanceRecords} lang={language} isOnline={isOnline} />;
      case 'students': 
        return (
          <StudentsList 
            students={students} 
            classes={classes}
            onUpdateStudent={handleUpdateStudent} 
            onAssignClass={handleAssignClass}
            onAddStudent={handleAddStudent}
            onBulkAddStudents={handleBulkAddStudents}
            onDeleteStudent={handleDeleteStudent}
            lang={language}
          />
        );
      case 'register': 
        return (
            <Register 
                students={students} 
                classes={classes} 
                isOnline={isOnline} 
                lang={language}
                onAttendanceSubmit={handleAttendanceSubmit} 
                attendanceRecords={attendanceRecords}
            />
        );
      case 'scanner': return <Scanner isOnline={isOnline} lang={language} />;
      case 'interventions': return <Interventions students={students} lang={language} isOnline={isOnline} />;
      case 'copilot': return <AICopilot students={students} attendanceRecords={attendanceRecords} lang={language} isOnline={isOnline} onSeedDemo={handleSeedDemo} />;
      case 'settings': return <Settings settings={settings} onSave={handleUpdateSettings} lang={language} />;
      default: return <Dashboard totalStudents={students.length} students={students} attendanceRecords={attendanceRecords} lang={language} isOnline={isOnline} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} lang={language} onToggleLanguage={toggleLanguage} settings={settings} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-indigo-900 text-white shadow-xl fixed h-full z-10">
        <div className="p-6 border-b border-indigo-800 flex items-center gap-3">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
          ) : (
            <div className="w-10 h-10 bg-indigo-700 rounded-lg flex items-center justify-center shrink-0">
                <School size={24} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight">EduTrack</h1>
            <p className="text-indigo-300 text-[10px] mt-0.5">{language === 'en' ? 'Smart School System' : 'स्मार्ट स्कूल सिस्टम'}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id 
                    ? 'bg-indigo-700 text-white shadow-lg translate-x-1' 
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-indigo-800 bg-indigo-950 space-y-4">
            <button
                onClick={toggleLanguage}
                className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-indigo-200 hover:bg-indigo-900 hover:text-white transition-colors"
            >
                <Languages size={18} />
                <span className="font-medium text-sm">{language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}</span>
            </button>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-red-300 hover:bg-indigo-900 hover:text-red-200 transition-colors"
            >
              <LogOut size={18} />
              <span className="font-medium text-sm">{t.signOut}</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-indigo-300 px-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                {isOnline ? t.online : t.offline}
            </div>
        </div>
      </aside>

      {/* Mobile Header & Overlay */}
      <div className={`md:hidden fixed top-0 left-0 w-full z-20 bg-indigo-900 text-white p-4 flex justify-between items-center shadow-md`}>
        <div className="flex items-center gap-2">
            {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain bg-white rounded p-0.5" />
            )}
            <h1 className="font-bold text-lg">EduTrack</h1>
        </div>
        <div className="flex items-center gap-3">
             <button onClick={toggleLanguage} className="bg-indigo-800 hover:bg-indigo-700 p-1.5 rounded text-xs px-3 font-semibold transition-colors border border-indigo-700">
                 {language === 'en' ? 'HI' : 'EN'}
             </button>
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X /> : <Menu />}
             </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-indigo-900 pt-16 flex flex-col">
          <nav className="p-4 space-y-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-lg transition-colors ${
                    activeTab === item.id ? 'bg-indigo-700' : 'text-indigo-200'
                  }`}
                >
                  <Icon size={24} />
                  <span className="font-medium text-lg">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-indigo-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-3 px-4 py-4 rounded-lg text-red-200 hover:bg-indigo-800 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">{t.signOut}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 mt-16 md:mt-0 overflow-y-auto">
        {!isOnline && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r shadow-sm flex items-center gap-3">
                <CloudOff className="text-yellow-600" />
                <div>
                    <h3 className="text-sm font-bold text-yellow-800">You are offline</h3>
                    <p className="text-xs text-yellow-700">Changes will be saved locally and synced when connection is restored. AI features are unavailable.</p>
                </div>
            </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;