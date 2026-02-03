import { useState, useMemo } from 'react';
import { RefreshCw, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CallAgentTable } from '@/components/admin/CallAgentTable';
import { KillSwitchDialog } from '@/components/admin/KillSwitchDialog';
import { StatsCards } from '@/components/admin/StatsCards';
import { SearchFilterBar, ShowMode } from '@/components/admin/SearchFilterBar';
import { useCallAgents } from '@/hooks/useCallAgents';
import { SOURCE_TOOL_LABELS } from '@/constants/sourceToolLabels';

function CallAgentsConfigContent() {
  const { 
    agents, 
    loading, 
    error, 
    refetch, 
    summary,
    testCall,
    toggleEnabled,
    updateAgentId,
    updateTemplate,
    updateAgentName,
    killSwitch,
  } = useCallAgents();

  const [isKillSwitchOpen, setIsKillSwitchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMode, setShowMode] = useState<ShowMode>('all');

  // Kill switch uses FULL agents array (not filtered)
  const enabledCount = agents.filter(a => a.enabled).length;

  // Filter agents based on search and show mode
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      // Show mode filter
      if (showMode === 'enabled' && !agent.enabled) return false;
      if (showMode === 'disabled' && agent.enabled) return false;

      // Search filter — only runs if query is non-empty
      if (searchQuery.trim() === '') return true;
      const q = searchQuery.trim().toLowerCase();
      const nameMatch = agent.agent_name.toLowerCase().includes(q);
      const labelMatch = (SOURCE_TOOL_LABELS[agent.source_tool] || '').toLowerCase().includes(q);
      return nameMatch || labelMatch;
    });
  }, [agents, searchQuery, showMode]);

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
            <div className="flex items-center gap-2">
              {/* Kill Switch Button - hidden when no agents are enabled */}
              {enabledCount > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsKillSwitchOpen(true)}
                  className="gap-1.5"
                >
                  <Power className="h-4 w-4" />
                  Kill Switch
                </Button>
              )}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 lg:p-6">
        {/* Stats Cards - uses FULL agents array */}
        <StatsCards summary={summary} totalAgents={agents.length} />

        {/* Search & Filter Bar */}
        <SearchFilterBar
          onFilterChange={({ query, showMode: mode }) => {
            setSearchQuery(query);
            setShowMode(mode);
          }}
        />

        {/* Agent Table - uses FILTERED agents */}
        <CallAgentTable
          agents={filteredAgents}
          loading={loading}
          error={error}
          refetch={refetch}
          testCall={testCall}
          toggleEnabled={toggleEnabled}
          updateAgentId={updateAgentId}
          updateTemplate={updateTemplate}
          updateAgentName={updateAgentName}
        />
      </main>

      {/* Kill Switch Dialog */}
      <KillSwitchDialog
        isOpen={isKillSwitchOpen}
        onClose={() => setIsKillSwitchOpen(false)}
        onConfirm={killSwitch}
        enabledAgentCount={enabledCount}
      />
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
