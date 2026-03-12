import { DS } from '@/styles/design-system';

interface UrgencyBadgeProps {
  text?: string;
}

export default function UrgencyBadge({ text = "🔥 3 quotes analyzed in your area today" }: UrgencyBadgeProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '20px',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        fontFamily: DS.fontData,
        fontSize: '11px',
        color: DS.urgent,
        letterSpacing: '0.02em',
        animation: DS.pulseAnim,
      }}
    >
      {text}
    </div>
  );
}
