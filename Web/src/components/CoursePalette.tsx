import '../App.css'
import { authService } from '../Lib/Auth';
import type { Course } from '../Lib/Types';
import { useDrag } from 'react-dnd';
import { useRef } from "react";

interface CoursePaletteProps {
  courses: Course[];
}

function DraggableCourse({ course }: { course: Course }) {
  const canEdit = authService.canEdit();
  const elementRef = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'course',
    item: { courseId: course.id, courseCode: course.code, courseType: course.type },
    canDrag: canEdit,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
drag(elementRef);
  return (
    <div
      ref={elementRef}
      style={{ backgroundColor: course.color }}
      className={`px-4 py-3 rounded-full text-white font-medium text-sm shadow-md transition-shadow ${
        canEdit ? 'cursor-move hover:shadow-lg' : 'cursor-not-allowed opacity-75'
      } ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="text-center">
        <div>{course.code}</div>
        <div className="text-xs opacity-90">{course.type}</div>
      </div>
    </div>
  );
}

export function CoursePalette({ courses }: CoursePaletteProps) {
  const lectures = courses.filter(c => c.type === 'Lecture');
  const labs = courses.filter(c => c.type === 'Lab');
  const clinicals = courses.filter(c => c.type === 'Clinical');

  return (
    <div className="bg-white rounded-lg shadow p-4 sticky top-4">
      <h3 className="font-semibold text-gray-900 mb-4">Courses</h3>
      
      <div className="space-y-4">
        {lectures.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Lectures</p>
            <div className="space-y-2">
              {lectures.map(course => (
                <DraggableCourse key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}

        {labs.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Labs</p>
            <div className="space-y-2">
              {labs.map(course => (
                <DraggableCourse key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}

        {clinicals.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Clinicals</p>
            <div className="space-y-2">
              {clinicals.map(course => (
                <DraggableCourse key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}

        {courses.length === 0 && (
          <p className="text-sm text-gray-500">No courses available</p>
        )}
      </div>
    </div>
  );
}