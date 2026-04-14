import { useState } from "react";
import { StickyNote, Plus } from "lucide-react";
import { useNotes } from "../../hooks/useNotes";
import { NoteCard } from "./NoteCard";
import { NoteForm } from "./NoteForm";
import { DetailPanel } from "../ui/DetailPanel";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { useToast } from "../../Lib/ToastContext";
import type { NoteDto, CreateNoteDto } from "../../services/Notes";
import styles from "./NotesPanel.module.css";

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  semesterId?: number;
  scheduleId?: number;
  sectionId?: number;
}

export function NotesPanel({ isOpen, onClose, semesterId, scheduleId, sectionId }: NotesPanelProps) {
  const { addToast } = useToast();
  const { notes, loading, openCount, create, update, toggleDone, remove } = useNotes({
    semesterId,
    scheduleId,
    sectionId,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteDto | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (title: string, body: string) => {
    setSaving(true);
    try {
      const dto: CreateNoteDto = { title, body };
      if (semesterId) dto.semesterId = semesterId;
      else if (scheduleId) dto.scheduleId = scheduleId;
      else if (sectionId) dto.sectionId = sectionId;

      await create(dto);
      setShowForm(false);
      addToast("success", "Note created");
    } catch (err: any) {
      addToast("error", err.message || "Failed to create note");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (title: string, body: string) => {
    if (!editingNote) return;
    setSaving(true);
    try {
      await update(editingNote.id, { title, body });
      setEditingNote(null);
      addToast("success", "Note updated");
    } catch (err: any) {
      addToast("error", err.message || "Failed to update note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove(id);
      addToast("success", "Note deleted");
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete note");
    }
  };

  return (
    <DetailPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Notes"
      icon={<StickyNote size={16} />}
      badge={openCount > 0 ? <span className={styles.count}>{openCount}</span> : undefined}
      width={360}
      footer={
        showForm ? (
          <NoteForm
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            saving={saving}
          />
        ) : (
          <Button
            variant="primary"
            size="md"
            iconLeft={<Plus size={14} />}
            onClick={() => setShowForm(true)}
            style={{ width: "100%" }}
          >
            Add Note
          </Button>
        )
      }
    >
      {loading ? (
        <div className={styles.loading}>Loading notes...</div>
      ) : notes.length === 0 && !showForm ? (
        <EmptyState
          icon={<StickyNote size={28} />}
          title="No notes yet"
          description="Jot something to your future self."
          size="sm"
          action={
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={() => setShowForm(true)}
            >
              Add Note
            </Button>
          }
        />
      ) : (
        <div className={styles.list}>
          {notes.map((note) =>
            editingNote?.id === note.id ? (
              <NoteForm
                key={note.id}
                initialTitle={note.title}
                initialBody={note.body}
                onSave={handleEdit}
                onCancel={() => setEditingNote(null)}
                saving={saving}
              />
            ) : (
              <NoteCard
                key={note.id}
                note={note}
                onToggleDone={toggleDone}
                onEdit={(n) => setEditingNote(n)}
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      )}
    </DetailPanel>
  );
}
