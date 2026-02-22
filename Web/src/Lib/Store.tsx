import type { Course, CourseSection, ScheduleGroup, ScheduleSection, Semester, StudentRoster } from './Types';
class DataStore {
  private semesters: Semester[] = [];
  private scheduleGroups: ScheduleGroup[] = [];
  private courses: Course[] = [];
  private courseSections: CourseSection[] = [];
  private scheduleSections: ScheduleSection[] = [];
  private studentRosters: StudentRoster[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize with sample semesters
    this.semesters = [
      {
        id: 'sem1',
        name: 'Spring 2026',
        startDate: '2026-01-12',
        endDate: '2026-05-15',
        clinicalDays: 'Thurs/Fri',
      },
      {
        id: 'sem2',
        name: 'Fall 2025',
        startDate: '2025-08-18',
        endDate: '2025-12-12',
        clinicalDays: 'Tues/Wed',
      },
    ];

    // Sample schedule groups
    this.scheduleGroups = [
      {
        id: 'sg1',
        semesterId: 'sem1',
        level: 'Semester 1',
        name: 'Schedule A',
        locationNote: 'Baton Rouge',
      },
      {
        id: 'sg2',
        semesterId: 'sem1',
        level: 'Semester 1',
        name: 'Schedule B',
        locationNote: 'Hammond',
      },
      {
        id: 'sg3',
        semesterId: 'sem1',
        level: 'Semester 2',
        name: 'Schedule C',
        locationNote: 'Baton Rouge',
      },
    ];

    // Sample courses
    this.courses = [
      {
        id: 'c1',
        name: 'Fundamentals of Nursing',
        code: 'NURS 339',
        type: 'Lecture',
        semesterId: 'sem1',
        color: '#3b82f6', // blue
      },
      {
        id: 'c2',
        name: 'Fundamentals Lab',
        code: 'NURS 339 Lab',
        type: 'Lab',
        semesterId: 'sem1',
        color: '#10b981', // green
      },
      {
        id: 'c3',
        name: 'Clinical Rotation',
        code: 'NURS 340',
        type: 'Clinical',
        semesterId: 'sem1',
        color: '#8b5cf6', // purple
      },
    ];
  }

  // Semesters
  getSemesters(): Semester[] {
    return [...this.semesters];
  }

  getSemesterById(id: string): Semester | undefined {
    return this.semesters.find(s => s.id === id);
  }

  addSemester(semester: Semester) {
    this.semesters.push(semester);
  }

  deleteSemester(id: string) {
    this.semesters = this.semesters.filter(s => s.id !== id);
  }

  // Schedule Groups
  getScheduleGroups(semesterId?: string, level?: string): ScheduleGroup[] {
    let groups = [...this.scheduleGroups];
    if (semesterId) {
      groups = groups.filter(g => g.semesterId === semesterId);
    }
    if (level) {
      groups = groups.filter(g => g.level === level);
    }
    return groups;
  }

  getScheduleGroupById(id: string): ScheduleGroup | undefined {
    return this.scheduleGroups.find(g => g.id === id);
  }

  addScheduleGroup(group: ScheduleGroup) {
    this.scheduleGroups.push(group);
  }

  updateScheduleGroup(id: string, updates: Partial<ScheduleGroup>) {
    const index = this.scheduleGroups.findIndex(g => g.id === id);
    if (index !== -1) {
      this.scheduleGroups[index] = { ...this.scheduleGroups[index], ...updates };
    }
  }

  deleteScheduleGroup(id: string) {
    this.scheduleGroups = this.scheduleGroups.filter(g => g.id !== id);
  }

  // Courses
  getCourses(semesterId?: string): Course[] {
    let courses = [...this.courses];
    if (semesterId) {
      courses = courses.filter(c => c.semesterId === semesterId);
    }
    return courses;
  }

  addCourse(course: Course) {
    this.courses.push(course);
  }

  // Course Sections
  getCourseSections(): CourseSection[] {
    return [...this.courseSections];
  }

  getCourseSectionById(id: string): CourseSection | undefined {
    return this.courseSections.find(cs => cs.id === id);
  }

  findCourseSection(courseId: string, sectionNumber: string): CourseSection | undefined {
    return this.courseSections.find(
      cs => cs.courseId === courseId && cs.sectionNumber === sectionNumber
    );
  }

  addCourseSection(section: CourseSection) {
    this.courseSections.push(section);
  }

  updateCourseSection(id: string, updates: Partial<CourseSection>) {
    const index = this.courseSections.findIndex(cs => cs.id === id);
    if (index !== -1) {
      this.courseSections[index] = { ...this.courseSections[index], ...updates };
    }
  }

  // Schedule Sections (Links)
  getScheduleSections(scheduleGroupId: string): ScheduleSection[] {
    return this.scheduleSections.filter(s => s.scheduleGroupId === scheduleGroupId);
  }

  addScheduleSection(section: ScheduleSection) {
    this.scheduleSections.push(section);
  }

  deleteScheduleSection(id: string) {
    this.scheduleSections = this.scheduleSections.filter(ss => ss.id !== id);
  }

  // Student Rosters
  getStudentRoster(scheduleGroupId: string): StudentRoster[] {
    return this.studentRosters.filter(s => s.scheduleGroupId === scheduleGroupId);
  }

  addStudent(student: StudentRoster) {
    this.studentRosters.push(student);
  }

  updateStudent(id: string, updates: Partial<StudentRoster>) {
    const index = this.studentRosters.findIndex(s => s.id === id);
    if (index !== -1) {
      this.studentRosters[index] = { ...this.studentRosters[index], ...updates };
    }
  }

  deleteStudent(id: string) {
    this.studentRosters = this.studentRosters.filter(s => s.id !== id);
  }
}

export const dataStore = new DataStore();