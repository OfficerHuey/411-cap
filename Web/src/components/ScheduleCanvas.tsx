import { useRef, useEffect, useState } from "react";
import "../App.css";
import { Plus, Trash2 } from "lucide-react";
import { useDrop } from "react-dnd";
import { dataStore } from "../Lib/Store";
import type {
  ScheduleGroup,
  Course,
  CourseSection,
  ScheduleSection,
} from "../Lib/Types";

interface ScheduleCanvasProps {
  scheduleGroup: ScheduleGroup;
  isSemester5: boolean;
  courses: Course[];
  courseSections: CourseSection[];
  scheduleSections: ScheduleSection[];
  onRefresh: () => void;
  onDrop: (
    courseId: string,
    dayOfWeek?: string,
    timeSlot?: string,
    dateRange?: string,
  ) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

interface DropItem {
  courseId: string;
  courseCode: string;
  courseType: string;
}

interface DeleteConfirm {
  scheduleSectionId: string;
  courseCode: string;
  dayOfWeek?: string;
  timeSlot?: string;
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
  const onDropRef = useRef(onDrop);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "course",
    drop: (item: DropItem) => {
      onDropRef.current(item.courseId, day, time);
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));
  drop(elementRef);

  return (
    <div
      ref={elementRef}
      style={{
        minHeight: "56px",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s",
        background: isOver ? "rgba(0, 86, 63, 0.06)" : "transparent",
      }}
    >
      {isOver && <Plus size={14} color="#00563f" />}
    </div>
  );
}

