import { useState } from "react";
import { X, Copy, Loader2 } from "lucide-react";
import { semesters as semestersApi } from "../Lib/api";
import type { Semester, ClinicalDays } from "../Lib/Types";

interface CloneSemesterModalProps {
  source: Semester;
  onClose: () => void;
  onSuccess: (newSemester: Semester) => void;
}

export function CloneSemesterModal({ source, onClose, onSuccess }: CloneSemesterModalProps) {
  const [formData, setFormData] = useState({
    name: `${source.name} (Copy)`,
    startDate: source.startDate.split("T")[0],
    endDate: source.endDate.split("T")[0],
    clinicalDays: (source.clinicalDays || "Thurs/Fri") as ClinicalDays,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const newSem = await semestersApi.clone(source.id, {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        clinicalDays: formData.clinicalDays,
      });
      onSuccess(newSem);
    } catch (err: any) {
      setError(err.message || "Failed to clone semester");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .clone-overlay {
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
        .clone-box {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .clone-header {
          background: #00563f;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .clone-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.2rem 0;
        }
        .clone-header p {
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
          margin: 0;
          font-weight: 300;
        }
        .clone-close {
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
        .clone-close:hover { background: rgba(255,255,255,0.2); }
        .clone-body { padding: 1.5rem; font-family: 'Inter', sans-serif; }
        .clone-form-group { margin-bottom: 1.1rem; }
        .clone-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.4rem;
        }
        .clone-input {
          width: 100%;
          padding: 0.65rem 0.875rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.88rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
          background: #fafafa;
        }
        .clone-input:focus {
          border-color: #00563f;
          box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1);
          background: #ffffff;
        }
        .clone-date-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .clone-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
          margin-top: 0.5rem;
        }
        .clone-btn-cancel {
          padding: 0.6rem 1.25rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          color: #6b7280;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .clone-btn-cancel:hover { background: #f9fafb; color: #374151; }
        .clone-btn-submit {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1.5rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .clone-btn-submit:hover { background: #003d2a; }
        .clone-btn-submit:disabled { background: #6b7280; cursor: not-allowed; }
        .clone-btn-submit .btn-spinner { animation: clone-spin 0.7s linear infinite; }
        @keyframes clone-spin { to { transform: rotate(360deg); } }
        .clone-error {
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

      <div className="clone-overlay" onClick={onClose}>
        <div className="clone-box" onClick={(e) => e.stopPropagation()}>
          <div className="clone-header">
            <div>
              <h2>
                <Copy size={16} style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
                Clone Semester
              </h2>
              <p>Create a copy of "{source.name}" with all schedule groups and sections</p>
            </div>
            <button className="clone-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className="clone-body">
            {error && <div className="clone-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="clone-form-group">
                <label className="clone-label">New Semester Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="clone-input"
                  placeholder="e.g. Spring 2028"
                />
              </div>

              <div className="clone-date-row clone-form-group">
                <div>
                  <label className="clone-label">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="clone-input"
                  />
                </div>
                <div>
                  <label className="clone-label">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="clone-input"
                  />
                </div>
              </div>

              <div className="clone-form-group">
                <label className="clone-label">Clinical Days</label>
                <select
                  value={formData.clinicalDays}
                  onChange={(e) => setFormData({ ...formData, clinicalDays: e.target.value as ClinicalDays })}
                  className="clone-input"
                >
                  <option value="Thurs/Fri">Thursday / Friday</option>
                  <option value="Tues/Wed">Tuesday / Wednesday</option>
                </select>
              </div>

              <div className="clone-footer">
                <button type="button" className="clone-btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="clone-btn-submit" disabled={loading}>
                  {loading ? <Loader2 size={14} className="btn-spinner" /> : <Copy size={14} />}
                  {loading ? "Cloning..." : "Clone Semester"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
