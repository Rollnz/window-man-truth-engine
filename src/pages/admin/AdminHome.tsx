import { Link } from 'react-router-dom';
import { Users, FileText, BarChart3, Flame, TrendingUp, Phone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { StatsCard } from '@/components/admin/StatsCard';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { QuickActionCard } from '@/components/admin/QuickActionCard';
import { SearchKeyboardHint } from '@/components/admin/GlobalLeadSearch';
import { PhoneCallOpsPanel } from '@/components/admin/PhoneCallOpsPanel';
import { SmokeTestButton } from '@/components/admin/SmokeTestButton';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Skeleton } from '@/components/ui/skeleton';

function AdminHomeContent() {
  const { stats, recentActivity, isLoading, refetch } = useAdminDashboard();
  const { setIsOpen } = useGlobalSearch();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Command Center</h1>
              <p className="text-sm text-muted-foreground">
                Overview of your leads and activity
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SmokeTestButton />
              <SearchKeyboardHint onClick={() => setIsOpen(true)} />
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="phone-calls" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Calls
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28" />
                  ))}
                </>
              ) : (
                <>
                  <StatsCard
                    title="Total Leads"
                    value={stats.totalLeads}
                    icon={<Users className="h-4 w-4" />}
                  />
                  <StatsCard
                    title="Hot Leads"
                    value={stats.hotLeads}
                    icon={<Flame className="h-4 w-4" />}
                    valueClassName="text-destructive"
                  />
                  <StatsCard
                    title="Quotes Today"
                    value={stats.quotesToday}
                    icon={<FileText className="h-4 w-4" />}
                  />
                  <StatsCard
                    title="Conversion Rate"
                    value={`${stats.conversionRate}%`}
                    icon={<TrendingUp className="h-4 w-4" />}
                    valueClassName={stats.conversionRate >= 10 ? 'text-primary' : undefined}
                  />
                </>
              )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-1 space-y-4">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <div className="space-y-3">
                  <QuickActionCard
                    title="Lead Warehouse"
                    description="Manage leads with drag & drop"
                    href="/admin/crm"
                    icon={<Users className="h-5 w-5 text-primary" />}
                    badge={stats.totalLeads}
                  />
                  <QuickActionCard
                    title="Attribution"
                    description="Track visitor journeys"
                    href="/admin/attribution"
                    icon={<BarChart3 className="h-5 w-5 text-primary" />}
                  />
                  <QuickActionCard
                    title="Quote Uploads"
                    description="Review uploaded documents"
                    href="/admin/quotes"
                    icon={<FileText className="h-5 w-5 text-primary" />}
                    badge={stats.quotesToday > 0 ? stats.quotesToday : undefined}
                    badgeVariant={stats.quotesToday > 0 ? 'success' : 'default'}
                  />
                </div>
              </div>

              {/* Activity Feed */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  <Link to="/admin/crm" className="text-sm text-primary hover:underline">
                    View all →
                  </Link>
                </div>
                <ActivityFeed events={recentActivity} isLoading={isLoading} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="phone-calls">
            <PhoneCallOpsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function AdminHome() {
  return (
    <AuthGuard>
      <AdminHomeContent />
    </AuthGuard>
  );
}
