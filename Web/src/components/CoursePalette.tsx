import "../App.css";
import { authService } from "../Lib/Auth";
import type { Course } from "../Lib/Types";
import { courseTypeColor } from "../Lib/Types";
import { useDrag } from "react-dnd";
import { useRef, useState } from "react";
import { Search } from "lucide-react";

interface CoursePaletteProps {
  courses: Course[];
}

function DraggableCourse({ course }: { course: Course }) {
  const canEdit = authService.canEdit();
  const elementRef = useRef<HTMLDivElement>(null);
  const color = courseTypeColor(course.defaultType);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "course",
    item: {
      courseId: course.id,
      courseCode: course.code,
      courseType: course.defaultType,
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
        borderLeft: `4px solid ${color}`,
        opacity: isDragging ? 0.4 : 1,
        cursor: canEdit ? "grab" : "not-allowed",
        userSelect: "none",
      }}
      className="course-pill"
    >
      <div
        className="course-pill-dot"
        style={{ backgroundColor: color }}
      />
      <div>
        <div className="course-pill-code">{course.code}</div>
        <div className="course-pill-type">{course.defaultType}</div>
      </div>
    </div>
  );
}

export function CoursePalette({ courses }: CoursePaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = courses.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  const lectures = filtered.filter((c) => c.defaultType === "Lecture");
  const labs = filtered.filter((c) => c.defaultType === "Lab");
  const clinicals = filtered.filter((c) => c.defaultType === "Clinical");

  const PaletteSection = ({ label, items }: { label: string; items: Course[] }) => (
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
        .palette-root {
          background: #ffffff;
          border: 1px solid #e5e2db;
          border-radius: 10px;
          overflow: hidden;
          position: sticky;
          top: 1rem;
          font-family: 'Inter', sans-serif;
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

        .palette-search {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e2db;
        }

        .palette-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .palette-search-icon {
          position: absolute;
          left: 0.6rem;
          color: #9ca3af;
          pointer-events: none;
        }

        .palette-search-input {
          width: 100%;
          padding: 0.5rem 0.6rem 0.5rem 2rem;
          border: 1.5px solid #e5e2db;
          border-radius: 7px;
          font-family: 'Inter', sans-serif;
          font-size: 0.78rem;
          color: #0a1f14;
          outline: none;
          background: #fafaf8;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .palette-search-input:focus {
          border-color: #00563f;
          box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1);
          background: #ffffff;
        }

        .palette-search-input::placeholder { color: #c4c0b8; }

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

        <div className="palette-search">
          <div className="palette-search-wrap">
            <Search size={13} className="palette-search-icon" />
            <input
              type="text"
              className="palette-search-input"
              placeholder="Filter courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="palette-body">
          {filtered.length === 0 && (
            <p className="palette-empty">
              {searchQuery ? "No courses match your filter" : "No courses available"}
            </p>
          )}
          {lectures.length > 0 && <PaletteSection label="Lectures" items={lectures} />}
          {labs.length > 0 && <PaletteSection label="Labs" items={labs} />}
          {clinicals.length > 0 && <PaletteSection label="Clinicals" items={clinicals} />}
        </div>
      </div>
    </>
  );
}
