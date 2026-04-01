import { useEffect, useState } from "react";
import "../App.css";
import { ArrowLeft, Clock, User } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { changelog as changelogApi, semesters as semestersApi } from "../Lib/api";
import type { Semester } from "../Lib/Types";

interface LogEntry {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  changes: string | null;
  performedBy: string;
  timestamp: string;
  semesterId: number;
}

export function ChangeLogPage() {
  const { semesterId } = useParams<{ semesterId: string }>();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const semIdNum = parseInt(semesterId || "0");

  useEffect(() => { loadData(); }, [semesterId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logData, allSems] = await Promise.all([
        changelogApi.get(semIdNum),
        semestersApi.getAll(),
      ]);
      setLogs(logData);
      setSemester(allSems.find((s) => s.id === semIdNum) || null);
    } catch (err: any) {
      setError(err.message || "Failed to load changelog");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const entityColor = (type: string) => {
    switch (type) {
      case "Section": return "#3b82f6";
      case "Schedule": return "#10b981";
      case "Student": return "#8b5cf6";
      case "Semester": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  return (
    <>
      <style>{`
        .cl-root { font-family: 'Inter', sans-serif; }
        .cl-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e2db; }
        .cl-btn-back { height: 36px; padding: 0 1rem; gap: 0.4rem; background: #ffffff; border: 1.5px solid #e5e2db; border-radius: 8px; display: flex; align-items: center; cursor: pointer; color: #6b7280; font-family: 'Inter', sans-serif; font-size: 0.88rem; font-weight: 500; transition: background 0.15s, color 0.15s; }
        .cl-btn-back:hover { background: #00563f; color: #ffffff; border-color: #00563f; }
        .cl-header h1 { font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 600; color: #0a1f14; margin: 0; }
        .cl-header p { font-size: 0.85rem; color: #9ca3af; margin: 0.2rem 0 0; font-weight: 300; }
        .cl-card { background: #ffffff; border: 1px solid #e5e2db; border-radius: 10px; overflow: hidden; }
        .cl-timeline { padding: 1.5rem; }
        .cl-entry { display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid #f3f4f6; }
        .cl-entry:last-child { border-bottom: none; }
        .cl-entry-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 0.4rem; flex-shrink: 0; }
        .cl-entry-body { flex: 1; min-width: 0; }
        .cl-entry-action { font-size: 0.88rem; font-weight: 500; color: #0a1f14; margin: 0 0 0.3rem 0; }
        .cl-entry-entity { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-right: 0.5rem; }
        .cl-entry-changes { font-size: 0.82rem; color: #6b7280; margin: 0.25rem 0 0; line-height: 1.5; }
        .cl-entry-meta { display: flex; align-items: center; gap: 1rem; margin-top: 0.4rem; font-size: 0.75rem; color: #9ca3af; }
        .cl-entry-meta span { display: inline-flex; align-items: center; gap: 0.3rem; }
        .cl-empty { text-align: center; padding: 3rem 2rem; color: #9ca3af; font-size: 0.88rem; }
        .error-banner { background: #fef2f2; border: 1px solid #fecaca; border-left: 3px solid #dc2626; border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.85rem; color: #991b1b; }
      `}</style>

      <div className="cl-root">
        <div className="cl-header">
          <button className="cl-btn-back" onClick={() => navigate(`/semester/${semIdNum}`)}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1>Change Log</h1>
            <p>{semester?.name || "Loading..."}</p>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="cl-card">
          {loading ? (
            <div className="loading-spinner"><span>Loading history…</span></div>
          ) : logs.length === 0 ? (
            <div className="cl-empty">No changes recorded for this semester yet.</div>
          ) : (
            <div className="cl-timeline">
              {logs.map((log) => {
                const color = entityColor(log.entityType);
                return (
                  <div key={log.id} className="cl-entry">
                    <div className="cl-entry-dot" style={{ backgroundColor: color }} />
                    <div className="cl-entry-body">
                      <p className="cl-entry-action">
                        <span
                          className="cl-entry-entity"
                          style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}40` }}
                        >
                          {log.entityType}
                        </span>
                        {log.action}
                      </p>
                      {log.changes && (
                        <p className="cl-entry-changes">{log.changes}</p>
                      )}
                      <div className="cl-entry-meta">
                        <span><User size={12} />{log.performedBy}</span>
                        <span><Clock size={12} />{formatDate(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
