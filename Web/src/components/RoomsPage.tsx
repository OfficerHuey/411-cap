import { useEffect, useState } from "react";
import "../App.css";
import { Plus, Pencil, Trash2, DoorOpen } from "lucide-react";
import { rooms as roomsApi } from "../Lib/api";
import type { Room, RoomType } from "../Lib/Types";

const ROOM_TYPES: RoomType[] = ["Lecture", "Lab", "SimLab", "Clinical", "Online"];

export function RoomsPage() {
  const [roomList, setRoomList] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { loadRooms(); }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await roomsApi.getAll();
      setRoomList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await roomsApi.delete(id);
      setDeleteConfirm(null);
      await loadRooms();
    } catch (err: any) {
      setError(err.message || "Failed to delete room");
      setDeleteConfirm(null);
    }
  };

  const filtered = roomList.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.roomNumber.toLowerCase().includes(q) || r.building.toLowerCase().includes(q) || r.campus.toLowerCase().includes(q);
  });

  return (
    <>
      <style>{`
        .rooms-root { font-family: 'DM Sans', sans-serif; }
        .rooms-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e2db; flex-wrap: wrap; gap: 1rem; }
        .rooms-header h1 { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 600; color: #0a1f14; margin: 0 0 0.35rem 0; }
        .rooms-header-divider { width: 40px; height: 3px; background: #00563f; border-radius: 2px; margin-bottom: 0.6rem; }
        .rooms-header p { color: #6b7280; font-size: 0.9rem; margin: 0; font-weight: 300; }
        .rooms-toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
        .rooms-search { padding: 0.6rem 0.875rem; border: 1.5px solid #e5e7eb; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; outline: none; width: 260px; transition: border-color 0.15s; background: #ffffff; }
        .rooms-search:focus { border-color: #00563f; box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1); }
        .btn-add { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: #00563f; color: #ffffff; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .btn-add:hover { background: #003d2a; }
        .rooms-card { background: #ffffff; border: 1px solid #e5e2db; border-radius: 10px; overflow: hidden; }
        .rooms-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .rooms-table thead th { padding: 0.75rem 1.25rem; text-align: left; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #ffffff; background: #00563f; }
        .rooms-table tbody tr { border-bottom: 1px solid #f3f4f6; transition: background 0.12s; }
        .rooms-table tbody tr:hover { background: #fafaf8; }
        .rooms-table tbody tr:last-child { border-bottom: none; }
        .rooms-table td { padding: 0.875rem 1.25rem; color: #374151; vertical-align: middle; }
        .rooms-table td.name { font-weight: 500; color: #0a1f14; }
        .room-type-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.72rem; font-weight: 500; }
        .room-type-badge.Lecture { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
        .room-type-badge.Lab { background: #f0faf5; color: #065f46; border: 1px solid #a7f3d0; }
        .room-type-badge.SimLab { background: #fdf4ff; color: #7c3aed; border: 1px solid #e9d5ff; }
        .room-type-badge.Clinical { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .room-type-badge.Online { background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }
        .btn-icon { background: none; border: none; cursor: pointer; color: #d1d5db; padding: 0.3rem; border-radius: 4px; display: inline-flex; align-items: center; transition: color 0.15s, background 0.15s; }
        .btn-icon.edit:hover { color: #00563f; background: #f0faf5; }
        .btn-icon.delete:hover { color: #dc2626; background: #fef2f2; }
        .rooms-empty { text-align: center; padding: 3rem 2rem; color: #9ca3af; font-size: 0.88rem; }
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
        .form-input, .form-select { width: 100%; padding: 0.65rem 0.875rem; border: 1.5px solid #e5e7eb; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; color: #111827; outline: none; transition: border-color 0.15s; box-sizing: border-box; background: #fafafa; }
        .form-input:focus, .form-select:focus { border-color: #00563f; box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1); background: #ffffff; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid #f3f4f6; }
        .btn-cancel { padding: 0.6rem 1.25rem; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #ffffff; color: #6b7280; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
        .btn-cancel:hover { background: #f9fafb; }
        .btn-submit { padding: 0.6rem 1.5rem; background: #00563f; color: #ffffff; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
        .btn-submit:hover { background: #003d2a; }
        .btn-submit:disabled { background: #6b7280; cursor: not-allowed; }
        .delete-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(2px); }
        .delete-box { background: #ffffff; border-radius: 12px; padding: 1.75rem; max-width: 360px; width: 100%; box-shadow: 0 24px 60px rgba(0,0,0,0.2); text-align: center; }
        .delete-box-icon { width: 48px; height: 48px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
        .delete-box h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #0a1f14; margin: 0 0 0.5rem 0; }
        .delete-box p { font-size: 0.85rem; color: #6b7280; margin: 0 0 1.5rem 0; }
        .delete-box-actions { display: flex; gap: 0.75rem; }
        .delete-btn-cancel { flex: 1; padding: 0.65rem; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #ffffff; color: #6b7280; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; }
        .delete-btn-confirm { flex: 1; padding: 0.65rem; background: #dc2626; color: #ffffff; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; }
        .delete-btn-confirm:hover { background: #b91c1c; }
      `}</style>

      <div className="rooms-root">
        <div className="rooms-header">
          <div>
            <h1>Rooms</h1>
            <div className="rooms-header-divider" />
            <p>Manage classrooms, labs, and clinical sites</p>
          </div>
          <button className="btn-add" onClick={() => { setEditRoom(null); setShowModal(true); }}>
            <Plus size={16} />
            Add Room
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="rooms-toolbar">
          <input
            className="rooms-search"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rooms-card">
          {loading ? (
            <div className="rooms-empty">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="rooms-empty">
              {roomList.length === 0 ? "No rooms yet. Add your first room above." : "No rooms match your search."}
            </div>
          ) : (
            <table className="rooms-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Building</th>
                  <th>Campus</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((room) => (
                  <tr key={room.id}>
                    <td className="name">{room.roomNumber}</td>
                    <td>{room.building}</td>
                    <td>{room.campus}</td>
                    <td><span className={`room-type-badge ${room.type}`}>{room.type}</span></td>
                    <td>{room.capacity}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-icon edit" onClick={() => { setEditRoom(room); setShowModal(true); }}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon delete" onClick={() => setDeleteConfirm(room.id)}>
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
        <RoomFormModal
          room={editRoom}
          onClose={() => { setShowModal(false); setEditRoom(null); }}
          onSuccess={() => { setShowModal(false); setEditRoom(null); loadRooms(); }}
        />
      )}

      {deleteConfirm != null && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="delete-box-icon"><Trash2 size={20} color="#dc2626" /></div>
            <h3>Delete Room?</h3>
            <p>This will permanently remove this room.</p>
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

//room add/edit modal
function RoomFormModal({ room, onClose, onSuccess }: { room: Room | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    roomNumber: room?.roomNumber || "",
    building: room?.building || "",
    campus: room?.campus || "Hammond",
    type: room?.type || "Lecture" as RoomType,
    capacity: room?.capacity || 30,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (room) {
        await roomsApi.update(room.id, form);
      } else {
        await roomsApi.create(form);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save room");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{room ? "Edit Room" : "Add Room"}</h2>
          <button className="modal-close" onClick={onClose}><span style={{ fontSize: "1.1rem" }}>×</span></button>
        </div>
        <div className="modal-body">
          {error && <div className="error-banner" style={{ margin: "0 0 1rem" }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Room Number *</label>
              <input className="form-input" required value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. 101" />
            </div>
            <div className="form-group">
              <label className="form-label">Building *</label>
              <input className="form-input" required value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} placeholder="e.g. Nursing Building" />
            </div>
            <div className="form-group">
              <label className="form-label">Campus *</label>
              <input className="form-input" required value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })} placeholder="e.g. Hammond" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as RoomType })}>
                  {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input className="form-input" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={saving}>{saving ? "Saving..." : room ? "Save Changes" : "Add Room"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
