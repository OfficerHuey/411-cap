import { useEffect, useState } from "react";
import "../App.css";
import { ArrowLeft, Plus, Trash2, Edit2, Lock, Copy, Download, History, ChevronUp, ChevronDown, Upload } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { authService } from "../Lib/Auth";
import { semesters as semestersApi, schedules as schedulesApi, exports as exportsApi } from "../Lib/api";
import type { SemesterLevel, Semester, Schedule } from "../Lib/Types";
import { levelToNumber } from "../Lib/Types";
import { CreateScheduleModal } from "./CreateScheduleModal";
import { CloneSemesterModal } from "./CloneSemesterModal";
import { StudentImportModal } from "./StudentImportModal";
import { useToast } from "../Lib/ToastContext";

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
  const { addToast } = useToast();
  const [semester, setSemester] = useState<Semester | null>(null);
  const [activeLevel, setActiveLevel] = useState<SemesterLevel>("Semester 1");
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showCloneSemester, setShowCloneSemester] = useState(false);
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
      addToast("success", "Schedule group deleted");
      await loadSchedules();
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete schedule");
      setDeleteConfirm(null);
    }
  };

  const handleCloneSchedule = async (schedId: number) => {
    const sched = scheduleList.find((s) => s.id === schedId);
    if (!sched) return;
    setCloning(true);
    try {
      await schedulesApi.clone(schedId, { newName: `${sched.name} (Copy)` });
      setCloneScheduleId(null);
      addToast("success", "Schedule duplicated");
      await loadSchedules();
    } catch (err: any) {
      addToast("error", err.message || "Failed to clone schedule");
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
      addToast("error", err.message || "Failed to reorder");
      await loadSchedules();
    }
  };

  if (!semester && !loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280", fontFamily: "Inter, sans-serif" }}>
        Semester not found
      </div>
    );
  }

  const isLocked = semester?.isLocked ?? false;

  return (
    <>
      <style>{`
        .hub-root { font-family: 'Inter', sans-serif; }

        .hub-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .hub-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn-back {
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

        .btn-back:hover {
          background: #00563f;
          color: #ffffff;
          border-color: #00563f;
        }

        .hub-title h1 {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.15rem 0;
          letter-spacing: -0.01em;
        }

        .hub-title p {
          font-size: 0.82rem;
          color: #9ca3af;
          margin: 0;
          font-weight: 400;
        }

        .hub-lock-badge {
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

        .hub-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn-add {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          background: linear-gradient(135deg, #00563f 0%, #003d2a 100%);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,86,63,0.15), 0 4px 12px rgba(0,86,63,0.1);
        }

        .btn-add:hover {
          box-shadow: 0 1px 3px rgba(0,86,63,0.2), 0 8px 24px rgba(0,86,63,0.15);
          transform: translateY(-1px);
        }

        .btn-add:active { transform: translateY(0); }
        .btn-add:disabled { background: #9ca3af; box-shadow: none; cursor: not-allowed; transform: none; }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 0.9rem;
          background: #ffffff;
          color: #374151;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-secondary:hover {
          border-color: #00563f;
          color: #00563f;
          background: #f0faf5;
        }

        .hub-tabs {
          display: inline-flex;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.3rem;
          margin-bottom: 2rem;
          gap: 0.2rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }

        .hub-tab {
          padding: 0.6rem 1.15rem;
          background: none;
          border: none;
          border-radius: 9px;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .hub-tab:hover {
          background: #f5f5f4;
          color: #111827;
        }

        .hub-tab.active {
          color: #ffffff;
          background: #00563f;
          box-shadow: 0 1px 3px rgba(0,86,63,0.2);
        }

        .hub-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
        }

        .schedule-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.25s ease;
        }

        .schedule-card:hover {
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 12px 36px rgba(0,0,0,0.08);
          transform: translateY(-3px);
          border-color: #d1d5db;
        }

        .schedule-card-accent {
          height: 3px;
          background: linear-gradient(90deg, #00563f 0%, #C8952C 100%);
        }

        .schedule-card-body { padding: 1.5rem; }

        .schedule-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .schedule-card-title {
          font-weight: 600;
          font-size: 1.05rem;
          color: #111827;
          margin: 0 0 0.2rem 0;
          letter-spacing: -0.01em;
        }

        .schedule-card-location {
          font-size: 0.78rem;
          color: #9ca3af;
          margin: 0;
        }

        .schedule-card-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.6rem;
        }

        .capacity-badge {
          font-size: 0.72rem;
          font-weight: 500;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .capacity-badge.green {
          background: rgba(5, 150, 105, 0.08);
          color: #059669;
          border: 1px solid rgba(5, 150, 105, 0.2);
        }

        .capacity-badge.yellow {
          background: rgba(217, 119, 6, 0.08);
          color: #92400e;
          border: 1px solid rgba(217, 119, 6, 0.2);
        }

        .capacity-badge.red {
          background: rgba(220, 38, 38, 0.08);
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        .capacity-bar-wrap {
          flex: 1;
          max-width: 80px;
          height: 4px;
          background: #f3f4f6;
          border-radius: 2px;
          overflow: hidden;
        }

        .capacity-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .schedule-card-actions {
          display: flex;
          align-items: center;
          gap: 0.15rem;
        }

        .card-action-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #d1d5db;
          padding: 0.3rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .card-action-btn:hover { color: #00563f; background: #f0faf5; }
        .card-action-btn.delete:hover { color: #dc2626; background: #fef2f2; }
        .card-action-btn:disabled { opacity: 0.3; cursor: default; }

        .schedule-card-footer {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-top: 1rem;
        }

        .btn-edit-schedule {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.6rem;
          background: #fafaf9;
          color: #00563f;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .btn-edit-schedule:hover {
          background: #00563f;
          color: #ffffff;
          border-color: #00563f;
        }

        .reorder-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hub-empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          background: #ffffff;
          border: 2px dashed #e5e7eb;
          border-radius: 12px;
          text-align: center;
        }

        .hub-empty h3 {
          font-weight: 600;
          font-size: 1.1rem;
          color: #111827;
          margin: 0 0 0.4rem 0;
        }

        .hub-empty p {
          color: #9ca3af;
          font-size: 0.88rem;
          margin: 0 0 1.75rem 0;
          font-weight: 400;
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

        .delete-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.15s ease;
        }

        .delete-box {
          background: #ffffff;
          border-radius: 16px;
          padding: 2rem;
          max-width: 380px;
          width: 100%;
          box-shadow: 0 20px 50px -12px rgba(0,0,0,0.2);
          font-family: 'Inter', sans-serif;
          text-align: center;
          animation: fadeInUp 0.25s ease;
        }

        .delete-box-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
        }

        .delete-box h3 {
          font-weight: 600;
          font-size: 1.05rem;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .delete-box p {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0 0 1.75rem 0;
          line-height: 1.5;
        }

        .delete-box-actions { display: flex; gap: 0.75rem; }

        .delete-btn-cancel {
          flex: 1;
          padding: 0.7rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
          color: #374151;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .delete-btn-cancel:hover { background: #f9fafb; border-color: #d1d5db; }

        .delete-btn-confirm {
          flex: 1;
          padding: 0.7rem;
          background: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 1px 3px rgba(220,38,38,0.2);
        }

        .delete-btn-confirm:hover { background: #b91c1c; }

        .clone-confirm-btn {
          flex: 1;
          padding: 0.7rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 1px 3px rgba(0,86,63,0.2);
        }

        .clone-confirm-btn:hover { background: #003d2a; }
        .clone-confirm-btn:disabled { background: #9ca3af; box-shadow: none; cursor: not-allowed; }
      `}</style>

      <div className="hub-root">
        <div className="hub-header">
          <div className="hub-header-left">
            <button className="btn-back" onClick={() => navigate("/")}>
              <ArrowLeft size={16} />
            </button>
            <div className="hub-title">
              <h1>
                {semester?.name || "Loading…"}
                {isLocked && (
                  <span className="hub-lock-badge">
                    <Lock size={11} />
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
          <div className="hub-actions">
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
                onClick={() => exportsApi.roster(semIdNum, semester.name).then(() => addToast("success", "Roster exported")).catch(() => addToast("error", "Export failed"))}
              >
                <Download size={14} />
                Export
              </button>
            )}
            {canEdit && !isLocked && (
              <button
                className="btn-secondary"
                onClick={() => setShowImport(true)}
              >
                <Upload size={14} />
                Import
              </button>
            )}
            {canEdit && !isLocked && (
              <button
                className="btn-secondary"
                onClick={() => setShowCloneSemester(true)}
              >
                <Copy size={14} />
                Clone
              </button>
            )}
            {canEdit && (
              <button
                className="btn-add"
                onClick={() => setShowCreateModal(true)}
                disabled={isLocked}
              >
                <Plus size={15} />
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
          <div className="loading-spinner"><span>Loading schedules…</span></div>
        ) : (
          <div className="hub-grid">
            {scheduleList.map((schedule) => {
              const pct = schedule.capacity > 0 ? schedule.students.length / schedule.capacity : 0;
              const colorClass = pct >= 1 ? "red" : pct >= 0.75 ? "yellow" : "green";
              const barColor = pct >= 1 ? "#dc2626" : pct >= 0.75 ? "#d97706" : "#059669";

              return (
                <div key={schedule.id} className="schedule-card">
                  <div className="schedule-card-accent" />
                  <div className="schedule-card-body">
                    <div className="schedule-card-top">
                      <div>
                        <h3 className="schedule-card-title">{schedule.name}</h3>
                        <p className="schedule-card-location">
                          {schedule.locationDisplay}
                        </p>
                        <div className="schedule-card-meta">
                          <span className={`capacity-badge ${colorClass}`}>
                            {schedule.students.length}/{schedule.capacity} students
                          </span>
                          <div className="capacity-bar-wrap">
                            <div
                              className="capacity-bar-fill"
                              style={{
                                width: `${Math.min(pct * 100, 100)}%`,
                                background: barColor,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      {canEdit && !isLocked && (
                        <div className="schedule-card-actions">
                          <button
                            className="card-action-btn"
                            onClick={() => setCloneScheduleId(schedule.id)}
                            title="Clone schedule"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            className="card-action-btn delete"
                            onClick={() => setDeleteConfirm(schedule.id)}
                            title="Delete schedule"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="schedule-card-footer">
                      <button
                        className="btn-edit-schedule"
                        onClick={() => navigate(`/schedule-builder/${schedule.id}`)}
                      >
                        <Edit2 size={13} />
                        Edit Schedule
                      </button>
                      {canEdit && !isLocked && scheduleList.length > 1 && (
                        <div className="reorder-col">
                          <button
                            className="card-action-btn"
                            onClick={() => handleReorder(schedule.id, "up")}
                            disabled={scheduleList.indexOf(schedule) === 0}
                            title="Move up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            className="card-action-btn"
                            onClick={() => handleReorder(schedule.id, "down")}
                            disabled={scheduleList.indexOf(schedule) === scheduleList.length - 1}
                            title="Move down"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

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
            addToast("success", "Schedule group created");
          }}
        />
      )}

      {deleteConfirm != null && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon" style={{ background: "#fef2f2" }}>
              <Trash2 size={22} color="#dc2626" />
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

      {showCloneSemester && semester && (
        <CloneSemesterModal
          source={semester}
          onClose={() => setShowCloneSemester(false)}
          onSuccess={(newSem) => {
            setShowCloneSemester(false);
            addToast("success", "Semester cloned successfully");
            navigate(`/semester/${newSem.id}`);
          }}
        />
      )}

      {showImport && (
        <StudentImportModal
          semesterId={semIdNum}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            addToast("success", "Students imported successfully");
            loadSchedules();
          }}
        />
      )}

      {cloneScheduleId != null && (
        <div className="delete-overlay" onClick={() => setCloneScheduleId(null)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon" style={{ background: "#f0faf5" }}>
              <Copy size={22} color="#00563f" />
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
                className="clone-confirm-btn"
                onClick={() => handleCloneSchedule(cloneScheduleId)}
                disabled={cloning}
              >
                {cloning ? "Cloning…" : "Duplicate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
