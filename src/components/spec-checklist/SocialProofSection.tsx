import React from 'react';
import { Quote, MapPin } from 'lucide-react';
import { testimonials } from '@/data/specChecklistData';

const SocialProofSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Homeowners Who Used This System Before Signing
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <div 
              key={i} 
              className="bg-background rounded-xl p-6 border border-border hover:border-primary/30 transition-colors"
            >
              <Quote className="w-8 h-8 text-primary/30 mb-4" />
              <p className="text-foreground leading-relaxed mb-6 text-sm">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">{testimonial.author}</span>
                <span className="text-muted-foreground">•</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {testimonial.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
