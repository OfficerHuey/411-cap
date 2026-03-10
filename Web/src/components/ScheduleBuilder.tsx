import { useEffect, useState } from "react";
import "../App.css";
import { ArrowLeft, Download, CalendarIcon, Users } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useParams, useNavigate } from "react-router-dom";
import { exportScheduleData } from "../Lib/Exportimport";
import { dataStore } from "../Lib/Store";
import type {
  ScheduleGroup,
  Course,
  CourseSection,
  ScheduleSection,
} from "../Lib/Types";
import { CoursePalette } from "./CoursePalette";
import { ScheduleCanvas } from "./ScheduleCanvas";
import { ScheduleViewer } from "./ScheduleViewer";
import { StudentRosterView } from "./StudentRosterView";
import { CourseDetailsModal } from "./CourseDetailsModal";

interface CourseDetailsData {
  courseId: string;
  dayOfWeek?: string;
  timeSlot?: string;
  dateRange?: string;
}

export function ScheduleBuilder() {
  const { scheduleGroupId } = useParams<{ scheduleGroupId: string }>();
  const navigate = useNavigate();
  const [scheduleGroup, setScheduleGroup] = useState<ScheduleGroup | null>(
    null,
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [scheduleSections, setScheduleSections] = useState<ScheduleSection[]>(
    [],
  );
  const [view, setView] = useState<"calendar" | "students">("calendar");
  const [detailsModal, setDetailsModal] = useState<CourseDetailsData | null>(
    null,
  );

  useEffect(() => {
    if (!scheduleGroupId) return;
    const group = dataStore.getScheduleGroupById(scheduleGroupId);
    setScheduleGroup(group || null);
    if (group) {
      const semester = dataStore.getSemesterById(group.semesterId);
      if (semester) setCourses(dataStore.getCourses(semester.id));
      setScheduleSections(dataStore.getScheduleSections(scheduleGroupId));
    }
    setCourseSections(dataStore.getCourseSections());
  }, [scheduleGroupId]);

  const handleExport = () => {
    if (!scheduleGroup || !semester) return;
    exportScheduleData({
      scheduleGroup,
      semester,
      courses,
      courseSections,
      scheduleSections,
      students: dataStore.getStudentRoster(scheduleGroupId!),
    });
  };

  const refreshSections = () => {
    if (!scheduleGroupId) return;
    setCourseSections(dataStore.getCourseSections());
    setScheduleSections(dataStore.getScheduleSections(scheduleGroupId));
  };

  if (!scheduleGroup) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem",
          color: "#6b7280",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        Schedule group not found
      </div>
    );
  }

  const semester = dataStore.getSemesterById(scheduleGroup.semesterId);
  const isSemester5 = scheduleGroup.level === "Semester 5";

  return (
    <DndProvider backend={HTML5Backend}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

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
        }

        .sb-btn-export:hover { background: #003d2a; }

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
      `}</style>

      <div className="sb-root">
        <div className="sb-header">
          <div className="sb-header-left">
            <button
              className="sb-btn-back"
              onClick={() => navigate(`/semester/${scheduleGroup.semesterId}`)}
            >
              <ArrowLeft size={15} />
              Back
            </button>
            <div className="sb-title">
              <h1>
                {scheduleGroup.name} — {scheduleGroup.level}
              </h1>
              <p>
                {semester?.name} • {scheduleGroup.locationNote}
              </p>
            </div>
          </div>

          <div className="sb-actions">
            <button className="sb-btn sb-btn-export" onClick={handleExport}>
              <Download size={14} />
              Export Schedule
            </button>
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
              <CoursePalette courses={courses} />
            </div>
            <div>
              <ScheduleCanvas
                scheduleGroup={scheduleGroup}
                isSemester5={isSemester5}
                courses={courses}
                courseSections={courseSections}
                scheduleSections={scheduleSections}
                onRefresh={refreshSections}
                onDrop={(courseId, dayOfWeek, timeSlot, dateRange) =>
                  setDetailsModal({ courseId, dayOfWeek, timeSlot, dateRange })
                }
              />
            </div>
            <ScheduleViewer
              semesterId={scheduleGroup.semesterId}
              currentScheduleGroupId={scheduleGroupId!}
              courses={courses}
              courseSections={courseSections}
            />
          </div>
        ) : (
          <StudentRosterView scheduleGroupId={scheduleGroupId!} />
        )}
      </div>

      {detailsModal && scheduleGroup && (
        <CourseDetailsModal
          scheduleGroupId={scheduleGroup.id}
          courseId={detailsModal.courseId}
          dayOfWeek={detailsModal.dayOfWeek}
          timeSlot={detailsModal.timeSlot}
          dateRange={detailsModal.dateRange}
          isSemester5={isSemester5}
          courses={courses}
          onClose={() => setDetailsModal(null)}
          onSuccess={() => {
            refreshSections();
            setDetailsModal(null);
          }}
        />
      )}
    </DndProvider>
  );
}
