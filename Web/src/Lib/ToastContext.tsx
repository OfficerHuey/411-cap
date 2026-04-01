import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

//toast colors and icons
const TYPE_STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: "#f0faf5", border: "#059669", color: "#065f46", icon: "✓" },
  error: { bg: "#fef2f2", border: "#dc2626", color: "#991b1b", icon: "✕" },
  warning: { bg: "#fffbeb", border: "#d97706", color: "#92400e", icon: "!" },
  info: { bg: "#eff6ff", border: "#2563eb", color: "#1e40af", icon: "i" },
};

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <>
      <style>{`
        .toast-container {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          pointer-events: none;
        }

        .toast-item {
          pointer-events: all;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border-left: 4px solid;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          min-width: 280px;
          max-width: 420px;
          animation: toast-in 0.25s ease-out;
        }

        @keyframes toast-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }

        .toast-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          flex-shrink: 0;
          color: #ffffff;
        }

        .toast-message {
          flex: 1;
          line-height: 1.4;
        }

        .toast-dismiss {
          background: none;
          border: none;
          cursor: pointer;
          color: inherit;
          opacity: 0.5;
          padding: 0.2rem;
          font-size: 1rem;
          line-height: 1;
          flex-shrink: 0;
          transition: opacity 0.15s;
        }

        .toast-dismiss:hover { opacity: 1; }
      `}</style>

      <div className="toast-container">
        {toasts.map((toast) => {
          const s = TYPE_STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className="toast-item"
              style={{ background: s.bg, borderLeftColor: s.border, color: s.color }}
            >
              <span className="toast-icon" style={{ backgroundColor: s.border }}>
                {s.icon}
              </span>
              <span className="toast-message">{toast.message}</span>
              <button className="toast-dismiss" onClick={() => onDismiss(toast.id)}>
                ×
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
