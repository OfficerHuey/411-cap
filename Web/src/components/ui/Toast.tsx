import { createContext, useContext, useCallback, useReducer, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import styles from "./Toast.module.css";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

export interface ToastProps {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

//context
interface ToastCtx {
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

//reducer
type Action =
  | { type: "ADD"; toast: ToastItem }
  | { type: "REMOVE"; id: string };

const MAX_VISIBLE = 4;

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case "ADD": {
      const next = [...state, action.toast];
      //cap at max visible — dismiss oldest
      return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
    }
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
  }
}

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const toast = useCallback((props: ToastProps) => {
    const id = `toast-${++counter}`;
    dispatch({
      type: "ADD",
      toast: { id, type: props.type, title: props.title, description: props.description, duration: props.duration ?? 4000 },
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {createPortal(
        <div className={styles.container} aria-live="polite">
          <AnimatePresence initial={false}>
            {toasts.map((t) => (
              <ToastCard key={t.id} item={t} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

//individual toast card
function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  const remainingRef = useRef(item.duration);
  const startRef = useRef(Date.now());

  const startTimer = useCallback(() => {
    if (item.duration === 0) return;
    startRef.current = Date.now();
    timerRef.current = setTimeout(() => onDismiss(item.id), remainingRef.current);
  }, [item.id, item.duration, onDismiss]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      remainingRef.current -= Date.now() - startRef.current;
      pausedRef.current = true;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (pausedRef.current) {
      pausedRef.current = false;
      startTimer();
    }
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [startTimer]);

  return (
    <motion.div
      layout
      className={`${styles.toast} ${styles[item.type]}`}
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
    >
      <div className={styles.content}>
        <span className={styles.title}>{item.title}</span>
        {item.description && <span className={styles.description}>{item.description}</span>}
      </div>
      <button
        className={styles.closeBtn}
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
