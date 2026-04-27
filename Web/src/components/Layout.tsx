import { useState, useEffect, useRef, useCallback } from "react";
import { LogOut, DoorOpen, GraduationCap, Archive, Search, StickyNote, Menu, X, BookOpen, Users, FolderOpen, MessageSquare } from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { authService } from "../Lib/Auth";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { NavigationDirectionProvider } from "../Lib/NavigationDirection";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { spring, reducedFade } from "../Lib/motion";
import { messagingApi } from "../Lib/api";
import { Avatar } from "./ui/Avatar";
import { Tooltip } from "./ui/Tooltip";
import { Breadcrumbs } from "./ui/Breadcrumbs";
import { loadingBar } from "./ui/LoadingBar";
import { PageTransition } from "./ui/PageTransition";
import { CommandPalette } from "./CommandPalette";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { SeluLogo } from "./ui/SeluLogo";
import styles from "./Layout.module.css";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const { items: breadcrumbItems } = useBreadcrumbs();
  const reduced = useReducedMotion();

  const [showPalette, setShowPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  //unread-message count badge, refreshed every 15s via polling. skipped
  //while the tab is hidden and while the user is on /messages (that page
  //already polls and marks read as threads are opened)
  const [unreadCount, setUnreadCount] = useState(0);

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

  //map any route to the nav link that owns it hierarchically
  const getActiveNavPath = (pathname: string): string => {
    if (pathname.startsWith("/semester/")) return "/";
    if (pathname.startsWith("/schedule-builder/")) return "/";
    if (pathname.startsWith("/changelog/")) return "/";
    if (pathname.startsWith("/courses")) return "/courses";
    if (pathname.startsWith("/students")) return "/students";
    if (pathname.startsWith("/rooms")) return "/rooms";
    if (pathname.startsWith("/instructors")) return "/instructors";
    if (pathname.startsWith("/notes")) return "/notes";
    if (pathname.startsWith("/files")) return "/files";
    if (pathname.startsWith("/messages")) return "/messages";
    if (pathname.startsWith("/archive")) return "/archive";
    if (pathname.startsWith("/profile")) return "/profile";
    return "/";
  };

  const getDepthLevel = (pathname: string): number => {
    if (pathname.startsWith("/schedule-builder/")) return 2;
    if (pathname.startsWith("/changelog/")) return 2;
    if (pathname.startsWith("/semester/")) return 1;
    return 0;
  };

  const activeNavPath = getActiveNavPath(location.pathname);
  const depthLevel = getDepthLevel(location.pathname);
  const isActive = (path: string) => path === activeNavPath;

  //close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  //loading bar on route changes
  const prevPath = useRef(location.pathname);
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      loadingBar.start();
      setTimeout(() => loadingBar.finish(), 400);
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  //scroll to top on route change so new pages always start at the top edge
  //'instant' overrides the global scroll-behavior:smooth — smooth scroll-to-top
  //on route change feels sluggish vs. an immediate reset
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  //poll unread message count for the nav badge. tick at mount + every 15s.
  //skip polling while on /messages since that page drives its own reads
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState === "hidden") return;
      if (location.pathname.startsWith("/messages")) {
        //let the messages page drive state; still fetch a zero on entry so
        //the badge clears for reads made on that page
        try {
          const res = await messagingApi.unreadCount();
          if (!cancelled) setUnreadCount(res.count);
        } catch {
          //non-blocking
        }
        return;
      }
      try {
        const res = await messagingApi.unreadCount();
        if (!cancelled) setUnreadCount(res.count);
      } catch {
        //non-blocking; keep last known value
      }
    };
    tick();
    const handle = setInterval(tick, 15_000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [location.pathname]);

  const navLinks = [
    { path: "/", label: "Dashboard", icon: null },
    { path: "/courses", label: "Courses", icon: BookOpen },
    { path: "/students", label: "Students", icon: GraduationCap },
    { path: "/rooms", label: "Rooms", icon: DoorOpen },
    { path: "/instructors", label: "Instructors", icon: Users },
    { path: "/messages", label: "Messages", icon: MessageSquare },
    { path: "/notes", label: "Notes", icon: StickyNote },
    { path: "/files", label: "Files", icon: FolderOpen },
    { path: "/archive", label: "Archive", icon: Archive },
  ];

  return (
    <NavigationDirectionProvider>
    <div className={styles.root}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          {/* brand */}
          <div className={styles.brand} onClick={() => navigate("/")}>
            <SeluLogo size={40} className={styles.brandLogo} />
            <div className={styles.brandType}>
              <span className={styles.brandName}>Nursing Scheduler</span>
              <span className={styles.brandSubtitle}>SELU &middot; School of Nursing</span>
            </div>
          </div>

          {/* center nav */}
          <div className={styles.navCenter}>
            <LayoutGroup id="nav-active">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <button
                    key={link.path}
                    className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                    onClick={() => navigate(link.path)}
                  >
                    {active && depthLevel > 0 && (
                      <span
                        aria-hidden="true"
                        style={{ fontSize: "0.6rem", opacity: 0.5, marginRight: "0.2rem" }}
                      >
                        &#x21A9;
                      </span>
                    )}
                    {link.icon && <link.icon size={14} />}
                    {link.label}
                    {link.path === "/messages" && unreadCount > 0 && (
                      <span
                        className={styles.navBadge}
                        aria-label={`${unreadCount} unread messages`}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    {active && !reduced && (
                      <motion.span
                        layoutId="nav-active-indicator"
                        className={styles.navActiveIndicator}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </LayoutGroup>
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

            <button
              className={styles.hamburgerBtn}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {breadcrumbItems.length > 0 && <Breadcrumbs items={breadcrumbItems} />}

      <main className={styles.main}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
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

      {/* mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className={styles.drawerOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduced ? reducedFade : { duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className={styles.drawer}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={reduced ? reducedFade : spring.drawer}
              style={{ willChange: "transform" }}
            >
              <div className={styles.drawerHeader}>
                <span className={styles.drawerTitle}>Menu</span>
                <button
                  className={styles.drawerClose}
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className={styles.drawerNav}>
                {navLinks.map((link) => (
                  <button
                    key={link.path}
                    className={`${styles.drawerLink} ${isActive(link.path) ? styles.drawerLinkActive : ""}`}
                    onClick={() => navigate(link.path)}
                  >
                    {link.icon && <link.icon size={18} />}
                    {link.label}
                    {link.path === "/messages" && unreadCount > 0 && (
                      <span className={styles.navBadge}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {currentUser && (
                <div className={styles.drawerFooter}>
                  <Avatar name={currentUser.name || "User"} size="sm" />
                  <div className={styles.drawerUser}>
                    <div className={styles.drawerUserName}>{currentUser.name}</div>
                    <div className={styles.drawerUserRole}>{currentUser.role}</div>
                  </div>
                  <button
                    className={styles.drawerLogout}
                    onClick={handleLogout}
                    aria-label="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </NavigationDirectionProvider>
  );
}
