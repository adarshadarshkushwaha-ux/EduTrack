import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Send, AlertTriangle, Database, Bot, User } from 'lucide-react';
import { AttendanceRecord, Language, Student } from '../types';
import { askCopilot } from '../services/geminiService';
import { buildContext, offlineAnswer, predictRisk } from '../services/aiInsights';

interface Props {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  lang: Language;
  isOnline: boolean;
  onSeedDemo: () => void;
}
type Msg = { role: 'user' | 'ai'; text: string };

export const AICopilot: React.FC<Props> = ({ students, attendanceRecords, lang, isOnline, onSeedDemo }) => {
  const hi = lang === 'hi';
  const risks = useMemo(() => predictRisk(students, attendanceRecords), [students, attendanceRecords]);
  const watchlist = risks.filter(r => r.level !== 'low').slice(0, 6);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const ask = async (q: string) => {
    if (!q.trim() || busy) return;
    setMsgs(m => [...m, { role: 'user', text: q }]); setInput(''); setBusy(true);
    let answer: string;
    try { answer = isOnline ? await askCopilot(q, buildContext(students, attendanceRecords, risks), lang) : offlineAnswer(risks, lang); }
    catch { answer = offlineAnswer(risks, lang); }
    setMsgs(m => [...m, { role: 'ai', text: answer }]); setBusy(false);
  };

  const chips = hi
    ? ['किस कक्षा पर ध्यान देना चाहिए?', 'सबसे अधिक जोखिम में कौन है?', 'प्रधानाचार्य के लिए सारांश लिखें']
    : ['Which class needs attention?', 'Who is at highest risk this week?', 'Write a summary for the principal'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: 'linear-gradient(135deg,#4c3fd6,#1fb6c9)' }}>
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">{hi ? 'एआई सहायक' : 'AI Copilot'}</h1>
            <p className="text-white/80 text-sm">{hi ? 'अपने स्कूल के डेटा से सवाल पूछें और जोखिम की भविष्यवाणी देखें।' : 'Ask questions about your school data and see who is likely to fall behind.'}</p>
          </div>
        </div>
        <button onClick={onSeedDemo} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold border border-white/30">
          <Database size={16} /> {hi ? 'डेमो डेटा लोड करें' : 'Load 4-week demo data'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-[520px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.length === 0 && (
              <div className="text-center text-gray-500 text-sm pt-10">
                <Bot className="w-10 h-10 mx-auto mb-2 text-indigo-500" />
                {hi ? 'कोई सवाल चुनें या खुद लिखें।' : 'Pick a question or type your own.'}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {chips.map(c => <button key={c} onClick={() => ask(c)} className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50">{c}</button>)}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'ai' && <Bot className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />}
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.role === 'user' ? 'text-white bg-indigo-600' : 'bg-indigo-50 text-gray-800'}`}>{m.text}</div>
                {m.role === 'user' && <User className="w-6 h-6 text-gray-400 shrink-0 mt-1" />}
              </div>
            ))}
            {busy && <p className="text-xs text-gray-400 animate-pulse">{hi ? 'सोच रहा है...' : 'Thinking...'}</p>}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask(input)}
              placeholder={hi ? 'अपना सवाल लिखें...' : 'Ask about attendance...'} className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={() => ask(input)} disabled={busy} className="bg-indigo-600 text-white px-4 rounded-lg disabled:opacity-60"><Send size={18} /></button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" />{hi ? 'जोखिम वॉचलिस्ट' : 'Risk watchlist'}</h2>
          <p className="text-xs text-gray-500 mb-4">{hi ? 'हाल की उपस्थिति और रुझान से गणना।' : 'Scored from attendance rate, recent absences, streaks and trend.'}</p>
          {watchlist.length === 0 && <p className="text-sm text-gray-400">{hi ? 'कोई जोखिम नहीं मिला। डेमो डेटा लोड करें।' : 'No risks found. Take attendance or load demo data.'}</p>}
          <div className="space-y-3">
            {watchlist.map(r => (
              <div key={r.student.id} className="p-3 rounded-lg border border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{hi && r.student.nameHi ? r.student.nameHi : r.student.name} <span className="text-gray-400 font-normal">({r.student.grade})</span></span>
                  <span className={r.level === 'high' ? 'text-red-600 font-bold' : 'text-yellow-600 font-bold'}>{r.score}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded mt-1.5"><div className="h-full rounded" style={{ width: `${r.score}%`, background: r.level === 'high' ? '#ef4444' : '#eab308' }} /></div>
                <p className="text-xs text-gray-500 mt-1.5">{r.reasons.join(' | ') || '-'}</p>
                <button onClick={() => ask(`Write a short, kind action plan for ${r.student.name} (class ${r.student.grade}) who has these risk flags: ${r.reasons.join('; ')}. Include one step for the teacher and one for the parent.`)}
                  className="text-xs text-indigo-600 font-medium mt-1.5 hover:underline">{hi ? 'कार्य योजना बनाएं' : 'Generate action plan'}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
