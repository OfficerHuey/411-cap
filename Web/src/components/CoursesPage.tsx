import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { courses as coursesApi } from "../Lib/api";
import type { Course, CourseType, CourseStats } from "../Lib/Types";
import { useToast } from "../Lib/ToastContext";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import type { SelectOption } from "./ui/Select";
import { HairlineRule } from "./ui/HairlineRule";
import { SectionHeading } from "./ui/SectionHeading";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { staggerContainer, cardVariants, physics } from "../Lib/motion";
import styles from "./CoursesPage.module.css";

const COURSE_TYPES: CourseType[] = ["Lecture", "Lab", "Clinical"];
const COURSE_TYPE_OPTIONS: SelectOption[] = COURSE_TYPES.map((t) => ({ value: t, label: t }));

const LEVEL_OPTIONS: SelectOption[] = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: `Semester ${n}`,
}));

const TYPE_CLASS: Record<CourseType, string> = {
  Lecture: styles.typeLecture,
  Lab: styles.typeLab,
  Clinical: styles.typeClinical,
};

const CARD_TYPE_CLASS: Record<CourseType, string> = {
  Lecture: styles.lecture,
  Lab: styles.lab,
  Clinical: styles.clinical,
};

interface CourseForm {
  code: string;
  name: string;
  semesterLevel: number;
  defaultType: CourseType;
  creditHours: number;
}

const emptyForm: CourseForm = {
  code: "",
  name: "",
  semesterLevel: 1,
  defaultType: "Lecture",
  creditHours: 3,
};

