import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Upload, Eye, HelpCircle, CheckCircle } from 'lucide-react';
import { ClaimDocument } from '@/data/claimSurvivalData';

interface DocumentCardProps {
  document: ClaimDocument;
  index: number;
  isChecked: boolean;
  hasFile: boolean;
  onCheckboxToggle: (checked: boolean) => void;
  onUploadClick: () => void;
  onViewDocument: () => void;
}

export function DocumentCard({
  document,
  index,
  isChecked,
  hasFile,
  onCheckboxToggle,
  onUploadClick,
  onViewDocument,
}: DocumentCardProps) {
  const Icon = document.icon;

  return (
    <Card className={`p-4 md:p-6 transition-all duration-200 ${
      isChecked 
        ? 'border-primary/50 bg-primary/5' 
        : 'hover:border-primary/30'
    }`}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div className="pt-1">
          <Checkbox 
            checked={isChecked}
            onCheckedChange={onCheckboxToggle}
            className="h-5 w-5"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isChecked ? 'bg-primary/20' : 'bg-muted'}`}>
                <Icon className={`w-5 h-5 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{index}
                  </Badge>
                  {hasFile && (
                    <Badge className="bg-primary/20 text-primary border-0 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
                <h3 className={`font-semibold mt-1 ${isChecked ? 'text-primary' : ''}`}>
                  {document.title}
                </h3>
              </div>
            </div>

            {/* Helper Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">{document.helperTip}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">What it proves: </span>
              <span>{document.whatItProves}</span>
            </div>
            <div>
              <span className="text-destructive font-medium">Why claims fail: </span>
              <span className="text-muted-foreground">{document.whyClaimsFail}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            {hasFile ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onViewDocument}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Document
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onUploadClick}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              {document.acceptedFormats.join(', ')}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
