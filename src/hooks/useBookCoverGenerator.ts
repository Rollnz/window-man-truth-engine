import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IntelResource } from '@/data/intelData';
import { useToast } from '@/hooks/use-toast';

interface GeneratedCover {
  resource_id: string;
  image_url: string;
}

export function useBookCoverGenerator() {
  const [generatedCovers, setGeneratedCovers] = useState<Record<string, string>>({});
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const { toast } = useToast();

  // Load cached covers on mount
  useEffect(() => {
    async function loadCachedCovers() {
      try {
        const { data, error } = await supabase
          .from('generated_book_covers')
          .select('resource_id, image_url');

        if (error) {
          console.error('Error loading cached covers:', error);
          return;
        }

        const coverMap: Record<string, string> = {};
        (data as GeneratedCover[])?.forEach((cover) => {
          coverMap[cover.resource_id] = cover.image_url;
        });
        setGeneratedCovers(coverMap);
      } catch (err) {
        console.error('Failed to load cached covers:', err);
      } finally {
        setIsLoadingCache(false);
      }
    }

    loadCachedCovers();
  }, []);

  const generateCover = useCallback(async (
    resource: IntelResource,
    regenerate = false
  ): Promise<string | null> => {
    // Don't generate if already has a static image
    if (resource.bookImageUrl && !regenerate) {
      return resource.bookImageUrl;
    }

    // Check if already generating
    if (generatingIds.has(resource.id)) {
      return null;
    }

    // Check cache unless regenerating
    if (!regenerate && generatedCovers[resource.id]) {
      return generatedCovers[resource.id];
    }

    setGeneratingIds(prev => new Set(prev).add(resource.id));

    try {
      const response = await supabase.functions.invoke('generate-book-cover', {
        body: {
          resourceId: resource.id,
          title: resource.title,
          tagline: resource.tagline,
          category: resource.category,
          description: resource.description,
          regenerate,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { imageUrl, cached } = response.data;

      if (imageUrl) {
        setGeneratedCovers(prev => ({
          ...prev,
          [resource.id]: imageUrl,
        }));

        if (!cached) {
          toast({
            title: regenerate ? 'Cover Regenerated' : 'Cover Generated',
            description: `Book cover for "${resource.title}" is ready.`,
          });
        }

        return imageUrl;
      }

      return null;
    } catch (err) {
      console.error('Error generating cover:', err);
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'Failed to generate book cover.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(resource.id);
        return next;
      });
    }
  }, [generatedCovers, generatingIds, toast]);

  const getCoverUrl = useCallback((resource: IntelResource): string | undefined => {
    // Priority: static image > generated image
    if (resource.bookImageUrl) {
      return resource.bookImageUrl;
    }
    return generatedCovers[resource.id];
  }, [generatedCovers]);

  const needsGeneration = useCallback((resource: IntelResource): boolean => {
    // Has static image - no generation needed
    if (resource.bookImageUrl) {
      return false;
    }
    // Already has generated image
    if (generatedCovers[resource.id]) {
      return false;
    }
    return true;
  }, [generatedCovers]);

  const isGenerating = useCallback((resourceId: string): boolean => {
    return generatingIds.has(resourceId);
  }, [generatingIds]);

  return {
    generateCover,
    getCoverUrl,
    needsGeneration,
    isGenerating,
    isLoadingCache,
    generatedCovers,
  };
}
