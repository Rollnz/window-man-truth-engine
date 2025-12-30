import { Button } from '@/components/ui/button';
import { SessionData } from '@/hooks/useSessionData';
import { MessageCircle } from 'lucide-react';

interface SuggestedQuestionsProps {
  sessionData: SessionData;
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({ sessionData, onSelect, disabled }: SuggestedQuestionsProps) {
  // Generate contextual questions based on user's data
  const questions: string[] = [];

  if (sessionData.costOfInactionTotal) {
    questions.push(`I'm losing $${sessionData.costOfInactionTotal.toLocaleString()} over 5 years. Is that really accurate?`);
    questions.push("How quickly would new windows pay for themselves?");
  }

  if (sessionData.windowAge && sessionData.windowAge.includes('20')) {
    questions.push("My windows are over 20 years old. Should I replace them all at once or gradually?");
  }

  if (sessionData.draftinessLevel === 'severe' || sessionData.draftinessLevel === 'moderate') {
    questions.push("I have drafty windows. Will impact windows fix this completely?");
  }

  if (sessionData.noiseLevel === 'severe' || sessionData.noiseLevel === 'moderate') {
    questions.push("How much quieter will my home be with impact windows?");
  }

  // Always include these general questions
  questions.push("What insurance discounts can I expect with impact windows?");
  questions.push("What should I look for when choosing a window contractor?");
  questions.push("Are there financing options available?");

  // Limit to 4 questions
  const displayQuestions = questions.slice(0, 4);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        Suggested questions based on your situation:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {displayQuestions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto py-3 px-4 text-left text-sm whitespace-normal justify-start"
            onClick={() => onSelect(question)}
            disabled={disabled}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
