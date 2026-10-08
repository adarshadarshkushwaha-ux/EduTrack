import React from 'react';

export type Language = 'en' | 'hi';

export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LATE = 'Late',
  EXCUSED = 'Excused'
}

export interface Student {
  id: string;
  name: string;
  nameHi?: string; // Hindi Name
  grade: string;
  guardianName: string;
  guardianNameHi?: string; // Hindi Guardian Name
  guardianContact: string; // Phone number mock
  attendanceRate: number; // 0-100
  photo?: string; // Base64 string of student photo
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO date string YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  teacher: string;
  students: string[]; // Array of student IDs
}

export interface AnalysisResult {
  studentsFound: {
    name: string;
    status: AttendanceStatus;
    confidence: number;
  }[];
  rawText: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

export interface AppSettings {
  schoolName: string;
  logoUrl?: string; // URL for school logo
  lateThreshold: string;
  enableAutoExcuse: boolean;
  autoExcuseKeywords: string[];
}