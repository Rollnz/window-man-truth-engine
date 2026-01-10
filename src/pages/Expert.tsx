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
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';
import { ErrorBoundary } from '@/components/error';
import type { SourceTool } from '@/types/sourceTool';
import { AIErrorFallback, getAIErrorType } from '@/components/error';
import { fastAIRequest, AI_TIMEOUTS } from '@/lib/aiRequest';
import { TimeoutError, getErrorMessage } from '@/lib/errors';

import { WhyUseSection } from '@/components/expert/WhyUseSection';
import { TimelineSection } from '@/components/expert/TimelineSection';
import { TrustSection } from '@/components/expert/TrustSection';
import { FinalCTASection } from '@/components/expert/FinalCTASection';

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
  const chatSectionRef = useRef<HTMLDivElement>(null);
  
  // Conversion state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [isSaved, setIsSaved] = useState(!!sessionData.leadId);

  // Auto-scroll chat area to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const scrollToChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* Section 1: Chat Interface (Hero) */}
      <section ref={chatSectionRef} className="min-h-[80vh] flex flex-col">
        <ErrorBoundary
          title="Expert Chat Error"
          description="We encountered an issue with the AI expert. Please refresh to try again."
          onReset={() => window.location.reload()}
        >
          <div className="flex-1 flex flex-col container mx-auto max-w-3xl px-4 mt-[120px]">
            {/* Title Section */}
            <div className="p-4 sm:p-6 text-center border-b border-border/50">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Window Questions <span className="text-primary">Expert</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Windows are a high-stakes investment. Don't rely on a salesperson. 
                Use this Expert System to uncover hidden costs, validate quotes, 
                and get the unbiased truth before you sign.
              </p>
            </div>

            {/* Error State */}
            {chatError && !isLoading && (
              <div className="px-4 pt-4">
                <AIErrorFallback
                  errorType={getAIErrorType(chatError)}
                  message={chatError}
                  onRetry={() => setChatError(null)}
                  compact
                />
              </div>
            )}

            {/* Chat Area - Fixed height with internal scroll */}
            <div className="flex-1 min-h-[300px] max-h-[400px] overflow-hidden">
              <ScrollArea className="h-full p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="py-4">
                      <SuggestedQuestions
                        onSelect={sendMessage}
                        disabled={isLoading}
                      />
                    </div>
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
            </div>

            {/* Input Area */}
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
            />
          </div>
        </ErrorBoundary>
      </section>

      {/* Section A: Why Use This Tool */}
      <WhyUseSection />

      {/* Section B: Golden Window Timeline */}
      <TimelineSection />

      {/* Section C: Trust / What Powers This */}
      <TrustSection />

      {/* Section D: Final CTA */}
      <FinalCTASection onScrollToTop={scrollToChat} />

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

      {/* Minimal Footer */}
      <MinimalFooter />
    </div>
  );
}
