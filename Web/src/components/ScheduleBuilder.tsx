import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, CalendarIcon, Users, Lock, StickyNote } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useParams, useNavigate } from "react-router-dom";
import {
  schedules as schedulesApi,
  courses as coursesApi,
  semesters as semestersApi,
  sections as sectionsApi,
  exports as exportsApi,
} from "../Lib/api";
import type { Schedule, Course, Semester, Section, CreateSectionDto } from "../Lib/Types";
import { numberToLevel } from "../Lib/Types";
import { CoursePalette } from "./CoursePalette";
import { ScheduleCanvas } from "./ScheduleCanvas";
import { ScheduleViewer } from "./ScheduleViewer";
import { StudentRosterView } from "./StudentRosterView";
import { CourseDetailsModal } from "./CourseDetailsModal";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { useToast } from "../Lib/ToastContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { heroStagger, heroChild, ease, spring } from "../Lib/motion";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Skeleton } from "./ui/Skeleton";
import { NotesPanel } from "./Notes/NotesPanel";
import { InstructorDetailPanel } from "./InstructorDetailPanel";
import { useNotes } from "../hooks/useNotes";
import styles from "./ScheduleBuilder.module.css";

interface CourseDetailsData {
  courseId: number;
  dayOfWeek?: string;
  timeSlot?: string;
  dateRange?: string;
}

