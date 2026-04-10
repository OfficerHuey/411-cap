import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Trash2, Pencil, Building2, AlertTriangle, Info } from "lucide-react";
import { useDrop, useDrag } from "react-dnd";
import { sections as sectionsApi } from "../Lib/api";
import type { Schedule, Course, Section } from "../Lib/Types";
import { courseTypeColor, dayOfWeekName, timeSpanToDisplay } from "../Lib/Types";
import { CourseDetailsModal } from "./CourseDetailsModal";
import { ConflictBanner } from "./ConflictBanner";
import type { ConflictEntry } from "./ConflictBanner";
import { useToast } from "../Lib/ToastContext";
import { NumberBadge } from "./ui/NumberBadge";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { EditAttribution } from "./EditAttribution";
import styles from "./ScheduleCanvas.module.css";

interface ScheduleCanvasProps {
  schedule: Schedule;
  semesterId: number;
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
  onInstructorClick?: (instructorId: number) => void;
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

interface PlacedSectionDragItem {
  type: "placed-section";
  sectionId: number;
  durationMinutes: number;
  fromDay: string;
  fromStartTime: string;
  courseCode: string;
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

//convert slot label like "8:00 AM" to "08:00:00" timespan format
function slotLabelToTimeSpan(label: string): string | null {
  const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function DropZone({
  day,
  time,
  onDrop,
  onPlacedMove,
}: {
  day?: string;
  time?: string;
  onDrop: (courseId: number, day?: string, time?: string) => void;
  onPlacedMove: (sectionId: number, durationMinutes: number, day?: string, time?: string) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const onDropRef = useRef(onDrop);
  const onPlacedMoveRef = useRef(onPlacedMove);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  useEffect(() => {
    onPlacedMoveRef.current = onPlacedMove;
  }, [onPlacedMove]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ["course", "placed-section"],
    drop: (item: DropItem | PlacedSectionDragItem) => {
      if ((item as PlacedSectionDragItem).type === "placed-section") {
        const placed = item as PlacedSectionDragItem;
        onPlacedMoveRef.current(placed.sectionId, placed.durationMinutes, day, time);
      } else {
        onDropRef.current((item as DropItem).courseId, day, time);
      }
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));
  drop(elementRef);

  return (
    <div
      ref={elementRef}
      className={`${styles.dropZoneInner} ${isOver ? styles.over : ""}`}
    >
      {isOver && <Plus size={12} color="var(--gold-500)" />}
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
      className={`${styles.sem5DropZone} ${isOver ? styles.over : ""}`}
    >
      <Plus
        size={28}
        color={isOver ? "var(--gold-500)" : "var(--text-faint)"}
        style={{ margin: "0 auto 0.5rem" }}
      />
      <p className={styles.sem5DropText}>
        Drop course here to add to schedule
      </p>
    </div>
  );
}

//draggable course block sub-component — hooks can't be called inside map
function DraggableCourseBlock({
  section,
  course,
  top,
  height,
  color,
  startDisplay,
  endDisplay,
  sectionConflicts,
  hasHard,
  hasSoft: _hasSoft,
  hasInfo,
  conflictClass,
  isLocked,
  day,
  bannerVisible,
  onEdit,
  onDelete,
  onTooltipEnter,
  onTooltipLeave,
  tooltipSection,
  tooltipPos,
  onInstructorClick,
}: {
  section: Section;
  course: Course;
  top: number;
  height: number;
  color: string;
  startDisplay: string;
  endDisplay: string;
  sectionConflicts: ConflictEntry[];
  hasHard: boolean;
  hasSoft: boolean;
  hasInfo: boolean;
  conflictClass: string;
  isLocked: boolean;
  day: string;
  bannerVisible: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTooltipEnter: (sectionId: number, e: React.MouseEvent) => void;
  onTooltipLeave: () => void;
  tooltipSection: number | null;
  tooltipPos: { x: number; y: number };
  onInstructorClick?: (instructorId: number) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);

  const durationMinutes =
    timeSpanToMinutes(section.endTime) - timeSpanToMinutes(section.startTime);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "placed-section",
      item: {
        type: "placed-section" as const,
        sectionId: section.id,
        durationMinutes,
        fromDay: section.dayOfWeek ?? "",
        fromStartTime: section.startTime ?? "",
        courseCode: section.courseCode,
      },
      canDrag: !isLocked,
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [section.id, section.dayOfWeek, section.startTime, section.endTime, isLocked],
  );

  drag(elementRef);

  const tooltipId = `conflict-tip-${section.id}`;
  const tooltipSuppressed = bannerVisible;

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (tooltipSuppressed) return;
    onTooltipEnter(section.id, e);
  };

  const handleMouseLeave = () => {
    if (tooltipSuppressed) return;
    onTooltipLeave();
  };

  return (
    <div
      ref={elementRef}
      id={`section-block-${section.id}`}
      className={`${styles.courseBlock}${conflictClass}${isDragging ? " " + styles.dragging : ""}`}
      tabIndex={0}
      style={{
        top,
        height: Math.max(height - 2, SLOT_HEIGHT - 2),
        background: `linear-gradient(135deg, ${color}d9, ${color})`,
        borderLeft: `3px solid ${color}`,
        cursor: isLocked ? "default" : "grab",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={(e) => {
        if (!tooltipSuppressed) onTooltipEnter(section.id, e as unknown as React.MouseEvent);
      }}
      onBlur={() => {
        if (!tooltipSuppressed) onTooltipLeave();
      }}
      aria-describedby={sectionConflicts.length > 0 ? tooltipId : undefined}
    >
      {sectionConflicts.length > 0 && (
        <span
          className={styles.conflictIcon}
          tabIndex={0}
          role="img"
          aria-label={sectionConflicts.map((c) => `${c.type}: ${c.message}`).join("; ")}
          onFocus={(e) => {
            e.stopPropagation();
            if (!tooltipSuppressed) onTooltipEnter(section.id, e as unknown as React.MouseEvent);
          }}
          onBlur={onTooltipLeave}
        >
          {hasHard ? (
            <AlertTriangle size={10} color="#fca5a5" />
          ) : hasInfo ? (
            <Info size={10} color="#93c5fd" />
          ) : (
            <AlertTriangle size={10} color="#fcd34d" />
          )}
        </span>
      )}
      <div className={`${styles.courseBlockInner}${sectionConflicts.length > 0 ? " " + styles.hasConflict : ""}`}>
        {!isLocked && (
          <div className={styles.courseBlockActions}>
            <button
              className={`${styles.courseBlockBtn} ${styles.edit}`}
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              aria-label="Edit section"
            >
              <Pencil size={12} />
            </button>
            <button
              className={`${styles.courseBlockBtn} ${styles.delete}`}
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              aria-label="Delete section"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
        <div className={styles.blockTime}>
          {startDisplay} &ndash; {endDisplay}
        </div>
        <div className={styles.blockCode}>
          {section.courseCode}
        </div>
        <div className={styles.blockSec}>
          Sec {section.sectionNumber}
        </div>
        {height > SLOT_HEIGHT * 2 && (
          <>
            {section.roomNumber && (
              <div className={styles.blockRoom}>
                <Building2 size={9} style={{ display: "inline", verticalAlign: "middle", marginRight: "2px", opacity: 0.85 }} />
                {section.roomBuilding} {section.roomNumber}
              </div>
            )}
            {section.instructorName && (
              <div
                className={styles.blockInstructor}
                onClick={(e) => {
                  if (onInstructorClick && section.instructorId) {
                    e.stopPropagation();
                    onInstructorClick(section.instructorId);
                  }
                }}
                style={onInstructorClick && section.instructorId ? { cursor: "pointer" } : undefined}
              >
                {section.instructorName}
              </div>
            )}
            {section.term && section.term !== "Full" && (
              <span className={styles.blockTerm}>
                {section.term === "Term1" ? "T1" : "T2"}
              </span>
            )}
            {course.defaultType === "Clinical" && (
              <div className={styles.blockPreclinical}>
                Pre-clinical: typically the day before
              </div>
            )}
          </>
        )}
        {height > SLOT_HEIGHT * 3 && (
          <div className={styles.blockAttribution}>
            <EditAttribution entityType="Section" entityId={section.id} />
          </div>
        )}
      </div>

      {!tooltipSuppressed && tooltipSection === section.id && (
        <div
          id={tooltipId}
          role="tooltip"
          className={styles.blockTooltip}
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.3rem" }}>
            {section.courseCode} &mdash; {section.courseName}
          </div>
          <div className={styles.tooltipRow}><span className={styles.tooltipLabel}>Section:</span> <span className={styles.tooltipValue}>{section.sectionNumber}</span></div>
          <div className={styles.tooltipRow}><span className={styles.tooltipLabel}>Time:</span> <span className={styles.tooltipValue}>{startDisplay} &ndash; {endDisplay}</span></div>
          <div className={styles.tooltipRow}><span className={styles.tooltipLabel}>Day:</span> <span className={styles.tooltipValue}>{day}</span></div>
          {section.roomNumber && (
            <div className={styles.tooltipRow}><span className={styles.tooltipLabel}>Room:</span> <span className={styles.tooltipValue}>{section.roomBuilding} {section.roomNumber}</span></div>
          )}
          {section.instructorName && (
            <div className={styles.tooltipRow}><span className={styles.tooltipLabel}>Instructor:</span> <span className={styles.tooltipValue}>{section.instructorName}</span></div>
          )}
          {section.term && section.term !== "Full" && (
            <div className={styles.tooltipRow}><span className={styles.tooltipLabel}>Term:</span> <span className={styles.tooltipValue}>{section.term === "Term1" ? "Term 1" : "Term 2"}</span></div>
          )}
          {sectionConflicts.map((c, ci) => (
            <div key={ci} className={styles.tooltipConflict} style={{ color: c.severity === "Error" ? "#fca5a5" : c.severity === "Warning" ? "#fcd34d" : "#93c5fd" }}>
              {c.severity === "Error" ? "\u26a0" : c.severity === "Warning" ? "\u26a0" : "\u2139"} {c.type}: {c.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ScheduleCanvas({
  schedule,
  semesterId,
  isSemester5,
  courses,
  isLocked,
  onRefresh,
  onDrop,
  onInstructorClick,
}: ScheduleCanvasProps) {
  const { addToast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [editModal, setEditModal] = useState<EditModal | null>(null);

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
    return getCourseSectionsForSchedule().find(
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

        .canvas-body { padding: 1rem; overflow-x: auto; }

        .canvas-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }

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

        .canvas-table th.time-col { background: #003d2a; width: 80px; }
        .canvas-table td { border: 1px solid #e5e2db; vertical-align: top; padding: 0; }

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
          transition: opacity 0.15s;
          position: relative;
        }

        .course-block-actions {
          position: absolute;
          top: 3px;
          right: 3px;
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .course-block:hover .course-block-actions { opacity: 1; }

        .course-block-btn {
          background: rgba(0,0,0,0.25);
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

        .course-block-code { font-weight: 600; margin-bottom: 0.1rem; padding-right: 36px; }
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

        .delete-box h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #0a1f14; margin: 0 0 0.5rem 0; }
        .delete-box p { font-size: 0.85rem; color: #6b7280; margin: 0 0 1.5rem 0; line-height: 1.5; }
        .delete-box-actions { display: flex; gap: 0.75rem; }

        .delete-btn-cancel {
          flex: 1; padding: 0.65rem;
          border: 1.5px solid #e5e7eb; border-radius: 8px;
          background: #ffffff; color: #6b7280;
          font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }

        .delete-btn-cancel:hover { background: #f9fafb; }

        .delete-btn-confirm {
          flex: 1; padding: 0.65rem;
          background: #dc2626; color: #ffffff; border: none; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }

        .delete-btn-confirm:hover { background: #b91c1c; }
      `}</style>

      <div className="canvas-root">
        <div className="canvas-header">
          <h3>{isSemester5 ? "Rotation Schedule" : "Weekly Calendar"}</h3>
        </div>

        <div className={styles.body}>
          {!isSemester5 && (
            <ConflictBanner conflicts={allConflicts} onJumpTo={handleJumpTo} />
          )}
          {isSemester5 ? (
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {scheduledSections.map(({ section, course }) => (
                <div
                  key={section.id}
                  className={styles.sem5Card}
                  style={{ borderLeftColor: getColor(course) }}
                >
                  <div>
                    <p className={styles.sem5CardCode}>{section.courseCode}</p>
                    <p className={styles.sem5CardName}>{section.courseName}</p>
                    {section.dateRange && (
                      <p className={styles.sem5CardDate}>{section.dateRange}</p>
                    )}
                    {section.roomNumber && (
                      <p className={styles.sem5CardRoom}>
                        {section.roomBuilding} {section.roomNumber}
                      </p>
                    )}
                    {section.instructorName && (
                      <p
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          margin: "0.2rem 0 0",
                          cursor: onInstructorClick && section.instructorId ? "pointer" : undefined,
                        }}
                        onClick={() => {
                          if (onInstructorClick && section.instructorId) onInstructorClick(section.instructorId);
                        }}
                      >
                        {section.instructorName}
                      </p>
                    )}
                    {section.notes && (
                      <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", margin: "0.2rem 0 0" }}>
                        {section.notes}
                      </p>
                    )}
                    {course.defaultType === "Clinical" && (
                      <p className={styles.sem5Preclinical}>
                        Pre-clinical: typically the day before
                      </p>
                    )}
                    <EditAttribution entityType="Section" entityId={section.id} />
                  </div>
                  <div className={styles.sem5CardRight}>
                    <span className={styles.sem5SectionBadge}>
                      Section {section.sectionNumber}
                    </span>
                    {!isLocked && (
                      <>
                        <button
                          className={`${styles.sem5ActionBtn} ${styles.edit}`}
                          onClick={() => setEditModal({ section, course })}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className={`${styles.sem5ActionBtn} ${styles.delete}`}
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
            <div className={styles.calGrid}>
              {/* header row */}
              <div className={styles.calCorner} />
              {DAYS.map((day) => (
                <div key={day} className={styles.calDayHeader}>{day}</div>
              ))}

              {/* time column */}
              <div className={styles.calTimeCol}>
                {SLOTS.map((slot, i) => (
                  <div
                    key={slot}
                    className={`${styles.calTimeLabel} ${i % 2 === 0 ? styles.hourMark : ""}`}
                    style={{ height: SLOT_HEIGHT }}
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
                    className={styles.calDayCol}
                    style={{ height: totalHeight }}
                  >
                    {/* slot grid lines */}
                    {SLOTS.map((_, i) => (
                      <div
                        key={i}
                        className={`${styles.calSlotLine} ${i % 2 === 0 ? styles.hourMark : ""}`}
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
                          className={styles.calDropZone}
                          style={{
                            top: i * SLOT_HEIGHT,
                            height: SLOT_HEIGHT,
                          }}
                        >
                          <DropZone
                            day={day}
                            time={slot}
                            onDrop={onDrop}
                            onPlacedMove={handlePlacedMove}
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
                      const sectionConflicts = sectionConflictMap.get(section.id) || [];
                      const hasHard = sectionConflicts.some((c) => c.severity === "Error");
                      const hasSoft = sectionConflicts.some((c) => c.severity === "Warning");
                      const hasInfo = sectionConflicts.some((c) => c.severity === "Info");
                      const conflictClass = hasHard ? ` ${styles.conflictHard}` : hasSoft ? ` ${styles.conflictSoft}` : "";

                      return (
                        <DraggableCourseBlock
                          key={section.id}
                          section={section}
                          course={course}
                          top={top}
                          height={height}
                          color={color}
                          startDisplay={startDisplay}
                          endDisplay={endDisplay}
                          sectionConflicts={sectionConflicts}
                          hasHard={hasHard}
                          hasSoft={hasSoft}
                          hasInfo={hasInfo}
                          conflictClass={conflictClass}
                          isLocked={isLocked}
                          day={day}
                          bannerVisible={bannerVisible}
                          onEdit={() => setEditModal({ section, course })}
                          onDelete={() =>
                            setDeleteConfirm({
                              sectionId: section.id,
                              courseCode: section.courseCode,
                              dayOfWeek: day,
                              timeSlot: startDisplay,
                            })
                          }
                          onTooltipEnter={handleTooltipEnter}
                          onTooltipLeave={() => setTooltipSection(null)}
                          tooltipSection={tooltipSection}
                          tooltipPos={tooltipPos}
                          onInstructorClick={onInstructorClick}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={deleteConfirm != null}
        onClose={() => setDeleteConfirm(null)}
        title="Remove from schedule?"
        subtitle={deleteConfirm ? `${deleteConfirm.courseCode}${deleteConfirm.dayOfWeek ? ` on ${deleteConfirm.dayOfWeek}` : ""}${deleteConfirm.timeSlot ? ` at ${deleteConfirm.timeSlot}` : ""}` : ""}
        size="sm"
        number="ATTENTION"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm.sectionId)}>
              Remove
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
          This will remove the section from this schedule group.
        </p>
      </Modal>

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
