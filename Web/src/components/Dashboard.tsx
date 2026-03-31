import { useEffect, useState } from "react";
import "../App.css";
import { CreateSemesterModal } from "./CreateSemesterModal";
import { Plus, Calendar, Trash2 } from "lucide-react";
import { authService } from "../Lib/Auth";
import { dataStore } from "../Lib/Store";
import type { Semester } from "../Lib/Types";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const canEdit = authService.canEdit();

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = () => {
    setSemesters(dataStore.getSemesters());
  };

  const handleDeleteSemester = (id: string) => {
    dataStore.deleteSemester(id);
    setDeleteConfirm(null);
    loadSemesters();
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
    return `${start} - ${end}`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .dash-root { font-family: 'DM Sans', sans-serif; }

        .dash-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e5e2db;
        }

        .dash-header-text h1 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0 0 0.35rem 0;
        }

        .dash-header-divider {
          width: 40px;
          height: 3px;
          background: #00563f;
          border-radius: 2px;
          margin-bottom: 0.6rem;
        }

        .dash-header-text p { color: #6b7280; font-size: 0.9rem; margin: 0; font-weight: 300; }

        .btn-create {
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
          letter-spacing: 0.02em;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }

        .btn-create:hover { background: #003d2a; }
        .btn-create:active { transform: scale(0.98); }

        .dash-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .semester-card {
          background: #ffffff;
          border: 1px solid #e5e2db;
          border-radius: 10px;
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .semester-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.09);
          transform: translateY(-2px);
        }

        .card-accent { height: 4px; background: linear-gradient(90deg, #00563f, #C8952C); }
        .card-body { padding: 1.5rem; }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .card-title-group { display: flex; align-items: center; gap: 0.75rem; }

        .card-icon {
          width: 38px;
          height: 38px;
          background: #f0faf5;
          border: 1px solid #c6e8d8;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 600; color: #0a1f14; margin: 0 0 0.2rem 0; }
        .card-dates { font-size: 0.78rem; color: #9ca3af; margin: 0; }

        .btn-delete {
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

        .btn-delete:hover { color: #dc2626; background: #fef2f2; }

        .card-clinical-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          background: rgba(200, 149, 44, 0.1);
          color: #926a10;
          border: 1px solid rgba(200, 149, 44, 0.3);
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 500;
          margin-bottom: 1.25rem;
        }

        .btn-open {
          width: 100%;
          padding: 0.65rem;
          background: #f0faf5;
          color: #00563f;
          border: 1px solid #c6e8d8;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          box-sizing: border-box;
        }

        .btn-open:hover { background: #00563f; color: #ffffff; border-color: #00563f; }

        .dash-empty {
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

        .dash-empty-icon {
          width: 56px;
          height: 56px;
          background: #f0faf5;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .dash-empty h3 { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: #0a1f14; margin: 0 0 0.5rem 0; }
        .dash-empty p { color: #9ca3af; font-size: 0.88rem; margin: 0 0 1.5rem 0; font-weight: 300; }

        .dash-footer {
          text-align: center;
          padding: 2rem;
          font-size: 0.75rem;
          color: #c4c0b8;
          letter-spacing: 0.04em;
          text-transform: uppercase;
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

        .delete-box h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #0a1f14; margin: 0 0 0.5rem 0; }
        .delete-box p { font-size: 0.85rem; color: #6b7280; margin: 0 0 1.5rem 0; line-height: 1.5; }
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

      <div className="dash-root">
        <div className="dash-header">
          <div className="dash-header-text">
            <h1>Dashboard</h1>
            <div className="dash-header-divider" />
            <p>Manage semesters and course schedules</p>
          </div>
          {canEdit && (
            <button
              className="btn-create"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Create New Semester
            </button>
          )}
        </div>

        <div className="dash-grid">
          {semesters.map((semester) => (
            <div key={semester.id} className="semester-card">
              <div className="card-accent" />
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
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(semester.id);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="card-clinical-badge">
                  Clinical Days: {semester.clinicalDays}
                </div>

                <button
                  className="btn-open"
                  onClick={() => navigate(`/semester/${semester.id}`)}
                >
                  Open Semester
                </button>
              </div>
            </div>
          ))}

          {semesters.length === 0 && (
            <div className="dash-empty">
              <div className="dash-empty-icon">
                <Calendar size={26} color="#00563f" />
              </div>
              <h3>No Semesters Yet</h3>
              <p>Get started by creating your first semester</p>
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
          }}
        />
      )}

      {deleteConfirm && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon">
              <Trash2 size={20} color="#dc2626" />
            </div>
            <h3>Delete Semester?</h3>
            <p>
              This will permanently delete this semester and all associated
              schedules and data.
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
    </>
  );
}
