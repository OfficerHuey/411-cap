import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, Search, GraduationCap } from "lucide-react";
import { students as studentsApi, semesters as semestersApi } from "../Lib/api";
import type { StudentListItem, StudentStats, Semester } from "../Lib/Types";
import { useToast } from "../Lib/ToastContext";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import type { SelectOption } from "./ui/Select";
import { NumberBadge } from "./ui/NumberBadge";
import { HairlineRule } from "./ui/HairlineRule";
import { EmptyState } from "./ui/EmptyState";
import { StudentDetailPanel } from "./StudentDetailPanel";
import styles from "./StudentsPage.module.css";

const ALL = "__all__";

const LEVEL_OPTIONS: SelectOption[] = [
  { value: ALL, label: "All levels" },
  ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `Semester ${n}` })),
];

export function StudentsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setItems: setBreadcrumbs } = useBreadcrumbs();

  const [list, setList] = useState<StudentListItem[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [semesterOptions, setSemesterOptions] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<StudentListItem | null>(null);
  const [detailStudentId, setDetailStudentId] = useState<number | null>(null);

  //filters
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string>(ALL);
  const [levelFilter, setLevelFilter] = useState<string>(ALL);
  const [campusFilter, setCampusFilter] = useState<string>(ALL);

  useEffect(() => {
    setBreadcrumbs([{ label: "Students" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  //debouncethesearchinput
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  //loadsemesterlistonceforthedropdown
  useEffect(() => {
    semestersApi.getAll().then(setSemesterOptions).catch(() => { /* ignore */ });
    loadStats();
  }, []);

  //reloadonfilterchanges
  useEffect(() => {
    loadStudents();
  }, [debouncedSearch, semesterFilter, levelFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentsApi.getAll({
        search: debouncedSearch || undefined,
        semesterId: semesterFilter !== ALL ? parseInt(semesterFilter, 10) : undefined,
        semesterLevel: levelFilter !== ALL ? parseInt(levelFilter, 10) : undefined,
      });
      setList(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await studentsApi.getStats();
      setStats(s);
    } catch {
      //statsarenonblocking
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await studentsApi.delete(id);
      setDeleteConfirm(null);
      addToast("success", "Student deleted");
      await Promise.all([loadStudents(), loadStats()]);
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete student");
      setDeleteConfirm(null);
    }
  };

  //semesterfilteroptionsfromtheloadedlist
  const semesterFilterOptions: SelectOption[] = useMemo(
    () => [
      { value: ALL, label: "All semesters" },
      ...semesterOptions.map((s) => ({ value: String(s.id), label: s.name })),
    ],
    [semesterOptions],
  );

  //derivecampusoptionsfromthestatsorthecurrentlist
  const campusFilterOptions: SelectOption[] = useMemo(() => {
    const source = stats?.byCampus.map((c) => c.campus).filter(Boolean) ?? [];
    const unique = Array.from(new Set(source));
    return [
      { value: ALL, label: "All campuses" },
      ...unique.map((c) => ({ value: c, label: c })),
    ];
  }, [stats]);

  //campusfilteringisclientsideforsimplicity
  const filtered = useMemo(() => {
    if (campusFilter === ALL) return list;
    return list.filter((s) => s.campus === campusFilter);
  }, [list, campusFilter]);

  const total = stats?.total ?? 0;
  const levelCount = stats?.byLevel.length ?? 0;

  return (
    <>
      <div className={styles.root}>
        {/* editorial hero */}
        <div className={styles.hero}>
          <NumberBadge number="01" variant="gold" size="sm" />
          <HairlineRule width="48px" color="gold" spacing="tight" />
          <h1 className={styles.heroTitle}>
            Student <em>Directory</em>
          </h1>
          <p className={styles.heroSubtitle}>
            {total} student{total !== 1 ? "s" : ""} enrolled across {levelCount} semester level{levelCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* stat strip */}
        {stats && total > 0 && (
          <motion.div
            className={styles.statStrip}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            <motion.div
              className={`${styles.statCard} ${styles.total}`}
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            >
              <p className={styles.statNumber}>{stats.total}</p>
              <p className={styles.statLabel}>Total</p>
            </motion.div>

            {stats.byLevel.map((lvl) => (
              <motion.div
                key={lvl.level}
                className={styles.statCard}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              >
                <p className={styles.statNumber}>{lvl.count}</p>
                <p className={styles.statLabel}>Semester {lvl.level}</p>
              </motion.div>
            ))}

            {stats.byCampus.map((c) => (
              <motion.div
                key={c.campus}
                className={`${styles.statCard} ${styles.campus}`}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              >
                <p className={styles.statNumber}>{c.count}</p>
                <p className={styles.statLabel}>{c.campus}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.search}
              placeholder="Search name, W#, or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <Select
            options={semesterFilterOptions}
            value={semesterFilter}
            onChange={setSemesterFilter}
            fullWidth
          />

          <Select
            options={LEVEL_OPTIONS}
            value={levelFilter}
            onChange={setLevelFilter}
            fullWidth
          />

          <Select
            options={campusFilterOptions}
            value={campusFilter}
            onChange={setCampusFilter}
            fullWidth
          />
        </div>

        <p className={styles.resultCount}>
          Showing {filtered.length} of {total} student{total !== 1 ? "s" : ""}
        </p>

        {/* table */}
        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.empty}>Loading students&hellip;</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "1.5rem" }}>
              <EmptyState
                icon={<GraduationCap size={32} />}
                title="No students found"
                description={
                  debouncedSearch
                    ? `No results for "${debouncedSearch}". Try a different search.`
                    : "No students have been added to any schedule group yet."
                }
                size="md"
              />
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>W#</th>
                    <th>Email</th>
                    <th>Schedule</th>
                    <th>Semester</th>
                    <th>Campus</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student, idx) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.4), duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <td
                        className={styles.nameCell}
                        onClick={() => setDetailStudentId(student.id)}
                      >
                        {student.name}
                      </td>
                      <td className={styles.wnumber}>{student.wNumber}</td>
                      <td>
                        {student.email ? (
                          <a className={styles.email} href={`mailto:${student.email}`}>
                            {student.email}
                          </a>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td>
                        {student.scheduleId && student.scheduleName ? (
                          <button
                            className={styles.scheduleLink}
                            onClick={() => navigate(`/schedule-builder/${student.scheduleId}`)}
                          >
                            {student.scheduleName}
                          </button>
                        ) : (
                          <span className={styles.muted}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        {student.semesterLevel != null ? (
                          <span className={styles.levelBadge}>Semester {student.semesterLevel}</span>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td>
                        {student.campus ? (
                          <span className={styles.campusPill}>{student.campus}</span>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          className={`${styles.btnIcon} ${styles.view}`}
                          onClick={() => setDetailStudentId(student.id)}
                          aria-label={`View ${student.name}`}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className={`${styles.btnIcon} ${styles.delete}`}
                          onClick={() => setDeleteConfirm(student)}
                          aria-label={`Delete ${student.name}`}
                        >
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

      <StudentDetailPanel
        isOpen={detailStudentId != null}
        onClose={() => setDetailStudentId(null)}
        studentId={detailStudentId}
      />

      <Modal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Student?"
        subtitle={deleteConfirm ? `${deleteConfirm.name} — ${deleteConfirm.wNumber}` : ""}
        size="sm"
        number="ATTENTION"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}>
              Delete Student
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-on-paper-muted)", lineHeight: 1.6, margin: 0 }}>
          This will remove the student from their schedule group. This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
