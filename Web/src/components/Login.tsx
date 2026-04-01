import { useState } from "react";
import "../App.css";
import { AlertCircle, User, Lock, Eye, EyeOff } from "lucide-react";
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
          font-family: 'DM Sans', sans-serif;
          background-color: #003d2a;
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(0, 86, 63, 0.6) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(0, 60, 40, 0.8) 0%, transparent 50%);
        }

        .login-panel-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          width: 45%;
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 900px) {
          .login-panel-left { display: flex; }
        }

        .login-panel-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .left-hero { position: relative; z-index: 1; }

        .left-hero h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2.6rem;
          font-weight: 500;
          color: #ffffff;
          line-height: 1.25;
          margin: 0 0 1rem 0;
        }

        .left-hero h2 em { font-style: italic; color: #C8952C; }

        .left-hero p {
          color: rgba(255,255,255,0.55);
          font-size: 0.95rem;
          line-height: 1.7;
          margin: 0;
          font-weight: 300;
        }

        .left-footer {
          color: rgba(255,255,255,0.3);
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .login-panel-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #f8f7f4;
        }

        .login-card { width: 100%; max-width: 420px; }

        .login-card-header { margin-bottom: 2.5rem; }

        .login-card-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0 0 0.4rem 0;
        }

        .login-card-header p { color: #6b7280; font-size: 0.9rem; margin: 0; font-weight: 300; }

        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 3px solid #dc2626;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
        }

        .error-box p { margin: 0; font-size: 0.85rem; color: #991b1b; }

        .form-group { margin-bottom: 1.25rem; }

        .form-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: #374151;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .input-wrap { position: relative; }

        .input-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }

        .input-field {
          width: 100%;
          padding: 0.75rem 0.875rem 0.75rem 2.75rem;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }

        .input-field::placeholder { color: #d1d5db; }

        .input-field:focus {
          border-color: #00563f;
          box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.15);
        }

        .input-toggle {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .input-toggle:hover { color: #6b7280; }

        .btn-submit {
          width: 100%;
          padding: 0.8rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: background 0.15s, transform 0.1s;
          margin-top: 0.5rem;
        }

        .btn-submit:hover { background: #003d2a; }
        .btn-submit:active { transform: scale(0.99); }
        .btn-submit:disabled { background: #6b7280; cursor: not-allowed; }

        .demo-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e9e7e2;
          position: relative;
        }

        .demo-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          color: #6b7280;
          padding: 0;
          transition: color 0.15s;
        }

        .demo-toggle:hover { color: #0a1f14; }

        .demo-creds {
          margin-top: 1rem;
          padding: 1rem;
          background: #f0faf5;
          border: 1px solid #c6e8d8;
          border-radius: 8px;
        }

        .demo-creds-title {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #00563f;
          margin: 0 0 0.5rem;
        }

        .demo-creds-row {
          font-size: 0.82rem;
          color: #374151;
          margin: 0 0 0.75rem;
        }

        .demo-creds-row code {
          background: #ffffff;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.78rem;
          border: 1px solid #e5e2db;
          font-family: 'DM Mono', monospace;
        }

        .demo-fill-btn {
          width: 100%;
          padding: 0.5rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .demo-fill-btn:hover { background: #003d2a; }

        .btn-submit .btn-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: btn-spin 0.6s linear infinite;
          margin-right: 0.5rem;
          vertical-align: middle;
        }

        @keyframes btn-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-root">
        <div className="login-panel-left">
          <div />
          <div className="left-hero">
            <h2>
              Nursing student <em>scheduler</em>
            </h2>
            <p>A scheduling tool for nursing students.</p>
          </div>
          <div className="left-footer">
            Southeastern Louisiana University · School of Nursing
          </div>
        </div>

        <div className="login-panel-right">
          <div className="login-card">
            <div className="login-card-header">
              <h1>{isRegistering ? "Create Account" : "Sign In"}</h1>
              <p>{isRegistering ? "Register a new account" : "Enter your credentials to continue"}</p>
            </div>

            {error && (
              <div className="error-box">
                <AlertCircle
                  size={16}
                  color="#dc2626"
                  style={{ flexShrink: 0, marginTop: 1 }}
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
                {loading && <span className="btn-spinner" />}
                {loading ? "Signing in..." : isRegistering ? "Create Account" : "Sign In"}
              </button>
            </form>

            <div className="demo-section">
              <button
                onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
                className="demo-toggle"
              >
                {isRegistering ? "Already have an account? Sign in" : "Need an account? Register"}
              </button>

              {!isRegistering && (
                <div className="demo-creds">
                  <p className="demo-creds-title">Demo Credentials</p>
                  <div className="demo-creds-row">
                    <span>Admin:</span> <code>admin</code> / <code>Password1!</code>
                  </div>
                  <button
                    type="button"
                    className="demo-fill-btn"
                    onClick={() => { setUsername("admin"); setPassword("Password1!"); }}
                  >
                    Fill demo credentials
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
