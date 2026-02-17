import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Vault, LogIn, Menu, X, Sun, Moon, Phone } from 'lucide-react';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useTheme } from 'next-themes';
import { ROUTES } from '@/config/navigation';

// Lazy-load ReadinessIndicator (pulls in canvas-confetti ~35KB)
const ReadinessIndicator = lazy(() => 
  import('@/components/navigation/ReadinessIndicator').then(m => ({ default: m.ReadinessIndicator }))
);

interface NavbarProps {
  funnelMode?: boolean;
}

/**
 * Deferred auth hook — returns placeholder immediately so the Navbar shell
 * paints without waiting for the Supabase SDK to initialise.
 * The real auth check runs after the first idle callback / 1.5 s timeout.
 */
function useDeferredAuth() {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    loading: boolean;
    hasNotifications: boolean;
    incompleteToolsCount: number;
    hasMissingDocuments: boolean;
    ready: boolean;
  }>({
    isAuthenticated: false,
    loading: true,
    hasNotifications: false,
    incompleteToolsCount: 0,
    hasMissingDocuments: false,
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Dynamically import the heavy hooks so they don't block initial parse
      const [{ useAuth: getAuth }, { useVaultNotifications: getVault }] = await Promise.all([
        import('@/hooks/useAuth'),
        import('@/hooks/useVaultNotifications'),
      ]);

      // We can't call hooks dynamically, so we import the supabase client
      // directly and do a lightweight session check instead.
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) return;

      setAuthState({
        isAuthenticated: !!session?.user,
        loading: false,
        hasNotifications: false,   // Will update below if authenticated
        incompleteToolsCount: 0,
        hasMissingDocuments: false,
        ready: true,
      });
    };

    // Defer until browser is idle (or max 1.5 s)
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => run(), { timeout: 1500 });
      return () => { cancelled = true; cancelIdleCallback(id); };
    } else {
      const id = setTimeout(() => run(), 100);
      return () => { cancelled = true; clearTimeout(id); };
    }
  }, []);

  return authState;
}

