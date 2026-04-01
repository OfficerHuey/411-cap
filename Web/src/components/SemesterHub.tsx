import { useEffect, useState } from "react";
import "../App.css";
import { ArrowLeft, Plus, Trash2, Edit2, Lock, Copy, Download, History, ChevronUp, ChevronDown } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { authService } from "../Lib/Auth";
import { semesters as semestersApi, schedules as schedulesApi, exports as exportsApi } from "../Lib/api";
import type { SemesterLevel, Semester, Schedule } from "../Lib/Types";
import { levelToNumber } from "../Lib/Types";
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
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [cloneSemesterConfirm, setCloneSemesterConfirm] = useState(false);
  const [cloneScheduleId, setCloneScheduleId] = useState<number | null>(null);
  const [cloning, setCloning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canEdit = authService.canEdit();
  const semIdNum = parseInt(semesterId || "0");

  useEffect(() => {
    if (!semesterId) return;
    loadSemester();
  }, [semesterId]);

  useEffect(() => {
    if (!semesterId) return;
    loadSchedules();
  }, [semesterId, activeLevel]);

  const loadSemester = async () => {
    try {
      const all = await semestersApi.getAll();
      const sem = all.find((s) => s.id === semIdNum);
      setSemester(sem || null);
    } catch (err: any) {
      setError(err.message || "Failed to load semester");
    }
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError("");
      const levelNum = levelToNumber(activeLevel);
      const data = await schedulesApi.getBySemester(semIdNum, levelNum);
      setScheduleList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await schedulesApi.delete(id);
      setDeleteConfirm(null);
      await loadSchedules();
    } catch (err: any) {
      setError(err.message || "Failed to delete schedule");
      setDeleteConfirm(null);
    }
  };

  const handleCloneSemester = async () => {
    if (!semester) return;
    setCloning(true);
    try {
      const newSem = await semestersApi.clone(semIdNum, {
        name: `${semester.name} (Copy)`,
        startDate: semester.startDate,
        endDate: semester.endDate,
        clinicalDays: semester.clinicalDays,
      });
      setCloneSemesterConfirm(false);
      navigate(`/semester/${newSem.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to clone semester");
      setCloneSemesterConfirm(false);
    } finally {
      setCloning(false);
    }
  };

  const handleCloneSchedule = async (schedId: number) => {
    const sched = scheduleList.find((s) => s.id === schedId);
    if (!sched) return;
    setCloning(true);
    try {
      await schedulesApi.clone(schedId, { newName: `${sched.name} (Copy)` });
      setCloneScheduleId(null);
      await loadSchedules();
    } catch (err: any) {
      setError(err.message || "Failed to clone schedule");
      setCloneScheduleId(null);
    } finally {
      setCloning(false);
    }
  };

  const handleReorder = async (schedId: number, direction: "up" | "down") => {
    const idx = scheduleList.findIndex((s) => s.id === schedId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= scheduleList.length) return;

    const newList = [...scheduleList];
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    setScheduleList(newList);

    try {
      await schedulesApi.reorder(newList.map((s, i) => ({ id: s.id, sortOrder: i })));
    } catch (err: any) {
      setError(err.message || "Failed to reorder");
      await loadSchedules();
    }
  };

  if (!semester && !loading) {
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

  const isLocked = semester?.isLocked ?? false;

  return (
    <>
      <style>{`
        .hub-root { font-family: 'DM Sans', sans-serif; }

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

        .hub-lock-badge {
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
        .btn-add:disabled { background: #6b7280; cursor: not-allowed; }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1rem;
          background: #ffffff;
          color: #374151;
          border: 1.5px solid #e5e2db;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          white-space: nowrap;
        }

        .btn-secondary:hover { background: #f0faf5; border-color: #00563f; color: #00563f; }

        .btn-clone-schedule {
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

        .btn-clone-schedule:hover { color: #00563f; background: #f0faf5; }

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

        .hub-tab:hover { background: #f8f7f4; color: #0a1f14; }

        .hub-tab.active {
          color: #00563f;
          border-bottom-color: #00563f;
          background: #f0faf5;
        }

        .hub-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

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

        .schedule-card-body { padding: 1.5rem; }

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

        .schedule-card-location { font-size: 0.8rem; color: #9ca3af; margin: 0; }

        .schedule-card-capacity {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.2rem 0.6rem;
          background: rgba(0, 86, 63, 0.1);
          color: #00563f;
          border-radius: 20px;
          border: 1px solid rgba(0, 86, 63, 0.2);
          margin-top: 0.4rem;
          display: inline-block;
        }

        .schedule-card-capacity.at-capacity {
          background: rgba(220, 38, 38, 0.08);
          color: #dc2626;
          border-color: rgba(220, 38, 38, 0.2);
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

        .btn-delete-schedule:hover { color: #dc2626; background: #fef2f2; }

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

        .loading-spinner {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
          font-size: 0.9rem;
        }

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

        .delete-box h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          color: #0a1f14;
          margin: 0 0 0.5rem 0;
        }

        .delete-box p {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0 0 1.5rem 0;
          line-height: 1.5;
        }

        .delete-box-actions { display: flex; gap: 0.75rem; }

        .delete-btn-cancel {
          flex: 1;
          padding: 0.65rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          color: #6b7280;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .delete-btn-cancel:hover { background: #f9fafb; }

        .delete-btn-confirm {
          flex: 1;
          padding: 0.65rem;
          background: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .delete-btn-confirm:hover { background: #b91c1c; }
      `}</style>

      <div className="hub-root">
        <div className="hub-header">
          <div className="hub-header-left">
            <button className="btn-back" onClick={() => navigate("/")}>
              <ArrowLeft size={16} />
            </button>
            <div className="hub-title">
              <h1>
                {semester?.name || "Loading..."}
                {isLocked && (
                  <span className="hub-lock-badge">
                    <Lock size={12} />
                    Locked
                  </span>
                )}
              </h1>
              {semester && (
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
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              className="btn-secondary"
              onClick={() => navigate(`/changelog/${semIdNum}`)}
            >
              <History size={14} />
              History
            </button>
            {semester && (
              <button
                className="btn-secondary"
                onClick={() => exportsApi.roster(semIdNum, semester.name)}
              >
                <Download size={14} />
                Export
              </button>
            )}
            {canEdit && !isLocked && (
              <button
                className="btn-secondary"
                onClick={() => setCloneSemesterConfirm(true)}
              >
                <Copy size={14} />
                Clone Semester
              </button>
            )}
            {canEdit && (
              <button
                className="btn-add"
                onClick={() => setShowCreateModal(true)}
                disabled={isLocked}
              >
                <Plus size={16} />
                Add Schedule Group
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

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

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <div className="hub-grid">
            {scheduleList.map((schedule) => (
              <div key={schedule.id} className="schedule-card">
                <div className="schedule-card-accent" />
                <div className="schedule-card-body">
                  <div className="schedule-card-top">
                    <div>
                      <h3 className="schedule-card-title">{schedule.name}</h3>
                      <p className="schedule-card-location">
                        {schedule.locationDisplay}
                      </p>
                      <span className={`schedule-card-capacity ${schedule.students.length >= schedule.capacity ? "at-capacity" : ""}`}>
                        {schedule.students.length}/{schedule.capacity} students
                      </span>
                    </div>
                    {canEdit && !isLocked && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}>
                        <button
                          className="btn-clone-schedule"
                          onClick={() => setCloneScheduleId(schedule.id)}
                          title="Clone schedule"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          className="btn-delete-schedule"
                          onClick={() => setDeleteConfirm(schedule.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button
                      className="btn-edit-schedule"
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/schedule-builder/${schedule.id}`)}
                    >
                      <Edit2 size={14} />
                      Edit Schedule
                    </button>
                    {canEdit && !isLocked && scheduleList.length > 1 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <button
                          className="btn-clone-schedule"
                          onClick={() => handleReorder(schedule.id, "up")}
                          disabled={scheduleList.indexOf(schedule) === 0}
                          title="Move up"
                          style={{ opacity: scheduleList.indexOf(schedule) === 0 ? 0.3 : 1 }}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          className="btn-clone-schedule"
                          onClick={() => handleReorder(schedule.id, "down")}
                          disabled={scheduleList.indexOf(schedule) === scheduleList.length - 1}
                          title="Move down"
                          style={{ opacity: scheduleList.indexOf(schedule) === scheduleList.length - 1 ? 0.3 : 1 }}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {scheduleList.length === 0 && (
              <div className="hub-empty">
                <h3>No Schedule Groups Yet</h3>
                <p>Create a schedule group for {activeLevel}</p>
                {canEdit && !isLocked && (
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
        )}
      </div>

      {showCreateModal && semester && (
        <CreateScheduleModal
          semesterId={semIdNum}
          level={activeLevel}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadSchedules();
            setShowCreateModal(false);
          }}
        />
      )}

      {deleteConfirm != null && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon">
              <Trash2 size={20} color="#dc2626" />
            </div>
            <h3>Delete Schedule Group?</h3>
            <p>
              This will permanently delete this schedule group and all its
              associated data.
            </p>
            <div className="delete-box-actions">
              <button
                className="delete-btn-cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="delete-btn-confirm"
                onClick={() => handleDeleteSchedule(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {cloneSemesterConfirm && (
        <div className="delete-overlay" onClick={() => setCloneSemesterConfirm(false)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon" style={{ background: "#f0faf5" }}>
              <Copy size={20} color="#00563f" />
            </div>
            <h3>Clone Semester?</h3>
            <p>
              This will create a copy of this semester with all schedule groups
              and sections, but without students or instructor assignments.
            </p>
            <div className="delete-box-actions">
              <button className="delete-btn-cancel" onClick={() => setCloneSemesterConfirm(false)}>
                Cancel
              </button>
              <button
                className="delete-btn-confirm"
                style={{ background: "#00563f" }}
                onClick={handleCloneSemester}
                disabled={cloning}
              >
                {cloning ? "Cloning..." : "Clone"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cloneScheduleId != null && (
        <div className="delete-overlay" onClick={() => setCloneScheduleId(null)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon" style={{ background: "#f0faf5" }}>
              <Copy size={20} color="#00563f" />
            </div>
            <h3>Duplicate Schedule?</h3>
            <p>
              This will create a copy of this schedule group with all its sections.
            </p>
            <div className="delete-box-actions">
              <button className="delete-btn-cancel" onClick={() => setCloneScheduleId(null)}>
                Cancel
              </button>
              <button
                className="delete-btn-confirm"
                style={{ background: "#00563f" }}
                onClick={() => handleCloneSchedule(cloneScheduleId)}
                disabled={cloning}
              >
                {cloning ? "Cloning..." : "Duplicate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
