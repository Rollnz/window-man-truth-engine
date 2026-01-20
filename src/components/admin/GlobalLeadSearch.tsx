import { Search, User, Clock, Loader2, FileText, Mail, Phone, MapPin, Tag } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useGlobalSearch, SearchSuggestion } from '@/hooks/useGlobalSearch';
import { HighlightMatch } from '@/components/ui/highlight-match';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  qualifying: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
  mql: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  qualified: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
  appointment_set: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30',
  sat: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30',
  closed_won: 'bg-green-500/20 text-green-600 border-green-500/30',
  closed_lost: 'bg-red-500/20 text-red-600 border-red-500/30',
  dead: 'bg-muted text-muted-foreground border-muted-foreground/30',
};

const MATCH_FIELD_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  phone: Phone,
  name: User,
  notes: FileText,
  city: MapPin,
  source: Tag,
  id: Tag,
  unknown: Tag,
};

const MATCH_FIELD_LABELS: Record<string, string> = {
  email: 'email',
  phone: 'phone',
  name: 'name',
  notes: 'notes',
  city: 'city',
  source: 'source',
  id: 'ID',
  unknown: 'match',
};

function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'text-muted-foreground';
  if (score >= 150) return 'text-red-500 font-bold';
  if (score >= 50) return 'text-amber-500 font-semibold';
  return 'text-blue-500';
}

/**
 * Renders a single search result with highlighting
 */
function SearchResultItem({ 
  result, 
  onSelect 
}: { 
  result: SearchSuggestion; 
  onSelect: () => void;
}) {
  const MatchIcon = MATCH_FIELD_ICONS[result.match_field] || Tag;
  const matchLabel = MATCH_FIELD_LABELS[result.match_field] || 'match';
  
  // Parse subtitle for email and phone
  const [email, phone] = result.subtitle.split(' | ');
  
  // Determine if we should highlight the title or subtitle
  const highlightTitle = result.match_field === 'name';
  const highlightEmail = result.match_field === 'email';
  const highlightPhone = result.match_field === 'phone';
  const showNotesSnippet = result.match_field === 'notes' && result.match_snippet;

  return (
    <CommandItem
      value={`${result.title} ${result.subtitle} ${result.id}`}
      onSelect={onSelect}
      className="cursor-pointer"
    >
      <User className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Name and status row */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">
            {highlightTitle ? (
              <HighlightMatch text={result.title} positions={result.match_positions} />
            ) : (
              result.title
            )}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className={STATUS_COLORS[result.status] || ''}>
              {result.status.replace('_', ' ')}
            </Badge>
            <span className={`text-sm ${getScoreColor(result.engagement_score)}`}>
              {result.engagement_score || 0}
            </span>
          </div>
        </div>

        {/* Email/phone row with highlighting */}
        <div className="text-xs text-muted-foreground truncate">
          {highlightEmail ? (
            <HighlightMatch text={email} positions={result.match_positions} />
          ) : (
            email
          )}
          {phone && (
            <>
              <span className="mx-1">|</span>
              {highlightPhone ? (
                <HighlightMatch text={phone} positions={result.match_positions} />
              ) : (
                phone
              )}
            </>
          )}
        </div>

        {/* Notes snippet if matched on notes */}
        {showNotesSnippet && (
          <div className="text-xs bg-muted/50 rounded px-2 py-1 mt-0.5 truncate">
            <span className="text-muted-foreground">Note: </span>
            <HighlightMatch text={result.match_snippet!} positions={result.match_positions} />
          </div>
        )}

        {/* Match field indicator */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <MatchIcon className="h-3 w-3" />
          <span>matched: {matchLabel}</span>
        </div>
      </div>
    </CommandItem>
  );
}

export function GlobalLeadSearch() {
  const {
    recentLeads,
    searchQuery,
    setSearchQuery,
    isOpen,
    setIsOpen,
    searchResults,
    navigateToLead,
    isLoading,
    error,
  } = useGlobalSearch();

  const hasQuery = searchQuery.trim().length >= 2;

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        placeholder="Search leads by name, email, phone, notes, or ID..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="py-6 text-center">
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Recent leads (when no query) */}
        {!isLoading && !error && !hasQuery && recentLeads.length > 0 && (
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

        {/* Hint when query too short */}
        {!isLoading && !error && !hasQuery && recentLeads.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search
          </div>
        )}

        {/* No results */}
        {!isLoading && !error && hasQuery && searchResults.length === 0 && (
          <CommandEmpty>No leads found for "{searchQuery}"</CommandEmpty>
        )}

        {/* Search results with highlighting */}
        {!isLoading && !error && hasQuery && searchResults.length > 0 && (
          <CommandGroup heading="Search Results">
            {searchResults.map((result) => (
              <SearchResultItem
                key={result.id}
                result={result}
                onSelect={() => navigateToLead(result.id)}
              />
            ))}
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
