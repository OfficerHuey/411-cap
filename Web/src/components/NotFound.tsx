import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { HairlineRule } from "./ui/HairlineRule";
import { Button } from "./ui/Button";
import styles from "./NotFound.module.css";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <span className={styles.bgText}>404</span>

      <div className={styles.content}>
        <HairlineRule width="48px" color="gold" spacing="tight" />

        <h1 className={styles.heading}>
          This page <em>isn&apos;t on the schedule</em>.
        </h1>

        <p className={styles.description}>
          We couldn&apos;t find what you were looking for. It may have been
          moved, renamed, or taken off the roster.
        </p>

        <div className={styles.actions}>
          <Button iconLeft={<Home size={16} />} onClick={() => navigate("/")}>
            Return to Dashboard
          </Button>
          <Button variant="ghost" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
