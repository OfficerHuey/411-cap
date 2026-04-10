import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../Lib/api";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { NumberBadge } from "./ui/NumberBadge";
import { HairlineRule } from "./ui/HairlineRule";
import styles from "./ForgotPassword.module.css";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <Card variant="elevated" className={styles.card}>
        <NumberBadge number="01" variant="gold" size="sm" />
        <HairlineRule width="48px" color="gold" spacing="normal" />

        {sent ? (
          <>
            <h2 className={styles.title}>Check your email.</h2>
            <p className={styles.subtitle}>
              If an account with that email exists, we sent a password reset link.
              The link expires in 1 hour.
            </p>
            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h2 className={styles.title}>Forgot password?</h2>
            <p className={styles.subtitle}>
              Enter your username or email and we'll send you a reset link.
            </p>

            {error && (
              <div className={styles.errorAlert}>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                label="Email / Username"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@selu.edu"
                iconLeft={<Mail size={16} />}
                fullWidth
                required
              />

              <div className={styles.submitWrap}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  type="submit"
                >
                  {loading ? "Sending\u2026" : "Send Reset Link"}
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
