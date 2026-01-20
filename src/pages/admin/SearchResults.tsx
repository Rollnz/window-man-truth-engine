import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, User, Loader2, FileText, Mail, Phone, MapPin, Tag, PhoneCall } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { HighlightMatch } from '@/components/ui/highlight-match';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface SearchResult {
  type: 'lead';
  id: string;
  title: string;
  subtitle: string;
  status: string;
  engagement_score: number | null;
  match_field: string;
  match_snippet?: string;
  match_positions?: Array<{ start: number; length: number }>;
}

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
  call_notes: PhoneCall,
  city: MapPin,
  source: Tag,
  id: Tag,
  unknown: Tag,
};

const MATCH_FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  name: 'Name',
  notes: 'Notes',
  call_notes: 'Call Summary',
  city: 'City',
  source: 'Source',
  id: 'ID',
  unknown: 'Match',
};

function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'text-muted-foreground';
  if (score >= 150) return 'text-red-500 font-bold';
  if (score >= 50) return 'text-amber-500 font-semibold';
  return 'text-blue-500';
}

function SearchResultsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Search when query changes in URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
    
    if (urlQuery.length >= 2) {
      performSearch(urlQuery);
    } else {
      setResults([]);
      setTotalCount(0);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-global-search?q=${encodeURIComponent(searchQuery)}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError('Admin access required');
        } else {
          setError('Search failed');
        }
        setResults([]);
        return;
      }

      const data = await response.json();
      setResults(data.suggestions || []);
      setTotalCount(data.total_count || data.suggestions?.length || 0);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setSearchParams({ q: query.trim() });
    }
  };

  const handleResultClick = (leadId: string) => {
    navigate(`/admin/leads/${leadId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/crm">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Search Results</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, phone, notes, call summaries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={query.trim().length < 2}>
            Search
          </Button>
        </form>

        {/* Results count */}
        {!isLoading && !error && results.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Found {totalCount} result{totalCount !== 1 ? 's' : ''} for "{searchParams.get('q')}"
          </p>
        )}
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 pb-8">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Searching...</span>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* No query */}
        {!isLoading && !error && !searchParams.get('q') && (
          <div className="text-center py-12 text-muted-foreground">
            Enter a search term to find leads
          </div>
        )}

        {/* No results */}
        {!isLoading && !error && searchParams.get('q') && results.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No leads found for "{searchParams.get('q')}"
          </div>
        )}

        {/* Results grid */}
        {!isLoading && !error && results.length > 0 && (
          <div className="grid gap-3 max-w-4xl">
            {results.map((result) => {
              const MatchIcon = MATCH_FIELD_ICONS[result.match_field] || Tag;
              const matchLabel = MATCH_FIELD_LABELS[result.match_field] || 'Match';
              const [email, phone] = result.subtitle.split(' | ');
              
              const highlightTitle = result.match_field === 'name';
              const highlightEmail = result.match_field === 'email';
              const highlightPhone = result.match_field === 'phone';
              const showSnippet = ['notes', 'call_notes'].includes(result.match_field) && result.match_snippet;

              return (
                <Card 
                  key={result.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleResultClick(result.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {/* Name and status */}
                        <div className="flex items-center justify-between gap-2 mb-1">
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

                        {/* Email/phone */}
                        <div className="text-sm text-muted-foreground truncate mb-2">
                          {highlightEmail ? (
                            <HighlightMatch text={email} positions={result.match_positions} />
                          ) : (
                            email
                          )}
                          {phone && (
                            <>
                              <span className="mx-1.5">|</span>
                              {highlightPhone ? (
                                <HighlightMatch text={phone} positions={result.match_positions} />
                              ) : (
                                phone
                              )}
                            </>
                          )}
                        </div>

                        {/* Snippet for notes/call_notes */}
                        {showSnippet && (
                          <div className="text-sm bg-muted/50 rounded px-3 py-2 mb-2">
                            <span className="text-muted-foreground font-medium">
                              {result.match_field === 'call_notes' ? 'Call Summary: ' : 'Note: '}
                            </span>
                            <HighlightMatch text={result.match_snippet!} positions={result.match_positions} />
                          </div>
                        )}

                        {/* Match indicator */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                          <MatchIcon className="h-3.5 w-3.5" />
                          <span>Matched: {matchLabel}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchResults() {
  return (
    <AuthGuard>
      <SearchResultsContent />
    </AuthGuard>
  );
}
