
import React, { useState, useMemo, useRef } from 'react';
import { Search, Filter, Plus, Edit2, Phone, User, X, Save, GraduationCap, Upload, FileText, AlertCircle, Check, ArrowUpDown, Camera, Trash2, AlertTriangle } from 'lucide-react';
import { Student, ClassGroup, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface StudentsListProps {
  students: Student[];
  classes: ClassGroup[];
  onUpdateStudent: (student: Student) => void;
  onAssignClass: (studentId: string, classId: string) => void;
  onAddStudent: (student: Student) => void;
  onBulkAddStudents: (students: Student[]) => void;
  onDeleteStudent: (studentId: string) => void;
  lang: Language;
}

export const StudentsList: React.FC<StudentsListProps> = ({ 
  students, 
  classes, 
  onUpdateStudent, 
  onAssignClass, 
  onAddStudent,
  onBulkAddStudents,
  onDeleteStudent,
  lang
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [sortOption, setSortOption] = useState('name-asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [classInput, setClassInput] = useState('');
  const [sectionInput, setSectionInput] = useState('');
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Bulk Import State
  const [bulkData, setBulkData] = useState('');
  const [parsedBulkStudents, setParsedBulkStudents] = useState<Student[]>([]);
  
  const t = TRANSLATIONS[lang];

  // Computed Values
  const filteredAndSortedStudents = useMemo(() => {
    // 1. Filter
    const filtered = students.filter(student => {
      const term = searchTerm.toLowerCase();
      // Check both English and Hindi names if available
      const nameMatch = student.name.toLowerCase().includes(term) || 
                        (student.nameHi && student.nameHi.toLowerCase().includes(term));
      
      const guardianMatch = student.guardianName.toLowerCase().includes(term) ||
                            (student.guardianNameHi && student.guardianNameHi.toLowerCase().includes(term));
                            
      const matchesSearch = nameMatch || guardianMatch || student.grade.toLowerCase().includes(term);
      
      const matchesClass = selectedClassFilter === 'All' || student.grade === selectedClassFilter;
      return matchesSearch && matchesClass;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'attendance-desc':
          return b.attendanceRate - a.attendanceRate;
        case 'attendance-asc':
          return a.attendanceRate - b.attendanceRate;
        case 'name-asc':
        default:
          const nameA = (lang === 'hi' && a.nameHi) ? a.nameHi : a.name;
          const nameB = (lang === 'hi' && b.nameHi) ? b.nameHi : b.name;
          return nameA.localeCompare(nameB);
      }
    });
  }, [students, searchTerm, selectedClassFilter, sortOption, lang]);

  const uniqueGrades = useMemo(() => {
    // Collect all unique grades from students
    const grades = Array.from(new Set(students.map(s => s.grade)));
    return ['All', ...grades.sort()];
  }, [students]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      nameHi: '',
      guardianName: '',
      guardianNameHi: '',
      guardianContact: '',
      photo: undefined,
    });
    setClassInput('');
    setSectionInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    
    // Parse grade (e.g. "5A") into Class and Section
    // Standardize parsing to handle optional spaces
    const match = student.grade.match(/^(\d+)([a-zA-Z]+)$/) || student.grade.match(/^(\d+)\s+([a-zA-Z]+)$/);
    if (match) {
        setClassInput(match[1]);
        setSectionInput(match[2]);
    } else {
        // Fallback for non-standard grades
        setClassInput(student.grade);
        setSectionInput('');
    }
    
    setIsModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.guardianName) return; // Simple validation

    const constructedGrade = `${classInput.trim()}${sectionInput.trim()}`.toUpperCase();

    if (editingStudent) {
      // Edit Mode
      const updated: Student = { 
        ...editingStudent, 
        ...formData as Student,
        grade: constructedGrade
      };
      // App.tsx logic will handle syncing this student to the correct ClassGroup
      onUpdateStudent(updated);
    } else {
      // Add Mode
      const newId = `s${Date.now()}`;
      const newStudent: Student = {
        id: newId,
        name: formData.name!,
        nameHi: formData.nameHi,
        grade: constructedGrade,
        guardianName: formData.guardianName!,
        guardianNameHi: formData.guardianNameHi,
        guardianContact: formData.guardianContact || '',
        attendanceRate: 100, // New students start with 100%
        photo: formData.photo
      };
      
      // App.tsx logic will handle creating the ClassGroup if needed and assigning
      onAddStudent(newStudent);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (studentToDelete) {
        onDeleteStudent(studentToDelete.id);
        setStudentToDelete(null);
    }
  };

  const handleParseBulk = () => {
    const rows = bulkData.split('\n');
    const parsed: Student[] = [];
    
    rows.forEach((row, index) => {
      if (!row.trim()) return;
      const parts = row.split(',').map(s => s.trim());
      
      // Expect format: Name, Grade, Guardian, Contact
      if (parts.length >= 3) {
        parsed.push({
          id: `bulk-${Date.now()}-${index}`,
          name: parts[0],
          grade: parts[1],
          guardianName: parts[2],
          guardianContact: parts[3] || '',
          attendanceRate: 100
        });
      }
    });
    
    setParsedBulkStudents(parsed);
  };

  const handleBulkImport = () => {
    onBulkAddStudents(parsedBulkStudents);
    setParsedBulkStudents([]);
    setBulkData('');
    setIsBulkModalOpen(false);
    alert(`Successfully imported ${parsedBulkStudents.length} students. Classes will be auto-created.`);
  };

  const getDisplayName = (student: Student) => {
      return (lang === 'hi' && student.nameHi) ? student.nameHi : student.name;
  };

  const getDisplayGuardian = (student: Student) => {
      return (lang === 'hi' && student.guardianNameHi) ? student.guardianNameHi : student.guardianName;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.manageStudents}</h1>
          <p className="text-gray-500">{t.dirDesc}</p>
        </div>
        <div className="flex gap-2">
            <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
            <Upload size={20} />
            {t.bulkAdd}
            </button>
            <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
            <Plus size={20} />
            {t.addStudent}
            </button>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            {/* Class Filter */}
            <div className="flex items-center gap-2 min-w-[180px]">
                <Filter className="text-gray-400 w-5 h-5" />
                <select 
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    {uniqueGrades.map(grade => (
                    <option key={grade} value={grade}>{grade === 'All' ? t.filterClass : `${t.classLabel} ${grade}`}</option>
                    ))}
                </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 min-w-[200px]">
                <ArrowUpDown className="text-gray-400 w-5 h-5" />
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <option value="name-asc">{t.sortName}</option>
                    <option value="attendance-desc">{t.sortAttHigh}</option>
                    <option value="attendance-asc">{t.sortAttLow}</option>
                </select>
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">{t.studentInfo}</th>
                <th className="p-4 font-medium">{t.classGrade}</th>
                <th className="p-4 font-medium">{t.guardianDetails}</th>
                <th className="p-4 font-medium text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedStudents.length > 0 ? (
                filteredAndSortedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden border border-indigo-200">
                           {student.photo ? (
                                <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                           ) : (
                                student.name.charAt(0)
                           )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{getDisplayName(student)}</div>
                          <div className="text-xs text-gray-500">ID: {student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {student.grade}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900">{getDisplayGuardian(student)}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Phone size={12} />
                        {student.guardianContact}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button 
                                onClick={() => handleOpenEdit(student)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title={t.editDetails}
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => setStudentToDelete(student)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title={t.deleteStudent}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No students found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="text-red-600 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t.deleteConfirmTitle}</h3>
                    <p className="text-gray-500 text-sm mb-6">{t.deleteConfirmDesc}</p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setStudentToDelete(null)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button 
                            onClick={handleDeleteConfirm}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm"
                        >
                            {t.confirmDelete}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                {editingStudent ? <Edit2 size={18} /> : <Plus size={18} />}
                {editingStudent ? t.editStudent : t.addStudent}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
                    {/* Avatar Container */}
                    <div className="w-28 h-28 rounded-full shadow-lg border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden relative">
                        {formData.photo ? (
                            <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            // Distinct Placeholder: Filled silhouette on generic background
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                <User className="w-16 h-16" fill="currentColor" />
                            </div>
                        )}
                    </div>
                    
                    {/* Distinct Upload Button */}
                    <div className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 transition-colors shadow-md border-2 border-white">
                        <Camera size={18} />
                    </div>
                </div>
                <button 
                  onClick={() => photoInputRef.current?.click()}
                  className="text-sm text-indigo-600 font-medium mt-3 hover:text-indigo-800 hover:underline"
                >
                    {formData.photo ? t.tapToChange : t.studentPhoto}
                </button>
                <input 
                    type="file" 
                    ref={photoInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input 
                    type="text" 
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Aarav Patel"
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullNameHi}</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input 
                    type="text" 
                    value={formData.nameHi || ''}
                    onChange={e => setFormData({...formData, nameHi: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. आरव पटेल"
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.classLabel}</label>
                    <div className="relative">
                        <GraduationCap className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={classInput}
                          onChange={e => setClassInput(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="e.g. 5"
                        />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.section}</label>
                    <input
                      type="text"
                      value={sectionInput}
                      onChange={e => setSectionInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. A"
                    />
                  </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">System will attempt to match Class + Section (e.g. 5A) to existing class groups.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.guardian}</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input 
                    type="text" 
                    value={formData.guardianName || ''}
                    onChange={e => setFormData({...formData, guardianName: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Vihaan Patel"
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.guardianNameHi}</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input 
                    type="text" 
                    value={formData.guardianNameHi || ''}
                    onChange={e => setFormData({...formData, guardianNameHi: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. विहान पटेल"
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.contactNumber}</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input 
                    type="text" 
                    value={formData.guardianContact || ''}
                    onChange={e => setFormData({...formData, guardianContact: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="+91 98765 43210"
                    />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm flex items-center gap-2"
              >
                <Save size={18} />
                {t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Upload size={18} />
                {t.bulkAdd}
              </h3>
              <button 
                onClick={() => {
                    setIsBulkModalOpen(false);
                    setBulkData('');
                    setParsedBulkStudents([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
                {!parsedBulkStudents.length ? (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100">
                            <div className="flex items-center gap-2 font-semibold mb-1">
                                <AlertCircle size={16} />
                                {t.instructions}
                            </div>
                            <p>Paste your CSV data below. Each line represents one student.</p>
                            <p className="mt-2 font-mono bg-blue-100 p-2 rounded">Name, Grade, Guardian Name, Guardian Contact</p>
                            <p className="mt-2 text-xs opacity-80">Example: John Doe, 5A, Jane Doe, +91 9876543210</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.pasteCsv}</label>
                            <textarea 
                                value={bulkData}
                                onChange={(e) => setBulkData(e.target.value)}
                                className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                placeholder="Aarav Patel, 5A, Vihaan Patel, 9876543210&#10;Diya Sharma, 6B, Sanjay Sharma, 9876543211"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-800">Preview ({parsedBulkStudents.length} students)</h4>
                            <button 
                                onClick={() => setParsedBulkStudents([])}
                                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                                {t.backToEdit}
                            </button>
                        </div>
                        <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                    <tr>
                                        <th className="p-2 font-medium">{t.fullName}</th>
                                        <th className="p-2 font-medium">{t.classGrade}</th>
                                        <th className="p-2 font-medium">{t.guardian}</th>
                                        <th className="p-2 font-medium">{t.contactNumber}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {parsedBulkStudents.map((s, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2">{s.name}</td>
                                            <td className="p-2">{s.grade}</td>
                                            <td className="p-2">{s.guardianName}</td>
                                            <td className="p-2">{s.guardianContact}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-green-50 p-3 rounded text-green-800 text-sm flex items-center gap-2">
                            <Check size={16} />
                            {t.readyImport}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => {
                    setIsBulkModalOpen(false);
                    setBulkData('');
                    setParsedBulkStudents([]);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                {t.cancel}
              </button>
              {!parsedBulkStudents.length ? (
                <button 
                    onClick={handleParseBulk}
                    disabled={!bulkData.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <FileText size={18} />
                    {t.previewData}
                </button>
              ) : (
                <button 
                    onClick={handleBulkImport}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm flex items-center gap-2"
                >
                    <Save size={18} />
                    {t.importStudents}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
