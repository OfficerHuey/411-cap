import { useEffect, useState } from "react";
import { User, Copy, Check, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { students as studentsApi } from "../Lib/api";
import type { StudentDetail } from "../Lib/Types";
import { DetailPanel } from "./ui/DetailPanel";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Skeleton } from "./ui/Skeleton";
import { formatDistanceToNow } from "date-fns";
import styles from "./StudentDetailPanel.module.css";

interface StudentDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number | null;
}

export function StudentDetailPanel({ isOpen, onClose, studentId }: StudentDetailPanelProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !studentId) return;
    setLoading(true);
    studentsApi.getDetail(studentId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isOpen, studentId]);

  const handleCopyW = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.wNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const breadcrumb = data
    ? [data.semesterName, data.semesterLevel ? `Semester ${data.semesterLevel}` : null, data.scheduleName]
        .filter(Boolean)
        .join(" \u2192 ")
    : "";

  return (
    <DetailPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Student"
      icon={<User size={16} />}
      width={420}
    >
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Skeleton width="100%" height="64px" />
          <Skeleton width="200px" height="20px" />
          <Skeleton width="160px" height="20px" />
        </div>
      ) : data ? (
        <div className={styles.content}>
          {/* identity */}
          <div className={styles.identity}>
            <Avatar name={data.name} size="xl" />
            <h2 className={styles.name}>{data.name}</h2>
          </div>

          {/* w number */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>W#</span>
            <div className={styles.wRow}>
              <span className={styles.wNumber}>{data.wNumber}</span>
              <button className={styles.copyBtn} onClick={handleCopyW} title="Copy W#">
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* email */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <a href={`mailto:${data.email}`} className={styles.emailLink}>
              <Mail size={12} />
              {data.email}
            </a>
          </div>

          {/* schedule breadcrumb */}
          {breadcrumb && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Schedule</span>
              <button
                className={styles.breadcrumbLink}
                onClick={() => {
                  onClose();
                  if (data.scheduleId) navigate(`/schedule-builder/${data.scheduleId}`);
                }}
              >
                {breadcrumb}
              </button>
            </div>
          )}

          {/* location tag */}
          {data.locationTag && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Location</span>
              <Badge variant="gold" size="md">
                {data.locationTag === "Hammond" || data.locationTag === "H" ? "Hammond" : data.locationTag === "Baton Rouge" || data.locationTag === "B" ? "Baton Rouge" : data.locationTag}
              </Badge>
            </div>
          )}

          {/* added by */}
          {data.addedBy && (
            <div className={styles.meta}>
              Added by {data.addedBy}
              {data.addedAt && (
                <> &middot; {formatDistanceToNow(new Date(data.addedAt), { addSuffix: true })}</>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.empty}>Student not found</div>
      )}
    </DetailPanel>
  );
}
