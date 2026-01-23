import { useState } from 'react';
import { ArrowRight, Home, Clock, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { EstimateFormData } from '../EstimateSlidePanel';

interface ProjectDetailsStepProps {
  formData: EstimateFormData;
  updateFormData: (updates: Partial<EstimateFormData>) => void;
  onNext: () => void;
}

const PROJECT_TYPES = [
  { value: 'full-replacement', label: 'Full Window Replacement', description: 'Replace all windows' },
  { value: 'partial-replacement', label: 'Partial Replacement', description: 'Replace some windows' },
  { value: 'new-construction', label: 'New Construction', description: 'New build or addition' },
  { value: 'storm-damage', label: 'Storm Damage Repair', description: 'Insurance claim or repair' },
];

const TIMELINES = [
  { value: 'asap', label: 'ASAP', description: 'Within 2 weeks' },
  { value: '1-3-months', label: '1-3 Months', description: 'Planning ahead' },
  { value: '3-6-months', label: '3-6 Months', description: 'Future project' },
  { value: 'just-exploring', label: 'Just Exploring', description: 'Gathering info' },
];

export function ProjectDetailsStep({ formData, updateFormData, onNext }: ProjectDetailsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.windowCount || formData.windowCount < 1) {
      newErrors.windowCount = 'Please enter the number of windows';
    }
    if (!formData.projectType) {
      newErrors.projectType = 'Please select a project type';
    }
    if (!formData.timeline) {
      newErrors.timeline = 'Please select a timeline';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      // Fire structured GTM dataLayer event after validation succeeds
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'lead_form_step_completed',
        form_name: 'floating_slide_over',
        step_name: 'project_info',
        step_index: 1,
        step_status: 'validated',
      });
      onNext();
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* Window Count */}
      <div className="space-y-2">
        <Label htmlFor="windowCount" className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          How many windows?
        </Label>
        <Input
          id="windowCount"
          type="number"
          min="1"
          max="100"
          placeholder="Enter number of windows"
          value={formData.windowCount || ''}
          onChange={(e) => updateFormData({ windowCount: parseInt(e.target.value) || null })}
          className={errors.windowCount ? 'border-destructive' : ''}
        />
        {errors.windowCount && (
          <p className="text-sm text-destructive">{errors.windowCount}</p>
        )}
      </div>

      {/* Project Type */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" />
          What type of project?
        </Label>
        <RadioGroup
          value={formData.projectType}
          onValueChange={(value) => updateFormData({ projectType: value })}
          className="grid gap-2"
        >
          {PROJECT_TYPES.map((type) => (
            <div
              key={type.value}
              className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                formData.projectType === type.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => updateFormData({ projectType: type.value })}
            >
              <RadioGroupItem value={type.value} id={type.value} />
              <div className="flex-1">
                <Label htmlFor={type.value} className="cursor-pointer font-medium">
                  {type.label}
                </Label>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
        {errors.projectType && (
          <p className="text-sm text-destructive">{errors.projectType}</p>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          When do you need this done?
        </Label>
        <RadioGroup
          value={formData.timeline}
          onValueChange={(value) => updateFormData({ timeline: value })}
          className="grid grid-cols-2 gap-2"
        >
          {TIMELINES.map((timeline) => (
            <div
              key={timeline.value}
              className={`flex flex-col items-center justify-center rounded-lg border p-3 cursor-pointer transition-colors text-center ${
                formData.timeline === timeline.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => updateFormData({ timeline: timeline.value })}
            >
              <RadioGroupItem value={timeline.value} id={timeline.value} className="sr-only" />
              <Label htmlFor={timeline.value} className="cursor-pointer font-medium text-sm">
                {timeline.label}
              </Label>
              <p className="text-[10px] text-muted-foreground">{timeline.description}</p>
            </div>
          ))}
        </RadioGroup>
        {errors.timeline && (
          <p className="text-sm text-destructive">{errors.timeline}</p>
        )}
      </div>

      {/* Next Button */}
      <Button onClick={handleNext} className="w-full" size="lg">
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
