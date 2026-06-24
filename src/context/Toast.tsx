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
  info: 'border-border bg-popover text-popover-foreground',
  success: 'border-success/30 bg-popover text-popover-foreground',
  error: 'border-destructive/30 bg-popover text-popover-foreground',
  warning: 'border-warning/30 bg-popover text-popover-foreground',
};

const ICON_CLASSES: Record<ToastVariant, string> = {
  info: 'text-muted-foreground',
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
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
    const item: ToastItem = { id, message, variant };
    if (action) item.action = action;
    setToasts(prev => [...prev, item]);
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
              className={`pointer-events-auto flex items-center gap-3 px-3.5 py-2.5 rounded-lg border shadow-lg shadow-foreground/10 min-w-72 max-w-md animate-in slide-in-from-bottom-2 duration-200 ${VARIANT_CLASSES[t.variant]}`}
              role={t.variant === 'error' ? 'alert' : 'status'}
            >
              <Icon size={14} className={`mt-0.5 shrink-0 ${ICON_CLASSES[t.variant]}`} />
              <span className="text-body leading-relaxed flex-1">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action.onClick();
                    dismiss(t.id);
                  }}
                  className="shrink-0 h-6 px-2 text-caption-1 font-medium rounded-md border border-border hover:bg-accent transition-colors duration-200 ease-out"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-out"
                aria-label="Dismiss notification"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
