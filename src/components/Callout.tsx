import { Info, Lightbulb, Megaphone, AlertTriangle, Flame } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export type CalloutType = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION';

const CALLOUT_CONFIG: Record<CalloutType, { icon: typeof Info; label: string }> = {
  NOTE: { icon: Info, label: 'Note' },
  TIP: { icon: Lightbulb, label: 'Tip' },
  IMPORTANT: { icon: Megaphone, label: 'Important' },
  WARNING: { icon: AlertTriangle, label: 'Warning' },
  CAUTION: { icon: Flame, label: 'Caution' },
};

interface CalloutProps {
  type: string;
  children?: ReactNode;
  className?: string;
}

export const Callout: React.FC<CalloutProps> = ({ type, children, className }) => {
  const config = CALLOUT_CONFIG[type as CalloutType] ?? CALLOUT_CONFIG.NOTE;
  const Icon = config.icon;
  return (
    <aside
      data-callout-type={type}
      role="note"
      aria-label={config.label}
      className={cn('callout', className)}
    >
      <Icon size={16} className="callout-icon mt-0.5 shrink-0" aria-hidden />
      <div className="callout-body flex-1 min-w-0 [&>p]:my-1.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {children}
      </div>
    </aside>
  );
};
