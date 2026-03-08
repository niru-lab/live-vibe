import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Warning, ArrowClockwise } from '@phosphor-icons/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <Warning weight="thin" className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Etwas ist schiefgelaufen</h2>
          <p className="mb-6 max-w-xs text-sm text-muted-foreground">
            Ein unerwarteter Fehler ist aufgetreten. Versuche es erneut.
          </p>
          <Button onClick={this.handleRetry} variant="outline" className="gap-2">
            <ArrowClockwise weight="thin" className="h-4 w-4" />
            Erneut versuchen
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
