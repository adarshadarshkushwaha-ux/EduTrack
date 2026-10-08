import { AttendanceStatus, ClassGroup, Student } from "./types";

export const MOCK_STUDENTS: Student[] = [
  // Class 5A
  { id: 's1', name: 'Rohit Sharma', nameHi: 'रोहित शर्मा', grade: '5A', guardianName: 'Ajay Sharma', guardianNameHi: 'अजय शर्मा', guardianContact: '9876500101', attendanceRate: 100 },
  { id: 's2', name: 'Virat Kohli', nameHi: 'विराट कोहली', grade: '5A', guardianName: 'Prem Kohli', guardianNameHi: 'प्रेम कोहली', guardianContact: '9876500102', attendanceRate: 100 },
  { id: 's3', name: 'MS Dhoni', nameHi: 'एम.एस. धोनी', grade: '5A', guardianName: 'Pan Singh Dhoni', guardianNameHi: 'पान सिंह धोनी', guardianContact: '9876500103', attendanceRate: 100 },
  { id: 's4', name: 'Jasprit Bumrah', nameHi: 'जसप्रीत बुमराह', grade: '5A', guardianName: 'Jasbir Bumrah', guardianNameHi: 'जसबीर बुमराह', guardianContact: '9876500104', attendanceRate: 100 },
  { id: 's5', name: 'Hardik Pandya', nameHi: 'हार्दिक पांड्या', grade: '5A', guardianName: 'Himanshu Pandya', guardianNameHi: 'हिमांशु पांड्या', guardianContact: '9876500105', attendanceRate: 100 },
  { id: 's6', name: 'Kane Williamson', nameHi: 'केन विलियमसन', grade: '5A', guardianName: 'Brett Williamson', guardianNameHi: 'ब्रेट विलियमसन', guardianContact: '9876500106', attendanceRate: 100 },
  { id: 's7', name: 'Ben Stokes', nameHi: 'बेन स्टोक्स', grade: '5A', guardianName: 'Gerard Stokes', guardianNameHi: 'जेरार्ड स्टोक्स', guardianContact: '9876500107', attendanceRate: 100 },
  { id: 's8', name: 'Babar Azam', nameHi: 'बाबर आज़म', grade: '5A', guardianName: 'Azam Siddiqui', guardianNameHi: 'आज़म सिद्दीकी', guardianContact: '9876500108', attendanceRate: 100 },
  { id: 's9', name: 'Lionel Messi', nameHi: 'लियोनेल मेस्सी', grade: '5A', guardianName: 'Jorge Messi', guardianNameHi: 'होरहे मेस्सी', guardianContact: '9876500109', attendanceRate: 100 },
  { id: 's10', name: 'Cristiano Ronaldo', nameHi: 'क्रिस्टियानो रोनाल्डो', grade: '5A', guardianName: 'José Ronaldo', guardianNameHi: 'जोस रोनाल्डो', guardianContact: '9876500110', attendanceRate: 100 },

  // Class 5B
  { id: 's11', name: 'Albert Einstein', nameHi: 'अल्बर्ट आइंस्टीन', grade: '5B', guardianName: 'Daniel Einstein', guardianNameHi: 'डैनियल आइंस्टीन', guardianContact: '9876500201', attendanceRate: 100 },
  { id: 's12', name: 'Isaac Newton', nameHi: 'आइजैक न्यूटन', grade: '5B', guardianName: 'Samuel Newton', guardianNameHi: 'सैमुअल न्यूटन', guardianContact: '9876500202', attendanceRate: 100 },
  { id: 's13', name: 'Marie Curie', nameHi: 'मैरी क्यूरी', grade: '5B', guardianName: 'Elena Curie', guardianNameHi: 'एलेना क्यूरी', guardianContact: '9876500203', attendanceRate: 100 },
  { id: 's14', name: 'Nikola Tesla', nameHi: 'निकोला टेस्ला', grade: '5B', guardianName: 'Milan Tesla', guardianNameHi: 'मिलन टेस्ला', guardianContact: '9876500204', attendanceRate: 100 },
  { id: 's15', name: 'Stephen Hawking', nameHi: 'स्टीफन हॉकिंग', grade: '5B', guardianName: 'Robert Hawking', guardianNameHi: 'रॉबर्ट हॉकिंग', guardianContact: '9876500205', attendanceRate: 100 },
  { id: 's16', name: 'Ada Lovelace', nameHi: 'एडा लवलेस', grade: '5B', guardianName: 'Sarah Lovelace', guardianNameHi: 'सारा लवलेस', guardianContact: '9876500206', attendanceRate: 100 },
  { id: 's17', name: 'Galileo Galilei', nameHi: 'गैलीलियो गैलीली', grade: '5B', guardianName: 'Marco Galilei', guardianNameHi: 'मार्को गैलीली', guardianContact: '9876500207', attendanceRate: 100 },
  { id: 's18', name: 'Charles Darwin', nameHi: 'चार्ल्स डार्विन', grade: '5B', guardianName: 'Victor Darwin', guardianNameHi: 'विक्टर डार्विन', guardianContact: '9876500208', attendanceRate: 100 },
  { id: 's19', name: 'C.V. Raman', nameHi: 'सी.वी. रमन', grade: '5B', guardianName: 'Suresh Raman', guardianNameHi: 'सुरेश रमन', guardianContact: '9876500209', attendanceRate: 100 },
  { id: 's20', name: 'APJ Abdul Kalam', nameHi: 'ए.पी.जे. अब्दुल कलाम', grade: '5B', guardianName: 'Imran Kalam', guardianNameHi: 'इमरान कलाम', guardianContact: '9876500210', attendanceRate: 100 },

  // Class 9A
  { id: 's21', name: 'Shah Rukh Khan', nameHi: 'शाहरुख खान', grade: '9A', guardianName: 'Rahim Khan', guardianNameHi: 'रहीम खान', guardianContact: '9876500301', attendanceRate: 100 },
  { id: 's22', name: 'Salman Khan', nameHi: 'सलमान खान', grade: '9A', guardianName: 'Akram Khan', guardianNameHi: 'अकरम खान', guardianContact: '9876500302', attendanceRate: 100 },
  { id: 's23', name: 'Amitabh Bachchan', nameHi: 'अमिताभ बच्चन', grade: '9A', guardianName: 'Manoj Bachchan', guardianNameHi: 'मनोज बच्चन', guardianContact: '9876500303', attendanceRate: 100 },
  { id: 's24', name: 'Ranbir Kapoor', nameHi: 'रणबीर कपूर', grade: '9A', guardianName: 'Karan Kapoor', guardianNameHi: 'करण कपूर', guardianContact: '9876500304', attendanceRate: 100 },
  { id: 's25', name: 'Ranveer Singh', nameHi: 'रणवीर सिंह', grade: '9A', guardianName: 'Ramesh Singh', guardianNameHi: 'रमेश सिंह', guardianContact: '9876500305', attendanceRate: 100 },
  { id: 's26', name: 'Akshay Kumar', nameHi: 'अक्षय कुमार', grade: '9A', guardianName: 'Sandeep Kumar', guardianNameHi: 'संदीप कुमार', guardianContact: '9876500306', attendanceRate: 100 },
  { id: 's27', name: 'Hrithik Roshan', nameHi: 'ऋतिक रोशन', grade: '9A', guardianName: 'Mahesh Roshan', guardianNameHi: 'महेश रोशन', guardianContact: '9876500307', attendanceRate: 100 },
  { id: 's28', name: 'Tiger Shroff', nameHi: 'टाइगर श्रॉफ', grade: '9A', guardianName: 'Rohit Shroff', guardianNameHi: 'रोहित श्रॉफ', guardianContact: '9876500308', attendanceRate: 100 },
  { id: 's29', name: 'Deepika Padukone', nameHi: 'दीपिका पादुकोण', grade: '9A', guardianName: 'Anil Padukone', guardianNameHi: 'अनिल पादुकोण', guardianContact: '9876500309', attendanceRate: 100 },
];

