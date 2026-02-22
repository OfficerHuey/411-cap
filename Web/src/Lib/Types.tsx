export type Campus = 'Baton Rouge' | 'Hammond North Shore';

export type CourseType = 'Lecture' | 'Lab' | 'Clinical';

export type ClinicalDays = 'Thurs/Fri' | 'Tues/Wed';

export type SemesterLevel = 'Semester 1' | 'Semester 2' | 'Semester 3' | 'Semester 4' | 'Semester 5';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'professor' | 'student';
}

export interface Override {
  id: string;
  sectionId: string;
  timestamp: Date;
  professorId: string;
  professorName: string;
  changes: string;
  reason?: string;
}

export interface Semester {
  id: string;
  name: string; // "Spring 2026"
  startDate: string;
  endDate: string;
  clinicalDays: ClinicalDays;
}

export interface ScheduleGroup {
  id: string;
  semesterId: string;
  level: SemesterLevel;
  name: string; // "Schedule A", "Schedule B"
  locationNote: string; // "Hammond", "Baton Rouge"
}

export interface Course {
  id: string;
  name: string;
  code: string; // "NURS 339"
  type: CourseType;
  semesterId: string;
  color: string; // For visual distinction
}

export interface CourseSection {
  id: string;
  courseId: string;
  sectionNumber: string; // "01", "02"
  dayOfWeek?: string; // For Semesters 1-4
  timeSlot?: string; // For Semesters 1-4
  dateRange?: string; // For Semester 5 "Jan 13 - Feb 9"
  classroom: string; // Classroom/building location "SLU 10828", "Nursing Building 204"
  notes: string; // Additional notes "Sim Lab", "Bring stethoscope"
  isShared: boolean; // If multiple schedule groups link to this
}

export interface ScheduleSection {
  id: string;
  scheduleGroupId: string;
  courseSectionId: string;
}

export interface StudentRoster {
  id: string;
  scheduleGroupId: string;
  name: string;
  wNumber: string;
  email: string;
}