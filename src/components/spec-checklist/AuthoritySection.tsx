import React from 'react';
import { FileWarning, Scale, Users } from 'lucide-react';
import { authorityColumns } from '@/data/specChecklistData';

const icons = [FileWarning, Scale, Users];

const AuthoritySection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why Window Guy Created This System
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We've watched Florida homeowners lose tens of thousands of dollars to preventable contract failures. This audit system is how professional project managers maintain control — now available to homeowners.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {authorityColumns.map((column, i) => {
            const Icon = icons[i];
            return (
              <div key={i} className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{column.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {column.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AuthoritySection;
