import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface QuestionStepProps {
  question: string;
  description?: string;
  options?: Option[];
  type: 'buttons' | 'slider';
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    unit: string;
  };
  isPrefilled?: boolean;
}

const QuestionStep = ({
  question,
  description,
  options,
  type,
  value,
  onChange,
  sliderConfig,
  isPrefilled,
}: QuestionStepProps) => {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        {isPrefilled && (
          <Badge variant="secondary" className="mb-4 bg-primary/20 text-primary border-primary/30">
            <Info className="w-3 h-3 mr-1" />
            Using your saved info
          </Badge>
        )}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          {question}
        </h2>
        {description && (
          <p className="text-muted-foreground text-lg">{description}</p>
        )}
      </div>

      {type === 'buttons' && options && (
        <div className="grid gap-3 max-w-lg mx-auto">
          {options.map((option) => (
            <Button
              key={option.value}
              variant={value === option.value ? "default" : "outline"}
              className={cn(
                "w-full py-6 text-lg transition-all duration-200",
                value === option.value 
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)]" 
                  : "hover:border-primary/50 hover:bg-primary/10"
              )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}

      {type === 'slider' && sliderConfig && (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center">
            <span className="text-5xl font-bold text-primary">
              {value || sliderConfig.min}
            </span>
            <span className="text-2xl text-muted-foreground ml-2">
              {sliderConfig.unit}
            </span>
          </div>
          <Slider
            value={[Number(value) || sliderConfig.min]}
            onValueChange={(vals) => onChange(vals[0])}
            min={sliderConfig.min}
            max={sliderConfig.max}
            step={sliderConfig.step}
            className="w-full"
            aria-label={`${question} - currently ${value || sliderConfig.min} ${sliderConfig.unit}`}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{sliderConfig.min} {sliderConfig.unit}</span>
            <span>{sliderConfig.max} {sliderConfig.unit}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionStep;
