import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Trash2, Pencil, Building2, AlertTriangle, Info } from "lucide-react";
import { useDrop } from "react-dnd";
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
  const [allSemesterSections, setAllSemesterSections] = useState<Section[]>([]);

  const [tooltipSection, setTooltipSection] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  //fetch all semester sections for cross-schedule conflict detection
  useEffect(() => {
    sectionsApi.getAllForSemester(semesterId)
      .then(setAllSemesterSections)
      .catch(() => {});
  }, [semesterId, schedule.sections.length]);

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
            type: "Schedule overlap",
            severity: "Warning",
            message: `${a.courseCode} overlaps with ${b.courseCode} on ${a.dayOfWeek}`,
          });
          addConflict(b.id, {
            sectionId: b.id,
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

        //room conflict
        if (section.roomId && section.roomId === other.roomId) {
          addConflict(section.id, {
            sectionId: section.id,
            type: "Room double-booking",
            severity: "Error",
            message: `${section.roomBuilding} ${section.roomNumber} is also booked by ${other.courseCode}-${other.sectionNumber} on ${other.dayOfWeek}`,
          });
        }

        //instructor conflict
        if (section.instructorId && section.instructorId === other.instructorId) {
          addConflict(section.id, {
            sectionId: section.id,
            type: "Instructor overlap",
            severity: "Error",
            message: `${section.instructorName} is also teaching ${other.courseCode}-${other.sectionNumber} on ${other.dayOfWeek}`,
          });
        }
      }
    }

    return map;
  }, [scheduledSections, allSemesterSections, schedule.sections]);

  //flat list for the banner
  const allConflicts = useMemo(() => {
    const list: ConflictEntry[] = [];
    const seen = new Set<string>();
    sectionConflictMap.forEach((entries) => {
      entries.forEach((e) => {
        const key = `${e.sectionId}-${e.type}-${e.message}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(e);
        }
      });
    });
    return list;
  }, [sectionConflictMap]);

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
                      const tooltipId = `conflict-tip-${section.id}`;

                      return (
                        <div
                          id={`section-block-${section.id}`}
                          key={section.id}
                          className={`${styles.courseBlock}${conflictClass}`}
                          tabIndex={0}
                          style={{
                            top,
                            height: Math.max(height - 2, SLOT_HEIGHT - 2),
                            background: `linear-gradient(135deg, ${color}d9, ${color})`,
                            borderLeft: `3px solid ${color}`,
                          }}
                          onMouseEnter={(e) => handleTooltipEnter(section.id, e)}
                          onMouseLeave={() => setTooltipSection(null)}
                          onFocus={(e) => handleTooltipEnter(section.id, e as unknown as React.MouseEvent)}
                          onBlur={() => setTooltipSection(null)}
                          aria-describedby={sectionConflicts.length > 0 ? tooltipId : undefined}
                        >
                          {sectionConflicts.length > 0 && (
                            <span
                              className={styles.conflictIcon}
                              tabIndex={0}
                              role="img"
                              aria-label={sectionConflicts.map((c) => `${c.type}: ${c.message}`).join("; ")}
                              onFocus={(e) => { e.stopPropagation(); handleTooltipEnter(section.id, e as unknown as React.MouseEvent); }}
                              onBlur={() => setTooltipSection(null)}
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
                          <div className={styles.courseBlockInner}>
                            {!isLocked && (
                              <div className={styles.courseBlockActions}>
                                <button
                                  className={`${styles.courseBlockBtn} ${styles.edit}`}
                                  onClick={() => setEditModal({ section, course })}
                                >
                                  <Pencil size={10} />
                                </button>
                                <button
                                  className={`${styles.courseBlockBtn} ${styles.delete}`}
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

                          {tooltipSection === section.id && (
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
