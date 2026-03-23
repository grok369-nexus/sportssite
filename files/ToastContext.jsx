// src/context/ToastContext.jsx
// Lightweight toast notifications — no external library needed.
// Usage: const { toast } = useToast();
//        toast.success('Saved!') / toast.error('Failed') / toast.info('...')

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'i',
  warn:    '⚠',
};

const COLORS = {
  success: {
    border: 'border-neon-green/40',
    bg:     'bg-neon-green/10',
    text:   'text-neon-green',
    bar:    'bg-neon-green',
  },
  error: {
    border: 'border-red-500/40',
    bg:     'bg-red-500/10',
    text:   'text-red-400',
    bar:    'bg-red-500',
  },
  info: {
    border: 'border-neon-cyan/40',
    bg:     'bg-neon-cyan/10',
    text:   'text-neon-cyan',
    bar:    'bg-neon-cyan',
  },
  warn: {
    border: 'border-yellow-400/40',
    bg:     'bg-yellow-400/10',
    text:   'text-yellow-400',
    bar:    'bg-yellow-400',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerRefs = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timerRefs.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]); // max 5 visible
    timerRefs.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = {
    success: (msg, dur) => show(msg, 'success', dur),
    error:   (msg, dur) => show(msg, 'error',   dur),
    info:    (msg, dur) => show(msg, 'info',     dur),
    warn:    (msg, dur) => show(msg, 'warn',     dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 min-w-[260px] max-w-sm
                px-4 py-3 rounded-lg border backdrop-blur-md
                ${c.border} ${c.bg} animate-slide-up`}
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              {/* Icon */}
              <span className={`font-display font-900 text-base mt-0.5 ${c.text}`}>
                {ICONS[t.type]}
              </span>

              {/* Message */}
              <p className="font-body text-sm text-gray-200 flex-1 leading-snug">{t.message}</p>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(t.id)}
                className="text-gray-600 hover:text-gray-300 text-lg leading-none ml-1 transition-colors"
              >
                ×
              </button>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg overflow-hidden">
                <div
                  className={`h-full ${c.bar} opacity-60`}
                  style={{ animation: 'progress-shrink 3.5s linear forwards' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar keyframe — injected as a style tag */}
      <style>{`
        @keyframes progress-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
