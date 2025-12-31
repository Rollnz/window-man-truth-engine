import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-8">Disclaimer</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-muted-foreground">Content goes here</p>
        </div>
      </div>
    </div>
  );
}
