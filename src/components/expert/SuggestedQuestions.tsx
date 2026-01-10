import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({ onSelect, disabled }: SuggestedQuestionsProps) {
  const questions = [
    "What are the 3 biggest scams window contractors pull?",
    "How can I legitimately get insurance to pay for my upgrade?",
    "How do I know if a quote is 'fair' or price-gouging?",
    "What 'hidden costs' are usually buried in the fine print?"
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        Suggested questions based on your situation:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto py-4 px-5 text-left text-sm whitespace-normal justify-start min-h-[60px]"
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
