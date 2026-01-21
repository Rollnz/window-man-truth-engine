import { useState, useEffect } from 'react';
import { useSessionData } from '@/hooks/useSessionData';
import { useAuth } from '@/hooks/useAuth';
import { usePageTracking } from '@/hooks/usePageTracking';
import { ToolProgressTracker } from '@/components/vault/ToolProgressTracker';
import { MyResultsSection } from '@/components/vault/MyResultsSection';
import { MyDocumentsSection } from '@/components/vault/MyDocumentsSection';
import { MyChecklistsSection } from '@/components/vault/MyChecklistsSection';
import { EmailResultsButton } from '@/components/vault/EmailResultsButton';
import { VaultWelcomeCard } from '@/components/vault/VaultWelcomeCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@/config/navigation';
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
  { id: 'reality-check', name: 'Reality Check', path: ROUTES.REALITY_CHECK, icon: <AlertTriangle className="w-5 h-5 text-yellow-500" /> },
  { id: 'cost-calculator', name: 'Cost Calculator', path: ROUTES.COST_CALCULATOR, icon: <TrendingDown className="w-5 h-5 text-emerald-500" /> },
  { id: 'vulnerability-test', name: 'Window IQ', path: ROUTES.VULNERABILITY_TEST, icon: <Brain className="w-5 h-5 text-purple-500" /> },
  { id: 'expert', name: 'AI Expert', path: ROUTES.EXPERT, icon: <MessageSquare className="w-5 h-5 text-sky-500" /> },
  { id: 'comparison', name: 'Compare Quotes', path: ROUTES.COMPARISON, icon: <GitCompare className="w-5 h-5 text-cyan-500" /> },
  { id: 'risk-diagnostic', name: 'Risk Diagnostic', path: ROUTES.RISK_DIAGNOSTIC, icon: <Shield className="w-5 h-5 text-orange-500" /> },
  { id: 'fast-win', name: 'Fast Win', path: ROUTES.FAST_WIN, icon: <Zap className="w-5 h-5 text-amber-500" /> },
  { id: 'evidence', name: 'Evidence Locker', path: ROUTES.EVIDENCE, icon: <FileSearch className="w-5 h-5 text-amber-700" /> },
  { id: 'intel', name: 'Intel Library', path: ROUTES.INTEL, icon: <BookOpen className="w-5 h-5 text-indigo-500" /> },
  { id: 'claim-survival', name: 'Claim Vault', path: ROUTES.CLAIM_SURVIVAL, icon: <ShieldCheck className="w-5 h-5 text-green-500" /> }
];

export default function Vault() {
  usePageTracking('vault');
  const { sessionData, isToolCompleted, updateFields } = useSessionData();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [showWelcome, setShowWelcome] = useState(false);

  // Check for pending Vault sync (from Fair Price Quiz)
  useEffect(() => {
    if (sessionData.vaultSyncPending && sessionData.fairPriceQuizResults) {
      setShowWelcome(true);
      // Clear the pending flag after showing welcome
      updateFields({ vaultSyncPending: false });
    }
  }, [sessionData.vaultSyncPending, sessionData.fairPriceQuizResults, updateFields]);

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

  const handleDismissWelcome = () => {
    setShowWelcome(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to={ROUTES.HOME}>
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
        {/* Welcome Card (for Fair Price Quiz users) */}
        {showWelcome && sessionData.fairPriceQuizResults ? (
          <VaultWelcomeCard
            results={sessionData.fairPriceQuizResults}
            userName={sessionData.name || ''}
            onDismiss={handleDismissWelcome}
          />
        ) : (
          /* Standard Hero */
          <div className="text-center mb-8">
            <h1 className="display-h1 text-lift text-3xl md:text-4xl font-bold text-foreground mb-2">
              Your Protection Dashboard
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track your progress, view your assessment results, and manage your claim-ready documents all in one place.
            </p>
          </div>
        )}

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
            <Link to={ROUTES.EXPERT}>
              <MessageSquare className="w-5 h-5 mr-2" />
              Talk to Windowman AI
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
