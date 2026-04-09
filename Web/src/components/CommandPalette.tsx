import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Home, DoorOpen, Users, Archive, Keyboard, CalendarPlus, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./CommandPalette.module.css";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  keywords: string[];
  action: () => void;
  group: "navigate" | "create" | "admin";
}

const GROUP_LABELS: Record<string, string> = {
  navigate: "Navigate",
  create: "Create",
  admin: "Admin",
};

const GROUP_ORDER = ["navigate", "create", "admin"];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenShortcuts }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<Element | null>(null);

  const commands: Command[] = useMemo(() => [
    {
      id: "nav.dashboard",
      label: "Go to Dashboard",
      keywords: ["home", "semesters", "main"],
      icon: <Home size={18} />,
      action: () => { navigate("/"); onClose(); },
      group: "navigate",
    },
    {
      id: "nav.rooms",
      label: "Go to Rooms",
      keywords: ["rooms", "classrooms", "spaces"],
      icon: <DoorOpen size={18} />,
      action: () => { navigate("/rooms"); onClose(); },
      group: "navigate",
    },
    {
      id: "nav.instructors",
      label: "Go to Instructors",
      keywords: ["instructors", "faculty", "teachers"],
      icon: <Users size={18} />,
      action: () => { navigate("/instructors"); onClose(); },
      group: "navigate",
    },
    {
      id: "nav.archive",
      label: "Go to Archive",
      keywords: ["locked", "archived", "finalized"],
      icon: <Archive size={18} />,
      action: () => { navigate("/archive"); onClose(); },
      group: "navigate",
    },
    {
      id: "create.semester",
      label: "Create New Semester",
      description: "Start a new semester with schedules",
      keywords: ["new", "add", "semester"],
      icon: <CalendarPlus size={18} />,
      action: () => { navigate("/"); onClose(); },
      group: "create",
    },
    {
      id: "admin.shortcuts",
      label: "Show Keyboard Shortcuts",
      keywords: ["help", "keys", "shortcuts"],
      icon: <Keyboard size={18} />,
      action: () => { onClose(); onOpenShortcuts(); },
      group: "admin",
    },
    {
      id: "admin.help",
      label: "Help & Documentation",
      keywords: ["help", "docs", "guide"],
      icon: <HelpCircle size={18} />,
      action: () => { onClose(); },
      group: "admin",
    },
  ], [navigate, onClose, onOpenShortcuts]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.keywords.some((k) => k.includes(q)),
    );
  }, [query, commands]);

  //group filtered results
  const grouped = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    for (const cmd of filtered) {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    }
    return groups;
  }, [filtered]);

  //flat list for keyboard navigation
  const flatList = useMemo(() => {
    const list: Command[] = [];
    for (const g of GROUP_ORDER) {
      if (grouped[g]) list.push(...grouped[g]);
    }
    return list;
  }, [grouped]);

  //reset state on open
  useEffect(() => {
    if (isOpen) {
      prevFocusRef.current = document.activeElement;
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      //restore focus
      if (prevFocusRef.current instanceof HTMLElement) {
        prevFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  //reset active index on filter change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  //scroll active into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const active = resultsRef.current.querySelector(`[data-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flatList[activeIndex]?.action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }, [flatList, activeIndex, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            placeholder="Search or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={styles.escHint}>ESC</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.results} ref={resultsRef}>
          {flatList.length === 0 ? (
            <div className={styles.empty}>
              No matching commands. Try searching for &ldquo;semester&rdquo;, &ldquo;rooms&rdquo;, or &ldquo;shortcuts&rdquo;.
            </div>
          ) : (
            <>
              {GROUP_ORDER.map((group) => {
                const cmds = grouped[group];
                if (!cmds || cmds.length === 0) return null;
                return (
                  <div key={group}>
                    <div className={styles.groupLabel}>{GROUP_LABELS[group]}</div>
                    {cmds.map((cmd) => {
                      const idx = flatList.indexOf(cmd);
                      return (
                        <div
                          key={cmd.id}
                          data-index={idx}
                          className={`${styles.resultRow} ${idx === activeIndex ? styles.active : ""}`}
                          onClick={() => cmd.action()}
                          onMouseEnter={() => setActiveIndex(idx)}
                        >
                          <div className={styles.resultIcon}>{cmd.icon}</div>
                          <div className={styles.resultText}>
                            <div className={styles.resultLabel}>{cmd.label}</div>
                            {cmd.description && (
                              <div className={styles.resultDesc}>{cmd.description}</div>
                            )}
                          </div>
                          <span className={styles.resultHint}>&crarr;</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
