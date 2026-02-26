import "../App.css";
import { authService } from "../Lib/Auth";
import type { Course } from "../Lib/Types";
import { useDrag } from "react-dnd";
import { useRef } from "react";

interface CoursePaletteProps {
  courses: Course[];
}

function DraggableCourse({ course }: { course: Course }) {
  const canEdit = authService.canEdit();
  const elementRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "course",
    item: {
      courseId: course.id,
      courseCode: course.code,
      courseType: course.type,
    },
    canDrag: canEdit,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  drag(elementRef);

  return (
    <div
      ref={elementRef}
      style={{
        borderLeft: `4px solid ${course.color}`,
        opacity: isDragging ? 0.4 : 1,
        cursor: canEdit ? "grab" : "not-allowed",
        userSelect: "none",
      }}
      className="course-pill"
    >
      <div
        className="course-pill-dot"
        style={{ backgroundColor: course.color }}
      />
      <div>
        <div className="course-pill-code">{course.code}</div>
        <div className="course-pill-type">{course.type}</div>
      </div>
    </div>
  );
}

export function CoursePalette({ courses }: CoursePaletteProps) {
  const lectures = courses.filter((c) => c.type === "Lecture");
  const labs = courses.filter((c) => c.type === "Lab");
  const clinicals = courses.filter((c) => c.type === "Clinical");

  const Section = ({ label, items }: { label: string; items: Course[] }) => (
    <div className="palette-section">
      <p className="palette-section-label">{label}</p>
      <div className="palette-section-list">
        {items.map((course) => (
          <DraggableCourse key={course.id} course={course} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .palette-root {
          background: #ffffff;
          border: 1px solid #e5e2db;
          border-radius: 10px;
          overflow: hidden;
          position: sticky;
          top: 1rem;
          font-family: 'DM Sans', sans-serif;
        }

        .palette-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #e5e2db;
          background: #fafaf8;
        }

        .palette-header h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0;
        }

        .palette-header p {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0.2rem 0 0;
          font-weight: 300;
        }

        .palette-body {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .palette-section-label {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #9ca3af;
          margin: 0 0 0.5rem 0;
        }

        .palette-section-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .course-pill {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 0.75rem;
          background: #fafaf8;
          border: 1px solid #e5e2db;
          border-radius: 7px;
          transition: box-shadow 0.15s, background 0.15s;
        }

        .course-pill:hover {
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .course-pill-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .course-pill-code {
          font-size: 0.82rem;
          font-weight: 500;
          color: #0a1f14;
          line-height: 1.2;
        }

        .course-pill-type {
          font-size: 0.72rem;
          color: #9ca3af;
        }

        .palette-empty {
          font-size: 0.82rem;
          color: #9ca3af;
          text-align: center;
          padding: 1rem 0;
          font-weight: 300;
        }
      `}</style>

      <div className="palette-root">
        <div className="palette-header">
          <h3>Courses</h3>
          <p>Drag to schedule</p>
        </div>

        <div className="palette-body">
          {courses.length === 0 && (
            <p className="palette-empty">No courses available</p>
          )}
          {lectures.length > 0 && <Section label="Lectures" items={lectures} />}
          {labs.length > 0 && <Section label="Labs" items={labs} />}
          {clinicals.length > 0 && (
            <Section label="Clinicals" items={clinicals} />
          )}
        </div>
      </div>
    </>
  );
}
