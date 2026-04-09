import { useEffect, useState } from "react";
import type { Course, Section, Room, Instructor, ConflictResult, TermType, CreateSectionDto, DayOfWeekEnum } from "../Lib/Types";
import { timeSlotToTimeSpan } from "../Lib/Types";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { sections as sectionsApi, rooms as roomsApi, instructors as instructorsApi } from "../Lib/api";
import { useToast } from "../Lib/ToastContext";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";

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

  const dayOptions = [
    { value: "", label: "Select day" },
    { value: "Monday", label: "Monday" },
    { value: "Tuesday", label: "Tuesday" },
    { value: "Wednesday", label: "Wednesday" },
    { value: "Thursday", label: "Thursday" },
    { value: "Friday", label: "Friday" },
  ];

  const roomOptions = [
    { value: "", label: "No room selected" },
    ...roomList.map((room) => ({
      value: String(room.id),
      label: `${room.building} ${room.roomNumber} (${room.capacity} seats, ${room.type})`,
    })),
  ];

  const instructorOptions = [
    { value: "", label: "No instructor selected" },
    ...instructorList.map((inst) => ({
      value: String(inst.id),
      label: `${inst.name} (${inst.type})`,
    })),
  ];

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

  const modalTitle = isEditing
    ? `Edit Section`
    : `Add ${course?.code ?? ""} to Calendar`;

  const modalSubtitle = isEditing
    ? `${course?.code} \u2014 ${course?.name} \u00b7 Section ${editSection?.sectionNumber}`
    : `${course?.code} \u2014 ${course?.name}${!isSemester5 && dayOfWeek && timeSlot ? ` \u00b7 ${dayOfWeek} at ${timeSlot}` : ""}`;

  return (
    <Modal
      open
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      number="02"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={loading}
            disabled={hasBlockingConflict}
            onClick={(e) => handleSubmit(e as any)}
          >
            {loading ? "Saving\u2026" : isEditing ? "Save Changes" : "Add to Schedule"}
          </Button>
        </>
      }
    >
      {error && (
        <div style={{
          background: "rgba(153,27,27,0.06)",
          border: "1px solid rgba(153,27,27,0.2)",
          borderLeft: "3px solid var(--error)",
          borderRadius: "6px",
          padding: "0.6rem 0.875rem",
          marginBottom: "1rem",
          fontFamily: "var(--font-body)",
          fontSize: "0.82rem",
          color: "#991b1b",
        }}>
          {error}
        </div>
      )}

      {conflicts.map((c, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            marginBottom: "0.75rem",
            fontSize: "0.82rem",
            lineHeight: 1.5,
            background: c.severity === "Error" ? "rgba(153,27,27,0.06)" : c.severity === "Warning" ? "#fffbeb" : "#eff6ff",
            border: `1px solid ${c.severity === "Error" ? "rgba(153,27,27,0.2)" : c.severity === "Warning" ? "#fde68a" : "#bfdbfe"}`,
            color: c.severity === "Error" ? "#991b1b" : c.severity === "Warning" ? "#92400e" : "#1e40af",
          }}
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

      <form onSubmit={handleSubmit} id="course-details-form">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <Input
            label="Section Number"
            type="text"
            required
            value={formData.sectionNumber}
            onChange={(e) => setFormData({ ...formData, sectionNumber: e.target.value })}
            placeholder="01"
            fullWidth
          />

          {isSemester5 ? (
            <Input
              label="Date Range"
              type="text"
              required
              value={formData.dateRange}
              onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })}
              placeholder="Jan 13 - Feb 9"
              fullWidth
            />
          ) : (
            <>
              <Select
                label="Day of Week"
                options={dayOptions}
                value={formData.dayOfWeek}
                onChange={(v) => setFormData({ ...formData, dayOfWeek: v })}
                fullWidth
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Input
                  label="Start Time"
                  type="time"
                  required
                  value={formData.startTime ? formData.startTime.substring(0, 5) : ""}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value + ":00" })}
                  fullWidth
                />
                <Input
                  label="End Time"
                  type="time"
                  required
                  value={formData.endTime ? formData.endTime.substring(0, 5) : ""}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value + ":00" })}
                  fullWidth
                />
              </div>
            </>
          )}

          <Select
            label="Room"
            options={roomOptions}
            value={formData.roomId != null ? String(formData.roomId) : ""}
            onChange={(v) => setFormData({ ...formData, roomId: v ? parseInt(v) : null })}
            fullWidth
          />

          <Select
            label="Instructor"
            options={instructorOptions}
            value={formData.instructorId != null ? String(formData.instructorId) : ""}
            onChange={(v) => setFormData({ ...formData, instructorId: v ? parseInt(v) : null })}
            fullWidth
          />

          {semesterLevel === 4 && (
            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "var(--text-muted)",
                marginBottom: "0.5rem",
              }}>
                Term
              </label>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                {(["Full", "Term1", "Term2"] as TermType[]).map((t) => (
                  <label key={t} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <Input
                    label="Term Start"
                    type="date"
                    value={formData.termStartDate}
                    onChange={(e) => setFormData({ ...formData, termStartDate: e.target.value })}
                    fullWidth
                  />
                  <Input
                    label="Term End"
                    type="date"
                    value={formData.termEndDate}
                    onChange={(e) => setFormData({ ...formData, termEndDate: e.target.value })}
                    fullWidth
                  />
                </div>
              )}
            </div>
          )}

          <Input
            label="Notes"
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optional notes"
            fullWidth
          />
        </div>
      </form>
    </Modal>
  );
}
