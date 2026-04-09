import { useState } from "react";
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../Lib/api";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { NumberBadge } from "./ui/NumberBadge";
import { HairlineRule } from "./ui/HairlineRule";
import styles from "./ResetPassword.module.css";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <Card variant="elevated" className={styles.card}>
        <NumberBadge number="01" variant="gold" size="sm" />
        <HairlineRule width="48px" color="gold" spacing="normal" />

        {done ? (
          <>
            <h2 className={styles.title}>Password reset.</h2>
            <p className={styles.subtitle}>
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={14} />
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <h2 className={styles.title}>Reset password.</h2>
            <p className={styles.subtitle}>
              Choose a new password. Must be at least 12 characters.
            </p>

            {error && (
              <div className={styles.errorAlert}>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGap}>
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 12 characters"
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
                <Input
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  iconLeft={<Lock size={16} />}
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
                  {loading ? "Resetting\u2026" : "Reset Password"}
                </Button>
              </div>
            </form>

            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
