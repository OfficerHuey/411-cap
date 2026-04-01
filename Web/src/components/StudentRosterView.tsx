import { useEffect, useState } from "react";
import "../App.css";
import { Trash2, Plus, Users, Upload } from "lucide-react";
import { authService } from "../Lib/Auth";
import { students as studentsApi } from "../Lib/api";
import type { Student } from "../Lib/Types";
import { StudentImportModal } from "./StudentImportModal";
import { useToast } from "../Lib/ToastContext";

interface StudentRosterViewProps {
  scheduleId: number;
  semesterId: number;
  isLocked?: boolean;
  capacity?: number;
}

export function StudentRosterView({ scheduleId, semesterId, isLocked, capacity = 8 }: StudentRosterViewProps) {
  const { addToast } = useToast();
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [newStudent, setNewStudent] = useState({ name: "", wNumber: "", email: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canEdit = authService.canEdit() && !isLocked;

  useEffect(() => {
    loadStudents();
  }, [scheduleId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await studentsApi.getBySchedule(scheduleId);
      setStudentList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await studentsApi.create({
        name: newStudent.name,
        wNumber: newStudent.wNumber,
        email: newStudent.email,
        scheduleId,
      });
      setNewStudent({ name: "", wNumber: "", email: "" });
      addToast("success", "Student added");
      await loadStudents();
    } catch (err: any) {
      addToast("error", err.message || "Failed to add student");
    }
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      await studentsApi.delete(id);
      setDeleteConfirm(null);
      addToast("success", "Student removed");
      await loadStudents();
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete student");
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <style>{`
        .roster-root { font-family: 'Inter', sans-serif; }

        .roster-card {
          background: #ffffff;
          border: 1px solid #e5e2db;
          border-radius: 10px;
          overflow: hidden;
        }

        .roster-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e5e2db;
          background: #fafaf8;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .roster-header-left { display: flex; align-items: center; gap: 0.6rem; }

        .roster-header h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0;
        }

        .roster-header p { font-size: 0.78rem; color: #9ca3af; margin: 0; font-weight: 300; }

        .roster-capacity-bar {
          padding: 0.875rem 1.5rem;
          border-bottom: 1px solid #e5e2db;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .roster-capacity-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          white-space: nowrap;
        }

        .roster-capacity-track {
          flex: 1;
          height: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
        }

        .roster-capacity-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease, background-color 0.3s ease;
        }

        .roster-capacity-text {
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .roster-count {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.2rem 0.6rem;
          background: rgba(0, 86, 63, 0.1);
          color: #00563f;
          border-radius: 20px;
          border: 1px solid rgba(0, 86, 63, 0.2);
        }

        .roster-table-wrap { overflow-x: auto; }

        .roster-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }

        .roster-table thead th {
          padding: 0.7rem 1.25rem;
          text-align: left;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #ffffff;
          background: #00563f;
          border-bottom: 1px solid #004d38;
        }

        .roster-table thead th.col-actions { text-align: right; background: #003d2a; }

        .roster-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.12s;
        }

        .roster-table tbody tr:hover { background: #fafaf8; }
        .roster-table tbody tr:last-child { border-bottom: none; }

        .roster-table td {
          padding: 0.875rem 1.25rem;
          color: #374151;
          vertical-align: middle;
        }

        .roster-table td.col-name { font-weight: 500; color: #0a1f14; }
        .roster-table td.col-wnumber { font-family: 'DM Mono', 'Courier New', monospace; font-size: 0.82rem; color: #6b7280; }
        .roster-table td.col-email { color: #6b7280; font-size: 0.82rem; }
        .roster-table td.col-actions { text-align: right; }

        .btn-row-delete {
          background: none;
          border: none;
          cursor: pointer;
          color: #d1d5db;
          padding: 0.3rem;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          transition: color 0.15s, background 0.15s;
        }

        .btn-row-delete:hover { color: #dc2626; background: #fef2f2; }

        .roster-add-section {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid #e5e2db;
          background: #fafaf8;
        }

        .roster-add-title {
          font-size: 0.78rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          margin: 0 0 0.875rem 0;
        }

        .roster-add-form {
          display: grid;
          grid-template-columns: 2fr 1fr 2fr auto;
          gap: 0.75rem;
          align-items: center;
        }

        .roster-input {
          padding: 0.65rem 0.875rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          background: #ffffff;
          width: 100%;
          box-sizing: border-box;
        }

        .roster-input:focus {
          border-color: #00563f;
          box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1);
        }

        .roster-input::placeholder { color: #d1d5db; }

        .btn-add-student {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.65rem 1.1rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }

        .btn-add-student:hover { background: #003d2a; }
        .btn-add-student:active { transform: scale(0.98); }

        .roster-empty {
          text-align: center;
          padding: 3rem 2rem;
          color: #9ca3af;
        }

        .roster-empty-icon {
          width: 48px;
          height: 48px;
          background: #f0faf5;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .btn-import {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }

        .btn-import:hover { background: #003d2a; }

        .roster-empty h4 {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          color: #0a1f14;
          margin: 0 0 0.35rem 0;
        }

        .roster-empty p { font-size: 0.82rem; margin: 0; font-weight: 300; }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 3px solid #dc2626;
          border-radius: 6px;
          padding: 0.6rem 0.875rem;
          margin: 0.75rem 1.25rem;
          font-size: 0.82rem;
          color: #991b1b;
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
          font-family: 'Inter', sans-serif;
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
          flex: 1; padding: 0.65rem;
          border: 1.5px solid #e5e7eb; border-radius: 8px;
          background: #ffffff; color: #6b7280;
          font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }

        .delete-btn-cancel:hover { background: #f9fafb; }

        .delete-btn-confirm {
          flex: 1; padding: 0.65rem;
          background: #dc2626; color: #ffffff; border: none; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }

        .delete-btn-confirm:hover { background: #b91c1c; }
      `}</style>

      <div className="roster-root">
        <div className="roster-card">
          <div className="roster-header">
            <div>
              <div className="roster-header-left">
                <Users size={16} color="#00563f" />
                <h3>Student Roster</h3>
              </div>
              <p>Manage students enrolled in this schedule group</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {canEdit && (
                <button className="btn-import" onClick={() => setShowImport(true)}>
                  <Upload size={14} />
                  Import Students
                </button>
              )}
              <span className="roster-count">
                {studentList.length} student{studentList.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {(() => {
            const pct = Math.min((studentList.length / capacity) * 100, 100);
            const barColor = pct >= 100 ? "#dc2626" : pct >= 75 ? "#d97706" : "#00563f";
            const textColor = pct >= 100 ? "#dc2626" : pct >= 75 ? "#92400e" : "#00563f";
            return (
              <div className="roster-capacity-bar">
                <span className="roster-capacity-label">Capacity</span>
                <div className="roster-capacity-track">
                  <div
                    className="roster-capacity-fill"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <span className="roster-capacity-text" style={{ color: textColor }}>
                  {studentList.length}/{capacity}
                </span>
              </div>
            );
          })()}

          {error && <div className="error-banner">{error}</div>}

          <div className="roster-table-wrap">
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Loading...</div>
            ) : studentList.length > 0 ? (
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>W Number</th>
                    <th>Email</th>
                    {canEdit && <th className="col-actions">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {studentList.map((student) => (
                    <tr key={student.id}>
                      <td className="col-name">{student.name}</td>
                      <td className="col-wnumber">{student.wNumber}</td>
                      <td className="col-email">{student.email}</td>
                      {canEdit && (
                        <td className="col-actions">
                          <button
                            className="btn-row-delete"
                            onClick={() => setDeleteConfirm(student.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="roster-empty">
                <div className="roster-empty-icon">
                  <Users size={22} color="#00563f" />
                </div>
                <h4>No Students Yet</h4>
                <p>Add students using the form below</p>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="roster-add-section">
              <p className="roster-add-title">Add Student</p>
              <form onSubmit={handleAddStudent} className="roster-add-form">
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="roster-input"
                  placeholder="Full Name"
                />
                <input
                  type="text"
                  required
                  value={newStudent.wNumber}
                  onChange={(e) => setNewStudent({ ...newStudent, wNumber: e.target.value })}
                  className="roster-input"
                  placeholder="W Number"
                />
                <input
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="roster-input"
                  placeholder="Email Address"
                />
                <button type="submit" className="btn-add-student">
                  <Plus size={14} />
                  Add
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {deleteConfirm != null && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon">
              <Trash2 size={20} color="#dc2626" />
            </div>
            <h3>Remove Student?</h3>
            <p>This will permanently remove the student from this schedule group.</p>
            <div className="delete-box-actions">
              <button className="delete-btn-cancel" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="delete-btn-confirm" onClick={() => handleDeleteStudent(deleteConfirm)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <StudentImportModal
          semesterId={semesterId}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            loadStudents();
          }}
        />
      )}
    </>
  );
}