function Semester5DropZone({ onDrop }: { onDrop: (courseId: string) => void }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const onDropRef = useRef(onDrop);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "course",
    drop: (item: DropItem) => {
      onDropRef.current(item.courseId);
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));
  drop(elementRef);

  return (
    <div
      ref={elementRef}
      style={{
        border: `2px dashed ${isOver ? "#00563f" : "#d1d5db"}`,
        borderRadius: "10px",
        padding: "2rem",
        textAlign: "center",
        background: isOver ? "rgba(0, 86, 63, 0.04)" : "transparent",
        transition: "all 0.15s",
      }}
    >
      <Plus
        size={28}
        color={isOver ? "#00563f" : "#9ca3af"}
        style={{ margin: "0 auto 0.5rem" }}
      />
      <p
        style={{
          fontSize: "0.85rem",
          color: "#9ca3af",
          margin: 0,
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        Drop course here to add to schedule
      </p>
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
  onDrop,
}: ScheduleCanvasProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(
    null,
  );

  const getCourseSectionsForSchedule = () => {
    return scheduleSections
      .map((ss) => {
        const courseSection = courseSections.find(
          (cs) => cs.id === ss.courseSectionId,
        );
        if (!courseSection) return null;
        const course = courses.find((c) => c.id === courseSection.courseId);
        if (!course) return null;
        return { scheduleSection: ss, courseSection, course };
      })
      .filter(Boolean) as {
      scheduleSection: ScheduleSection;
      courseSection: CourseSection;
      course: Course;
    }[];
  };

  const getSectionForSlot = (day: string, time: string) => {
    const sections = getCourseSectionsForSchedule();
    return sections.find(
      ({ courseSection }) =>
        courseSection.dayOfWeek === day && courseSection.timeSlot === time,
    );
  };

  const handleDelete = (scheduleSectionId: string) => {
    dataStore.deleteScheduleSection(scheduleSectionId);
    setDeleteConfirm(null);
    onRefresh();
  };

  const scheduledSections = getCourseSectionsForSchedule();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .canvas-root {
          background: #ffffff;
          border: 1px solid #e5e2db;
          border-radius: 10px;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .canvas-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #e5e2db;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fafaf8;
        }

        .canvas-header h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0;
        }

        .canvas-body {
          padding: 1rem;
          overflow-x: auto;
        }

        .canvas-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }

        .canvas-table th {
          padding: 0.6rem 0.75rem;
          text-align: center;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #ffffff;
          background: #00563f;
          border: 1px solid #004d38;
        }

        .canvas-table th.time-col {
          background: #003d2a;
          width: 80px;
        }

        .canvas-table td {
          border: 1px solid #e5e2db;
          vertical-align: top;
          padding: 0;
        }

        .canvas-table td.time-cell {
          padding: 0.5rem;
          text-align: center;
          font-size: 0.72rem;
          color: #9ca3af;
          background: #fafaf8;
          font-weight: 500;
          white-space: nowrap;
          border-right: 2px solid #e5e2db;
        }

        .canvas-table tr:nth-child(even) td.time-cell { background: #f5f4f0; }
        .canvas-table tr:hover td { background-color: rgba(0, 86, 63, 0.015); }
        .canvas-table tr:hover td.time-cell { background: #f0ede8; }

        .course-block {
          margin: 3px;
          padding: 0.4rem 0.5rem;
          border-radius: 5px;
          color: #ffffff;
          font-size: 0.78rem;
          cursor: pointer;
          transition: opacity 0.15s;
          position: relative;
        }

        .course-block:hover .course-block-delete {
          opacity: 1;
        }

        .course-block-delete {
          position: absolute;
          top: 3px;
          right: 3px;
          opacity: 0;
          background: rgba(0,0,0,0.25);
          border: none;
          border-radius: 3px;
          color: #ffffff;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          transition: opacity 0.15s, background 0.15s;
        }

        .course-block-delete:hover { background: rgba(220, 38, 38, 0.7); }

        .course-block-code { font-weight: 600; margin-bottom: 0.1rem; padding-right: 16px; }
        .course-block-sec { opacity: 0.85; font-size: 0.72rem; }
        .course-block-room { font-size: 0.7rem; opacity: 0.85; margin-top: 0.2rem; }
        .course-block-notes { font-size: 0.68rem; opacity: 0.75; margin-top: 0.1rem; }

        .sem5-card {
          border-radius: 8px;
          padding: 1rem 1.25rem;
          border: 1px solid #e5e2db;
          margin-bottom: 0.75rem;
          border-left-width: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          transition: box-shadow 0.15s;
        }

        .sem5-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
        .sem5-card-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; font-weight: 600; color: #0a1f14; margin: 0 0 0.2rem 0; }
        .sem5-card-name { font-size: 0.82rem; color: #6b7280; margin: 0 0 0.2rem 0; }
        .sem5-card-date { font-size: 0.78rem; color: #9ca3af; margin: 0; }
        .sem5-card-room { font-size: 0.78rem; color: #00563f; margin: 0.2rem 0 0 0; }
        .sem5-card-right { display: flex; align-items: center; gap: 0.75rem; }
        .sem5-section-badge { font-size: 0.75rem; font-weight: 500; color: #6b7280; background: #f3f4f6; padding: 0.2rem 0.6rem; border-radius: 4px; }

        .sem5-delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #d1d5db;
          padding: 0.25rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s, background 0.15s;
        }

        .sem5-delete-btn:hover { color: #dc2626; background: #fef2f2; }

        /* Delete confirm popup */
        .delete-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(2px);
        }

        .delete-box {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.75rem;
          max-width: 360px;
          width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          font-family: 'DM Sans', sans-serif;
          text-align: center;
        }

        .delete-box-icon {
          width: 48px;
          height: 48px;
          background: #fef2f2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .delete-box h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          color: #0a1f14;
          margin: 0 0 0.5rem 0;
        }

        .delete-box p {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0 0 1.5rem 0;
          line-height: 1.5;
        }

        .delete-box-actions {
          display: flex;
          gap: 0.75rem;
        }

        .delete-btn-cancel {
          flex: 1;
          padding: 0.65rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          color: #6b7280;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .delete-btn-cancel:hover { background: #f9fafb; }

        .delete-btn-confirm {
          flex: 1;
          padding: 0.65rem;
          background: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .delete-btn-confirm:hover { background: #b91c1c; }
      `}</style>

      <div className="canvas-root">
        <div className="canvas-header">
          <h3>{isSemester5 ? "Rotation Schedule" : "Weekly Calendar"}</h3>
        </div>

        <div className="canvas-body">
          {isSemester5 ? (
            <div>
              {scheduledSections.map(
                ({ scheduleSection, courseSection, course }) => (
                  <div
                    key={courseSection.id}
                    className="sem5-card"
                    style={{ borderLeftColor: course.color }}
                  >
                    <div>
                      <p className="sem5-card-title">{course.code}</p>
                      <p className="sem5-card-name">{course.name}</p>
                      {courseSection.dateRange && (
                        <p className="sem5-card-date">
                          {courseSection.dateRange}
                        </p>
                      )}
                      {courseSection.classroom && (
                        <p className="sem5-card-room">
                          📍 {courseSection.classroom}
                        </p>
                      )}
                      {courseSection.notes && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                            margin: "0.2rem 0 0",
                          }}
                        >
                          {courseSection.notes}
                        </p>
                      )}
                    </div>
                    <div className="sem5-card-right">
                      <span className="sem5-section-badge">
                        Section {courseSection.sectionNumber}
                      </span>
                      <button
                        className="sem5-delete-btn"
                        onClick={() =>
                          setDeleteConfirm({
                            scheduleSectionId: scheduleSection.id,
                            courseCode: course.code,
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ),
              )}
              <Semester5DropZone
                onDrop={(courseId) =>
                  onDrop(courseId, undefined, undefined, "")
                }
              />
            </div>
          ) : (
            <table className="canvas-table">
              <thead>
                <tr>
                  <th className="time-col">Time</th>
                  {DAYS.map((day) => (
                    <th key={day}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time) => (
                  <tr key={time}>
                    <td className="time-cell">{time}</td>
                    {DAYS.map((day) => {
                      const section = getSectionForSlot(day, time);
                      return (
                        <td key={`${day}-${time}`}>
                          {section ? (
                            <div
                              className="course-block"
                              style={{ backgroundColor: section.course.color }}
                            >
                              <button
                                className="course-block-delete"
                                onClick={() =>
                                  setDeleteConfirm({
                                    scheduleSectionId:
                                      section.scheduleSection.id,
                                    courseCode: section.course.code,
                                    dayOfWeek: section.courseSection.dayOfWeek,
                                    timeSlot: section.courseSection.timeSlot,
                                  })
                                }
                              >
                                <Trash2 size={10} />
                              </button>
                              <div className="course-block-code">
                                {section.course.code}
                              </div>
                              <div className="course-block-sec">
                                Sec {section.courseSection.sectionNumber}
                              </div>
                              {section.courseSection.classroom && (
                                <div className="course-block-room">
                                  📍 {section.courseSection.classroom}
                                </div>
                              )}
                              {section.courseSection.notes && (
                                <div className="course-block-notes">
                                  {section.courseSection.notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <DropZone day={day} time={time} onDrop={onDrop} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon">
              <Trash2 size={20} color="#dc2626" />
            </div>
            <h3>Remove from Schedule?</h3>
            <p>
              This will remove <strong>{deleteConfirm.courseCode}</strong>
              {deleteConfirm.dayOfWeek && ` on ${deleteConfirm.dayOfWeek}`}
              {deleteConfirm.timeSlot && ` at ${deleteConfirm.timeSlot}`} from
              the schedule.
            </p>
            <div className="delete-box-actions">
              <button
                className="delete-btn-cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="delete-btn-confirm"
                onClick={() => handleDelete(deleteConfirm.scheduleSectionId)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
