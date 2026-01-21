import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, CheckCircle2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { useRevenue } from '@/hooks/useRevenue';
import { useLeadFinancials } from '@/hooks/useLeadFinancials';
import { OpportunitiesPanel } from '@/components/lead-detail/OpportunitiesPanel';
import { DealsPanel } from '@/components/lead-detail/DealsPanel';
import { LeadProfitSummary } from '@/components/lead-detail/LeadProfitSummary';
import { DEAL_PAYMENT_STATUS_CONFIG } from '@/types/profitability';
import { format } from 'date-fns';

function RevenueContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const wmLeadId = searchParams.get('wm_lead_id');

  // Global mode
  const { kpis, recentDeals, isLoading: globalLoading } = useRevenue();
  
  // Lead-focused mode
  const leadFinancials = useLeadFinancials(wmLeadId || undefined);

  const isLeadFocused = !!wmLeadId;

  if (isLeadFocused) {
    const leadName = recentDeals.find(d => d.wm_lead_id === wmLeadId)?.lead_name || 'Lead';
    
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/revenue')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <AdminBreadcrumb 
                  items={[
                    { label: 'Command Center', href: '/admin' },
                    { label: 'Revenue', href: '/admin/revenue' },
                  ]} 
                  currentLabel="Lead Economics"
                />
                <h1 className="font-semibold mt-1">Lead Economics: {leadName}</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
          <LeadProfitSummary summary={leadFinancials.summary} isLoading={leadFinancials.isLoading} />
          
          <OpportunitiesPanel
            opportunities={leadFinancials.opportunities}
            isLoading={leadFinancials.isLoading}
            onCreate={leadFinancials.createOpportunity}
            onUpdate={leadFinancials.updateOpportunity}
            onDelete={leadFinancials.deleteOpportunity}
          />
          
          <DealsPanel
            deals={leadFinancials.deals}
            isLoading={leadFinancials.isLoading}
            onCreate={leadFinancials.createDeal}
            onUpdate={leadFinancials.updateDeal}
            onDelete={leadFinancials.deleteDeal}
          />

          <Button variant="outline" onClick={() => navigate(`/admin/leads/${wmLeadId}`)}>
            View Full Lead Profile
          </Button>
        </main>
      </div>
    );
  }

  // Global Revenue View
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <AdminBreadcrumb 
                items={[{ label: 'Command Center', href: '/admin' }]} 
                currentLabel="Revenue"
              />
              <h1 className="font-semibold mt-1">Revenue Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {globalLoading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Deals Won</span>
                  </div>
                  <p className="text-2xl font-bold">{kpis.dealsWon}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">${kpis.totalRevenue.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Total Profit</span>
                  </div>
                  <p className={`text-2xl font-bold ${kpis.totalProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    ${kpis.totalProfit.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm">Avg Deal Size</span>
                  </div>
                  <p className="text-2xl font-bold">${Math.round(kpis.avgDealSize).toLocaleString()}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Recent Deals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {globalLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : recentDeals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No deals yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Close Date</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Campaign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDeals.map((deal) => {
                    const paymentConfig = DEAL_PAYMENT_STATUS_CONFIG[deal.payment_status as keyof typeof DEAL_PAYMENT_STATUS_CONFIG];
                    return (
                      <TableRow 
                        key={deal.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/revenue?wm_lead_id=${deal.wm_lead_id}`)}
                      >
                        <TableCell className="font-medium">{deal.lead_name}</TableCell>
                        <TableCell>{deal.close_date ? format(new Date(deal.close_date), 'MMM d, yyyy') : '-'}</TableCell>
                        <TableCell className="text-right">${Number(deal.gross_revenue).toLocaleString()}</TableCell>
                        <TableCell className={`text-right ${Number(deal.net_profit) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          ${Number(deal.net_profit).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ borderColor: paymentConfig?.color, color: paymentConfig?.color }}>
                            {paymentConfig?.label || deal.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{deal.utm_campaign || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function Revenue() {
  return (
    <AuthGuard>
      <RevenueContent />
    </AuthGuard>
  );
}
