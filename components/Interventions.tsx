import React, { useState } from 'react';
import { MessageSquare, RefreshCw, Send, AlertTriangle } from 'lucide-react';
import { generateParentMessage, generateOfflineMessage } from '../services/geminiService';
import { Student, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface InterventionsProps {
  students: Student[];
  lang: Language;
  isOnline: boolean;
}

export const Interventions: React.FC<InterventionsProps> = ({ students, lang, isOnline }) => {
  // Filter students with low attendance (Updated to 75% criteria)
  const atRiskStudents = students.filter(s => s.attendanceRate < 75);
  
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  
  const t = TRANSLATIONS[lang];

  const getDisplayName = (student: Student) => {
    return (lang === 'hi' && student.nameHi) ? student.nameHi : student.name;
  };

  const getDisplayGuardian = (student: Student) => {
    return (lang === 'hi' && student.guardianNameHi) ? student.guardianNameHi : student.guardianName;
  };

  const handleGenerateMessage = async (studentId: string) => {
    setGeneratingFor(studentId);
    
    const student = atRiskStudents.find(s => s.id === studentId);
    if (!student) {
        setGeneratingFor(null);
        return;
    }

    // Simulate days absent based on rate
    const daysAbsent = Math.floor((100 - student.attendanceRate) / 5); 
    
    if (!isOnline) {
        // Use local fallback immediately
        setTimeout(() => {
            const msg = generateOfflineMessage(student.name, daysAbsent, student.guardianName);
            setMessages(prev => ({ ...prev, [studentId]: msg }));
            setGeneratingFor(null);
        }, 500); // Small delay to simulate processing feel
        return;
    }

    const msg = await generateParentMessage(student.name, daysAbsent, student.guardianName);
    setMessages(prev => ({ ...prev, [studentId]: msg }));
    setGeneratingFor(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.studentInterventions}</h1>
      </div>

      <div className="grid gap-6">
        {atRiskStudents.map(student => (
          <div key={student.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 flex flex-col items-center md:items-start min-w-[150px]">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xl mb-2">
                {student.attendanceRate}%
              </div>
              <h3 className="font-bold text-gray-900">{getDisplayName(student)}</h3>
              <p className="text-sm text-gray-500">{student.grade}</p>
              <div className="mt-2 text-xs flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded">
                <AlertTriangle size={12} />
                {t.atRisk}
              </div>
            </div>

            <div className="flex-grow space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">{t.guardianContact}</h4>
                  <span className="text-xs bg-white border px-2 py-0.5 rounded text-gray-600">{getDisplayGuardian(student)}</span>
                </div>
                <p className="text-sm text-gray-600 font-mono">{student.guardianContact}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">{t.messageDraft}</label>
                    {messages[student.id] && (
                         <button 
                         onClick={() => handleGenerateMessage(student.id)}
                         className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                       >
                         <RefreshCw size={12} /> {t.regenerate}
                       </button>
                    )}
                </div>
                
                {messages[student.id] ? (
                   <div className="relative">
                       <textarea 
                        className="w-full p-3 border border-indigo-200 rounded-lg bg-indigo-50 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                        value={messages[student.id]}
                        readOnly
                       />
                       <button className="absolute bottom-3 right-3 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 shadow-sm" title="Send SMS">
                           <Send size={16} />
                       </button>
                   </div>
                ) : (
                    <button 
                        onClick={() => handleGenerateMessage(student.id)}
                        disabled={generatingFor === student.id}
                        className={`w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-all 
                        ${generatingFor === student.id
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                            : 'border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-gray-50'
                        }`}
                    >
                        {generatingFor === student.id ? (
                            <>
                                <RefreshCw className="animate-spin w-6 h-6" />
                                <span className="text-sm">{t.drafting}</span>
                            </>
                        ) : (
                            <>
                                <MessageSquare className="w-6 h-6" />
                                <span className="text-sm font-medium">{t.genMessage}</span>
                            </>
                        )}
                    </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {atRiskStudents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
             <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-green-600 w-8 h-8" />
             </div>
             <h3 className="text-lg font-medium text-gray-900">No students at risk</h3>
             <p className="text-gray-500 mt-1">Great job! All students have attendance above 75%.</p>
          </div>
        )}
      </div>
    </div>
  );
};