import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h2 className="font-bold text-lg mb-2">Something went wrong!</h2>
            <p className="mb-2">The Product Gallery component encountered an error.</p>
            
            {this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">Error Details</summary>
                <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                  <p><strong>Error:</strong> {this.state.error.message}</p>
                  <pre className="mt-2 text-xs overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}

            <div className="mt-4">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

