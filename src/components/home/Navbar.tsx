import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useVaultNotifications } from '@/hooks/useVaultNotifications';
import { Vault, LogIn, Menu, X, Target } from 'lucide-react';
import { useState } from 'react';
import { ROUTES } from '@/config/navigation';

export function Navbar() {
  const { isAuthenticated, loading } = useAuth();
  const { hasNotifications, incompleteToolsCount, hasMissingDocuments } = useVaultNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold text-lg text-foreground">
          Its Window Man
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link 
            to={ROUTES.TOOLS} 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Tools
          </Link>
          <Link 
            to={ROUTES.EVIDENCE} 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Evidence
          </Link>
          <Link 
            to={ROUTES.INTEL} 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Intel Library
          </Link>
          <Link 
            to={ROUTES.BEAT_YOUR_QUOTE} 
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <Target className="w-4 h-4" />
            Beat Your Quote
          </Link>
          
          {/* Auth Button */}
          {!loading && (
            isAuthenticated ? (
              <Button variant="outline" size="sm" asChild className="relative">
                <Link to={ROUTES.VAULT}>
                  <Vault className="w-4 h-4 mr-2" />
                  My Vault
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
              <Button variant="outline" size="sm" asChild>
                <Link to={ROUTES.AUTH}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Link>
              </Button>
            )
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          <Link 
            to={ROUTES.TOOLS} 
            className="block text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Tools
          </Link>
          <Link 
            to={ROUTES.EVIDENCE} 
            className="block text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Evidence
          </Link>
          <Link 
            to={ROUTES.INTEL} 
            className="block text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Intel Library
          </Link>
          <Link 
            to={ROUTES.BEAT_YOUR_QUOTE} 
            className="block text-sm font-medium text-primary hover:text-primary/80"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Beat Your Quote
            </span>
          </Link>
          
          {!loading && (
            isAuthenticated ? (
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
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to={ROUTES.AUTH} onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Link>
              </Button>
            )
          )}
        </div>
      )}
    </nav>
  );
}