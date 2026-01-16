import { useState } from 'react';
import { DollarSign, FileText, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CRMLead, LeadStatus } from '@/types/crm';

interface QuickUpdateFormProps {
  lead: CRMLead;
  onUpdate: (leadId: string, newStatus: LeadStatus, extras: {
    actualDealValue?: number;
    notes?: string;
    estimatedDealValue?: number;
  }) => Promise<boolean>;
  onClose: () => void;
}

export function QuickUpdateForm({ lead, onUpdate, onClose }: QuickUpdateFormProps) {
  const [dealValue, setDealValue] = useState<string>(
    (lead.actual_deal_value || lead.estimated_deal_value || '').toString()
  );
  const [notes, setNotes] = useState<string>(lead.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onUpdate(lead.id, lead.status, {
        actualDealValue: dealValue ? parseFloat(dealValue) : undefined,
        notes: notes || undefined,
      });
      if (success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkSold = async () => {
    if (!dealValue) {
      return;
    }
    
    setIsSaving(true);
    try {
      const success = await onUpdate(lead.id, 'closed_won', {
        actualDealValue: parseFloat(dealValue),
        notes: notes || undefined,
      });
      if (success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
      <h4 className="font-medium text-sm">Quick Update</h4>
      
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="dealValue" className="text-xs">
            Deal Value ($)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="dealValue"
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="0"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="notes" className="text-xs">
            Notes
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this lead..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        
        {lead.status !== 'closed_won' && (
          <Button
            variant="default"
            size="sm"
            onClick={handleMarkSold}
            disabled={isSaving || !dealValue}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Mark Sold
          </Button>
        )}
      </div>
    </div>
  );
}
