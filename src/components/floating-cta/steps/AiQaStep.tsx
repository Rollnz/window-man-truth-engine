import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ArrowRight, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fastAIRequest } from '@/lib/aiRequest';
import { trackEvent } from '@/lib/gtm';
import type { AiQaMode } from '@/lib/panelVariants';
import type { LocationPersonalization } from '@/hooks/useLocationPersonalization';
import type { SessionData } from '@/hooks/useSessionData';
import type { EstimateFormData } from '../EstimateSlidePanel';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiQaStepProps {
  mode: AiQaMode;
  initialMessage?: string;
  locationData: LocationPersonalization | null;
  sessionData: SessionData;
  formData: EstimateFormData;
  updateFormData: (updates: Partial<EstimateFormData>) => void;
  onRouteToForm: () => void;
  onRouteToCall: () => void;
  panelVariant: string;
}

const MAX_USER_MESSAGES = 5;

/**
 * Strip routing signals from AI responses. The AI may include
 * [ROUTE:form] or [ROUTE:call] markers to trigger routing CTA display.
 */
function parseRouteSignal(text: string): {
  cleanText: string;
  routeSignal: 'form' | 'call' | null;
} {
  let routeSignal: 'form' | 'call' | null = null;

  const cleaned = text
    .replace(/\[ROUTE:(form|call)\]/gi, (_, match) => {
      routeSignal = match.toLowerCase() as 'form' | 'call';
      return '';
    })
    .trim();

  return { cleanText: cleaned, routeSignal };
}

/**
 * AiQaStep - Lightweight streaming chat interface for the slide-over panel.
 *
 * Supports 5 modes: proof, diagnostic, savings, storm, concierge.
 * After MAX_USER_MESSAGES or a routing signal, shows routing CTAs.
 */
export function AiQaStep({
  mode,
  initialMessage,
  locationData,
  sessionData,
  formData,
  updateFormData,
  onRouteToForm,
  onRouteToCall,
  panelVariant,
}: AiQaStepProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showRouting, setShowRouting] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track step entry
  useEffect(() => {
    trackEvent('ai_qa_started', {
      panel_variant: panelVariant,
      ai_qa_mode: mode,
      has_location_data: !!locationData,
      initial_message: initialMessage || null,
    });
  }, [mode, panelVariant, locationData, initialMessage]);

  // Send a message to the AI
  const sendMessage = useCallback(
    async (userContent: string) => {
      if (isStreaming || !userContent.trim()) return;

      const newUserMsg: Message = { role: 'user', content: userContent.trim() };
      const updatedMessages = [...messages, newUserMsg];
      setMessages(updatedMessages);
      setInput('');
      setIsStreaming(true);

      const newCount = userMessageCount + 1;
      setUserMessageCount(newCount);

      trackEvent('ai_qa_message_sent', {
        panel_variant: panelVariant,
        message_index: newCount,
        ai_qa_mode: mode,
      });

      // Build request body
      const body = {
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        mode,
        locationData: locationData
          ? {
              county: locationData.county,
              city: locationData.city,
              state: locationData.stateCode,
              zip: locationData.zip,
              countyData: locationData.countyData,
            }
          : null,
        sessionContext: {
          windowCount: sessionData.windowCount || formData.windowCount,
          windowAge: sessionData.windowAge,
          homeSize: sessionData.homeSize,
          zipCode: sessionData.zipCode || formData.zip,
        },
      };

      try {
        const response = await fastAIRequest.sendStreamingRequest(
          'slide-over-chat',
          body,
          { timeoutMs: 20000 }
        );

        // Stream the response
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let fullText = '';

        // Add a placeholder assistant message
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;

          if (result.value) {
            const chunk = decoder.decode(result.value, { stream: true });
            // Parse SSE lines
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta =
                    parsed.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    fullText += delta;
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = {
                        role: 'assistant',
                        content: fullText,
                      };
                      return updated;
                    });
                  }
                } catch {
                  // Non-JSON line, ignore
                }
              }
            }
          }
        }

        // Parse routing signal from complete response
        const { cleanText, routeSignal } = parseRouteSignal(fullText);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: cleanText,
          };
          return updated;
        });

        if (routeSignal) {
          setShowRouting(true);
          trackEvent('ai_qa_routing_shown', {
            panel_variant: panelVariant,
            route_type: routeSignal,
            messages_exchanged: newCount,
          });
        }

        // Show routing after threshold
        if (newCount >= 3 && !showRouting) {
          setShowRouting(true);
          trackEvent('ai_qa_routing_shown', {
            panel_variant: panelVariant,
            route_type: 'threshold',
            messages_exchanged: newCount,
          });
        }
      } catch (err) {
        console.error('[AiQaStep] Streaming error:', err);
        setMessages((prev) => [
          ...prev.slice(0, -1), // Remove placeholder
          {
            role: 'assistant',
            content:
              "I'm having trouble connecting right now. Would you like to speak with an expert directly?",
          },
        ]);
        setShowRouting(true);
      } finally {
        setIsStreaming(false);
      }
    },
    [
      messages,
      isStreaming,
      userMessageCount,
      mode,
      locationData,
      sessionData,
      formData,
      panelVariant,
      showRouting,
    ]
  );

  // Send initial message on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (initialMessage) {
      sendMessage(initialMessage);
    } else {
      // Send a greeting prompt based on mode
      const greetings: Record<AiQaMode, string> = {
        proof: 'What kind of results have you seen for homeowners in my area?',
        diagnostic:
          'Can you give me a quick assessment of my window situation?',
        savings: 'How much could I save by upgrading my windows?',
        storm: 'How prepared is my home for the next hurricane?',
        concierge: 'Hi, I have some questions about impact windows.',
      };
      sendMessage(greetings[mode]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const atLimit = userMessageCount >= MAX_USER_MESSAGES;

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              )}
            >
              {msg.content || (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Routing CTAs */}
      {showRouting && (
        <div className="space-y-2 mb-4 wm-reveal">
          <p className="text-xs text-muted-foreground text-center">
            Ready to take the next step?
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                trackEvent('ai_qa_routed', {
                  panel_variant: panelVariant,
                  route_destination: 'form',
                  messages_exchanged: userMessageCount,
                });
                onRouteToForm();
              }}
              variant="cta"
              size="sm"
              className="flex-1"
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              Get Estimate
            </Button>
            <Button
              onClick={() => {
                trackEvent('ai_qa_routed', {
                  panel_variant: panelVariant,
                  route_destination: 'call',
                  messages_exchanged: userMessageCount,
                });
                onRouteToCall();
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Phone className="h-3 w-3 mr-1" />
              Call Now
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      {!atLimit ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isStreaming}
            className={cn(
              'flex-1 rounded-md border border-border bg-muted/30 px-3 py-2',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'disabled:opacity-50'
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !input.trim()}
            className="h-10 w-10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground mb-2">
            For a deeper conversation, connect with an expert.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                trackEvent('ai_qa_routed', {
                  panel_variant: panelVariant,
                  route_destination: 'form',
                  messages_exchanged: userMessageCount,
                });
                onRouteToForm();
              }}
              variant="cta"
              size="sm"
              className="flex-1"
            >
              Get Estimate
            </Button>
            <Button
              onClick={() => {
                trackEvent('ai_qa_routed', {
                  panel_variant: panelVariant,
                  route_destination: 'call',
                  messages_exchanged: userMessageCount,
                });
                onRouteToCall();
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Call Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
