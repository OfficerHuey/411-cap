import { useEffect, useState, useMemo } from "react";
import "../App.css";
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, GraduationCap, Loader2 } from "lucide-react";
import { instructors as instructorsApi } from "../Lib/api";
import type { Instructor, InstructorType } from "../Lib/Types";
import { useToast } from "../Lib/ToastContext";

const INSTRUCTOR_TYPES: InstructorType[] = ["FullTime", "Adjunct", "Overload"];

export function InstructorsPage() {
  const { addToast } = useToast();
  const [list, setList] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editInst, setEditInst] = useState<Instructor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  useEffect(() => { loadInstructors(); }, []);

  const loadInstructors = async () => {
    try {
      setLoading(true);
      const data = await instructorsApi.getAll();
      setList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load instructors");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await instructorsApi.delete(id);
      setDeleteConfirm(null);
      addToast("success", "Instructor deleted");
      await loadInstructors();
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete instructor");
      setDeleteConfirm(null);
    }
  };

  const filtered = useMemo(() => {
    let items = list.filter((i) => {
      const q = search.toLowerCase();
      return !q || i.name.toLowerCase().includes(q) || (i.email || "").toLowerCase().includes(q);
    });
    items = [...items].sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortCol === "name") { aVal = a.name; bVal = b.name; }
      else if (sortCol === "email") { aVal = a.email || ""; bVal = b.email || ""; }
      else if (sortCol === "type") { aVal = a.type; bVal = b.type; }
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return items;
  }, [list, search, sortCol, sortDir]);

  const typeLabel = (t: InstructorType) => {
    if (t === "FullTime") return "Full Time";
    return t;
  };

  return (
    <>
      <style>{`
        .inst-root { font-family: 'Inter', sans-serif; }
        .inst-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e2db; flex-wrap: wrap; gap: 1rem; }
        .inst-header h1 { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 600; color: #0a1f14; margin: 0 0 0.35rem 0; }
        .inst-header-divider { width: 40px; height: 3px; background: #00563f; border-radius: 2px; margin-bottom: 0.6rem; }
        .inst-header p { color: #6b7280; font-size: 0.9rem; margin: 0; font-weight: 300; }
        .inst-toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
        .inst-search { padding: 0.6rem 0.875rem; border: 1.5px solid #e5e7eb; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.85rem; outline: none; width: 260px; transition: border-color 0.15s; background: #ffffff; }
        .inst-search:focus { border-color: #00563f; box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1); }
        .btn-add { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: #00563f; color: #ffffff; border: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.88rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .btn-add:hover { background: #003d2a; }
        .inst-card { background: #ffffff; border: 1px solid #e5e2db; border-radius: 10px; overflow: hidden; }
        .inst-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .inst-table thead th { padding: 0.75rem 1.25rem; text-align: left; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #ffffff; background: #00563f; cursor: pointer; user-select: none; transition: background 0.15s; }
        .inst-table thead th:hover { background: #004d38; }
        .inst-table thead th .sort-icon { display: inline-flex; vertical-align: middle; margin-left: 0.3rem; opacity: 0.5; }
        .inst-table thead th .sort-icon.active { opacity: 1; }
        .inst-table tbody tr { border-bottom: 1px solid #f3f4f6; transition: background 0.12s; }
        .inst-table tbody tr:hover { background: #fafaf8; }
        .inst-table tbody tr:last-child { border-bottom: none; }
        .inst-table td { padding: 0.875rem 1.25rem; color: #374151; vertical-align: middle; }
        .inst-table td.name { font-weight: 500; color: #0a1f14; }
        .inst-type-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.72rem; font-weight: 500; }
        .inst-type-badge.FullTime { background: #f0faf5; color: #065f46; border: 1px solid #a7f3d0; }
        .inst-type-badge.Adjunct { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
        .inst-type-badge.Overload { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .btn-icon { background: none; border: none; cursor: pointer; color: #d1d5db; padding: 0.3rem; border-radius: 4px; display: inline-flex; align-items: center; transition: color 0.15s, background 0.15s; }
        .btn-icon.edit:hover { color: #00563f; background: #f0faf5; }
        .btn-icon.delete:hover { color: #dc2626; background: #fef2f2; }
        .inst-empty { text-align: center; padding: 3rem 2rem; color: #9ca3af; font-size: 0.88rem; }
        .inst-empty-icon { width: 48px; height: 48px; background: #f0faf5; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; }
        .inst-empty h4 { font-family: 'Playfair Display', serif; font-size: 1rem; color: #0a1f14; margin: 0 0 0.3rem 0; }
        .inst-empty p { margin: 0; font-weight: 300; }
        .error-banner { background: #fef2f2; border: 1px solid #fecaca; border-left: 3px solid #dc2626; border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.85rem; color: #991b1b; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(2px); padding: 1.5rem; }
        .modal-box { background: #ffffff; border-radius: 12px; width: 100%; max-width: 440px; box-shadow: 0 24px 60px rgba(0,0,0,0.2); }
        .modal-header { background: #00563f; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; border-radius: 12px 12px 0 0; }
        .modal-header h2 { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 600; color: #ffffff; margin: 0; }
        .modal-close { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #ffffff; cursor: pointer; padding: 0.3rem; display: flex; }
        .modal-close:hover { background: rgba(255,255,255,0.2); }
        .modal-body { padding: 1.5rem; }
        .form-group { margin-bottom: 1rem; }
        .form-label { display: block; font-size: 0.75rem; font-weight: 500; color: #374151; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.4rem; }
        .form-input, .form-select { width: 100%; padding: 0.65rem 0.875rem; border: 1.5px solid #e5e7eb; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.88rem; color: #111827; outline: none; transition: border-color 0.15s; box-sizing: border-box; background: #fafafa; }
        .form-input:focus, .form-select:focus { border-color: #00563f; box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1); background: #ffffff; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid #f3f4f6; }
        .btn-cancel { padding: 0.6rem 1.25rem; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #ffffff; color: #6b7280; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
        .btn-cancel:hover { background: #f9fafb; }
        .btn-submit { padding: 0.6rem 1.5rem; background: #00563f; color: #ffffff; border: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
        .btn-submit:hover { background: #003d2a; }
        .btn-submit:disabled { background: #6b7280; cursor: not-allowed; }
        .btn-submit .btn-spinner { animation: inst-spin 0.7s linear infinite; }
        @keyframes inst-spin { to { transform: rotate(360deg); } }
        .delete-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(2px); }
        .delete-box { background: #ffffff; border-radius: 12px; padding: 1.75rem; max-width: 360px; width: 100%; box-shadow: 0 24px 60px rgba(0,0,0,0.2); text-align: center; }
        .delete-box-icon { width: 48px; height: 48px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
        .delete-box h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #0a1f14; margin: 0 0 0.5rem 0; }
        .delete-box p { font-size: 0.85rem; color: #6b7280; margin: 0 0 1.5rem 0; }
        .delete-box-actions { display: flex; gap: 0.75rem; }
        .delete-btn-cancel { flex: 1; padding: 0.65rem; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #ffffff; color: #6b7280; font-family: 'Inter', sans-serif; font-size: 0.85rem; cursor: pointer; }
        .delete-btn-confirm { flex: 1; padding: 0.65rem; background: #dc2626; color: #ffffff; border: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.85rem; cursor: pointer; }
        .delete-btn-confirm:hover { background: #b91c1c; }
      `}</style>

      <div className="inst-root">
        <div className="inst-header">
          <div>
            <h1>Instructors</h1>
            <div className="inst-header-divider" />
            <p>Manage faculty and adjunct instructors</p>
          </div>
          <button className="btn-add" onClick={() => { setEditInst(null); setShowModal(true); }}>
            <Plus size={16} />
            Add Instructor
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="inst-toolbar">
          <input
            className="inst-search"
            placeholder="Search instructors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="inst-card">
          {loading ? (
            <div className="loading-spinner"><span>Loading instructors…</span></div>
          ) : filtered.length === 0 ? (
            <div className="inst-empty">
              <div className="inst-empty-icon"><GraduationCap size={22} color="#00563f" /></div>
              <h4>{list.length === 0 ? "No Instructors Yet" : "No Results"}</h4>
              <p>{list.length === 0 ? "Add your first instructor using the button above" : "No instructors match your search"}</p>
            </div>
          ) : (
            <table className="inst-table">
              <thead>
                <tr>
                  {([["name","Name"],["email","Email"],["type","Type"]] as const).map(([col, label]) => (
                    <th key={col} onClick={() => toggleSort(col)}>
                      {label}
                      <span className={`sort-icon ${sortCol === col ? "active" : ""}`}>
                        {sortCol === col ? (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={11} />}
                      </span>
                    </th>
                  ))}
                  <th style={{ textAlign: "right", cursor: "default" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inst) => (
                  <tr key={inst.id}>
                    <td className="name">{inst.name}</td>
                    <td style={{ color: "#6b7280" }}>{inst.email || "—"}</td>
                    <td><span className={`inst-type-badge ${inst.type}`}>{typeLabel(inst.type)}</span></td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-icon edit" onClick={() => { setEditInst(inst); setShowModal(true); }}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon delete" onClick={() => setDeleteConfirm(inst.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <InstructorFormModal
          instructor={editInst}
          onClose={() => { setShowModal(false); setEditInst(null); }}
          onSuccess={() => { setShowModal(false); setEditInst(null); loadInstructors(); addToast("success", editInst ? "Instructor updated" : "Instructor created"); }}
        />
      )}

      {deleteConfirm != null && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon"><Trash2 size={20} color="#dc2626" /></div>
            <h3>Delete Instructor?</h3>
            <p>This will permanently remove this instructor.</p>
            <div className="delete-box-actions">
              <button className="delete-btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="delete-btn-confirm" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InstructorFormModal({ instructor, onClose, onSuccess }: { instructor: Instructor | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: instructor?.name || "",
    email: instructor?.email || "",
    type: instructor?.type || "FullTime" as InstructorType,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (instructor) {
        await instructorsApi.update(instructor.id, form);
      } else {
        await instructorsApi.create(form);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save instructor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{instructor ? "Edit Instructor" : "Add Instructor"}</h2>
          <button className="modal-close" onClick={onClose}><span style={{ fontSize: "1.1rem" }}>×</span></button>
        </div>
        <div className="modal-body">
          {error && <div className="error-banner" style={{ margin: "0 0 1rem" }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@selu.edu" />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as InstructorType })}>
                {INSTRUCTOR_TYPES.map((t) => <option key={t} value={t}>{t === "FullTime" ? "Full Time" : t}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={saving}>{saving && <Loader2 size={14} className="btn-spinner" />}{saving ? "Saving..." : instructor ? "Save Changes" : "Add Instructor"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
