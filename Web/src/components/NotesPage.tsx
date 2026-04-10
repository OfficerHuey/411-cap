import { useEffect, useState, useMemo } from "react";
import { StickyNote, Filter } from "lucide-react";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { useToast } from "../Lib/ToastContext";
import { notesApi } from "../services/Notes";
import type { NoteDto, NoteAuthor } from "../services/Notes";
import { NoteCard } from "./Notes/NoteCard";
import { NumberBadge } from "./ui/NumberBadge";
import { HairlineRule } from "./ui/HairlineRule";
import { EmptyState } from "./ui/EmptyState";
import { Skeleton } from "./ui/Skeleton";
import styles from "./NotesPage.module.css";

type StatusFilter = "all" | "open" | "done";
type TargetFilter = "all" | "semester" | "schedule" | "section";

//group notes by day
function groupByDay(notes: NoteDto[]): { label: string; notes: NoteDto[] }[] {
  const groups = new Map<string, NoteDto[]>();

  for (const note of notes) {
    const date = new Date(note.createdAt);
    const key = date.toISOString().split("T")[0];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(note);
  }

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  return Array.from(groups.entries()).map(([key, notes]) => ({
    label: key === today ? "Today" : key === yesterday ? "Yesterday" : formatDayLabel(key),
    notes,
  }));
}

function formatDayLabel(dateKey: string): string {
  return new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function NotesPage() {
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const { addToast } = useToast();
  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [authors, setAuthors] = useState<NoteAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  //filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [authorFilter, setAuthorFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("all");

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/" },
      { label: "Notes" },
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    loadNotes();
    notesApi.getAuthors().then(setAuthors).catch(() => {});
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await notesApi.getAll();
      setNotes(data);
    } catch (err: any) {
      addToast("error", err.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  //apply client-side filters
  const filtered = useMemo(() => {
    let result = notes;

    if (statusFilter === "open") result = result.filter((n) => !n.isDone);
    else if (statusFilter === "done") result = result.filter((n) => n.isDone);

    if (authorFilter) result = result.filter((n) => n.authorName === authorFilter);

    if (targetFilter === "semester") result = result.filter((n) => n.semesterId != null);
    else if (targetFilter === "schedule") result = result.filter((n) => n.scheduleId != null);
    else if (targetFilter === "section") result = result.filter((n) => n.sectionId != null);

    return result;
  }, [notes, statusFilter, authorFilter, targetFilter]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const handleToggleDone = async (id: number) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const newDone = !note.isDone;

    //optimistic
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isDone: newDone } : n)));

    try {
      await notesApi.update(id, { isDone: newDone });
    } catch {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isDone: !newDone } : n)));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notesApi.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      addToast("success", "Note deleted");
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete note");
    }
  };

  return (
    <div className={styles.root}>
      {/* ── hero ── */}
      <div className={styles.hero}>
        <div>
          <NumberBadge number="01" variant="gold" size="sm" />
          <HairlineRule width="48px" color="gold" spacing="normal" />
          <h1 className={styles.heroTitle}>
            <em>Notes</em>
          </h1>
          <p className={styles.heroSubtitle}>
            {notes.length} note{notes.length !== 1 ? "s" : ""} across all semesters
          </p>
        </div>
      </div>

      <HairlineRule color="muted" spacing="normal" />

      {/* ── filters ── */}
      <div className={styles.filters}>
        <Filter size={14} className={styles.filterIcon} />

        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="done">Done</option>
        </select>

        <select
          className={styles.filterSelect}
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
        >
          <option value="">All Authors</option>
          {authors.map((a) => (
            <option key={a.id} value={a.name}>{a.name}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value as TargetFilter)}
        >
          <option value="all">All Targets</option>
          <option value="semester">Semester</option>
          <option value="schedule">Schedule</option>
          <option value="section">Section</option>
        </select>
      </div>

      {/* ── content ── */}
      {loading ? (
        <div style={{ marginTop: "1.5rem" }}>
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={120} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<StickyNote size={32} />}
          title="No notes match your filters"
          description="Try adjusting the filters above, or create notes from the Semester Hub or Schedule Builder."
        />
      ) : (
        <div className={styles.dayGroups}>
          {grouped.map((group) => (
            <div key={group.label} className={styles.dayGroup}>
              <h3 className={styles.dayLabel}>{group.label}</h3>
              <div className={styles.grid}>
                {group.notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onToggleDone={handleToggleDone}
                    onDelete={handleDelete}
                    showBreadcrumb
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
