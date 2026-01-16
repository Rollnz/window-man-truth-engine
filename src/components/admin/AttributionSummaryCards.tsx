import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Sparkles } from "lucide-react";

interface AttributionSummaryCardsProps {
  totalLeads: number;
  totalEmails: number;
  totalAiInteractions: number;
  isLoading?: boolean;
}

export function AttributionSummaryCards({
  totalLeads,
  totalEmails,
  totalAiInteractions,
  isLoading = false,
}: AttributionSummaryCardsProps) {
  const cards = [
    {
      title: "Total Leads",
      value: totalLeads,
      icon: Users,
      description: "Captured lead records",
    },
    {
      title: "Vault Emails",
      value: totalEmails,
      icon: Mail,
      description: "Email summaries sent",
    },
    {
      title: "AI Interactions",
      value: totalAiInteractions,
      icon: Sparkles,
      description: "Tool completions",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse bg-muted rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
