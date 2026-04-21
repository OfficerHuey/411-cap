import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, Building2, AlertTriangle, Info, BookOpen, FlaskConical, Stethoscope, CalendarPlus } from "lucide-react";
import { useDrop, useDrag } from "react-dnd";
import { sections as sectionsApi } from "../Lib/api";
import type { Schedule, Course, Section } from "../Lib/Types";
import { courseTypeColor, dayOfWeekName, timeSpanToDisplay } from "../Lib/Types";
import { CourseDetailsModal } from "./CourseDetailsModal";
import { ConflictBanner } from "./ConflictBanner";
import type { ConflictEntry } from "./ConflictBanner";
import { useToast } from "../Lib/ToastContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { badgePopVariants, ease } from "../Lib/motion";
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
  semesterStart?: string;
  semesterEnd?: string;
  onRefresh: () => void;
  onDrop: (
    courseId: number,
    dayOfWeek?: string,
    timeSlot?: string,
    dateRange?: string,
  ) => void;
  //optimistic handlers owned by the parent — when provided, canvas delegates instead of hitting the api itself
  onDeleteSection?: (sectionId: number) => Promise<void>;
  onMoveSection?: (sectionId: number, dayOfWeek: string, startTime: string, endTime: string) => Promise<void>;
  onInstructorClick?: (instructorId: number) => void;
}

