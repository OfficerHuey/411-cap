import { useEffect, useState, useRef } from "react";
import "../App.css";
import { ArrowLeft, Download, CalendarIcon, Users, Lock } from "lucide-react";
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
import { useToast } from "../Lib/ToastContext";

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
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [view, setView] = useState<"calendar" | "students">("calendar");
  const [detailsModal, setDetailsModal] = useState<CourseDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const scheduleId = parseInt(scheduleGroupId || "0");

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
      <div className="loading-spinner"><span>Loading schedule…</span></div>
    );
  }

  if (!schedule) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280", fontFamily: "Inter, sans-serif" }}>
        Schedule not found
      </div>
    );
  }

  const isSemester5 = schedule.semesterLevel === 5;
  const isLocked = semester?.isLocked ?? false;
  const levelLabel = numberToLevel(schedule.semesterLevel);

  return (
    <DndProvider backend={HTML5Backend}>
      <style>{`
        .sb-root { font-family: 'Inter', sans-serif; }

        .sb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .sb-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .sb-btn-back {
          width: 36px;
          height: 36px;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .sb-btn-back:hover {
          background: #00563f;
          color: #ffffff;
          border-color: #00563f;
        }

        .sb-title h1 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.15rem 0;
          letter-spacing: -0.01em;
        }

        .sb-title p {
          font-size: 0.82rem;
          color: #9ca3af;
          margin: 0;
          font-weight: 400;
        }

        .sb-lock-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.15rem 0.55rem;
          background: rgba(220, 38, 38, 0.06);
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.15);
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
          margin-left: 0.65rem;
          vertical-align: middle;
        }

        .sb-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sb-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          border: none;
          white-space: nowrap;
        }

        .sb-btn:active { transform: scale(0.98); }

        .sb-btn-export {
          background: linear-gradient(135deg, #00563f 0%, #003d2a 100%);
          color: #ffffff;
          border: none;
          position: relative;
          box-shadow: 0 1px 3px rgba(0,86,63,0.15);
        }

        .sb-btn-export:hover { box-shadow: 0 1px 3px rgba(0,86,63,0.2), 0 4px 12px rgba(0,86,63,0.1); }

        .export-dropdown {
          position: relative;
          display: inline-block;
        }

        .export-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.35rem;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 12px 36px rgba(0,0,0,0.1);
          z-index: 100;
          min-width: 220px;
          overflow: hidden;
          animation: fadeInUp 0.15s ease;
        }

        .export-menu button {
          width: 100%;
          padding: 0.65rem 1rem;
          background: none;
          border: none;
          text-align: left;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          color: #374151;
          cursor: pointer;
          transition: background 0.15s;
        }

        .export-menu button:hover { background: #f0faf5; color: #00563f; }
        .export-menu button + button { border-top: 1px solid #f3f4f6; }

        .sb-view-toggle {
          display: inline-flex;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.3rem;
          margin-bottom: 1.75rem;
          gap: 0.2rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }

        .sb-view-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1.1rem;
          border-radius: 9px;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b7280;
          background: none;
        }

        .sb-view-btn:hover {
          background: #f5f5f4;
          color: #111827;
        }

        .sb-view-btn.active {
          background: #00563f;
          color: #ffffff;
          box-shadow: 0 1px 3px rgba(0,86,63,0.2);
        }

        .sb-grid {
          display: grid;
          grid-template-columns: 2fr 10fr;
          gap: 1.5rem;
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          color: #991b1b;
        }
      `}</style>

      <div className="sb-root">
        {error && <div className="error-banner">{error}</div>}

        <div className="sb-header">
          <div className="sb-header-left">
            <button
              className="sb-btn-back"
              onClick={() => navigate(`/semester/${schedule.semesterId}`)}
            >
              <ArrowLeft size={15} />
              Back
            </button>
            <div className="sb-title">
              <h1>
                {schedule.name} — {levelLabel}
                {isLocked && (
                  <span className="sb-lock-badge">
                    <Lock size={12} />
                    Locked
                  </span>
                )}
              </h1>
              <p>
                {semester?.name} • {schedule.locationDisplay}
              </p>
            </div>
          </div>

          <div className="sb-actions">
            <div className="export-dropdown" ref={exportRef}>
              <button
                className="sb-btn sb-btn-export"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                <Download size={14} />
                Export ▾
              </button>
              {showExportMenu && semester && (
                <div className="export-menu">
                  <button onClick={() => { exportsApi.roster(semester.id, semester.name).then(() => addToast("success", "Roster exported")).catch(() => addToast("error", "Export failed")); setShowExportMenu(false); }}>
                    Student Rosters (.xlsx)
                  </button>
                  <button onClick={() => { exportsApi.grid(semester.id, semester.name).then(() => addToast("success", "Grid exported")).catch(() => addToast("error", "Export failed")); setShowExportMenu(false); }}>
                    Visual Grid (.xlsx)
                  </button>
                  <button onClick={() => { exportsApi.registrar(semester.id, semester.name).then(() => addToast("success", "Registrar export downloaded")).catch(() => addToast("error", "Export failed")); setShowExportMenu(false); }}>
                    Registrar Export (.xlsx)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sb-view-toggle">
          <button
            className={`sb-view-btn ${view === "calendar" ? "active" : ""}`}
            onClick={() => setView("calendar")}
          >
            <CalendarIcon size={14} />
            Calendar View
          </button>
          <button
            className={`sb-view-btn ${view === "students" ? "active" : ""}`}
            onClick={() => setView("students")}
          >
            <Users size={14} />
            Student View
          </button>
        </div>

        {view === "calendar" ? (
          <div className="sb-grid">
            <div>
              <CoursePalette courses={courseList} />
            </div>
            <div>
              <ScheduleCanvas
                schedule={schedule}
                isSemester5={isSemester5}
                courses={courseList}
                isLocked={isLocked}
                onRefresh={refreshSchedule}
                onDrop={(courseId, dayOfWeek, timeSlot, dateRange) =>
                  setDetailsModal({ courseId, dayOfWeek, timeSlot, dateRange })
                }
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
    </DndProvider>
  );
}