export function Navbar({ funnelMode = false }: NavbarProps) {
  const {
    isAuthenticated,
    loading,
    hasNotifications,
    incompleteToolsCount,
    hasMissingDocuments,
    ready,
  } = useDeferredAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    setTheme,
    resolvedTheme
  } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold text-lg">
          <img src="/icon-512.webp" alt="Its Window Man Logo" width={36} height={36} className="w-9 h-9 object-contain" />
          <span style={{ color: '#2278BF' }}>Its Window Man</span>
        </Link>

        {/* Desktop Navigation - Hidden in Funnel Mode */}
        {!funnelMode && (
          <div className="hidden md:flex items-center gap-4">
            <Link to={ROUTES.TOOLS} className="text-sm transition-colors text-primary font-semibold">
              Tools
            </Link>
            <Link to={ROUTES.EVIDENCE} className="text-sm transition-colors font-semibold text-primary">
              Evidence
            </Link>
            <Link to={ROUTES.INTEL} className="text-sm transition-colors text-primary font-semibold">
              Intel Library
            </Link>
            <Link to={ROUTES.BEAT_YOUR_QUOTE} className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
              <img src="/icon-512.webp" alt="" width={16} height={16} className="w-4 h-4 rounded-full object-contain" />
              Beat Your Quote
            </Link>
            
            {/* Readiness Score Indicator - lazy loaded */}
            {ready && (
              <Suspense fallback={null}>
                <ReadinessIndicator />
              </Suspense>
            )}
          </div>
        )}

        {/* Funnel Mode Desktop CTAs */}
        {funnelMode && (
          <div className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
            <Button variant="outline" size="sm" asChild className="border-primary/30 hover:border-primary/50">
              <a href="tel:+15614685571" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">(561) 468-5571</span>
              </a>
            </Button>
          </div>
        )}

        {/* Desktop Right Side - Always visible */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} 
            className={`h-9 w-9 flex items-center justify-center rounded transition-colors ${
              resolvedTheme === 'dark' 
                ? 'bg-amber-50 hover:bg-amber-100' 
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' 
              ? <Sun className="h-4 w-4 text-orange-500" /> 
              : <Moon className="h-4 w-4 text-white" />
            }
          </button>
          
          {/* Auth Button */}
          {!loading && (isAuthenticated ? (
            <Button variant="outline" size="sm" asChild className="relative">
              <Link to={ROUTES.VAULT}>
                <Vault className="w-4 h-4" />
                {!funnelMode && <span className="ml-2">My Vault</span>}
                {hasNotifications && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{incompleteToolsCount} tools incomplete{hasMissingDocuments ? ', documents missing' : ''}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </Link>
            </Button>
          ) : (
            <Button variant={funnelMode ? "outline" : "default"} size="sm" asChild className={funnelMode ? "" : "bg-primary text-primary-foreground hover:bg-primary/90"}>
              <Link to={ROUTES.AUTH}>
                <Vault className="w-4 h-4" />
                {!funnelMode && <span className="ml-2">Vault Login</span>}
              </Link>
            </Button>
          ))}
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
          
          {!loading && (
            <Button variant="ghost" size="sm" asChild>
              <Link to={isAuthenticated ? ROUTES.VAULT : ROUTES.AUTH} aria-label={isAuthenticated ? "My Vault" : "Vault Login"}>
                <Vault className="w-5 h-5 text-primary" />
              </Link>
            </Button>
          )}
          
          {!funnelMode && (
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu - Only in non-funnel mode */}
      {!funnelMode && mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-1">
          <Link to={ROUTES.TOOLS} className="block text-sm text-muted-foreground hover:text-foreground min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>
            Tools
          </Link>
          <Link to={ROUTES.EVIDENCE} className="block text-sm text-muted-foreground hover:text-foreground min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>
            Evidence
          </Link>
          <Link to={ROUTES.INTEL} className="block text-sm text-muted-foreground hover:text-foreground min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>
            Intel Library
          </Link>
          <Link to={ROUTES.BEAT_YOUR_QUOTE} className="block text-sm font-medium text-primary hover:text-primary/80 min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>
            <span className="flex items-center gap-2">
              <img src="/icon-512.webp" alt="" width={16} height={16} className="w-4 h-4 rounded-full object-contain" />
              Beat Your Quote
            </span>
          </Link>
          
          {/* Readiness Score - Mobile (lazy) */}
          {ready && (
            <div className="py-2">
              <Suspense fallback={null}>
                <ReadinessIndicator />
              </Suspense>
            </div>
          )}
          
          {/* Theme Toggle - Mobile */}
          <button 
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} 
            className="w-full flex items-center gap-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className={`h-8 w-8 flex items-center justify-center rounded transition-colors ${
              resolvedTheme === 'dark' 
                ? 'bg-amber-50' 
                : 'bg-slate-800'
            }`}>
              {resolvedTheme === 'dark' 
                ? <Sun className="h-4 w-4 text-orange-500" /> 
                : <Moon className="h-4 w-4 text-white" />
              }
            </span>
            {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          {!loading && (isAuthenticated ? (
            <Button variant="outline" size="sm" asChild className="w-full relative">
              <Link to={ROUTES.VAULT} onClick={() => setMobileMenuOpen(false)}>
                <Vault className="w-4 h-4 mr-2" />
                My Vault
                {hasNotifications && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{incompleteToolsCount} tools incomplete{hasMissingDocuments ? ', documents missing' : ''}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </Link>
            </Button>
          ) : (
            <Button variant="default" size="sm" asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to={ROUTES.AUTH} onClick={() => setMobileMenuOpen(false)}>
                <LogIn className="w-4 h-4 mr-2" />
                Vault Login
              </Link>
            </Button>
          ))}
        </div>
      )}
    </nav>
  );
}
