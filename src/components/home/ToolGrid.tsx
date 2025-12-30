import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Calculator, 
  Brain, 
  MessageSquare, 
  GitCompare, 
  Shield, 
  Zap, 
  Users 
} from 'lucide-react';

interface Tool {
  id: string;
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  path: string;
  gated: boolean;
}

const tools: Tool[] = [
  {
    id: 'reality-check',
    title: 'Reality Check Tool',
    description: 'Confront the hidden costs your current windows are costing you.',
    cta: 'See What Cheap Windows Really Cost',
    icon: <AlertTriangle className="w-6 h-6" />,
    path: '/reality-check',
    gated: false,
  },
  {
    id: 'cost-calculator',
    title: 'Cost of Inaction Calculator',
    description: 'Quantify exactly how much waiting is costing you every day.',
    cta: 'Calculate Your Hidden Costs',
    icon: <Calculator className="w-6 h-6" />,
    path: '/cost-calculator',
    gated: false,
  },
  {
    id: 'quiz',
    title: 'Pattern Interrupt Quiz',
    description: 'Test your window knowledge with our 5-question challenge.',
    cta: 'Test Your Window IQ',
    icon: <Brain className="w-6 h-6" />,
    path: '/quiz',
    gated: false,
  },
  {
    id: 'expert-system',
    title: 'Expert System',
    description: 'Chat with our AI specialist for neutral, expert advice.',
    cta: 'Chat With the Window Specialist',
    icon: <MessageSquare className="w-6 h-6" />,
    path: '/expert',
    gated: false,
  },
  {
    id: 'comparison',
    title: 'Comparison Tool',
    description: 'Compare cheap vs. quality window specs side-by-side.',
    cta: 'Compare Real Window Specs',
    icon: <GitCompare className="w-6 h-6" />,
    path: '/comparison',
    gated: true,
  },
  {
    id: 'risk-diagnostic',
    title: 'Risk Reversal Diagnostic',
    description: 'Discover the warranties and protections you deserve.',
    cta: 'See Your Protection Plan',
    icon: <Shield className="w-6 h-6" />,
    path: '/risk-diagnostic',
    gated: true,
  },
  {
    id: 'fast-win',
    title: 'Fast Win Tool',
    description: 'Get instant value in 60 seconds with our energy audit.',
    cta: 'Get Your Instant Energy Boost',
    icon: <Zap className="w-6 h-6" />,
    path: '/fast-win',
    gated: true,
  },
  {
    id: 'proof',
    title: 'Proof Aggregator',
    description: 'Explore real case studies and data from other homeowners.',
    cta: 'See What Others Discovered',
    icon: <Users className="w-6 h-6" />,
    path: '/proof',
    gated: true,
  },
];

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  return (
    <Link
      to={tool.path}
      className="group relative flex flex-col p-6 rounded-xl bg-card border border-border card-hover"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Gated badge */}
      {tool.gated && (
        <div className="absolute top-4 right-4 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          Email to save
        </div>
      )}

      {/* Icon */}
      <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary group-hover:bg-primary/20 transition-colors">
        {tool.icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
        {tool.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 flex-grow">
        {tool.description}
      </p>

      {/* CTA */}
      <div className="flex items-center text-sm text-primary font-medium">
        <span>{tool.cta}</span>
        <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}

export function ToolGrid() {
  return (
    <section className="py-20 md:py-32 relative bg-secondary/30">
      <div className="container px-4">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            8 Tools to <span className="text-primary">Discover the Truth</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Explore our interactive tools designed to help you make an informed decision. 
            No pressure, no sales calls unless you ask.
          </p>
        </div>

        {/* Control message */}
        <p className="text-center text-sm text-muted-foreground mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background/50">
            ✓ You're in control — explore any tool in any order
          </span>
        </p>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <ToolCard key={tool.id} tool={tool} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}