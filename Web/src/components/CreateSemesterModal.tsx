import { useState } from "react";
import { semesters as semestersApi } from "../Lib/api";
import type { ClinicalDays } from "../Lib/Types";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";

interface CreateSemesterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const clinicalDayOptions = [
  { value: "Thurs/Fri", label: "Thursday / Friday" },
  { value: "Tues/Wed", label: "Tuesday / Wednesday" },
];

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await semestersApi.create({
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        clinicalDays: formData.clinicalDays,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create semester");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Create New Semester"
      subtitle="Add a new semester to the scheduling system"
      number="01"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            loading={loading}
            onClick={(e) => handleSubmit(e as any)}
          >
            {loading ? "Creating\u2026" : "Create Semester"}
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
      <form onSubmit={handleSubmit} id="create-semester-form">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Input
            label="Semester Name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Fall 2027"
            fullWidth
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              fullWidth
            />
            <Input
              label="End Date"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              fullWidth
            />
          </div>
          <Select
            label="Clinical Days"
            options={clinicalDayOptions}
            value={formData.clinicalDays}
            onChange={(v) => setFormData({ ...formData, clinicalDays: v as ClinicalDays })}
            fullWidth
          />
        </div>
      </form>
    </Modal>
  );
}
