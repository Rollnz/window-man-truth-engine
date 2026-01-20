import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeadDetail } from '@/hooks/useLeadDetail';
import { useLeadNavigation } from '@/hooks/useLeadNavigation';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { LeadIdentityCard } from '@/components/lead-detail/LeadIdentityCard';
import { LeadTimeline } from '@/components/lead-detail/LeadTimeline';
import { NotesWidget } from '@/components/lead-detail/NotesWidget';
import { FilesWidget } from '@/components/lead-detail/FilesWidget';
import { DispatchWindowManButton } from '@/components/lead-detail/DispatchWindowManButton';
import { ConversionPathTimeline } from '@/components/lead-detail/ConversionPathTimeline';
import { ProjectedRevenueCard } from '@/components/lead-detail/ProjectedRevenueCard';
import { IntentSignalsSummary } from '@/components/lead-detail/IntentSignalsSummary';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { LeadNavigation } from '@/components/admin/LeadNavigation';
import { GlobalLeadSearch, SearchKeyboardHint } from '@/components/admin/GlobalLeadSearch';
import { AuthGuard } from '@/components/auth/AuthGuard';

function LeadDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lead, events, files, notes, session, calls, pendingCalls, isLoading, error, refetch, updateStatus, addNote, updateSocialUrl } = useLeadDetail(id);
  const { previousLeadId, nextLeadId, currentIndex, totalLeads, goToPrevious, goToNext } = useLeadNavigation(id);
  const { setIsOpen, addToRecent } = useGlobalSearch();

  // Add current lead to recent leads when viewed
  useEffect(() => {
    if (lead) {
      addToRecent(lead as any);
    }
  }, [lead, addToRecent]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-48" />
              <Skeleton className="h-24" />
              <Skeleton className="h-32" />
            </div>
            <div className="lg:col-span-6">
              <Skeleton className="h-96" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    const isAuthError = error?.toLowerCase().includes('authenticated') || error?.toLowerCase().includes('log in');
    const isInvalidId = error?.toLowerCase().includes('invalid lead id');
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">
            {isAuthError ? 'Authentication Required' : isInvalidId ? 'Invalid Lead ID' : 'Lead Not Found'}
          </h1>
          <p className="text-muted-foreground mb-4">
            {error || 'The requested lead could not be found.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {isAuthError ? (
              <Button onClick={() => navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`)}>
                Log In
              </Button>
            ) : (
              <Button onClick={() => navigate('/admin/crm')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CRM
              </Button>
            )}
          </div>
          {id && !isInvalidId && (
            <p className="text-xs text-muted-foreground mt-4">
              Lead ID: <code className="bg-muted px-1 py-0.5 rounded">{id}</code>
            </p>
          )}
        </div>
      </div>
    );
  }

  const isFacebookSource = session?.utm_source?.toLowerCase().includes('facebook') ||
                           session?.utm_source?.toLowerCase().includes('fb') ||
                           session?.utm_source?.toLowerCase().includes('instagram') ||
                           !!lead.facebook_page_name;

  const displayName = lead.first_name || lead.last_name 
    ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
    : lead.email.split('@')[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/crm')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <AdminBreadcrumb 
                  items={[
                    { label: 'Command Center', href: '/admin' },
                    { label: 'Lead Warehouse', href: '/admin/crm' },
                  ]} 
                  currentLabel={displayName}
                />
                <h1 className="font-semibold mt-1">Lead Command Center</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LeadNavigation
                currentIndex={currentIndex}
                totalLeads={totalLeads}
                onPrevious={goToPrevious}
                onNext={goToNext}
                hasPrevious={!!previousLeadId}
                hasNext={!!nextLeadId}
              />
              <SearchKeyboardHint onClick={() => setIsOpen(true)} />
            </div>
          </div>
        </div>
      </header>

      {/* 3-Pane Layout */}
      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Pane: Identity + Intent + Revenue */}
          <aside className="lg:col-span-3 space-y-4">
            <LeadIdentityCard
              lead={lead}
              session={session}
              onStatusChange={updateStatus}
              onSaveSocialUrl={updateSocialUrl}
            />
            
            {/* Intent Signals - Sales Cheat Sheet */}
            <IntentSignalsSummary events={events} />
            
            {/* Projected Revenue */}
            <ProjectedRevenueCard
              engagementScore={lead.engagement_score || 0}
              leadQuality={lead.lead_quality}
              estimatedDealValue={lead.estimated_deal_value}
            />
          </aside>

          {/* Center Pane: Timeline + Conversion Path */}
          <section className="lg:col-span-6 space-y-4">
            {/* Conversion Path Timeline - what cv_ events they triggered */}
            <ConversionPathTimeline events={events} />
            
            {/* Full Activity Timeline */}
            <LeadTimeline events={events} notes={notes} isFacebookSource={isFacebookSource} />
          </section>

          {/* Right Pane: Workspace */}
          <aside className="lg:col-span-3 space-y-4">
            <NotesWidget onAddNote={addNote} />
            <FilesWidget files={files} />
            <DispatchWindowManButton lead={lead} pendingCalls={pendingCalls} onSuccess={refetch} />
          </aside>
        </div>
      </main>

      <GlobalLeadSearch />
    </div>
  );
}

export default function LeadDetail() {
  return (
    <AuthGuard>
      <LeadDetailContent />
    </AuthGuard>
  );
}
