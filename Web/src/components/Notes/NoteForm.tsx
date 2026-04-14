import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import styles from "./NoteForm.module.css";

interface NoteFormProps {
  initialTitle?: string;
  initialBody?: string;
  onSave: (title: string, body: string) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function NoteForm({ initialTitle = "", initialBody = "", onSave, onCancel, saving }: NoteFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await onSave(title.trim(), body.trim());
  };

  const isValid = title.trim().length > 0 && body.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
        maxLength={120}
        autoFocus
      />
      <textarea
        className={styles.textarea}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write something..."
        maxLength={4000}
        rows={3}
      />
      <div className={styles.actions}>
        <Button variant="outline" size="sm" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" disabled={!isValid} loading={saving}>
          Save
        </Button>
      </div>
    </form>
  );
}
