// src/components/ErrorBoundary.jsx
// Class component — required by React for error boundaries.
// Wraps any subtree; catches render/lifecycle errors and shows a fallback UI.

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to Sentry / LogRocket etc.
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-10 max-w-lg w-full text-center">
          {/* Glitch symbol */}
          <div className="mb-6">
            <p
              className="font-display font-900 text-8xl text-neon-red"
              style={{ textShadow: '2px 0 #FF375F, -2px 0 #00E5FF' }}
            >
              ERR
            </p>
          </div>

          <h2 className="font-display font-900 text-2xl text-white uppercase mb-3">
            Something went wrong
          </h2>

          <p className="font-body text-sm text-gray-500 mb-6">
            A runtime error occurred in this component tree. The error has been
            logged. Try refreshing, or go back to the home page.
          </p>

          {/* Error detail */}
          {this.state.error && (
            <div className="mb-6 text-left bg-pitch-800 rounded px-4 py-3 border border-red-500/20">
              <p className="font-mono text-xs text-red-400 break-words">
                {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-neon text-sm py-2"
            >
              Try Again
            </button>
            <a href="/" className="btn-neon btn-neon-solid text-sm py-2 px-5">
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
