import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Users, UserCheck, UserX, Clock, Activity, Calendar, CloudOff } from 'lucide-react';
import { generateDailySummary, generateOfflineSummary } from '../services/geminiService';
import { Language, AttendanceRecord, AttendanceStatus, Student } from '../types';
import { TRANSLATIONS } from '../translations';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

interface DashboardProps {
  totalStudents: number;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  lang: Language;
  isOnline: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ totalStudents, students, attendanceRecords, lang, isOnline }) => {
  const [summary, setSummary] = useState<string>("Loading insights...");
  const [trendView, setTrendView] = useState<'weekly' | 'monthly'>('weekly');
  const t = TRANSLATIONS[lang];

  // Calculate Today's Stats from attendanceRecords
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(r => r.date === today);

  // If no records for today, we show 0.
  const presentCount = todayRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
  const absentCount = todayRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
  const lateCount = todayRecords.filter(r => r.status === AttendanceStatus.LATE).length;

  useEffect(() => {
    const fetchSummary = async () => {
        if (totalStudents === 0) {
            setSummary(lang === 'en' ? "Welcome! Please add students to the system to begin tracking attendance." : "स्वागत है! उपस्थिति पर नज़र रखने के लिए कृपया सिस्टम में छात्रों को जोड़ें।");
            return;
        }
        
        const currentStats = { present: presentCount, absent: absentCount, late: lateCount };
        
        // If no attendance taken today yet
        if (presentCount === 0 && absentCount === 0 && lateCount === 0) {
           setSummary(lang === 'en' ? "No attendance recorded for today yet." : "आज के लिए अभी तक कोई उपस्थिति दर्ज नहीं की गई है।");
           return;
        }

        if (!isOnline) {
            // Use local fallback immediately if offline
            setSummary(generateOfflineSummary(currentStats));
            return;
        }

        try {
            const text = await generateDailySummary(currentStats);
            setSummary(text);
        } catch (e) {
            setSummary(generateOfflineSummary(currentStats));
        }
    };
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalStudents, lang, isOnline, presentCount, absentCount, lateCount]);

  // Generate Trend Data
  const trendData = useMemo(() => {
    // Helper to get past N days
    const getPastDays = (days: number) => {
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            result.push(d.toISOString().split('T')[0]);
        }
        return result;
    };

    const last7Days = getPastDays(7);
    
    return last7Days.map(dateStr => {
        const dayRecords = attendanceRecords.filter(r => r.date === dateStr);
        // Date formatting for X-Axis (e.g. "Mon" or "Oct 24")
        const dateObj = new Date(dateStr);
        const name = dateObj.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' });
        
        return {
            name,
            present: dayRecords.filter(r => r.status === AttendanceStatus.PRESENT).length,
            absent: dayRecords.filter(r => r.status === AttendanceStatus.ABSENT).length,
            late: dayRecords.filter(r => r.status === AttendanceStatus.LATE).length,
        };
    });
  }, [attendanceRecords, lang]);

  // Generate Class Breakdown Data
  const classBreakdownData = useMemo(() => {
     const breakdown: Record<string, { present: number, absent: number, late: number }> = {};
     
     const knownGrades: string[] = Array.from(new Set(students.map((s: Student) => s.grade)));
     knownGrades.forEach((g: string) => {
         breakdown[g] = { present: 0, absent: 0, late: 0 };
     });

     todayRecords.forEach(record => {
         const student = students.find(s => s.id === record.studentId);
         if (student) {
             const grade: string = student.grade;
             if (!breakdown[grade]) breakdown[grade] = { present: 0, absent: 0, late: 0 };
             
             if (record.status === AttendanceStatus.PRESENT) breakdown[grade].present++;
             else if (record.status === AttendanceStatus.ABSENT) breakdown[grade].absent++;
             else if (record.status === AttendanceStatus.LATE) breakdown[grade].late++;
         }
     });

     return Object.entries(breakdown).map(([name, stats]) => ({
         name,
         ...stats
     }));
  }, [attendanceRecords, students, todayRecords]);

  const displayData = trendView === 'weekly' ? trendData : trendData; 

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.schoolOverview}</h1>
          <p className="text-gray-500">{t.welcome}</p>
        </div>
        <div className={`mt-4 md:mt-0 px-4 py-2 rounded-lg border max-w-lg bg-indigo-50 border-indigo-100`}>
            <div className="flex items-start gap-2">
                <Activity className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm italic text-indigo-800">"{summary}"</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t.totalStudents} value={totalStudents} icon={<Users className="w-6 h-6 text-blue-600" />} colorClass="bg-blue-50" />
        <StatCard title={t.presentToday} value={presentCount} icon={<UserCheck className="w-6 h-6 text-green-600" />} colorClass="bg-green-50" />
        <StatCard title={t.absent} value={absentCount} icon={<UserX className="w-6 h-6 text-red-600" />} colorClass="bg-red-50" />
        <StatCard title={t.late} value={lateCount} icon={<Clock className="w-6 h-6 text-yellow-600" />} colorClass="bg-yellow-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">{t.trends}</h3>
            <div className="bg-gray-100 p-1 rounded-lg flex text-sm">
                <button 
                    onClick={() => setTrendView('weekly')}
                    className={`px-3 py-1 rounded-md transition-all ${trendView === 'weekly' ? 'bg-white shadow-sm text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    {t.weekly}
                </button>
                <button 
                    onClick={() => setTrendView('monthly')}
                    className={`px-3 py-1 rounded-md transition-all ${trendView === 'monthly' ? 'bg-white shadow-sm text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    {t.monthly}
                </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} allowDecimals={false} />
                <Tooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="present" fill="#4f46e5" radius={[4, 4, 0, 0]} name={t.presentToday} />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name={t.absent} />
                <Bar dataKey="late" fill="#eab308" radius={[4, 4, 0, 0]} name={t.late} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Classes Attention List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.focus}</h3>
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              {absentCount > 0 ? (
                 <div className="w-full text-left space-y-3">
                    <p className="text-sm text-gray-600 mb-2">{t.highAbsenceIn}</p>
                    {classBreakdownData.filter(c => c.absent > 0).map(c => (
                        <div key={c.name} className="flex justify-between items-center text-sm p-2 bg-red-50 rounded text-red-700">
                            <span className="font-semibold">{t.classLabel} {c.name}</span>
                            <span>{c.absent} {t.absent}</span>
                        </div>
                    ))}
                 </div>
              ) : totalStudents > 0 ? (
                <div className="text-green-600 text-sm">{t.noFocus}</div>
              ) : (
                <div className="text-gray-400 text-sm">Add students and attendance data to see insights here.</div>
              )}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
             <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1">
                {t.viewAnalysis} <Calendar size={14} />
             </button>
          </div>
        </div>
      </div>

      {/* Class Breakdown Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">{t.breakdown}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classBreakdownData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} allowDecimals={false} />
                <Tooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="present" stackId="a" fill="#10b981" name={t.presentToday} />
                <Bar dataKey="late" stackId="a" fill="#f59e0b" name={t.late} />
                <Bar dataKey="absent" stackId="a" fill="#ef4444" name={t.absent} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};