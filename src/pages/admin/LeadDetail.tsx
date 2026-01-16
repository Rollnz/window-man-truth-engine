import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeadDetail } from '@/hooks/useLeadDetail';
import { LeadIdentityCard } from '@/components/lead-detail/LeadIdentityCard';
import { LeadTimeline } from '@/components/lead-detail/LeadTimeline';
import { NotesWidget } from '@/components/lead-detail/NotesWidget';
import { FilesWidget } from '@/components/lead-detail/FilesWidget';
import { WebhookExportButton } from '@/components/lead-detail/WebhookExportButton';
import { AuthGuard } from '@/components/auth/AuthGuard';

function LeadDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lead, events, files, notes, session, isLoading, error, updateStatus, addNote, updateSocialUrl } = useLeadDetail(id);

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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Lead Not Found</h1>
          <p className="text-muted-foreground mb-4">{error || 'The requested lead could not be found.'}</p>
          <Button onClick={() => navigate('/admin/crm')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Button>
        </div>
      </div>
    );
  }

  const isFacebookSource = session?.utm_source?.toLowerCase().includes('facebook') ||
                           session?.utm_source?.toLowerCase().includes('fb') ||
                           session?.utm_source?.toLowerCase().includes('instagram') ||
                           !!lead.facebook_page_name;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/crm')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Lead Command Center</h1>
            <p className="text-xs text-muted-foreground">{lead.email}</p>
          </div>
        </div>
      </header>

      {/* 3-Pane Layout */}
      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Pane: Identity Card */}
          <aside className="lg:col-span-3">
            <LeadIdentityCard
              lead={lead}
              session={session}
              onStatusChange={updateStatus}
              onSaveSocialUrl={updateSocialUrl}
            />
          </aside>

          {/* Center Pane: Timeline */}
          <section className="lg:col-span-6">
            <LeadTimeline events={events} notes={notes} isFacebookSource={isFacebookSource} />
          </section>

          {/* Right Pane: Workspace */}
          <aside className="lg:col-span-3 space-y-4">
            <NotesWidget onAddNote={addNote} />
            <FilesWidget files={files} />
            <WebhookExportButton lead={lead} events={events} notes={notes} />
          </aside>
        </div>
      </main>
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
