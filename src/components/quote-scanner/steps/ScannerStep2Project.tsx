import { useState, useRef } from 'react';
import { Upload, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { cn } from '@/lib/utils';

interface ScannerStep2ProjectProps {
  onSubmit: (data: {
    phone: string;
    windowCount: string;
    quotePrice: string;
    wantsBeatQuote: boolean;
    file: File;
  }) => void;
  isLoading?: boolean;
}

/**
 * Step 2: Project Details + Upload
 * Collects phone (with context), window count, quote price (optional),
 * "beat my quote" checkbox, and triggers file upload.
 */
export function ScannerStep2Project({
  onSubmit,
  isLoading = false,
}: ScannerStep2ProjectProps) {
  const [windowCount, setWindowCount] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [wantsBeatQuote, setWantsBeatQuote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { values, setValue, hasError, getError, validateAll } = useFormValidation({
    initialValues: { phone: '' },
    schemas: { 
      // Phone is now required - commonSchemas.phone already validates format
      phone: commonSchemas.phone,
    },
    formatters: { phone: formatPhoneNumber },
  });

  // Additional check: phone must have at least 10 digits to be valid
  const phoneDigits = values.phone.replace(/\D/g, '');
  const isPhoneValid = phoneDigits.length >= 10;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateAll()) {
      onSubmit({
        phone: values.phone,
        windowCount,
        quotePrice: quotePrice.replace(/[^0-9.]/g, ''),
        wantsBeatQuote,
        file,
      });
    }
  };

  const handleUploadClick = () => {
    if (!validateAll()) return;
    fileInputRef.current?.click();
  };

  const formatPrice = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    if (!digits) return '';
    return '$' + parseInt(digits, 10).toLocaleString();
  };

  const phoneError = hasError('phone') ? getError('phone') : undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">
          Tell Us About Your Quote
        </h3>
      </div>

      {/* Phone Field with Context */}
      <div className="space-y-2">
        <Label 
          htmlFor="scanner-phone" 
          className={cn(
            "font-semibold text-slate-900",
            phoneError && "text-destructive"
          )}
        >
          <Phone className="w-4 h-4 inline mr-1.5 text-muted-foreground" />
          Where should we text your analysis results? *
        </Label>
        <Input
          id="scanner-phone"
          type="tel"
          autoComplete="tel"
          placeholder="(555) 123-4567"
          value={values.phone}
          onChange={(e) => setValue('phone', e.target.value)}
          disabled={isLoading}
          className={phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}
          aria-invalid={!!phoneError}
          aria-describedby={phoneError ? 'scanner-phone-error' : undefined}
        />
        {phoneError && (
          <p id="scanner-phone-error" className="text-xs text-destructive">
            {phoneError}
          </p>
        )}
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scanner-windows" className="font-semibold text-slate-900">
            How many windows?
          </Label>
          <Input
            id="scanner-windows"
            type="text"
            inputMode="numeric"
            placeholder="8"
            value={windowCount}
            onChange={(e) => setWindowCount(e.target.value.replace(/\D/g, ''))}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scanner-price" className="font-semibold text-slate-900">
            Quote total?
          </Label>
          <Input
            id="scanner-price"
            type="text"
            placeholder="$8,661"
            value={quotePrice}
            onChange={(e) => setQuotePrice(formatPrice(e.target.value))}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Beat My Quote Checkbox */}
      <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <Checkbox
          id="scanner-beat-quote"
          checked={wantsBeatQuote}
          onCheckedChange={(checked) => setWantsBeatQuote(checked === true)}
          disabled={isLoading}
          className="mt-0.5"
        />
        <label
          htmlFor="scanner-beat-quote"
          className="text-sm font-medium text-slate-700 leading-snug cursor-pointer"
        >
          Yes, find me a contractor who can beat this price
        </label>
      </div>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">
            Upload for FREE AI Analysis
          </span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Button - requires valid phone */}
      <Button
        type="button"
        variant="cta"
        className="w-full min-h-[52px] text-base"
        onClick={handleUploadClick}
        disabled={isLoading || !isPhoneValid}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-5 w-5" />
            Upload Your Quote
          </>
        )}
      </Button>
    </div>
  );
}
