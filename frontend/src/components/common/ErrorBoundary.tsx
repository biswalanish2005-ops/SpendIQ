import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '../ui/ErrorState';

interface Props {
  children: ReactNode;
  /**
   * Optional key — when this value changes, the boundary automatically resets.
   * Useful for resetting per-page boundaries on navigation.
   */
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidUpdate(prevProps: Props) {
    // Auto-reset the boundary when resetKey changes (e.g., on route navigation)
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Structured log — does not expose raw stack trace to users
    console.error('[SpendIQ] Uncaught rendering error:', {
      message: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <ErrorState
            title="Interface Rendering Error"
            message={this.state.error?.message || 'A visual component encountered an issue.'}
            onRetry={() => this.setState({ hasError: false, error: undefined })}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
