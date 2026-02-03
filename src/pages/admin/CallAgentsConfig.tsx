import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CallAgentTable } from '@/components/admin/CallAgentTable';
import { useCallAgents } from '@/hooks/useCallAgents';

function CallAgentsConfigContent() {
  const { 
    agents, 
    loading, 
    error, 
    refetch, 
    testCall,
    toggleEnabled,
    updateAgentId,
    updateTemplate,
  } = useCallAgents();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Call Agents Command Center</h1>
              <p className="text-sm text-muted-foreground">
                Manage PhoneCall.bot voice agent integrations
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 lg:p-6">
        <CallAgentTable
          agents={agents}
          loading={loading}
          error={error}
          refetch={refetch}
          testCall={testCall}
          toggleEnabled={toggleEnabled}
          updateAgentId={updateAgentId}
          updateTemplate={updateTemplate}
        />
      </main>
    </div>
  );
}

export default function CallAgentsConfig() {
  return (
    <AuthGuard>
      <CallAgentsConfigContent />
    </AuthGuard>
  );
}
