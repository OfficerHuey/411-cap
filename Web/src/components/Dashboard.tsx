import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { CreateSemesterModal } from "./CreateSemesterModal";
import { CloneSemesterModal } from "./CloneSemesterModal";
import { Plus, Calendar, Trash2, Unlock, Copy, ChevronRight } from "lucide-react";
import { authService } from "../Lib/Auth";
import { semesters as semestersApi, schedules as schedulesApi } from "../Lib/api";
import type { Semester } from "../Lib/Types";
import { useNavigate } from "react-router-dom";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { useToast } from "../Lib/ToastContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useAsyncData } from "../hooks/useAsyncData";
import { heroStagger, heroChild, statStripVariants, statVariants, cardVariants, physics } from "../Lib/motion";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { NumberBadge } from "./ui/NumberBadge";
import { HairlineRule } from "./ui/HairlineRule";
import { StatTile } from "./ui/StatTile";
import { SectionHeading } from "./ui/SectionHeading";
import { Badge } from "./ui/Badge";
import { EmptyState } from "./ui/EmptyState";
import { Modal } from "./ui/Modal";
import { Skeleton } from "./ui/Skeleton";
import { PageDecor } from "./ui/PageDecor";
import styles from "./Dashboard.module.css";

function getGreeting(): { text: string; accent: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", accent: "morning" };
  if (h < 17) return { text: "Good afternoon", accent: "afternoon" };
  return { text: "Good evening", accent: "evening" };
}

