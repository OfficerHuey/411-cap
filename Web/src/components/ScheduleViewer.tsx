import { useEffect, useState } from 'react'
import '../App.css'
import { Eye } from 'lucide-react';
import { dataStore } from '../Lib/Store';
import type { Course, CourseSection, ScheduleGroup, ScheduleSection } from '../Lib/Types';

interface ScheduleViewerProps {
  semesterId: string;
  currentScheduleGroupId: string;
  courses: Course[];
  courseSections: CourseSection[];
}

export function ScheduleViewer({
  semesterId,
  currentScheduleGroupId,
  courses,
  courseSections,
}: ScheduleViewerProps) {
  const [scheduleGroups, setScheduleGroups] = useState<ScheduleGroup[]>([]);
  const [scheduleSections, setScheduleSections] = useState<ScheduleSection[]>([]);

  useEffect(() => {
    const groups = dataStore.getScheduleGroups(semesterId).filter(g => g.id !== currentScheduleGroupId);
    setScheduleGroups(groups);
    setScheduleSections(dataStore.getScheduleSections(currentScheduleGroupId));
  }, [semesterId, currentScheduleGroupId]);

  const getScheduleInfo = (scheduleGroupId: string) => {
    const sections = scheduleSections.filter(ss => ss.scheduleGroupId === scheduleGroupId);
    return sections
      .map(ss => {
        const courseSection = courseSections.find(cs => cs.id === ss.courseSectionId);
        if (!courseSection) return null;
        const course = courses.find(c => c.id === courseSection.courseId);
        return { courseSection, course };
      })
      .filter(Boolean) as { courseSection: CourseSection; course: Course }[];
  };

  return (
    <div className="bg-white rounded-lg shadow sticky top-4">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Eye className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Other Schedules</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">View what's scheduled in other groups</p>
      </div>

      <div className="p-4 max-h-[calc(100vh-250px)] overflow-y-auto">
        {scheduleGroups.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No other schedules in this semester
          </p>
        ) : (
          <div className="space-y-4">
            {scheduleGroups.map(group => {
              const scheduleInfo = getScheduleInfo(group.id);
              return (
                <div key={group.id} className="border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">
                    {group.name}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">{group.locationNote}</p>
                  {scheduleInfo.length > 0 ? (
                    <div className="space-y-1">
                      {scheduleInfo.map(({ courseSection, course }, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2 rounded"
                          style={{ backgroundColor: `${course.color}20`, borderLeft: `3px solid ${course.color}` }}
                        >
                          <div className="font-medium">{course.code}-{courseSection.sectionNumber}</div>
                          <div className="text-gray-600">
                            {courseSection.dayOfWeek && courseSection.timeSlot
                              ? `${courseSection.dayOfWeek} ${courseSection.timeSlot}`
                              : courseSection.dateRange}
                          </div>
                          {courseSection.notes && (
                            <div className="text-gray-500 mt-1">{courseSection.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No courses scheduled</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}