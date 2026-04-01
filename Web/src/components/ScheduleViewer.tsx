import { useEffect, useState } from "react";
import "../App.css";
import { Eye, X, ChevronRight } from "lucide-react";
import { schedules as schedulesApi } from "../Lib/api";
import type { Schedule } from "../Lib/Types";
import { courseTypeColor, dayOfWeekName, timeSpanToDisplay } from "../Lib/Types";

interface ScheduleViewerProps {
  semesterId: number;
  currentScheduleId: number;
}

export function ScheduleViewer({
  semesterId,
  currentScheduleId,
}: ScheduleViewerProps) {
  const [otherSchedules, setOtherSchedules] = useState<Schedule[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadOtherSchedules();
  }, [semesterId, currentScheduleId]);

  const loadOtherSchedules = async () => {
    try {
      const all = await schedulesApi.getBySemester(semesterId);
      setOtherSchedules(all.filter((s) => s.id !== currentScheduleId));
    } catch {
      //non-critical
    }
  };

  const getColor = (courseType: string) => {
    return courseTypeColor(courseType as any);
  };

  return (
    <>
      <style>{`
        .sv-trigger {
          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px 0 0 8px;
          padding: 0.75rem 0.5rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          z-index: 100;
          box-shadow: -2px 0 12px rgba(0,0,0,0.15);
          transition: background 0.15s;
        }

        .sv-trigger:hover { background: #003d2a; }

        .sv-trigger-label {
          font-family: 'Inter', sans-serif;
          font-size: 0.68rem;
          font-weight: 500;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .sv-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 200;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s;
        }

        .sv-overlay.open { opacity: 1; pointer-events: all; }

        .sv-panel {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 300px;
          background: #ffffff;
          z-index: 201;
          box-shadow: -4px 0 24px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.25s ease;
          font-family: 'Inter', sans-serif;
        }

        .sv-panel.open { transform: translateX(0); }

        .sv-panel-header {
          background: #00563f;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .sv-panel-header-left { display: flex; align-items: center; gap: 0.6rem; }

        .sv-panel-header h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .sv-panel-header p {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          margin: 0.2rem 0 0;
          font-weight: 300;
        }

        .sv-close {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          color: #ffffff;
          cursor: pointer;
          padding: 0.3rem;
          display: flex;
          align-items: center;
          transition: background 0.15s;
        }

        .sv-close:hover { background: rgba(255,255,255,0.2); }

        .sv-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
        }

        .sv-group {
          border: 1px solid #e5e2db;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .sv-group-header {
          padding: 0.75rem 1rem;
          background: #fafaf8;
          border-bottom: 1px solid #e5e2db;
        }

        .sv-group-name {
          font-family: 'Playfair Display', serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0 0 0.1rem 0;
        }

        .sv-group-location { font-size: 0.75rem; color: #9ca3af; margin: 0; }

        .sv-group-body {
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .sv-course-item {
          font-size: 0.78rem;
          padding: 0.4rem 0.6rem;
          border-radius: 5px;
          border-left: 3px solid transparent;
        }

        .sv-course-code { font-weight: 600; color: #0a1f14; margin-bottom: 0.1rem; }
        .sv-course-time { color: #6b7280; font-size: 0.72rem; }

        .sv-empty {
          font-size: 0.78rem;
          color: #9ca3af;
          font-style: italic;
          padding: 0.25rem 0.75rem 0.75rem;
        }

        .sv-no-groups {
          text-align: center;
          color: #9ca3af;
          font-size: 0.85rem;
          padding: 2rem 0;
          font-weight: 300;
        }
      `}</style>

      <button className="sv-trigger" onClick={() => setIsOpen(true)}>
        <Eye size={16} />
        <span className="sv-trigger-label">Other Schedules</span>
        <ChevronRight size={14} />
      </button>

      <div
        className={`sv-overlay ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      <div className={`sv-panel ${isOpen ? "open" : ""}`}>
        <div className="sv-panel-header">
          <div>
            <div className="sv-panel-header-left">
              <Eye size={16} color="white" />
              <h3>Other Schedules</h3>
            </div>
            <p>Other groups in this semester</p>
          </div>
          <button className="sv-close" onClick={() => setIsOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="sv-panel-body">
          {otherSchedules.length === 0 ? (
            <p className="sv-no-groups">No other schedules in this semester</p>
          ) : (
            otherSchedules.map((sched) => (
              <div key={sched.id} className="sv-group">
                <div className="sv-group-header">
                  <p className="sv-group-name">{sched.name}</p>
                  <p className="sv-group-location">{sched.locationDisplay}</p>
                </div>
                <div className="sv-group-body">
                  {sched.sections.length > 0 ? (
                    sched.sections.map((section) => {
                      const color = getColor(section.courseType);
                      return (
                        <div
                          key={section.id}
                          className="sv-course-item"
                          style={{
                            backgroundColor: `${color}18`,
                            borderLeftColor: color,
                          }}
                        >
                          <div className="sv-course-code">
                            {section.courseCode}-{section.sectionNumber}
                          </div>
                          <div className="sv-course-time">
                            {section.dayOfWeek != null && section.startTime
                              ? `${dayOfWeekName(section.dayOfWeek)} at ${timeSpanToDisplay(section.startTime)}`
                              : section.dateRange}
                          </div>
                          {section.notes && (
                            <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.1rem" }}>
                              {section.notes}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="sv-empty">No courses scheduled</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
