import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { semesters as semestersApi, schedules as schedulesApi } from "../Lib/api";
import type { Semester, Schedule } from "../Lib/Types";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { physics, cardVariants, staggerContainer } from "../Lib/motion";
import { useAsyncData } from "../hooks/useAsyncData";
import { Skeleton } from "./ui/Skeleton";
import { EmptyState } from "./ui/EmptyState";
import styles from "./ScheduleGroupsOverviewPage.module.css";

interface SemesterBundle {
  semester: Semester;
  schedules: Schedule[];
}

function splitSeasonWord(name: string) {
  const seasons = ["Spring", "Fall", "Summer", "Winter"];
  for (const s of seasons) {
    const idx = name.indexOf(s);
    if (idx !== -1) return { before: name.slice(0, idx), season: s, after: name.slice(idx + s.length) };
  }
  return null;
}

export function ScheduleGroupsOverviewPage() {
  const navigate = useNavigate();
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const reduced = useReducedMotion();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard", href: "/" }, { label: "Schedule Groups" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  //load active semesters and their schedule groups in parallel
  const { state } = useAsyncData<SemesterBundle[]>(async () => {
    const list = await semestersApi.getAll();
    const active = list.filter((s) => !s.isLocked);
    return await Promise.all(
      active.map(async (semester) => {
        try {
          const schedules = await schedulesApi.getBySemester(semester.id);
          return { semester, schedules };
        } catch {
          return { semester, schedules: [] };
        }
      }),
    );
  }, []);

  const loading = state.status === "loading" || state.status === "idle";
  const bundles: SemesterBundle[] = state.status === "success" ? state.data : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bundles;
    return bundles
      .map((b) => ({
        ...b,
        schedules: b.schedules.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            b.semester.name.toLowerCase().includes(q) ||
            (s.locationDisplay?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter((b) => b.schedules.length > 0);
  }, [bundles, search]);

  const totalGroups = bundles.reduce((sum, b) => sum + b.schedules.length, 0);
  const visibleGroups = filtered.reduce((sum, b) => sum + b.schedules.length, 0);

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Schedule <em>Groups</em>
        </h1>
        <p className={styles.heroSubtitle}>
          {loading
            ? "Loading…"
            : `${totalGroups} schedule group${totalGroups !== 1 ? "s" : ""} across ${bundles.length} active semester${bundles.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by group name, semester, or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="custom" height="130px" />
          ))}
        </div>
      ) : visibleGroups === 0 ? (
        <EmptyState
          title={search ? "No groups match your search" : "No schedule groups yet"}
          description={
            search
              ? "Try a different search term."
              : "Create a schedule group from inside an active semester to get started."
          }
          size="md"
        />
      ) : (
        <>
          {filtered.map((bundle) => {
            const parts = splitSeasonWord(bundle.semester.name);
            const isCollapsed = collapsed[bundle.semester.id] ?? false;
            return (
              <section key={bundle.semester.id} className={styles.group}>
                <div
                  className={styles.groupHeader}
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [bundle.semester.id]: !isCollapsed,
                    }))
                  }
                  role="button"
                  tabIndex={0}
                  aria-expanded={!isCollapsed}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCollapsed((prev) => ({
                        ...prev,
                        [bundle.semester.id]: !isCollapsed,
                      }));
                    }
                  }}
                >
                  <h2 className={styles.groupTitle}>
                    <ChevronRight
                      size={18}
                      className={`${styles.groupChevron} ${!isCollapsed ? styles.groupChevronOpen : ""}`}
                    />
                    {parts ? (
                      <>
                        {parts.before}
                        <em>{parts.season}</em>
                        {parts.after}
                      </>
                    ) : (
                      bundle.semester.name
                    )}
                  </h2>
                  <span className={styles.groupCount}>
                    {bundle.schedules.length} group{bundle.schedules.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {!isCollapsed && (
                  <motion.div
                    className={styles.grid}
                    variants={reduced ? undefined : staggerContainer(0.04)}
                    initial="hidden"
                    animate="visible"
                  >
                    {bundle.schedules.map((schedule, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const studentCount = schedule.students?.length ?? 0;
                      const sectionCount = schedule.sections?.length ?? 0;
                      return (
                        <motion.div
                          key={schedule.id}
                          className={styles.card}
                          variants={reduced ? undefined : cardVariants}
                          whileHover={reduced ? undefined : { y: -5, scale: 1.01, transition: physics.magnetic }}
                          whileTap={reduced ? undefined : { scale: 0.995, transition: physics.instant }}
                          onClick={() => navigate(`/schedule-builder/${schedule.id}`)}
                        >
                          <div className={styles.cardTopRow}>
                            <span className={styles.cardLetter}>{letter}</span>
                            <span className={styles.cardStatusBadge}>Active</span>
                          </div>
                          <h3 className={styles.cardTitle}>{schedule.name}</h3>
                          <p className={styles.cardSemester}>
                            Semester {schedule.semesterLevel}
                            {schedule.locationDisplay ? ` · ${schedule.locationDisplay}` : ""}
                          </p>
                          <div className={styles.cardFooter}>
                            <div className={styles.cardStat}>
                              <span className={styles.cardStatValue}>{sectionCount}</span>
                              <span className={styles.cardStatLabel}>Sections</span>
                            </div>
                            <div className={styles.cardStat}>
                              <span className={styles.cardStatValue}>{studentCount}</span>
                              <span className={styles.cardStatLabel}>Students</span>
                            </div>
                            <div className={styles.cardStat}>
                              <span className={styles.cardStatValue}>{schedule.capacity || "—"}</span>
                              <span className={styles.cardStatLabel}>Capacity</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
