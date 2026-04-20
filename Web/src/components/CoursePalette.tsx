import { authService } from "../Lib/Auth";
import type { Course } from "../Lib/Types";
import { courseTypeColor } from "../Lib/Types";
import { useDrag } from "react-dnd";
import { useRef, useState } from "react";
import { Search, GripVertical } from "lucide-react";
import { NumberBadge } from "./ui/NumberBadge";
import styles from "./CoursePalette.module.css";

interface CoursePaletteProps {
  courses: Course[];
}

function DraggableCourse({ course }: { course: Course }) {
  const canEdit = authService.canEdit();
  const elementRef = useRef<HTMLDivElement>(null);
  const color = courseTypeColor(course.defaultType);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "course",
    item: {
      courseId: course.id,
      courseCode: course.code,
      courseType: course.defaultType,
    },
    canDrag: canEdit,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  drag(elementRef);

  return (
    <div
      ref={elementRef}
      className={`${styles.pill} ${isDragging ? styles.dragging : ""}`}
      style={{
        borderLeft: `3px solid ${color}`,
        cursor: canEdit ? "grab" : "not-allowed",
      }}
    >
      <div className={styles.pillDot} style={{ backgroundColor: color }} />
      <div className={styles.pillBody}>
        <div className={styles.pillCode}>{course.code}</div>
        <div className={styles.pillType}>{course.defaultType}</div>
      </div>
      <GripVertical size={12} className={styles.pillGrip} />
    </div>
  );
}

export function CoursePalette({ courses }: CoursePaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = courses.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  const lectures = filtered.filter((c) => c.defaultType === "Lecture");
  const labs = filtered.filter((c) => c.defaultType === "Lab");
  const clinicals = filtered.filter((c) => c.defaultType === "Clinical");

  const PaletteSection = ({ label, items }: { label: string; items: Course[] }) => (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>{label}</span>
        <span className={styles.sectionCount}>{items.length}</span>
      </div>
      <div className={styles.sectionList}>
        {items.map((course) => (
          <DraggableCourse key={course.id} course={course} />
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <NumberBadge number="01" variant="gold" size="sm" />
          <span className={styles.headerSummary}>
            <span className={styles.headerSummaryNum}>{filtered.length}</span>
            <span className={styles.headerSummaryLabel}>
              {filtered.length === 1 ? "course" : "courses"}
            </span>
          </span>
        </div>
        <h3 className={styles.headerTitle}>Course Palette</h3>
        <p className={styles.headerSubtitle}>Drag onto the calendar</p>
      </div>

      <div className={styles.search}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Filter courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.body}>
        {filtered.length === 0 && (
          <p className={styles.empty}>
            {searchQuery ? "No courses match your filter" : "No courses available"}
          </p>
        )}
        {lectures.length > 0 && <PaletteSection label="Lectures" items={lectures} />}
        {labs.length > 0 && <PaletteSection label="Labs" items={labs} />}
        {clinicals.length > 0 && <PaletteSection label="Clinicals" items={clinicals} />}
      </div>
    </div>
  );
}
