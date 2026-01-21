import { useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Deal, DealInput } from '@/hooks/useLeadFinancials';
import { DealFormDialog } from './DealFormDialog';
import { DEAL_PAYMENT_STATUS_CONFIG } from '@/types/profitability';
import { format } from 'date-fns';

interface DealsPanelProps {
  deals: Deal[];
  isLoading: boolean;
  onCreate: (data: DealInput) => Promise<boolean>;
  onUpdate: (id: string, data: DealInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function DealsPanel({
  deals,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: DealsPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
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
          <CardTitle className="text-base">Deals</CardTitle>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No deals yet
            </p>
          ) : (
            deals.map((deal) => {
              const paymentConfig = DEAL_PAYMENT_STATUS_CONFIG[deal.payment_status];
              
              return (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {deal.outcome === 'won' ? (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Won
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Lost
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: paymentConfig.color, color: paymentConfig.color }}
                      >
                        {paymentConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-medium">${Number(deal.gross_revenue).toLocaleString()}</span>
                      <span className={`text-sm ${Number(deal.net_profit) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        ${Number(deal.net_profit).toLocaleString()} profit
                      </span>
                    </div>
                    {deal.close_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Closed {format(new Date(deal.close_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingDeal(deal)}
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
                          <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this deal? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(deal.id)}>
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
        </CardContent>
      </Card>

      <DealFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={onCreate}
      />

      <DealFormDialog
        open={!!editingDeal}
        onOpenChange={(open) => !open && setEditingDeal(null)}
        deal={editingDeal || undefined}
        onSubmit={async (data) => {
          if (editingDeal) {
            return onUpdate(editingDeal.id, data);
          }
          return false;
        }}
      />
    </>
  );
}
