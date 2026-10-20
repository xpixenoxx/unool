'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/* ============================================================
   CLUB TOAST STACK — Notification system
   ============================================================ */

export interface ClubToast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

const TOAST_ICONS = {
  success: <CheckCircle size={20} strokeWidth={2} />,
  error: <AlertCircle size={20} strokeWidth={2} />,
  info: <Info size={20} strokeWidth={2} />,
  warning: <AlertTriangle size={20} strokeWidth={2} />,
};

const TOAST_STYLES = {
  success: 'border-l-[oklch(0.55_0.28_100)] bg-[oklch(0.55_0.28_100/0.1)]',
  error: 'border-l-[oklch(0.58_0.22_25)] bg-[oklch(0.58_0.22_25/0.1)]',
  info: 'border-l-[oklch(0.65_0.22_200)] bg-[oklch(0.65_0.22_200/0.1)]',
  warning: 'border-l-[oklch(0.58_0.18_45)] bg-[oklch(0.58_0.18_45/0.1)]',
};

interface ToastContextType {
  toasts: ClubToast[];
  addToast: (toast: Omit<ClubToast, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ClubToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ClubToast[]>([]);

  const addToast = useCallback((toast: Omit<ClubToast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast: ClubToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ClubToastStackInternal toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useClubToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useClubToast must be used within ClubToastProvider');
  }
  return context;
}

function ClubToastStackInternal({ toasts, onRemove }: { toasts: ClubToast[]; onRemove: (id: string) => void }) {
  return (
    <>
      <style jsx>{`
        .club-toast-stack {
          position: fixed;
          bottom: var(--space-6);
          right: var(--space-6);
          z-index: 1600;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          pointer-events: none;
        }
        @media (max-width: 640px) {
          .club-toast-stack { left: var(--space-4); right: var(--space-4); bottom: var(--space-4); }
        }
        .club-toast {
          pointer-events: auto;
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          min-width: 280px;
          max-width: 420px;
          padding: var(--space-4);
          border-radius: var(--radius-xl);
          border-left: 4px solid;
          background: linear-gradient(145deg, oklch(0.09 0.02 240) 0%, oklch(0.06 0.01 240) 100%);
          border: 1px solid oklch(0.25 0.02 240 / 0.3);
          backdrop-filter: blur(16px);
          box-shadow: 0 16px 32px -8px oklch(0 0 0 / 0.4);
        }
        .club-toast-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .club-toast-content { flex: 1; min-width: 0; }
        .club-toast-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: var(--club-text-body);
          color: oklch(0.98 0 0);
          margin: 0 0 var(--space-1);
        }
        .club-toast-description {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: var(--club-text-mono);
          color: oklch(0.75 0.02 240);
          margin: 0;
          line-height: 1.5;
        }
        .club-toast-action {
          margin-top: var(--space-3);
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-md);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: var(--club-text-mono);
          cursor: pointer;
          transition: all 200ms ease;
          border: none;
          background: transparent;
        }
        .club-toast-success .club-toast-action { color: oklch(0.55 0.28 100); }
        .club-toast-success .club-toast-action:hover { background: oklch(0.55 0.28 100 / 0.1); }
        .club-toast-error .club-toast-action { color: oklch(0.58 0.22 25); }
        .club-toast-error .club-toast-action:hover { background: oklch(0.58 0.22 25 / 0.1); }
        .club-toast-close {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          background: transparent;
          border: none;
          color: oklch(0.55 0.02 240);
          cursor: pointer;
          transition: all 200ms ease;
        }
        .club-toast-close:hover { background: oklch(0.09 0.02 240); color: oklch(0.98 0 0); }
        .club-toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          border-radius: 0 0 var(--radius-xl) var(--radius-xl);
          transform-origin: left;
        }
      `}</style>

      <AnimatePresence>
        <div className="club-toast-stack">
          {toasts.map(toast => (
            <ClubToastItem
              key={toast.id}
              toast={toast}
              onRemove={onRemove}
            />
          ))}
        </div>
      </AnimatePresence>
    </>
  );
}

function ClubToastItem({ toast, onRemove }: { toast: ClubToast; onRemove: (id: string) => void }) {
  const [progress, setProgress] = React.useState(1);
  const duration = toast.duration ?? 4000;

  React.useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 1 - elapsed / duration));
      if (elapsed >= duration) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [duration, toast.id, onRemove]);

  const variants: any = {
    initial: { opacity: 0, x: 100, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } },
    exit: { opacity: 0, x: 100, scale: 0.95, transition: { duration: 0.15 } },
  };

  return (
    <motion.div
      className={`club-toast club-toast-${toast.type}`}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <span className="club-toast-icon" style={{ color: getIconColor(toast.type) }} aria-hidden="true">
        {TOAST_ICONS[toast.type]}
      </span>
      <div className="club-toast-content">
        <h4 className="club-toast-title">{toast.title}</h4>
        {toast.description && <p className="club-toast-description">{toast.description}</p>}
        {toast.action && (
          <button
            className="club-toast-action"
            onClick={() => { toast.action?.onClick(); onRemove(toast.id); }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        className="club-toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
      >
        <X size={16} strokeWidth={2} />
      </button>
      <motion.div
        className="club-toast-progress"
        style={{ background: getIconColor(toast.type), width: `${progress * 100}%` }}
        animate={{ scaleX: progress }}
        transition={{ duration: 50, ease: 'linear' }}
      />
    </motion.div>
  );
}

function getIconColor(type: ClubToast['type']): string {
  switch (type) {
    case 'success': return 'oklch(0.55 0.28 100)';
    case 'error': return 'oklch(0.58 0.22 25)';
    case 'info': return 'oklch(0.65 0.22 200)';
    case 'warning': return 'oklch(0.58 0.18 45)';
  }
}