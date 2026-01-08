import React from 'react';
import { Clock, ClipboardList, DollarSign, Lock } from 'lucide-react';
import { urgencyBullets } from '@/data/specChecklistData';

const iconMap = {
  clock: Clock,
  clipboard: ClipboardList,
  dollar: DollarSign,
  lock: Lock,
};

const UrgencySection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-destructive/5 border-y border-destructive/20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Download Now — Before Your Next Contractor Meeting
          </h2>
          <p className="text-lg text-muted-foreground">
            Most homeowners discover missing contract protections AFTER they've signed and paid a deposit. At that point, you've lost all leverage.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {urgencyBullets.map((bullet, i) => {
            const Icon = iconMap[bullet.icon as keyof typeof iconMap];
            return (
              <div 
                key={i} 
                className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground">{bullet.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UrgencySection;
