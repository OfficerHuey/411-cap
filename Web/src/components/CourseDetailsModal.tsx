import { useEffect, useState } from "react";
import type { Course, CourseSection, ScheduleSection } from "../Lib/Types";
import { X, AlertCircle, Link2 } from "lucide-react";
import { dataStore } from "../Lib/Store";

interface CourseDetailsModalProps {
  scheduleGroupId: string;
  courseId: string;
  dayOfWeek?: string;
  timeSlot?: string;
  dateRange?: string;
  isSemester5: boolean;
  courses: Course[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CourseDetailsModal({
  scheduleGroupId,
  courseId,
  dayOfWeek,
  timeSlot,
  dateRange,
  isSemester5,
  courses,
  onClose,
  onSuccess,
}: CourseDetailsModalProps) {
  const course = courses.find((c) => c.id === courseId);
  const [formData, setFormData] = useState({
    sectionNumber: "01",
    classroom: "",
    notes: "",
    dateRange: dateRange || "",
  });

  const [existingSection, setExistingSection] = useState<CourseSection | null>(
    null,
  );
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);

  useEffect(() => {
    if (formData.sectionNumber && course) {
      const existing = dataStore.findCourseSection(
        courseId,
        formData.sectionNumber,
      );
      if (existing) {
        setExistingSection(existing);
        setShowLinkPrompt(true);
      } else {
        setExistingSection(null);
        setShowLinkPrompt(false);
      }
    }
  }, [formData.sectionNumber, courseId, course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let courseSectionId: string;

    if (existingSection) {
      courseSectionId = existingSection.id;
    } else {
      const newCourseSection: CourseSection = {
        id: `cs-${Date.now()}`,
        courseId,
        sectionNumber: formData.sectionNumber,
        dayOfWeek: isSemester5 ? undefined : dayOfWeek,
        timeSlot: isSemester5 ? undefined : timeSlot,
        dateRange: isSemester5 ? formData.dateRange : undefined,
        notes: formData.notes,
        classroom: formData.classroom,
        isShared: false,
      };
      dataStore.addCourseSection(newCourseSection);
      courseSectionId = newCourseSection.id;
    }

    const scheduleSection: ScheduleSection = {
      id: `ss-${Date.now()}`,
      scheduleGroupId,
      courseSectionId,
    };
    dataStore.addScheduleSection(scheduleSection);

    if (existingSection) {
      dataStore.updateCourseSection(existingSection.id, { isShared: true });
    }

    onSuccess();
  };

  const handleLinkToExisting = () => {
    if (!existingSection) return;
    const scheduleSection: ScheduleSection = {
      id: `ss-${Date.now()}`,
      scheduleGroupId,
      courseSectionId: existingSection.id,
    };
    dataStore.addScheduleSection(scheduleSection);
    dataStore.updateCourseSection(existingSection.id, { isShared: true });
    onSuccess();
  };

  const handleCreateNew = () => {
    setShowLinkPrompt(false);
    setExistingSection(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .cdm-overlay {
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

        .cdm-box {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .cdm-header {
          background: #00563f;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .cdm-header-info h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.2rem 0;
        }

        .cdm-header-info p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.65);
          margin: 0;
          font-weight: 300;
        }

        .cdm-close {
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

        .cdm-close:hover { background: rgba(255,255,255,0.2); }

        .cdm-body {
          padding: 1.5rem;
        }

        .cdm-form-group {
          margin-bottom: 1.1rem;
        }

        .cdm-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.4rem;
        }

        .cdm-required {
          color: #dc2626;
          margin-left: 0.2rem;
        }

        .cdm-input {
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

        .cdm-input:focus {
          border-color: #00563f;
          box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1);
          background: #ffffff;
        }

        .cdm-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
          margin-top: 0.5rem;
        }

        .cdm-btn-cancel {
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

        .cdm-btn-cancel:hover {
          background: #f9fafb;
          color: #374151;
        }

        .cdm-btn-submit {
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

        .cdm-btn-submit:hover { background: #003d2a; }
        .cdm-btn-submit:active { transform: scale(0.98); }

        /* Link prompt */
        .cdm-alert {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-left: 3px solid #f59e0b;
          border-radius: 8px;
          padding: 0.875rem 1rem;
          margin-bottom: 1.25rem;
        }

        .cdm-alert-text h3 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #92400e;
          margin: 0 0 0.25rem 0;
        }

        .cdm-alert-text p {
          font-size: 0.8rem;
          color: #92400e;
          margin: 0 0 0.2rem 0;
          line-height: 1.5;
        }

        .cdm-link-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .cdm-btn-link {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.65rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .cdm-btn-link:hover { background: #003d2a; }

        .cdm-btn-new {
          width: 100%;
          padding: 0.65rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          color: #374151;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .cdm-btn-new:hover { background: #f9fafb; }

        .cdm-btn-text {
          width: 100%;
          padding: 0.5rem;
          background: none;
          border: none;
          color: #9ca3af;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          cursor: pointer;
          transition: color 0.15s;
        }

        .cdm-btn-text:hover { color: #374151; }
      `}</style>

      <div className="cdm-overlay" onClick={onClose}>
        <div className="cdm-box" onClick={(e) => e.stopPropagation()}>
          <div className="cdm-header">
            <div className="cdm-header-info">
              <h2>Add to Schedule</h2>
              <p>
                {course?.code} — {course?.name}
                {!isSemester5 &&
                  dayOfWeek &&
                  timeSlot &&
                  ` · ${dayOfWeek} at ${timeSlot}`}
              </p>
            </div>
            <button className="cdm-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className="cdm-body">
            {showLinkPrompt && existingSection ? (
              <>
                <div className="cdm-alert">
                  <AlertCircle
                    size={16}
                    color="#f59e0b"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <div className="cdm-alert-text">
                    <h3>Section Already Exists</h3>
                    <p>
                      {course?.code}-{formData.sectionNumber} already exists at{" "}
                      {existingSection.dayOfWeek}{" "}
                      {existingSection.timeSlot || existingSection.dateRange}.
                    </p>
                    <p>Link to the existing section or create a new one?</p>
                  </div>
                </div>
                <div className="cdm-link-actions">
                  <button
                    className="cdm-btn-link"
                    onClick={handleLinkToExisting}
                  >
                    <Link2 size={14} />
                    Link to Existing Section
                  </button>
                  <button className="cdm-btn-new" onClick={handleCreateNew}>
                    Create New Section
                  </button>
                  <button className="cdm-btn-text" onClick={onClose}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="cdm-form-group">
                  <label className="cdm-label">
                    Section Number <span className="cdm-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sectionNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sectionNumber: e.target.value,
                      })
                    }
                    className="cdm-input"
                    placeholder="01"
                  />
                </div>

                {isSemester5 && (
                  <div className="cdm-form-group">
                    <label className="cdm-label">
                      Date Range <span className="cdm-required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.dateRange}
                      onChange={(e) =>
                        setFormData({ ...formData, dateRange: e.target.value })
                      }
                      className="cdm-input"
                      placeholder="Jan 13 - Feb 9"
                    />
                  </div>
                )}

                <div className="cdm-form-group">
                  <label className="cdm-label">Classroom</label>
                  <input
                    type="text"
                    value={formData.classroom}
                    onChange={(e) =>
                      setFormData({ ...formData, classroom: e.target.value })
                    }
                    className="cdm-input"
                    placeholder="e.g. Sim Lab"
                  />
                </div>

                <div className="cdm-form-group">
                  <label className="cdm-label">Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="cdm-input"
                    placeholder="Optional notes"
                  />
                </div>

                <div className="cdm-footer">
                  <button
                    type="button"
                    className="cdm-btn-cancel"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cdm-btn-submit">
                    Add to Schedule
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
