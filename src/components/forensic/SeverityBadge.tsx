const config = {
  critical: {
    bg: 'bg-destructive/15',
    text: 'text-destructive',
    dot: 'bg-destructive',
    default: 'Critical',
  },
  warning: {
    bg: 'bg-secondary/15',
    text: 'text-secondary',
    dot: 'bg-secondary',
    default: 'Warning',
  },
  info: {
    bg: 'bg-primary/15',
    text: 'text-primary',
    dot: 'bg-primary',
    default: 'Info',
  },
} as const;

interface SeverityBadgeProps {
  level: 'critical' | 'warning' | 'info';
  label?: string;
}

export function SeverityBadge({ level, label }: SeverityBadgeProps) {
  const c = config[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}
      aria-label={`Severity: ${label ?? c.default}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {label ?? c.default}
    </span>
  );
}
