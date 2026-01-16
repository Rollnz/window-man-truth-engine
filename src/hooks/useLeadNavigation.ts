import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseLeadNavigationReturn {
  previousLeadId: string | null;
  nextLeadId: string | null;
  currentIndex: number;
  totalLeads: number;
  goToPrevious: () => void;
  goToNext: () => void;
  isLoading: boolean;
}

export function useLeadNavigation(currentLeadId: string | undefined): UseLeadNavigationReturn {
  const navigate = useNavigate();

  // Fetch ordered lead IDs
  const { data: leadIds = [], isLoading } = useQuery({
    queryKey: ['lead-navigation-ids'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return [];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-leads`,
        {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      // Return just IDs in order (by engagement_score desc, then created_at desc)
      return (data.leads || []).map((l: { id: string }) => l.id);
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  const currentIndex = useMemo(() => {
    if (!currentLeadId) return -1;
    return leadIds.indexOf(currentLeadId);
  }, [leadIds, currentLeadId]);

  const previousLeadId = currentIndex > 0 ? leadIds[currentIndex - 1] : null;
  const nextLeadId = currentIndex < leadIds.length - 1 ? leadIds[currentIndex + 1] : null;

  const goToPrevious = useCallback(() => {
    if (previousLeadId) {
      navigate(`/admin/leads/${previousLeadId}`);
    }
  }, [previousLeadId, navigate]);

  const goToNext = useCallback(() => {
    if (nextLeadId) {
      navigate(`/admin/leads/${nextLeadId}`);
    }
  }, [nextLeadId, navigate]);

  // Keyboard listener for arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if focused on an input
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'ArrowLeft' && previousLeadId) {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight' && nextLeadId) {
        e.preventDefault();
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [previousLeadId, nextLeadId, goToPrevious, goToNext]);

  return {
    previousLeadId,
    nextLeadId,
    currentIndex,
    totalLeads: leadIds.length,
    goToPrevious,
    goToNext,
    isLoading,
  };
}
