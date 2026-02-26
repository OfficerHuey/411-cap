import "../App.css";
import { X } from "lucide-react";
import { dataStore } from "../Lib/Store";
import type { ClinicalDays, Semester } from "../Lib/Types";
import { useState } from "react";

interface CreateSemesterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSemesterModal({
  onClose,
  onSuccess,
}: CreateSemesterModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    clinicalDays: "Thurs/Fri" as ClinicalDays,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSemester: Semester = {
      id: `sem-${Date.now()}`,
      ...formData,
    };
    dataStore.addSemester(newSemester);
    onSuccess();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 50;
          backdrop-filter: blur(2px);
        }

        .modal-box {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          overflow: hidden;
        }

        .modal-header {
          background: #00563f;
          padding: 1.5rem 1.75rem;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .modal-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.25rem 0;
        }

        .modal-header p {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.6);
          margin: 0;
          font-weight: 300;
        }

        .modal-close {
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

        .modal-close:hover {
          background: rgba(255,255,255,0.2);
        }

        .modal-body {
          padding: 1.75rem;
          font-family: 'DM Sans', sans-serif;
        }

        .modal-form-group {
          margin-bottom: 1.25rem;
        }

        .modal-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.5rem;
        }

        .modal-input {
          width: 100%;
          padding: 0.7rem 0.875rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
          background: #fafafa;
        }

        .modal-input:focus {
          border-color: #00563f;
          box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1);
          background: #ffffff;
        }

        .modal-date-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
          margin-top: 0.5rem;
        }

        .btn-modal-cancel {
          padding: 0.65rem 1.25rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          color: #6b7280;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }

        .btn-modal-cancel:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        .btn-modal-submit {
          padding: 0.65rem 1.5rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }

        .btn-modal-submit:hover { background: #003d2a; }
        .btn-modal-submit:active { transform: scale(0.98); }
      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>Create New Semester</h2>
              <p>Add a new semester to the scheduling system</p>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="modal-form-group">
                <label className="modal-label">Semester Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="modal-input"
                  placeholder="e.g. Fall 2027"
                />
              </div>

              <div className="modal-date-row modal-form-group">
                <div>
                  <label className="modal-label">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="modal-input"
                  />
                </div>
                <div>
                  <label className="modal-label">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="modal-input"
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Clinical Days</label>
                <select
                  value={formData.clinicalDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      clinicalDays: e.target.value as ClinicalDays,
                    })
                  }
                  className="modal-input"
                >
                  <option value="Thurs/Fri">Thursday / Friday</option>
                  <option value="Tues/Wed">Tuesday / Wednesday</option>
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Create Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
