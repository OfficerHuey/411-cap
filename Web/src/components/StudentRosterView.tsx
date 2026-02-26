import { useEffect, useState } from "react";
import "../App.css";
import { Trash2, Plus, Users } from "lucide-react";
import { authService } from "../Lib/Auth";
import { dataStore } from "../Lib/Store";
import type { StudentRoster } from "../Lib/Types";

interface StudentRosterViewProps {
  scheduleGroupId: string;
}

export function StudentRosterView({ scheduleGroupId }: StudentRosterViewProps) {
  const [students, setStudents] = useState<StudentRoster[]>([]);
  const [newStudent, setNewStudent] = useState({
    name: "",
    wNumber: "",
    email: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const canEdit = authService.canEdit();

  useEffect(() => {
    loadStudents();
  }, [scheduleGroupId]);

  const loadStudents = () => {
    setStudents(dataStore.getStudentRoster(scheduleGroupId));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const student: StudentRoster = {
      id: `sr-${Date.now()}`,
      scheduleGroupId,
      ...newStudent,
    };
    dataStore.addStudent(student);
    setNewStudent({ name: "", wNumber: "", email: "" });
    loadStudents();
  };

  const handleDeleteStudent = (id: string) => {
    dataStore.deleteStudent(id);
    setDeleteConfirm(null);
    loadStudents();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .roster-root {
          font-family: 'DM Sans', sans-serif;
        }

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

        .roster-header-left {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .roster-header h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0;
        }

        .roster-header p {
          font-size: 0.78rem;
          color: #9ca3af;
          margin: 0;
          font-weight: 300;
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

        /* Table */
        .roster-table-wrap {
          overflow-x: auto;
        }

        .roster-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

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

        .roster-table thead th.col-actions {
          text-align: right;
          background: #003d2a;
        }

        .roster-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.12s;
        }

        .roster-table tbody tr:hover {
          background: #fafaf8;
        }

        .roster-table tbody tr:last-child {
          border-bottom: none;
        }

        .roster-table td {
          padding: 0.875rem 1.25rem;
          color: #374151;
          vertical-align: middle;
        }

        .roster-table td.col-name {
          font-weight: 500;
          color: #0a1f14;
        }

        .roster-table td.col-wnumber {
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 0.82rem;
          color: #6b7280;
        }

        .roster-table td.col-email {
          color: #6b7280;
          font-size: 0.82rem;
        }

        .roster-table td.col-actions {
          text-align: right;
        }

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

        .btn-row-delete:hover {
          color: #dc2626;
          background: #fef2f2;
        }

        /* Add student form */
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
          font-family: 'DM Sans', sans-serif;
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
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }

        .btn-add-student:hover { background: #003d2a; }
        .btn-add-student:active { transform: scale(0.98); }

        /* Empty state */
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

        .roster-empty h4 {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          color: #0a1f14;
          margin: 0 0 0.35rem 0;
        }

        .roster-empty p {
          font-size: 0.82rem;
          margin: 0;
          font-weight: 300;
        }

        /* Delete confirm */
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

        .delete-box-actions {
          display: flex;
          gap: 0.75rem;
        }

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
            <span className="roster-count">
              {students.length} student{students.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="roster-table-wrap">
            {students.length > 0 ? (
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
                  {students.map((student) => (
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
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  className="roster-input"
                  placeholder="Full Name"
                />
                <input
                  type="text"
                  required
                  value={newStudent.wNumber}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, wNumber: e.target.value })
                  }
                  className="roster-input"
                  placeholder="W Number"
                />
                <input
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, email: e.target.value })
                  }
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

      {deleteConfirm && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon">
              <Trash2 size={20} color="#dc2626" />
            </div>
            <h3>Remove Student?</h3>
            <p>
              This will permanently remove the student from this schedule group.
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
                onClick={() => handleDeleteStudent(deleteConfirm)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