export function ScheduleBuilder() {
  const { scheduleGroupId } = useParams<{ scheduleGroupId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [view, setView] = useState<"calendar" | "students">("calendar");
  const [detailsModal, setDetailsModal] = useState<CourseDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [detailInstructorId, setDetailInstructorId] = useState<number | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const scheduleId = parseInt(scheduleGroupId || "0");
  const { openCount: noteCount } = useNotes({ scheduleId: scheduleId || undefined });
  const reduced = useReducedMotion();

  //breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/" },
      { label: semester?.name ?? "Loading", href: `/semester/${semester?.id}` },
      { label: `Semester ${schedule?.semesterLevel}`, href: `/semester/${semester?.id}` },
      { label: schedule?.name ?? "Loading" },
    ]);
  }, [schedule, semester, setBreadcrumbs]);

  useEffect(() => {
    loadData();
  }, [scheduleGroupId]);

  //close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showExportMenu]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const sched = await schedulesApi.getById(scheduleId);
      setSchedule(sched);

      const [palette, allSems] = await Promise.all([
        coursesApi.getPalette(sched.semesterLevel),
        semestersApi.getAll(),
      ]);
      setCourseList(palette);
      const sem = allSems.find((s) => s.id === sched.semesterId);
      setSemester(sem || null);
    } catch (err: any) {
      setError(err.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const refreshSchedule = async () => {
    try {
      const sched = await schedulesApi.getById(scheduleId);
      setSchedule(sched);
    } catch (err: any) {
      setError(err.message || "Failed to refresh");
    }
  };

  //build a display-ready optimistic section from a create dto
  //room/instructor names are unknown at this point — they fill in when the real response replaces the placeholder
  const buildOptimisticSection = (dto: CreateSectionDto, tempId: number): Section => {
    const course = courseList.find((c) => c.id === dto.courseId);
    return {
      id: tempId,
      sectionNumber: dto.sectionNumber,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      dateRange: dto.dateRange,
      notes: dto.notes,
      term: dto.term,
      termStartDate: dto.termStartDate,
      termEndDate: dto.termEndDate,
      roomId: dto.roomId,
      roomNumber: null,
      roomBuilding: null,
      instructorId: dto.instructorId,
      instructorName: null,
      courseId: dto.courseId,
      courseCode: course?.code ?? "",
      courseName: course?.name ?? "",
      courseType: course?.defaultType ?? "Lecture",
    };
  };

  //optimistic create — insert placeholder row, then reconcile with server response
  const handleCreateSection = async (dto: CreateSectionDto) => {
    const tempId = -Date.now();
    const optimistic = buildOptimisticSection(dto, tempId);

    setSchedule((prev) => prev ? { ...prev, sections: [...prev.sections, optimistic] } : prev);

    try {
      const result = await sectionsApi.createOrLink(dto);
      //replace the placeholder with the server's authoritative section
      setSchedule((prev) => prev
        ? { ...prev, sections: prev.sections.map((s) => s.id === tempId ? result.section : s) }
        : prev);

      if (result.conflicts && result.conflicts.length > 0) {
        if (result.conflicts.some((c) => c.severity === "Error")) {
          addToast("error", `Section added with blocking conflict: ${result.conflicts.find((c) => c.severity === "Error")?.message ?? ""}`);
        } else if (result.conflicts.some((c) => c.severity === "Warning")) {
          addToast("warning", "Section added with warnings");
        } else {
          addToast("success", "Section added to schedule");
        }
      } else {
        addToast("success", "Section added to schedule");
      }
    } catch (err: any) {
      //rollback the optimistic row on failure
      setSchedule((prev) => prev
        ? { ...prev, sections: prev.sections.filter((s) => s.id !== tempId) }
        : prev);
      addToast("error", err.message || "Failed to add section");
    }
  };

  //optimistic delete — remove locally, restore on failure
  const handleDeleteSection = async (sectionId: number) => {
    const prevSections = schedule?.sections ?? [];
    const removed = prevSections.find((s) => s.id === sectionId);
    if (!removed) return;

    setSchedule((prev) => prev
      ? { ...prev, sections: prev.sections.filter((s) => s.id !== sectionId) }
      : prev);

    try {
      await sectionsApi.removeFromSchedule(sectionId, scheduleId);
      addToast("success", "Section removed from schedule");
    } catch (err: any) {
      //rollback
      setSchedule((prev) => prev
        ? { ...prev, sections: [...prev.sections, removed] }
        : prev);
      addToast("error", err.message || "Failed to remove section");
    }
  };

  //optimistic move — update day/time locally, revert on failure
  const handleMoveSection = async (sectionId: number, dayOfWeek: string, startTime: string, endTime: string) => {
    const prevSections = schedule?.sections ?? [];
    const original = prevSections.find((s) => s.id === sectionId);
    if (!original) return;

    setSchedule((prev) => prev
      ? {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === sectionId
              ? { ...s, dayOfWeek: dayOfWeek as Section["dayOfWeek"], startTime, endTime }
              : s,
          ),
        }
      : prev);

    try {
      await sectionsApi.move(sectionId, { dayOfWeek, startTime, endTime, scheduleId });
      addToast("success", "Section moved");
    } catch (err: any) {
      //rollback to the pre-move state
      setSchedule((prev) => prev
        ? { ...prev, sections: prev.sections.map((s) => s.id === sectionId ? original : s) }
        : prev);
      addToast("error", err.message || "Failed to move section");
    }
  };

  if (loading) {
    return (
      <div className={styles.root}>
        <Skeleton variant="heroSection" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: "1.5rem",
            padding: "0 clamp(1rem, 4vw, 3rem) 2rem",
          }}
        >
          <Skeleton variant="card" height={400} />
          <Skeleton variant="calendarGrid" />
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
        Schedule not found
      </div>
    );
  }

  const isSemester5 = schedule.semesterLevel === 5;
  const isLocked = semester?.isLocked ?? false;
  const levelLabel = numberToLevel(schedule.semesterLevel);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.root}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* ── compact hero: back + title on one line, metadata on a single
            thin subtitle, view toggle + notes + export all right-aligned ── */}
        <motion.div
          className={styles.hero}
          layoutId={reduced ? undefined : `schedule-hero-${scheduleId}`}
          variants={reduced ? undefined : heroStagger}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.heroLeft}>
            <motion.div
              variants={reduced ? undefined : heroChild}
              className={styles.heroTitleRow}
            >
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<ArrowLeft size={14} />}
                onClick={() => navigate(`/semester/${schedule.semesterId}`)}
                className={styles.backBtn}
              >
                Back
              </Button>
              <h1 className={styles.heroTitle}>
                {schedule.name}
                {isLocked && (
                  <Badge variant="red" size="md">
                    <span className={styles.lockBadge}>
                      <Lock size={12} />
                      Locked
                    </span>
                  </Badge>
                )}
              </h1>
            </motion.div>
            <motion.p
              variants={reduced ? undefined : heroChild}
              className={styles.heroSubtitle}
            >
              <span>{semester?.name}</span>
              <span className={styles.heroSubtitleSep}>&middot;</span>
              <Badge variant="gold" size="sm">{schedule.locationDisplay}</Badge>
              <span className={styles.heroSubtitleSep}>&middot;</span>
              <span className={styles.heroSubtitleLevel}>{levelLabel}</span>
            </motion.p>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.viewToggle} role="tablist" aria-label="View switcher">
              <button
                role="tab"
                aria-selected={view === "calendar"}
                className={`${styles.viewBtn} ${view === "calendar" ? styles.active : ""}`}
                onClick={() => setView("calendar")}
              >
                <CalendarIcon size={14} />
                Calendar
              </button>
              <button
                role="tab"
                aria-selected={view === "students"}
                className={`${styles.viewBtn} ${view === "students" ? styles.active : ""}`}
                onClick={() => setView("students")}
              >
                <Users size={14} />
                Students
              </button>
            </div>
            <Button
              variant="secondary"
              size="md"
              iconLeft={<StickyNote size={14} />}
              onClick={() => setShowNotes(true)}
            >
              Notes
              {noteCount > 0 && (
                <Badge variant="gold" size="sm">{noteCount}</Badge>
              )}
            </Button>
            <div className={styles.exportDropdown} ref={exportRef}>
              <Button
                variant="secondary"
                size="md"
                iconLeft={<Download size={14} />}
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export &darr;
              </Button>
              {showExportMenu && semester && (
                <div className={styles.exportMenu}>
                  <button
                    className={styles.exportMenuItem}
                    onClick={() => {
                      exportsApi.roster(semester.id, semester.name).then(() => addToast("success", "Roster exported")).catch((err) => addToast("error", `Export failed: ${err.message || "Unknown error"}`));
                      setShowExportMenu(false);
                    }}
                  >
                    Student Rosters (.xlsx)
                  </button>
                  <button
                    className={styles.exportMenuItem}
                    onClick={() => {
                      exportsApi.grid(semester.id, semester.name).then(() => addToast("success", "Grid exported")).catch((err) => addToast("error", `Export failed: ${err.message || "Unknown error"}`));
                      setShowExportMenu(false);
                    }}
                  >
                    Visual Grid (.xlsx)
                  </button>
                  <button
                    className={styles.exportMenuItem}
                    onClick={() => {
                      exportsApi.registrar(semester.id, semester.name).then(() => addToast("success", "Registrar export downloaded")).catch((err) => addToast("error", `Export failed: ${err.message || "Unknown error"}`));
                      setShowExportMenu(false);
                    }}
                  >
                    Registrar Export (.xlsx)
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── content ── */}
        {view === "calendar" ? (
          <div className={styles.calendarGrid}>
            {/* course palette slides in from left (250-500ms) */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0, x: -16 }}
              animate={reduced ? undefined : { opacity: 1, x: 0 }}
              transition={reduced ? undefined : { ...spring.card, delay: 0.25 }}
            >
              <CoursePalette courses={courseList} />
            </motion.div>
            {/* canvas grid renders (300-550ms) */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0 }}
              animate={reduced ? undefined : { opacity: 1 }}
              transition={reduced ? undefined : { duration: 0.25, delay: 0.3, ease: ease.ios }}
            >
              <ScheduleCanvas
                schedule={schedule}
                semesterId={schedule.semesterId}
                isSemester5={isSemester5}
                courses={courseList}
                isLocked={isLocked}
                semesterStart={semester?.startDate}
                semesterEnd={semester?.endDate}
                onRefresh={refreshSchedule}
                onDrop={(courseId, dayOfWeek, timeSlot, dateRange) =>
                  setDetailsModal({ courseId, dayOfWeek, timeSlot, dateRange })
                }
                onDeleteSection={handleDeleteSection}
                onMoveSection={handleMoveSection}
                onInstructorClick={(id) => setDetailInstructorId(id)}
              />
            </motion.div>
            {/* viewer trigger fades in last (900-1100ms) */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0 }}
              animate={reduced ? undefined : { opacity: 1 }}
              transition={reduced ? undefined : { duration: 0.2, delay: 0.9, ease: ease.ios }}
            >
              <ScheduleViewer
                semesterId={schedule.semesterId}
                currentScheduleId={schedule.id}
              />
            </motion.div>
          </div>
        ) : (
          <StudentRosterView
            scheduleId={schedule.id}
            semesterId={schedule.semesterId}
            isLocked={isLocked}
            capacity={schedule.capacity}
          />
        )}
      </div>

      {detailsModal && schedule && semester && !isLocked && (
        <CourseDetailsModal
          scheduleId={schedule.id}
          semesterId={schedule.semesterId}
          courseId={detailsModal.courseId}
          dayOfWeek={detailsModal.dayOfWeek}
          timeSlot={detailsModal.timeSlot}
          dateRange={detailsModal.dateRange}
          isSemester5={isSemester5}
          semesterLevel={schedule.semesterLevel}
          courses={courseList}
          locationDisplay={schedule.locationDisplay}
          onCreate={handleCreateSection}
          onClose={() => setDetailsModal(null)}
          onSuccess={() => {
            refreshSchedule();
            setDetailsModal(null);
          }}
        />
      )}

      <NotesPanel
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        scheduleId={schedule.id}
      />

      <InstructorDetailPanel
        isOpen={detailInstructorId != null}
        onClose={() => setDetailInstructorId(null)}
        instructorId={detailInstructorId}
        semesterId={schedule.semesterId}
      />
    </DndProvider>
  );
}
