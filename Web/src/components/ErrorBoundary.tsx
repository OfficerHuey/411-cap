import React from "react";
import { RefreshCw, Home } from "lucide-react";
import { NumberBadge } from "./ui/NumberBadge";
import { HairlineRule } from "./ui/HairlineRule";
import { Button } from "./ui/Button";
import styles from "./ErrorBoundary.module.css";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          error={this.state.error}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorPage({
  error,
  onReload,
  onGoHome,
}: {
  error: Error | null;
  onReload: () => void;
  onGoHome: () => void;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <NumberBadge number="500" variant="gold" size="lg" />
        <HairlineRule width="48px" color="gold" spacing="tight" />

        <h1 className={styles.heading}>
          Something <em>went sideways</em>.
        </h1>

        <p className={styles.description}>
          An unexpected error occurred. You can reload the page or return
          to the dashboard.
        </p>

        <div className={styles.actions}>
          <Button iconLeft={<RefreshCw size={16} />} onClick={onReload}>
            Reload page
          </Button>
          <Button variant="secondary" iconLeft={<Home size={16} />} onClick={onGoHome}>
            Go to Dashboard
          </Button>
        </div>

        {error && (
          <details className={styles.details}>
            <summary>Technical details</summary>
            <pre className={styles.errorBlock}>
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
