import { useEffect, useState } from "react";
import { Trash2, Plus, Users, Upload } from "lucide-react";
import { authService } from "../Lib/Auth";
import { students as studentsApi } from "../Lib/api";
import type { Student } from "../Lib/Types";
import { StudentImportModal } from "./StudentImportModal";
import { useToast } from "../Lib/ToastContext";
import { Card } from "./ui/Card";
import { NumberBadge } from "./ui/NumberBadge";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Avatar } from "./ui/Avatar";
import { EmptyState } from "./ui/EmptyState";
import { Modal } from "./ui/Modal";
import { Skeleton } from "./ui/Skeleton";
import { StudentDetailPanel } from "./StudentDetailPanel";
import styles from "./StudentRosterView.module.css";

interface StudentRosterViewProps {
  scheduleId: number;
  semesterId: number;
  isLocked?: boolean;
  capacity?: number;
}

interface OverrideState {
  pendingStudent: { name: string; wNumber: string; email: string };
  currentCount: number;
  capacity: number;
}

export function StudentRosterView({ scheduleId, semesterId, isLocked, capacity = 8 }: StudentRosterViewProps) {
  const { addToast } = useToast();
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [newStudent, setNewStudent] = useState({ name: "", wNumber: "", email: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //override confirmation state
  const [overrideState, setOverrideState] = useState<OverrideState | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  //student detail panel
  const [detailStudentId, setDetailStudentId] = useState<number | null>(null);

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
      const response = await studentsApi.create({
        name: newStudent.name,
        wNumber: newStudent.wNumber,
        email: newStudent.email,
        scheduleId,
      });

      //check if server returned an override confirmation request
      if (response && typeof response === "object" && "requiresOverrideConfirmation" in response) {
        const overrideResponse = response as any;
        setOverrideState({
          pendingStudent: { ...newStudent },
          currentCount: overrideResponse.currentCount,
          capacity: overrideResponse.capacity,
        });
        return;
      }

      setNewStudent({ name: "", wNumber: "", email: "" });
      addToast("success", "Student added");
      await loadStudents();
    } catch (err: any) {
      //check for hard cap 409
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error === "HARD_CAP_EXCEEDED") {
          addToast("error", "This schedule is at the hard cap. Create a new section instead.");
          return;
        }
        if (parsed.error === "ABSOLUTE_CAP") {
          addToast("error", "This schedule is at the absolute maximum (12).");
          return;
        }
      } catch {
        //not json, use raw message
      }
      addToast("error", err.message || "Failed to add student");
    }
  };

  const handleConfirmOverride = async () => {
    if (!overrideState || overrideReason.length < 10) return;

    try {
      await studentsApi.create({
        name: overrideState.pendingStudent.name,
        wNumber: overrideState.pendingStudent.wNumber,
        email: overrideState.pendingStudent.email,
        scheduleId,
        acknowledgeOverride: true,
        overrideReason,
      });

      setNewStudent({ name: "", wNumber: "", email: "" });
      setOverrideState(null);
      setOverrideReason("");
      addToast("success", "Student added (capacity override logged)");
      await loadStudents();
    } catch (err: any) {
      addToast("error", err.message || "Failed to add student with override");
      setOverrideState(null);
      setOverrideReason("");
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

  //capacity meter colors
  const pct = Math.min((studentList.length / capacity) * 100, 100);
  const barColor = pct >= 100 ? "var(--error)" : pct >= 75 ? "#d97706" : "var(--green-700)";
  const textColor = pct >= 100 ? "var(--error)" : pct >= 75 ? "#92400e" : "var(--green-700)";

  return (
    <div className={styles.root}>
      <Card variant="raised" style={{ padding: 0 }}>
        {/* ── header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <NumberBadge number="02" variant="gold" size="sm" />
            <h3 className={styles.headerTitle}>Student Roster</h3>
            <p className={styles.headerSubtitle}>
              {studentList.length} of {capacity} students
            </p>
          </div>
          <div className={styles.headerRight}>
            {canEdit && (
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Upload size={14} />}
                onClick={() => setShowImport(true)}
              >
                Import Students
              </Button>
            )}
          </div>
        </div>

        {/* ── capacity bar ── */}
        <div className={styles.capacityBar}>
          <span className={styles.capacityLabel}>Capacity</span>
          <div className={styles.capacityTrack}>
            <div
              className={styles.capacityFill}
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
          <span className={styles.capacityText} style={{ color: textColor }}>
            {studentList.length}/{capacity}
          </span>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {loading ? (
          <div style={{ padding: "2rem" }}>
            <Skeleton variant="text" count={4} />
          </div>
        ) : studentList.length > 0 ? (
          <>
            {/* ── table header ── */}
            <div className={styles.tableHeader}>
              <span className={styles.tableHeaderLabel}>N&#186;</span>
              <span className={styles.tableHeaderLabel}>W#</span>
              <span className={styles.tableHeaderLabel}>Name</span>
              <span className={styles.tableHeaderLabel}>Email</span>
              <span />
            </div>

            {/* ── student rows ── */}
            {studentList.map((student, idx) => (
              <div key={student.id} className={styles.studentRow}>
                <span className={styles.rowIndex}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className={styles.rowWNumber}>{student.wNumber}</span>
                <button
                  className={styles.rowName}
                  onClick={(e) => { e.stopPropagation(); setDetailStudentId(student.id); }}
                >
                  <Avatar name={student.name} size="sm" />
                  {student.name}
                </button>
                <span className={styles.rowEmail}>{student.email}</span>
                {canEdit ? (
                  <div className={styles.rowAction}>
                    <button
                      className={styles.rowDeleteBtn}
                      onClick={() => setDeleteConfirm(student.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </>
        ) : (
          <div style={{ padding: "2rem" }}>
            <EmptyState
              icon={<Users size={32} />}
              title="No students yet"
              description="Add students to this schedule group individually or import a CSV roster."
              action={
                canEdit ? (
                  <Button
                    variant="primary"
                    size="md"
                    iconLeft={<Plus size={14} />}
                    onClick={() => {
                      //focus first input in add form
                      const firstInput = document.querySelector(`.${styles.addForm} input`) as HTMLInputElement;
                      firstInput?.focus();
                    }}
                  >
                    Add First Student
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}

        {/* ── add student form ── */}
        {canEdit && (
          <form onSubmit={handleAddStudent} className={styles.addForm}>
            <span />
            <Input
              type="text"
              required
              value={newStudent.wNumber}
              onChange={(e) => setNewStudent({ ...newStudent, wNumber: e.target.value })}
              placeholder="W12345678"
            />
            <Input
              type="text"
              required
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              placeholder="Full name"
            />
            <Input
              type="email"
              required
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              placeholder="Email"
            />
            <Button variant="primary" size="md" iconLeft={<Plus size={14} />} type="submit">
              Add
            </Button>
          </form>
        )}
      </Card>

      {/* ── delete confirm ── */}
      <Modal
        open={deleteConfirm != null}
        onClose={() => setDeleteConfirm(null)}
        title="Remove student?"
        subtitle="This will permanently remove the student from this schedule group."
        size="sm"
        number="ATTENTION"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm != null && handleDeleteStudent(deleteConfirm)}>
              Remove
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
          This action cannot be undone.
        </p>
      </Modal>

      {/* ── capacity override confirm ── */}
      <Modal
        open={overrideState != null}
        onClose={() => { setOverrideState(null); setOverrideReason(""); }}
        title="Override schedule capacity?"
        subtitle={overrideState ? `${overrideState.pendingStudent.name} (${overrideState.pendingStudent.wNumber})` : ""}
        size="sm"
        number="OVERRIDE"
        footer={
          <>
            <Button variant="outline" onClick={() => { setOverrideState(null); setOverrideReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmOverride}
              disabled={overrideReason.length < 10}
            >
              Confirm Override
            </Button>
          </>
        }
      >
        <div>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 0.75rem 0" }}>
            This schedule already has {overrideState?.currentCount} students — Ashley's firm cap
            is {overrideState?.capacity}. Adding a {(overrideState?.currentCount ?? 0) + 1}th student is
            allowed only as an intentional override. Please enter a reason so the audit log has context.
          </p>
          <textarea
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Reason for override (minimum 10 characters)..."
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "0.75rem",
              border: "1.5px solid var(--border)",
              borderRadius: "8px",
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              resize: "vertical",
              outline: "none",
            }}
          />
          {overrideReason.length > 0 && overrideReason.length < 10 && (
            <p style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "0.25rem" }}>
              {10 - overrideReason.length} more characters needed
            </p>
          )}
        </div>
      </Modal>

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

      <StudentDetailPanel
        isOpen={detailStudentId != null}
        onClose={() => setDetailStudentId(null)}
        studentId={detailStudentId}
      />
    </div>
  );
}
