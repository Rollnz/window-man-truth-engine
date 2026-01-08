import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MinimalFooter } from '@/components/navigation/MinimalFooter';
import { ROUTES } from '@/config/navigation';

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Tools</span>
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track conversion funnels and tool performance</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Construction className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Analytics Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              This dashboard will display session tracking, conversion funnels, and tool performance metrics once the analytics tables are configured.
            </p>
          </CardContent>
        </Card>
      </div>

      <MinimalFooter />
    </div>
  );
}