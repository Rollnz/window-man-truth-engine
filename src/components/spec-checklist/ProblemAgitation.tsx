import React from 'react';
import { X } from 'lucide-react';
import { problemBullets, problemClosing } from '@/data/specChecklistData';

const ProblemAgitation: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-card">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why Homeowners Lose Control of Their Window Projects
          </h2>
          <p className="text-lg text-muted-foreground">
            Most contracts are designed to protect the contractor, not you. Here's what gets buried in the fine print:
          </p>
        </div>
        
        <div className="space-y-4 mb-8">
          {problemBullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-foreground leading-relaxed">{bullet.text}</p>
            </div>
          ))}
        </div>

        <div className="bg-muted border border-border rounded-lg p-6">
          <p className="text-foreground leading-relaxed font-medium">
            {problemClosing}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemAgitation;
