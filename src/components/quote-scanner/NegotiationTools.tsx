import { Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function NegotiationTools() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Sparkles className="w-4 h-4" />
        <span>Negotiation Tools</span>
      </div>

      <div className="text-center space-y-4 py-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Need Help Negotiating?</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Get personalized advice from our AI expert on how to negotiate your quote and save money.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/expert">
            <MessageSquare className="w-4 h-4" />
            Chat with our AI Expert
          </Link>
        </Button>
      </div>
    </div>
  );
}