export const MOCK_CLASSES: ClassGroup[] = [
  { 
    id: 'c1', 
    name: 'Class 5A', 
    teacher: 'Mrs. Rao', 
    students: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'] 
  },
  { 
    id: 'c2', 
    name: 'Class 5B', 
    teacher: 'Mr. Khan', 
    students: ['s11', 's12', 's13', 's14', 's15', 's16', 's17', 's18', 's19', 's20'] 
  },
  { 
    id: 'c3', 
    name: 'Class 9A', 
    teacher: 'Mrs. Kaur', 
    students: ['s21', 's22', 's23', 's24', 's25', 's26', 's27', 's28', 's29'] 
  },
];

export const STATUS_COLORS = {
  [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-800 border-green-200',
  [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-800 border-red-200',
  [AttendanceStatus.LATE]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [AttendanceStatus.EXCUSED]: 'bg-blue-100 text-blue-800 border-blue-200',
};

// New Data Sets for Dashboard Visualization - Initialized to Zero/Empty

export const WEEKLY_ATTENDANCE_DATA = [
  { name: 'Mon', present: 0, absent: 0, late: 0 },
  { name: 'Tue', present: 0, absent: 0, late: 0 },
  { name: 'Wed', present: 0, absent: 0, late: 0 },
  { name: 'Thu', present: 0, absent: 0, late: 0 },
  { name: 'Fri', present: 0, absent: 0, late: 0 },
];

export const MONTHLY_ATTENDANCE_DATA = [
  { name: 'Week 1', present: 0, absent: 0, late: 0 },
  { name: 'Week 2', present: 0, absent: 0, late: 0 },
  { name: 'Week 3', present: 0, absent: 0, late: 0 },
  { name: 'Week 4', present: 0, absent: 0, late: 0 },
];

export const CLASS_BREAKDOWN_DATA = [
  { name: '5A', present: 0, absent: 0, late: 0 },
  { name: '5B', present: 0, absent: 0, late: 0 },
  { name: '9A', present: 0, absent: 0, late: 0 },
];