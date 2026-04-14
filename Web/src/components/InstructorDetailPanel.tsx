import { useEffect, useState } from "react";
import { GraduationCap, Mail } from "lucide-react";
import { instructors as instructorsApi } from "../Lib/api";
import type { Instructor } from "../Lib/Types";
import { DetailPanel } from "./ui/DetailPanel";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Skeleton } from "./ui/Skeleton";
import styles from "./InstructorDetailPanel.module.css";

interface InstructorDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  instructorId: number | null;
  semesterId?: number;
}

interface WorkloadData {
  instructorId: number;
  instructorName: string;
  semesterId: number;
  totalWorkload: number;
  sections: {
    sectionId: number;
    courseCode: string;
    sectionNumber: string;
    calculatedWorkload: number;
    overrideWorkload: number | null;
    appliedWorkload: number;
    isOverridden: boolean;
  }[];
}

export function InstructorDetailPanel({
  isOpen,
  onClose,
  instructorId,
  semesterId,
}: InstructorDetailPanelProps) {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !instructorId) return;
    setLoading(true);

    const fetches: Promise<void>[] = [
      instructorsApi.getById(instructorId)
        .then(setInstructor)
        .catch(() => setInstructor(null)),
    ];

    if (semesterId) {
      fetches.push(
        instructorsApi.getWorkload(instructorId, semesterId)
          .then(setWorkload)
          .catch(() => setWorkload(null)),
      );
    }

    Promise.all(fetches).finally(() => setLoading(false));
  }, [isOpen, instructorId, semesterId]);

  const typeBadgeVariant = (type: string) => {
    switch (type) {
      case "FullTime": return "green" as const;
      case "Adjunct": return "gold" as const;
      case "Overload": return "red" as const;
      default: return "neutral" as const;
    }
  };

  return (
    <DetailPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Instructor"
      icon={<GraduationCap size={16} />}
      width={420}
    >
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Skeleton width="100%" height="64px" />
          <Skeleton width="200px" height="20px" />
          <Skeleton width="160px" height="20px" />
        </div>
      ) : instructor ? (
        <div className={styles.content}>
          {/* identity */}
          <div className={styles.identity}>
            <Avatar name={instructor.name} size="xl" />
            <h2 className={styles.name}>{instructor.name}</h2>
            <Badge variant={typeBadgeVariant(instructor.type)} size="md">
              {instructor.type}
            </Badge>
          </div>

          {/* email */}
          {instructor.email && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Email</span>
              <a href={`mailto:${instructor.email}`} className={styles.emailLink}>
                <Mail size={12} />
                {instructor.email}
              </a>
            </div>
          )}

          {/* workload */}
          {workload && (
            <div className={styles.workloadSection}>
              <div className={styles.workloadHeader}>
                <span className={styles.workloadNumber}>
                  {workload.totalWorkload.toFixed(2)}
                </span>
                <span className={styles.workloadLabel}>credit hours</span>
              </div>

              {/* assigned sections */}
              {workload.sections.length > 0 && (
                <div className={styles.sectionsList}>
                  <span className={styles.fieldLabel}>Assigned Sections</span>
                  {workload.sections.map((sec) => (
                    <div key={sec.sectionId} className={styles.sectionRow}>
                      <span className={styles.sectionCode}>{sec.courseCode}</span>
                      <span className={styles.sectionNum}>Sec {sec.sectionNumber}</span>
                      <span className={styles.sectionWorkload}>
                        {sec.appliedWorkload.toFixed(2)} hrs
                        {sec.isOverridden && (
                          <span className={styles.overrideTag}>override</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!semesterId && (
            <div className={styles.noSemester}>
              Select a semester to view workload and section assignments.
            </div>
          )}
        </div>
      ) : (
        <div className={styles.empty}>Instructor not found</div>
      )}
    </DetailPanel>
  );
}
