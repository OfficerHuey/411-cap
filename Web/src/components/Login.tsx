import { useState } from "react";
import "../App.css";
import { AlertCircle, Mail, Info, Lock, Eye, EyeOff, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../Lib/Auth";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

        /* Floating popup */
        .demo-popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(2px);
        }

        .demo-popup {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .demo-popup-header {
          background: #00563f;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .demo-popup-header h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .demo-popup-header p {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          margin: 0.2rem 0 0;
          font-weight: 300;
        }

        .demo-popup-close {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          color: #ffffff;
          cursor: pointer;
          padding: 0.3rem;
          display: flex;
          align-items: center;
          transition: background 0.15s;
          flex-shrink: 0;
        }

        .demo-popup-close:hover { background: rgba(255,255,255,0.2); }

        .demo-popup-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .demo-item {
          background: #fafaf8;
          border: 1px solid #e5e2db;
          border-radius: 8px;
          border-left: 3px solid #00563f;
          padding: 0.875rem 1rem;
        }

        .demo-item-name {
          font-family: 'Playfair Display', serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0 0 0.5rem 0;
        }

        .demo-creds {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .demo-cred-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9ca3af;
          display: block;
          margin-bottom: 0.15rem;
        }

        .demo-cred-value {
          font-family: 'DM Mono', 'Courier New', monospace;
          color: #374151;
          font-size: 0.82rem;
        }
      `}</style>

      <div className="login-root">
        <div className="login-panel-left">
          <div />
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

        <div className="login-panel-right">
          <div className="login-card">
            <div className="login-card-header">
              <h1>Sign In</h1>
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
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-submit">
                Sign In
              </button>
            </form>

            <div className="demo-section">
              <button
                onClick={() => setShowCredentials(true)}
                className="demo-toggle"
              >
                <Info size={14} />
                View demo credentials
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCredentials && (
        <div
          className="demo-popup-overlay"
          onClick={() => setShowCredentials(false)}
        >
          <div className="demo-popup" onClick={(e) => e.stopPropagation()}>
            <div className="demo-popup-header">
              <div>
                <h3>Demo Credentials</h3>
                <p>Click any account to use it</p>
              </div>
              <button
                className="demo-popup-close"
                onClick={() => setShowCredentials(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="demo-popup-body">
              {mockCredentials.map((cred, idx) => (
                <div
                  key={idx}
                  className="demo-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setEmail(cred.email);
                    setPassword(cred.password);
                    setShowCredentials(false);
                  }}
                >
                  <p className="demo-item-name">{cred.name}</p>
                  <div className="demo-creds">
                    <div>
                      <span className="demo-cred-label">Email</span>
                      <span className="demo-cred-value">{cred.email}</span>
                    </div>
                    <div>
                      <span className="demo-cred-label">Password</span>
                      <span className="demo-cred-value">{cred.password}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
