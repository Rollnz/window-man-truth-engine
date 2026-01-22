import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Deal, DealInput } from '@/hooks/useLeadFinancials';
import { DEAL_PAYMENT_STATUS_CONFIG } from '@/types/profitability';

const dealSchema = z.object({
  outcome: z.enum(['won', 'lost']),
  close_date: z.string().optional(),
  gross_revenue: z.coerce.number().min(0, 'Must be positive'),
  cogs: z.coerce.number().min(0, 'Must be positive'),
  labor_cost: z.coerce.number().min(0, 'Must be positive'),
  commissions: z.coerce.number().min(0, 'Must be positive'),
  other_cost: z.coerce.number().min(0, 'Must be positive'),
  payment_status: z.enum(['unpaid', 'deposit_paid', 'paid_in_full', 'refunded']),
  invoice_id: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal;
  onSubmit: (data: DealInput) => Promise<boolean>;
}

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  onSubmit,
}: DealFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!deal;

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      outcome: deal?.outcome || 'won',
      close_date: deal?.close_date || '',
      gross_revenue: deal?.gross_revenue || 0,
      cogs: deal?.cogs || 0,
      labor_cost: deal?.labor_cost || 0,
      commissions: deal?.commissions || 0,
      other_cost: deal?.other_cost || 0,
      payment_status: deal?.payment_status || 'unpaid',
      invoice_id: deal?.invoice_id || '',
    },
  });

  // Calculate net_profit preview (read-only - actual value is generated in DB)
  const grossRevenue = Number(form.watch('gross_revenue')) || 0;
  const cogs = Number(form.watch('cogs')) || 0;
  const laborCost = Number(form.watch('labor_cost')) || 0;
  const commissions = Number(form.watch('commissions')) || 0;
  const otherCost = Number(form.watch('other_cost')) || 0;
  const netProfitPreview = grossRevenue - cogs - laborCost - commissions - otherCost;

  const handleSubmit = async (values: DealFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        outcome: values.outcome,
        close_date: values.close_date || null,
        gross_revenue: values.gross_revenue,
        cogs: values.cogs,
        labor_cost: values.labor_cost,
        commissions: values.commissions,
        other_cost: values.other_cost,
        payment_status: values.payment_status,
        invoice_id: values.invoice_id || null,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Deal' : 'Create Deal'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Select
                value={form.watch('outcome')}
                onValueChange={(value) => form.setValue('outcome', value as 'won' | 'lost')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="close_date">Close Date</Label>
              <Input
                id="close_date"
                type="date"
                {...form.register('close_date')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gross_revenue">Gross Revenue ($)</Label>
            <Input
              id="gross_revenue"
              type="number"
              min="0"
              step="100"
              {...form.register('gross_revenue')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cogs">COGS ($)</Label>
              <Input
                id="cogs"
                type="number"
                min="0"
                step="10"
                {...form.register('cogs')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="labor_cost">Labor Cost ($)</Label>
              <Input
                id="labor_cost"
                type="number"
                min="0"
                step="10"
                {...form.register('labor_cost')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissions">Commissions ($)</Label>
              <Input
                id="commissions"
                type="number"
                min="0"
                step="10"
                {...form.register('commissions')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="other_cost">Other Costs ($)</Label>
              <Input
                id="other_cost"
                type="number"
                min="0"
                step="10"
                {...form.register('other_cost')}
              />
            </div>
          </div>

          <div className={`rounded-lg p-3 ${netProfitPreview >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
            <div className="text-sm text-muted-foreground">Net Profit (calculated)</div>
            <div className={`text-xl font-semibold ${netProfitPreview >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              ${netProfitPreview.toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                value={form.watch('payment_status')}
                onValueChange={(value) => form.setValue('payment_status', value as DealFormValues['payment_status'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEAL_PAYMENT_STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_id">Invoice ID</Label>
              <Input
                id="invoice_id"
                placeholder="INV-001"
                {...form.register('invoice_id')}
              />
            </div>
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
