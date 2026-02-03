import { useState, useMemo } from 'react';
import { RefreshCw, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CallAgentTable } from '@/components/admin/CallAgentTable';
import { KillSwitchDialog } from '@/components/admin/KillSwitchDialog';
import { StatsCards } from '@/components/admin/StatsCards';
import { SearchFilterBar, ShowMode } from '@/components/admin/SearchFilterBar';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { useCallAgents } from '@/hooks/useCallAgents';
import { useCallActivity } from '@/hooks/useCallActivity';
import { SOURCE_TOOL_LABELS } from '@/constants/sourceToolLabels';
import { AudioPlaybackProvider } from '@/contexts/AudioPlaybackContext';

type ActiveTab = 'agents' | 'activity';

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

  // Activity tab hook - called unconditionally (React hooks requirement)
  const {
    calls,
    loading: activityLoading,
    error: activityError,
    hasMore,
    isLoadingMore,
    filters: activityFilters,
    setFilters: setActivityFilters,
    loadMore,
    refetch: refetchActivity,
  } = useCallActivity();

  const [activeTab, setActiveTab] = useState<ActiveTab>('agents');
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

        {/* Tab Bar */}
        <div className="flex border-b border-gray-200 mt-4">
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'agents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Agents
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'activity'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Activity
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'agents' ? (
          <>
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
          </>
        ) : (
          <AudioPlaybackProvider>
            <ActivityFeed
              calls={calls}
              loading={activityLoading}
              error={activityError}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMore}
              onRefresh={refetchActivity}
              filters={activityFilters}
              onFilterChange={setActivityFilters}
            />
          </AudioPlaybackProvider>
        )}
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
