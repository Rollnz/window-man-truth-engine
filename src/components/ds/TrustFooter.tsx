import { DS } from '@/styles/design-system';

export default function TrustFooter() {
  return (
    <div
      style={{
        padding: '20px 24px',
        textAlign: 'center',
        fontFamily: DS.fontData,
        fontSize: '11px',
        color: DS.textPrimary,
        letterSpacing: '0.04em',
        borderTop: `1px solid ${DS.borderSubtle}`,
        background: DS.bgInset,
      }}
    >
      🔒 Bank-level Security · No obligation · 100% Free Analysis
    </div>
  );
}
