import { useRef, useEffect, useState, useMemo } from "react";
import "../App.css";
import { Plus, Trash2, Pencil, Building2 } from "lucide-react";
import { useDrop } from "react-dnd";
import { sections as sectionsApi } from "../Lib/api";
import type { Schedule, Course, Section } from "../Lib/Types";
import { courseTypeColor, dayOfWeekName, timeSpanToDisplay } from "../Lib/Types";
import { CourseDetailsModal } from "./CourseDetailsModal";
import { useToast } from "../Lib/ToastContext";

interface ScheduleCanvasProps {
  schedule: Schedule;
  isSemester5: boolean;
  courses: Course[];
  isLocked: boolean;
  onRefresh: () => void;
  onDrop: (
    courseId: number,
    dayOfWeek?: string,
    timeSlot?: string,
    dateRange?: string,
  ) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

//30-min slots from 7:00am to 7:00pm
const SLOT_START_HOUR = 7;
const SLOT_END_HOUR = 19;
const SLOT_HEIGHT = 32;
const SLOTS: string[] = [];
for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
  for (let m = 0; m < 60; m += 30) {
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    SLOTS.push(`${displayHour}:${m.toString().padStart(2, "0")} ${period}`);
  }
}

interface DropItem {
  courseId: number;
  courseCode: string;
  courseType: string;
}

interface DeleteConfirm {
  sectionId: number;
  courseCode: string;
  dayOfWeek?: string;
  timeSlot?: string;
}

interface EditModal {
  section: Section;
  course: Course;
}

//parse "HH:mm:ss" timespan to total minutes from midnight
function timeSpanToMinutes(ts: string | null): number {
  if (!ts) return 0;
  const parts = ts.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function DropZone({
  day,
  time,
  onDrop,
}: {
  day?: string;
  time?: string;
  onDrop: (courseId: number, day?: string, time?: string) => void;
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
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s",
        background: isOver ? "rgba(0, 86, 63, 0.08)" : "transparent",
        borderRadius: "3px",
      }}
    >
      {isOver && <Plus size={12} color="#00563f" />}
    </div>
  );
}

function Semester5DropZone({ onDrop }: { onDrop: (courseId: number) => void }) {
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
          fontFamily: "Inter, sans-serif",
        }}
      >
        Drop course here to add to schedule
      </p>
    </div>
  );
}

