import { useEffect, useState } from "react";
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

interface CourseDetailsData {
  courseId: number;
  dayOfWeek?: string;
  timeSlot?: string;
  dateRange?: string;
}

export function ScheduleBuilder() {
  const { scheduleGroupId } = useParams<{ scheduleGroupId: string }>();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [view, setView] = useState<"calendar" | "students">("calendar");
  const [detailsModal, setDetailsModal] = useState<CourseDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const scheduleId = parseInt(scheduleGroupId || "0");

  useEffect(() => {
    loadData();
  }, [scheduleGroupId]);

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
      <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280", fontFamily: "DM Sans, sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (!schedule) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280", fontFamily: "DM Sans, sans-serif" }}>
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
        .sb-root { font-family: 'DM Sans', sans-serif; }

        .sb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e5e2db;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .sb-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .sb-btn-back {
          height: 36px;
          padding: 0 1rem;
          gap: 0.4rem;
          background: #ffffff;
          border: 1.5px solid #e5e2db;
          border-radius: 8px;
          display: flex;
          align-items: center;
          cursor: pointer;
          color: #6b7280;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }

        .sb-btn-back:hover {
          background: #00563f;
          color: #ffffff;
          border-color: #00563f;
        }

        .sb-title h1 {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0 0 0.2rem 0;
        }

        .sb-title p {
          font-size: 0.85rem;
          color: #9ca3af;
          margin: 0;
          font-weight: 300;
        }

        .sb-lock-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.6rem;
          background: rgba(220, 38, 38, 0.08);
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-left: 0.75rem;
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
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          border: none;
          white-space: nowrap;
        }

        .sb-btn:active { transform: scale(0.98); }

        .sb-btn-export {
          background: #00563f;
          color: #ffffff;
          border: 1px solid #00563f;
          position: relative;
        }

        .sb-btn-export:hover { background: #003d2a; }

        .export-dropdown {
          position: relative;
          display: inline-block;
        }

        .export-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.25rem;
          background: #ffffff;
          border: 1px solid #e5e2db;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          z-index: 100;
          min-width: 220px;
          overflow: hidden;
        }

        .export-menu button {
          width: 100%;
          padding: 0.65rem 1rem;
          background: none;
          border: none;
          text-align: left;
          font-family: 'DM Sans', sans-serif;
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
          border: 1px solid #e5e2db;
          border-radius: 10px;
          padding: 0.3rem;
          margin-bottom: 1.75rem;
          gap: 0.25rem;
        }

        .sb-view-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1.1rem;
          border-radius: 7px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          color: #6b7280;
          background: none;
        }

        .sb-view-btn:hover {
          background: #f8f7f4;
          color: #0a1f14;
        }

        .sb-view-btn.active {
          background: #00563f;
          color: #ffffff;
        }

        .sb-grid {
          display: grid;
          grid-template-columns: 2fr 10fr;
          gap: 1.5rem;
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 3px solid #dc2626;
          border-radius: 6px;
          padding: 0.75rem 1rem;
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
            <div className="export-dropdown">
              <button
                className="sb-btn sb-btn-export"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                <Download size={14} />
                Export ▾
              </button>
              {showExportMenu && semester && (
                <div className="export-menu">
                  <button onClick={() => { exportsApi.roster(semester.id, semester.name); setShowExportMenu(false); }}>
                    Student Rosters (.xlsx)
                  </button>
                  <button onClick={() => { exportsApi.grid(semester.id, semester.name); setShowExportMenu(false); }}>
                    Visual Grid (.xlsx)
                  </button>
                  <button onClick={() => { exportsApi.registrar(semester.id, semester.name); setShowExportMenu(false); }}>
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
