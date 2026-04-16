import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
          <div className="mb-6 rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">Something went wrong</h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            We've encountered an unexpected error. Don't worry, your data is safe. Please try refreshing or returning home.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button 
              onClick={this.handleReload} 
              variant="default"
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              onClick={this.handleReset} 
              variant="outline"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-12 max-w-2xl overflow-auto rounded-lg border bg-muted p-4 text-left font-mono text-xs text-muted-foreground">
              <p className="mb-2 font-bold text-destructive">Debug Information:</p>
              <pre>{this.state.error?.stack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
