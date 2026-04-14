import { useMemo, useState } from "react";
import { AlertTriangle, X, ChevronRight, PanelRightOpen } from "lucide-react";

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
  const [panelOpen, setPanelOpen] = useState(false);

  const hasHard = conflicts.some((c) => c.severity === "Error");
  const bgColor = hasHard ? "rgba(220, 38, 38, 0.06)" : "rgba(217, 119, 6, 0.06)";
  const borderColor = hasHard ? "rgba(220, 38, 38, 0.25)" : "rgba(217, 119, 6, 0.25)";
  const accentColor = hasHard ? "#dc2626" : "#d97706";
  const textColor = hasHard ? "#991b1b" : "#92400e";

  const previewConflicts = conflicts.slice(0, 3);

  const groupedConflicts = useMemo(() => {
    const groups = new Map<string, ConflictEntry[]>();

    for (const conflict of conflicts) {
      const key = conflict.type || "Conflict";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(conflict);
    }

    return Array.from(groups.entries());
  }, [conflicts]);

  const handleJump = (sectionId: number) => {
    onJumpTo(sectionId);
    setPanelOpen(false);
  };

  if (dismissed || conflicts.length === 0) return null;

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
          backdrop-filter: blur(6px);
        }

        .conflict-banner-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .conflict-banner-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          min-width: 0;
        }

        .conflict-banner-actions {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-shrink: 0;
        }

        .conflict-banner-btn,
        .conflict-banner-dismiss,
        .conflict-banner-jump,
        .conflict-panel-close,
        .conflict-tab-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
        }

        .conflict-banner-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.76rem;
          font-weight: 600;
          padding: 0.4rem 0.65rem;
          border-radius: 7px;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .conflict-banner-btn:hover,
        .conflict-banner-jump:hover,
        .conflict-panel-close:hover,
        .conflict-banner-dismiss:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        .conflict-banner-dismiss,
        .conflict-panel-close {
          padding: 0.3rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
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
          gap: 0.75rem;
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

        .conflict-banner-footer {
          margin-top: 0.55rem;
          display: flex;
          justify-content: flex-end;
        }

        .conflict-panel-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.28);
          z-index: 999;
          animation: conflictFadeIn 0.18s ease;
        }

        .conflict-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: min(420px, 92vw);
          height: 100vh;
          background: #ffffff;
          box-shadow: -10px 0 30px rgba(15, 23, 42, 0.18);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          border-left: 1px solid rgba(15, 23, 42, 0.08);
          animation: conflictSlideIn 0.22s ease;
        }

        .conflict-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 1rem 1rem 0.85rem 1rem;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          background: #fff;
          position: sticky;
          top: 0;
          z-index: 2;
        }

        .conflict-panel-title-wrap {
          min-width: 0;
        }

        .conflict-panel-title {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
        }

        .conflict-panel-subtitle {
          margin: 0.2rem 0 0;
          font-size: 0.8rem;
          color: #64748b;
        }

        .conflict-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 0.85rem 1rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          background: #fcfcfd;
        }

        .conflict-group {
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
        }

        .conflict-group-header {
          padding: 0.7rem 0.85rem;
          font-size: 0.8rem;
          font-weight: 700;
          background: rgba(15, 23, 42, 0.03);
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }

        .conflict-group-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .conflict-panel-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.8rem 0.85rem;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }

        .conflict-panel-item:last-child {
          border-bottom: none;
        }

        .conflict-panel-item-left {
          min-width: 0;
          flex: 1;
        }

        .conflict-panel-message {
          font-size: 0.82rem;
          line-height: 1.45;
          color: #334155;
          word-break: break-word;
        }

        .conflict-panel-severity {
          display: inline-block;
          margin-top: 0.35rem;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.2rem 0.45rem;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.05);
          color: #475569;
        }

        .conflict-tab-btn {
          position: fixed;
          right: 0;
          top: 72%;
          transform: translateY(-50%);
          writing-mode: vertical-rl;
          text-orientation: mixed;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.8rem 0.55rem;
          border-radius: 10px 0 0 10px;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.2);
          z-index: 998;
        }

        .conflict-tab-btn:hover {
          filter: brightness(0.96);
        }

        @keyframes conflictFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes conflictSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @media (max-width: 768px) {
          .conflict-banner-item,
          .conflict-panel-item {
            align-items: flex-start;
            flex-direction: column;
          }

          .conflict-banner-actions {
            gap: 0.2rem;
          }

          .conflict-tab-btn {
            top: auto;
            bottom: 90px;
            transform: none;
          }
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

          <div className="conflict-banner-actions">
            <button
              className="conflict-banner-btn"
              style={{ color: accentColor }}
              onClick={() => setPanelOpen(true)}
            >
              <PanelRightOpen size={14} />
              View all
            </button>

            <button
              className="conflict-banner-dismiss"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss conflict banner"
              style={{ color: textColor }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <ul className="conflict-banner-list">
          {previewConflicts.map((c, i) => (
            <li key={`${c.sectionId}-${i}`} className="conflict-banner-item" style={{ color: textColor }}>
              <div className="conflict-banner-item-left">
                <span className="conflict-banner-type">{c.type}:</span>
                <span className="conflict-banner-msg">{c.message}</span>
              </div>

              <button
                className="conflict-banner-jump"
                style={{ color: accentColor }}
                onClick={() => handleJump(c.sectionId)}
              >
                Jump to
                <ChevronRight size={12} />
              </button>
            </li>
          ))}
        </ul>

        {conflicts.length > 3 && (
          <div className="conflict-banner-footer">
            <button
              className="conflict-banner-btn"
              style={{ color: accentColor }}
              onClick={() => setPanelOpen(true)}
            >
              View remaining {conflicts.length - 3}
            </button>
          </div>
        )}
      </div>

      {!panelOpen && (
        <button
          className="conflict-tab-btn"
          style={{ background: accentColor }}
          onClick={() => setPanelOpen(true)}
          aria-label="Open conflicts panel"
          title="Open conflicts panel"
        >
          Conflicts ({conflicts.length})
        </button>
      )}

      {panelOpen && (
        <>
          <div
            className="conflict-panel-overlay"
            onClick={() => setPanelOpen(false)}
            aria-hidden="true"
          />

          <aside className="conflict-panel" aria-label="Conflicts panel">
            <div className="conflict-panel-header">
              <div className="conflict-panel-title-wrap">
                <h2 className="conflict-panel-title" style={{ color: accentColor }}>
                  <AlertTriangle size={18} />
                  Conflicts
                </h2>
                <p className="conflict-panel-subtitle">
                  Review all detected issues without covering the schedule.
                </p>
              </div>

              <button
                className="conflict-panel-close"
                onClick={() => setPanelOpen(false)}
                aria-label="Close conflicts panel"
                style={{ color: textColor }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="conflict-panel-body">
              {groupedConflicts.map(([groupName, items]) => (
                <section key={groupName} className="conflict-group">
                  <div className="conflict-group-header" style={{ color: textColor }}>
                    {groupName} ({items.length})
                  </div>

                  <ul className="conflict-group-list">
                    {items.map((c, i) => (
                      <li key={`${groupName}-${c.sectionId}-${i}`} className="conflict-panel-item">
                        <div className="conflict-panel-item-left">
                          <div className="conflict-panel-message">{c.message}</div>
                          <span className="conflict-panel-severity">{c.severity}</span>
                        </div>

                        <button
                          className="conflict-banner-jump"
                          style={{ color: accentColor }}
                          onClick={() => handleJump(c.sectionId)}
                        >
                          Jump to
                          <ChevronRight size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </aside>
        </>
      )}
    </>
  );
}