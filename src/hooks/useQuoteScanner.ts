import { useState, useCallback, useRef } from 'react';
import { heavyAIRequest } from '@/lib/aiRequest';
import { getErrorMessage, isRateLimitError } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useTrackToolCompletion } from '@/hooks/useTrackToolCompletion';
import { logScannerCompleted } from '@/lib/highValueSignals';
import { trackScannerUpload } from '@/lib/tracking/scannerUpload';
import { trackQuoteUploadSuccess } from '@/lib/gtm';
import { useCanonicalScore } from '@/hooks/useCanonicalScore';
import { ForensicSummary, ExtractedIdentity } from '@/types/audit';

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
  // Forensic Authority Fields (Hybrid Rubric)
  forensic?: ForensicSummary;
  extractedIdentity?: ExtractedIdentity;
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
  const { sessionData, sessionId, updateField } = useSessionData();
  const { leadId } = useLeadIdentity();
  const { trackToolComplete } = useTrackToolCompletion();
  const { awardScore } = useCanonicalScore();
  
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

  // Generate a unique scan attempt ID per analyzeQuote call for deduplication
  const scanAttemptIdRef = useRef<string>('');

  const analyzeQuote = useCallback(async (file: File, openingCount?: number, areaName?: string) => {
    // Generate new scan attempt ID for this analysis run
    const scanAttemptId = crypto.randomUUID();
    scanAttemptIdRef.current = scanAttemptId;

    setIsAnalyzing(true);
    setError(null);
    setEmailDraft(null);
    setPhoneScript(null);
    setQaAnswer(null);
    
    try {
      // Compress/prepare image
      const { base64, mimeType: mt } = await compressImage(file);
      setImageBase64(base64);
      setMimeType(mt);

      // 🎯 FIRE ScannerUpload dataLayer event IMMEDIATELY after upload accepted, before AI call
      trackScannerUpload({
        scanAttemptId,
        sourceTool: 'quote-scanner',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        leadId: leadId || undefined,
        sessionId,
      });
      
      const { data, error: requestError } = await heavyAIRequest.sendRequest<QuoteAnalysisResult & { error?: string }>(
        'quote-scanner',
        {
          mode: 'analyze',
          imageBase64: base64,
          mimeType: mt,
          openingCount: openingCount || sessionData.windowCount,
          areaName: areaName || 'Florida',
          // Golden Thread: Pass sessionId and leadId for attribution tracking
          sessionId,
          leadId: leadId || undefined,
        }
      );
      
      if (requestError) throw requestError;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      // Add timestamp and save
      const resultWithTimestamp: QuoteAnalysisResult = {
        ...data!,
        analyzedAt: new Date().toISOString(),
      };
      
      setAnalysisResult(resultWithTimestamp);
      updateField('quoteAnalysisResult', resultWithTimestamp);
      
      // Track tool completion with delta value for value-based bidding
      trackToolComplete('quote-scanner', {
        score: resultWithTimestamp.overallScore,
        quote_amount: parseFloat(resultWithTimestamp.pricePerOpening.replace(/[^0-9.]/g, '')) || undefined,
      });
      
      // PHASE 4: Log high-value scanner_upload_completed signal to wm_event_log
      await logScannerCompleted({
        score: resultWithTimestamp.overallScore,
        quoteAmount: parseFloat(resultWithTimestamp.pricePerOpening.replace(/[^0-9.]/g, '')) || undefined,
        fileSize: file.size,
        fileType: file.type,
        leadId: leadId || undefined,
      });
      
      // TRUTH ENGINE v2: Award canonical score for quote upload
      // Uses scanAttemptId as unique entity ID for idempotency
      if (scanAttemptId) {
        await awardScore({
          eventType: 'QUOTE_UPLOADED',
          sourceEntityType: 'quote',
          sourceEntityId: scanAttemptId,
        });

        // GTM: Fire $50 conversion signal for Meta value-based bidding
        // Uses deterministic event_id: quote_uploaded:<scanAttemptId>
        // Must await to ensure GTM dispatch before any navigation/unmount
        await trackQuoteUploadSuccess({
          scanAttemptId,
          email: sessionData.email || undefined,
          phone: sessionData.phone || undefined,
          leadId: leadId || undefined,
          sourceTool: 'quote-scanner',
        });
      }
      
    } catch (err) {
      console.error('Quote analysis error:', err);
      
      const message = getErrorMessage(err);
      setError(message);
      
      toast({
        title: message.includes('timed out') ? 'Request Timed Out' : 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionData.windowCount, sessionId, leadId, updateField, toast, awardScore]);

  const generateEmailDraft = useCallback(async () => {
    if (!analysisResult) return;
    
    setIsDraftingEmail(true);
    setError(null);
    
    try {
      const { data, error: requestError } = await heavyAIRequest.sendRequest<{ content?: string; error?: string }>(
        'quote-scanner',
        {
          mode: 'email',
          analysisContext: analysisResult,
        }
      );
      
      if (requestError) throw requestError;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setEmailDraft(data?.content || null);
      updateField('quoteDraftEmail', data?.content);
      
    } catch (err) {
      console.error('Email draft error:', err);
      
      const message = getErrorMessage(err);
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
    
    try {
      const { data, error: requestError } = await heavyAIRequest.sendRequest<{ content?: string; error?: string }>(
        'quote-scanner',
        {
          mode: 'phoneScript',
          analysisContext: analysisResult,
        }
      );
      
      if (requestError) throw requestError;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setPhoneScript(data?.content || null);
      updateField('quotePhoneScript', data?.content);
      
    } catch (err) {
      console.error('Phone script error:', err);
      
      const message = getErrorMessage(err);
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
    
    try {
      const { data, error: requestError } = await heavyAIRequest.sendRequest<{ content?: string; error?: string }>(
        'quote-scanner',
        {
          mode: 'question',
          question,
          analysisContext: analysisResult,
          imageBase64,
          mimeType,
        }
      );
      
      if (requestError) throw requestError;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setQaAnswer(data?.content || null);
      
    } catch (err) {
      console.error('Q&A error:', err);
      
      const message = getErrorMessage(err);
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
