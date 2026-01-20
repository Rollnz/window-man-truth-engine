import { Search, User, Clock, Loader2, FileText, Mail, Phone, MapPin, Tag, PhoneCall, ExternalLink, Filter, Calendar, Upload, MessageSquare, Users } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useGlobalSearch, SearchResultItem, EntityType } from '@/hooks/useGlobalSearch';
import { HighlightMatch } from '@/components/ui/highlight-match';
import { cn } from '@/lib/utils';

// Entity type configuration
const ENTITY_TYPE_CONFIG: Record<EntityType, { icon: typeof User; label: string; color: string }> = {
  lead: { icon: User, label: 'Leads', color: 'text-blue-500' },
  call: { icon: PhoneCall, label: 'Calls', color: 'text-green-500' },
  pending_call: { icon: Phone, label: 'Pending Calls', color: 'text-amber-500' },
  note: { icon: FileText, label: 'Notes', color: 'text-purple-500' },
  session: { icon: Users, label: 'Sessions', color: 'text-cyan-500' },
  quote_upload: { icon: Upload, label: 'Quote Uploads', color: 'text-orange-500' },
  consultation: { icon: Calendar, label: 'Consultations', color: 'text-pink-500' },
};

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
  completed: 'bg-green-500/20 text-green-600 border-green-500/30',
  pending: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
  failed: 'bg-red-500/20 text-red-600 border-red-500/30',
};

function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'text-muted-foreground';
  if (score >= 150) return 'text-red-500 font-bold';
  if (score >= 50) return 'text-amber-500 font-semibold';
  return 'text-blue-500';
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Renders a single search result with entity-type icon and highlighting
 */
