import { useState, useCallback, useRef } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, ScanSearch } from 'lucide-react';
import { formatPhoneDisplay, stripPhone, autoCapitalize } from '@/lib/phone-mask';
import { NOIR } from '@/lib/motion-tokens';

const signup2Schema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(50),
  last_name: z.string().trim().max(50).optional().default(''),
  email: z
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(
      z.string().email('Enter a valid email').optional(),
    ),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((v) => v.replace(/\D/g, '').length === 10, 'Enter a valid 10-digit phone number'),
});

type FormData = { first_name: string; last_name: string; email: string; phone: string };
type FormErrors = Partial<Record<keyof FormData, string>>;

interface Signup2FormProps {
  onSubmit: (data: FormData, file: File) => void;
  isSubmitting: boolean;
}

export function Signup2Form({ onSubmit, isSubmitting }: Signup2FormProps) {
  const [form, setForm] = useState<FormData>({ first_name: '', last_name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = useCallback((field: keyof FormData, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) {
        setFileError('File must be under 10MB');
        return;
      }
      setFile(f);
      setFileError(null);
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const cleaned = { ...form, phone: stripPhone(form.phone) };
      // TESTING MODE: All validation removed
      if (!file) {
        setFileError('Upload your quote to continue');
        return;
      }
      onSubmit(cleaned, file);
    },
    [form, file, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="s2-first" className="text-xs text-white/70">First Name *</Label>
          <Input
            id="s2-first"
            value={form.first_name}
            onChange={(e) => update('first_name', autoCapitalize(e.target.value))}
            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            placeholder="Jane"
            autoComplete="given-name"
            disabled={isSubmitting}
          />
          {errors.first_name && <p className="text-[11px] text-red-400">{errors.first_name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s2-last" className="text-xs text-white/70">Last Name</Label>
          <Input
            id="s2-last"
            value={form.last_name}
            onChange={(e) => update('last_name', autoCapitalize(e.target.value))}
            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            placeholder="Smith"
            autoComplete="family-name"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="s2-email" className="text-xs text-white/70">
          Email <span className="text-white/40">(optional — for receiving report)</span>
        </Label>
        <Input
          id="s2-email"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          placeholder="jane@example.com"
          autoComplete="email"
          disabled={isSubmitting}
        />
        {errors.email && <p className="text-[11px] text-red-400">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="s2-phone" className="text-xs text-white/70">Phone *</Label>
        <Input
          id="s2-phone"
          value={form.phone}
          onChange={(e) => update('phone', formatPhoneDisplay(e.target.value))}
          className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          placeholder="(555) 123-4567"
          inputMode="tel"
          autoComplete="tel"
          disabled={isSubmitting}
        />
        {errors.phone && <p className="text-[11px] text-red-400">{errors.phone}</p>}
      </div>

      {/* File Upload */}
      <div className="space-y-1.5">
        <Label className="text-xs text-white/70">Quote Document *</Label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed transition-colors"
          style={{
            borderColor: file ? '#10b981' : NOIR.glassBorder,
            background: file ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
          }}
          disabled={isSubmitting}
        >
          {file ? (
            <ScanSearch className="w-5 h-5 shrink-0" style={{ color: '#10b981' }} />
          ) : (
            <Upload className="w-5 h-5 shrink-0 text-white/40" />
          )}
          <span className="text-sm truncate" style={{ color: file ? '#10b981' : 'rgba(255,255,255,0.5)' }}>
            {file ? file.name : 'Upload PDF or photo of quote (max 10MB)'}
          </span>
        </button>
        {fileError && <p className="text-[11px] text-red-400">{fileError}</p>}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        style={{ background: NOIR.cyan, color: NOIR.void }}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Analyze My Quote'}
      </Button>

      <p className="text-[10px] font-mono text-center text-white/25">
        ENCRYPTED • NO SPAM • PHONE VERIFICATION REQUIRED
      </p>
    </form>
  );
}
