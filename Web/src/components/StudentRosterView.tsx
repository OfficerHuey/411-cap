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
import styles from "./StudentRosterView.module.css";

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
                <div className={styles.rowName}>
                  <Avatar name={student.name} size="sm" />
                  {student.name}
                </div>
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
    </div>
  );
}
