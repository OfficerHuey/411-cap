import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, DoorOpen, Upload } from "lucide-react";
import { rooms as roomsApi } from "../Lib/api";
import type { Room, RoomType } from "../Lib/Types";
import { useToast } from "../Lib/ToastContext";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import type { SelectOption } from "./ui/Select";
import { NumberBadge } from "./ui/NumberBadge";
import { HairlineRule } from "./ui/HairlineRule";
import { SectionHeading } from "./ui/SectionHeading";
import { PageDecor } from "./ui/PageDecor";
import { RoomImportModal } from "./Imports/RoomImportModal";
import { Skeleton } from "./ui/Skeleton";
import styles from "./RoomsPage.module.css";

const ROOM_TYPES: RoomType[] = ["Lecture", "Lab", "SimLab", "Clinical", "Online"];
const ROOM_TYPE_OPTIONS: SelectOption[] = ROOM_TYPES.map((t) => ({ value: t, label: t }));

const TYPE_CLASS: Record<string, string> = {
  Lecture: styles.typeLecture,
  Lab: styles.typeLab,
  SimLab: styles.typeSimLab,
  Clinical: styles.typeClinical,
  Online: styles.typeOnline,
};

export function RoomsPage() {
  const { addToast } = useToast();
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const [roomList, setRoomList] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Room | null>(null);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string>("roomNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showImport, setShowImport] = useState(false);

  //form state for add/edit modal
  const [form, setForm] = useState({ roomNumber: "", building: "", campus: "Hammond", type: "Lecture" as RoomType, capacity: 30 });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  useEffect(() => {
    setBreadcrumbs([{ label: "Rooms" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

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

  const openAddModal = () => {
    setEditRoom(null);
    setForm({ roomNumber: "", building: "", campus: "Hammond", type: "Lecture", capacity: 30 });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditRoom(room);
    setForm({ roomNumber: room.roomNumber, building: room.building, campus: room.campus, type: room.type, capacity: room.capacity });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditRoom(null);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFormError("");
    try {
      if (editRoom) {
        await roomsApi.update(editRoom.id, form);
      } else {
        await roomsApi.create(form);
      }
      closeModal();
      addToast("success", editRoom ? "Room updated" : "Room created");
      await loadRooms();
    } catch (err: any) {
      setFormError(err.message || "Failed to save room");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await roomsApi.delete(id);
      setDeleteConfirm(null);
      addToast("success", "Room deleted");
      await loadRooms();
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete room");
      setDeleteConfirm(null);
    }
  };

  const campusCounts = useMemo(() => {
    const counts = { Hammond: 0, "Baton Rouge": 0, "St. Tammany": 0, Other: 0 };
    roomList.forEach((r) => {
      const campus = r.campus?.toLowerCase() || "";
      if (campus.includes("hammond")) counts.Hammond++;
      else if (campus.includes("baton rouge") || campus.includes("brc")) counts["Baton Rouge"]++;
      else if (campus.includes("tammany")) counts["St. Tammany"]++;
      else counts.Other++;
    });
    return counts;
  }, [roomList]);

  const activeCampusCount = useMemo(
    () => Object.values(campusCounts).filter((v) => v > 0).length,
    [campusCounts],
  );

  const filtered = useMemo(() => {
    let list = roomList.filter((r) => {
      const q = search.toLowerCase();
      return !q || r.roomNumber.toLowerCase().includes(q) || r.building.toLowerCase().includes(q) || r.campus.toLowerCase().includes(q);
    });
    list = [...list].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      if (sortCol === "roomNumber") { aVal = a.roomNumber; bVal = b.roomNumber; }
      else if (sortCol === "building") { aVal = a.building; bVal = b.building; }
      else if (sortCol === "campus") { aVal = a.campus; bVal = b.campus; }
      else if (sortCol === "type") { aVal = a.type; bVal = b.type; }
      else if (sortCol === "capacity") { aVal = a.capacity; bVal = b.capacity; }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [roomList, search, sortCol, sortDir]);

  return (
    <>
      <div className={styles.root}>
        <PageDecor variant="rooms" />
        {/* editorial hero */}
        <div className={styles.hero}>
          <NumberBadge number="01" variant="gold" size="sm" />
          <HairlineRule width="48px" color="gold" spacing="tight" />
          <h1 className={styles.heroTitle}>
            <em>Rooms</em> & Facilities
          </h1>
          <p className={styles.heroSubtitle}>
            {roomList.length} space{roomList.length !== 1 ? "s" : ""} across {activeCampusCount} campus
            {activeCampusCount !== 1 ? "es" : ""}
          </p>
          <div className={styles.heroActions}>
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload size={16} />
              Import
            </Button>
            <Button variant="primary" onClick={openAddModal}>
              <Plus size={16} />
              Add Room
            </Button>
          </div>
        </div>

        {/* campus stat strip — signature element */}
        {roomList.length > 0 && (
          <div className={styles.statStrip}>
            {campusCounts.Hammond > 0 && (
              <div className={`${styles.statCard} ${styles.hammond}`}>
                <p className={styles.statNumber}>{campusCounts.Hammond}</p>
                <p className={styles.statLabel}>Hammond</p>
              </div>
            )}
            {campusCounts["Baton Rouge"] > 0 && (
              <div className={`${styles.statCard} ${styles.batonRouge}`}>
                <p className={styles.statNumber}>{campusCounts["Baton Rouge"]}</p>
                <p className={styles.statLabel}>Baton Rouge</p>
              </div>
            )}
            {campusCounts["St. Tammany"] > 0 && (
              <div className={`${styles.statCard} ${styles.stTammany}`}>
                <p className={styles.statNumber}>{campusCounts["St. Tammany"]}</p>
                <p className={styles.statLabel}>St. Tammany</p>
              </div>
            )}
            {campusCounts.Other > 0 && (
              <div className={`${styles.statCard} ${styles.other}`}>
                <p className={styles.statNumber}>{campusCounts.Other}</p>
                <p className={styles.statLabel}>Other</p>
              </div>
            )}
          </div>
        )}

        {error && <div className={styles.errorBanner}>{error}</div>}

        <SectionHeading number="02" title="All rooms" level="section" />

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <Skeleton variant="tableRow" count={8} />
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><DoorOpen size={22} color="var(--green-700)" /></div>
              <h4>{roomList.length === 0 ? "No Rooms Yet" : "No Results"}</h4>
              <p>{roomList.length === 0 ? "Add your first room using the button above" : "No rooms match your search"}</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {([["roomNumber","Room Number"],["building","Building"],["campus","Campus"],["type","Type"],["capacity","Capacity"]] as const).map(([col, label]) => (
                      <th key={col} onClick={() => toggleSort(col)}>
                        {label}
                        <span className={`${styles.sortIcon} ${sortCol === col ? styles.sortIconActive : ""}`}>
                          {sortCol === col ? (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={11} />}
                        </span>
                      </th>
                    ))}
                    <th style={{ textAlign: "right", cursor: "default" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((room, idx) => (
                    <motion.tr
                      key={room.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.5), duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <td className={styles.roomNumber}>{room.roomNumber}</td>
                      <td>{room.building}</td>
                      <td>{room.campus}</td>
                      <td><span className={`${styles.typeBadge} ${TYPE_CLASS[room.type] || ""}`}>{room.type}</span></td>
                      <td className={styles.capacityCell}>{room.capacity}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className={`${styles.btnIcon} ${styles.edit}`} onClick={() => openEditModal(room)}>
                          <Pencil size={14} />
                        </button>
                        <button className={`${styles.btnIcon} ${styles.delete}`} onClick={() => setDeleteConfirm(room)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* add/edit room modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editRoom ? "Edit Room" : "Add Room"}
        subtitle={editRoom ? "Update room details" : "Add a new classroom, lab, or clinical site"}
        size="md"
        number={editRoom ? "EDIT" : "NEW"}
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSubmit}>
              {editRoom ? "Save Changes" : "Add Room"}
            </Button>
          </>
        }
      >
        {formError && <div className={styles.errorBanner} style={{ margin: "0 0 1rem" }}>{formError}</div>}
        <Input
          label="Room Number"
          required
          value={form.roomNumber}
          onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
          placeholder="e.g. 1005 or BRC-258"
          fullWidth
        />
        <Input
          label="Building"
          required
          value={form.building}
          onChange={(e) => setForm({ ...form, building: e.target.value })}
          placeholder="e.g. Nursing Building"
          fullWidth
        />
        <Input
          label="Campus"
          required
          value={form.campus}
          onChange={(e) => setForm({ ...form, campus: e.target.value })}
          placeholder="e.g. Hammond"
          fullWidth
        />
        <div className={styles.fieldRow}>
          <Select
            label="Room Type"
            options={ROOM_TYPE_OPTIONS}
            value={form.type}
            onChange={(val) => setForm({ ...form, type: val as RoomType })}
            fullWidth
          />
          <Input
            label="Capacity"
            type="number"
            min={1}
            value={String(form.capacity)}
            onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })}
            fullWidth
          />
        </div>
      </Modal>

      {/* delete confirmation modal */}
      <Modal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Room?"
        subtitle={deleteConfirm ? `${deleteConfirm.roomNumber} — ${deleteConfirm.building}` : ""}
        size="sm"
        number="ATTENTION"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}>
              Delete Room
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-on-paper-muted)", lineHeight: 1.6, margin: 0 }}>
          This action cannot be undone. The room will be removed from the catalog.
          If any sections currently use this room, they will be left without a room
          assignment and will need to be updated.
        </p>
      </Modal>

      {showImport && (
        <RoomImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); loadRooms(); addToast("success", "Rooms imported"); }}
        />
      )}
    </>
  );
}
