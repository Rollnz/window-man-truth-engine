import { CheckCircle2, Phone, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/navigation';
import type { EstimateFormData } from '../EstimateSlidePanel';

interface SuccessStepProps {
  formData: EstimateFormData;
  onClose: () => void;
  onCallNow: () => void;
}

export function SuccessStep({ formData, onClose, onCallNow }: SuccessStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
      </div>

      {/* Success Message */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">
          Thank You, {formData.name.split(' ')[0]}!
        </h3>
        <p className="text-muted-foreground">
          Your estimate request has been submitted successfully. 
          We'll review your project details and get back to you within 24 hours.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-secondary/30 border border-border rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Request Summary
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Windows:</span>
            <span className="font-medium">{formData.windowCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Project:</span>
            <span className="font-medium capitalize">
              {formData.projectType.replace(/-/g, ' ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Timeline:</span>
            <span className="font-medium capitalize">
              {formData.timeline.replace(/-/g, ' ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location:</span>
            <span className="font-medium">
              {formData.city}, {formData.state}
            </span>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          What's Next?
        </h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <span>We'll review your project and prepare a detailed estimate</span>
          </li>
          <li className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <span>A specialist will reach out within 24 hours</span>
          </li>
        </ul>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        {/* Urgent? Call Now */}
        <Button 
          onClick={onCallNow}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <Phone className="mr-2 h-4 w-4" />
          Can't Wait? Call Now
        </Button>

        {/* Continue Exploring */}
        <Button 
          asChild
          variant="ghost"
          className="w-full"
          onClick={onClose}
        >
          <Link to={ROUTES.TOOLS}>
            Explore Our Tools
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Close Button */}
      <Button 
        onClick={onClose}
        variant="link"
        className="w-full text-muted-foreground"
      >
        Close
      </Button>
    </div>
  );
}