export function ScheduleCanvas({
  schedule,
  isSemester5,
  courses,
  isLocked,
  onRefresh,
  onDrop,
}: ScheduleCanvasProps) {
  const { addToast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [editModal, setEditModal] = useState<EditModal | null>(null);

  const [tooltipSection, setTooltipSection] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  //map sections to display data
  const scheduledSections = schedule.sections.map((section) => {
    const course = courses.find((c) => c.id === section.courseId);
    return { section, course };
  }).filter((s) => s.course) as { section: Section; course: Course }[];

  //detect overlapping sections on same day/time (conflicts)
  const conflictSectionIds = useMemo(() => {
    const ids = new Set<number>();
    const timed = scheduledSections.filter(({ section }) =>
      section.dayOfWeek != null && section.startTime && section.endTime
    );
    for (let i = 0; i < timed.length; i++) {
      for (let j = i + 1; j < timed.length; j++) {
        const a = timed[i].section;
        const b = timed[j].section;
        if (a.dayOfWeek !== b.dayOfWeek) continue;
        const aStart = timeSpanToMinutes(a.startTime);
        const aEnd = timeSpanToMinutes(a.endTime);
        const bStart = timeSpanToMinutes(b.startTime);
        const bEnd = timeSpanToMinutes(b.endTime);
        if (aStart < bEnd && bStart < aEnd) {
          ids.add(a.id);
          ids.add(b.id);
        }
      }
    }
    return ids;
  }, [scheduledSections]);

  const handleTooltipEnter = (sectionId: number, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    setTooltipSection(sectionId);
  };

  //build occupied slot map for drop zone hiding
  const occupiedSlots = useMemo(() => {
    const occupied = new Set<string>();
    scheduledSections.forEach(({ section }) => {
      if (section.dayOfWeek == null || !section.startTime || !section.endTime) return;
      const dayName = dayOfWeekName(section.dayOfWeek);
      const startMins = timeSpanToMinutes(section.startTime);
      const endMins = timeSpanToMinutes(section.endTime);
      const originMins = SLOT_START_HOUR * 60;
      for (let m = startMins; m < endMins; m += 30) {
        if (m >= originMins) {
          occupied.add(`${dayName}-${m}`);
        }
      }
    });
    return occupied;
  }, [scheduledSections]);

  const handleDelete = async (sectionId: number) => {
    try {
      await sectionsApi.removeFromSchedule(sectionId, schedule.id);
      setDeleteConfirm(null);
      addToast("success", "Section removed from schedule");
      onRefresh();
    } catch (err: any) {
      addToast("error", err.message || "Failed to remove section");
      setDeleteConfirm(null);
    }
  };

  const getColor = (course: Course) => courseTypeColor(course.defaultType);

  const totalHeight = SLOTS.length * SLOT_HEIGHT;

  return (
    <>
      <style>{`
        .canvas-root {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .canvas-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fafaf9;
        }

        .canvas-header h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .canvas-body { padding: 0.75rem; overflow-x: auto; }

        .cal-grid {
          display: grid;
          grid-template-columns: 64px repeat(5, 1fr);
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
          min-width: 600px;
        }

        .cal-corner {
          background: #003d2a;
          border-right: 2px solid #e5e7eb;
          border-bottom: 2px solid #e5e7eb;
        }

        .cal-day-header {
          padding: 0.6rem 0.5rem;
          text-align: center;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #ffffff;
          background: #00563f;
          border-bottom: 2px solid #e5e7eb;
          border-right: 1px solid rgba(255,255,255,0.1);
        }

        .cal-day-header:last-child { border-right: none; }

        .cal-time-col {
          border-right: 2px solid #e5e7eb;
        }

        .cal-time-label {
          height: ${SLOT_HEIGHT}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.68rem;
          color: #9ca3af;
          background: #fafaf9;
          border-bottom: 1px solid #f3f4f6;
          font-weight: 500;
          white-space: nowrap;
          padding: 0 0.25rem;
        }

        .cal-time-label.hour-mark {
          border-bottom-color: #e5e7eb;
          color: #6b7280;
        }

        .cal-day-col {
          position: relative;
          border-right: 1px solid #e5e7eb;
        }

        .cal-day-col:last-child { border-right: none; }

        .cal-slot-line {
          position: absolute;
          left: 0;
          right: 0;
          border-bottom: 1px solid #f3f4f6;
          pointer-events: none;
        }

        .cal-slot-line.hour-mark {
          border-bottom-color: #e5e7eb;
        }

        .cal-drop-zone {
          position: absolute;
          left: 0;
          right: 0;
        }

        .course-block {
          position: absolute;
          left: 3px;
          right: 3px;
          border-radius: 6px;
          color: #ffffff;
          font-size: 0.75rem;
          overflow: hidden;
          cursor: default;
          transition: box-shadow 0.15s;
          z-index: 2;
          display: flex;
          flex-direction: column;
          border-left: 4px solid rgba(0,0,0,0.2);
        }

        .course-block:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

        .course-block-inner {
          padding: 0.3rem 0.4rem;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .course-block-actions {
          position: absolute;
          top: 2px;
          right: 2px;
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .course-block:hover .course-block-actions { opacity: 1; }

        .course-block-btn {
          background: rgba(0,0,0,0.3);
          border: none;
          border-radius: 3px;
          color: #ffffff;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          transition: background 0.15s;
        }

        .course-block-btn.edit:hover { background: rgba(0, 86, 63, 0.8); }
        .course-block-btn.delete:hover { background: rgba(220, 38, 38, 0.7); }

        .course-block-time { font-size: 0.62rem; opacity: 0.85; margin-bottom: 1px; }
        .course-block-code { font-weight: 600; font-size: 0.78rem; padding-right: 30px; line-height: 1.2; }
        .course-block-sec { opacity: 0.85; font-size: 0.68rem; }
        .course-block-room { font-size: 0.66rem; opacity: 0.85; margin-top: 1px; }
        .course-block-instructor { font-size: 0.64rem; opacity: 0.75; }
        .course-block-term { font-size: 0.62rem; opacity: 0.8; font-weight: 600; background: rgba(255,255,255,0.2); display: inline-block; padding: 0 4px; border-radius: 3px; margin-top: 1px; }

        @keyframes conflictPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
          50% { box-shadow: 0 0 8px 2px rgba(220, 38, 38, 0.35); }
        }

        .course-block.has-conflict {
          animation: conflictPulse 2s ease-in-out infinite;
          border-left-color: #dc2626 !important;
        }

        .course-block-tooltip {
          position: fixed;
          z-index: 9999;
          background: #1c1917;
          color: #ffffff;
          border-radius: 8px;
          padding: 0.65rem 0.85rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          line-height: 1.55;
          pointer-events: none;
          transform: translate(-50%, -100%);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          max-width: 240px;
          white-space: normal;
        }

        .course-block-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: #1c1917;
        }

        .tooltip-label { color: #9ca3af; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .tooltip-value { color: #ffffff; font-weight: 500; }
        .tooltip-row { display: flex; gap: 0.4rem; align-items: baseline; }
        .tooltip-conflict { color: #fca5a5; font-weight: 500; margin-top: 0.3rem; }

        .sem5-card {
          border-radius: 8px;
          padding: 1rem 1.25rem;
          border: 1px solid #e5e7eb;
          margin-bottom: 0.75rem;
          border-left-width: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          transition: box-shadow 0.15s;
        }

        .sem5-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
        .sem5-card-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; font-weight: 600; color: #111827; margin: 0 0 0.2rem 0; }
        .sem5-card-name { font-size: 0.82rem; color: #6b7280; margin: 0 0 0.2rem 0; }
        .sem5-card-date { font-size: 0.78rem; color: #9ca3af; margin: 0; }
        .sem5-card-room { font-size: 0.78rem; color: #00563f; margin: 0.2rem 0 0 0; }
        .sem5-card-right { display: flex; align-items: center; gap: 0.5rem; }
        .sem5-section-badge { font-size: 0.75rem; font-weight: 500; color: #6b7280; background: #f3f4f6; padding: 0.2rem 0.6rem; border-radius: 4px; }

        .sem5-action-btn {
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

        .sem5-action-btn.edit:hover { color: #00563f; background: #f0faf5; }
        .sem5-action-btn.delete:hover { color: #dc2626; background: #fef2f2; }

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
          font-family: 'Inter', sans-serif;
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

        .delete-box h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #111827; margin: 0 0 0.5rem 0; }
        .delete-box p { font-size: 0.85rem; color: #6b7280; margin: 0 0 1.5rem 0; line-height: 1.5; }
        .delete-box-actions { display: flex; gap: 0.75rem; }

        .delete-btn-cancel {
          flex: 1; padding: 0.65rem;
          border: 1.5px solid #e5e7eb; border-radius: 8px;
          background: #ffffff; color: #6b7280;
          font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }

        .delete-btn-cancel:hover { background: #f9fafb; }

        .delete-btn-confirm {
          flex: 1; padding: 0.65rem;
          background: #dc2626; color: #ffffff; border: none; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }

        .delete-btn-confirm:hover { background: #b91c1c; }
      `}</style>

      <div className="canvas-root">
        <div className="canvas-header">
          <h3>{isSemester5 ? "Rotation Schedule" : "Weekly Calendar"}</h3>
          {!isSemester5 && (
            <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
              {schedule.sections.length} section{schedule.sections.length !== 1 ? "s" : ""} scheduled
            </span>
          )}
        </div>

        <div className="canvas-body">
          {isSemester5 ? (
            <div>
              {scheduledSections.map(({ section, course }) => (
                <div
                  key={section.id}
                  className="sem5-card"
                  style={{ borderLeftColor: getColor(course) }}
                >
                  <div>
                    <p className="sem5-card-title">{section.courseCode}</p>
                    <p className="sem5-card-name">{section.courseName}</p>
                    {section.dateRange && (
                      <p className="sem5-card-date">{section.dateRange}</p>
                    )}
                    {section.roomNumber && (
                      <p className="sem5-card-room">
                        {section.roomBuilding} {section.roomNumber}
                      </p>
                    )}
                    {section.instructorName && (
                      <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "0.2rem 0 0" }}>
                        {section.instructorName}
                      </p>
                    )}
                    {section.notes && (
                      <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0.2rem 0 0" }}>
                        {section.notes}
                      </p>
                    )}
                  </div>
                  <div className="sem5-card-right">
                    <span className="sem5-section-badge">
                      Section {section.sectionNumber}
                    </span>
                    {!isLocked && (
                      <>
                        <button
                          className="sem5-action-btn edit"
                          onClick={() => setEditModal({ section, course })}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="sem5-action-btn delete"
                          onClick={() =>
                            setDeleteConfirm({
                              sectionId: section.id,
                              courseCode: section.courseCode,
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {!isLocked && (
                <Semester5DropZone
                  onDrop={(courseId) => onDrop(courseId, undefined, undefined, "")}
                />
              )}
            </div>
          ) : (
            <div className="cal-grid">
              {/* header row */}
              <div className="cal-corner" />
              {DAYS.map((day) => (
                <div key={day} className="cal-day-header">{day}</div>
              ))}

              {/* time column */}
              <div className="cal-time-col">
                {SLOTS.map((slot, i) => (
                  <div
                    key={slot}
                    className={`cal-time-label ${i % 2 === 0 ? "hour-mark" : ""}`}
                  >
                    {i % 2 === 0 ? slot : ""}
                  </div>
                ))}
              </div>

              {/* day columns with positioned blocks */}
              {DAYS.map((day) => {
                const daySections = scheduledSections.filter(({ section }) => {
                  return section.dayOfWeek != null && dayOfWeekName(section.dayOfWeek) === day;
                });

                const originMins = SLOT_START_HOUR * 60;

                return (
                  <div
                    key={day}
                    className="cal-day-col"
                    style={{ height: totalHeight }}
                  >
                    {/* slot grid lines */}
                    {SLOTS.map((_, i) => (
                      <div
                        key={i}
                        className={`cal-slot-line ${i % 2 === 0 ? "hour-mark" : ""}`}
                        style={{ top: (i + 1) * SLOT_HEIGHT }}
                      />
                    ))}

                    {/* drop zones for empty slots */}
                    {!isLocked && SLOTS.map((slot, i) => {
                      const slotMins = originMins + i * 30;
                      const key = `${day}-${slotMins}`;
                      if (occupiedSlots.has(key)) return null;

                      return (
                        <div
                          key={i}
                          className="cal-drop-zone"
                          style={{
                            top: i * SLOT_HEIGHT,
                            height: SLOT_HEIGHT,
                          }}
                        >
                          <DropZone
                            day={day}
                            time={slot}
                            onDrop={onDrop}
                          />
                        </div>
                      );
                    })}

                    {/* course blocks */}
                    {daySections.map(({ section, course }) => {
                      const startMins = timeSpanToMinutes(section.startTime);
                      const endMins = timeSpanToMinutes(section.endTime);
                      const top = ((startMins - originMins) / 30) * SLOT_HEIGHT;
                      const height = ((endMins - startMins) / 30) * SLOT_HEIGHT;
                      const color = getColor(course);
                      const startDisplay = timeSpanToDisplay(section.startTime);
                      const endDisplay = timeSpanToDisplay(section.endTime);
                      const hasConflict = conflictSectionIds.has(section.id);

                      return (
                        <div
                          key={section.id}
                          className={`course-block${hasConflict ? " has-conflict" : ""}`}
                          style={{
                            top,
                            height: Math.max(height - 2, SLOT_HEIGHT - 2),
                            backgroundColor: color,
                          }}
                          onMouseEnter={(e) => handleTooltipEnter(section.id, e)}
                          onMouseLeave={() => setTooltipSection(null)}
                        >
                          <div className="course-block-inner">
                            {!isLocked && (
                              <div className="course-block-actions">
                                <button
                                  className="course-block-btn edit"
                                  onClick={() => setEditModal({ section, course })}
                                >
                                  <Pencil size={10} />
                                </button>
                                <button
                                  className="course-block-btn delete"
                                  onClick={() =>
                                    setDeleteConfirm({
                                      sectionId: section.id,
                                      courseCode: section.courseCode,
                                      dayOfWeek: day,
                                      timeSlot: startDisplay,
                                    })
                                  }
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            )}
                            <div className="course-block-time">
                              {startDisplay} – {endDisplay}
                            </div>
                            <div className="course-block-code">
                              {section.courseCode}
                            </div>
                            <div className="course-block-sec">
                              Sec {section.sectionNumber}
                            </div>
                            {height > SLOT_HEIGHT * 2 && (
                              <>
                                {section.roomNumber && (
                                  <div className="course-block-room">
                                    <Building2 size={9} style={{ display: "inline", verticalAlign: "middle", marginRight: "2px", opacity: 0.85 }} />
                                    {section.roomBuilding} {section.roomNumber}
                                  </div>
                                )}
                                {section.instructorName && (
                                  <div className="course-block-instructor">
                                    {section.instructorName}
                                  </div>
                                )}
                                {section.term && section.term !== "Full" && (
                                  <span className="course-block-term">
                                    {section.term === "Term1" ? "T1" : "T2"}
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {tooltipSection === section.id && (
                            <div
                              className="course-block-tooltip"
                              style={{ left: tooltipPos.x, top: tooltipPos.y }}
                            >
                              <div style={{ fontWeight: 600, marginBottom: "0.3rem" }}>
                                {section.courseCode} — {section.courseName}
                              </div>
                              <div className="tooltip-row"><span className="tooltip-label">Section:</span> <span className="tooltip-value">{section.sectionNumber}</span></div>
                              <div className="tooltip-row"><span className="tooltip-label">Time:</span> <span className="tooltip-value">{startDisplay} – {endDisplay}</span></div>
                              <div className="tooltip-row"><span className="tooltip-label">Day:</span> <span className="tooltip-value">{day}</span></div>
                              {section.roomNumber && (
                                <div className="tooltip-row"><span className="tooltip-label">Room:</span> <span className="tooltip-value">{section.roomBuilding} {section.roomNumber}</span></div>
                              )}
                              {section.instructorName && (
                                <div className="tooltip-row"><span className="tooltip-label">Instructor:</span> <span className="tooltip-value">{section.instructorName}</span></div>
                              )}
                              {section.term && section.term !== "Full" && (
                                <div className="tooltip-row"><span className="tooltip-label">Term:</span> <span className="tooltip-value">{section.term === "Term1" ? "Term 1" : "Term 2"}</span></div>
                              )}
                              {hasConflict && (
                                <div className="tooltip-conflict">⚠ Time conflict detected</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
                onClick={() => handleDelete(deleteConfirm.sectionId)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && !isLocked && (
        <CourseDetailsModal
          scheduleId={schedule.id}
          semesterId={schedule.semesterId}
          courseId={editModal.course.id}
          isSemester5={isSemester5}
          semesterLevel={schedule.semesterLevel}
          courses={courses}
          locationDisplay={schedule.locationDisplay}
          editSection={editModal.section}
          onClose={() => setEditModal(null)}
          onSuccess={() => {
            onRefresh();
            setEditModal(null);
          }}
        />
      )}
    </>
  );
}
