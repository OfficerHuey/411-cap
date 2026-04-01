// ===== enums =====
export type CourseType = "Lecture" | "Lab" | "Clinical";
//backend sends string enum names with JsonStringEnumConverter
export type DayOfWeekEnum = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
export type TermType = "Full" | "Term1" | "Term2";
export type RoomType = "Lecture" | "Lab" | "SimLab" | "Clinical" | "Online";
export type InstructorType = "FullTime" | "Adjunct" | "Overload";
export type ConflictSeverity = "Info" | "Warning" | "Error";

export type ClinicalDays = "Thurs/Fri" | "Tues/Wed";
export type SemesterLevel = "Semester 1" | "Semester 2" | "Semester 3" | "Semester 4" | "Semester 5";

// ===== core entities =====
export interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  clinicalDays: string | null;
  isLocked: boolean;
}

export interface Schedule {
  id: number;
  name: string;
  semesterLevel: number; // 1-5
  locationDisplay: string | null;
  semesterId: number;
  capacity: number;
  sortOrder: number;
  students: Student[];
  sections: Section[];
}

export interface Course {
  id: number;
  code: string;
  name: string;
  semesterLevel: number;
  defaultType: CourseType;
}

export interface Section {
  id: number;
  sectionNumber: string;
  dayOfWeek: DayOfWeekEnum | null;
  startTime: string | null;   // "HH:mm:ss" format from backend TimeSpan
  endTime: string | null;
  dateRange: string | null;
  notes: string | null;
  term: TermType | null;
  termStartDate: string | null;
  termEndDate: string | null;
  roomId: number | null;
  roomNumber: string | null;
  roomBuilding: string | null;
  instructorId: number | null;
  instructorName: string | null;
  courseId: number;
  courseCode: string;
  courseName: string;
  courseType: CourseType;
}

export interface Student {
  id: number;
  name: string;
  wNumber: string;
  email: string;
}

export interface Room {
  id: number;
  roomNumber: string;
  building: string;
  campus: string;
  capacity: number;
  type: RoomType;
}

export interface Instructor {
  id: number;
  name: string;
  email: string | null;
  type: InstructorType;
}

export interface ConflictResult {
  severity: ConflictSeverity;
  message: string;
  details: string | null;
  conflictingSectionId: number | null;
}

export interface SectionWithConflicts {
  section: Section;
  conflicts: ConflictResult[];
}

// ===== auth =====
export interface UserDto {
  username: string;
  token: string;
  role: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
}

// ===== create dtos =====
export interface CreateSemesterDto {
  name: string;
  startDate: string;
  endDate: string;
  clinicalDays: string | null;
}

export interface CreateScheduleDto {
  name: string;
  semesterLevel: number;
  locationDisplay: string | null;
  semesterId: number;
  capacity?: number;
}

export interface CreateSectionDto {
  sectionNumber: string;
  dayOfWeek: DayOfWeekEnum | null;
  startTime: string | null;
  endTime: string | null;
  dateRange: string | null;
  notes: string | null;
  term: TermType | null;
  termStartDate: string | null;
  termEndDate: string | null;
  roomId: number | null;
  instructorId: number | null;
  courseId: number;
  semesterId: number;
  scheduleId: number;
}

export interface CreateStudentDto {
  name: string;
  wNumber: string;
  email: string;
  scheduleId: number;
}

// ===== helpers =====
export function levelToNumber(level: SemesterLevel): number {
  const map: Record<SemesterLevel, number> = {
    "Semester 1": 1, "Semester 2": 2, "Semester 3": 3, "Semester 4": 4, "Semester 5": 5
  };
  return map[level];
}

export function numberToLevel(n: number): SemesterLevel {
  return `Semester ${n}` as SemesterLevel;
}

export function courseTypeColor(type: CourseType): string {
  switch (type) {
    case "Lecture": return "#3b82f6";
    case "Lab": return "#10b981";
    case "Clinical": return "#8b5cf6";
    default: return "#6b7280";
  }
}

export function dayOfWeekName(day: DayOfWeekEnum): string {
  return day;
}

export function dayNameToEnum(name: string): DayOfWeekEnum {
  return name as DayOfWeekEnum;
}

export function timeSlotToTimeSpan(timeSlot: string): string {
  const [time, period] = timeSlot.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
}

export function timeSpanToDisplay(ts: string | null): string {
  if (!ts) return "";
  const [h, m] = ts.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
}
