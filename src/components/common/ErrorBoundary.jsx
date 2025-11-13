// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (you can also send to error tracking service)
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Using window.location for ErrorBoundary is acceptable as it's a critical error handler
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#181818] shadow-[0_20px_40px_rgba(0,0,0,0.35)] p-8">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#1db954]/20 blur-xl" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#121212] border border-white/10">
                  <svg className="h-12 w-12 text-[#1db954]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10A8 8 0 112 10a8 8 0 0116 0zM9 6a1 1 0 012 0v4a1 1 0 01-2 0V6zm1 8a1 1 0 100 2 1 1 0 000-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Something went wrong</h1>
                <p className="mt-2 text-sm text-gray-400">
                  We hit a snag while playing your vibe. Let’s hop back and try again.
                </p>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-left text-sm text-gray-300">
                  <summary className="cursor-pointer select-none text-[#1db954] font-semibold">
                    Error details (dev)
                  </summary>
                  <div className="mt-3 space-y-3 font-mono text-xs">
                    <p className="font-semibold text-red-400">{this.state.error.toString()}</p>
                    <pre className="whitespace-pre-wrap leading-relaxed text-gray-400">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <button
                onClick={this.handleReset}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1db954] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#1ed760] focus:outline-none focus:ring-2 focus:ring-[#1db954]/60 focus:ring-offset-2 focus:ring-offset-[#181818]"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

