import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { REVIEW_BOARD } from "@/config/expertIdentity";
import { cn } from "@/lib/utils";

interface ReviewedByBadgeProps {
  variant?: "default" | "compact" | "inline";
  className?: string;
  showCredentials?: boolean;
}

export function ReviewedByBadge({ 
  variant = "default", 
  className,
  showCredentials = true 
}: ReviewedByBadgeProps) {
  if (variant === "inline") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}>
        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        <span>Reviewed by {REVIEW_BOARD.name}</span>
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg",
        className
      )}>
        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm text-foreground">
          Reviewed by <span className="font-medium">{REVIEW_BOARD.name}</span>
        </span>
      </div>
    );
  }

  // Default variant - full badge with credentials
  return (
    <div className={cn(
      "bg-gradient-to-br from-primary/5 via-background to-primary/10 border border-primary/20 rounded-xl p-6",
      className
    )}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Expert Verified
            </span>
          </div>
          
          <h4 className="text-lg font-bold text-foreground mb-1">
            {REVIEW_BOARD.name}
          </h4>
          
          <p className="text-sm text-muted-foreground mb-3">
            {REVIEW_BOARD.jobTitle}
          </p>
          
          {showCredentials && (
            <ul className="space-y-1.5">
              {REVIEW_BOARD.credentials.map((credential, index) => (
                <li 
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {credential}
                </li>
              ))}
            </ul>
          )}
          
          <Link 
            to="/about" 
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            Learn about our review process →
          </Link>
        </div>
      </div>
    </div>
  );
}
