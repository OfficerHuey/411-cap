import { useEffect, useState } from "react";
import { Plus, Trash2, Lock, Copy, Download, History, Upload, ChevronRight, MapPin, Calendar, StickyNote } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { authService } from "../Lib/Auth";
import { semesters as semestersApi, schedules as schedulesApi, exports as exportsApi } from "../Lib/api";
import type { SemesterLevel, Semester, Schedule } from "../Lib/Types";
import { levelToNumber } from "../Lib/Types";
import { CreateScheduleModal } from "./CreateScheduleModal";
import { CloneSemesterModal } from "./CloneSemesterModal";
import { StudentImportModal } from "./StudentImportModal";
import { CapacityMeter } from "./CapacityMeter";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { useToast } from "../Lib/ToastContext";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { NumberBadge } from "./ui/NumberBadge";
import { HairlineRule } from "./ui/HairlineRule";
import { SectionHeading } from "./ui/SectionHeading";
import { Badge } from "./ui/Badge";
import { EmptyState } from "./ui/EmptyState";
import { Modal } from "./ui/Modal";
import { Skeleton } from "./ui/Skeleton";
import { NotesPanel } from "./Notes/NotesPanel";
import { useNotes } from "../hooks/useNotes";
import { EditAttribution } from "./EditAttribution";
import styles from "./SemesterHub.module.css";

const LEVELS: SemesterLevel[] = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
];

//extract season word from semester name for italic accent
function splitSeasonWord(name: string): string {
  const seasons = ["Spring", "Fall", "Summer", "Winter"];
  return seasons.find((s) => name.includes(s)) ?? "";
}

function renderTitleWithItalic(name: string | undefined) {
  if (!name) return "Loading\u2026";
  const season = splitSeasonWord(name);
  if (!season) return name;
  const idx = name.indexOf(season);
  return (
    <>
      {name.slice(0, idx)}
      <em>{season}</em>
      {name.slice(idx + season.length)}
    </>
  );
}

