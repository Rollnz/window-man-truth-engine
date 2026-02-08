/**
 * NavbarLite - Lightweight navbar for initial render
 * 
 * This is a stripped-down version of the Navbar that:
 * 1. Does NOT call useAuth() - avoiding Supabase network requests
 * 2. Does NOT call useVaultNotifications() - avoiding localStorage reads
 * 3. Shows minimal UI until the full navbar hydrates
 * 
 * This dramatically improves FCP/LCP by deferring auth checks.
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Vault, Phone } from 'lucide-react';
import { ROUTES } from '@/config/navigation';

interface NavbarLiteProps {
  funnelMode?: boolean;
}

export function NavbarLite({ funnelMode = false }: NavbarLiteProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold text-lg">
          <img 
            src="/icon-512.webp" 
            alt="Its Window Man Logo" 
            width={36} 
            height={36} 
            className="w-9 h-9 object-contain" 
          />
          <span style={{ color: '#2278BF' }}>Its Window Man</span>
        </Link>

        {/* Funnel Mode Desktop CTAs */}
        {funnelMode && (
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="border-primary/30 hover:border-primary/50">
              <a href="tel:+15614685571" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">(561) 468-5571</span>
              </a>
            </Button>
          </div>
        )}

        {/* Desktop Right Side - Minimal skeleton until full navbar loads */}
        <div className="hidden md:flex items-center gap-3">
          {/* Placeholder for auth button - prevents layout shift */}
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.AUTH}>
              <Vault className="w-4 h-4" />
              {!funnelMode && <span className="ml-2">Vault Login</span>}
            </Link>
          </Button>
        </div>

        {/* Mobile Right Side */}
        <div className="flex md:hidden items-center gap-2">
          {funnelMode && (
            <Button variant="ghost" size="sm" asChild>
              <a href="tel:+15614685571" aria-label="Call Window Man">
                <Phone className="w-5 h-5 text-primary" />
              </a>
            </Button>
          )}
          
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.AUTH} aria-label="Vault Login">
              <Vault className="w-5 h-5 text-primary" />
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
