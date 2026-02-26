import { useEffect, useState } from "react";
import "../App.css";
import { ArrowLeft, Plus, Trash2, Edit2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { authService } from "../Lib/Auth";
import { dataStore } from "../Lib/Store";
import type { SemesterLevel, Semester, ScheduleGroup } from "../Lib/Types";
import { CreateScheduleModal } from "./CreateScheduleModal";

const LEVELS: SemesterLevel[] = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
];

export function SemesterHub() {
  const { semesterId } = useParams<{ semesterId: string }>();
  const navigate = useNavigate();
  const [semester, setSemester] = useState<Semester | null>(null);
  const [activeLevel, setActiveLevel] = useState<SemesterLevel>("Semester 1");
  const [scheduleGroups, setScheduleGroups] = useState<ScheduleGroup[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canEdit = authService.canEdit();

  useEffect(() => {
    if (!semesterId) return;
    const sem = dataStore.getSemesterById(semesterId);
    setSemester(sem || null);
    loadScheduleGroups();
  }, [semesterId, activeLevel]);

  const loadScheduleGroups = () => {
    if (!semesterId) return;
    const groups = dataStore.getScheduleGroups(semesterId, activeLevel);
    setScheduleGroups(groups);
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm("Are you sure you want to delete this schedule group?")) {
      dataStore.deleteScheduleGroup(id);
      loadScheduleGroups();
    }
  };

  if (!semester) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem",
          color: "#6b7280",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        Semester not found
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .hub-root {
          font-family: 'DM Sans', sans-serif;
        }

        /* Page header */
        .hub-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e5e2db;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .hub-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

.btn-back {
  height: 36px;
  padding: 0 1rem;
  gap: 0.4rem;
  background: #ffffff;
  border: 1.5px solid #e5e2db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.btn-back:hover {
  background: #00563f;
  color: #ffffff;
  border-color: #00563f;
}

        .hub-title h1 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0 0 0.2rem 0;
        }

        .hub-title p {
          font-size: 0.85rem;
          color: #9ca3af;
          margin: 0;
          font-weight: 300;
        }

        /* Add button */
        .btn-add {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }

        .btn-add:hover { background: #003d2a; }
        .btn-add:active { transform: scale(0.98); }

        /* Level tabs */
        .hub-tabs {
          display: flex;
          background: #ffffff;
          border: 1px solid #e5e2db;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .hub-tab {
          flex: 1;
          padding: 0.875rem 1rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
          white-space: nowrap;
        }

        .hub-tab:hover {
          background: #f8f7f4;
          color: #0a1f14;
        }

        .hub-tab.active {
          color: #00563f;
          border-bottom-color: #00563f;
          background: #f0faf5;
        }

        /* Grid */
        .hub-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        /* Schedule card */
        .schedule-card {
          background: #ffffff;
          border: 1px solid #e5e2db;
          border-radius: 10px;
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .schedule-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.09);
          transform: translateY(-2px);
        }

        .schedule-card-accent {
          height: 4px;
          background: linear-gradient(90deg, #00563f, #C8952C);
        }

        .schedule-card-body {
          padding: 1.5rem;
        }

        .schedule-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .schedule-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0 0 0.25rem 0;
        }

        .schedule-card-location {
          font-size: 0.8rem;
          color: #9ca3af;
          margin: 0;
        }

        .btn-delete-schedule {
          background: none;
          border: none;
          cursor: pointer;
          color: #d1d5db;
          padding: 0.25rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s, background 0.15s;
          flex-shrink: 0;
        }

        .btn-delete-schedule:hover {
          color: #dc2626;
          background: #fef2f2;
        }

        .btn-edit-schedule {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.65rem;
          background: #f0faf5;
          color: #00563f;
          border: 1px solid #c6e8d8;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          box-sizing: border-box;
        }

        .btn-edit-schedule:hover {
          background: #00563f;
          color: #ffffff;
          border-color: #00563f;
        }

        /* Empty state */
        .hub-empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          background: #ffffff;
          border: 2px dashed #d1d5db;
          border-radius: 10px;
          text-align: center;
        }

        .hub-empty h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          color: #0a1f14;
          margin: 0 0 0.5rem 0;
        }

        .hub-empty p {
          color: #9ca3af;
          font-size: 0.88rem;
          margin: 0 0 1.5rem 0;
          font-weight: 300;
        }
      `}</style>

      <div className="hub-root">
        {/* Header */}
        <div className="hub-header">
          <div className="hub-header-left">
            <button className="btn-back" onClick={() => navigate("/")}>
              <ArrowLeft size={16} />
            </button>
            <div className="hub-title">
              <h1>{semester.name}</h1>
              <p>
                {new Date(semester.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {" — "}
                {new Date(semester.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          {canEdit && (
            <button
              className="btn-add"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Add Schedule Group
            </button>
          )}
        </div>

        {/* Level Tabs */}
        <div className="hub-tabs">
          {LEVELS.map((level) => (
            <button
              key={level}
              className={`hub-tab ${activeLevel === level ? "active" : ""}`}
              onClick={() => setActiveLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Schedule Groups Grid */}
        <div className="hub-grid">
          {scheduleGroups.map((group) => (
            <div key={group.id} className="schedule-card">
              <div className="schedule-card-accent" />
              <div className="schedule-card-body">
                <div className="schedule-card-top">
                  <div>
                    <h3 className="schedule-card-title">{group.name}</h3>
                    <p className="schedule-card-location">
                      {group.locationNote}
                    </p>
                  </div>
                  {canEdit && (
                    <button
                      className="btn-delete-schedule"
                      onClick={() => handleDeleteSchedule(group.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <button
                  className="btn-edit-schedule"
                  onClick={() => navigate(`/schedule-builder/${group.id}`)}
                >
                  <Edit2 size={14} />
                  Edit Schedule
                </button>
              </div>
            </div>
          ))}

          {scheduleGroups.length === 0 && (
            <div className="hub-empty">
              <h3>No Schedule Groups Yet</h3>
              <p>Create a schedule group for {activeLevel}</p>
              {canEdit && (
                <button
                  className="btn-add"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={16} />
                  Add Schedule Group
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateScheduleModal
          semesterId={semesterId!}
          level={activeLevel}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadScheduleGroups();
            setShowCreateModal(false);
          }}
        />
      )}
    </>
  );
}