function getFirstName(name?: string | null): string {
  if (!name) return "there";
  return name.split(" ")[0];
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const e = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${s} \u2013 ${e}`;
}

function weekProgress(start: string, end: string): { week: number; total: number; pct: number } {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const total = Math.max(1, Math.round((e - s) / (7 * 86400000)));
  const elapsed = Math.max(0, Math.round((now - s) / (7 * 86400000)));
  const week = Math.min(elapsed + 1, total);
  const pct = Math.min(100, Math.round((week / total) * 100));
  return { week, total, pct };
}

//extract season word from semester name for italic accent
function splitSeasonWord(name: string): { before: string; season: string; after: string } | null {
  const seasons = ["Spring", "Fall", "Summer", "Winter"];
  for (const s of seasons) {
    const idx = name.indexOf(s);
    if (idx !== -1) {
      return { before: name.slice(0, idx), season: s, after: name.slice(idx + s.length) };
    }
  }
  return null;
}

interface DashboardData {
  semesterList: Semester[];
  scheduleCountMap: Record<number, number>;
  totalStudents: number;
  attentionCount: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Semester | null>(null);
  const [cloneSource, setCloneSource] = useState<Semester | null>(null);

  const canEdit = authService.canEdit();
  const greeting = getGreeting();
  const firstName = getFirstName(authService.getCurrentUser()?.name);

  //top-level breadcrumb — single item, hidden by Breadcrumbs but used for active-state logic
  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  //single discriminated-union state for all dashboard data
  //fetcher loads semesters then fans out to per-semester schedule queries in parallel
  const { state, reload: loadSemesters } = useAsyncData<DashboardData>(async () => {
    const data = await semestersApi.getAll();
    const counts: Record<number, number> = {};
    const active = data.filter((s) => !s.isLocked);
    let studentSum = 0;
    let attention = 0;
    await Promise.all(
      active.map(async (sem) => {
        try {
          const schedules = await schedulesApi.getBySemester(sem.id);
          counts[sem.id] = schedules.length;
          studentSum += schedules.reduce((acc, s) => acc + (s.students?.length || 0), 0);
          attention += schedules.filter(
            (s) => s.students && s.capacity && s.students.length >= s.capacity,
          ).length;
        } catch {
          counts[sem.id] = 0;
        }
      }),
    );
    return { semesterList: data, scheduleCountMap: counts, totalStudents: studentSum, attentionCount: attention };
  }, []);

  const loading = state.status === "loading" || state.status === "idle";
  const error = state.status === "error" ? state.error : "";
  const semesterList = state.status === "success" ? state.data.semesterList : [];
  const scheduleCountMap = state.status === "success" ? state.data.scheduleCountMap : {};
  const totalStudents = state.status === "success" ? state.data.totalStudents : null;
  const attentionCount = state.status === "success" ? state.data.attentionCount : null;

  const handleDeleteSemester = async () => {
    if (!deleteConfirm) return;
    try {
      await semestersApi.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      addToast("success", "Semester deleted successfully");
      await loadSemesters();
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete semester");
      setDeleteConfirm(null);
    }
  };

  const handleToggleLock = async (id: number) => {
    try {
      const result = await semestersApi.toggleLock(id);
      addToast("success", result.isLocked ? "Semester locked" : "Semester unlocked");
      await loadSemesters();
    } catch (err: any) {
      addToast("error", err.message || "Failed to toggle lock");
    }
  };

  const activeSemesters = semesterList.filter((s) => !s.isLocked);
  const lockedCount = semesterList.filter((s) => s.isLocked).length;
  const totalSchedules = Object.values(scheduleCountMap).reduce((a, b) => a + b, 0);

  //featured = most recent active semester (latest startDate)
  const featured = activeSemesters.length > 0
    ? [...activeSemesters].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0]
    : null;

  const featuredProgress = featured ? weekProgress(featured.startDate, featured.endDate) : null;

  //subtitle text
  const subtitleText = featured
    ? `You're building schedules for ${featured.name}. ${totalSchedules} schedule group${totalSchedules !== 1 ? "s" : ""} across ${activeSemesters.length} active semester${activeSemesters.length !== 1 ? "s" : ""}.`
    : "You have no active semesters. Create one to begin building schedules.";

  const reduced = useReducedMotion();

  return (
    <div className={styles.root}>
      <PageDecor variant="dashboard" />
      {/* ── hero ── */}
      <motion.div
        className={styles.hero}
        variants={reduced ? undefined : heroStagger}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.heroText}>
          <motion.div variants={reduced ? undefined : heroChild}><NumberBadge number="01" variant="gold" size="sm" /></motion.div>
          <motion.div variants={reduced ? undefined : heroChild}><HairlineRule width="48px" color="gold" spacing="normal" /></motion.div>
          <motion.h1 variants={reduced ? undefined : heroChild}>
            {greeting.text.replace(greeting.accent, "").trim()}{" "}
            <em>{greeting.accent}</em>, {firstName}.
          </motion.h1>
          <motion.p variants={reduced ? undefined : heroChild} className={styles.heroSubtitle}>{subtitleText}</motion.p>
        </div>
        {canEdit && (
          <motion.div variants={reduced ? undefined : heroChild}>
            <Button
              variant="primary"
              size="lg"
              iconLeft={<Plus size={16} />}
              onClick={() => setShowCreateModal(true)}
            >
              Create New Semester
            </Button>
          </motion.div>
        )}
      </motion.div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ── stat strip — wrapper always rendered, children swap to avoid CLS ── */}
      <motion.div
        className={styles.statSection}
        variants={reduced ? undefined : statStripVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.statSectionGrid}>
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="custom" height="120px" />
              ))}
            </>
          ) : (
            <>
              <motion.div variants={reduced ? undefined : statVariants}>
                <StatTile
                  label="Active Semesters"
                  value={activeSemesters.length}
                  accent="gold"
                  size="sm"
                  trend={lockedCount > 0 ? { direction: "neutral", text: `${lockedCount} archived` } : undefined}
                />
              </motion.div>
              <motion.div variants={reduced ? undefined : statVariants}>
                <StatTile
                  label="Schedule Groups"
                  value={totalSchedules}
                  accent="green"
                  size="sm"
                  trend={activeSemesters.length > 0 ? { direction: "neutral", text: `across ${activeSemesters.length} semester${activeSemesters.length !== 1 ? "s" : ""}` } : undefined}
                />
              </motion.div>
              <motion.div variants={reduced ? undefined : statVariants}>
                <StatTile
                  label="Students Placed"
                  value={totalStudents ?? 0}
                  accent="green"
                  size="sm"
                  trend={totalStudents !== null && totalStudents > 0 ? { direction: "neutral", text: `across ${activeSemesters.length} semester${activeSemesters.length !== 1 ? "s" : ""}` } : undefined}
                />
              </motion.div>
              <motion.div variants={reduced ? undefined : statVariants}>
                <StatTile
                  label="Attention Needed"
                  value={attentionCount ?? 0}
                  accent={attentionCount && attentionCount > 0 ? "gold" : "none"}
                  size="sm"
                  trend={
                    attentionCount !== null
                      ? {
                          direction: attentionCount === 0 ? "neutral" : "down",
                          text: attentionCount === 0 ? "All clear" : "Review details",
                        }
                      : undefined
                  }
                />
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* ── featured semester ── */}
      {featured && !loading && (
        <motion.div
          layoutId={reduced ? undefined : `semester-hero-${featured.id}`}
          whileHover={reduced ? undefined : { y: -6, scale: 1.008, transition: physics.magnetic }}
          whileTap={reduced ? undefined : { scale: 0.995, transition: physics.instant }}
          style={{ cursor: "pointer" }}
        >
        <Card variant="hero" className={styles.featured} onClick={() => navigate(`/semester/${featured.id}`)}>
          <div className={styles.featuredInner}>
            <div className={styles.featuredLeft}>
              <NumberBadge number="NOW" variant="gold" size="md" />
              <h2 className={styles.featuredTitle}>
                {(() => {
                  const parts = splitSeasonWord(featured.name);
                  if (!parts) return featured.name;
                  return <>{parts.before}<em>{parts.season}</em>{parts.after}</>;
                })()}
              </h2>
              {featuredProgress && (
                <>
                  <span className={styles.featuredMeta}>
                    Week {featuredProgress.week} of {featuredProgress.total} &middot; Ends{" "}
                    {new Date(featured.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${featuredProgress.pct}%` }} />
                  </div>
                </>
              )}
            </div>
            <Button variant="secondary" size="lg" onClick={(e) => { e.stopPropagation(); navigate(`/semester/${featured.id}`); }}>
              Open Semester
            </Button>
          </div>
        </Card>
        </motion.div>
      )}

      {/* ── semester grid — heading + wrapper always rendered during/after load ── */}
      <SectionHeading number="02" title="All semesters" level="section" />

      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="semesterCard" />
          ))}
        </div>
      ) : semesterList.length === 0 ? (
        <EmptyState
          icon={<Calendar size={32} />}
          title="No semesters yet"
          description="Create your first semester to begin building schedules for your nursing students."
          action={
            canEdit ? (
              <Button variant="primary" size="lg" iconLeft={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
                Create Your First Semester
              </Button>
            ) : undefined
          }
        />
      ) : activeSemesters.length === 0 ? (
        <EmptyState
          icon={<Calendar size={32} />}
          title="No active semesters"
          description="All semesters are archived. Visit the Archive to see finalized semesters, or create a new one."
          action={
            canEdit ? (
              <Button variant="primary" iconLeft={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
                New Semester
              </Button>
            ) : undefined
          }
        />
      ) : (
        <LayoutGroup>
          <motion.div
            className={styles.grid}
            variants={reduced ? undefined : {
              hidden: {},
              visible: { transition: { staggerChildren: 0.06, delayChildren: 0.6 } },
            }}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {activeSemesters.map((semester) => (
                    <motion.div
                      key={semester.id}
                      layout={!reduced}
                      layoutId={reduced ? undefined : `semester-hero-${semester.id}`}
                      variants={reduced ? undefined : cardVariants}
                      initial={reduced ? undefined : { opacity: 0, scale: 0.95 }}
                      animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                      exit={reduced ? undefined : { opacity: 0, scale: 0.92 }}
                      whileHover={reduced ? undefined : { y: -5, scale: 1.01, transition: physics.magnetic }}
                      whileTap={reduced ? undefined : { scale: 0.995, transition: physics.instant }}
                      transition={reduced ? undefined : physics.standard}
                    >
                      <Card
                        variant="raised"
                        accentColor="gold"
                        interactive
                        onClick={() => navigate(`/semester/${semester.id}`)}
                      >
                        <div className={styles.cardBody}>
                          <div className={styles.cardTopRow}>
                            <NumberBadge number={semester.id} size="sm" variant="gold" />
                            {canEdit && (
                              <div className={styles.cardActions}>
                                <button
                                  className={styles.cardActionBtn}
                                  onClick={(e) => { e.stopPropagation(); handleToggleLock(semester.id); }}
                                  title="Lock semester"
                                >
                                  <Unlock size={15} />
                                </button>
                                <button
                                  className={styles.cardActionBtn}
                                  onClick={(e) => { e.stopPropagation(); setCloneSource(semester); }}
                                  title="Clone semester"
                                >
                                  <Copy size={15} />
                                </button>
                                <button
                                  className={`${styles.cardActionBtn} ${styles.cardActionBtnDanger}`}
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(semester); }}
                                  title="Delete semester"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </div>

                          <h3 className={styles.cardTitle}>{semester.name}</h3>
                          <div className={styles.cardMeta}>
                            <span className={styles.cardDate}>
                              {formatDateRange(semester.startDate, semester.endDate)}
                            </span>
                            {semester.clinicalDays && (
                              <Badge variant="gold" size="sm">{semester.clinicalDays}</Badge>
                            )}
                          </div>

                          <HairlineRule color="muted" spacing="tight" />
                          <div className={styles.cardCta}>
                            <span className={styles.cardCtaText}>
                              {scheduleCountMap[semester.id] ?? 0} schedule group{(scheduleCountMap[semester.id] ?? 0) !== 1 ? "s" : ""}
                            </span>
                            <ChevronRight size={16} className={styles.cardCtaChevron} />
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}

      {/* ── modals ── */}
      {showCreateModal && (
        <CreateSemesterModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadSemesters();
            setShowCreateModal(false);
            addToast("success", "Semester created successfully");
          }}
        />
      )}

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete semester?"
        subtitle={deleteConfirm ? `This will permanently remove ${deleteConfirm.name} and all its schedules.` : ""}
        size="sm"
        number="ATTENTION"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSemester}>Delete Semester</Button>
          </>
        }
      >
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
          This action cannot be undone. Schedule groups, section assignments, and
          student rosters associated with this semester will all be removed.
        </p>
      </Modal>

      {cloneSource && (
        <CloneSemesterModal
          source={cloneSource}
          onClose={() => setCloneSource(null)}
          onSuccess={() => {
            setCloneSource(null);
            addToast("success", "Semester cloned successfully");
            loadSemesters();
          }}
        />
      )}
    </div>
  );
}
