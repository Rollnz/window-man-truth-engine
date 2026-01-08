import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { objectionColumns, objectionClosing } from '@/data/specChecklistData';

const ObjectionHandling: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            But Won't This Make Contractors Angry?
          </h2>
          <p className="text-lg text-muted-foreground">
            Here's what actually happens when you show up with professional documentation standards:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Professional Column */}
          <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              {objectionColumns.professional.title}
            </h3>
            <div className="space-y-3">
              {objectionColumns.professional.items.map((item, i) => (
                <p key={i} className="text-foreground text-sm pl-7">
                  {item}
                </p>
              ))}
            </div>
          </div>

          {/* Problematic Column */}
          <div className="bg-destructive/5 rounded-xl p-6 border border-destructive/20">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              {objectionColumns.problematic.title}
            </h3>
            <div className="space-y-3">
              {objectionColumns.problematic.items.map((item, i) => (
                <p key={i} className="text-foreground text-sm pl-7">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-muted border border-border rounded-lg p-6 text-center">
          <p className="text-foreground font-medium text-lg">
            {objectionClosing}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjectionHandling;
