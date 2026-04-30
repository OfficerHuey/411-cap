import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, AlertTriangle, CheckCircle2, UsersRound } from "lucide-react";
import { semesters as semestersApi, schedules as schedulesApi } from "../Lib/api";
import type { Semester, Schedule } from "../Lib/Types";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { physics, cardVariants, staggerContainer } from "../Lib/motion";
import { useAsyncData } from "../hooks/useAsyncData";
import { Skeleton } from "./ui/Skeleton";
import styles from "./AttentionPage.module.css";

type Severity = "error" | "warning";

interface Issue {
  id: string;
  severity: Severity;
  scheduleId: number;
  scheduleName: string;
  title: string;
  description: string;
}

interface SemesterIssues {
  semester: Semester;
  issues: Issue[];
}

function splitSeasonWord(name: string) {
  const seasons = ["Spring", "Fall", "Summer", "Winter"];
  for (const s of seasons) {
    const idx = name.indexOf(s);
    if (idx !== -1) return { before: name.slice(0, idx), season: s, after: name.slice(idx + s.length) };
  }
  return null;
}

//derive issues from schedule-level data. over-capacity maps to error,
//near-capacity (>=80% of capacity) maps to warning. this matches the
//dashboard's "attention" count logic which flags schedules at/over capacity
function buildIssuesFromSchedule(schedule: Schedule): Issue[] {
  const issues: Issue[] = [];
  const studentCount = schedule.students?.length ?? 0;
  const capacity = schedule.capacity ?? 0;

  if (capacity > 0) {
    if (studentCount > capacity) {
      issues.push({
        id: `over-${schedule.id}`,
        severity: "error",
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        title: `${schedule.name} is over capacity`,
        description: `${studentCount} students rostered on a ${capacity}-seat group (${studentCount - capacity} over).`,
      });
    } else if (studentCount === capacity) {
      issues.push({
        id: `full-${schedule.id}`,
        severity: "warning",
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        title: `${schedule.name} is at capacity`,
        description: `${studentCount}/${capacity} seats filled — no room for additional students.`,
      });
    } else if (studentCount / capacity >= 0.9) {
      issues.push({
        id: `near-${schedule.id}`,
        severity: "warning",
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        title: `${schedule.name} is nearly full`,
        description: `${studentCount}/${capacity} seats filled (${Math.round((studentCount / capacity) * 100)}%).`,
      });
    }
  }

  //empty schedule groups also warrant attention — they may have been
  //created but not yet populated
  if (schedule.sections && schedule.sections.length === 0 && capacity > 0) {
    issues.push({
      id: `empty-${schedule.id}`,
      severity: "warning",
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      title: `${schedule.name} has no sections scheduled`,
      description: `The schedule exists but no class sections have been placed on the calendar yet.`,
    });
  }

  return issues;
}

export function AttentionPage() {
  const navigate = useNavigate();
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const reduced = useReducedMotion();

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard", href: "/" }, { label: "Attention" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { state } = useAsyncData<SemesterIssues[]>(async () => {
    const list = await semestersApi.getAll();
    const active = list.filter((s) => !s.isLocked);
    const groups = await Promise.all(
      active.map(async (semester) => {
        try {
          const schedules = await schedulesApi.getBySemester(semester.id);
          const issues = schedules.flatMap(buildIssuesFromSchedule);
          return { semester, issues };
        } catch {
          return { semester, issues: [] };
        }
      }),
    );
    //only keep semesters that actually have issues
    return groups.filter((g) => g.issues.length > 0);
  }, []);

  const loading = state.status === "loading" || state.status === "idle";
  const semesterGroups: SemesterIssues[] = state.status === "success" ? state.data : [];

  const counts = useMemo(() => {
    const all = semesterGroups.flatMap((g) => g.issues);
    return {
      total: all.length,
      errors: all.filter((i) => i.severity === "error").length,
      warnings: all.filter((i) => i.severity === "warning").length,
      affectedSemesters: semesterGroups.length,
    };
  }, [semesterGroups]);

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Attention <em>Needed</em>
        </h1>
        <p className={styles.heroSubtitle}>
          {loading
            ? "Scanning active semesters…"
            : counts.total === 0
              ? "All active semesters look healthy. Nothing needs review right now."
              : `${counts.total} issue${counts.total !== 1 ? "s" : ""} across ${counts.affectedSemesters} semester${counts.affectedSemesters !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div className={styles.list}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="custom" height="64px" />
          ))}
        </div>
      ) : counts.total === 0 ? (
        <div className={styles.allClear}>
          <div className={styles.allClearIcon}>
            <CheckCircle2 size={32} strokeWidth={2.2} />
          </div>
          <h2 className={styles.allClearTitle}>All clear</h2>
          <p className={styles.allClearDescription}>
            No capacity issues, unfilled rosters, or empty schedule groups detected
            across your active semesters.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{counts.errors}</div>
              <div className={styles.summaryLabel}>Errors</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{counts.warnings}</div>
              <div className={styles.summaryLabel}>Warnings</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{counts.affectedSemesters}</div>
              <div className={styles.summaryLabel}>Semesters affected</div>
            </div>
          </div>

          {semesterGroups.map((group) => {
            const parts = splitSeasonWord(group.semester.name);
            return (
              <section key={group.semester.id} className={styles.group}>
                <div className={styles.groupHeader}>
                  <h2 className={styles.groupTitle}>
                    {parts ? (
                      <>
                        {parts.before}
                        <em>{parts.season}</em>
                        {parts.after}
                      </>
                    ) : (
                      group.semester.name
                    )}
                  </h2>
                  <span className={styles.groupCount}>
                    {group.issues.length} issue{group.issues.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <motion.div
                  className={styles.list}
                  variants={reduced ? undefined : staggerContainer(0.04)}
                  initial="hidden"
                  animate="visible"
                >
                  {group.issues.map((issue) => {
                    const IconComponent =
                      issue.severity === "error" ? AlertTriangle : UsersRound;
                    return (
                      <motion.div
                        key={issue.id}
                        className={`${styles.issue} ${issue.severity === "warning" ? styles.issueWarning : ""}`}
                        variants={reduced ? undefined : cardVariants}
                        whileHover={reduced ? undefined : { y: -3, scale: 1.005, transition: physics.magnetic }}
                        whileTap={reduced ? undefined : { scale: 0.998, transition: physics.instant }}
                        onClick={() => navigate(`/schedule-builder/${issue.scheduleId}`)}
                      >
                        <div className={styles.issueMain}>
                          <span
                            className={`${styles.issueIcon} ${
                              issue.severity === "error"
                                ? styles.issueIconError
                                : styles.issueIconWarning
                            }`}
                          >
                            <IconComponent size={18} strokeWidth={2} />
                          </span>
                          <div className={styles.issueText}>
                            <p className={styles.issueTitle}>{issue.title}</p>
                            <p className={styles.issueDescription}>
                              {issue.description}
                            </p>
                          </div>
                        </div>
                        <span className={styles.issueJump}>
                          Jump to builder
                          <ArrowRight size={14} />
                        </span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
