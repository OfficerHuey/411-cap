import { useState } from "react";
import type { SemesterLevel } from "../Lib/Types";
import { levelToNumber } from "../Lib/Types";
import { Plus, Trash2, X, Users, ChevronDown, ChevronUp } from "lucide-react";
import { schedules as schedulesApi, students as studentsApi } from "../Lib/api";

interface CreateScheduleModalProps {
  semesterId: number;
  level: SemesterLevel;
  onClose: () => void;
  onSuccess: () => void;
}

interface StudentInput {
  id: string;
  name: string;
  wNumber: string;
  email: string;
}

export function CreateScheduleModal({
  semesterId,
  level,
  onClose,
  onSuccess,
}: CreateScheduleModalProps) {
  const [formData, setFormData] = useState({ name: "", locationDisplay: "" });
  const [students, setStudents] = useState<StudentInput[]>([]);
  const [showStudentSection, setShowStudentSection] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addStudentRow = () => {
    setStudents([
      ...students,
      { id: `temp-${Date.now()}`, name: "", wNumber: "", email: "" },
    ]);
  };

  const updateStudent = (
    id: string,
    field: keyof StudentInput,
    value: string,
  ) => {
    setStudents(
      students.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const removeStudent = (id: string) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const schedule = await schedulesApi.create({
        name: formData.name,
        semesterLevel: levelToNumber(level),
        locationDisplay: formData.locationDisplay || null,
        semesterId,
      });
      //add students if any
      const validStudents = students.filter(
        (s) => s.name && s.wNumber && s.email,
      );
      for (const student of validStudents) {
        await studentsApi.create({
          name: student.name,
          wNumber: student.wNumber,
          email: student.email,
          scheduleId: schedule.id,
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create schedule");
    } finally {
      setLoading(false);
    }
  };

  const validStudents = students.filter(
    (s) => s.name && s.wNumber && s.email,
  ).length;

  return (
    <>
      <style>{`
        .csm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 9999;
          backdrop-filter: blur(2px);
        }

        .csm-box {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          font-family: 'DM Sans', sans-serif;
        }

        .csm-header {
          background: #00563f;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .csm-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.2rem 0;
        }

        .csm-header p {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.6);
          margin: 0;
          font-weight: 300;
        }

        .csm-close {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          color: #ffffff;
          cursor: pointer;
          padding: 0.3rem;
          display: flex;
          align-items: center;
          transition: background 0.15s;
          flex-shrink: 0;
          margin-left: 1rem;
        }

        .csm-close:hover { background: rgba(255,255,255,0.2); }

        .csm-body { padding: 1.5rem; }

        .csm-form-group { margin-bottom: 1.1rem; }

        .csm-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.4rem;
        }

        .csm-required { color: #dc2626; margin-left: 0.2rem; }

        .csm-input {
          width: 100%;
          padding: 0.65rem 0.875rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
          background: #fafafa;
        }

        .csm-input:focus {
          border-color: #00563f;
          box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1);
          background: #ffffff;
        }

        .csm-input::placeholder { color: #d1d5db; }

        .csm-divider {
          border: none;
          border-top: 1px solid #e5e2db;
          margin: 1.25rem 0;
        }

        .csm-students-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #fafaf8;
          border: 1px solid #e5e2db;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: #374151;
          transition: background 0.15s;
          margin-bottom: 1rem;
        }

        .csm-students-toggle:hover { background: #f0faf5; }

        .csm-students-toggle-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .csm-student-count {
          font-size: 0.72rem;
          background: rgba(0, 86, 63, 0.1);
          color: #00563f;
          padding: 0.15rem 0.5rem;
          border-radius: 20px;
          font-weight: 500;
        }

        .csm-student-row {
          display: grid;
          grid-template-columns: 2fr 1fr 2fr auto;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .csm-student-input {
          padding: 0.55rem 0.75rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          background: #fafafa;
          width: 100%;
          box-sizing: border-box;
        }

        .csm-student-input:focus {
          border-color: #00563f;
          box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1);
          background: #ffffff;
        }

        .csm-student-input::placeholder { color: #d1d5db; }

        .csm-btn-remove-student {
          background: none;
          border: none;
          cursor: pointer;
          color: #d1d5db;
          padding: 0.3rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s, background 0.15s;
        }

        .csm-btn-remove-student:hover { color: #dc2626; background: #fef2f2; }

        .csm-btn-add-student {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.875rem;
          background: #f0faf5;
          color: #00563f;
          border: 1px solid #c6e8d8;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
          margin-top: 0.25rem;
        }

        .csm-btn-add-student:hover { background: #00563f; color: #ffffff; border-color: #00563f; }

        .csm-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
          margin-top: 1rem;
        }

        .csm-btn-cancel {
          padding: 0.6rem 1.25rem;
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

        .csm-btn-cancel:hover { background: #f9fafb; color: #374151; }

        .csm-btn-submit {
          padding: 0.6rem 1.5rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }

        .csm-btn-submit:hover { background: #003d2a; }
        .csm-btn-submit:active { transform: scale(0.98); }
        .csm-btn-submit:disabled { background: #6b7280; cursor: not-allowed; }

        .csm-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 3px solid #dc2626;
          border-radius: 6px;
          padding: 0.6rem 0.875rem;
          margin-bottom: 1rem;
          font-size: 0.82rem;
          color: #991b1b;
        }
      `}</style>

      <div className="csm-overlay" onClick={onClose}>
        <div className="csm-box" onClick={(e) => e.stopPropagation()}>
          <div className="csm-header">
            <div>
              <h2>Add Schedule Group</h2>
              <p>Create a new schedule for {level}</p>
            </div>
            <button className="csm-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className="csm-body">
            {error && <div className="csm-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="csm-form-group">
                <label className="csm-label">
                  Schedule Name <span className="csm-required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="csm-input"
                  placeholder="e.g. Schedule D"
                />
              </div>

              <div className="csm-form-group">
                <label className="csm-label">
                  Location <span className="csm-required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.locationDisplay}
                  onChange={(e) =>
                    setFormData({ ...formData, locationDisplay: e.target.value })
                  }
                  className="csm-input"
                  placeholder="e.g. Hammond"
                />
              </div>

              <hr className="csm-divider" />

              <button
                type="button"
                className="csm-students-toggle"
                onClick={() => setShowStudentSection(!showStudentSection)}
              >
                <span className="csm-students-toggle-left">
                  <Users size={14} color="#6b7280" />
                  Add Students (Optional)
                  {validStudents > 0 && (
                    <span className="csm-student-count">
                      {validStudents} ready
                    </span>
                  )}
                </span>
                {showStudentSection ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              {showStudentSection && (
                <div>
                  {students.map((student) => (
                    <div key={student.id} className="csm-student-row">
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) =>
                          updateStudent(student.id, "name", e.target.value)
                        }
                        className="csm-student-input"
                        placeholder="Full Name"
                      />
                      <input
                        type="text"
                        value={student.wNumber}
                        onChange={(e) =>
                          updateStudent(student.id, "wNumber", e.target.value)
                        }
                        className="csm-student-input"
                        placeholder="W Number"
                      />
                      <input
                        type="email"
                        value={student.email}
                        onChange={(e) =>
                          updateStudent(student.id, "email", e.target.value)
                        }
                        className="csm-student-input"
                        placeholder="Email"
                      />
                      <button
                        type="button"
                        className="csm-btn-remove-student"
                        onClick={() => removeStudent(student.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="csm-btn-add-student"
                    onClick={addStudentRow}
                  >
                    <Plus size={13} />
                    Add Student
                  </button>
                </div>
              )}

              <div className="csm-footer">
                <button
                  type="button"
                  className="csm-btn-cancel"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="csm-btn-submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
