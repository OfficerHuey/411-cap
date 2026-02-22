import { useRef, useState } from 'react'
import '../App.css'
import { Plus } from 'lucide-react';
import { useDrop } from 'react-dnd';
import type { ScheduleGroup, Course, CourseSection, ScheduleSection } from '../Lib/Types';
import { CourseDetailsModal } from './CourseDetailsModal';



interface ScheduleCanvasProps {
  scheduleGroup: ScheduleGroup;
  isSemester5: boolean;
  courses: Course[];
  courseSections: CourseSection[];
  scheduleSections: ScheduleSection[];
  onRefresh: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

interface DropItem {
  courseId: string;
  courseCode: string;
  courseType: string;
}

interface CourseDetailsData {
  courseId: string;
  dayOfWeek?: string;
  timeSlot?: string;
  dateRange?: string;
}

function DropZone({
  day,
  time,
  onDrop,
}: {
  day?: string;
  time?: string;
  onDrop: (courseId: string, day?: string, time?: string) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'course',
    drop: (item: DropItem) => {
      onDrop(item.courseId, day, time);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));
  drop(elementRef);

  return (
    <div
      ref={elementRef}
      className={`border border-gray-200 rounded p-2 min-h-16 transition-colors ${
        isOver ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
      }`}
    >
      {isOver && <Plus className="h-4 w-4 text-blue-600 mx-auto" />}
    </div>
  );
}
  

function Semester5DropZone({ onDrop }: { onDrop: (courseId: string) => void }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'course',
    drop: (item: DropItem) => {
      onDrop(item.courseId);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));
  drop(elementRef);

  return (
    <div
      ref={elementRef}
      className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
        isOver ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <div className="text-center text-gray-500">
        <Plus className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Drop course here to add to schedule</p>
      </div>
    </div>
  );
}

export function ScheduleCanvas({
  scheduleGroup,
  isSemester5,
  courses,
  courseSections,
  scheduleSections,
  onRefresh,
}: ScheduleCanvasProps) {
  const [detailsModal, setDetailsModal] = useState<CourseDetailsData | null>(null);

  const handleDrop = (courseId: string, dayOfWeek?: string, timeSlot?: string, dateRange?: string) => {
    setDetailsModal({ courseId, dayOfWeek, timeSlot, dateRange });
  };

  const getCourseSectionsForSchedule = () => {
    return scheduleSections
      .map(ss => {
        const courseSection = courseSections.find(cs => cs.id === ss.courseSectionId);
        if (!courseSection) return null;
        const course = courses.find(c => c.id === courseSection.courseId);
        return { courseSection, course };
      })
      .filter(Boolean) as { courseSection: CourseSection; course: Course }[];
  };

  const getSectionForSlot = (day: string, time: string) => {
    const sections = getCourseSectionsForSchedule();
    return sections.find(
      ({ courseSection }) =>
        courseSection.dayOfWeek === day && courseSection.timeSlot === time
    );
  };

  const scheduledSections = getCourseSectionsForSchedule();

  const createSection = (course: Course, day: string, time: string): CourseSection => ({
    id: `cs-${Date.now()}-${Math.random()}`,
    courseId: course.id,
    sectionNumber: '01',
    dayOfWeek: day,
    timeSlot: time,
    classroom: '',
    notes: '',
    isShared: false,
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">
          {isSemester5 ? 'Rotation Schedule' : 'Weekly Calendar'}
        </h3>
      </div>

      <div className="p-4">
        {isSemester5 ? (
          <div className="space-y-4">
            {scheduledSections.map(({ courseSection, course }) => (
              <div
                key={courseSection.id}
                className="border border-gray-200 rounded-lg p-4"
                style={{ borderLeftWidth: '4px', borderLeftColor: course.color }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{course.code}</h4>
                    <p className="text-sm text-gray-600">{course.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{courseSection.dateRange}</p>
                    {courseSection.classroom && (
                      <p className="text-sm text-blue-600 mt-1">📍 {courseSection.classroom}</p>
                    )}
                    {courseSection.notes && (
                      <p className="text-xs text-gray-500 mt-1">{courseSection.notes}</p>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    Section {courseSection.sectionNumber}
                  </div>
                </div>
              </div>
            ))}
            <Semester5DropZone onDrop={(courseId) => handleDrop(courseId, undefined, undefined, '')} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-700 w-24">
                    Time
                  </th>
                  {DAYS.map(day => (
                    <th
                      key={day}
                      className="border border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-700"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(time => (
                  <tr key={time}>
                    <td className="border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600 text-center">
                      {time}
                    </td>
                    {DAYS.map(day => {
                      const section = getSectionForSlot(day, time);
                      return (
                        <td key={`${day}-${time}`} className="border border-gray-200 p-1">
                          {section ? (
                            <div
                              className="p-2 rounded text-white text-xs"
                              style={{ backgroundColor: section.course.color }}
                            >
                              <div className="font-medium">{section.course.code}</div>
                              <div className="opacity-90">Sec {section.courseSection.sectionNumber}</div>
                              {section.courseSection.classroom && (
                                <div className="text-xs opacity-90 mt-1">📍 {section.courseSection.classroom}</div>
                              )}
                              {section.courseSection.notes && (
                                <div className="text-xs opacity-75 mt-1">{section.courseSection.notes}</div>
                              )}
                            </div>
                          ) : (
                            <DropZone day={day} time={time} onDrop={handleDrop} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailsModal && (
        <CourseDetailsModal
          scheduleGroupId={scheduleGroup.id}
          courseId={detailsModal.courseId}
          dayOfWeek={detailsModal.dayOfWeek}
          timeSlot={detailsModal.timeSlot}
          dateRange={detailsModal.dateRange}
          isSemester5={isSemester5}
          courses={courses}
          onClose={() => setDetailsModal(null)}
          onSuccess={() => {
            onRefresh();
            setDetailsModal(null);
          }}
        />
      )}
    </div>
  );
}