import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useAuth } from '@/hooks/useAuth';
import { useSessionData } from '@/hooks/useSessionData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  Home,
  FileText,
  Bell,
  TrendingUp,
  Calendar,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  ArrowRight,
  Settings,
  LogOut,
  Sparkles,
  Activity,
  MessageSquare,
} from 'lucide-react';

export default function Vault() {
  usePageTracking('vault');
  const { user, signOut } = useAuth();
  const { sessionData, isToolCompleted } = useSessionData();
  const { toast } = useToast();
  const [protectionScore, setProtectionScore] = useState(65);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Calculate completion metrics
  const completedTools = [
    'reality-check',
    'cost-calculator',
    'risk-diagnostic',
  ].filter((tool) => isToolCompleted(tool)).length;

  const uploadedDocuments = 0; // TODO: Get from database
  const activeProjects = 1; // TODO: Get from database

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="border-b border-border/40 bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Home Vault</h1>
              <p className="text-xs text-muted-foreground">
                {user?.email || 'Your Secure Command Center'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome & Key Metrics */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome back,{' '}
                {user?.user_metadata?.full_name?.split(' ')[0] || 'Homeowner'}!
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Home className="w-4 h-4" />
                <span className="text-sm">123 Main Street, Boca Raton, FL 33432</span>
              </div>
            </div>

            <div className="hidden md:flex gap-4">
              <Card className="p-4 border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{protectionScore}%</p>
                    <p className="text-xs text-muted-foreground">Protection Score</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">$425K</p>
                    <p className="text-xs text-muted-foreground">Est. Home Value</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Tools Completed</span>
              </div>
              <p className="text-2xl font-bold">{completedTools}/10</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Documents</span>
              </div>
              <p className="text-2xl font-bold">{uploadedDocuments}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Insurance Renewal</span>
              </div>
              <p className="text-lg font-bold">42 days</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Active Warranties</span>
              </div>
              <p className="text-2xl font-bold">2</p>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline & Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alerts & Reminders */}
            <Card className="p-6 border-orange-500/20 bg-orange-500/5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Smart Alert</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your impact window warranty may cover the upcoming glass seal
                    inspection. Would you like to schedule a free assessment?
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                    <Button size="sm">Schedule Now</Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Home Health Timeline */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Home Health Timeline</h3>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>

              <div className="space-y-6">
                {/* Timeline Entry */}
                <div className="flex gap-4 pb-6 border-b border-border last:border-0 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div className="w-px h-full bg-border mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">Protection Score Calculated</h4>
                        <p className="text-xs text-muted-foreground">Just now</p>
                      </div>
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                        New
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Completed Risk Diagnostic assessment. Your home protection score
                      is 65% - Room for improvement identified.
                    </p>
                    <Button variant="outline" size="sm">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View Full Report
                    </Button>
                  </div>
                </div>

                {/* Example: Saved Tool Result */}
                <div className="flex gap-4 pb-6 border-b border-border last:border-0 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="w-px h-full bg-border mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">Reality Check Completed</h4>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Assessment revealed potential energy cost savings of $1,200/year
                      with window upgrades.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        View Results
                      </Button>
                      <Button variant="ghost" size="sm">
                        Share with Contractor
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Placeholder for more events */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Start using tools and uploading documents to build your home's
                      history.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Active Projects */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">My Active Projects</h3>
                <Button variant="outline" size="sm">
                  + New Project
                </Button>
              </div>

              {activeProjects > 0 ? (
                <div className="p-4 rounded-lg border border-border bg-muted/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">Impact Window Installation</h4>
                      <p className="text-sm text-muted-foreground">
                        Superior Windows - Quote Review
                      </p>
                    </div>
                    <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded-full">
                      In Review
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">25%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: '25%' }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Quote
                    </Button>
                    <Button size="sm" className="flex-1">
                      Request Review
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No active projects yet</p>
                  <Button variant="outline" asChild>
                    <Link to="/vault/upload?category=quotes">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your First Quote
                    </Link>
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* To-Do & Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Action Items</h3>

              <div className="space-y-3">
                <Link to="/vault/upload?category=insurance" className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">
                      Upload Insurance Policy
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recommended for claim readiness
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">
                      Complete Cost Calculator
                    </p>
                    <p className="text-xs text-muted-foreground">
                      See potential savings
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <MessageSquare className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">
                      Get Expert Quote Review
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Free analysis in 24hrs
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </div>
            </Card>

            {/* Insurance Snapshot */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Insurance</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">State Farm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Policy #</span>
                  <span className="font-medium">•••• 4567</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coverage</span>
                  <span className="font-medium">$425K</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Renewal</span>
                  <span className="font-medium text-orange-500">42 days</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <Button variant="outline" size="sm" className="w-full">
                  File a Claim
                </Button>
              </div>
            </Card>

            {/* Document Vault Quick Access */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Document Vault</h3>
              </div>

              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link to="/vault/documents/quotes">
                    <FileText className="w-4 h-4 mr-2" />
                    Quotes & Estimates ({uploadedDocuments})
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link to="/vault/documents/insurance">
                    <Shield className="w-4 h-4 mr-2" />
                    Insurance & Claims (0)
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link to="/vault/documents/warranties">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Warranties & Manuals (0)
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link to="/vault/documents/photos">
                    <Home className="w-4 h-4 mr-2" />
                    Property Photos (0)
                  </Link>
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <Button size="sm" className="w-full" asChild>
                  <Link to="/vault/upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Trust Badge */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-green-500" />
                <span className="text-xs font-semibold text-green-500">
                  BANK-LEVEL SECURITY
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your documents are encrypted with AES-256 encryption. Your data is
                never sold or shared without your permission.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
