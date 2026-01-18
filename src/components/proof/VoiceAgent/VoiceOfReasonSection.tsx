import { useState } from 'react';
import { Headphones, Shield, ChevronDown, ChevronUp, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionFrame } from '../SectionFrame';
import { transcripts, topicLabels, type Transcript } from '@/data/proof/proofData';
import { cn } from '@/lib/utils';

interface VoiceOfReasonSectionProps {
  onListenToCall: () => void;
  onSectionView?: (sectionId: string) => void;
  onTranscriptOpen?: (transcriptId: string, topic: string) => void;
  onFilterChange?: (topic: string) => void;
}

/**
 * Render the "Voice of Reason" section with Guardian Mode and a filterable gallery of real conversation transcripts.
 *
 * Renders a positioning block that explains Guardian Mode, topic filter buttons, expandable transcript cards showing excerpts and full transcripts, key phrases, optional homeowner quotes, and a CTA to listen to a real call.
 *
 * @param onListenToCall - Callback invoked when the "Listen to a Real Call" CTA is clicked.
 * @param onSectionView - Optional callback invoked when the section enters the viewport with the section id.
 * @param onTranscriptOpen - Optional callback invoked when a transcript is expanded; receives the transcript id and topic.
 * @param onFilterChange - Optional callback invoked when a non-"all" topic filter is selected; receives the topic.
 * @returns A React element that renders the Voice of Reason section.
 */
export function VoiceOfReasonSection({ 
  onListenToCall, 
  onSectionView,
  onTranscriptOpen,
  onFilterChange,
}: VoiceOfReasonSectionProps) {
  const [activeFilter, setActiveFilter] = useState<Transcript['topic'] | 'all'>('all');
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);

  const filteredTranscripts = activeFilter === 'all' 
    ? transcripts 
    : transcripts.filter(t => t.topic === activeFilter);

  const handleFilterChange = (topic: Transcript['topic'] | 'all') => {
    setActiveFilter(topic);
    if (topic !== 'all') {
      onFilterChange?.(topic);
    }
  };

  const handleTranscriptToggle = (transcript: Transcript) => {
    const isExpanding = expandedTranscript !== transcript.id;
    setExpandedTranscript(isExpanding ? transcript.id : null);
    
    if (isExpanding) {
      onTranscriptOpen?.(transcript.id, transcript.topic);
    }
  };

  return (
    <SectionFrame
      id="voice-agent"
      eyebrow="The Voice of Reason"
      title={
        <>
          Meet the Window Man <span className="text-primary">AI Voice Agent</span>
        </>
      }
      subtitle="Sales-Free Expertise, On Demand"
      onInView={onSectionView}
    >
      {/* Guardian Positioning Block */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <Badge variant="outline" className="text-primary border-primary/30">
            Guardian Mode
          </Badge>
        </div>
        
        <div className="text-center space-y-4 mb-8">
          <p className="text-lg">
            This is <strong>not</strong> a chatbot.<br />
            It does <strong>not</strong> sell.<br />
            It does <strong>not</strong> push contractors.
          </p>
          <p className="text-muted-foreground">
            It functions as a <strong className="text-foreground">guardian-analyst</strong>—trained on 
            Florida codes, window engineering, and real pricing data.
          </p>
        </div>

        {/* What homeowners use it for */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            'Ask technical questions without pressure',
            'Validate what contractors claim verbally',
            'Understand why a spec matters before signing',
          ].map((item, i) => (
            <div 
              key={i}
              className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20"
            >
              <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transcript Gallery */}
      <div className="max-w-4xl mx-auto mb-12">
        <h3 className="text-xl font-semibold mb-6 text-center">
          Conversation Transcript Gallery
        </h3>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('all')}
          >
            All Topics
          </Button>
          {(Object.keys(topicLabels) as Transcript['topic'][]).map((topic) => (
            <Button
              key={topic}
              variant={activeFilter === topic ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(topic)}
            >
              {topicLabels[topic]}
            </Button>
          ))}
        </div>

        {/* Transcript Cards */}
        <div className="space-y-4">
          {filteredTranscripts.map((transcript, index) => (
            <Card 
              key={transcript.id}
              className={cn(
                'overflow-hidden transition-all duration-300',
                'hover:border-primary/30',
                expandedTranscript === transcript.id && 'border-primary/50'
              )}
              style={{
                animationDelay: `${index * 60}ms`,
              }}
            >
              <CardContent className="p-0">
                {/* Header - Always visible */}
                <button
                  className="w-full p-4 flex items-start gap-4 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => handleTranscriptToggle(transcript)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{transcript.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {topicLabels[transcript.topic]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {transcript.excerpt}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {transcript.county}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {expandedTranscript === transcript.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedTranscript === transcript.id && (
                  <div className="px-4 pb-4 border-t border-border">
                    {/* Full Transcript */}
                    <div className="mt-4 p-4 rounded-lg bg-muted/30 font-mono text-sm whitespace-pre-wrap">
                      {transcript.fullTranscript.split('\n\n').map((paragraph, i) => {
                        const isAI = paragraph.startsWith('AI Agent:');
                        const isHomeowner = paragraph.startsWith('Homeowner:');
                        
                        return (
                          <p 
                            key={i} 
                            className={cn(
                              'mb-4 last:mb-0',
                              isAI && 'pl-4 border-l-2 border-primary',
                              isHomeowner && 'pl-4 border-l-2 border-muted-foreground/30'
                            )}
                          >
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>

                    {/* Key Phrases */}
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Key phrases identified:</p>
                      <div className="flex flex-wrap gap-2">
                        {transcript.keyPhrases.map((phrase, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {phrase}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Homeowner Quote */}
                    {transcript.homeownerQuote && (
                      <blockquote className="mt-4 p-4 rounded-lg bg-primary/5 border-l-4 border-primary italic">
                        "{transcript.homeownerQuote}"
                        <footer className="mt-2 text-sm text-muted-foreground not-italic">
                          — {transcript.county} homeowner
                        </footer>
                      </blockquote>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button 
          size="lg" 
          onClick={onListenToCall}
          className="gap-2"
        >
          <Phone className="w-5 h-5" />
          Listen to a Real Call
        </Button>
      </div>
    </SectionFrame>
  );
}