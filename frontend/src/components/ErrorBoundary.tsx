import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to external error tracking service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo });
    
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.href = '/#/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-4">
          <Card className="max-w-2xl w-full p-8 shadow-xl">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              
              <p className="text-gray-600 mb-6 text-lg">
                We're sorry, but something unexpected happened. 
                Don't worry, your data is safe.
              </p>

              {isDevelopment && this.state.error && (
                <div className="mb-6 text-left">
                  <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                      Error Details (Development Mode)
                    </summary>
                    <div className="mt-4 space-y-2">
                      <div>
                        <p className="text-sm font-semibold text-red-600">Error:</p>
                        <pre className="text-xs bg-red-50 p-3 rounded overflow-auto mt-1 border border-red-200">
                          {this.state.error.message}
                        </pre>
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Stack Trace:</p>
                          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto mt-1 border border-gray-300">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                <Button 
                  onClick={this.handleReset}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Home className="w-4 h-4" />
                  Go to Home
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                If this problem persists, please contact support.
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
