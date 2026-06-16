import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastContext, type ToastContextValue, type ToastVariant, type ToastAction } from './toastContextDef';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
}

const ICONS: Record<ToastVariant, React.ComponentType<{ size?: number; className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  info: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal text-slate-800 dark:text-slate-200',
  success: 'border-emerald-200 dark:border-emerald-800/50 bg-white dark:bg-charcoal text-emerald-700 dark:text-emerald-300',
  error: 'border-rose-200 dark:border-rose-800/50 bg-white dark:bg-charcoal text-rose-700 dark:text-rose-300',
  warning: 'border-amber-200 dark:border-amber-800/50 bg-white dark:bg-charcoal text-amber-700 dark:text-amber-300',
};

const ICON_CLASSES: Record<ToastVariant, string> = {
  info: 'text-slate-400',
  success: 'text-emerald-500',
  error: 'text-rose-500',
  warning: 'text-amber-500',
};

const AUTO_DISMISS_MS = 3500;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback<ToastContextValue['show']>((message, variant = 'info', action) => {
    counterRef.current += 1;
    const id = counterRef.current;
    setToasts(prev => [...prev, { id, message, variant, action }]);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map(t =>
      setTimeout(() => dismiss(t.id), AUTO_DISMISS_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map(t => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-72 max-w-md ${VARIANT_CLASSES[t.variant]}`}
              role={t.variant === 'error' ? 'alert' : 'status'}
            >
              <Icon size={16} className={`mt-0.5 shrink-0 ${ICON_CLASSES[t.variant]}`} />
              <span className="text-sm leading-relaxed flex-1">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                  className="shrink-0 px-2 py-0.5 text-xs font-medium rounded border border-current/30 hover:bg-current/10 transition-colors"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
