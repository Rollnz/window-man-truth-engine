import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Vault, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
          Its Window Man
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link 
            to="/tools" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Tools
          </Link>
          <Link 
            to="/evidence" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Evidence
          </Link>
          <Link 
            to="/intel" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Intel Library
          </Link>
          
          {/* Auth Button */}
          {!loading && (
            isAuthenticated ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/vault">
                  <Vault className="w-4 h-4 mr-2" />
                  My Vault
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">
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
            to="/tools" 
            className="block text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Tools
          </Link>
          <Link 
            to="/evidence" 
            className="block text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Evidence
          </Link>
          <Link 
            to="/intel" 
            className="block text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Intel Library
          </Link>
          
          {!loading && (
            isAuthenticated ? (
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to="/vault" onClick={() => setMobileMenuOpen(false)}>
                  <Vault className="w-4 h-4 mr-2" />
                  My Vault
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
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
