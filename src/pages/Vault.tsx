import { useSessionData } from '@/hooks/useSessionData';
import { useAuth } from '@/hooks/useAuth';
import { usePageTracking } from '@/hooks/usePageTracking';
import { ToolProgressTracker } from '@/components/vault/ToolProgressTracker';
import { MyResultsSection } from '@/components/vault/MyResultsSection';
import { MyDocumentsSection } from '@/components/vault/MyDocumentsSection';
import { MyChecklistsSection } from '@/components/vault/MyChecklistsSection';
import { EmailResultsButton } from '@/components/vault/EmailResultsButton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  TrendingDown,
  Brain,
  MessageSquare,
  GitCompare,
  Shield,
  Zap,
  FileSearch,
  BookOpen,
  ShieldCheck,
  ArrowLeft,
  Vault as VaultIcon,
  LogOut
} from 'lucide-react';

const tools = [
  { id: 'reality-check', name: 'Reality Check', path: '/reality-check', icon: <AlertTriangle className="w-5 h-5" /> },
  { id: 'cost-calculator', name: 'Cost Calculator', path: '/cost-calculator', icon: <TrendingDown className="w-5 h-5" /> },
  { id: 'vulnerability-test', name: 'Window IQ', path: '/vulnerability-test', icon: <Brain className="w-5 h-5" /> },
  { id: 'expert', name: 'AI Expert', path: '/expert', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'comparison', name: 'Compare Quotes', path: '/comparison', icon: <GitCompare className="w-5 h-5" /> },
  { id: 'risk-diagnostic', name: 'Risk Diagnostic', path: '/risk-diagnostic', icon: <Shield className="w-5 h-5" /> },
  { id: 'fast-win', name: 'Fast Win', path: '/fast-win', icon: <Zap className="w-5 h-5" /> },
  { id: 'evidence', name: 'Evidence Locker', path: '/evidence', icon: <FileSearch className="w-5 h-5" /> },
  { id: 'intel', name: 'Intel Library', path: '/intel', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'claim-survival', name: 'Claim Vault', path: '/claim-survival', icon: <ShieldCheck className="w-5 h-5" /> }
];

export default function Vault() {
  usePageTracking('vault');
  const { sessionData, isToolCompleted } = useSessionData();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const toolsWithCompletion = tools.map(tool => ({
    ...tool,
    completed: isToolCompleted(tool.id)
  }));

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <VaultIcon className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">My Vault</span>
            </div>
            <EmailResultsButton sessionData={sessionData} userEmail={user?.email} />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Your Protection Dashboard
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track your progress, view your assessment results, and manage your claim-ready documents all in one place.
          </p>
        </div>

        {/* Progress Tracker */}
        <ToolProgressTracker tools={toolsWithCompletion} />

        {/* Three Sections */}
        <div className="grid gap-8">
          <MyResultsSection sessionData={sessionData} />
          <MyDocumentsSection sessionData={sessionData} />
          <MyChecklistsSection sessionData={sessionData} />
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-8 border-t border-border">
          <p className="text-muted-foreground mb-4">
            Ready to get expert guidance on your specific situation?
          </p>
          <Button variant="high-contrast" size="lg" asChild>
            <Link to="/expert">
              <MessageSquare className="w-5 h-5 mr-2" />
              Talk to Windowman AI
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
