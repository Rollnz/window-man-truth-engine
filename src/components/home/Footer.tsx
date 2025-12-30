import { Link } from 'react-router-dom';
import { MessageSquare, Shield, Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-16 border-t border-border bg-card/30">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Top section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4">
                <span className="text-primary">Impact</span> Windows
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Helping Florida homeowners make informed decisions about window investments 
                since 2010.
              </p>
              <Link 
                to="/expert" 
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ask a Question</span>
              </Link>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Explore Tools
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/reality-check" className="text-sm text-foreground hover:text-primary transition-colors">
                    Reality Check Tool
                  </Link>
                </li>
                <li>
                  <Link to="/cost-calculator" className="text-sm text-foreground hover:text-primary transition-colors">
                    Cost of Inaction Calculator
                  </Link>
                </li>
                <li>
                  <Link to="/comparison" className="text-sm text-foreground hover:text-primary transition-colors">
                    Comparison Tool
                  </Link>
                </li>
                <li>
                  <Link to="/proof" className="text-sm text-foreground hover:text-primary transition-colors">
                    Proof Aggregator
                  </Link>
                </li>
              </ul>
            </div>

            {/* Privacy commitment */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Your Privacy Matters
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Your data stays private. We never sell your information.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    No pressure. No sales calls unless you request them.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Impact Windows. All rights reserved.
              </p>

              {/* Legal links */}
              <div className="flex items-center gap-6">
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <Link to="/accessibility" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Accessibility
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}