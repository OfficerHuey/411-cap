import "../App.css";
import { Calendar, LogOut, DoorOpen, GraduationCap } from "lucide-react";
import { useNavigate, Outlet } from "react-router-dom";
import { authService } from "../Lib/Auth";

export function Layout() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <>
      <style>{`
        .layout-root {
          min-height: 100vh;
          background: #f8f7f4;
          font-family: 'DM Sans', sans-serif;
        }

        .layout-nav {
          background: #00563f;
          height: 64px;
          padding: 0 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }

        .layout-nav-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          cursor: pointer;
        }

        .layout-nav-icon {
          width: 36px;
          height: 36px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .layout-nav-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          color: #ffffff;
          letter-spacing: 0.01em;
        }

        .layout-nav-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .layout-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.75rem;
          background: none;
          border: none;
          border-radius: 6px;
          color: rgba(255,255,255,0.7);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s, background 0.15s;
        }

        .layout-nav-link:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.1);
        }

        .layout-nav-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .layout-user-name {
          font-size: 0.88rem;
          font-weight: 500;
          color: #ffffff;
        }

        .layout-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.68rem;
          font-weight: 500;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: rgba(200, 149, 44, 0.25);
          color: #C8952C;
          border: 1px solid rgba(200, 149, 44, 0.4);
        }

        .layout-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 1rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 7px;
          color: #ffffff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.15s;
        }

        .layout-logout-btn:hover {
          background: rgba(255,255,255,0.2);
        }

        .layout-main {
          padding: 2.5rem 2rem;
        }
      `}</style>

      <div className="layout-root">
        <nav className="layout-nav">
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <div className="layout-nav-left" onClick={() => navigate("/")}>
              <div className="layout-nav-icon">
                <Calendar size={18} color="white" />
              </div>
              <span className="layout-nav-title">Nursing Scheduler</span>
            </div>
            <div className="layout-nav-links">
              <button className="layout-nav-link" onClick={() => navigate("/rooms")}>
                <DoorOpen size={14} />
                Rooms
              </button>
              <button className="layout-nav-link" onClick={() => navigate("/instructors")}>
                <GraduationCap size={14} />
                Instructors
              </button>
            </div>
          </div>

          <div className="layout-nav-right">
            {currentUser && (
              <>
                <span className="layout-user-name">{currentUser.name}</span>
                {currentUser.role && (
                  <span className="layout-role-badge">{currentUser.role}</span>
                )}
              </>
            )}
            <button className="layout-logout-btn" onClick={handleLogout}>
              <LogOut size={14} />
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
