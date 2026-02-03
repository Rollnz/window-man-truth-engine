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
  };
}
