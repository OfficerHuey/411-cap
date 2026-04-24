import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  CornerDownRight,
  Info,
} from "lucide-react";
import type { ConflictEntry } from "./ConflictBanner";
import styles from "./ConflictPanel.module.css";

interface ConflictPanelProps {
  conflicts: ConflictEntry[];
  onJumpTo: (sectionId: number) => void;
  //monotonically-increasing signal — any bump force-opens the panel.
  //used so clicking a triangle inside the canvas opens the panel
  openSignal?: number;
}

//severity ranking for stable sort: Error > Warning > Info
const SEVERITY_RANK: Record<ConflictEntry["severity"], number> = {
  Error: 0,
  Warning: 1,
  Info: 2,
};

export function ConflictPanel({ conflicts, onJumpTo, openSignal }: ConflictPanelProps) {
  const [open, setOpen] = useState(false);
  //latched so the panel only auto-opens once per ScheduleBuilder mount; if
  //the user closes it manually we stay closed even when conflicts re-arrive
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  //auto-open once on initial load if there are any conflicts
  useEffect(() => {
    if (!hasAutoOpened && conflicts.length > 0) {
      setOpen(true);
      setHasAutoOpened(true);
    }
  }, [conflicts.length, hasAutoOpened]);

  //force open whenever the parent bumps openSignal (eg triangle click).
  //zero is the initial value and shouldn't trigger the open on mount
  useEffect(() => {
    if (openSignal && openSignal > 0 && conflicts.length > 0) {
      setOpen(true);
    }
  }, [openSignal, conflicts.length]);

  //group conflicts by type, preserving severity order within each group
  const groups = useMemo(() => {
    const map = new Map<string, ConflictEntry[]>();
    conflicts.forEach((c) => {
      if (!map.has(c.type)) map.set(c.type, []);
      map.get(c.type)!.push(c);
    });
    const entries = Array.from(map.entries());
    //group header order: groups containing the most severe conflict first
    entries.sort(([, a], [, b]) => {
      const ra = Math.min(...a.map((c) => SEVERITY_RANK[c.severity]));
      const rb = Math.min(...b.map((c) => SEVERITY_RANK[c.severity]));
      return ra - rb;
    });
    //sort entries inside each group by severity
    entries.forEach(([, list]) =>
      list.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]),
    );
    return entries;
  }, [conflicts]);

  const errorCount = conflicts.filter((c) => c.severity === "Error").length;
  const warningCount = conflicts.filter((c) => c.severity === "Warning").length;

  //if the schedule is fully clean the tab disappears entirely
  if (conflicts.length === 0) return null;

  return createPortal(
    <>
      {/*collapsed tab — always visible when conflicts exist*/}
      <button
        className={`${styles.tab} ${open ? styles.tabOpen : ""} ${
          errorCount > 0 ? styles.tabError : styles.tabWarning
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="conflict-panel-body"
      >
        <AlertTriangle size={16} strokeWidth={2.2} />
        <span className={styles.tabCount}>
          {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            id="conflict-panel-body"
            className={styles.panel}
            role="complementary"
            aria-label="Schedule conflicts"
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ type: "spring", mass: 0.8, stiffness: 250, damping: 28 }}
          >
            <header className={styles.header}>
              <div className={styles.headerTitleRow}>
                <AlertTriangle
                  size={18}
                  strokeWidth={2.2}
                  className={
                    errorCount > 0 ? styles.iconError : styles.iconWarning
                  }
                />
                <h3 className={styles.headerTitle}>Conflicts Detected</h3>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label="Close conflicts panel"
              >
                <X size={16} />
              </button>
            </header>

            <div className={styles.summary}>
              {errorCount > 0 && (
                <span className={`${styles.chip} ${styles.chipError}`}>
                  {errorCount} error{errorCount !== 1 ? "s" : ""}
                </span>
              )}
              {warningCount > 0 && (
                <span className={`${styles.chip} ${styles.chipWarning}`}>
                  {warningCount} warning{warningCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className={styles.body}>
              {groups.map(([type, list]) => {
                const collapsed = collapsedGroups[type] ?? false;
                const worst = list.reduce(
                  (w, c) =>
                    SEVERITY_RANK[c.severity] < SEVERITY_RANK[w]
                      ? c.severity
                      : w,
                  "Info" as ConflictEntry["severity"],
                );
                return (
                  <section key={type} className={styles.group}>
                    <button
                      className={styles.groupHeader}
                      onClick={() =>
                        setCollapsedGroups((prev) => ({
                          ...prev,
                          [type]: !collapsed,
                        }))
                      }
                      aria-expanded={!collapsed}
                    >
                      {collapsed ? (
                        <ChevronRight size={14} className={styles.groupChev} />
                      ) : (
                        <ChevronDown size={14} className={styles.groupChev} />
                      )}
                      <span
                        className={`${styles.groupDot} ${
                          worst === "Error"
                            ? styles.dotError
                            : worst === "Warning"
                              ? styles.dotWarning
                              : styles.dotInfo
                        }`}
                        aria-hidden="true"
                      />
                      <span className={styles.groupType}>{type}</span>
                      <span className={styles.groupCount}>{list.length}</span>
                    </button>
                    {!collapsed && (
                      <ul className={styles.groupList}>
                        {list.map((c, i) => (
                          <li key={`${c.sectionId}-${i}`} className={styles.item}>
                            <div className={styles.itemIcon}>
                              {c.severity === "Info" ? (
                                <Info size={14} />
                              ) : (
                                <AlertTriangle size={14} />
                              )}
                            </div>
                            <div className={styles.itemBody}>
                              <p className={styles.itemMessage}>{c.message}</p>
                              <button
                                className={styles.jumpBtn}
                                onClick={() => onJumpTo(c.sectionId)}
                              >
                                <CornerDownRight size={12} />
                                Jump to
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
