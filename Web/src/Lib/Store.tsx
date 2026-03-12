import type {
  Course,
  CourseSection,
  ScheduleGroup,
  ScheduleSection,
  Semester,
  StudentRoster,
} from "./Types";

const STORAGE_KEYS = {
  semesters: "ns_semesters",
  scheduleGroups: "ns_scheduleGroups",
  courses: "ns_courses",
  courseSections: "ns_courseSections",
  scheduleSections: "ns_scheduleSections",
  studentRosters: "ns_studentRosters",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_SEMESTERS: Semester[] = [
  {
    id: "sem1",
    name: "Spring 2026",
    startDate: "2026-01-12",
    endDate: "2026-05-15",
    clinicalDays: "Thurs/Fri",
  },
  {
    id: "sem2",
    name: "Fall 2025",
    startDate: "2025-08-18",
    endDate: "2025-12-12",
    clinicalDays: "Tues/Wed",
  },
];

const DEFAULT_SCHEDULE_GROUPS: ScheduleGroup[] = [
  {
    id: "sg1",
    semesterId: "sem1",
    level: "Semester 1",
    name: "Schedule A",
    locationNote: "Baton Rouge",
  },
  {
    id: "sg2",
    semesterId: "sem1",
    level: "Semester 1",
    name: "Schedule B",
    locationNote: "Hammond",
  },
  {
    id: "sg3",
    semesterId: "sem1",
    level: "Semester 2",
    name: "Schedule C",
    locationNote: "Baton Rouge",
  },
];

const DEFAULT_COURSES: Course[] = [
  {
    id: "c1",
    name: "Fundamentals of Nursing",
    code: "NURS 339",
    type: "Lecture",
    color: "#3b82f6",
  },
  {
    id: "c2",
    name: "Fundamentals Lab",
    code: "NURS 339 Lab",
    type: "Lab",
    color: "#10b981",
  },
  {
    id: "c3",
    name: "Clinical Rotation",
    code: "NURS 340",
    type: "Clinical",
    color: "#8b5cf6",
  },
];

class DataStore {
  private semesters: Semester[];
  private scheduleGroups: ScheduleGroup[];
  private courses: Course[];
  private courseSections: CourseSection[];
  private scheduleSections: ScheduleSection[];
  private studentRosters: StudentRoster[];

  constructor() {
    this.semesters = load(STORAGE_KEYS.semesters, DEFAULT_SEMESTERS);
    this.scheduleGroups = load(
      STORAGE_KEYS.scheduleGroups,
      DEFAULT_SCHEDULE_GROUPS,
    );
    this.courses = load(STORAGE_KEYS.courses, DEFAULT_COURSES);
    this.courseSections = load(STORAGE_KEYS.courseSections, []);
    this.scheduleSections = load(STORAGE_KEYS.scheduleSections, []);
    this.studentRosters = load(STORAGE_KEYS.studentRosters, []);
  }

  // Semesters
  getSemesters(): Semester[] {
    return [...this.semesters];
  }

  getSemesterById(id: string): Semester | undefined {
    return this.semesters.find((s) => s.id === id);
  }

  addSemester(semester: Semester) {
    this.semesters.push(semester);
    save(STORAGE_KEYS.semesters, this.semesters);
  }

  deleteSemester(id: string) {
    this.semesters = this.semesters.filter((s) => s.id !== id);
    save(STORAGE_KEYS.semesters, this.semesters);
  }

  // Schedule Groups
  getScheduleGroups(semesterId?: string, level?: string): ScheduleGroup[] {
    let groups = [...this.scheduleGroups];
    if (semesterId) groups = groups.filter((g) => g.semesterId === semesterId);
    if (level) groups = groups.filter((g) => g.level === level);
    return groups;
  }

  getScheduleGroupById(id: string): ScheduleGroup | undefined {
    return this.scheduleGroups.find((g) => g.id === id);
  }

  addScheduleGroup(group: ScheduleGroup) {
    this.scheduleGroups.push(group);
    save(STORAGE_KEYS.scheduleGroups, this.scheduleGroups);
  }

  updateScheduleGroup(id: string, updates: Partial<ScheduleGroup>) {
    const index = this.scheduleGroups.findIndex((g) => g.id === id);
    if (index !== -1) {
      this.scheduleGroups[index] = {
        ...this.scheduleGroups[index],
        ...updates,
      };
      save(STORAGE_KEYS.scheduleGroups, this.scheduleGroups);
    }
  }

  deleteScheduleGroup(id: string) {
    this.scheduleGroups = this.scheduleGroups.filter((g) => g.id !== id);
    save(STORAGE_KEYS.scheduleGroups, this.scheduleGroups);
  }

  // Courses — global, not tied to any semester
  getCourses(): Course[] {
    return [...this.courses];
  }

  addCourse(course: Course) {
    this.courses.push(course);
    save(STORAGE_KEYS.courses, this.courses);
  }

  // Course Sections
  getCourseSections(): CourseSection[] {
    return [...this.courseSections];
  }

  getCourseSectionById(id: string): CourseSection | undefined {
    return this.courseSections.find((cs) => cs.id === id);
  }

  findCourseSection(
    courseId: string,
    sectionNumber: string,
  ): CourseSection | undefined {
    return this.courseSections.find(
      (cs) => cs.courseId === courseId && cs.sectionNumber === sectionNumber,
    );
  }

  addCourseSection(section: CourseSection) {
    this.courseSections.push(section);
    save(STORAGE_KEYS.courseSections, this.courseSections);
  }

  updateCourseSection(id: string, updates: Partial<CourseSection>) {
    const index = this.courseSections.findIndex((cs) => cs.id === id);
    if (index !== -1) {
      this.courseSections[index] = {
        ...this.courseSections[index],
        ...updates,
      };
      save(STORAGE_KEYS.courseSections, this.courseSections);
    }
  }

  // Schedule Sections
  getScheduleSections(scheduleGroupId: string): ScheduleSection[] {
    return this.scheduleSections.filter(
      (s) => s.scheduleGroupId === scheduleGroupId,
    );
  }

  addScheduleSection(section: ScheduleSection) {
    this.scheduleSections.push(section);
    save(STORAGE_KEYS.scheduleSections, this.scheduleSections);
  }

  deleteScheduleSection(id: string) {
    this.scheduleSections = this.scheduleSections.filter((ss) => ss.id !== id);
    save(STORAGE_KEYS.scheduleSections, this.scheduleSections);
  }

  // Student Rosters
  getStudentRoster(scheduleGroupId: string): StudentRoster[] {
    return this.studentRosters.filter(
      (s) => s.scheduleGroupId === scheduleGroupId,
    );
  }

  addStudent(student: StudentRoster) {
    this.studentRosters.push(student);
    save(STORAGE_KEYS.studentRosters, this.studentRosters);
  }

  updateStudent(id: string, updates: Partial<StudentRoster>) {
    const index = this.studentRosters.findIndex((s) => s.id === id);
    if (index !== -1) {
      this.studentRosters[index] = {
        ...this.studentRosters[index],
        ...updates,
      };
      save(STORAGE_KEYS.studentRosters, this.studentRosters);
    }
  }

  deleteStudent(id: string) {
    this.studentRosters = this.studentRosters.filter((s) => s.id !== id);
    save(STORAGE_KEYS.studentRosters, this.studentRosters);
  }
}

export const dataStore = new DataStore();