export function CoursesPage() {
  const { addToast } = useToast();
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const reduced = useReducedMotion();
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Course | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setBreadcrumbs([{ label: "Courses" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const [list, statData] = await Promise.all([
        coursesApi.getAll(),
        coursesApi.getStats(),
      ]);
      setCourseList(list);
      setStats(statData);
    } catch (err: any) {
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditCourse(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (course: Course) => {
    setEditCourse(course);
    setForm({
      code: course.code,
      name: course.name,
      semesterLevel: course.semesterLevel,
      defaultType: course.defaultType,
      creditHours: course.creditHours ?? 3,
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditCourse(null);
  };

  const handleSubmit = async () => {
    //validationbeforesubmit
    if (!form.code.trim() || !form.name.trim()) {
      setFormError("Course code and name are required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editCourse) {
        await coursesApi.update(editCourse.id, form);
      } else {
        await coursesApi.create(form);
      }
      closeModal();
      addToast("success", editCourse ? "Course updated" : "Course created");
      await loadCourses();
    } catch (err: any) {
      setFormError(err.message || "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await coursesApi.delete(id);
      setDeleteConfirm(null);
      addToast("success", "Course deleted");
      await loadCourses();
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete course");
      setDeleteConfirm(null);
    }
  };

  //typecountsfromstatsorfallbacktolocalcalc
  const typeCounts = useMemo(() => {
    const counts: Record<CourseType, number> = { Lecture: 0, Lab: 0, Clinical: 0 };
    if (stats) {
      stats.byType.forEach((t) => {
        if (t.type in counts) counts[t.type as CourseType] = t.count;
      });
    } else {
      courseList.forEach((c) => { counts[c.defaultType]++; });
    }
    return counts;
  }, [stats, courseList]);

  //filteredcoursesgroupedbylevel
  const filteredByLevel = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? courseList.filter((c) =>
          c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      : courseList;

    const grouped = new Map<number, Course[]>();
    filtered.forEach((c) => {
      if (!grouped.has(c.semesterLevel)) grouped.set(c.semesterLevel, []);
      grouped.get(c.semesterLevel)!.push(c);
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, list]) => ({ level, list }));
  }, [courseList, search]);

  const total = stats?.total ?? courseList.length;

  return (
    <>
      <div className={styles.root}>
        {/* editorial hero */}
        <div className={styles.hero}>
          <HairlineRule width="48px" color="gold" spacing="tight" />
          <h1 className={styles.heroTitle}>
            BSN <em>Curriculum</em>
          </h1>
          <p className={styles.heroSubtitle}>
            {total} course{total !== 1 ? "s" : ""} across 5 semesters
          </p>
          <div className={styles.heroActions}>
            <Button variant="primary" onClick={openAddModal}>
              <Plus size={16} />
              Add Course
            </Button>
          </div>
        </div>

        {/* type stat strip */}
        {total > 0 && (
          <div className={styles.statStrip}>
            <div className={`${styles.statCard} ${styles.lecture}`}>
              <p className={styles.statNumber}>{typeCounts.Lecture}</p>
              <p className={styles.statLabel}>Lectures</p>
            </div>
            <div className={`${styles.statCard} ${styles.lab}`}>
              <p className={styles.statNumber}>{typeCounts.Lab}</p>
              <p className={styles.statLabel}>Labs</p>
            </div>
            <div className={`${styles.statCard} ${styles.clinical}`}>
              <p className={styles.statNumber}>{typeCounts.Clinical}</p>
              <p className={styles.statLabel}>Clinicals</p>
            </div>
          </div>
        )}

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            placeholder="Search courses by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className={styles.empty}><span>Loading curriculum&hellip;</span></div>
        ) : filteredByLevel.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><BookOpen size={22} color="var(--green-700)" /></div>
            <h4>{courseList.length === 0 ? "No Courses Yet" : "No Results"}</h4>
            <p>
              {courseList.length === 0
                ? "Add your first course using the button above"
                : "No courses match your search"}
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            animate="visible"
          >
            {filteredByLevel.map(({ level, list }) => (
              <motion.section
                key={level}
                className={styles.levelSection}
                variants={cardVariants}
              >
                <div className={styles.levelHeader}>
                  <SectionHeading
                    number={String(level).padStart(2, "0")}
                    title={`Semester ${level}`}
                    level="section"
                  />
                  <span className={styles.levelCount}>
                    {list.length} course{list.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <motion.div
                  className={styles.courseGrid}
                  variants={staggerContainer(0.03)}
                  initial="hidden"
                  animate="visible"
                >
                  {list.map((course) => (
                    <motion.div
                      key={course.id}
                      className={`${styles.courseCard} ${CARD_TYPE_CLASS[course.defaultType]}`}
                      variants={cardVariants}
                      whileHover={reduced ? undefined : { y: -5, scale: 1.01, transition: physics.magnetic }}
                      whileTap={reduced ? undefined : { scale: 0.995, transition: physics.instant }}
                    >
                      <div className={styles.cardMain}>
                        <p className={styles.courseCode}>{course.code}</p>
                        <p className={styles.courseName}>{course.name}</p>
                      </div>

                      <div className={styles.cardMeta}>
                        <span className={`${styles.typeBadge} ${TYPE_CLASS[course.defaultType]}`}>
                          {course.defaultType}
                        </span>
                        {course.creditHours != null && (
                          <span className={styles.credits}>
                            {course.creditHours} cr
                          </span>
                        )}
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          className={`${styles.btnIcon} ${styles.edit}`}
                          onClick={() => openEditModal(course)}
                          aria-label={`Edit ${course.code}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className={`${styles.btnIcon} ${styles.delete}`}
                          onClick={() => setDeleteConfirm(course)}
                          aria-label={`Delete ${course.code}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            ))}
          </motion.div>
        )}
      </div>

      {/* add/edit course modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editCourse ? "Edit Course" : "Add Course"}
        subtitle={editCourse ? "Update course details" : "Add a new course to the curriculum"}
        size="md"
        number={editCourse ? "EDIT" : "NEW"}
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSubmit}>
              {editCourse ? "Save Changes" : "Add Course"}
            </Button>
          </>
        }
      >
        {formError && <div className={styles.errorBanner} style={{ margin: "0 0 1rem" }}>{formError}</div>}
        <Input
          label="Course Code"
          required
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="e.g. N3390"
          fullWidth
        />
        <Input
          label="Course Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Health Assessment"
          fullWidth
        />
        <div className={styles.fieldRow}>
          <Select
            label="Semester Level"
            options={LEVEL_OPTIONS}
            value={String(form.semesterLevel)}
            onChange={(val) => setForm({ ...form, semesterLevel: parseInt(val, 10) })}
            fullWidth
          />
          <Select
            label="Course Type"
            options={COURSE_TYPE_OPTIONS}
            value={form.defaultType}
            onChange={(val) => setForm({ ...form, defaultType: val as CourseType })}
            fullWidth
          />
        </div>
        <Input
          label="Credit Hours"
          type="number"
          min={0}
          max={12}
          value={String(form.creditHours)}
          onChange={(e) => setForm({ ...form, creditHours: parseInt(e.target.value) || 0 })}
          fullWidth
        />
      </Modal>

      {/* delete confirmation modal */}
      <Modal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Course?"
        subtitle={deleteConfirm ? `${deleteConfirm.code} — ${deleteConfirm.name}` : ""}
        size="sm"
        number="ATTENTION"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}>
              Delete Course
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-on-paper-muted)", lineHeight: 1.6, margin: 0 }}>
          This action cannot be undone. The course will be removed from the curriculum.
          If any sections currently reference this course, the delete will be blocked until
          those sections are removed.
        </p>
      </Modal>
    </>
  );
}
