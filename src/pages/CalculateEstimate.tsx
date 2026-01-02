import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2, DollarSign, Clock, Lightbulb, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LineItem {
  item: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Estimate {
  projectSummary: string;
  lineItems: LineItem[];
  subtotal: number;
  laborCost: number;
  permitFees: number;
  total: number;
  timeline: string;
  notes: string[];
  savingsTips: string[];
}

class RateLimitError extends Error {
  isAnonymous: boolean;
  constructor(message: string, isAnonymous: boolean) {
    super(message);
    this.isAnonymous = isAnonymous;
  }
}

export default function CalculateEstimate() {
  const navigate = useNavigate();
  const [projectDescription, setProjectDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  const handleGenerate = async () => {
    if (projectDescription.trim().length < 10) {
      toast.error('Please provide more details about your project (at least 10 characters).');
      return;
    }

    setIsGenerating(true);
    setEstimate(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: { projectDescription },
      });

      if (error) {
        // Check if it's a rate limit error
        if (error.message?.includes('429') || (data && 'isAnonymous' in data)) {
          throw new RateLimitError(
            data?.error || 'Rate limit exceeded',
            data?.isAnonymous ?? !session
          );
        }
        throw new Error(error.message || 'Failed to generate estimate');
      }

      if (data?.error) {
        if (data.isAnonymous !== undefined) {
          throw new RateLimitError(data.error, data.isAnonymous);
        }
        throw new Error(data.error);
      }

      if (data?.estimate) {
        setEstimate(data.estimate);
        toast.success('Estimate generated successfully!');
      } else {
        throw new Error('No estimate received');
      }
    } catch (error) {
      console.error('Generate error:', error);
      
      if (error instanceof RateLimitError) {
        if (error.isAnonymous) {
          toast.error("🔒 You've used all 3 free estimates. Sign up to get 20/hour!", {
            action: {
              label: 'Sign Up',
              onClick: () => navigate('/auth'),
            },
            duration: 8000,
          });
        } else {
          toast.error("⏳ You've reached your hourly limit. Please try again later.", {
            duration: 5000,
          });
        }
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to generate estimate');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Tools</span>
          </Link>
        </div>
      </header>

      <main className="container px-4 py-8 md:py-12">
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Beta
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Project Quote Builder
          </h1>
          <p className="text-lg text-muted-foreground">
            Get an AI-powered estimate for your window or door project in seconds. 
            Describe your project and let our system generate a detailed breakdown.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Describe Your Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Example: I need to replace 8 single-hung windows and 2 sliding glass doors in my 2,500 sq ft home in Tampa. The house was built in 1985 and I want impact-rated products for hurricane protection..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="min-h-[150px] resize-none"
                disabled={isGenerating}
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {projectDescription.length}/500 characters
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || projectDescription.trim().length < 10}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Estimate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {estimate && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              {/* Summary Card */}
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Estimate</span>
                    <span className="text-2xl text-primary">{formatCurrency(estimate.total)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">{estimate.projectSummary}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>Timeline: {estimate.timeline}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 font-medium">Item</th>
                          <th className="text-left py-3 font-medium hidden md:table-cell">Description</th>
                          <th className="text-center py-3 font-medium">Qty</th>
                          <th className="text-right py-3 font-medium">Unit Price</th>
                          <th className="text-right py-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimate.lineItems.map((item, index) => (
                          <tr key={index} className="border-b border-border/50">
                            <td className="py-3">{item.item}</td>
                            <td className="py-3 text-muted-foreground hidden md:table-cell">{item.description}</td>
                            <td className="py-3 text-center">{item.quantity}</td>
                            <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-b border-border/50">
                          <td colSpan={4} className="py-3 text-right">Subtotal</td>
                          <td className="py-3 text-right">{formatCurrency(estimate.subtotal)}</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td colSpan={4} className="py-3 text-right">Labor</td>
                          <td className="py-3 text-right">{formatCurrency(estimate.laborCost)}</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td colSpan={4} className="py-3 text-right">Permit Fees</td>
                          <td className="py-3 text-right">{formatCurrency(estimate.permitFees)}</td>
                        </tr>
                        <tr className="font-bold">
                          <td colSpan={4} className="py-3 text-right text-lg">Total</td>
                          <td className="py-3 text-right text-lg text-primary">{formatCurrency(estimate.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Notes & Tips */}
              <div className="grid md:grid-cols-2 gap-6">
                {estimate.notes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Important Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {estimate.notes.map((note, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-1">•</span>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {estimate.savingsTips.length > 0 && (
                  <Card className="border-primary/20">
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        Money-Saving Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <ul className="space-y-2">
                        {estimate.savingsTips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-1">✓</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground text-center">
                This estimate is AI-generated for planning purposes only. Actual costs may vary based on site conditions, 
                material availability, and contractor rates. Always get multiple quotes from licensed professionals.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
