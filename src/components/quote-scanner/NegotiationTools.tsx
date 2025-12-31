import { useState } from 'react';
import { Mail, Phone, Loader2, Copy, Check, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface NegotiationToolsProps {
  emailDraft: string | null;
  phoneScript: string | null;
  isDraftingEmail: boolean;
  isDraftingPhoneScript: boolean;
  onGenerateEmail: () => void;
  onGeneratePhoneScript: () => void;
  disabled: boolean;
}

export function NegotiationTools({
  emailDraft,
  phoneScript,
  isDraftingEmail,
  isDraftingPhoneScript,
  onGenerateEmail,
  onGeneratePhoneScript,
  disabled,
}: NegotiationToolsProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopy = async (text: string, type: 'email' | 'script') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
      }
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
      }
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Sparkles className="w-4 h-4" />
        <span>Negotiation Tools</span>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email Draft
          </TabsTrigger>
          <TabsTrigger value="phone" className="gap-2">
            <Phone className="w-4 h-4" />
            Phone Script
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-4 space-y-4">
          {!emailDraft ? (
            <Button
              onClick={onGenerateEmail}
              disabled={disabled || isDraftingEmail}
              className="w-full gap-2"
              variant="outline"
            >
              {isDraftingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Writing Email...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  ✨ Draft Negotiation Email
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Draft Email</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(emailDraft, 'email')}
                    className={cn(
                      "text-xs h-7 px-2",
                      copiedEmail && "text-emerald-400"
                    )}
                  >
                    {copiedEmail ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copiedEmail ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onGenerateEmail}
                    disabled={isDraftingEmail}
                    className="text-xs h-7 px-2"
                  >
                    {isDraftingEmail ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 border p-4 text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto font-mono text-xs">
                {emailDraft}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="phone" className="mt-4 space-y-4">
          {!phoneScript ? (
            <Button
              onClick={onGeneratePhoneScript}
              disabled={disabled || isDraftingPhoneScript}
              className="w-full gap-2"
              variant="outline"
            >
              {isDraftingPhoneScript ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Writing Script...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  ✨ Generate Phone Script
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Phone Script</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(phoneScript, 'script')}
                    className={cn(
                      "text-xs h-7 px-2",
                      copiedScript && "text-emerald-400"
                    )}
                  >
                    {copiedScript ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copiedScript ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onGeneratePhoneScript}
                    disabled={isDraftingPhoneScript}
                    className="text-xs h-7 px-2"
                  >
                    {isDraftingPhoneScript ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 border p-4 text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                {phoneScript}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
