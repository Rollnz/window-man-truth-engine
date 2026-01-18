import { CaseStudy } from '@/data/evidenceData';
import { ToolsUsedSection } from './ToolsUsedSection';
import { ClassifiedPlaceholder } from './ClassifiedPlaceholder';
import { CheckCircle, Calendar, MapPin, User, Download, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface CaseDebriefContentProps {
  caseStudy: CaseStudy;
  onToolNavigate: (path: string) => void;
  onDownload: () => void;
  onConsultation: () => void;
}

export function CaseDebriefContent({ 
  caseStudy, 
  onToolNavigate,
  onDownload,
  onConsultation,
}: CaseDebriefContentProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="uppercase tracking-wider font-medium">{caseStudy.caseNumber}</span>
          <span>•</span>
          <span className="uppercase tracking-wider">Full Debrief</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
          {caseStudy.missionObjective}
        </h2>
        
        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{caseStudy.agentName}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{caseStudy.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{caseStudy.completionDate}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* The Problem */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          The Problem
        </h3>
        <p className="text-foreground">{caseStudy.theProblem}</p>
      </div>

      <Separator />

      {/* The Solution */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          The Solution
        </h3>
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="font-semibold text-primary">{caseStudy.theSolution}</p>
        </div>
      </div>

      <Separator />

      {/* Verified Results */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Verified Results
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {caseStudy.verifiedStats.map((stat, index) => (
            <div 
              key={index}
              className="p-3 rounded-lg bg-card border border-border text-center"
            >
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-lg font-bold text-primary">{stat.change}</div>
              <div className="text-xs text-muted-foreground">
                {stat.before} → {stat.after}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Tools Used */}
      <ToolsUsedSection 
        tools={caseStudy.toolsUsed} 
        onNavigate={onToolNavigate}
      />

      <Separator />

      {/* Testimonial */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          💬 Testimonial
        </h3>
        <blockquote className="border-l-2 border-primary pl-4 italic text-foreground">
          "{caseStudy.testimonialQuote}"
        </blockquote>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span>— {caseStudy.agentName}</span>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-500 text-xs uppercase">Verified</span>
        </div>
      </div>

      <Separator />

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="cta" 
          className="flex-1"
          onClick={onDownload}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Case Study
        </Button>
        <Button 
          variant="cta"
          className="flex-1"
          onClick={onConsultation}
        >
          <Phone className="w-4 h-4 mr-2" />
          Open My Own Case File
        </Button>
      </div>
    </div>
  );
}
