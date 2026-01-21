import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Opportunity, OpportunityInput } from '@/hooks/useLeadFinancials';
import { OPPORTUNITY_STAGE_CONFIG } from '@/types/profitability';

const opportunitySchema = z.object({
  stage: z.enum(['new', 'qualifying', 'quoted', 'negotiating', 'won', 'lost']),
  expected_value: z.coerce.number().min(0, 'Value must be positive'),
  probability: z.coerce.number().min(0).max(100),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

interface OpportunityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: Opportunity;
  onSubmit: (data: OpportunityInput) => Promise<boolean>;
}

export function OpportunityFormDialog({
  open,
  onOpenChange,
  opportunity,
  onSubmit,
}: OpportunityFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!opportunity;

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      stage: opportunity?.stage || 'new',
      expected_value: opportunity?.expected_value || 0,
      probability: opportunity?.probability || 10,
      assigned_to: opportunity?.assigned_to || '',
      notes: opportunity?.notes || '',
    },
  });

  const watchedValue = form.watch('expected_value');
  const watchedProbability = form.watch('probability');
  const forecast = (Number(watchedValue) || 0) * (Number(watchedProbability) || 0) / 100;

  const handleSubmit = async (values: OpportunityFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        stage: values.stage,
        expected_value: values.expected_value,
        probability: values.probability,
        assigned_to: values.assigned_to || null,
        notes: values.notes || null,
      });
      if (success) {
        onOpenChange(false);
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Opportunity' : 'Create Opportunity'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select
              value={form.watch('stage')}
              onValueChange={(value) => form.setValue('stage', value as OpportunityFormValues['stage'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OPPORTUNITY_STAGE_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_value">Expected Value ($)</Label>
            <Input
              id="expected_value"
              type="number"
              min="0"
              step="100"
              {...form.register('expected_value')}
            />
            {form.formState.errors.expected_value && (
              <p className="text-sm text-destructive">{form.formState.errors.expected_value.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="probability">Probability</Label>
              <span className="text-sm text-muted-foreground">{watchedProbability}%</span>
            </div>
            <Slider
              value={[Number(watchedProbability) || 10]}
              onValueChange={(values) => form.setValue('probability', values[0])}
              min={0}
              max={100}
              step={5}
            />
          </div>

          <div className="rounded-lg bg-muted p-3">
            <div className="text-sm text-muted-foreground">Weighted Forecast</div>
            <div className="text-xl font-semibold">${forecast.toLocaleString()}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Input
              id="assigned_to"
              placeholder="Sales rep name"
              {...form.register('assigned_to')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              rows={3}
              {...form.register('notes')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
