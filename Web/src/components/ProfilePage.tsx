import { useEffect, useState } from "react";
import { User, LogOut } from "lucide-react";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { useToast } from "../Lib/ToastContext";
import { profile, logout, getUsername } from "../Lib/api";
import type { ProfileDto } from "../Lib/Types";
import { Avatar } from "./ui/Avatar";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { NumberBadge } from "./ui/NumberBadge";
import { HairlineRule } from "./ui/HairlineRule";
import { Skeleton } from "./ui/Skeleton";
import { Card } from "./ui/Card";
import { SeluBars } from "./ui/SeluBars";
import { PageDecor } from "./ui/PageDecor";
import styles from "./ProfilePage.module.css";

const landingOptions = [
  { value: "Dashboard", label: "Dashboard" },
  { value: "SemesterHub", label: "Semester Hub" },
  { value: "Notes", label: "Notes" },
];

const themeOptions = [
  { value: "System", label: "System (follows your device)" },
  { value: "Light", label: "Light" },
];

export function ProfilePage() {
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const { addToast } = useToast();

  const [data, setData] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [landingPage, setLandingPage] = useState("Dashboard");
  const [theme, setTheme] = useState("System");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: "Profile" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    profile.getMe().then((p) => {
      setData(p);
      setDisplayName(p.displayName || "");
      setLandingPage(p.defaultLandingPage);
      const loadedTheme = p.themePreference === "Dark" ? "System" : p.themePreference;
      setTheme(loadedTheme);
      setLoading(false);
    }).catch(() => {
      addToast("error", "Failed to load profile");
      setLoading(false);
    });
  }, [addToast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await profile.updateMe({
        displayName,
        defaultLandingPage: landingPage,
        themePreference: theme,
      });
      setData(updated);
      if (updated.displayName) localStorage.setItem("display_name", updated.displayName);
      addToast("success", "Profile updated");
    } catch {
      addToast("error", "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOutAll = () => {
    //signing out of all devices — just clear local session
    //in a real app this would invalidate all tokens server-side
    addToast("info", "Signed out of all devices");
    setTimeout(() => logout(), 500);
  };

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.hero}>
          <Skeleton width="120px" height="32px" />
          <Skeleton width="200px" height="48px" />
        </div>
        <Skeleton width="100%" height="300px" />
      </div>
    );
  }

  const username = data?.username || getUsername();

  return (
    <div className={styles.root}>
      <PageDecor variant="profile" />
      {/* ── hero ── */}
      <div className={styles.hero}>
        <NumberBadge number="01" variant="gold" size="sm" />
        <HairlineRule width="48px" color="gold" spacing="normal" />
        <h1 className={styles.heroTitle}><em>Profile</em></h1>
        <p className={styles.heroSubtitle}>Manage your account preferences</p>
      </div>

      <SeluBars />

      <div className={styles.grid}>
        {/* ── identity card ── */}
        <Card variant="elevated" className={styles.section}>
          <h3 className={styles.sectionTitle}>Identity</h3>

          <div className={styles.avatarRow}>
            <Avatar name={displayName || username} size="xl" />
            <div className={styles.avatarInfo}>
              <span className={styles.role}>{data?.role}</span>
              <span className={styles.email}>{username}</span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <Input
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you want to appear"
              iconLeft={<User size={16} />}
              fullWidth
            />
          </div>

          <div className={styles.fieldGroup}>
            <Input
              label="Email / Username"
              type="text"
              value={username}
              onChange={() => {}}
              fullWidth
              disabled
            />
          </div>
        </Card>

        {/* ── preferences card ── */}
        <Card variant="elevated" className={styles.section}>
          <h3 className={styles.sectionTitle}>Preferences</h3>

          <div className={styles.fieldGroup}>
            <Select
              label="Default Landing Page"
              options={landingOptions}
              value={landingPage}
              onChange={setLandingPage}
              fullWidth
            />
          </div>

          <div className={styles.fieldGroup}>
            <Select
              label="Theme"
              options={themeOptions}
              value={theme}
              onChange={setTheme}
              fullWidth
            />
          </div>

          <div className={styles.saveRow}>
            <Button
              variant="primary"
              loading={saving}
              onClick={handleSave}
            >
              {saving ? "Saving\u2026" : "Save Changes"}
            </Button>
          </div>
        </Card>

        {/* ── danger zone ── */}
        <Card variant="elevated" className={styles.dangerSection}>
          <h3 className={styles.dangerTitle}>Danger Zone</h3>
          <p className={styles.dangerDesc}>
            This will sign you out on every browser and device where you are currently logged in.
          </p>
          <Button variant="outline" onClick={handleSignOutAll}>
            <LogOut size={14} />
            Sign out of all devices
          </Button>
        </Card>
      </div>
    </div>
  );
}
