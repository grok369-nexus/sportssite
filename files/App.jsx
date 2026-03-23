// src/App.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full app entry point.
// Providers (outermost → innermost): ToastProvider → AuthProvider → Router
// Routes:
//   /            Home
//   /sports      News feed (useEffect fetch)
//   /scores      Live scores + standings (auto-refreshes every 30s)
//   /chat        Live Socket.io chat  [PROTECTED — requires JWT]
//   /profile     User profile         [PROTECTED — requires JWT]
//   /login       Login form
//   /signup      Signup form
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ToastProvider }          from './context/ToastContext';
import { AuthProvider, useAuth }  from './context/AuthContext';

import ErrorBoundary from './components/ErrorBoundary';
import Navbar        from './components/Navbar';

import Home    from './pages/Home';
import Sports  from './pages/Sports';
import Scores  from './pages/Scores';
import Chat    from './pages/Chat';
import Profile from './pages/Profile';
import { Login, Signup } from './pages/Auth';

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ─── 404 Page ─────────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p
          className="font-display font-900 text-white"
          style={{ fontSize: 'clamp(6rem, 20vw, 14rem)', lineHeight: 1, textShadow: '0 0 60px rgba(0,255,148,0.2)' }}
        >
          404
        </p>
        <p className="font-display font-700 text-neon-green text-2xl uppercase tracking-widest mb-4">
          Page Not Found
        </p>
        <p className="font-body text-gray-500 text-sm mb-8">
          This route doesn't exist. Head back to safety.
        </p>
        <a href="/" className="btn-neon btn-neon-solid text-sm py-2.5 px-8">
          ← Back to Home
        </a>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell() {
  return (
    <div className="min-h-screen bg-pitch-950 text-white">
      <Navbar />
      <ErrorBoundary>
        <Routes>
          {/* ── Public ── */}
          <Route path="/"        element={<Home   />} />
          <Route path="/sports"  element={<Sports />} />
          <Route path="/scores"  element={<Scores />} />
          <Route path="/login"   element={<Login  />} />
          <Route path="/signup"  element={<Signup />} />

          {/* ── Protected ── */}
          <Route path="/chat"    element={<ProtectedRoute><Chat    /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* ── 404 ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
