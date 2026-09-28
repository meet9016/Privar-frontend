import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // If Google Translate dynamically modified text nodes causing React DOM removeChild errors, auto recover
    if (
      error &&
      (error.message?.includes('removeChild') ||
        error.message?.includes('insertBefore') ||
        error.message?.includes('Node'))
    ) {
      console.warn('DOM mutation error caught by boundary, resetting state cleanly...');
    } else {
      console.error('Uncaught component error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // If it's a DOM manipulation error from Google Translate, recover seamlessly
      const msg = this.state.error?.message || '';
      if (msg.includes('removeChild') || msg.includes('insertBefore') || msg.includes('Node')) {
        return this.props.children;
      }

      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg mb-3">
              !
            </div>
            <h3 className="text-base font-bold text-text mb-1">Something went wrong rendering this view</h3>
            <p className="text-xs text-text-secondary mb-4">Click below to reload the section smoothly.</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm hover:bg-primary/90 transition-all"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