//darken a hex color by a flat rgb amount for the left accent stripe
function darkenColor(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const num = parseInt(normalized, 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function courseTypeIcon(type: string) {
  switch (type) {
    case "Lecture": return <BookOpen size={11} />;
    case "Lab": return <FlaskConical size={11} />;
    case "Clinical": return <Stethoscope size={11} />;
    default: return null;
  }
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

//30-min slots from 7:00am to 7:00pm
const SLOT_START_HOUR = 7;
const SLOT_END_HOUR = 19;
const SLOT_HEIGHT = 44;
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
  isNewlyPlaced,
  reduced,
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
  isNewlyPlaced: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTooltipEnter: (sectionId: number, e: React.MouseEvent) => void;
  onTooltipLeave: () => void;
  tooltipSection: number | null;
  tooltipPos: { x: number; y: number };
  reduced?: boolean;
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
        backgroundColor: color,
        borderLeft: `4px solid ${darkenColor(color, 30)}`,
        cursor: isLocked ? "default" : "grab",
        //exposed as a css variable so hover glow can use the actual course color
        ["--block-color" as string]: color,
      } as React.CSSProperties}
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
      {isNewlyPlaced && !reduced && (
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 10,
            border: "2px solid var(--gold-400)",
            pointerEvents: "none",
            zIndex: 4,
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        />
      )}
      <AnimatePresence>
        {sectionConflicts.length > 0 && (
          <motion.span
            className={styles.conflictIcon}
            tabIndex={0}
            role="img"
            aria-label={sectionConflicts.map((c) => `${c.type}: ${c.message}`).join("; ")}
            variants={badgePopVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
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
          </motion.span>
        )}
      </AnimatePresence>
      <div className={styles.courseTypeIcon}>
        {courseTypeIcon(course.defaultType)}
      </div>
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
  semesterStart,
  semesterEnd,
  onRefresh,
  onDrop,
  onDeleteSection,
  onMoveSection,
  onInstructorClick,
}: ScheduleCanvasProps) {
  const { addToast } = useToast();
  const reduced = useReducedMotion();
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [allSemesterSections, setAllSemesterSections] = useState<Section[]>([]);

  //track which section ids were present on first render so newly placed ones animate differently
  const initialIdsRef = useRef<Set<number> | null>(null);
  if (initialIdsRef.current === null) {
    initialIdsRef.current = new Set(schedule.sections.map((s) => s.id));
  }

  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

  //live now-line — recompute every minute so the gold marker walks down today's column
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (isSemester5) return;
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [isSemester5]);

  const nowLine = useMemo(() => {
    if (isSemester5) return null;
    if (!DAYS.includes(todayName)) return null;
    const now = new Date(nowTick);
    const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();
    const originMins = SLOT_START_HOUR * 60;
    const endMins = SLOT_END_HOUR * 60;
    if (minutesFromMidnight < originMins || minutesFromMidnight > endMins) return null;
    const top = ((minutesFromMidnight - originMins) / 30) * SLOT_HEIGHT;
    return { dayName: todayName, top };
  }, [nowTick, isSemester5, todayName]);

  const semesterProgress = useMemo(() => {
    if (!semesterStart || !semesterEnd || isSemester5) return null;
    const now = Date.now();
    const start = new Date(semesterStart).getTime();
    const end = new Date(semesterEnd).getTime();
    const totalWeeks = Math.max(1, Math.round((end - start) / (7 * 86400000)));
    const elapsed = Math.max(0, Math.round((now - start) / (7 * 86400000)));
    const week = Math.min(elapsed + 1, totalWeeks);
    const pct = Math.min(100, Math.round((week / totalWeeks) * 100));
    const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));

    if (now < start) return { status: "upcoming" as const, week: 0, totalWeeks, pct: 0, daysLeft: Math.ceil((start - now) / 86400000) };
    if (now > end) return { status: "ended" as const, week: totalWeeks, totalWeeks, pct: 100, daysLeft: 0 };
    return { status: "active" as const, week, totalWeeks, pct, daysLeft };
  }, [semesterStart, semesterEnd, isSemester5]);

  const [tooltipSection, setTooltipSection] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  //build a fingerprint that changes whenever any section moves or is added/removed
  const sectionFingerprint = schedule.sections
    .map(s => `${s.id}:${s.dayOfWeek}:${s.startTime}:${s.endTime}:${s.roomId}:${s.instructorId}`)
    .join("|");

  //fetch all semester sections for cross-schedule conflict detection
  useEffect(() => {
    sectionsApi.getAllForSemester(semesterId)
      .then(setAllSemesterSections)
      .catch(() => {});
  }, [semesterId, sectionFingerprint]);

  //map sections to display data
  const scheduledSections = schedule.sections.map((section) => {
    const course = courses.find((c) => c.id === section.courseId);
    return { section, course };
  }).filter((s) => s.course) as { section: Section; course: Course }[];

  //detect conflicts: time overlap (within schedule), room double-booking, instructor overlap (cross-schedule)
  const sectionConflictMap = useMemo(() => {
    const map = new Map<number, ConflictEntry[]>();
    const addConflict = (sectionId: number, entry: ConflictEntry) => {
      if (!map.has(sectionId)) map.set(sectionId, []);
      map.get(sectionId)!.push(entry);
    };

    const schedSectionIds = new Set(schedule.sections.map((s) => s.id));
    const timed = scheduledSections.filter(({ section }) =>
      section.dayOfWeek != null && section.startTime && section.endTime
    );

    //time overlaps within this schedule
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
          addConflict(a.id, {
            sectionId: a.id,
            conflictingSectionId: b.id,
            type: "Schedule overlap",
            severity: "Warning",
            message: `${a.courseCode} overlaps with ${b.courseCode} on ${a.dayOfWeek}`,
          });
          addConflict(b.id, {
            sectionId: b.id,
            conflictingSectionId: a.id,
            type: "Schedule overlap",
            severity: "Warning",
            message: `${b.courseCode} overlaps with ${a.courseCode} on ${b.dayOfWeek}`,
          });
        }
      }
    }

    //cross-schedule: room double-booking and instructor overlap
    const otherSections = allSemesterSections.filter(
      (s) => !schedSectionIds.has(s.id) && s.dayOfWeek && s.startTime && s.endTime
    );

    for (const { section } of timed) {
      for (const other of otherSections) {
        if (section.dayOfWeek !== other.dayOfWeek) continue;
        const aStart = timeSpanToMinutes(section.startTime);
        const aEnd = timeSpanToMinutes(section.endTime);
        const bStart = timeSpanToMinutes(other.startTime);
        const bEnd = timeSpanToMinutes(other.endTime);
        if (!(aStart < bEnd && bStart < aEnd)) continue;

        //skip shared lectures — same course/section/time is an intentional link not a conflict
        if (
          section.courseCode === other.courseCode &&
          section.sectionNumber === other.sectionNumber &&
          section.startTime === other.startTime &&
          section.endTime === other.endTime
        ) {
          continue;
        }

        //skip non-overlapping terms (Term1 vs Term2 cannot conflict)
        if (
          section.term && other.term &&
          section.term !== other.term &&
          section.term !== "Full" && other.term !== "Full"
        ) {
          continue;
        }

        //room conflict
        if (section.roomId && section.roomId === other.roomId) {
          addConflict(section.id, {
            sectionId: section.id,
            conflictingSectionId: other.id,
            type: "Room double-booking",
            severity: "Error",
            message: `${section.roomBuilding} ${section.roomNumber} is also booked by ${other.courseCode}-${other.sectionNumber} on ${other.dayOfWeek}`,
          });
        }

        //instructor conflict
        if (section.instructorId && section.instructorId === other.instructorId) {
          addConflict(section.id, {
            sectionId: section.id,
            conflictingSectionId: other.id,
            type: "Instructor overlap",
            severity: "Error",
            message: `${section.instructorName} is also teaching ${other.courseCode}-${other.sectionNumber} on ${other.dayOfWeek}`,
          });
        }
      }
    }

    return map;
  }, [scheduledSections, allSemesterSections, schedule.sections]);

  //flat list for the banner — pair-aware dedup so A→B and B→A collapse to one entry
  const allConflicts = useMemo(() => {
    const list: ConflictEntry[] = [];
    const seen = new Set<string>();
    sectionConflictMap.forEach((entries) => {
      entries.forEach((e) => {
        const pairKey = e.conflictingSectionId != null
          ? [e.sectionId, e.conflictingSectionId].sort((a, b) => a - b).join("-")
          : `${e.sectionId}`;
        const key = `${e.type}-${pairKey}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(e);
        }
      });
    });
    return list;
  }, [sectionConflictMap]);

  const bannerVisible = allConflicts.length > 0;

  const handleTooltipEnter = (sectionId: number, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    setTooltipSection(sectionId);
  };

  const handleJumpTo = useCallback((sectionId: number) => {
    const el = document.getElementById(`section-block-${sectionId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.animation = "none";
    void el.offsetHeight;
    el.style.animation = "conflictFlash 2s ease-out";
    el.focus({ preventScroll: true });
  }, []);

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
    //when parent owns optimistic deletion, delegate and close the confirm
    if (onDeleteSection) {
      setDeleteConfirm(null);
      await onDeleteSection(sectionId);
      return;
    }
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

  //handle moving a placed section to a new day/time slot
  const handlePlacedMove = useCallback(
    async (sectionId: number, durationMinutes: number, day?: string, time?: string) => {
      if (!day || !time) return;

      const startTimeSpan = slotLabelToTimeSpan(time);
      if (!startTimeSpan) return;

      //compute end time from start + duration
      const [h, m] = startTimeSpan.split(":").map(Number);
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + durationMinutes;

      //reject moves that extend past the calendar boundary
      if (endMinutes > SLOT_END_HOUR * 60) {
        addToast("error", "Cannot move section here \u2014 it would extend past the end of the calendar");
        return;
      }

      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const endTimeSpan = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`;

      //client-side overlap check — block same-schedule overlaps
      const wouldOverlap = schedule.sections.some((other) => {
        if (other.id === sectionId) return false;
        if (other.dayOfWeek == null || dayOfWeekName(other.dayOfWeek) !== day) return false;
        const otherStart = timeSpanToMinutes(other.startTime);
        const otherEnd = timeSpanToMinutes(other.endTime);
        return startMinutes < otherEnd && endMinutes > otherStart;
      });

      if (wouldOverlap) {
        addToast("error", "Cannot move section here \u2014 it would overlap with another section in this schedule");
        return;
      }

      //parent owns optimistic move — delegate and let it handle api + rollback
      if (onMoveSection) {
        await onMoveSection(sectionId, day, startTimeSpan, endTimeSpan);
        return;
      }

      try {
        await sectionsApi.move(sectionId, {
          dayOfWeek: day,
          startTime: startTimeSpan,
          endTime: endTimeSpan,
          scheduleId: schedule.id,
        });
        addToast("success", "Section moved");
        onRefresh();
      } catch (err: any) {
        addToast("error", err.message || "Failed to move section");
      }
    },
    [addToast, onRefresh, onMoveSection, schedule.id, schedule.sections],
  );

  const getColor = (course: Course) => courseTypeColor(course.defaultType);

  const totalHeight = SLOTS.length * SLOT_HEIGHT;

  //compact stats above the grid — sections, teaching hours/week, distinct days touched
  const scheduleStats = useMemo(() => {
    const placed = scheduledSections.filter(({ section }) =>
      section.dayOfWeek != null && section.startTime && section.endTime,
    );
    const minutes = placed.reduce((sum, { section }) => {
      return sum + (timeSpanToMinutes(section.endTime) - timeSpanToMinutes(section.startTime));
    }, 0);
    const days = new Set(placed.map(({ section }) => section.dayOfWeek)).size;
    return {
      sections: scheduledSections.length,
      hours: Math.round((minutes / 60) * 10) / 10,
      days,
    };
  }, [scheduledSections]);

  const calendarIsEmpty = !isSemester5 && schedule.sections.length === 0;

  return (
    <>
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <NumberBadge number="02" variant="gold" size="sm" />
            <h3 className={styles.headerTitle}>{isSemester5 ? "Rotation Schedule" : "Weekly Calendar"}</h3>
            {!isSemester5 && (
              <span className={styles.headerCount}>
                {schedule.sections.length} section{schedule.sections.length !== 1 ? "s" : ""} scheduled
              </span>
            )}
          </div>
        </div>

        <div className={styles.body}>
          {!isSemester5 && (
            <div className={styles.aboveGrid}>
              {semesterProgress && (
            <div className={styles.progressRow}>
              <span className={styles.progressLabel}>
                {semesterProgress.status === "upcoming"
                  ? `Starts in ${semesterProgress.daysLeft} days`
                  : semesterProgress.status === "ended"
                  ? `Ended ${Math.abs(semesterProgress.daysLeft)} days ago`
                  : `Week ${semesterProgress.week} of ${semesterProgress.totalWeeks} \u00B7 ${semesterProgress.daysLeft} days remaining`}
              </span>
              <div className={styles.progressTrack}>
                <div
                  className={`${styles.progressFill} ${semesterProgress.status === "ended" ? styles.progressEnded : ""}`}
                  style={{ width: `${semesterProgress.pct}%` }}
                />
              </div>
            </div>
              )}
              <ConflictBanner conflicts={allConflicts} onJumpTo={handleJumpTo} />
              {/*stats bar in inset zone so the flush grid below can fill the frame*/}
              <div className={styles.statsBar}>
                <div className={styles.statsItem}>
                  <span className={styles.statsValue}>{scheduleStats.sections}</span>
                  <span className={styles.statsLabel}>Sections</span>
                </div>
                <div className={styles.statsDivider} />
                <div className={styles.statsItem}>
                  <span className={styles.statsValue}>{scheduleStats.hours}</span>
                  <span className={styles.statsLabel}>Hours / Week</span>
                </div>
                <div className={styles.statsDivider} />
                <div className={styles.statsItem}>
                  <span className={styles.statsValue}>{scheduleStats.days}</span>
                  <span className={styles.statsLabel}>Days Active</span>
                </div>
              </div>
            </div>
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
            <>
              <div className={styles.calGridWrap}>
                {calendarIsEmpty && (
                  <div className={styles.emptyCalOverlay}>
                    <div className={styles.emptyCalIcon}>
                      <CalendarPlus size={28} />
                    </div>
                    <h4 className={styles.emptyCalTitle}>Ready to build</h4>
                    <p className={styles.emptyCalHint}>
                      Drag courses from the palette onto the grid
                    </p>
                  </div>
                )}
            <div className={styles.calGrid}>
              {/* header row */}
              <div className={styles.calCorner}>
                <span className={styles.cornerLabel}>TIME</span>
              </div>
              {DAYS.map((day) => {
                const isToday = day === todayName;
                return (
                  <div
                    key={day}
                    className={`${styles.calDayHeader} ${isToday ? styles.calDayToday : ""}`}
                  >
                    {day}
                    {isToday && <span className={styles.todayBadge}>TODAY</span>}
                  </div>
                );
              })}

              {/* time column */}
              <div className={styles.calTimeCol}>
                {SLOTS.map((slot, i) => (
                  <div
                    key={slot}
                    className={`${styles.calTimeLabel} ${i % 2 === 0 ? styles.hourMark : ""}`}
                    style={{ height: SLOT_HEIGHT }}
                  >
                    {i % 2 === 0 ? slot : <span className={styles.calTimeLabelHalf}>:30</span>}
                  </div>
                ))}
              </div>

              {/* day columns with positioned blocks */}
              {DAYS.map((day) => {
                const daySections = scheduledSections.filter(({ section }) => {
                  return section.dayOfWeek != null && dayOfWeekName(section.dayOfWeek) === day;
                });

                const originMins = SLOT_START_HOUR * 60;
                const isToday = day === todayName;
                const showNowLine = isToday && nowLine != null;

                return (
                  <div
                    key={day}
                    className={`${styles.calDayCol} ${isToday ? styles.calDayColToday : ""}`}
                    style={{ height: totalHeight }}
                  >
                    {showNowLine && (
                      <div className={styles.nowLine} style={{ top: nowLine!.top }} aria-hidden>
                        <span className={styles.nowDot} />
                      </div>
                    )}
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

                    {/* course blocks — staggered pop-in */}
                    {daySections.map(({ section, course }, blockIdx) => {
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
                      const isNewlyPlaced = !initialIdsRef.current!.has(section.id);

                      return (
                        <motion.div
                          key={section.id}
                          initial={reduced ? undefined : { opacity: 0, scale: isNewlyPlaced ? 0.85 : 0.9 }}
                          animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                          transition={
                            reduced
                              ? undefined
                              : isNewlyPlaced
                                ? { type: "spring", stiffness: 350, damping: 20 }
                                : { duration: 0.24, delay: 0.55 + blockIdx * 0.03, ease: ease.ios }
                          }
                          style={{ position: "absolute", top, left: 0, right: 0 }}
                        >
                          <DraggableCourseBlock
                            section={section}
                            course={course}
                            top={0}
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
                            isNewlyPlaced={isNewlyPlaced}
                            reduced={reduced}
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
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
              </div>
            </>
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
