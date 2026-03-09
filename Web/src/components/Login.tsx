import { useState } from "react";
import "../App.css";
import {
  Calendar,
  AlertCircle,
  Mail,
  Info,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../Lib/Auth";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showITPopup, setShowITPopup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const user = authService.login(email, password);
    if (user) {
      navigate("/");
    } else {
      setError("Invalid email or password. Please try again.");
    }
  };

  const mockCredentials = authService.getMockCredentials();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background-color: #003d2a;
          background-image:
           radial-gradient(ellipse at 20% 50%, rgba(0, 86, 63, 0.6) 0%, transparent 60%),
radial-gradient(ellipse at 80% 20%, rgba(0, 60, 40, 0.8) 0%, transparent 50%);
        }

        /* Left panel */
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

        .left-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .left-logo-icon {
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .left-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.01em;
        }

        .left-hero {
          position: relative;
          z-index: 1;
        }

        .left-hero h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2.6rem;
          font-weight: 500;
          color: #ffffff;
          line-height: 1.25;
          margin: 0 0 1rem 0;
        }

        .left-hero h2 em {
          font-style: italic;
          color: #C8952C;
        }

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

        /* Right panel */
        .login-panel-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #f8f7f4;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
        }

        .login-card-header {
          margin-bottom: 2.5rem;
        }

        .login-card-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 600;
          color: #000000;
          margin: 0 0 0.4rem 0;
        }

        .login-card-header p {
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0;
          font-weight: 300;
        }

       

        /* Error */
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

        .error-box p {
          margin: 0;
          font-size: 0.85rem;
          color: #991b1b;
        }

        /* Form */
        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: #000000;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #000000;
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
          color: #C8952C;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }

        .input-field::placeholder {
          color: #d1d5db;
        }

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

        /* Submit button */
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

        .btn-submit:hover { background: #C8952C.; }
        .btn-submit:active { transform: scale(0.99); }

        /* Demo credentials */
        .demo-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e9e7e2;
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
          color: #C8952C;
          padding: 0;
          transition: color 0.15s;
        }

        .demo-toggle:hover { color: #0f1f3d; }

        .demo-list {
          margin-top: 1rem;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .demo-item {
          padding: 0.875rem 1rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .demo-item:last-child { border-bottom: none; }

        .demo-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.375rem;
        }

        .demo-name {
          font-size: 0.85rem;
          font-weight: 500;
          color: #111827;
        }

        .role-badge {
          font-size: 0.7rem;
          font-weight: 500;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .role-admin { background: #ede9fe; color: #5b21b6; }
        .role-professor { background: #dbeafe; color: #1d4ed8; }
        .role-student { background: #d1fae5; color: #065f46; }

        .demo-creds {
          display: flex;
          gap: 1.5rem;
        }

        .demo-cred-item {
          font-size: 0.78rem;
          color: #6b7280;
        }

        .demo-cred-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9ca3af;
          display: block;
          margin-bottom: 0.1rem;
        }

        .demo-cred-value {
          font-family: 'DM Mono', 'Courier New', monospace;
          color: #374151;
        }

        .demo-note {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.875rem;
          line-height: 1.5;
        }

        /* Footer */
        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.78rem;
          color: #9ca3af;
        }
      `}</style>

      <div className="login-root">
        {/* Left decorative panel */}
        <div className="login-panel-left">
          <div></div> {/* spacer */}
          <div className="left-hero">
            <h2>
              Nursing student scheduler <em>DEMO</em>
            </h2>
            <p>A scheduling tool for nursing students.</p>
          </div>
          <div className="left-footer">
            Southeastern Louisiana University · School of Nursing
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-panel-right">
          <div className="login-card">
            <div className="login-card-header">
              <h1>Sign In</h1>
              <div className="divider" />
              <p>Enter your credentials to continue</p>
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
                <label className="form-label">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field"
                    placeholder="professor@nursing.edu"
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
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-submit">
                Sign In
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="demo-section">
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="demo-toggle"
              >
                <Info size={14} />
                {showCredentials ? "Hide" : "Show"} demo credentials
              </button>

              {showCredentials && (
                <div className="demo-list">
                  {mockCredentials.map((cred, idx) => (
                    <div key={idx} className="demo-item">
                      <div className="demo-item-header">
                        <span className="demo-name">{cred.name}</span>
                        <span className={`role-badge role-${cred.role}`}>
                          {cred.role}
                        </span>
                      </div>
                      <div className="demo-creds">
                        <div className="demo-cred-item">
                          <span className="demo-cred-label">Email</span>
                          <span className="demo-cred-value">{cred.email}</span>
                        </div>
                        <div className="demo-cred-item">
                          <span className="demo-cred-label">Password</span>
                          <span className="demo-cred-value">
                            {cred.password}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div
                    style={{ padding: "0.75rem 1rem", background: "#fafafa" }}
                  >
                    <p className="demo-note">
                      Only <strong>admin</strong> accounts can override
                      schedules.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* IT Support Gag */}
            {showITPopup && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
                onClick={() => setShowITPopup(false)}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: "2rem",
                    maxWidth: 320,
                    textAlign: "center",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🙃</p>
                  <h3
                    style={{
                      margin: "0 0 0.5rem",
                      color: "#0f1f3d",
                      fontFamily: "Playfair Display, serif",
                    }}
                  >
                    IT Support
                  </h3>
                  <p
                    style={{
                      margin: "0 0 1.25rem",
                      color: "#6b7280",
                      fontSize: "0.9rem",
                    }}
                  >
                    We do not have an IT department.
                  </p>
                  <button
                    onClick={() => setShowITPopup(false)}
                    style={{
                      background: "#0f1f3d",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "0.5rem 1.25rem",
                      cursor: "pointer",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

            <div className="login-footer">
              Need help?{" "}
              <button
                onClick={() => setShowITPopup(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  textDecoration: "underline",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.78rem",
                  padding: 0,
                }}
              >
                Contact IT Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
