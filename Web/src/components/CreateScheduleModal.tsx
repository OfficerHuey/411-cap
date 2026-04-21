import { useState } from "react";
import type { SemesterLevel } from "../Lib/Types";
import { levelToNumber } from "../Lib/Types";
import { Plus, Trash2, Users, ChevronDown } from "lucide-react";
import { schedules as schedulesApi, students as studentsApi } from "../Lib/api";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { HairlineRule } from "./ui/HairlineRule";

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
    <Modal
      open
      onClose={onClose}
      title="Add Schedule Group"
      subtitle={`Create a new schedule for ${level}`}
      number="01"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={loading}
            onClick={(e) => handleSubmit(e as any)}
          >
            {loading ? "Creating\u2026" : "Create Schedule"}
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
          fontSize: "var(--text-sm)",
          color: "#991b1b",
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} id="create-schedule-form">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Input
            label="Schedule Name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Schedule D"
            fullWidth
          />
          <Input
            label="Location"
            type="text"
            required
            value={formData.locationDisplay}
            onChange={(e) => setFormData({ ...formData, locationDisplay: e.target.value })}
            placeholder="e.g. Hammond"
            fullWidth
          />

          <HairlineRule color="muted" spacing="normal" />

          {/* ── students section ── */}
          <button
            type="button"
            onClick={() => setShowStudentSection(!showStudentSection)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              background: "var(--paper-base)",
              border: "1px solid var(--cream-300)",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "var(--text-secondary)",
              transition: "background 150ms",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={14} />
              Add Students (Optional)
              {validStudents > 0 && (
                <span style={{
                  fontSize: "0.72rem",
                  background: "rgba(26, 86, 50, 0.1)",
                  color: "var(--green-700)",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "20px",
                  fontWeight: 500,
                }}>
                  {validStudents} ready
                </span>
              )}
            </span>
            <ChevronDown
              size={14}
              style={{
                transform: showStudentSection ? "rotate(180deg)" : "none",
                transition: "transform 200ms ease",
              }}
            />
          </button>

          {showStudentSection && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {students.map((student) => (
                <div
                  key={student.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 2fr auto",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <Input
                    type="text"
                    value={student.name}
                    onChange={(e) => updateStudent(student.id, "name", e.target.value)}
                    placeholder="Full Name"
                  />
                  <Input
                    type="text"
                    value={student.wNumber}
                    onChange={(e) => updateStudent(student.id, "wNumber", e.target.value)}
                    placeholder="W Number"
                  />
                  <Input
                    type="email"
                    value={student.email}
                    onChange={(e) => updateStudent(student.id, "email", e.target.value)}
                    placeholder="Email"
                  />
                  <button
                    type="button"
                    onClick={() => removeStudent(student.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--cream-400)",
                      padding: "0.3rem",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      transition: "color 150ms",
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--error)"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--cream-400)"; }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<Plus size={13} />}
                onClick={addStudentRow}
                type="button"
              >
                Add Student
              </Button>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
