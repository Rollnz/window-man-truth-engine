import { useState } from 'react';
import { Facebook, Instagram, Linkedin, ExternalLink, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SocialSearchButtonsProps {
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  verifiedUrl: string | null;
  onSaveUrl: (url: string) => Promise<boolean>;
}

export function SocialSearchButtons({
  firstName,
  lastName,
  city,
  verifiedUrl,
  onSaveUrl,
}: SocialSearchButtonsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState(verifiedUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const buildSearchQuery = (site: string) => {
    const name = [firstName, lastName].filter(Boolean).join(' ');
    const location = city || 'Florida';
    return `https://www.google.com/search?q=site:${site}+${encodeURIComponent(name)}+${encodeURIComponent(location)}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSaveUrl(urlInput);
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const socialNetworks = [
    { name: 'Facebook', icon: Facebook, site: 'facebook.com', color: 'hover:text-blue-600' },
    { name: 'Instagram', icon: Instagram, site: 'instagram.com', color: 'hover:text-pink-500' },
    { name: 'LinkedIn', icon: Linkedin, site: 'linkedin.com', color: 'hover:text-blue-700' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Social Research
        </span>
      </div>

      {/* Search Buttons */}
      <div className="flex gap-2">
        {socialNetworks.map(({ name, icon: Icon, site, color }) => (
          <Tooltip key={name}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={color}
                onClick={() => window.open(buildSearchQuery(site), '_blank')}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search for this lead on {name}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Verified Profile */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Verified Social Profile</span>
        {verifiedUrl && !isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-start text-left truncate"
              onClick={() => window.open(verifiedUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-2 flex-shrink-0" />
              <span className="truncate">{verifiedUrl}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <span className="sr-only">Edit</span>
              ✏️
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Paste verified profile URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="text-xs"
            />
            <Button
              variant="default"
              size="icon"
              onClick={handleSave}
              disabled={isSaving || !urlInput.trim()}
            >
              <Save className="h-4 w-4" />
            </Button>
            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsEditing(false);
                  setUrlInput(verifiedUrl || '');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
