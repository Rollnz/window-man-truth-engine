import { useState } from 'react';

/**
 * HoneypotField - Invisible spam trap for lead capture forms.
 *
 * Renders a hidden input that legitimate users never see or fill.
 * Bots that auto-fill all fields will populate it, allowing
 * the form handler to silently reject the submission.
 *
 * Usage:
 *   const { honeypotProps, isBot } = useHoneypot();
 *   // In form JSX: <HoneypotField {...honeypotProps} />
 *   // In submit handler: if (isBot()) return;
 */

interface HoneypotFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  return (
    <div
      aria-hidden="true"
      tabIndex={-1}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        opacity: 0,
        height: 0,
        overflow: 'hidden',
      }}
    >
      <label htmlFor="website_url">Website</label>
      <input
        type="text"
        id="website_url"
        name="website_url"
        autoComplete="off"
        tabIndex={-1}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

/**
 * Hook to manage honeypot state.
 * Returns props to spread on HoneypotField and a check function.
 */
export function useHoneypot() {
  const [honeypotValue, setHoneypotValue] = useState('');

  return {
    honeypotProps: {
      value: honeypotValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setHoneypotValue(e.target.value),
    },
    /** Returns true if the honeypot was filled (likely a bot) */
    isBot: () => honeypotValue.length > 0,
  };
}
