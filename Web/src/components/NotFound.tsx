import { useNavigate } from "react-router-dom";
import { Home, MapPinOff } from "lucide-react";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        .nf-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
          font-family: 'Inter', sans-serif;
          padding: 2rem;
        }

        .nf-icon {
          width: 72px;
          height: 72px;
          background: #f0faf5;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .nf-code {
          font-family: 'Playfair Display', serif;
          font-size: 4rem;
          font-weight: 700;
          color: #0a1f14;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .nf-message {
          font-size: 1.1rem;
          color: #6b7280;
          margin: 0 0 2rem 0;
          font-weight: 300;
        }

        .nf-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.5rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }

        .nf-btn:hover { background: #003d2a; }
        .nf-btn:active { transform: scale(0.98); }
      `}</style>

      <div className="nf-root">
        <div className="nf-icon">
          <MapPinOff size={32} color="#00563f" />
        </div>
        <h1 className="nf-code">404</h1>
        <p className="nf-message">The page you're looking for doesn't exist</p>
        <button className="nf-btn" onClick={() => navigate("/")}>
          <Home size={16} />
          Back to Dashboard
        </button>
      </div>
    </>
  );
}
