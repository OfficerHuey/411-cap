import { useState } from "react";
import { AlertTriangle, X, ChevronRight } from "lucide-react";

export interface ConflictEntry {
  sectionId: number;
  type: string;
  severity: "Error" | "Warning" | "Info";
  message: string;
}

interface ConflictBannerProps {
  conflicts: ConflictEntry[];
  onJumpTo: (sectionId: number) => void;
}

export function ConflictBanner({ conflicts, onJumpTo }: ConflictBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || conflicts.length === 0) return null;

  const hasHard = conflicts.some((c) => c.severity === "Error");
  const bgColor = hasHard ? "rgba(220, 38, 38, 0.06)" : "rgba(217, 119, 6, 0.06)";
  const borderColor = hasHard ? "rgba(220, 38, 38, 0.25)" : "rgba(217, 119, 6, 0.25)";
  const accentColor = hasHard ? "#dc2626" : "#d97706";
  const textColor = hasHard ? "#991b1b" : "#92400e";

  return (
    <>
      <style>{`
        .conflict-banner {
          border-radius: 10px;
          padding: 0.85rem 1rem;
          margin-bottom: 0.75rem;
          font-family: 'Inter', sans-serif;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .conflict-banner-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .conflict-banner-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .conflict-banner-dismiss {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: background 0.15s;
        }

        .conflict-banner-dismiss:hover {
          background: rgba(0, 0, 0, 0.08);
        }

        .conflict-banner-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .conflict-banner-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.78rem;
          line-height: 1.4;
          padding: 0.3rem 0;
        }

        .conflict-banner-item-left {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex: 1;
          min-width: 0;
        }

        .conflict-banner-type {
          font-weight: 600;
          white-space: nowrap;
        }

        .conflict-banner-msg {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .conflict-banner-jump {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 0.15rem;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          transition: background 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .conflict-banner-jump:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        @keyframes conflictFlash {
          0% { box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.4); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `}</style>

      <div
        className="conflict-banner"
        style={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
        }}
        role="alert"
      >
        <div className="conflict-banner-header">
          <div className="conflict-banner-title" style={{ color: accentColor }}>
            <AlertTriangle size={15} />
            {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""} detected
          </div>
          <button
            className="conflict-banner-dismiss"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss conflict banner"
            style={{ color: textColor }}
          >
            <X size={14} />
          </button>
        </div>
        <ul className="conflict-banner-list">
          {conflicts.map((c, i) => (
            <li key={`${c.sectionId}-${i}`} className="conflict-banner-item" style={{ color: textColor }}>
              <div className="conflict-banner-item-left">
                <span className="conflict-banner-type">{c.type}:</span>
                <span className="conflict-banner-msg">{c.message}</span>
              </div>
              <button
                className="conflict-banner-jump"
                style={{ color: accentColor }}
                onClick={() => onJumpTo(c.sectionId)}
              >
                Jump to
                <ChevronRight size={12} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
