import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

export interface ConflictEntry {
  sectionId: number;
  conflictingSectionId?: number;
  type: string;
  severity: "Error" | "Warning" | "Info";
  message: string;
}

interface ConflictBannerProps {
  conflicts: ConflictEntry[];
  onJumpTo: (sectionId: number) => void;
}

export function ConflictBanner({ conflicts, onJumpTo }: ConflictBannerProps) {
  const [expanded, setExpanded] = useState(false);

  //collapse whenever the list empties out
  useEffect(() => {
    if (conflicts.length === 0) setExpanded(false);
  }, [conflicts.length]);

  const hasErrors = conflicts.some((c) => c.severity === "Error");
  const isEmpty = conflicts.length === 0;

  return (
    <>
      <style>{`
        .conflict-bar-wrapper {
          margin-bottom: 0.5rem;
          border-radius: 8px;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .conflict-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.5rem 0.85rem;
          border: none;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .conflict-bar:disabled {
          cursor: default;
        }

        .conflict-bar-left {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .conflict-bar.clear {
          background: rgba(26, 86, 50, 0.06);
          color: #1A5632;
        }

        .conflict-bar.error {
          background: rgba(220, 38, 38, 0.08);
          color: #991b1b;
        }

        .conflict-bar.error:hover {
          background: rgba(220, 38, 38, 0.12);
        }

        .conflict-bar.warning {
          background: rgba(217, 119, 6, 0.08);
          color: #92400e;
        }

        .conflict-bar.warning:hover {
          background: rgba(217, 119, 6, 0.12);
        }

        .conflict-details {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.25s ease-out;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 0 0 8px 8px;
        }

        .conflict-details.open {
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .conflict-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.45rem 0.85rem;
          font-size: 0.78rem;
          gap: 0.5rem;
        }

        .conflict-item + .conflict-item {
          border-top: 1px solid rgba(0, 0, 0, 0.04);
        }

        .conflict-item-info {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex: 1;
          min-width: 0;
        }

        .conflict-severity { flex-shrink: 0; }
        .conflict-severity.error { color: #dc2626; }
        .conflict-severity.warning { color: #d97706; }
        .conflict-severity.info { color: #2563eb; }

        .conflict-type {
          font-weight: 600;
          white-space: nowrap;
          color: #374151;
        }

        .conflict-msg {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #6b7280;
        }

        .conflict-jump {
          flex-shrink: 0;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          color: #1A5632;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          transition: background 0.15s;
          white-space: nowrap;
        }

        .conflict-jump:hover {
          background: rgba(26, 86, 50, 0.08);
        }
      `}</style>

      <div className="conflict-bar-wrapper">
        <button
          className={`conflict-bar ${isEmpty ? "clear" : hasErrors ? "error" : "warning"}`}
          onClick={() => !isEmpty && setExpanded(!expanded)}
          disabled={isEmpty}
          aria-expanded={expanded}
        >
          <div className="conflict-bar-left">
            {isEmpty ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            <span>
              {isEmpty
                ? "No conflicts"
                : `${conflicts.length} conflict${conflicts.length !== 1 ? "s" : ""} detected`}
            </span>
          </div>
          {!isEmpty && (expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </button>

        <div
          className={`conflict-details ${expanded ? "open" : ""}`}
          style={{
            maxHeight: expanded ? `${conflicts.length * 44 + 16}px` : "0",
          }}
        >
          {conflicts.map((c, i) => (
            <div key={`${c.sectionId}-${i}`} className="conflict-item">
              <div className="conflict-item-info">
                <span className={`conflict-severity ${c.severity.toLowerCase()}`}>
                  {c.severity === "Error" ? "\u26A0" : c.severity === "Warning" ? "\u26A0" : "\u2139"}
                </span>
                <span className="conflict-type">{c.type}:</span>
                <span className="conflict-msg">{c.message}</span>
              </div>
              <button
                className="conflict-jump"
                onClick={() => {
                  onJumpTo(c.sectionId);
                  setExpanded(false);
                }}
              >
                Jump to {"\u2192"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
