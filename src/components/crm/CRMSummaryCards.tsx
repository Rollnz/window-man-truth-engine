import { useMemo } from 'react';
import { Users, DollarSign, TrendingUp, Target, Flame, Snowflake, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CRMLead, LEAD_STATUS_CONFIG } from '@/types/crm';

interface CRMSummaryCardsProps {
  leads: CRMLead[];
}

export function CRMSummaryCards({ leads }: CRMSummaryCardsProps) {
  const stats = useMemo(() => {
    const totalValue = leads.reduce((sum, lead) => 
      sum + (lead.actual_deal_value || lead.estimated_deal_value || 0), 0
    );
    
    const closedWonValue = leads
      .filter(l => l.status === 'closed_won')
      .reduce((sum, lead) => sum + (lead.actual_deal_value || 0), 0);

    const hotLeads = leads.filter(l =>
      l.lead_quality === 'hot' || l.lead_quality === 'qualified' || l.lead_segment === 'HOT'
    ).length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const appointmentsSet = leads.filter(l => l.status === 'appointment_set' || l.status === 'sat').length;
    const v2Qualified = leads.filter(l => !!l.qualification_completed_at).length;

    return {
      total: leads.length,
      totalValue,
      closedWonValue,
      hotLeads,
      newLeads,
      appointmentsSet,
      v2Qualified,
    };
  }, [leads]);

  const cards = [
    {
      title: 'Total Leads',
      value: stats.total,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'New Leads',
      value: stats.newLeads,
      icon: Snowflake,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Hot Leads',
      value: stats.hotLeads,
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Appointments',
      value: stats.appointmentsSet,
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Pipeline Value',
      value: `$${stats.totalValue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'V2 Qualified',
      value: stats.v2Qualified,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Closed Won',
      value: `$${stats.closedWonValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.title}</p>
                <p className="text-lg font-semibold">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
