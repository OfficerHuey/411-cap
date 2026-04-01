import { useState } from "react";
import "../App.css";
import { AlertCircle, User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../Lib/api";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      <style>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #00563f;
        }

        /* ---- left branding panel ---- */
        .login-panel-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 3.5rem;
          width: 46%;
          position: relative;
          overflow: hidden;
          background:
            linear-gradient(165deg, #002a1d 0%, #00563f 40%, #003d2a 100%);
        }

        @media (min-width: 900px) {
          .login-panel-left { display: flex; }
        }

        .login-panel-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .login-panel-left::after {
          content: '';
          position: absolute;
          bottom: -20%;
          right: -10%;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(200,149,44,0.08) 0%, transparent 70%);
          border-radius: 50%;
        }

        .left-brand {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .left-brand-dot {
          width: 10px;
          height: 10px;
          background: #C8952C;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .left-brand span {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.45);
        }

        .left-hero {
          position: relative;
          z-index: 1;
          animation: loginFadeUp 0.8s ease both;
          animation-delay: 0.15s;
        }

        .left-hero h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2.8rem;
          font-weight: 500;
          color: #ffffff;
          line-height: 1.2;
          margin: 0 0 1.25rem 0;
          letter-spacing: -0.01em;
        }

        .left-hero h2 em {
          font-style: italic;
          color: #C8952C;
        }

        .left-hero p {
          color: rgba(255,255,255,0.5);
          font-size: 1rem;
          line-height: 1.7;
          margin: 0;
          font-weight: 300;
          max-width: 380px;
        }

        .left-features {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 2.5rem;
        }

        .left-feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: rgba(255,255,255,0.4);
          font-size: 0.82rem;
          font-weight: 400;
        }

        .left-feature-dot {
          width: 6px;
          height: 6px;
          background: #C8952C;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .left-footer {
          position: relative;
          z-index: 1;
          color: rgba(255,255,255,0.2);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* ---- right form panel ---- */
        .login-panel-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem;
          background: #fafaf9;
          position: relative;
        }

        @media (max-width: 899px) {
          .login-panel-right {
            background:
              linear-gradient(180deg, rgba(0,86,63,0.03) 0%, #fafaf9 30%);
          }
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          animation: loginFadeUp 0.6s ease both;
        }

        .login-card-header {
          margin-bottom: 2rem;
        }

        .login-card-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 1.85rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.01em;
        }

        .login-card-header p {
          color: #6b7280;
          font-size: 0.88rem;
          margin: 0;
          font-weight: 400;
        }

        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          margin-bottom: 1.5rem;
          animation: loginFadeUp 0.3s ease both;
        }

        .error-box p {
          margin: 0;
          font-size: 0.85rem;
          color: #991b1b;
          line-height: 1.5;
        }

        .form-group { margin-bottom: 1.25rem; }

        .form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .input-wrap { position: relative; }

        .input-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #d1d5db;
          pointer-events: none;
          transition: color 0.2s;
        }

        .input-wrap:focus-within .input-icon {
          color: #00563f;
        }

        .input-field {
          width: 100%;
          padding: 0.8rem 0.875rem 0.8rem 2.75rem;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          color: #111827;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
        }

        .input-field::placeholder { color: #d1d5db; }

        .input-field:focus {
          border-color: #00563f;
          box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1);
          background: #ffffff;
        }

        .input-toggle {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #d1d5db;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }

        .input-toggle:hover { color: #6b7280; }

        .btn-submit {
          width: 100%;
          padding: 0.85rem;
          background: linear-gradient(135deg, #00563f 0%, #003d2a 100%);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: all 0.2s ease;
          margin-top: 0.75rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,86,63,0.2), 0 4px 12px rgba(0,86,63,0.15);
        }

        .btn-submit:hover {
          box-shadow: 0 1px 3px rgba(0,86,63,0.25), 0 8px 24px rgba(0,86,63,0.2);
          transform: translateY(-1px);
        }

        .btn-submit:active { transform: translateY(0); }
        .btn-submit:disabled { background: #9ca3af; box-shadow: none; cursor: not-allowed; transform: none; }

        .btn-submit .btn-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: btn-spin 0.6s linear infinite;
        }

        @keyframes btn-spin { to { transform: rotate(360deg); } }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 2rem 0 1.5rem;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        .login-divider span {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .btn-switch-mode {
          width: 100%;
          padding: 0.75rem;
          background: #ffffff;
          color: #374151;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-switch-mode:hover {
          border-color: #00563f;
          color: #00563f;
          background: #f0faf5;
        }

        .quick-start {
          margin-top: 1.5rem;
          padding: 1rem 1.25rem;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          animation: loginFadeUp 0.5s ease both;
          animation-delay: 0.2s;
        }

        .quick-start-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #00563f;
          margin: 0 0 0.5rem;
        }

        .quick-start-text {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 0 0 0.75rem;
          line-height: 1.5;
        }

        .quick-start-text code {
          background: #f3f4f6;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.78rem;
          color: #374151;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }

        .btn-fill {
          width: 100%;
          padding: 0.5rem;
          background: #f0faf5;
          color: #00563f;
          border: 1px solid #c6e8d8;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-fill:hover { background: #00563f; color: #ffffff; border-color: #00563f; }

        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="login-root">
        <div className="login-panel-left">
          <div className="left-brand">
            <div className="left-brand-dot" />
            <span>Southeastern Louisiana University</span>
          </div>

          <div className="left-hero">
            <h2>
              Clinical<br />
              <em>Scheduling</em><br />
              Made Simple
            </h2>
            <p>
              Build semester schedules, assign students to clinical groups,
              manage rooms and instructors — all in one place.
            </p>
            <div className="left-features">
              <div className="left-feature">
                <div className="left-feature-dot" />
                Drag-and-drop schedule builder
              </div>
              <div className="left-feature">
                <div className="left-feature-dot" />
                Automatic conflict detection
              </div>
              <div className="left-feature">
                <div className="left-feature-dot" />
                One-click registrar export
              </div>
            </div>
          </div>

          <div className="left-footer">
            School of Nursing · Department Scheduling System
          </div>
        </div>

        <div className="login-panel-right">
          <div className="login-card">
            <div className="login-card-header">
              <h1>{isRegistering ? "Create Account" : "Welcome back"}</h1>
              <p>{isRegistering ? "Register a new administrator account" : "Sign in to continue to your dashboard"}</p>
            </div>

            {error && (
              <div className="error-box">
                <AlertCircle
                  size={16}
                  color="#dc2626"
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="input-field"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    {isRegistering ? "Creating account…" : "Signing in…"}
                  </>
                ) : (
                  <>
                    {isRegistering ? "Create Account" : "Sign In"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="btn-switch-mode"
              onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
            >
              {isRegistering ? "Already have an account? Sign in" : "Need an account? Register"}
            </button>

            {!isRegistering && (
              <div className="quick-start">
                <p className="quick-start-label">Quick Start</p>
                <p className="quick-start-text">
                  First time? Register above. Or use <code>admin</code> / <code>Password1!</code>
                </p>
                <button
                  type="button"
                  className="btn-fill"
                  onClick={() => { setUsername("admin"); setPassword("Password1!"); }}
                >
                  Fill credentials
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
