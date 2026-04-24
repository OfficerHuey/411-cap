import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, User, Lock, Eye, EyeOff, Info, Copy, Check } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { login, register } from "../Lib/api";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { heroStagger, heroChild, ease } from "../Lib/motion";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { HairlineRule } from "./ui/HairlineRule";
import { SeluLogo } from "./ui/SeluLogo";
import styles from "./Login.module.css";

const SHOW_DEMO = import.meta.env.VITE_SHOW_DEMO_CREDS === "true";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegistering) {
        await register({ username, password });
      } else {
        await login({ username, password, rememberDevice });
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fillDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  const reduced = useReducedMotion();

  return (
    <div className={styles.root}>
      {/* ── left editorial hero ── */}
      <motion.div
        className={styles.panelLeft}
        initial={reduced ? undefined : { opacity: 0, x: -40 }}
        animate={reduced ? undefined : { opacity: 1, x: 0 }}
        transition={reduced ? undefined : { duration: 0.5, ease: ease.ios }}
      >
        <motion.span
          className={styles.stamp}
          initial={reduced ? undefined : { opacity: 0 }}
          animate={reduced ? undefined : { opacity: 1 }}
          transition={reduced ? undefined : { duration: 0.35, delay: 0.8, ease: ease.ios }}
        >
          Est. 1925
        </motion.span>

        <motion.div
          className={styles.crest}
          initial={reduced ? undefined : { opacity: 0, scale: 0.92 }}
          animate={reduced ? undefined : { opacity: 1, scale: 1 }}
          transition={reduced ? undefined : { duration: 0.45, delay: 0.95, ease: ease.ios }}
          aria-hidden
        >
          <SeluLogo size={52} />
        </motion.div>

        <motion.div
          className={styles.heroContent}
          variants={reduced ? undefined : heroStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={reduced ? undefined : heroChild}><HairlineRule width="64px" color="gold" spacing="normal" /></motion.div>

          <motion.h1 variants={reduced ? undefined : heroChild} className={styles.heroTitle}>
            Nursing student<br />
            <span className={styles.heroTitleItalic}>scheduler.</span>
          </motion.h1>

          <motion.div variants={reduced ? undefined : heroChild} className={styles.diamond} />

          <motion.p variants={reduced ? undefined : heroChild} className={styles.heroSubtitle}>
            A scheduling platform built for the Southeastern Louisiana
            University School of Nursing.
          </motion.p>
        </motion.div>

        <span className={styles.leftFooter}>
          Southeastern Louisiana University&ensp;&middot;&ensp;School of Nursing
        </span>
      </motion.div>

      {/* ── right form panel ── */}
      <motion.div
        className={styles.panelRight}
        initial={reduced ? undefined : { opacity: 0, x: 20 }}
        animate={reduced ? undefined : { opacity: 1, x: 0 }}
        transition={reduced ? undefined : { duration: 0.45, delay: 0.2, ease: ease.ios }}
      >
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={reduced ? undefined : { duration: 0.4, delay: 0.6, ease: ease.ios }}
        >
        <Card variant="elevated" className={styles.loginCard}>
          <HairlineRule width="48px" color="gold" spacing="normal" />

          <h2 className={styles.cardTitle}>
            {isRegistering ? "Create account." : "Welcome back."}
          </h2>
          <p className={styles.cardSubtitle}>
            {isRegistering
              ? "Register a new administrator account."
              : "Enter your credentials to continue."}
          </p>

          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGap}>
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                iconLeft={<User size={16} />}
                fullWidth
                required
              />
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                iconLeft={<Lock size={16} />}
                iconRight={
                  <button
                    type="button"
                    className={styles.pwToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                fullWidth
                required
              />
            </div>

            {!isRegistering && (
              <div className={styles.optionsRow}>
                <label className={styles.rememberLabel}>
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className={styles.rememberCheck}
                  />
                  Remember this device
                </label>
                <Link to="/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>
            )}

            <div className={styles.submitWrap}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                type="submit"
              >
                {loading
                  ? (isRegistering ? "Creating account\u2026" : "Signing in\u2026")
                  : (isRegistering ? "Create Account" : "Sign In")}
              </Button>
            </div>
          </form>

          <div className={styles.dividerRow}><span>or</span></div>

          <Button
            variant="outline"
            fullWidth
            onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
          >
            {isRegistering
              ? "Already have an account? Sign in"
              : "Need an account? Register"}
          </Button>

          {!isRegistering && SHOW_DEMO && (
            <>
              <HairlineRule color="muted" spacing="normal" />
              <button
                type="button"
                className={styles.demoToggle}
                onClick={() => setShowDemo(!showDemo)}
              >
                <Info size={14} />
                View demo credentials
              </button>

              {showDemo && (
                <div className={styles.demoPanel}>
                  <div className={styles.demoRow}>
                    <div className={styles.demoAccount}>
                      <span className={styles.demoLabel}>Admin</span>
                      <code>admin@selu.edu</code> / <code>DemoAdmin2026!</code>
                    </div>
                    <div className={styles.demoBtns}>
                      <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard("admin@selu.edu", "admin-user")}
                        title="Copy username"
                      >
                        {copiedField === "admin-user" ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard("DemoAdmin2026!", "admin-pass")}
                        title="Copy password"
                      >
                        {copiedField === "admin-pass" ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => fillDemo("admin@selu.edu", "DemoAdmin2026!")}>
                        Fill
                      </Button>
                    </div>
                  </div>

                  <div className={styles.demoRow}>
                    <div className={styles.demoAccount}>
                      <span className={styles.demoLabel}>Viewer</span>
                      <code>viewer@selu.edu</code> / <code>DemoViewer2026!</code>
                    </div>
                    <div className={styles.demoBtns}>
                      <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard("viewer@selu.edu", "viewer-user")}
                        title="Copy username"
                      >
                        {copiedField === "viewer-user" ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard("DemoViewer2026!", "viewer-pass")}
                        title="Copy password"
                      >
                        {copiedField === "viewer-pass" ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => fillDemo("viewer@selu.edu", "DemoViewer2026!")}>
                        Fill
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
