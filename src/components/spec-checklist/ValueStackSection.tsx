import React from 'react';
import { CheckCircle2, Gift } from 'lucide-react';
import { valueStackItems } from '@/data/specChecklistData';

const ValueStackSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-card">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            What You're Getting (Complete Package)
          </h2>
        </div>

        <div className="bg-background rounded-xl p-6 sm:p-8 border border-border">
          <div className="space-y-4 mb-8">
            {valueStackItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Complete Value</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <span className="text-lg text-muted-foreground line-through">Estimated Value: $197</span>
              <span className="text-2xl font-bold text-primary">Your Price: Free</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueStackSection;
