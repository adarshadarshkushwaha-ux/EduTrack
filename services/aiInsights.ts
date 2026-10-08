import { AttendanceRecord, AttendanceStatus, Student } from '../types';

export interface RiskInfo { student: Student; score: number; level: 'high' | 'medium' | 'low'; reasons: string[]; }

const isoDaysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };

// Local risk model: overall rate + recent absences + trend vs the previous 2 weeks + absence streak + lates.
export function predictRisk(students: Student[], records: AttendanceRecord[]): RiskInfo[] {
  const recentFrom = isoDaysAgo(14), priorFrom = isoDaysAgo(28);
  const absRate = (rs: AttendanceRecord[]) => rs.length ? rs.filter(r => r.status === AttendanceStatus.ABSENT).length / rs.length : 0;
  return students.map(student => {
    const mine = records.filter(r => r.studentId === student.id).sort((a, b) => a.date.localeCompare(b.date));
    const recent = mine.filter(r => r.date >= recentFrom);
    const prior = mine.filter(r => r.date >= priorFrom && r.date < recentFrom);
    const lates = recent.filter(r => r.status === AttendanceStatus.LATE).length;
    let streak = 0;
    for (let i = mine.length - 1; i >= 0 && mine[i].status === AttendanceStatus.ABSENT; i--) streak++;
    const trend = absRate(recent) - absRate(prior);
    const score = Math.max(0, Math.min(100, Math.round((100 - student.attendanceRate) * 0.9 + absRate(recent) * 30 + lates * 2 + streak * 8 + Math.max(trend, 0) * 20)));
    const reasons: string[] = [];
    if (student.attendanceRate < 75) reasons.push(`Overall attendance ${student.attendanceRate}%`);
    if (streak >= 2) reasons.push(`${streak} absences in a row`);
    if (trend > 0.15) reasons.push('Absences rising vs previous 2 weeks');
    if (lates >= 3) reasons.push(`${lates} late arrivals recently`);
    return { student, score, level: score >= 45 ? 'high' : score >= 20 ? 'medium' : 'low', reasons } as RiskInfo;
  }).sort((a, b) => b.score - a.score);
}

// Compact data summary sent to the LLM so answers are grounded in real attendance data.
export function buildContext(students: Student[], records: AttendanceRecord[], risks: RiskInfo[]): string {
  const today = records.filter(r => r.date === isoDaysAgo(0));
  const count = (s: AttendanceStatus) => today.filter(r => r.status === s).length;
  const grades = Array.from(new Set(students.map(s => s.grade))).map(g => {
    const m = students.filter(s => s.grade === g);
    return `${g}: ${m.length} students, average attendance ${Math.round(m.reduce((a, s) => a + s.attendanceRate, 0) / m.length)}%`;
  });
  return [
    `Total students: ${students.length}`,
    `Today: present ${count(AttendanceStatus.PRESENT)}, absent ${count(AttendanceStatus.ABSENT)}, late ${count(AttendanceStatus.LATE)}`,
    'Classes:', ...grades,
    'Highest-risk students:',
    ...risks.slice(0, 8).map(r => `${r.student.name} (class ${r.student.grade}, attendance ${r.student.attendanceRate}%, risk ${r.score}/100, guardian ${r.student.guardianName}): ${r.reasons.join('; ') || 'no flags'}`)
  ].join('\n');
}

export function offlineAnswer(risks: RiskInfo[], lang: 'en' | 'hi'): string {
  const top = risks.filter(r => r.level !== 'low').slice(0, 5);
  if (!top.length) return lang === 'hi' ? 'अभी कोई छात्र जोखिम में नहीं है।' : 'No students are currently at risk.';
  return (lang === 'hi' ? 'ऑफ़लाइन मोड - सबसे अधिक जोखिम:\n' : 'Offline mode - highest risk:\n') +
    top.map(r => `${r.student.name} (${r.student.grade}) - ${r.score}/100`).join('\n');
}

// Realistic 4-week history so the dashboard, risk model and AI can be demoed instantly.
export function buildDemoHistory(students: Student[]): AttendanceRecord[] {
  let seed = 42; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const out: AttendanceRecord[] = [];
  for (let d = 27; d >= 0; d--) {
    const day = new Date(); day.setDate(day.getDate() - d);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    const date = day.toISOString().split('T')[0];
    students.forEach((s, i) => {
      const p = i % 7 === 3 ? 0.4 : i % 5 === 1 ? 0.15 : 0.04, x = rnd();
      out.push({ id: `demo_${s.id}_${date}`, studentId: s.id, date, status: x < p ? AttendanceStatus.ABSENT : x < p + 0.06 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT });
    });
  }
  return out;
}

export function withRates(students: Student[], records: AttendanceRecord[]): Student[] {
  return students.map(s => {
    const mine = records.filter(r => r.studentId === s.id && r.status !== AttendanceStatus.EXCUSED);
    const ok = mine.filter(r => r.status !== AttendanceStatus.ABSENT).length;
    return { ...s, attendanceRate: mine.length ? Math.round(ok / mine.length * 100) : 100 };
  });
}
