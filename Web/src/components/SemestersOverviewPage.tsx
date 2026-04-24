import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { semesters as semestersApi, schedules as schedulesApi } from "../Lib/api";
import type { Semester } from "../Lib/Types";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { physics, cardVariants, staggerContainer } from "../Lib/motion";
import { useAsyncData } from "../hooks/useAsyncData";
import { Skeleton } from "./ui/Skeleton";
import { EmptyState } from "./ui/EmptyState";
import styles from "./SemestersOverviewPage.module.css";

type Filter = "all" | "active" | "archived";

interface SemesterRow {
  semester: Semester;
  scheduleCount: number;
  studentCount: number;
}

function splitSeasonWord(name: string) {
  const seasons = ["Spring", "Fall", "Summer", "Winter"];
  for (const s of seasons) {
    const idx = name.indexOf(s);
    if (idx !== -1) return { before: name.slice(0, idx), season: s, after: name.slice(idx + s.length) };
  }
  return null;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const e = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${s} – ${e}`;
}

export function SemestersOverviewPage() {
  const navigate = useNavigate();
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard", href: "/" }, { label: "Semesters" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  //load all semesters + per-semester schedule+student counts in parallel
  const { state } = useAsyncData<SemesterRow[]>(async () => {
    const list = await semestersApi.getAll();
    return await Promise.all(
      list.map(async (semester) => {
        try {
          const schedules = await schedulesApi.getBySemester(semester.id);
          const studentCount = schedules.reduce((sum, s) => sum + (s.students?.length || 0), 0);
          return { semester, scheduleCount: schedules.length, studentCount };
        } catch {
          return { semester, scheduleCount: 0, studentCount: 0 };
        }
      }),
    );
  }, []);

  const loading = state.status === "loading" || state.status === "idle";
  const rows: SemesterRow[] = state.status === "success" ? state.data : [];

  const activeCount = rows.filter((r) => !r.semester.isLocked).length;
  const archivedCount = rows.filter((r) => r.semester.isLocked).length;

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((r) => !r.semester.isLocked);
    if (filter === "archived") return rows.filter((r) => r.semester.isLocked);
    return rows;
  }, [rows, filter]);

  return (
    <div className={styles.root}>
      {/* hero */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          All <em>Semesters</em>
        </h1>
        <p className={styles.heroSubtitle}>
          {loading
            ? "Loading…"
            : `${rows.length} total · ${activeCount} active · ${archivedCount} archived`}
        </p>
      </div>

      {/* filter toggle */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === "all" ? styles.filterBtnActive : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({rows.length})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "active" ? styles.filterBtnActive : ""}`}
          onClick={() => setFilter("active")}
        >
          Active ({activeCount})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "archived" ? styles.filterBtnActive : ""}`}
          onClick={() => setFilter("archived")}
        >
          Archived ({archivedCount})
        </button>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="custom" height="160px" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No semesters match this filter"
          description={
            filter === "archived"
              ? "Archived semesters appear here when you lock a semester on the Dashboard."
              : "Create a new semester from the Dashboard to get started."
          }
          size="md"
        />
      ) : (
        <motion.div
          className={styles.grid}
          variants={reduced ? undefined : staggerContainer(0.05)}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((row) => {
            const parts = splitSeasonWord(row.semester.name);
            const archived = row.semester.isLocked;
            return (
              <motion.div
                key={row.semester.id}
                className={styles.card}
                variants={reduced ? undefined : cardVariants}
                whileHover={reduced ? undefined : { y: -5, scale: 1.01, transition: physics.magnetic }}
                whileTap={reduced ? undefined : { scale: 0.995, transition: physics.instant }}
                onClick={() =>
                  navigate(archived ? "/archive" : `/semester/${row.semester.id}`)
                }
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    {parts ? (
                      <>
                        {parts.before}
                        <em>{parts.season}</em>
                        {parts.after}
                      </>
                    ) : (
                      row.semester.name
                    )}
                  </h3>
                  <span
                    className={`${styles.statusPill} ${
                      archived ? styles.statusArchived : styles.statusActive
                    }`}
                  >
                    {archived && <Lock size={10} />}
                    {archived ? "Archived" : "Active"}
                  </span>
                </div>
                <div className={styles.cardDate}>
                  {formatDateRange(row.semester.startDate, row.semester.endDate)}
                </div>
                {row.semester.clinicalDays && (
                  <span className={styles.rotationBadge}>
                    {row.semester.clinicalDays}
                  </span>
                )}
                <div className={styles.cardMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>{row.scheduleCount}</span>
                    <span className={styles.metricLabel}>Schedule groups</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>{row.studentCount}</span>
                    <span className={styles.metricLabel}>Students</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>
                      {row.semester.clinicalDays ? "✓" : "—"}
                    </span>
                    <span className={styles.metricLabel}>Rotation</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
