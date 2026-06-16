import { createContext } from 'react';

export type ToastVariant = 'info' | 'success' | 'error' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastContextValue {
  show: (message: string, variant?: ToastVariant, action?: ToastAction) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
