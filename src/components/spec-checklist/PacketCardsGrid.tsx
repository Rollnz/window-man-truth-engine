import React from 'react';
import { CheckCircle2, AlertTriangle, Shield, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { packetData } from '@/data/specChecklistData';
import { trackEvent } from '@/lib/gtm';

const badgeVariants = {
  destructive: 'bg-destructive/10 text-destructive border-destructive/30',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  primary: 'bg-primary/10 text-primary border-primary/30',
  secondary: 'bg-secondary/10 text-secondary-foreground border-secondary/30',
};

const PacketCardsGrid: React.FC = () => {
  const handlePacketExpand = (packetNumber: number) => {
    trackEvent('packet_expanded', { packet_number: packetNumber });
  };

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            The 4-Packet Audit System: Complete Project Control from Contract to Final Payment
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            This isn't just a checklist. It's a sequential verification system that maintains your leverage at every critical decision point.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {packetData.map((packet) => (
            <AccordionItem 
              key={packet.id} 
              value={`packet-${packet.id}`}
              className="border border-border rounded-lg bg-card overflow-hidden"
            >
              <AccordionTrigger 
                className="px-6 py-4 hover:no-underline hover:bg-muted/50"
                onClick={() => handlePacketExpand(packet.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-left w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">{packet.id}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        Packet {packet.id}: {packet.title}
                      </h3>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${badgeVariants[packet.badgeColor]} w-fit text-xs`}
                  >
                    {packet.badge}
                  </Badge>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4 pt-2">
                  {/* Full bullet list */}
                  <div className="space-y-3">
                    {packet.fullBullets.map((bullet, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{bullet}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stop Work Trigger */}
                  {packet.stopTrigger && (
                    <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-destructive text-sm mb-1">Stop Work Trigger:</p>
                          <p className="text-destructive/90">{packet.stopTrigger}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Leverage Note */}
                  {packet.leverageNote && (
                    <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-primary text-sm mb-1">Your Leverage:</p>
                          <p className="text-primary/90">{packet.leverageNote}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default PacketCardsGrid;
