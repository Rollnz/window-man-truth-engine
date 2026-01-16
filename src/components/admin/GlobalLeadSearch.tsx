import { useEffect } from 'react';
import { Search, User, Clock, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  qualifying: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
  mql: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  appointment_set: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30',
  sat: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30',
  closed_won: 'bg-green-500/20 text-green-600 border-green-500/30',
  closed_lost: 'bg-red-500/20 text-red-600 border-red-500/30',
  dead: 'bg-muted text-muted-foreground border-muted-foreground/30',
};

function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'text-muted-foreground';
  if (score >= 150) return 'text-red-500 font-bold';
  if (score >= 50) return 'text-amber-500 font-semibold';
  return 'text-blue-500';
}

export function GlobalLeadSearch() {
  const {
    recentLeads,
    searchQuery,
    setSearchQuery,
    isOpen,
    setIsOpen,
    filteredLeads,
    navigateToLead,
    isLoading,
  } = useGlobalSearch();

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        placeholder="Search leads by name, email, or phone..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && !searchQuery && recentLeads.length > 0 && (
          <CommandGroup heading="Recent Leads">
            {recentLeads.map((lead) => {
              const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email.split('@')[0];
              return (
                <CommandItem
                  key={lead.id}
                  value={lead.id}
                  onSelect={() => navigateToLead(lead.id)}
                  className="cursor-pointer"
                >
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{name}</span>
                      <span className="text-xs text-muted-foreground">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={STATUS_COLORS[lead.status] || ''}>
                        {lead.status.replace('_', ' ')}
                      </Badge>
                      <span className={`text-sm ${getScoreColor(lead.engagement_score)}`}>
                        {lead.engagement_score || 0}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {!isLoading && searchQuery && filteredLeads.length === 0 && (
          <CommandEmpty>No leads found for "{searchQuery}"</CommandEmpty>
        )}

        {!isLoading && searchQuery && filteredLeads.length > 0 && (
          <CommandGroup heading="Search Results">
            {filteredLeads.slice(0, 10).map((lead) => {
              const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email.split('@')[0];
              return (
                <CommandItem
                  key={lead.id}
                  value={`${name} ${lead.email} ${lead.phone || ''}`}
                  onSelect={() => navigateToLead(lead.id)}
                  className="cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{name}</span>
                      <span className="text-xs text-muted-foreground">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={STATUS_COLORS[lead.status] || ''}>
                        {lead.status.replace('_', ' ')}
                      </Badge>
                      <span className={`text-sm ${getScoreColor(lead.engagement_score)}`}>
                        {lead.engagement_score || 0}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Keyboard hint badge for header
export function SearchKeyboardHint({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 border border-border rounded-md hover:bg-muted transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search leads...</span>
      <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
