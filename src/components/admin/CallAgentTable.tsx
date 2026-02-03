import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Bot } from 'lucide-react';
import { CallAgent } from '@/hooks/useCallAgents';
import { getSourceToolLabel } from '@/constants/sourceToolLabels';

interface CallAgentTableProps {
  agents: CallAgent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function AgentCard({ agent }: { agent: CallAgent }) {
  const label = getSourceToolLabel(agent.source_tool);
  const maskedAgentId = agent.agent_id.length > 8 
    ? `${agent.agent_id.slice(0, 8)}...` 
    : agent.agent_id;
  const truncatedMessage = agent.first_message_template.length > 80
    ? `${agent.first_message_template.slice(0, 80)}...`
    : agent.first_message_template;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{label}</h3>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              agent.enabled
                ? 'bg-green-500/20 text-green-600'
                : 'bg-red-500/20 text-red-600'
            }`}
          >
            {agent.enabled ? 'Active' : 'Disabled'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Agent ID:</span>
            <p className="font-mono text-foreground">{maskedAgentId}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Last Updated:</span>
            <p className="text-foreground">{agent.updated_at}</p>
          </div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">First Message Template:</span>
          <p className="text-sm text-foreground mt-1 bg-muted/50 p-2 rounded">
            {truncatedMessage}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorBanner({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive/50 bg-destructive/10">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-destructive font-medium">{error}</span>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Bot className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">No agents configured</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Call agents will appear here once configured in the database.
        </p>
      </CardContent>
    </Card>
  );
}

export function CallAgentTable({ agents, loading, error, refetch }: CallAgentTableProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorBanner error={error} onRetry={refetch} />;
  }

  if (agents.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <AgentCard key={agent.source_tool} agent={agent} />
      ))}
    </div>
  );
}
