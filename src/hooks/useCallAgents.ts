import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CallAgent {
  source_tool: string;
  agent_id: string;
  agent_name: string;
  enabled: boolean;
  first_message_template: string;
  updated_at: string;
  webhook_url?: string;
  last_dispatch_at: string | null;
  last_error: { message: string; triggered_at: string } | null;
  calls_24h: number;
  errors_24h: number;
}

export interface AgentSummary {
  total_calls_24h: number;
  errors_24h: number;
  active_agents: number;
  success_rate: number | null;
}

interface TestCallResult {
  test_call_id: string;
  provider_call_id?: string | null;
}

interface UseCallAgentsReturn {
  agents: CallAgent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  summary: AgentSummary;
  testCall: (source_tool: string, phone_number: string) => Promise<TestCallResult>;
  toggleEnabled: (source_tool: string, enabled: boolean) => Promise<void>;
  updateAgentId: (source_tool: string, agent_id: string) => Promise<void>;
  updateTemplate: (source_tool: string, first_message_template: string) => Promise<void>;
  updateAgentName: (source_tool: string, agent_name: string) => Promise<void>;
  killSwitch: () => Promise<{ disabled_count: number }>;
}

/**
 * Manages call agent configurations: CRUD operations on AI phone agents,
 * including enable/disable, template editing, and per-agent dispatch stats.
 */
export function useCallAgents(): UseCallAgentsReturn {
  const [agents, setAgents] = useState<CallAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AgentSummary>({
    total_calls_24h: 0,
    errors_24h: 0,
    active_agents: 0,
    success_rate: null,
  });

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-call-agent`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setAgents(data.agents || []);
      setSummary(data.summary || {
        total_calls_24h: 0,
        errors_24h: 0,
        active_agents: 0,
        success_rate: null,
      });
    } catch (err) {
      console.error('[useCallAgents] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle enabled state with optimistic update
   * Updates UI instantly, syncs updated_at in background without flash
   */
  const toggleEnabled = useCallback(async (
    source_tool: string,
    enabled: boolean
  ): Promise<void> => {
    // Validate required parameters before any state changes
    if (!source_tool) {
      throw new Error('source_tool is required');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Step 1: Capture snapshot for rollback
    const snapshot = [...agents];

    // Step 2: Optimistic update - instant UI change
    setAgents(prev => prev.map(agent =>
      agent.source_tool === source_tool
        ? { ...agent, enabled, updated_at: new Date().toISOString() }
        : agent
    ));

    try {
      // Step 3: Send PATCH request in background
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-call-agent`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ source_tool, enabled }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // Step 4a: Success - silently update only the timestamp from server response
      if (data.agent?.updated_at) {
        setAgents(prev => prev.map(agent =>
          agent.source_tool === source_tool
            ? { ...agent, updated_at: data.agent.updated_at }
            : agent
        ));
      }
      // No full refetch - prevents flash
    } catch (err) {
      // Step 4b: Failure - rollback to snapshot
      setAgents(snapshot);
      throw err;
    }
  }, [agents]);

  /**
   * Update agent_id (server-first, not optimistic)
   */
  const updateAgentId = useCallback(async (
    source_tool: string,
    new_agent_id: string
  ): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-call-agent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source_tool, new_agent_id }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    // Update local state after server confirms
    setAgents(prev => prev.map(agent =>
      agent.source_tool === source_tool
        ? { ...agent, agent_id: new_agent_id }
        : agent
    ));

    // Refetch to sync updated_at
    await fetchAgents();
  }, [fetchAgents]);

  /**
   * Update first_message_template (server-first, not optimistic)
   */
  const updateTemplate = useCallback(async (
    source_tool: string,
    first_message_template: string
  ): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-call-agent`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source_tool, first_message_template }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    // Update local state after server confirms
    setAgents(prev => prev.map(agent =>
      agent.source_tool === source_tool
        ? { ...agent, first_message_template }
        : agent
    ));

    // Refetch to sync updated_at
    await fetchAgents();
  }, [fetchAgents]);

  /**
   * Update agent_name (server-first, not optimistic)
   */
  const updateAgentName = useCallback(async (
    source_tool: string,
    agent_name: string
  ): Promise<void> => {
    // Validate required parameters before any state changes
    if (!source_tool) {
      throw new Error('source_tool is required');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-call-agent`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source_tool, agent_name }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    // Update local state after server confirms
    setAgents(prev => prev.map(agent =>
      agent.source_tool === source_tool
        ? { ...agent, agent_name }
        : agent
    ));

    // Refetch to sync updated_at
    await fetchAgents();
  }, [fetchAgents]);

  /**
   * Kill Switch - disable ALL enabled agents (server-first, NOT optimistic)
   */
  const killSwitch = useCallback(async (): Promise<{ disabled_count: number }> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-call-agent`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kill_switch: true }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    // Update local state - set all agents to disabled
    setAgents(prev => prev.map(agent => ({
      ...agent,
      enabled: false,
      updated_at: new Date().toISOString(),
    })));

    // Refetch to sync everything
    await fetchAgents();

    return { disabled_count: data.disabled_count || 0 };
  }, [fetchAgents]);

  /**
   * Dispatch a test call directly to PhoneCall.bot.
   * Bypasses the pending_calls queue - admin testing only.
   */
  const testCall = useCallback(async (
    source_tool: string,
    phone_number: string
  ): Promise<TestCallResult> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-call-agent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_source_tool: source_tool,
          phone_number: phone_number,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return {
      test_call_id: data.test_call_id,
      provider_call_id: data.provider_call_id,
    };
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
    summary,
    testCall,
    toggleEnabled,
    updateAgentId,
    updateTemplate,
    updateAgentName,
    killSwitch,
  };
}
