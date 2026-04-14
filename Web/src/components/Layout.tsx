import { useState, useEffect, useRef, useCallback } from "react";
import { Calendar, LogOut, DoorOpen, GraduationCap, Archive, Search, StickyNote } from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { authService } from "../Lib/Auth";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { Avatar } from "./ui/Avatar";
import { Tooltip } from "./ui/Tooltip";
import { Breadcrumbs } from "./ui/Breadcrumbs";
import { loadingBar } from "./ui/LoadingBar";
import { PageTransition } from "./ui/PageTransition";
import { CommandPalette } from "./CommandPalette";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import styles from "./Layout.module.css";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const { items: breadcrumbItems } = useBreadcrumbs();

  const [showPalette, setShowPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleLogout = () => {
    authService.logout();
  };

  const openPalette = useCallback(() => setShowPalette(true), []);
  const closePalette = useCallback(() => setShowPalette(false), []);
  const openShortcuts = useCallback(() => setShowShortcuts(true), []);
  const closeShortcuts = useCallback(() => setShowShortcuts(false), []);

  //global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      //cmd/ctrl+k — open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowPalette((prev) => !prev);
        return;
      }

      //skip remaining shortcuts when typing in inputs
      if (inInput) return;

      //? — open keyboard shortcuts
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  //loading bar on route changes
  const prevPath = useRef(location.pathname);
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      loadingBar.start();
      setTimeout(() => loadingBar.finish(), 400);
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  const navLinks = [
    { path: "/", label: "Dashboard", icon: null },
    { path: "/rooms", label: "Rooms", icon: DoorOpen },
    { path: "/instructors", label: "Instructors", icon: GraduationCap },
    { path: "/notes", label: "Notes", icon: StickyNote },
    { path: "/archive", label: "Archive", icon: Archive },
  ];

  return (
    <div className={styles.root}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          {/* brand */}
          <div className={styles.brand} onClick={() => navigate("/")}>
            <div className={styles.brandMark}>
              <Calendar size={18} />
            </div>
            <div className={styles.brandType}>
              <span className={styles.brandName}>Nursing Scheduler</span>
              <span className={styles.brandSubtitle}>SELU &middot; School of Nursing</span>
            </div>
          </div>

          {/* center nav */}
          <div className={styles.navCenter}>
            {navLinks.map((link) => (
              <button
                key={link.path}
                className={`${styles.navLink} ${isActive(link.path) ? styles.navLinkActive : ""}`}
                onClick={() => navigate(link.path)}
              >
                {link.icon && <link.icon size={14} />}
                {link.label}
              </button>
            ))}
          </div>

          {/* right section */}
          <div className={styles.navRight}>
            <button className={styles.cmdTrigger} type="button" onClick={openPalette}>
              <Search size={14} className={styles.cmdIcon} />
              <span className={styles.cmdText}>Search&hellip;</span>
              <kbd className={styles.cmdKbd}>&thinsp;&#8984;K&thinsp;</kbd>
            </button>

            {currentUser && (
              <button
                className={styles.avatarBtn}
                onClick={() => navigate("/profile")}
                aria-label="Go to profile"
              >
                <Avatar name={currentUser.name || "User"} size="sm" />
              </button>
            )}

            <Tooltip content="Sign out" position="bottom">
              <button
                className={styles.logoutBtn}
                onClick={handleLogout}
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </Tooltip>
          </div>
        </div>
      </nav>

      {breadcrumbItems.length > 0 && <Breadcrumbs items={breadcrumbItems} />}

      <main className={styles.main}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <CommandPalette
        isOpen={showPalette}
        onClose={closePalette}
        onOpenShortcuts={openShortcuts}
      />
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={closeShortcuts}
      />
    </div>
  );
}
