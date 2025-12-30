import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RiskQuestion as RiskQuestionType, RiskCategory } from '@/data/riskDiagnosticData';

interface RiskQuestionProps {
  category: RiskCategory;
  question: RiskQuestionType;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function RiskQuestion({
  category,
  question,
  currentQuestionIndex,
  totalQuestions,
  selectedValue,
  onSelect,
  onBack,
  canGoBack,
}: RiskQuestionProps) {
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const Icon = category.icon;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Progress section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-1 h-auto"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <Badge variant="outline" className="border-primary/30">
              <Icon className="w-3 h-3 mr-1" />
              {category.shortTitle}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} of {totalQuestions}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-3">
          {question.question}
        </h2>
        {question.description && (
          <p className="text-muted-foreground text-sm sm:text-base">
            {question.description}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <Button
              key={option.value}
              variant={isSelected ? 'default' : 'outline'}
              className={`w-full h-auto py-4 px-4 text-left justify-start transition-all ${
                isSelected 
                  ? 'border-primary glow-sm' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onSelect(option.value)}
            >
              <span className="text-base">{option.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Skip option */}
      <div className="mt-6 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect('skip')}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip this question
        </Button>
      </div>
    </div>
  );
}
