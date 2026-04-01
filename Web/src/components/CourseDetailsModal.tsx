import { useEffect, useState } from "react";
import type { Course, Section, Room, Instructor, ConflictResult, TermType, CreateSectionDto, DayOfWeekEnum } from "../Lib/Types";
import { timeSlotToTimeSpan } from "../Lib/Types";
import { X, Pencil, AlertTriangle, AlertCircle, Info, Loader2 } from "lucide-react";
import { sections as sectionsApi, rooms as roomsApi, instructors as instructorsApi } from "../Lib/api";
import { useToast } from "../Lib/ToastContext";

interface CourseDetailsModalProps {
  scheduleId: number;
  semesterId: number;
  courseId: number;
  dayOfWeek?: string;
  timeSlot?: string;
  dateRange?: string;
  isSemester5: boolean;
  semesterLevel: number;
  courses: Course[];
  locationDisplay: string | null;
  editSection?: Section;
  onClose: () => void;
  onSuccess: () => void;
}

export function CourseDetailsModal({
  scheduleId,
  semesterId,
  courseId,
  dayOfWeek,
  timeSlot,
  dateRange,
  isSemester5,
  semesterLevel,
  courses,
  locationDisplay,
  editSection,
  onClose,
  onSuccess,
}: CourseDetailsModalProps) {
  const { addToast } = useToast();
  const course = courses.find((c) => c.id === courseId);
  const isEditing = !!editSection;

  //compute initial start/end times
  const getInitialStartTime = () => {
    if (editSection?.startTime) return editSection.startTime;
    if (!isSemester5 && timeSlot) return timeSlotToTimeSpan(timeSlot);
    return "";
  };
  const getInitialEndTime = () => {
    if (editSection?.endTime) return editSection.endTime;
    if (!isSemester5 && timeSlot) {
      const start = timeSlotToTimeSpan(timeSlot);
      const [h, m, s] = start.split(":").map(Number);
      return `${(h + 1).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return "";
  };
  const getInitialDay = () => {
    if (editSection?.dayOfWeek != null) return editSection.dayOfWeek;
    if (dayOfWeek) return dayOfWeek;
    return "";
  };

  const [formData, setFormData] = useState({
    sectionNumber: editSection?.sectionNumber || "01",
    dayOfWeek: getInitialDay(),
    startTime: getInitialStartTime(),
    endTime: getInitialEndTime(),
    dateRange: editSection?.dateRange || dateRange || "",
    notes: editSection?.notes || "",
    roomId: editSection?.roomId ?? null as number | null,
    instructorId: editSection?.instructorId ?? null as number | null,
    term: (editSection?.term || "Full") as TermType,
    termStartDate: editSection?.termStartDate || "",
    termEndDate: editSection?.termEndDate || "",
  });

  const [roomList, setRoomList] = useState<Room[]>([]);
  const [instructorList, setInstructorList] = useState<Instructor[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResult[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [rms, instrs] = await Promise.all([
        roomsApi.getAll(locationDisplay || undefined),
        instructorsApi.getAll(),
      ]);
      setRoomList(rms);
      setInstructorList(instrs);
    } catch {
      //dropdowns are optional
    }
  };

  const hasBlockingConflict = conflicts.some((c) => c.severity === "Error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setConflicts([]);
    setLoading(true);

    try {
      //compute day/time from form
      const parsedDay = formData.dayOfWeek !== "" ? formData.dayOfWeek as DayOfWeekEnum : null;
      const startTimeVal = formData.startTime || null;
      const endTimeVal = formData.endTime || null;

      if (isEditing && editSection) {
        await sectionsApi.update(editSection.id, {

          sectionNumber: formData.sectionNumber,
          dayOfWeek: !isSemester5 ? parsedDay : null,
          startTime: !isSemester5 ? startTimeVal : null,
          endTime: !isSemester5 ? endTimeVal : null,
          notes: formData.notes,
          roomId: formData.roomId,
          instructorId: formData.instructorId,
          dateRange: isSemester5 ? formData.dateRange : editSection.dateRange,
          term: semesterLevel === 4 ? formData.term : null,
          termStartDate: formData.term !== "Full" ? formData.termStartDate : null,
          termEndDate: formData.term !== "Full" ? formData.termEndDate : null,
        });
        addToast("success", "Section updated");
        onSuccess();
        return;
      }

      const dto: CreateSectionDto = {
        sectionNumber: formData.sectionNumber,
        dayOfWeek: !isSemester5 ? parsedDay : null,
        startTime: !isSemester5 ? startTimeVal : null,
        endTime: !isSemester5 ? endTimeVal : null,
        dateRange: isSemester5 ? formData.dateRange : null,
        notes: formData.notes || null,
        term: semesterLevel === 4 ? formData.term : null,
        termStartDate: formData.term !== "Full" ? formData.termStartDate || null : null,
        termEndDate: formData.term !== "Full" ? formData.termEndDate || null : null,
        roomId: formData.roomId,
        instructorId: formData.instructorId,
        courseId,
        semesterId,
        scheduleId,
      };

      const result = await sectionsApi.createOrLink(dto);

      if (result.conflicts && result.conflicts.length > 0) {
        setConflicts(result.conflicts);
        if (result.conflicts.some((c) => c.severity === "Error")) {
          addToast("error", "Section has blocking conflicts");
          return;
        }
        if (result.conflicts.some((c) => c.severity === "Warning")) {
          addToast("warning", "Section added with warnings");
        } else {
          addToast("success", "Section added to schedule");
        }
      } else {
        addToast("success", "Section added to schedule");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save section");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
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
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          font-family: 'Inter', sans-serif;
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

        .cdm-body { padding: 1.5rem; }

        .cdm-form-group { margin-bottom: 1.1rem; }

        .cdm-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.4rem;
        }

        .cdm-required { color: #dc2626; margin-left: 0.2rem; }

        .cdm-input, .cdm-select {
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

        .cdm-input:focus, .cdm-select:focus {
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
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .cdm-btn-cancel:hover { background: #f9fafb; color: #374151; }

        .cdm-btn-submit {
          padding: 0.6rem 1.5rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }

        .cdm-btn-submit:hover { background: #003d2a; }
        .cdm-btn-submit:active { transform: scale(0.98); }
        .cdm-btn-submit:disabled { background: #6b7280; cursor: not-allowed; }
        .cdm-btn-submit .btn-spinner { animation: cdm-spin 0.7s linear infinite; }
        @keyframes cdm-spin { to { transform: rotate(360deg); } }

        .cdm-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 3px solid #dc2626;
          border-radius: 6px;
          padding: 0.6rem 0.875rem;
          margin-bottom: 1rem;
          font-size: 0.82rem;
          color: #991b1b;
        }

        .cdm-conflict {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin-bottom: 0.75rem;
          font-size: 0.82rem;
          line-height: 1.5;
        }

        .cdm-conflict-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .cdm-conflict-warning {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
        }

        .cdm-conflict-info {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        }

        .cdm-term-radios {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .cdm-term-radio {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: #374151;
          cursor: pointer;
        }

        .cdm-term-dates {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
      `}</style>

      <div className="cdm-overlay" onClick={onClose}>
        <div className="cdm-box" onClick={(e) => e.stopPropagation()}>
          <div className="cdm-header">
            <div className="cdm-header-info">
              <h2>
                {isEditing ? (
                  <>
                    <Pencil size={14} style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
                    Edit Section
                  </>
                ) : (
                  "Add to Schedule"
                )}
              </h2>
              <p>
                {course?.code} — {course?.name}
                {!isSemester5 && dayOfWeek && timeSlot && ` · ${dayOfWeek} at ${timeSlot}`}
                {isEditing && editSection && ` · Section ${editSection.sectionNumber}`}
              </p>
            </div>
            <button className="cdm-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className="cdm-body">
            {error && <div className="cdm-error">{error}</div>}

            {conflicts.map((c, i) => (
              <div
                key={i}
                className={`cdm-conflict ${
                  c.severity === "Error" ? "cdm-conflict-error" :
                  c.severity === "Warning" ? "cdm-conflict-warning" :
                  "cdm-conflict-info"
                }`}
              >
                {c.severity === "Error" && <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
                {c.severity === "Warning" && <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
                {c.severity === "Info" && <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
                <div>
                  <strong>{c.message}</strong>
                  {c.details && <div>{c.details}</div>}
                </div>
              </div>
            ))}

            <form onSubmit={handleSubmit}>
              <div className="cdm-form-group">
                <label className="cdm-label">
                  Section Number <span className="cdm-required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.sectionNumber}
                  onChange={(e) => setFormData({ ...formData, sectionNumber: e.target.value })}
                  className="cdm-input"
                  placeholder="01"
                />
              </div>

              {isSemester5 ? (
                <div className="cdm-form-group">
                  <label className="cdm-label">
                    Date Range <span className="cdm-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dateRange}
                    onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })}
                    className="cdm-input"
                    placeholder="Jan 13 - Feb 9"
                  />
                </div>
              ) : (
                <>
                  <div className="cdm-form-group">
                    <label className="cdm-label">Day of Week <span className="cdm-required">*</span></label>
                    <select
                      required
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                      className="cdm-select"
                    >
                      <option value="">Select day</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div className="cdm-form-group">
                      <label className="cdm-label">Start Time <span className="cdm-required">*</span></label>
                      <input
                        type="time"
                        required
                        value={formData.startTime ? formData.startTime.substring(0, 5) : ""}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value + ":00" })}
                        className="cdm-input"
                      />
                    </div>
                    <div className="cdm-form-group">
                      <label className="cdm-label">End Time <span className="cdm-required">*</span></label>
                      <input
                        type="time"
                        required
                        value={formData.endTime ? formData.endTime.substring(0, 5) : ""}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value + ":00" })}
                        className="cdm-input"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="cdm-form-group">
                <label className="cdm-label">Room</label>
                <select
                  value={formData.roomId ?? ""}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value ? parseInt(e.target.value) : null })}
                  className="cdm-select"
                >
                  <option value="">No room selected</option>
                  {roomList.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.building} {room.roomNumber} ({room.capacity} seats, {room.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="cdm-form-group">
                <label className="cdm-label">Instructor</label>
                <select
                  value={formData.instructorId ?? ""}
                  onChange={(e) => setFormData({ ...formData, instructorId: e.target.value ? parseInt(e.target.value) : null })}
                  className="cdm-select"
                >
                  <option value="">No instructor selected</option>
                  {instructorList.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.type})
                    </option>
                  ))}
                </select>
              </div>

              {semesterLevel === 4 && (
                <div className="cdm-form-group">
                  <label className="cdm-label">Term</label>
                  <div className="cdm-term-radios">
                    {(["Full", "Term1", "Term2"] as TermType[]).map((t) => (
                      <label key={t} className="cdm-term-radio">
                        <input
                          type="radio"
                          name="term"
                          checked={formData.term === t}
                          onChange={() => setFormData({ ...formData, term: t })}
                        />
                        {t === "Full" ? "Full Semester" : t === "Term1" ? "Term 1" : "Term 2"}
                      </label>
                    ))}
                  </div>
                  {formData.term !== "Full" && (
                    <div className="cdm-term-dates">
                      <div>
                        <label className="cdm-label">Term Start</label>
                        <input
                          type="date"
                          value={formData.termStartDate}
                          onChange={(e) => setFormData({ ...formData, termStartDate: e.target.value })}
                          className="cdm-input"
                        />
                      </div>
                      <div>
                        <label className="cdm-label">Term End</label>
                        <input
                          type="date"
                          value={formData.termEndDate}
                          onChange={(e) => setFormData({ ...formData, termEndDate: e.target.value })}
                          className="cdm-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="cdm-form-group">
                <label className="cdm-label">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="cdm-input"
                  placeholder="Optional notes"
                />
              </div>

              <div className="cdm-footer">
                <button type="button" className="cdm-btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cdm-btn-submit"
                  disabled={loading || hasBlockingConflict}
                >
                  {loading && <Loader2 size={14} className="btn-spinner" />}
                  {loading ? "Saving..." : isEditing ? "Save Changes" : "Add to Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
