import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/navigation';
import { AlertTriangle, Calculator, Brain, MessageSquare, GitCompare, Shield, ShieldCheck, Zap, FolderSearch, FileStack, ScanSearch } from 'lucide-react';
import { getToolIconColors } from '@/lib/toolIconColors';

interface Tool {
  id: string;
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  path: string;
  gated: boolean;
  badge?: string;
}

const tools: Tool[] = [{
  id: 'reality-check',
  title: 'Reality Check Tool',
  description: 'Confront the hidden costs your current windows are costing you.',
  cta: 'See What Cheap Windows Really Cost',
  icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
  path: ROUTES.REALITY_CHECK,
  gated: false
}, {
  id: 'cost-calculator',
  title: 'Cost of Inaction Calculator',
  description: 'Quantify exactly how much waiting is costing you every day.',
  cta: 'Calculate Your Hidden Costs',
  icon: <Calculator className="w-6 h-6 text-emerald-500" />,
  path: ROUTES.COST_CALCULATOR,
  gated: false
}, {
  id: 'quiz',
  title: 'Window IQ Challenge',
  description: '90% of Florida homeowners fail this test and overpay by $5,000+.',
  cta: 'Test Your Vulnerability',
  icon: <Brain className="w-6 h-6 text-purple-500" />,
  path: ROUTES.VULNERABILITY_TEST,
  gated: false
}, {
  id: 'expert-system',
  title: 'Expert System',
  description: 'Chat with our AI specialist for neutral, expert advice.',
  cta: 'Chat With the Window Specialist',
  icon: <MessageSquare className="w-6 h-6 text-sky-500" />,
  path: ROUTES.EXPERT,
  gated: false
}, {
  id: 'comparison',
  title: 'Comparison Tool',
  description: 'Compare cheap vs. quality window specs side-by-side.',
  cta: 'Compare Real Window Specs',
  icon: <GitCompare className="w-6 h-6 text-cyan-500" />,
  path: ROUTES.COMPARISON,
  gated: true
}, {
  id: 'risk-diagnostic',
  title: 'Protection Gap Analysis',
  description: 'Identify vulnerabilities and unlock potential insurance savings up to 20%.',
  cta: 'Analyze Your Protection Gaps',
  icon: <Shield className="w-6 h-6 text-orange-500" />,
  path: ROUTES.RISK_DIAGNOSTIC,
  gated: true
}, {
  id: 'claim-survival',
  title: 'Claim Survival Vault',
  description: 'The 7-point documentation system insurers expect. Prevent claim denials before they happen.',
  cta: 'Protect Your Claim',
  icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
  path: ROUTES.CLAIM_SURVIVAL,
  gated: true
}, {
  id: 'fast-win',
  title: 'Fast Win Detector',
  description: 'Find your highest-ROI upgrade in 45 seconds. No lecture, just results.',
  cta: 'Find My #1 Upgrade',
  icon: <Zap className="w-6 h-6 text-amber-500" />,
  path: ROUTES.FAST_WIN,
  gated: true
}, {
  id: 'evidence',
  title: 'Evidence Locker',
  description: 'Review verified case files from 47 completed missions.',
  cta: 'Review the Evidence',
  icon: <FolderSearch className="w-6 h-6 text-amber-700" />,
  path: ROUTES.EVIDENCE,
  gated: true
}, {
  id: 'intel-library',
  title: 'Intel Library',
  description: 'Download declassified guides: negotiation tactics, claim survival kits, and more.',
  cta: 'Access the Vault',
  icon: <FileStack className="w-6 h-6 text-indigo-500" />,
  path: ROUTES.INTEL,
  gated: true
}, {
  id: 'quote-scanner',
  title: 'AI Quote Scanner',
  description: 'Upload your quote and let AI flag hidden risks, missing scope, and overpricing in 30 seconds.',
  cta: 'Scan Your Quote',
  icon: <ScanSearch className="w-6 h-6 text-rose-500" />,
  path: ROUTES.QUOTE_SCANNER,
  gated: true
}, {
  id: 'quote-builder',
  title: 'Project Quote Builder',
  description: 'Get an AI-powered estimate for your window or door project in seconds.',
  cta: 'Build Your Estimate',
  icon: <Calculator className="w-6 h-6 text-teal-500" />,
  path: ROUTES.FREE_ESTIMATE,
  gated: true,
  badge: 'Beta'
}];

function ToolCard({
  tool,
  index
}: {
  tool: Tool;
  index: number;
}) {
  const colors = getToolIconColors(tool.id);
  
  return <Link to={tool.path} style={{
    animationDelay: `${index * 0.1}s`
  }} className="group relative flex flex-col p-6 rounded-xl bg-card border border-border card-hover shadow-2xl">
      {/* Badges */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {tool.badge && <div className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded font-medium">
            {tool.badge}
          </div>}
        {tool.gated && <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Email to save
          </div>}
      </div>

      {/* Icon with themed background */}
      <div className={`w-12 h-12 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
        {tool.icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
        {tool.title}
      </h3>

      {/* Description */}
      <p className="text-sm mb-4 flex-grow text-warning-foreground">
        {tool.description}
      </p>

      {/* CTA */}
      <div className="flex items-center text-sm text-primary font-medium">
        <span>{tool.cta}</span>
        <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
      </div>
    </Link>;
}
export function ToolGrid() {
  return <section className="py-20 md:py-32 relative bg-secondary/30">
      <div className="container px-4">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            12 Tools to <span className="text-primary">Discover the Truth</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Explore our interactive tools designed to help you make an informed decision. 
            No pressure, no sales calls unless you ask.
          </p>
        </div>

        {/* Control message */}
        <div className="text-center text-sm mb-12">
          <span className="inline-flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border-2 border-border bg-background/50 shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.3)]">
            <span className="text-foreground font-bold">✓ You're in control</span>
            <span className="text-foreground font-semibold">Explore any tool in any order</span>
          </span>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => <ToolCard key={tool.id} tool={tool} index={index} />)}
        </div>
      </div>
    </section>;
}