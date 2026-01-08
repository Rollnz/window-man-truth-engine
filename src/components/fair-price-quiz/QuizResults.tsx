import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Phone, AlertTriangle, TrendingDown, Info, Bot, CheckCircle } from 'lucide-react';
import { PriceAnalysis, formatCurrency, getRedFlagDescriptions } from '@/lib/fairPriceCalculations';
import { gradeConfig } from '@/data/fairPriceQuizData';
import { QuizAnswers } from '@/lib/fairPriceCalculations';

interface QuizResultsProps {
  analysis: PriceAnalysis;
  answers: QuizAnswers;
  userName: string;
  onPhoneSubmit: (phone: string) => void;
}

export function QuizResults({
  analysis,
  answers,
  userName,
  onPhoneSubmit,
}: QuizResultsProps) {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);

  const gradeInfo = gradeConfig[analysis.grade];
  const redFlagDescriptions = getRedFlagDescriptions(analysis.redFlags);

  // Phone formatting
  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneInput(e.target.value));
    setPhoneError('');
  };

  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);
    await onPhoneSubmit(digits);
    setPhoneSubmitted(true);
    setIsSubmitting(false);
  };

  // Map sqft value to display
  const sqftDisplay: Record<string, string> = {
    under_1500: 'under 1,500',
    '1500_2000': '1,500 - 2,000',
    '2000_2500': '2,000 - 2,500',
    '2500_3000': '2,500 - 3,000',
    over_3000: '3,000+',
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {userName ? `${userName}'s ` : ''}Fair Price Analysis
          </h1>
        </div>

        {/* Grade Display */}
        <Card className="p-6 mb-6 text-center bg-card/50 border-2 border-primary/20">
          <div className={`text-4xl md:text-5xl font-bold mb-2 ${gradeInfo.color}`}>
            {gradeInfo.label.toUpperCase()}
          </div>
          <p className="text-lg text-muted-foreground">{gradeInfo.verdict}</p>
        </Card>

        {/* Price Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-6 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Your Quote</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(analysis.quoteAmount)}
            </p>
          </Card>
          <Card className="p-6 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Fair Market Value</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(analysis.fairMarketValue.low)} - {formatCurrency(analysis.fairMarketValue.high)}
            </p>
          </Card>
        </div>

        {/* Potential Overpay */}
        {analysis.potentialOverpay && analysis.potentialOverpay > 0 && (
          <Card className="p-4 mb-6 bg-destructive/10 border-destructive/30">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Potential Overpay</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(analysis.potentialOverpay)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Red Flags */}
        {analysis.redFlagCount > 0 && (
          <Card className="p-6 mb-6 bg-card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="text-lg font-semibold text-foreground">
                Potential Red Flags Detected ({analysis.redFlagCount})
              </h3>
            </div>
            <ul className="space-y-2">
              {redFlagDescriptions.map((desc, index) => (
                <li key={index} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-warning mt-1">•</span>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Context Note */}
        <Card className="p-4 mb-8 bg-muted/50">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">📊 Important Context</p>
              <p>
                This analysis is based on {sqftDisplay[answers.sqft] || answers.sqft} sq ft homes with {answers.windowCount} windows in Florida. 
                However, many factors affect final pricing including window sizes, glass performance ratings, and installation complexity.
              </p>
            </div>
          </div>
        </Card>

        {/* Phone CTA - WindowMan AI */}
        {!phoneSubmitted ? (
          <Card className="p-6 mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-8 h-8 text-primary" />
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Get a Precise Quote Analysis from WindowMan
                </h3>
                <p className="text-sm text-muted-foreground">
                  Voice AI trained on 1,000+ Florida installations
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-primary">🎯</span>
                <span className="text-muted-foreground">Instant Expert Consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">💬</span>
                <span className="text-muted-foreground">Zero Sales Pressure</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">⚡</span>
                <span className="text-muted-foreground">5-Minute Call</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone">Enter your phone number</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className={`w-full pr-10 ${phoneError ? 'border-destructive' : phone.replace(/\D/g, '').length === 10 ? 'border-success' : ''}`}
                />
                {phone.replace(/\D/g, '').length === 10 && !phoneError && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
              </div>
              <Button
                onClick={handlePhoneSubmit}
                disabled={isSubmitting}
                className="w-full glow"
              >
                <Phone className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Scheduling...' : 'Call Me in 5 Minutes'}
              </Button>
              {phoneError && (
                <p className="text-sm text-destructive">{phoneError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                ✓ No spam. One call to analyze your quote.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="p-6 mb-6 bg-success/10 border-success/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Call Scheduled!</h3>
                <p className="text-sm text-muted-foreground">
                  WindowMan will call you within 5 minutes to discuss your quote.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Footer disclaimer */}
        <p className="text-xs text-center text-muted-foreground mt-8">
          This is an educational estimate based on industry averages. 
          Speaking with a professional will provide a more accurate assessment.
        </p>
      </div>
    </div>
  );
}
