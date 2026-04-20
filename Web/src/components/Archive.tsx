import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "../App.css";
import { ArrowLeft, Calendar, Lock, Unlock, ArrowRight, Archive as ArchiveIcon } from "lucide-react";
import { semesters as semestersApi } from "../Lib/api";
import type { Semester } from "../Lib/Types";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { staggerContainer, cardVariants, heroStagger, heroChild } from "../Lib/motion";
import { useToast } from "../Lib/ToastContext";

export function Archive() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { addToast } = useToast();
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await semestersApi.getAll();
      setSemesterList(data.filter((s) => s.isLocked));
    } catch (err: any) {
      setError(err.message || "Failed to load semesters");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (id: number) => {
    try {
      const result = await semestersApi.toggleLock(id);
      if (!result.isLocked) {
        addToast("success", "Semester unlocked and moved to active dashboard");
        await loadSemesters();
      }
    } catch (err: any) {
      addToast("error", err.message || "Failed to unlock semester");
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const end = new Date(endDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${start} – ${end}`;
  };

  return (
    <>
      <style>{`
        .archive-root { font-family: 'Inter', sans-serif; }

        .archive-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .archive-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .archive-btn-back {
          width: 36px;
          height: 36px;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .archive-btn-back:hover {
          background: #00563f;
          color: #ffffff;
          border-color: #00563f;
        }

        .archive-header-text h1 {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 500;
          color: var(--text-on-paper);
          margin: 0 0 0.3rem 0;
          letter-spacing: var(--tracking-tightest);
          line-height: var(--leading-tight);
        }

        .archive-header-text h1 em {
          font-style: italic;
          color: var(--gold-500);
        }

        .archive-header-text p {
          color: #9ca3af;
          font-size: 0.88rem;
          margin: 0;
          font-weight: 400;
        }

        .archive-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }

        .archive-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.25s ease;
          position: relative;
          opacity: 0.85;
        }

        .archive-card:hover {
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 12px 36px rgba(0,0,0,0.08);
          transform: translateY(-3px);
          border-color: #d1d5db;
          opacity: 1;
        }

        .archive-card-accent {
          height: 3px;
          background: linear-gradient(90deg, #9ca3af 0%, #d1d5db 100%);
        }

        .archive-card-body { padding: 1.5rem; }

        .archive-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .archive-card-title-group { display: flex; align-items: center; gap: 0.75rem; }

        .archive-card-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 100%);
          border: 1px solid #d6d3d1;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .archive-card-title {
          font-weight: 600;
          font-size: 1.05rem;
          color: #111827;
          margin: 0 0 0.15rem 0;
          letter-spacing: -0.01em;
        }

        .archive-card-dates {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: #9ca3af;
          margin: 0;
        }

        .archive-badges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .archive-clinical-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.65rem;
          background: rgba(200, 149, 44, 0.08);
          color: #92400e;
          border: 1px solid rgba(200, 149, 44, 0.2);
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 500;
        }

        .archive-lock-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0.65rem;
          background: rgba(156, 163, 175, 0.1);
          color: #6b7280;
          border: 1px solid rgba(156, 163, 175, 0.25);
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 500;
        }

        .archive-btn-open {
          width: 100%;
          padding: 0.6rem;
          background: #fafaf9;
          color: #6b7280;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .archive-btn-open:hover {
          background: #00563f;
          color: #ffffff;
          border-color: #00563f;
        }

        .archive-btn-unlock {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: rgba(0, 86, 63, 0.08);
          border: 1px solid rgba(0, 86, 63, 0.2);
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          color: #00563f;
          cursor: pointer;
          transition: all 0.15s;
        }

        .archive-btn-unlock:hover {
          background: rgba(0, 86, 63, 0.15);
          border-color: rgba(0, 86, 63, 0.35);
        }

        .archive-empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          background: #ffffff;
          border: 2px dashed #e5e7eb;
          border-radius: 12px;
          text-align: center;
        }

        .archive-empty-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .archive-empty h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          color: #111827;
          margin: 0 0 0.4rem 0;
        }

        .archive-empty p {
          color: #9ca3af;
          font-size: 0.88rem;
          margin: 0;
          font-weight: 400;
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          color: #991b1b;
        }

        @media (max-width: 768px) {
          .archive-header { margin-bottom: 1.5rem; }
          .archive-card-body { padding: 1.25rem; }
        }
      `}</style>

      <div className="archive-root">
        <motion.div
          className="archive-header"
          variants={reduced ? undefined : heroStagger}
          initial="hidden"
          animate="visible"
        >
          <div className="archive-header-left">
            <motion.div variants={reduced ? undefined : heroChild}>
              <button className="archive-btn-back" onClick={() => navigate("/")}>
                <ArrowLeft size={16} />
              </button>
            </motion.div>
            <div className="archive-header-text">
              <motion.h1 variants={reduced ? undefined : heroChild}>Archive</motion.h1>
              <motion.p variants={reduced ? undefined : heroChild}>
                {loading ? "Loading..." : `${semesterList.length} archived semester${semesterList.length !== 1 ? "s" : ""}`}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-spinner"><span>Loading archived semesters…</span></div>
        ) : (
          <motion.div
            className="archive-grid"
            variants={reduced ? undefined : staggerContainer(0.05)}
            initial="hidden"
            animate="visible"
          >
            {semesterList.map((semester) => (
              <motion.div key={semester.id} className="archive-card" variants={reduced ? undefined : cardVariants}>
                <div className="archive-card-accent" />
                <div className="archive-card-body">
                  <div className="archive-card-top">
                    <div className="archive-card-title-group">
                      <div className="archive-card-icon">
                        <Calendar size={18} color="#6b7280" />
                      </div>
                      <div>
                        <h3 className="archive-card-title">{semester.name}</h3>
                        <p className="archive-card-dates">
                          {formatDateRange(semester.startDate, semester.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="archive-badges">
                    {semester.clinicalDays && (
                      <span className="archive-clinical-badge">
                        {semester.clinicalDays}
                      </span>
                    )}
                    <span className="archive-lock-badge">
                      <Lock size={11} />
                      Archived
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <button
                      className="archive-btn-unlock"
                      onClick={(e) => { e.stopPropagation(); handleUnlock(semester.id); }}
                    >
                      <Unlock size={14} />
                      Unlock
                    </button>
                    <button
                      className="archive-btn-open"
                      onClick={() => navigate(`/semester/${semester.id}`)}
                    >
                      Open
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {semesterList.length === 0 && (
              <div className="archive-empty">
                <div className="archive-empty-icon">
                  <ArchiveIcon size={26} color="#6b7280" />
                </div>
                <h3>No Archived Semesters</h3>
                <p>Locked semesters will appear here once they're finalized</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}
