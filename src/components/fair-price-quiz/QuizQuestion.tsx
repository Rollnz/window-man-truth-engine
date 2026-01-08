import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { QuizQuestionData } from '@/data/fairPriceQuizData';
import { QuizProgress } from './QuizProgress';

interface QuizQuestionProps {
  question: QuizQuestionData;
  currentStep: number;
  totalSteps: number;
  value: string | number | string[];
  onAnswer: (value: string | number | string[]) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function QuizQuestion({
  question,
  currentStep,
  totalSteps,
  value,
  onAnswer,
  onBack,
  canGoBack,
}: QuizQuestionProps) {
  const [localValue, setLocalValue] = useState<string | number | string[]>(value);

  const handleSelectOption = (optionValue: string | number) => {
    onAnswer(optionValue);
  };

  const handleMultiSelectToggle = (optionValue: string) => {
    const currentValues = Array.isArray(localValue) ? localValue : [];
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter((v) => v !== optionValue)
      : [...currentValues, optionValue];
    setLocalValue(newValues);
  };

  const handleMultiSelectSubmit = () => {
    if (Array.isArray(localValue) && localValue.length > 0) {
      onAnswer(localValue);
    }
  };

  const handleNumberSubmit = () => {
    if (typeof localValue === 'number' && localValue > 0) {
      onAnswer(localValue);
    }
  };

  const handleCurrencySubmit = () => {
    if (typeof localValue === 'number' && localValue > 0) {
      onAnswer(localValue);
    }
  };

  // Parse currency input
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    setLocalValue(num);
  };

  // Format currency for display
  const formatCurrencyInput = (num: number) => {
    if (num === 0) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 bg-background">
      {/* Back button */}
      {canGoBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      )}

      {/* Progress */}
      <QuizProgress currentStep={currentStep} totalSteps={totalSteps} />

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
          {question.text}
        </h2>

        {/* Select options */}
        {question.type === 'select' && question.options && (
          <div className="w-full space-y-3">
            {question.options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                className="w-full py-6 text-lg justify-start hover:bg-primary/10 hover:border-primary transition-all"
                onClick={() => handleSelectOption(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}

        {/* Multiselect options */}
        {question.type === 'multiselect' && question.options && (
          <div className="w-full space-y-3">
            {question.options.map((option) => {
              const isChecked = Array.isArray(localValue) && localValue.includes(option.value as string);
              return (
                <button
                  key={option.id}
                  onClick={() => handleMultiSelectToggle(option.value as string)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${
                    isChecked
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox checked={isChecked} />
                  <span className="text-foreground">{option.label}</span>
                </button>
              );
            })}
            <Button
              className="w-full mt-4"
              onClick={handleMultiSelectSubmit}
              disabled={!Array.isArray(localValue) || localValue.length === 0}
            >
              Continue →
            </Button>
          </div>
        )}

        {/* Number input */}
        {question.type === 'number' && (
          <div className="w-full space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="text-2xl w-16 h-16"
                onClick={() => setLocalValue(Math.max(1, (typeof localValue === 'number' ? localValue : 0) - 1))}
              >
                −
              </Button>
              <Input
                type="number"
                value={typeof localValue === 'number' ? localValue : ''}
                onChange={(e) => setLocalValue(parseInt(e.target.value, 10) || 0)}
                className="text-center text-3xl font-bold h-16"
                min={1}
                placeholder="0"
              />
              <Button
                variant="outline"
                size="lg"
                className="text-2xl w-16 h-16"
                onClick={() => setLocalValue((typeof localValue === 'number' ? localValue : 0) + 1)}
              >
                +
              </Button>
            </div>
            <Button
              className="w-full"
              onClick={handleNumberSubmit}
              disabled={typeof localValue !== 'number' || localValue < 1}
            >
              Continue →
            </Button>
          </div>
        )}

        {/* Currency input */}
        {question.type === 'currency' && (
          <div className="w-full space-y-4">
            <Input
              type="text"
              value={typeof localValue === 'number' ? formatCurrencyInput(localValue) : ''}
              onChange={handleCurrencyChange}
              placeholder="$0"
              className="text-center text-3xl font-bold h-16"
            />
            <Button
              className="w-full"
              onClick={handleCurrencySubmit}
              disabled={typeof localValue !== 'number' || localValue < 1}
            >
              Continue →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
