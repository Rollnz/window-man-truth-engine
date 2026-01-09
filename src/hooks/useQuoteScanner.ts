import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSessionData } from '@/hooks/useSessionData';

export interface QuoteAnalysisResult {
  overallScore: number;
  safetyScore: number;
  scopeScore: number;
  priceScore: number;
  finePrintScore: number;
  warrantyScore: number;
  pricePerOpening: string;
  warnings: string[];
  missingItems: string[];
  summary: string;
  analyzedAt?: string;
}

interface UseQuoteScannerReturn {
  // State
  isAnalyzing: boolean;
  isDraftingEmail: boolean;
  isDraftingPhoneScript: boolean;
  isAskingQuestion: boolean;
  analysisResult: QuoteAnalysisResult | null;
  emailDraft: string | null;
  phoneScript: string | null;
  qaAnswer: string | null;
  imageBase64: string | null;
  mimeType: string | null;
  error: string | null;
  
  // Actions
  analyzeQuote: (file: File, openingCount?: number, areaName?: string) => Promise<void>;
  generateEmailDraft: () => Promise<void>;
  generatePhoneScript: () => Promise<void>;
  askQuestion: (question: string) => Promise<void>;
  resetScanner: () => void;
}

// Compress image if too large (target ~4MB for safe base64 encoding)
async function compressImage(file: File, maxBytes = 4_000_000): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      
      // If already small enough, return as-is
      if (base64.length < maxBytes) {
        resolve({ base64, mimeType: file.type });
        return;
      }

      // If it's a PDF, we can't compress - just return it
      if (file.type === 'application/pdf') {
        if (base64.length > 6_000_000) {
          reject(new Error('PDF is too large. Please upload a smaller file (max 5MB).'));
          return;
        }
        resolve({ base64, mimeType: file.type });
        return;
      }

      // Compress image using canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Scale down if very large
        const maxDim = 2000;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try JPEG at 80% quality
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        const compressedBase64 = compressed.split(',')[1];
        
        resolve({ base64: compressedBase64, mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function useQuoteScanner(): UseQuoteScannerReturn {
  const { toast } = useToast();
  const { sessionData, updateField } = useSessionData();
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QuoteAnalysisResult | null>(
    sessionData.quoteAnalysisResult || null
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Email draft state
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState<string | null>(
    sessionData.quoteDraftEmail || null
  );
  
  // Phone script state
  const [isDraftingPhoneScript, setIsDraftingPhoneScript] = useState(false);
  const [phoneScript, setPhoneScript] = useState<string | null>(
    sessionData.quotePhoneScript || null
  );
  
  // Q&A state
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);

  const analyzeQuote = useCallback(async (file: File, openingCount?: number, areaName?: string) => {
    setIsAnalyzing(true);
    setError(null);
    setEmailDraft(null);
    setPhoneScript(null);
    setQaAnswer(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      // Compress/prepare image
      const { base64, mimeType: mt } = await compressImage(file);
      setImageBase64(base64);
      setMimeType(mt);
      
      // Call edge function with abort signal
      const { data, error: fnError } = await supabase.functions.invoke('quote-scanner', {
        body: {
          mode: 'analyze',
          imageBase64: base64,
          mimeType: mt,
          openingCount: openingCount || sessionData.windowCount,
          areaName: areaName || 'Florida',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (fnError) throw fnError;
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Add timestamp and save
      const resultWithTimestamp: QuoteAnalysisResult = {
        ...data,
        analyzedAt: new Date().toISOString(),
      };
      
      setAnalysisResult(resultWithTimestamp);
      updateField('quoteAnalysisResult', resultWithTimestamp);
      
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Quote analysis error:', err);
      
      let message = 'Analysis failed. Please try again.';
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message.includes('abort')) {
          message = 'Request timed out. Please try again.';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      toast({
        title: message.includes('timed out') ? 'Request Timed Out' : 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionData.windowCount, updateField, toast]);

  const generateEmailDraft = useCallback(async () => {
    if (!analysisResult) return;
    
    setIsDraftingEmail(true);
    setError(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('quote-scanner', {
        body: {
          mode: 'email',
          analysisContext: analysisResult,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (fnError) throw fnError;
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setEmailDraft(data.content);
      updateField('quoteDraftEmail', data.content);
      
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Email draft error:', err);
      
      let message = 'Failed to generate email. Please try again.';
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message.includes('abort')) {
          message = 'Request timed out. Please try again.';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      toast({
        title: message.includes('timed out') ? 'Request Timed Out' : 'Email Draft Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDraftingEmail(false);
    }
  }, [analysisResult, updateField, toast]);

  const generatePhoneScript = useCallback(async () => {
    if (!analysisResult) return;
    
    setIsDraftingPhoneScript(true);
    setError(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('quote-scanner', {
        body: {
          mode: 'phoneScript',
          analysisContext: analysisResult,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (fnError) throw fnError;
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPhoneScript(data.content);
      updateField('quotePhoneScript', data.content);
      
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Phone script error:', err);
      
      let message = 'Failed to generate script. Please try again.';
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message.includes('abort')) {
          message = 'Request timed out. Please try again.';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      toast({
        title: message.includes('timed out') ? 'Request Timed Out' : 'Phone Script Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDraftingPhoneScript(false);
    }
  }, [analysisResult, updateField, toast]);

  const askQuestion = useCallback(async (question: string) => {
    if (!analysisResult || !question.trim()) return;
    
    setIsAskingQuestion(true);
    setError(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('quote-scanner', {
        body: {
          mode: 'question',
          question,
          analysisContext: analysisResult,
          imageBase64,
          mimeType,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (fnError) throw fnError;
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setQaAnswer(data.content);
      
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Q&A error:', err);
      
      let message = 'Failed to answer question. Please try again.';
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message.includes('abort')) {
          message = 'Request timed out. Please try again.';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      toast({
        title: message.includes('timed out') ? 'Request Timed Out' : 'Question Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsAskingQuestion(false);
    }
  }, [analysisResult, imageBase64, mimeType, toast]);

  const resetScanner = useCallback(() => {
    setAnalysisResult(null);
    setImageBase64(null);
    setMimeType(null);
    setEmailDraft(null);
    setPhoneScript(null);
    setQaAnswer(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    isDraftingEmail,
    isDraftingPhoneScript,
    isAskingQuestion,
    analysisResult,
    emailDraft,
    phoneScript,
    qaAnswer,
    imageBase64,
    mimeType,
    error,
    analyzeQuote,
    generateEmailDraft,
    generatePhoneScript,
    askQuestion,
    resetScanner,
  };
}
