import "../App.css";
import { Calendar, LogOut, DoorOpen, GraduationCap } from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { authService } from "../Lib/Auth";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <style>{`
        .layout-root {
          min-height: 100vh;
          background: var(--bg, #fafaf9);
          font-family: 'Inter', sans-serif;
        }

        .layout-nav {
          background: linear-gradient(135deg, #00563f 0%, #003d2a 100%);
          height: 56px;
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 4px 20px rgba(0,86,63,0.15);
        }

        .layout-nav-group {
          display: flex;
          align-items: center;
          gap: 2.5rem;
        }

        .layout-nav-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .layout-nav-left:hover { opacity: 0.9; }

        .layout-nav-icon {
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .layout-nav-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        .layout-nav-links {
          display: flex;
          align-items: center;
          gap: 0.15rem;
        }

        .layout-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.38rem 0.85rem;
          background: none;
          border: none;
          border-radius: 6px;
          color: rgba(255,255,255,0.6);
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
        }

        .layout-nav-link:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.1);
        }

        .layout-nav-link.active {
          color: #ffffff;
          background: rgba(255,255,255,0.15);
        }

        .layout-nav-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .layout-user-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0.75rem;
          background: rgba(255,255,255,0.08);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .layout-user-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(200,149,44,0.3);
          border: 1px solid rgba(200,149,44,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 600;
          color: #C8952C;
          text-transform: uppercase;
        }

        .layout-user-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
        }

        .layout-role-badge {
          font-size: 0.62rem;
          font-weight: 600;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: rgba(200, 149, 44, 0.2);
          color: #e0b44c;
          border: 1px solid rgba(200, 149, 44, 0.3);
        }

        .layout-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.85rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          color: rgba(255,255,255,0.7);
          font-family: 'Inter', sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .layout-logout-btn:hover {
          background: rgba(255,255,255,0.15);
          color: #ffffff;
        }

        .layout-main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 2.5rem;
          animation: fadeInUp 0.4s ease both;
        }

        @media (max-width: 768px) {
          .layout-nav { padding: 0 1rem; }
          .layout-main { padding: 1.5rem 1rem; }
          .layout-nav-group { gap: 1rem; }
          .layout-user-pill { display: none; }
        }
      `}</style>

      <div className="layout-root">
        <nav className="layout-nav">
          <div className="layout-nav-group">
            <div className="layout-nav-left" onClick={() => navigate("/")}>
              <div className="layout-nav-icon">
                <Calendar size={16} color="white" />
              </div>
              <span className="layout-nav-title">Nursing Scheduler</span>
            </div>
            <div className="layout-nav-links">
              <button
                className={`layout-nav-link ${isActive("/rooms") ? "active" : ""}`}
                onClick={() => navigate("/rooms")}
              >
                <DoorOpen size={14} />
                Rooms
              </button>
              <button
                className={`layout-nav-link ${isActive("/instructors") ? "active" : ""}`}
                onClick={() => navigate("/instructors")}
              >
                <GraduationCap size={14} />
                Instructors
              </button>
            </div>
          </div>

          <div className="layout-nav-right">
            {currentUser && (
              <div className="layout-user-pill">
                <div className="layout-user-avatar">
                  {currentUser.name?.charAt(0) || "U"}
                </div>
                <span className="layout-user-name">{currentUser.name}</span>
                {currentUser.role && (
                  <span className="layout-role-badge">{currentUser.role}</span>
                )}
              </div>
            )}
            <button className="layout-logout-btn" onClick={handleLogout}>
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </nav>

        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </>
  );
}
