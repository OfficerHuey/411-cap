import { Pencil, Trash2, Square, CheckSquare } from "lucide-react";
import type { NoteDto } from "../../services/Notes";
import styles from "./NoteCard.module.css";

//relative timestamp helper
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface NoteCardProps {
  note: NoteDto;
  onToggleDone: (id: number) => void;
  onEdit?: (note: NoteDto) => void;
  onDelete?: (id: number) => void;
  showBreadcrumb?: boolean;
}

export function NoteCard({ note, onToggleDone, onEdit, onDelete, showBreadcrumb }: NoteCardProps) {
  //build breadcrumb trail for global notes page
  const breadcrumb = showBreadcrumb
    ? [note.semesterName, note.scheduleName, note.sectionLabel ? `Sec ${note.sectionLabel}` : null]
        .filter(Boolean)
        .join(" → ")
    : null;

  return (
    <div className={`${styles.card} ${note.isDone ? styles.done : ""}`}>
      {breadcrumb && (
        <span className={styles.breadcrumb}>{breadcrumb}</span>
      )}
      <div className={styles.header}>
        <button
          className={styles.checkbox}
          onClick={() => onToggleDone(note.id)}
          aria-label={note.isDone ? "Mark as open" : "Mark as done"}
        >
          {note.isDone ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
        <h4 className={styles.title}>{note.title}</h4>
        <div className={styles.actions}>
          {onEdit && (
            <button className={styles.actionBtn} onClick={() => onEdit(note)} aria-label="Edit note">
              <Pencil size={12} />
            </button>
          )}
          {onDelete && (
            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onDelete(note.id)} aria-label="Delete note">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
      <p className={styles.body}>{note.body}</p>
      <div className={styles.meta}>
        <span className={styles.author}>{note.authorName}</span>
        <span className={styles.dot}>&middot;</span>
        <span className={styles.time}>{timeAgo(note.createdAt)}</span>
      </div>
    </div>
  );
}