function SearchResultItemComponent({ 
  result, 
  onSelect,
  isSelected,
}: { 
  result: SearchResultItem; 
  onSelect: () => void;
  isSelected: boolean;
}) {
  const config = ENTITY_TYPE_CONFIG[result.entity_type] || ENTITY_TYPE_CONFIG.lead;
  const EntityIcon = config.icon;
  
  const status = result.payload?.status || result.payload?.call_status;
  const score = result.payload?.engagement_score;
  
  // Determine which field to highlight based on match_field
  const highlightTitle = result.match_field === 'title';
  const highlightSubtitle = result.match_field === 'subtitle' || result.match_field === 'phone';
  const showSnippet = result.match_field === 'keywords' && result.match_snippet;

  return (
    <CommandItem
      value={`${result.title} ${result.subtitle} ${result.entity_id}`}
      onSelect={onSelect}
      className={cn(
        "cursor-pointer",
        isSelected && "bg-accent"
      )}
    >
      <EntityIcon className={cn("h-4 w-4 mr-2 flex-shrink-0", config.color)} />
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">
            {highlightTitle && result.match_positions?.length ? (
              <HighlightMatch text={result.title} positions={result.match_positions} />
            ) : (
              result.title
            )}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {status && (
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", STATUS_COLORS[status] || '')}>
                {String(status).replace('_', ' ')}
              </Badge>
            )}
            {score !== undefined && score !== null && (
              <span className={cn("text-xs", getScoreColor(score))}>
                {score}
              </span>
            )}
          </div>
        </div>

        {/* Subtitle row */}
        <div className="text-xs text-muted-foreground truncate">
          {highlightSubtitle && result.match_positions?.length ? (
            <HighlightMatch text={result.subtitle} positions={result.match_positions} />
          ) : (
            result.subtitle
          )}
        </div>

        {/* Match snippet for keyword matches */}
        {showSnippet && (
          <div className="text-[11px] bg-muted/50 rounded px-1.5 py-0.5 mt-0.5 truncate text-muted-foreground">
            <HighlightMatch text={result.match_snippet!} positions={result.match_positions} />
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
          <span className={config.color}>{result.entity_type_label}</span>
          <span>•</span>
          <span>{formatTimeAgo(result.updated_at)}</span>
          {result.match_reason !== 'exact_match' && (
            <>
              <span>•</span>
              <span className="italic">{result.match_reason.replace('_', ' ')}</span>
            </>
          )}
        </div>
      </div>
    </CommandItem>
  );
}

/**
 * Entity type filter component
 */
function EntityTypeFilter({ 
  selected, 
  onChange 
}: { 
  selected: EntityType[]; 
  onChange: (types: EntityType[]) => void;
}) {
  const allTypes: EntityType[] = ['lead', 'call', 'pending_call', 'note', 'session', 'quote_upload', 'consultation'];

  const handleToggle = (type: EntityType) => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Filter by Type</div>
      <div className="space-y-2">
        {allTypes.map((type) => {
          const config = ENTITY_TYPE_CONFIG[type];
          const Icon = config.icon;
          return (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selected.includes(type)}
                onCheckedChange={() => handleToggle(type)}
              />
              <Icon className={cn("h-4 w-4", config.color)} />
              <span className="text-sm">{config.label}</span>
            </label>
          );
        })}
      </div>
      {selected.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => onChange([])}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}

export function GlobalLeadSearch() {
  const {
    recentLeads,
    searchQuery,
    setSearchQuery,
    entityTypeFilter,
    setEntityTypeFilter,
    isOpen,
    setIsOpen,
    searchResults,
    groupedResults,
    navigateToResult,
    navigateToLead,
    viewAllResults,
    isLoading,
    error,
    hasMore,
    selectedIndex,
    handleKeyDown,
  } = useGlobalSearch();

  const hasQuery = searchQuery.trim().length >= 2;
  const hasActiveFilters = entityTypeFilter.length > 0;

  // Group results by entity type for display
  const entityTypes = Object.keys(groupedResults) as EntityType[];

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center border-b px-3" onKeyDown={handleKeyDown}>
        <Search className="h-4 w-4 shrink-0 opacity-50" />
        <input
          placeholder="Search leads, calls, notes, quotes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex h-11 w-full rounded-md bg-transparent py-3 px-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          autoFocus
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
              <Filter className="h-3.5 w-3.5" />
              {hasActiveFilters && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px] rounded-full">
                  {entityTypeFilter.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-4">
            <EntityTypeFilter
              selected={entityTypeFilter}
              onChange={setEntityTypeFilter}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="px-3 py-2 border-b bg-muted/30 flex flex-wrap gap-1">
          {entityTypeFilter.map((type) => {
            const config = ENTITY_TYPE_CONFIG[type];
            return (
              <Badge
                key={type}
                variant="secondary"
                className="text-xs gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => setEntityTypeFilter(entityTypeFilter.filter(t => t !== type))}
              >
                {config.label}
                <span className="ml-1">×</span>
              </Badge>
            );
          })}
        </div>
      )}

      <CommandList onKeyDown={handleKeyDown}>
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
                      <span className={cn("text-sm", getScoreColor(lead.engagement_score))}>
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
            Type at least 2 characters to search across all records
          </div>
        )}

        {/* No results */}
        {!isLoading && !error && hasQuery && searchResults.length === 0 && (
          <CommandEmpty>No results found for "{searchQuery}"</CommandEmpty>
        )}

        {/* Search results grouped by entity type */}
        {!isLoading && !error && hasQuery && searchResults.length > 0 && (
          <>
            {entityTypes.map((entityType) => {
              const items = groupedResults[entityType];
              if (!items?.length) return null;
              
              const config = ENTITY_TYPE_CONFIG[entityType];
              const baseIndex = searchResults.findIndex(r => r.entity_type === entityType);
              
              return (
                <CommandGroup key={entityType} heading={config.label}>
                  {items.map((result, idx) => {
                    const globalIndex = baseIndex + idx;
                    return (
                      <SearchResultItemComponent
                        key={`${result.entity_type}-${result.entity_id}`}
                        result={result}
                        onSelect={() => navigateToResult(result)}
                        isSelected={selectedIndex === globalIndex}
                      />
                    );
                  })}
                </CommandGroup>
              );
            })}

            {/* View all results link */}
            {hasMore && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={viewAllResults}
                    className={cn(
                      "cursor-pointer justify-center text-primary",
                      selectedIndex === searchResults.length && "bg-accent"
                    )}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    <span>View all results</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </>
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
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
