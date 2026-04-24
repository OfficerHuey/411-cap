import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, GraduationCap, Upload } from "lucide-react";
import { instructors as instructorsApi } from "../Lib/api";
import type { Instructor, InstructorType } from "../Lib/Types";
import { useToast } from "../Lib/ToastContext";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import type { SelectOption } from "./ui/Select";
import { HairlineRule } from "./ui/HairlineRule";
import { SectionHeading } from "./ui/SectionHeading";
import { InstructorImportModal } from "./Imports/InstructorImportModal";
import { Skeleton } from "./ui/Skeleton";
import styles from "./InstructorsPage.module.css";

const INSTRUCTOR_TYPES: InstructorType[] = ["FullTime", "Adjunct", "Overload"];
const INSTRUCTOR_TYPE_OPTIONS: SelectOption[] = INSTRUCTOR_TYPES.map((t) => ({
  value: t,
  label: t === "FullTime" ? "Full Time" : t,
}));

const TYPE_CLASS: Record<string, string> = {
  FullTime: styles.typeFullTime,
  Adjunct: styles.typeAdjunct,
  Overload: styles.typeOverload,
};

const typeLabel = (t: InstructorType) => (t === "FullTime" ? "Full Time" : t);

export function InstructorsPage() {
  const { addToast } = useToast();
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const [list, setList] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editInst, setEditInst] = useState<Instructor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Instructor | null>(null);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showImport, setShowImport] = useState(false);

  //form state for add/edit modal
  const [form, setForm] = useState({ name: "", email: "", type: "FullTime" as InstructorType });
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
    setBreadcrumbs([{ label: "Instructors" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

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

  const openAddModal = () => {
    setEditInst(null);
    setForm({ name: "", email: "", type: "FullTime" });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (inst: Instructor) => {
    setEditInst(inst);
    setForm({ name: inst.name, email: inst.email || "", type: inst.type });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditInst(null);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFormError("");
    try {
      if (editInst) {
        await instructorsApi.update(editInst.id, form);
      } else {
        await instructorsApi.create(form);
      }
      closeModal();
      addToast("success", editInst ? "Instructor updated" : "Instructor created");
      await loadInstructors();
    } catch (err: any) {
      setFormError(err.message || "Failed to save instructor");
    } finally {
      setSaving(false);
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

  const typeCounts = useMemo(() => {
    const counts = { FullTime: 0, Adjunct: 0, Overload: 0 };
    list.forEach((i) => {
      if (counts[i.type as keyof typeof counts] !== undefined) {
        counts[i.type as keyof typeof counts]++;
      }
    });
    return counts;
  }, [list]);

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

  return (
    <>
      <div className={styles.root}>
        {/* editorial hero */}
        <div className={styles.hero}>
          <HairlineRule width="48px" color="gold" spacing="tight" />
          <h1 className={styles.heroTitle}>
            Faculty & <em>Instructors</em>
          </h1>
          <p className={styles.heroSubtitle}>
            {list.length} faculty member{list.length !== 1 ? "s" : ""}
            {typeCounts.FullTime > 0 && ` · ${typeCounts.FullTime} full-time`}
            {typeCounts.Adjunct > 0 && ` · ${typeCounts.Adjunct} adjunct`}
            {typeCounts.Overload > 0 && ` · ${typeCounts.Overload} overload`}
          </p>
          <div className={styles.heroActions}>
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload size={16} />
              Import
            </Button>
            <Button variant="primary" onClick={openAddModal}>
              <Plus size={16} />
              Add Instructor
            </Button>
          </div>
        </div>

        {/* faculty type stat strip — signature element */}
        {list.length > 0 && (
          <div className={styles.statStrip}>
            {typeCounts.FullTime > 0 && (
              <div className={`${styles.statCard} ${styles.fullTime}`}>
                <p className={styles.statNumber}>{typeCounts.FullTime}</p>
                <p className={styles.statLabel}>Full Time</p>
              </div>
            )}
            {typeCounts.Adjunct > 0 && (
              <div className={`${styles.statCard} ${styles.adjunct}`}>
                <p className={styles.statNumber}>{typeCounts.Adjunct}</p>
                <p className={styles.statLabel}>Adjunct</p>
              </div>
            )}
            {typeCounts.Overload > 0 && (
              <div className={`${styles.statCard} ${styles.overload}`}>
                <p className={styles.statNumber}>{typeCounts.Overload}</p>
                <p className={styles.statLabel}>Overload</p>
              </div>
            )}
          </div>
        )}

        {error && <div className={styles.errorBanner}>{error}</div>}

        <SectionHeading number="02" title="All instructors" level="section" />

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            placeholder="Search instructors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <Skeleton variant="tableRow" count={8} />
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><GraduationCap size={22} color="var(--green-700)" /></div>
              <h4>{list.length === 0 ? "No Instructors Yet" : "No Results"}</h4>
              <p>{list.length === 0 ? "Add your first instructor using the button above" : "No instructors match your search"}</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
              <thead>
                <tr>
                  {([["name","Name"],["email","Email"],["type","Type"]] as const).map(([col, label]) => (
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
                {filtered.map((inst, idx) => (
                  <motion.tr
                    key={inst.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.5), duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <td className={styles.nameCell}>{inst.name}</td>
                    <td className={styles.emailCell}>{inst.email || "\u2014"}</td>
                    <td><span className={`${styles.typeBadge} ${TYPE_CLASS[inst.type] || ""}`}>{typeLabel(inst.type)}</span></td>
                    <td style={{ textAlign: "right" }}>
                      <button className={`${styles.btnIcon} ${styles.edit}`} onClick={() => openEditModal(inst)}>
                        <Pencil size={14} />
                      </button>
                      <button className={`${styles.btnIcon} ${styles.delete}`} onClick={() => setDeleteConfirm(inst)}>
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

      {/* add/edit instructor modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editInst ? "Edit Instructor" : "Add Instructor"}
        subtitle={editInst ? "Update instructor details" : "Add a new faculty or adjunct instructor"}
        size="md"
        number={editInst ? "EDIT" : "NEW"}
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSubmit}>
              {editInst ? "Save Changes" : "Add Instructor"}
            </Button>
          </>
        }
      >
        {formError && <div className={styles.errorBanner} style={{ margin: "0 0 1rem" }}>{formError}</div>}
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Full name"
          fullWidth
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="email@selu.edu"
          fullWidth
        />
        <Select
          label="Type"
          options={INSTRUCTOR_TYPE_OPTIONS}
          value={form.type}
          onChange={(val) => setForm({ ...form, type: val as InstructorType })}
          fullWidth
        />
      </Modal>

      {/* delete confirmation modal */}
      <Modal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Instructor?"
        subtitle={deleteConfirm ? deleteConfirm.name : ""}
        size="sm"
        number="ATTENTION"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}>
              Delete Instructor
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-on-paper-muted)", lineHeight: 1.6, margin: 0 }}>
          This action cannot be undone. The instructor will be removed from the system.
          If any sections currently reference this instructor, they will be left without
          an instructor assignment and will need to be updated.
        </p>
      </Modal>

      {showImport && (
        <InstructorImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); loadInstructors(); addToast("success", "Instructors imported"); }}
        />
      )}
    </>
  );
}
