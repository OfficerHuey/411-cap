import { useState, useEffect, useCallback } from "react";
import { notesApi } from "../services/Notes";
import type { NoteDto, CreateNoteDto, UpdateNoteDto } from "../services/Notes";

interface UseNotesParams {
  semesterId?: number;
  scheduleId?: number;
  sectionId?: number;
}

export function useNotes(params: UseNotesParams = {}) {
  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await notesApi.getAll(params);
      setNotes(data);
    } catch (err: any) {
      setError(err.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [params.semesterId, params.scheduleId, params.sectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (dto: CreateNoteDto) => {
    const created = await notesApi.create(dto);
    setNotes((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: number, dto: UpdateNoteDto) => {
    const updated = await notesApi.update(id, dto);
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    return updated;
  }, []);

  //optimistic toggle-done
  const toggleDone = useCallback(async (id: number) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const newDone = !note.isDone;

    //optimistic update
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isDone: newDone } : n))
    );

    try {
      await notesApi.update(id, { isDone: newDone });
    } catch {
      //rollback on failure
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isDone: !newDone } : n))
      );
    }
  }, [notes]);

  const remove = useCallback(async (id: number) => {
    await notesApi.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const openCount = notes.filter((n) => !n.isDone).length;

  return { notes, loading, error, openCount, create, update, toggleDone, remove, reload: load };
}