function formatDateLong(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function weekProgress(start: string, end: string): { week: number; total: number } {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const total = Math.max(1, Math.round((e - s) / (7 * 86400000)));
  const elapsed = Math.max(0, Math.round((now - s) / (7 * 86400000)));
  const week = Math.min(elapsed + 1, total);
  return { week, total };
}

export function SemesterHub() {
  const { semesterId } = useParams<{ semesterId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const [semester, setSemester] = useState<Semester | null>(null);
  const [activeLevel, setActiveLevel] = useState<SemesterLevel>("Semester 1");
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [levelCounts, setLevelCounts] = useState<Record<number, number>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showCloneSemester, setShowCloneSemester] = useState(false);
  const [cloneScheduleId, setCloneScheduleId] = useState<number | null>(null);
  const [cloning, setCloning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const canEdit = authService.canEdit();
  const semIdNum = parseInt(semesterId || "0");
  const { openCount: noteCount } = useNotes({ semesterId: semIdNum || undefined });

  //breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/" },
      { label: semester?.name ?? "Loading\u2026" },
    ]);
  }, [semester, setBreadcrumbs]);

  useEffect(() => {
    if (!semesterId) return;
    loadSemester();
  }, [semesterId]);

  useEffect(() => {
    if (!semesterId) return;
    loadSchedules();
  }, [semesterId, activeLevel]);

  const loadSemester = async () => {
    try {
      const all = await semestersApi.getAll();
      const sem = all.find((s) => s.id === semIdNum);
      setSemester(sem || null);

      //fetch counts for all levels
      const counts: Record<number, number> = {};
      await Promise.all(
        [1, 2, 3, 4, 5].map(async (lvl) => {
          try {
            const data = await schedulesApi.getBySemester(semIdNum, lvl);
            counts[lvl] = data.length;
          } catch {
            counts[lvl] = 0;
          }
        }),
      );
      setLevelCounts(counts);
    } catch (err: any) {
      setError(err.message || "Failed to load semester");
    }
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError("");
      const levelNum = levelToNumber(activeLevel);
      const data = await schedulesApi.getBySemester(semIdNum, levelNum);
      setScheduleList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await schedulesApi.delete(id);
      setDeleteConfirm(null);
      addToast("success", "Schedule group deleted");
      await loadSchedules();
      await loadSemester();
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete schedule");
      setDeleteConfirm(null);
    }
  };

  const handleCloneSchedule = async (schedId: number) => {
    const sched = scheduleList.find((s) => s.id === schedId);
    if (!sched) return;
    setCloning(true);
    try {
      await schedulesApi.clone(schedId, { newName: `${sched.name} (Copy)` });
      setCloneScheduleId(null);
      addToast("success", "Schedule duplicated");
      await loadSchedules();
      await loadSemester();
    } catch (err: any) {
      addToast("error", err.message || "Failed to clone schedule");
      setCloneScheduleId(null);
    } finally {
      setCloning(false);
    }
  };

  if (!semester && !loading) {
    return (
      <EmptyState
        icon={<Calendar size={32} />}
        title="Semester not found"
        description="This semester may have been deleted or the link is invalid."
        action={
          <Button variant="primary" onClick={() => navigate("/")}>
            Return to Dashboard
          </Button>
        }
      />
    );
  }

  const isLocked = semester?.isLocked ?? false;
  const isActive = semester ? !isLocked : false;
  const progress = semester ? weekProgress(semester.startDate, semester.endDate) : null;
  const activeLevelNum = levelToNumber(activeLevel);

  return (
    <div className={styles.root}>
      {/* ── hero ── */}
      <div className={styles.hero}>
        <div>
          <NumberBadge number={semester?.id ?? "\u2014"} variant="gold" size="sm" />
          <HairlineRule width="48px" color="gold" spacing="normal" />

          <h1 className={styles.heroTitle}>
            {renderTitleWithItalic(semester?.name)}
            {isLocked && (
              <Badge variant="red" size="md">
                <Lock size={12} style={{ marginRight: "0.25rem", verticalAlign: "middle" }} />
                Archived
              </Badge>
            )}
          </h1>

          {semester && (
            <div className={styles.heroMeta}>
              <span className={styles.heroDateRange}>
                {formatDateLong(semester.startDate)} &mdash; {formatDateLong(semester.endDate)}
              </span>
              <Badge variant="gold" size="md">
                Clinical Days: {semester.clinicalDays}
              </Badge>
              {isActive && progress && (
                <span className={styles.heroWeekBadge}>
                  Week {progress.week} of {progress.total}
                </span>
              )}
            </div>
          )}
        </div>

        <div className={styles.heroActions}>
          <Button
            variant="ghost"
            size="md"
            iconLeft={<StickyNote size={14} />}
            onClick={() => setShowNotes(true)}
          >
            Notes
            {noteCount > 0 && (
              <Badge variant="gold" size="sm">{noteCount}</Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="md"
            iconLeft={<History size={14} />}
            onClick={() => navigate(`/changelog/${semIdNum}`)}
          >
            History
          </Button>
          {semester && (
            <Button
              variant="secondary"
              size="md"
              iconLeft={<Download size={14} />}
              onClick={() =>
                exportsApi
                  .roster(semIdNum, semester.name)
                  .then(() => addToast("success", "Roster exported"))
                  .catch((err) => addToast("error", `Export failed: ${err.message || "Unknown error"}`))
              }
            >
              Export
            </Button>
          )}
          {canEdit && !isLocked && (
            <Button
              variant="secondary"
              size="md"
              iconLeft={<Upload size={14} />}
              onClick={() => setShowImport(true)}
            >
              Import
            </Button>
          )}
          {canEdit && !isLocked && (
            <Button
              variant="secondary"
              size="md"
              iconLeft={<Copy size={14} />}
              onClick={() => setShowCloneSemester(true)}
            >
              Clone Semester
            </Button>
          )}
          {canEdit && (
            <Button
              variant="primary"
              size="md"
              iconLeft={<Plus size={14} />}
              disabled={isLocked}
              onClick={() => setShowCreateModal(true)}
            >
              Add Schedule Group
            </Button>
          )}
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <HairlineRule color="muted" spacing="normal" />

      {/* ── tabs ── */}
      <div className={styles.tabs}>
        {LEVELS.map((level, i) => {
          const isActiveTab = activeLevel === level;
          const count = levelCounts[i + 1] ?? 0;
          return (
            <button
              key={level}
              className={`${styles.tab} ${isActiveTab ? styles.active : ""}`}
              onClick={() => setActiveLevel(level)}
            >
              {level}
              <span className={styles.tabCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── section heading + grid ── */}
      {loading ? (
        <div style={{ marginTop: "1rem" }}>
          <Skeleton variant="card" height={200} />
        </div>
      ) : (
        <>
          <SectionHeading
            number={String(activeLevelNum)}
            title={`${scheduleList.length} schedule group${scheduleList.length !== 1 ? "s" : ""}`}
            level="subsection"
            action={
              canEdit && !isLocked ? (
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<Plus size={14} />}
                  onClick={() => setShowCreateModal(true)}
                >
                  Add Schedule Group
                </Button>
              ) : undefined
            }
          />

          {scheduleList.length === 0 ? (
            <EmptyState
              icon={<Calendar size={32} />}
              title={`Nothing scheduled for Semester ${activeLevelNum}`}
              description="Create your first schedule group to begin building the weekly calendar."
              action={
                canEdit && !isLocked ? (
                  <Button
                    variant="primary"
                    size="md"
                    iconLeft={<Plus size={14} />}
                    onClick={() => setShowCreateModal(true)}
                  >
                    Add Schedule Group
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className={styles.grid}>
              {scheduleList.map((schedule, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return (
                  <Card
                    key={schedule.id}
                    variant="raised"
                    accentColor="gold"
                    interactive
                    onClick={() => navigate(`/schedule-builder/${schedule.id}`)}
                  >
                    <div className={styles.cardBody}>
                      <div className={styles.cardTopRow}>
                        <NumberBadge number={letter} size="sm" variant="gold" />
                        {canEdit && !isLocked && (
                          <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                            <button
                              className={styles.cardActionBtn}
                              onClick={() => setCloneScheduleId(schedule.id)}
                              title="Clone schedule"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              className={`${styles.cardActionBtn} ${styles.cardActionBtnDanger}`}
                              onClick={() => setDeleteConfirm(schedule.id)}
                              title="Delete schedule"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className={styles.cardTitle}>{schedule.name}</h3>
                      <div className={styles.cardMeta}>
                        <MapPin size={12} />
                        <span>{schedule.locationDisplay}</span>
                      </div>

                      <div className={styles.cardCapacity}>
                        <CapacityMeter
                          currentCount={schedule.students.length}
                          capacity={schedule.capacity}
                        />
                      </div>

                      <HairlineRule color="muted" spacing="normal" />
                      <div className={styles.cardCta}>
                        <span className={styles.cardCtaText}>
                          {schedule.sections?.length ?? 0} section{(schedule.sections?.length ?? 0) !== 1 ? "s" : ""} scheduled
                        </span>
                        <ChevronRight size={16} className={styles.cardCtaChevron} />
                      </div>
                      <EditAttribution entityType="Schedule" entityId={schedule.id} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── modals ── */}
      {showCreateModal && semester && (
        <CreateScheduleModal
          semesterId={semIdNum}
          level={activeLevel}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadSchedules();
            loadSemester();
            setShowCreateModal(false);
            addToast("success", "Schedule group created");
          }}
        />
      )}

      <Modal
        open={deleteConfirm != null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete schedule group?"
        subtitle="This will permanently delete this schedule group and all its associated data."
        size="sm"
        number="ATTENTION"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm != null && handleDeleteSchedule(deleteConfirm)}>
              Delete
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
          Schedule groups, section assignments, and student rosters associated
          with this schedule will all be removed.
        </p>
      </Modal>

      <Modal
        open={cloneScheduleId != null}
        onClose={() => setCloneScheduleId(null)}
        title="Duplicate schedule?"
        subtitle="This will create a copy of this schedule group with all its sections."
        size="sm"
        number="CLONE"
        footer={
          <>
            <Button variant="outline" onClick={() => setCloneScheduleId(null)}>Cancel</Button>
            <Button
              variant="primary"
              loading={cloning}
              onClick={() => cloneScheduleId != null && handleCloneSchedule(cloneScheduleId)}
            >
              {cloning ? "Cloning\u2026" : "Duplicate"}
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
          All sections will be copied to the new schedule group.
        </p>
      </Modal>

      {showCloneSemester && semester && (
        <CloneSemesterModal
          source={semester}
          onClose={() => setShowCloneSemester(false)}
          onSuccess={(newSem) => {
            setShowCloneSemester(false);
            addToast("success", "Semester cloned successfully");
            navigate(`/semester/${newSem.id}`);
          }}
        />
      )}

      {showImport && (
        <StudentImportModal
          semesterId={semIdNum}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            addToast("success", "Students imported successfully");
            loadSchedules();
          }}
        />
      )}

      <NotesPanel
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        semesterId={semIdNum}
      />
    </div>
  );
}
