import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import styles from "./KeyboardShortcutsModal.module.css";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutRow {
  keys: (string | { type: "then" })[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutRow[];
}

const sections: ShortcutSection[] = [
  {
    title: "Global",
    shortcuts: [
      { keys: ["\u2318/Ctrl", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show this help" },
      { keys: ["Esc"], description: "Close current modal or menu" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["G", { type: "then" }, "D"], description: "Go to dashboard" },
      { keys: ["G", { type: "then" }, "R"], description: "Go to rooms" },
      { keys: ["G", { type: "then" }, "I"], description: "Go to instructors" },
      { keys: ["G", { type: "then" }, "A"], description: "Go to archive" },
    ],
  },
  {
    title: "Schedule Builder",
    shortcuts: [
      { keys: ["S"], description: "Switch to Student View" },
      { keys: ["C"], description: "Switch to Calendar View" },
      { keys: ["\u2318/Ctrl", "S"], description: "Save (auto-save is on)" },
      { keys: ["Delete"], description: "Delete selected section" },
    ],
  },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      number="01"
      subtitle="Quick reference for keyboard navigation"
      size="md"
      footer={
        <Button variant="outline" onClick={onClose}>Close</Button>
      }
    >
      {sections.map((section) => (
        <div key={section.title} className={styles.section}>
          <h4 className={styles.sectionTitle}>{section.title}</h4>
          {section.shortcuts.map((shortcut, idx) => (
            <div key={idx} className={styles.row}>
              <div className={styles.keys}>
                {shortcut.keys.map((key, ki) =>
                  typeof key === "object" && key.type === "then" ? (
                    <span key={ki} className={styles.then}>then</span>
                  ) : (
                    <kbd key={ki} className={styles.kbd}>{key as string}</kbd>
                  ),
                )}
              </div>
              <span className={styles.desc}>{shortcut.description}</span>
            </div>
          ))}
        </div>
      ))}
    </Modal>
  );
}
