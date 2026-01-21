import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Opportunity, OpportunityInput } from '@/hooks/useLeadFinancials';
import { OpportunityFormDialog } from './OpportunityFormDialog';
import { OPPORTUNITY_STAGE_CONFIG } from '@/types/profitability';

interface OpportunitiesPanelProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  onCreate: (data: OpportunityInput) => Promise<boolean>;
  onUpdate: (id: string, data: OpportunityInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function OpportunitiesPanel({
  opportunities,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: OpportunitiesPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);

  const totalForecast = opportunities.reduce((sum, opp) => {
    return sum + (opp.expected_value * opp.probability / 100);
  }, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base">Pipeline Opportunities</CardTitle>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {opportunities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No opportunities yet
            </p>
          ) : (
            opportunities.map((opp) => {
              const config = OPPORTUNITY_STAGE_CONFIG[opp.stage];
              const forecast = opp.expected_value * opp.probability / 100;
              
              return (
                <div
                  key={opp.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ backgroundColor: `${config.color}20`, color: config.color }}
                      >
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {opp.probability}% likely
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium">${opp.expected_value.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">
                        → ${forecast.toLocaleString()} forecast
                      </span>
                    </div>
                    {opp.notes && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {opp.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingOpp(opp)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this opportunity? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(opp.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })
          )}
          
          {opportunities.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Forecast</span>
                <span className="font-semibold">${totalForecast.toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OpportunityFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={onCreate}
      />

      <OpportunityFormDialog
        open={!!editingOpp}
        onOpenChange={(open) => !open && setEditingOpp(null)}
        opportunity={editingOpp || undefined}
        onSubmit={async (data) => {
          if (editingOpp) {
            return onUpdate(editingOpp.id, data);
          }
          return false;
        }}
      />
    </>
  );
}
