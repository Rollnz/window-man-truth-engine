import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Award, Share2, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getQuizResult } from '@/data/quizData';
import { NextStepCard } from '@/components/seo/NextStepCard';
import { MethodologyBadge } from '@/components/authority/MethodologyBadge';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  onGetAnswerKey: () => void;
}

export function QuizResults({ score, totalQuestions, onGetAnswerKey }: QuizResultsProps) {
  const navigate = useNavigate();
  const result = getQuizResult(score);

  const handleNavigateToCTA = () => {
    navigate(result.ctaPath);
  };

  const handleShare = () => {
    const text = `I scored ${score}/${totalQuestions} on the Window IQ Challenge. Think you can beat me? 🪟`;
    const url = window.location.origin + '/vulnerability-test';
    
    if (navigator.share) {
      navigator.share({ title: 'Window IQ Challenge', text, url });
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(`${text} ${url}`);
    }
  };

  const VulnerabilityIcon = result.vulnerabilityLevel === 'CRITICAL' 
    ? AlertTriangle 
    : result.vulnerabilityLevel === 'LOW' 
      ? Award 
      : Shield;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg mx-auto">
        {/* Score display */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-card border-4 border-border mb-4 relative">
            <div className={`absolute inset-2 rounded-full ${result.badgeColor} opacity-20`} />
            <div className="text-center relative z-10">
              <span className="text-4xl font-bold text-foreground">{score}</span>
              <span className="text-lg text-muted-foreground">/{totalQuestions}</span>
            </div>
          </div>
        </div>

        {/* Vulnerability badge */}
        <div className={`${result.badgeColor} text-white px-6 py-3 rounded-lg text-center mb-6 animate-fade-in`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <VulnerabilityIcon className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wide">{result.title}</span>
          </div>
          <p className="text-sm opacity-90">{result.subtitle}</p>
        </div>

        {/* Prescription */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">
            Assessment
          </h3>
          <p className="text-foreground leading-relaxed">
            {result.prescription}
          </p>
        </div>

        {/* Primary CTA */}
        <Button
          size="lg"
          onClick={handleNavigateToCTA}
          className="w-full text-lg mb-4 glow hover:glow-lg"
        >
          {result.ctaText}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onGetAnswerKey}
            className="flex-1"
          >
            <Mail className="w-4 h-4 mr-2" />
            Get Answer Key
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex-1"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Challenge a Friend
          </Button>
        </div>

        {/* Trust text */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Enter email to unlock detailed explanations for all 5 questions
        </p>

        {/* Methodology Badge */}
        <div className="flex justify-center mt-4">
          <MethodologyBadge />
        </div>

        {/* Next Step Card - Prevents traffic leaks */}
        <NextStepCard currentToolPath="/vulnerability-test" className="mt-8" />
      </div>
    </div>
  );
}
