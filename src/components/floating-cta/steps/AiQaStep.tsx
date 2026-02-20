import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ArrowRight, Phone, Loader2, Shield, Search, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fastAIRequest } from '@/lib/aiRequest';
import { wmRetarget } from '@/lib/wmTracking';
import type { AiQaMode } from '@/lib/panelVariants';
import type { LocationPersonalization } from '@/hooks/useLocationPersonalization';
import type { SessionData } from '@/hooks/useSessionData';
import type { EstimateFormData } from '../EstimateSlidePanel';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface WmAction {
  type: 'navigate';
  route: string;
  label: string;
  verdict?: 'protected' | 'inspect' | 'breach';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: WmAction[];
  verdict?: 'protected' | 'inspect' | 'breach';
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

// ═══════════════════════════════════════════════════════════════════
// Constants & Helpers
// ═══════════════════════════════════════════════════════════════════

const MAX_USER_MESSAGES = 5;

/** Strict 3-tool allowlist */
const ALLOWED_ROUTES: Record<string, string> = {
  '/ai-scanner': 'Scan My Quote',
  '/beat-your-quote': 'Beat Your Quote',
  '/fair-price-quiz': 'Is My Price Fair?',
};

/**
 * Parse <wm_actions>...</wm_actions> from AI response.
 * Returns cleaned text, validated actions, and optional verdict.
 */
function parseWmActions(text: string): {
  cleanText: string;
  actions: WmAction[];
  verdict: 'protected' | 'inspect' | 'breach' | null;
} {
  let actions: WmAction[] = [];
  let verdict: 'protected' | 'inspect' | 'breach' | null = null;

  const cleaned = text
    .replace(/<wm_actions>\s*([\s\S]*?)\s*<\/wm_actions>/gi, (_, jsonStr) => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          // Filter to allowlisted routes only, max 2
          const valid = parsed
            .filter(
              (a: any) =>
                a?.type === 'navigate' &&
                typeof a.route === 'string' &&
                ALLOWED_ROUTES[a.route]
            )
            .slice(0, 2)
            .map((a: any) => ({
              type: 'navigate' as const,
              route: a.route,
              label: typeof a.label === 'string' ? a.label : ALLOWED_ROUTES[a.route],
              verdict: ['protected', 'inspect', 'breach'].includes(a.verdict)
                ? a.verdict
                : undefined,
            }));
          actions = valid;

          // Extract verdict from first action that has one
          const first = valid.find((a: WmAction) => a.verdict);
          if (first) verdict = first.verdict!;
        }
      } catch {
        // Malformed JSON — fail silently
      }
      return '';
    })
    .trim();

  return { cleanText: cleaned, actions, verdict };
}

