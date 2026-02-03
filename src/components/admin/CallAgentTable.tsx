import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Bot, Phone, Loader2 } from 'lucide-react';
import { CallAgent } from '@/hooks/useCallAgents';
import { getSourceToolLabel } from '@/constants/sourceToolLabels';
import { TestCallDialog } from './TestCallDialog';
import { AgentIdEditor } from './AgentIdEditor';
import { AgentNameEditor } from './AgentNameEditor';
import { TemplateEditor } from './TemplateEditor';
import { toast } from '@/hooks/use-toast';

interface CallAgentTableProps {
  agents: CallAgent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  testCall: (source_tool: string, phone_number: string) => Promise<{
    test_call_id: string;
    provider_call_id?: string | null;
  }>;
  toggleEnabled: (source_tool: string, enabled: boolean) => Promise<void>;
  updateAgentId: (source_tool: string, agent_id: string) => Promise<void>;
  updateTemplate: (source_tool: string, template: string) => Promise<void>;
  updateAgentName: (source_tool: string, agent_name: string) => Promise<void>;
}

interface AgentCardProps {
  agent: CallAgent;
  onTestCall: () => void;
  onToggleEnabled: (source_tool: string, enabled: boolean) => Promise<void>;
  onUpdateAgentId: (source_tool: string, agent_id: string) => Promise<void>;
  onUpdateTemplate: (source_tool: string, template: string) => Promise<void>;
  onUpdateAgentName: (source_tool: string, agent_name: string) => Promise<void>;
}

function AgentCard({
  agent,
  onTestCall,
  onToggleEnabled,
  onUpdateAgentId,
  onUpdateTemplate,
  onUpdateAgentName,
}: AgentCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const label = getSourceToolLabel(agent.source_tool);
  const truncatedMessage = agent.first_message_template.length > 80
    ? `${agent.first_message_template.slice(0, 80)}...`
    : agent.first_message_template;

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggleEnabled(agent.source_tool, !agent.enabled);
      toast({
        title: 'Success',
        description: `${label} is now ${!agent.enabled ? 'Active' : 'Disabled'}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update ${label}: ${message}`,
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">{label}</h3>
              {/* Agent Name Editor - directly below source tool label */}
              <AgentNameEditor
                source_tool={agent.source_tool}
                current_agent_name={agent.agent_name}
                onSave={onUpdateAgentName}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <div className={isToggling ? 'opacity-60 pointer-events-none' : ''}>
                <Switch
                  checked={agent.enabled}
                  onCheckedChange={handleToggle}
                  disabled={isToggling}
                />
              </div>
              {isToggling ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <span
                  className={`text-sm font-medium ${
                    agent.enabled ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {agent.enabled ? 'Active' : 'Disabled'}
                </span>
              )}
            </div>

            {/* Test Call Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onTestCall}
              className="gap-1.5"
            >
              <Phone className="h-3.5 w-3.5" />
              Test Call
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent ID Editor */}
        <AgentIdEditor
          source_tool={agent.source_tool}
          current_agent_id={agent.agent_id}
          onSave={onUpdateAgentId}
        />

        {/* First Message Template (truncated preview) */}
        <div>
          <span className="text-sm text-muted-foreground">First Message Template:</span>
          <p className="text-sm text-foreground mt-1 bg-muted/50 p-2 rounded">
            {truncatedMessage || <span className="text-muted-foreground italic">No template set</span>}
          </p>
        </div>

        {/* Template Editor (collapsible) */}
        <TemplateEditor
          source_tool={agent.source_tool}
          current_template={agent.first_message_template}
          onSave={onUpdateTemplate}
        />

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground">
          Last Updated: {agent.updated_at}
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

export function CallAgentTable({
  agents,
  loading,
  error,
  refetch,
  testCall,
  toggleEnabled,
  updateAgentId,
  updateTemplate,
  updateAgentName,
}: CallAgentTableProps) {
  const [selectedAgent, setSelectedAgent] = useState<CallAgent | null>(null);

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
    <>
      <div className="space-y-4">
        {agents.map((agent) => (
          <AgentCard
            key={agent.source_tool}
            agent={agent}
            onTestCall={() => setSelectedAgent(agent)}
            onToggleEnabled={toggleEnabled}
            onUpdateAgentId={updateAgentId}
            onUpdateTemplate={updateTemplate}
            onUpdateAgentName={updateAgentName}
          />
        ))}
      </div>

      {/* Single dialog instance for all cards */}
      <TestCallDialog
        isOpen={selectedAgent !== null}
        onClose={() => setSelectedAgent(null)}
        agent={selectedAgent}
        onTestCall={testCall}
      />
    </>
  );
}
