import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { LogIn } from 'lucide-react';

/**
 * SessionExpiredOverlay
 * 
 * Listens for `auth:session-expired` custom DOM events (dispatched by
 * handleAuthError when the refresh token is dead) and renders a modal
 * OVER the current page. This preserves form state underneath instead
 * of doing a hard redirect that would destroy user input.
 */
export function SessionExpiredOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
    };

    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, []);

  const handleLogin = () => {
    setIsOpen(false);
    const redirectPath = window.location.pathname + window.location.search;
    navigate(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expired</AlertDialogTitle>
          <AlertDialogDescription>
            Your session has expired. Please log in again to continue where you left off.
            Don't worry — your current work is still here.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleLogin}>
            <LogIn className="w-4 h-4 mr-2" />
            Log In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