/**
 * Strip [ROUTE:form] / [ROUTE:call] routing signals from AI responses.
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

// ═══════════════════════════════════════════════════════════════════
// Verdict Badge Component
// ═══════════════════════════════════════════════════════════════════

function VerdictBadge({ verdict }: { verdict: 'protected' | 'inspect' | 'breach' }) {
  const config = {
    protected: {
      icon: Shield,
      label: 'Protected',
      className: 'text-green-600 bg-green-50 border-green-200',
    },
    inspect: {
      icon: Search,
      label: 'Needs Inspection',
      className: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    breach: {
      icon: AlertTriangle,
      label: 'Red Flags',
      className: 'text-red-600 bg-red-50 border-red-200',
    },
  };

  const { icon: Icon, label, className } = config[verdict];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Soft Gate Component (compact micro-commitment CTA)
// ═══════════════════════════════════════════════════════════════════

function SoftGateCTA({
  verdict,
  mode,
  onAccept,
  onDismiss,
  countyName,
}: {
  verdict: 'protected' | 'inspect' | 'breach' | null;
  mode: AiQaMode;
  onAccept: () => void;
  onDismiss: () => void;
  countyName?: string;
}) {
  // Fire shown event on mount
  useEffect(() => {
    wmRetarget('ai_micro_commit_shown', {
      source_tool: 'slide-over-chat',
      verdict: verdict || undefined,
      mode,
    });
  }, [verdict, mode]);

  return (
    <div className="space-y-1.5 mb-3">
      {/* Single-line copy with shield icon */}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span>Window Man flagged key findings. Save this Truth Report to your vault?</span>
      </p>

      {/* Primary CTA — full width, compact */}
      <Button
        onClick={() => {
          wmRetarget('ai_micro_commit_accepted', {
            source_tool: 'slide-over-chat',
            source: 'soft_gate',
            mode,
          });
          onAccept();
        }}
        variant="cta"
        size="sm"
        className="w-full py-2 text-xs"
      >
        <Shield className="h-3 w-3 mr-1" />
        Save My Analysis
      </Button>

      {/* Dismiss link — ghost text */}
      <button
        onClick={onDismiss}
        className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors py-0.5"
      >
        I'll do it later
      </button>

      {/* Social proof micro-copy */}
      {countyName && (
        <p className="text-[10px] text-muted-foreground/70 text-center">
          🛡️ Homeowners in {countyName} saved their truth report today
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

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
  const [showSoftGate, setShowSoftGate] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);
  const deepEngagementFired = useRef(false);
  const navigate = useNavigate();

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track step entry
  useEffect(() => {
    wmRetarget('ai_chat_opened', {
      source_tool: 'slide-over-chat',
      mode,
      panel_variant: panelVariant,
    });
  }, [mode, panelVariant]);

  // Dismiss keyboard when soft gate appears
  useEffect(() => {
    if (showSoftGate) {
      inputRef.current?.blur();
    }
  }, [showSoftGate]);

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

      wmRetarget('ai_message_sent', {
        source_tool: 'slide-over-chat',
        mode,
        message_index: newCount,
      });

      // Fire deep engagement once at 3rd message
      if (newCount === 3 && !deepEngagementFired.current) {
        deepEngagementFired.current = true;
        wmRetarget('ai_deep_engagement', {
          source_tool: 'slide-over-chat',
          mode,
          messages_exchanged: newCount,
        });
      }

      // Build truthContext
      const truthContext = {
        mode,
        county: locationData?.county,
        city: locationData?.city,
        state: locationData?.stateCode,
        zip: locationData?.zip,
        windowCount: sessionData.windowCount || formData.windowCount,
        windowAge: sessionData.windowAge,
        homeSize: sessionData.homeSize,
        zipCode: sessionData.zipCode || formData.zip,
        completedTools: [] as string[],
      };

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
        truthContext,
      };

      try {
        const response = await fastAIRequest.sendStreamingRequest(
          'slide-over-chat',
          body,
          { timeoutMs: 20000 }
        );

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let fullText = '';

        // Add placeholder assistant message
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;

          if (result.value) {
            const chunk = decoder.decode(result.value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content || '';
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

        // ── Post-stream parsing ──

        // 1. Parse wm_actions
        const { cleanText: afterActions, actions, verdict } = parseWmActions(fullText);

        // 2. Parse legacy route signals
        const { cleanText, routeSignal } = parseRouteSignal(afterActions);

        // Update final message with clean text + parsed actions
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: cleanText,
            actions: actions.length > 0 ? actions : undefined,
            verdict: verdict || undefined,
          };
          return updated;
        });

        // Track answer received
        wmRetarget('ai_answer_received', {
          source_tool: 'slide-over-chat',
          mode,
          message_index: newCount,
          has_actions: actions.length > 0,
          verdict: verdict || undefined,
        });

        if (routeSignal) {
          setShowRouting(true);
        }

        // Show routing after threshold
        if (newCount >= 3 && !showRouting) {
          setShowRouting(true);
        }

        // Trigger soft gate when verdict or actions present
        if ((verdict || actions.length > 0) && !showSoftGate) {
          setShowSoftGate(true);
        }
      } catch (err) {
        console.error('[AiQaStep] Streaming error:', err);
        setMessages((prev) => [
          ...prev.slice(0, -1),
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
      showSoftGate,
    ]
  );

  // Send initial message on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (initialMessage) {
      sendMessage(initialMessage);
    } else {
      const greetings: Record<AiQaMode, string> = {
        proof: 'What kind of results have you seen for homeowners in my area?',
        diagnostic: 'Can you give me a quick assessment of my window situation?',
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

  const handleActionClick = (action: WmAction) => {
    // Build URL params from truthContext for pre-fill
    const params = new URLSearchParams();
    const wc = sessionData.windowCount || formData.windowCount;
    const zip = sessionData.zipCode || formData.zip;
    const lastVerdictMsg = [...messages].reverse().find((m) => m.verdict);
    const lastVerdict = lastVerdictMsg?.verdict;

    if (wc) params.set('count', String(wc));
    if (zip) params.set('zip', zip);
    if (lastVerdict) params.set('verdict', lastVerdict);
    params.set('ref', 'wm_chat');

    const paramString = params.toString();
    const targetUrl = paramString ? `${action.route}?${paramString}` : action.route;

    wmRetarget('ai_action_clicked', {
      source_tool: 'slide-over-chat',
      mode,
      action_route: action.route,
    });

    // Fire context passed event
    wmRetarget('ai_context_passed', {
      source_tool: 'slide-over-chat',
      target_route: action.route,
      param_count: params.size,
    });

    navigate(targetUrl);
  };

  const atLimit = userMessageCount >= MAX_USER_MESSAGES;

  // Get the last verdict from messages for the soft gate
  const lastVerdict = [...messages].reverse().find((m) => m.verdict)?.verdict || null;

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i}>
            <div
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

            {/* Verdict badge + Action buttons — stacked full-width for mobile */}
            {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
              <div className="mt-2 ml-0 space-y-2">
                {msg.verdict && <VerdictBadge verdict={msg.verdict} />}
                <div className="flex flex-col gap-1.5">
                  {msg.actions.map((action, ai) => (
                    <Button
                      key={ai}
                      onClick={() => handleActionClick(action)}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs py-1.5 justify-start"
                    >
                      <ArrowRight className="h-3 w-3 mr-1 flex-shrink-0" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Soft Gate CTA — replaces routing when active */}
      {showSoftGate && showRouting ? (
        <SoftGateCTA
          verdict={lastVerdict}
          mode={mode}
          onAccept={() => {
            onRouteToForm();
          }}
          onDismiss={() => setShowSoftGate(false)}
          countyName={locationData?.county}
        />
      ) : showRouting ? (
        /* Standard Routing CTAs (only when soft gate is dismissed or not triggered) */
        <div className="space-y-2 mb-4">
          <p className="text-xs text-muted-foreground text-center">
            Ready to take the next step?
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                wmRetarget('ai_action_clicked', {
                  source_tool: 'slide-over-chat',
                  action_route: 'form',
                  mode,
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
                wmRetarget('ai_action_clicked', {
                  source_tool: 'slide-over-chat',
                  action_route: 'call',
                  mode,
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
      ) : null}

      {/* Input area */}
      {!atLimit ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Window Man..."
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
                wmRetarget('ai_action_clicked', {
                  source_tool: 'slide-over-chat',
                  action_route: 'form',
                  mode,
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
                wmRetarget('ai_action_clicked', {
                  source_tool: 'slide-over-chat',
                  action_route: 'call',
                  mode,
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
