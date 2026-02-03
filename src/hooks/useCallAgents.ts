import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CallAgent {
  source_tool: string;
  agent_id: string;
  enabled: boolean;
  first_message_template: string;
  updated_at: string;
  webhook_url?: string;
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
  testCall: (source_tool: string, phone_number: string) => Promise<TestCallResult>;
  toggleEnabled: (source_tool: string, enabled: boolean) => Promise<void>;
  updateAgentId: (source_tool: string, agent_id: string) => Promise<void>;
  updateTemplate: (source_tool: string, first_message_template: string) => Promise<void>;
}

export function useCallAgents(): UseCallAgentsReturn {
  const [agents, setAgents] = useState<CallAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      console.error('[useCallAgents] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle enabled state with optimistic update
   */
  const toggleEnabled = useCallback(async (
    source_tool: string,
    enabled: boolean
  ): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Step 1: Capture snapshot for rollback
    const snapshot = [...agents];

    // Step 2: Optimistic update
    setAgents(prev => prev.map(agent =>
      agent.source_tool === source_tool
        ? { ...agent, enabled }
        : agent
    ));

    try {
      // Step 3: Send PATCH request
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

      // Step 4a: Success - refetch to get updated_at
      await fetchAgents();
    } catch (err) {
      // Step 4b: Failure - rollback
      setAgents(snapshot);
      throw err;
    }
  }, [agents, fetchAgents]);

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
    testCall,
    toggleEnabled,
    updateAgentId,
    updateTemplate,
  };
}
