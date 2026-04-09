import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Download, CalendarIcon, Users, Lock, StickyNote } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useParams, useNavigate } from "react-router-dom";
import {
  schedules as schedulesApi,
  courses as coursesApi,
  semesters as semestersApi,
  exports as exportsApi,
} from "../Lib/api";
import type { Schedule, Course, Semester } from "../Lib/Types";
import { numberToLevel } from "../Lib/Types";
import { CoursePalette } from "./CoursePalette";
import { ScheduleCanvas } from "./ScheduleCanvas";
import { ScheduleViewer } from "./ScheduleViewer";
import { StudentRosterView } from "./StudentRosterView";
import { CourseDetailsModal } from "./CourseDetailsModal";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { useToast } from "../Lib/ToastContext";
import { Button } from "./ui/Button";
import { NumberBadge } from "./ui/NumberBadge";
import { HairlineRule } from "./ui/HairlineRule";
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

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <Skeleton variant="text" count={2} />
        <div style={{ marginTop: "1rem" }}>
          <Skeleton variant="card" height={400} />
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

  //schedule letter from position
  const scheduleLetter = "A";

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.root}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* ── hero ── */}
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<ArrowLeft size={14} />}
              onClick={() => navigate(`/semester/${schedule.semesterId}`)}
            >
              Back
            </Button>
            <NumberBadge number={scheduleLetter} variant="gold" size="sm" />
            <HairlineRule width="48px" color="gold" spacing="normal" />
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
            <p className={styles.heroSubtitle}>
              {semester?.name} &middot; {schedule.locationDisplay} &middot; {levelLabel}
            </p>
          </div>

          <div className={styles.heroRight}>
            <Button
              variant="ghost"
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
        </div>

        {/* ── view toggle ── */}
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${view === "calendar" ? styles.active : ""}`}
            onClick={() => setView("calendar")}
          >
            <CalendarIcon size={14} />
            Calendar View
          </button>
          <button
            className={`${styles.viewBtn} ${view === "students" ? styles.active : ""}`}
            onClick={() => setView("students")}
          >
            <Users size={14} />
            Student View
          </button>
        </div>

        {/* ── content ── */}
        {view === "calendar" ? (
          <div className={styles.calendarGrid}>
            <div>
              <CoursePalette courses={courseList} />
            </div>
            <div>
              <ScheduleCanvas
                schedule={schedule}
                semesterId={schedule.semesterId}
                isSemester5={isSemester5}
                courses={courseList}
                isLocked={isLocked}
                onRefresh={refreshSchedule}
                onDrop={(courseId, dayOfWeek, timeSlot, dateRange) =>
                  setDetailsModal({ courseId, dayOfWeek, timeSlot, dateRange })
                }
                onInstructorClick={(id) => setDetailInstructorId(id)}
              />
            </div>
            <ScheduleViewer
              semesterId={schedule.semesterId}
              currentScheduleId={schedule.id}
            />
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
