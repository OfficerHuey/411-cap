import { useEffect, useState } from "react";
import "../App.css";
import { CreateSemesterModal } from "./CreateSemesterModal";
import { CloneSemesterModal } from "./CloneSemesterModal";
import { Plus, Calendar, Trash2, Lock, Unlock, Copy, ArrowRight } from "lucide-react";
import { authService } from "../Lib/Auth";
import { semesters as semestersApi } from "../Lib/api";
import type { Semester } from "../Lib/Types";
import { useNavigate } from "react-router-dom";
import { useToast } from "../Lib/ToastContext";

export function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [cloneSource, setCloneSource] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canEdit = authService.canEdit();

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await semestersApi.getAll();
      setSemesterList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load semesters");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSemester = async (id: number) => {
    try {
      await semestersApi.delete(id);
      setDeleteConfirm(null);
      addToast("success", "Semester deleted successfully");
      await loadSemesters();
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete semester");
      setDeleteConfirm(null);
    }
  };

  const handleToggleLock = async (id: number) => {
    try {
      const result = await semestersApi.toggleLock(id);
      addToast("success", result.isLocked ? "Semester locked" : "Semester unlocked");
      await loadSemesters();
    } catch (err: any) {
      addToast("error", err.message || "Failed to toggle lock");
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const end = new Date(endDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${start} – ${end}`;
  };

  return (
    <>
      <style>{`
        .dash-root { font-family: 'Inter', sans-serif; }

        .dash-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .dash-header-text h1 {
          font-family: 'Playfair Display', serif;
          font-size: 1.85rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.3rem 0;
          letter-spacing: -0.01em;
        }

        .dash-header-text p {
          color: #6b7280;
          font-size: 0.88rem;
          margin: 0;
          font-weight: 400;
        }

        .btn-create {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.35rem;
          background: linear-gradient(135deg, #00563f 0%, #003d2a 100%);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,86,63,0.15), 0 4px 12px rgba(0,86,63,0.1);
        }

        .btn-create:hover {
          box-shadow: 0 1px 3px rgba(0,86,63,0.2), 0 8px 24px rgba(0,86,63,0.15);
          transform: translateY(-1px);
        }

        .btn-create:active { transform: translateY(0); }

        .dash-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .semester-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.25s ease;
          position: relative;
        }

        .semester-card:hover {
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 12px 36px rgba(0,0,0,0.08);
          transform: translateY(-3px);
          border-color: #d1d5db;
        }

        .semester-card.is-locked {
          border-color: #e5e7eb;
        }

        .semester-card.is-locked::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.4);
          pointer-events: none;
          border-radius: 12px;
          z-index: 1;
        }

        .card-accent {
          height: 3px;
          background: linear-gradient(90deg, #00563f 0%, #C8952C 100%);
        }

        .card-accent.locked-accent {
          background: linear-gradient(90deg, #9ca3af 0%, #d1d5db 100%);
        }

        .card-body { padding: 1.5rem; }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .card-title-group { display: flex; align-items: center; gap: 0.75rem; }

        .card-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #f0faf5 0%, #e6f5ee 100%);
          border: 1px solid #c6e8d8;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-title {
          font-weight: 600;
          font-size: 1.05rem;
          color: #111827;
          margin: 0 0 0.15rem 0;
          letter-spacing: -0.01em;
        }

        .card-dates {
          font-size: 0.78rem;
          color: #9ca3af;
          margin: 0;
          font-weight: 400;
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 0.15rem;
          position: relative;
          z-index: 2;
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
        .card-action-btn.locked { color: #dc2626; }
        .card-action-btn.locked:hover { color: #00563f; background: #f0faf5; }

        .card-badges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .card-clinical-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.65rem;
          background: rgba(200, 149, 44, 0.08);
          color: #92400e;
          border: 1px solid rgba(200, 149, 44, 0.2);
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 500;
        }

        .card-lock-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0.65rem;
          background: rgba(220, 38, 38, 0.06);
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.15);
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 500;
        }

        .btn-open {
          width: 100%;
          padding: 0.6rem;
          background: #fafaf9;
          color: #00563f;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .btn-open:hover {
          background: #00563f;
          color: #ffffff;
          border-color: #00563f;
        }

        .dash-empty {
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

        .dash-empty-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #f0faf5 0%, #e6f5ee 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .dash-empty h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          color: #111827;
          margin: 0 0 0.4rem 0;
        }

        .dash-empty p {
          color: #9ca3af;
          font-size: 0.88rem;
          margin: 0 0 1.75rem 0;
          font-weight: 400;
        }

        .dash-footer {
          text-align: center;
          padding: 3rem 2rem 1rem;
          font-size: 0.7rem;
          color: #d1d5db;
          letter-spacing: 0.06em;
          text-transform: uppercase;
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
          background: #fef2f2;
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
      `}</style>

      <div className="dash-root">
        <div className="dash-header">
          <div className="dash-header-text">
            <h1>Welcome{authService.getCurrentUser()?.name ? `, ${authService.getCurrentUser()!.name}` : ""}</h1>
            <p>Manage semesters and course schedules</p>
          </div>
          {canEdit && (
            <button
              className="btn-create"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              New Semester
            </button>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-spinner"><span>Loading semesters…</span></div>
        ) : (
          <div className="dash-grid">
            {semesterList.map((semester) => (
              <div key={semester.id} className={`semester-card ${semester.isLocked ? "is-locked" : ""}`}>
                <div className={`card-accent ${semester.isLocked ? "locked-accent" : ""}`} />
                <div className="card-body">
                  <div className="card-top">
                    <div className="card-title-group">
                      <div className="card-icon">
                        <Calendar size={18} color="#00563f" />
                      </div>
                      <div>
                        <h3 className="card-title">{semester.name}</h3>
                        <p className="card-dates">
                          {formatDateRange(semester.startDate, semester.endDate)}
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="card-actions">
                        <button
                          className={`card-action-btn ${semester.isLocked ? "locked" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLock(semester.id);
                          }}
                          title={semester.isLocked ? "Unlock semester" : "Lock semester"}
                        >
                          {semester.isLocked ? <Lock size={15} /> : <Unlock size={15} />}
                        </button>
                        <button
                          className="card-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCloneSource(semester);
                          }}
                          title="Clone semester"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          className="card-action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(semester.id);
                          }}
                          title="Delete semester"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="card-badges">
                    {semester.clinicalDays && (
                      <span className="card-clinical-badge">
                        {semester.clinicalDays}
                      </span>
                    )}
                    {semester.isLocked && (
                      <span className="card-lock-badge">
                        <Lock size={11} />
                        Locked
                      </span>
                    )}
                  </div>

                  <button
                    className="btn-open"
                    onClick={() => navigate(`/semester/${semester.id}`)}
                  >
                    Open Semester
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}

            {semesterList.length === 0 && (
              <div className="dash-empty">
                <div className="dash-empty-icon">
                  <Calendar size={26} color="#00563f" />
                </div>
                <h3>No Semesters Yet</h3>
                <p>Create your first semester to get started</p>
                {canEdit && (
                  <button
                    className="btn-create"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus size={16} />
                    Create Semester
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="dash-footer">
          Southeastern Louisiana University · School of Nursing
        </div>
      </div>

      {showCreateModal && (
        <CreateSemesterModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadSemesters();
            setShowCreateModal(false);
            addToast("success", "Semester created successfully");
          }}
        />
      )}

      {deleteConfirm != null && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon">
              <Trash2 size={22} color="#dc2626" />
            </div>
            <h3>Delete Semester?</h3>
            <p>
              This will permanently delete this semester and all associated
              schedules and data. This action cannot be undone.
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
                onClick={() => handleDeleteSemester(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {cloneSource && (
        <CloneSemesterModal
          source={cloneSource}
          onClose={() => setCloneSource(null)}
          onSuccess={() => {
            setCloneSource(null);
            addToast("success", "Semester cloned successfully");
            loadSemesters();
          }}
        />
      )}
    </>
  );
}
