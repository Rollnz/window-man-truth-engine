import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
}

const ScoreGauge = ({ score, maxScore = 100 }: ScoreGaugeProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const percentage = (score / maxScore) * 100;
  
  const getColor = () => {
    if (score <= 30) return { color: "hsl(142, 76%, 36%)", label: "Low" };
    if (score <= 55) return { color: "hsl(48, 96%, 53%)", label: "Moderate" };
    if (score <= 75) return { color: "hsl(25, 95%, 53%)", label: "High" };
    return { color: "hsl(0, 84%, 60%)", label: "Critical" };
  };

  const { color, label } = getColor();

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        setIsAnimating(false);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (displayScore / maxScore) * circumference;

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
        />
        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-100"
          style={{
            filter: `drop-shadow(0 0 10px ${color})`,
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className={cn(
            "text-6xl font-bold transition-all",
            isAnimating && "scale-105"
          )}
          style={{ color }}
        >
          {displayScore}
        </span>
        <span className="text-lg text-muted-foreground mt-1">out of {maxScore}</span>
        <span 
          className="text-xl font-semibold mt-2"
          style={{ color }}
        >
          {label} Hidden Costs
        </span>
      </div>
    </div>
  );
};

export default ScoreGauge;
