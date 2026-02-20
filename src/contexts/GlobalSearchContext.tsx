import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface GlobalSearchContextValue {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  setIsOpen: (open: boolean) => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => setIsOpen(false), []);

  return (
    <GlobalSearchContext.Provider value={{ isOpen, openSearch, closeSearch, setIsOpen }}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearchOpen() {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) throw new Error('useGlobalSearchOpen must be used within GlobalSearchProvider');
  return ctx;
}
