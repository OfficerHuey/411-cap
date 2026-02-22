
import { dataStore } from './Store';
import type { Course, CourseSection, ScheduleGroup, ScheduleSection, Semester, StudentRoster } from './Types';

interface ExportData {
  version: string;
  exportDate: string;
  scheduleGroup: ScheduleGroup;
  semester: Semester;
  courses: Course[];
  courseSections: CourseSection[];
  scheduleSections: ScheduleSection[];
  students: StudentRoster[];
}

/**
 * Export schedule data to a downloadable JSON file
 */
export function exportScheduleData(data: {
  scheduleGroup: ScheduleGroup;
  semester: Semester;
  courses: Course[];
  courseSections: CourseSection[];
  scheduleSections: ScheduleSection[];
  students: StudentRoster[];
}): void {
  const exportData: ExportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    ...data,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `schedule-${data.scheduleGroup.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import schedule data from a JSON file
 */
export function importScheduleData(fileContent: string, targetScheduleGroupId: string): boolean {
  try {
    const data: ExportData = JSON.parse(fileContent);

    // Validate data structure
    if (!data.version || !data.scheduleGroup || !data.semester) {
      console.error('Invalid export file format');
      return false;
    }

    // Clear existing schedule sections for this schedule group
    const existingSections = dataStore.getScheduleSections(targetScheduleGroupId);
    existingSections.forEach(ss => {
      dataStore.deleteScheduleSection(ss.id);
    });

    // Clear existing students for this schedule group
    const existingStudents = dataStore.getStudentRoster(targetScheduleGroupId);
    existingStudents.forEach(student => {
      dataStore.deleteStudent(student.id);
    });

    // Import course sections (only if they don't already exist)
    data.courseSections.forEach(section => {
      const existing = dataStore.findCourseSection(section.courseId, section.sectionNumber);
      if (!existing) {
        dataStore.addCourseSection(section);
      }
    });

    // Import schedule sections with the target schedule group ID
    data.scheduleSections.forEach(ss => {
      const newScheduleSection: ScheduleSection = {
        ...ss,
        id: `ss-${Date.now()}-${Math.random()}`,
        scheduleGroupId: targetScheduleGroupId,
      };
      dataStore.addScheduleSection(newScheduleSection);
    });

    // Import students with the target schedule group ID
    data.students.forEach(student => {
      const newStudent: StudentRoster = {
        ...student,
        id: `sr-${Date.now()}-${Math.random()}`,
        scheduleGroupId: targetScheduleGroupId,
      };
      dataStore.addStudent(newStudent);
    });

    return true;
  } catch (error) {
    console.error('Error importing schedule data:', error);
    return false;
  }
}

/**
 * Export schedule data as CSV format
 */
export function exportScheduleAsCSV(data: {
  scheduleGroup: ScheduleGroup;
  semester: Semester;
  courses: Course[];
  courseSections: CourseSection[];
  scheduleSections: ScheduleSection[];
  students: StudentRoster[];
}): void {
  const rows: string[][] = [
    ['Nursing School Schedule Export'],
    ['Schedule Name', data.scheduleGroup.name],
    ['Level', data.scheduleGroup.level],
    ['Semester', data.semester.name],
    ['Location', data.scheduleGroup.locationNote],
    [''],
    ['Course Sections'],
    ['Course Code', 'Section', 'Day', 'Time', 'Date Range', 'Classroom', 'Notes', 'Shared'],
  ];

  // Add course sections
  data.scheduleSections.forEach(ss => {
    const courseSection = data.courseSections.find(cs => cs.id === ss.courseSectionId);
    if (courseSection) {
      const course = data.courses.find(c => c.id === courseSection.courseId);
      rows.push([
        course?.code || '',
        courseSection.sectionNumber,
        courseSection.dayOfWeek || '',
        courseSection.timeSlot || '',
        courseSection.dateRange || '',
        courseSection.classroom || '',
        courseSection.notes || '',
        courseSection.isShared ? 'Yes' : 'No',
      ]);
    }
  });

  rows.push(['']);
  rows.push(['Student Roster']);
  rows.push(['Name', 'W Number', 'Email']);

  // Add students
  data.students.forEach(student => {
    rows.push([student.name, student.wNumber, student.email]);
  });

  const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `schedule-${data.scheduleGroup.name.replace(/\s+/g, '-')}-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}