import { useState, useRef, useEffect } from 'react';
import { ROUTES } from '@/config/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useSessionData } from '@/hooks/useSessionData';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Navbar } from '@/components/home/Navbar';
import { MinimalFooter } from '@/components/navigation/MinimalFooter';
import { ChatMessage } from '@/components/expert/ChatMessage';
import { ChatInput } from '@/components/expert/ChatInput';
import { SuggestedQuestions } from '@/components/expert/SuggestedQuestions';
import { ContextBanner } from '@/components/expert/ContextBanner';
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';
import { ErrorBoundary } from '@/components/error';
import type { SourceTool } from '@/types/sourceTool';
import { AIErrorFallback, getAIErrorType } from '@/components/error';
import { fastAIRequest, AI_TIMEOUTS } from '@/lib/aiRequest';
import { TimeoutError, getErrorMessage } from '@/lib/errors';
import { Bot, Save, Calendar, Check } from 'lucide-react';
import { getSmartRelatedTools, getFrameControl } from '@/config/toolRegistry';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Expert() {
  usePageTracking('expert-system');
  const { sessionData, markToolCompleted, updateFields } = useSessionData();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Conversion state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [isSaved, setIsSaved] = useState(!!sessionData.leadId);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (userMessage: string) => {
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setChatError(null);

    let assistantContent = '';

    try {
      // Use streaming request with 15s timeout
      const response = await fastAIRequest.sendStreamingRequest(
        'expert-chat',
        {
          messages: [...messages, userMsg],
          context: {
            costOfInactionTotal: sessionData.costOfInactionTotal,
            realityCheckScore: sessionData.realityCheckScore,
            windowAge: sessionData.windowAge,
            currentEnergyBill: sessionData.currentEnergyBill,
            homeSize: sessionData.homeSize,
            windowCount: sessionData.windowCount,
            draftinessLevel: sessionData.draftinessLevel,
            noiseLevel: sessionData.noiseLevel,
          },
        }
      );

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Mark tool as completed on first successful message
      if (messages.length === 0) {
        markToolCompleted('expert');
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = getErrorMessage(error);
      setChatError(errorMessage);
      toast({
        title: error instanceof TimeoutError ? 'Request Timed Out' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      // Remove the empty assistant message if there was an error
      if (assistantContent === '') {
        setMessages(prev => prev.filter(m => m.content !== ''));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasContext = sessionData.costOfInactionTotal || sessionData.realityCheckScore;

  const handleLeadCaptureSuccess = (leadId: string) => {
    updateFields({ leadId, email: sessionData.email });
    setIsSaved(true);
    setShowLeadModal(false);
  };

  const handleConsultationSuccess = () => {
    updateFields({ consultationRequested: true });
    setShowConsultationModal(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <ErrorBoundary
        title="Expert Chat Error"
        description="We encountered an issue with the AI expert. Please refresh to try again."
        onReset={() => window.location.reload()}
      >
        <div className="flex-1 flex flex-col overflow-hidden container mx-auto max-w-3xl px-4 pt-20 sm:pt-24 md:pt-32">
          {/* Hero Section - Bold CRO Messaging */}
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Stop Guessing. <span className="text-primary">Start Saving.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Windows are a high-stakes investment. Don't rely on a salesperson. Use this Expert System to uncover hidden costs, validate quotes, and get the unbiased truth before you sign.
            </p>
          </div>

          {/* Compact Context Banner */}
          {hasContext && (
            <div className="mb-3">
              <ContextBanner sessionData={sessionData} />
            </div>
          )}

          {/* Error State */}
          {chatError && !isLoading && (
            <div className="pb-2">
              <AIErrorFallback
                errorType={getAIErrorType(chatError)}
                message={chatError}
                onRetry={() => setChatError(null)}
                compact
              />
            </div>
          )}

          {/* Chat Area - Takes remaining space */}
          <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
            <div className="space-y-4 py-2">
              {messages.length === 0 ? (
                <SuggestedQuestions
                  sessionData={sessionData}
                  onSelect={sendMessage}
                  disabled={isLoading}
                />
              ) : (
                messages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    role={message.role}
                    content={message.content}
                    isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="py-2">
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </ErrorBoundary>

      {/* Modals */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={handleLeadCaptureSuccess}
        sourceTool={'expert-system' satisfies SourceTool}
        sessionData={sessionData}
        chatHistory={messages}
      />

      <ConsultationBookingModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        onSuccess={handleConsultationSuccess}
        leadId={sessionData.leadId}
        sessionData={sessionData}
      />

      {/* Related Tools */}
      <RelatedToolsGrid
        title={getFrameControl('expert').title}
        description={getFrameControl('expert').description}
        tools={getSmartRelatedTools('expert', sessionData.toolsCompleted)}
      />

      {/* Minimal Footer */}
      <MinimalFooter />
    </div>
  );
}
