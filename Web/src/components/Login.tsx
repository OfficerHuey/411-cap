import { useState } from "react";
import { AlertCircle, User, Lock, Eye, EyeOff, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../Lib/api";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { NumberBadge } from "./ui/NumberBadge";
import { HairlineRule } from "./ui/HairlineRule";
import styles from "./Login.module.css";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegistering) {
        await register({ username, password });
      } else {
        await login({ username, password });
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setUsername("admin");
    setPassword("Password1!");
  };

  return (
    <div className={styles.root}>
      {/* ── left editorial hero ── */}
      <div className={styles.panelLeft}>
        <span className={styles.stamp}>N&#186; 01&ensp;&middot;&ensp;Est. 1925</span>

        <div className={styles.heroContent}>
          <NumberBadge number="01" variant="gold" size="sm" />
          <HairlineRule width="64px" color="gold" spacing="normal" />

          <h1 className={styles.heroTitle}>
            Nursing student<br />
            <span className={styles.heroTitleItalic}>scheduler.</span>
          </h1>

          <div className={styles.diamond} />

          <p className={styles.heroSubtitle}>
            A scheduling platform built for the Southeastern Louisiana
            University School of Nursing.
          </p>
        </div>

        <span className={styles.leftFooter}>
          Southeastern Louisiana University&ensp;&middot;&ensp;School of Nursing
        </span>
      </div>

      {/* ── right form panel ── */}
      <div className={styles.panelRight}>
        <Card variant="elevated" className={styles.loginCard}>
          <NumberBadge number="02" variant="gold" size="sm" />
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

          {!isRegistering && (
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
                    Admin: <code>admin</code> / <code>Password1!</code>
                  </div>
                  <Button variant="ghost" size="sm" fullWidth onClick={fillDemo}>
                    Fill demo credentials
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
