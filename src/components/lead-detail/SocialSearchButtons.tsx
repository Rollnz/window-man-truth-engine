import { useState } from 'react';
import { Facebook, Instagram, Linkedin, ExternalLink, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface SocialSearchButtonsProps {
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  onSaveProfile: (platform: 'facebook' | 'instagram', url: string | null) => Promise<boolean>;
}

// Domain allowlists for frontend validation
const FB_HOSTS = new Set(['facebook.com', 'm.facebook.com', 'www.facebook.com']);
const IG_HOSTS = new Set(['instagram.com', 'www.instagram.com']);

function validateSocialUrl(platform: 'facebook' | 'instagram', raw: string): { ok: true; url: string } | { ok: false; error: string } {
  let urlStr = raw.trim();
  if (!urlStr) return { ok: false, error: 'URL cannot be empty' };

  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { ok: false, error: 'Invalid URL format' };
  }

  const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
  const allowedHosts = platform === 'facebook' ? FB_HOSTS : IG_HOSTS;
  const hostWithWww = parsed.hostname.toLowerCase();

  if (!allowedHosts.has(host) && !allowedHosts.has(hostWithWww)) {
    const platformName = platform === 'facebook' ? 'Facebook (facebook.com)' : 'Instagram (instagram.com)';
    return { ok: false, error: `URL must be on ${platformName}` };
  }

  return { ok: true, url: urlStr };
}

export function SocialSearchButtons({
  firstName,
  lastName,
  city,
  facebookUrl,
  instagramUrl,
  onSaveProfile,
}: SocialSearchButtonsProps) {
  const [fbInput, setFbInput] = useState('');
  const [igInput, setIgInput] = useState('');
  const [isSaving, setIsSaving] = useState<'facebook' | 'instagram' | null>(null);

  const searchQuery = (() => {
    const name = [firstName, lastName].filter(Boolean).join(' ');
    const location = city || 'Florida';
    return [name, location].filter(Boolean).join(' ');
  })();

  const handleSocialClick = (platform: 'facebook' | 'instagram' | 'linkedin') => {
    let url = '';
    const hasVerified = platform === 'facebook' ? !!facebookUrl : platform === 'instagram' ? !!instagramUrl : false;

    if (platform === 'facebook') {
      url = facebookUrl || `https://www.facebook.com/search/top/?q=${encodeURIComponent(searchQuery)}`;
    } else if (platform === 'instagram') {
      url = instagramUrl || `https://www.google.com/search?q=${encodeURIComponent('site:instagram.com ' + searchQuery)}`;
    } else {
      url = `https://www.google.com/search?q=${encodeURIComponent('site:linkedin.com/in ' + searchQuery)}`;
    }

    window.open(url, '_blank');
  };

  const handleSave = async (platform: 'facebook' | 'instagram') => {
    const raw = platform === 'facebook' ? fbInput : igInput;
    const validation = validateSocialUrl(platform, raw);

    if (!validation.ok) {
      toast.error((validation as { ok: false; error: string }).error);
      return;
    }

    setIsSaving(platform);
    const success = await onSaveProfile(platform, validation.url);
    setIsSaving(null);

    if (success) {
      if (platform === 'facebook') setFbInput('');
      else setIgInput('');
    }
  };

  const handleClear = async (platform: 'facebook' | 'instagram') => {
    setIsSaving(platform);
    await onSaveProfile(platform, null);
    setIsSaving(null);
  };

  const socialButtons = [
    {
      name: 'Facebook',
      platform: 'facebook' as const,
      icon: Facebook,
      hasUrl: !!facebookUrl,
      tooltip: facebookUrl ? 'View saved profile' : 'Search Facebook',
    },
    {
      name: 'Instagram',
      platform: 'instagram' as const,
      icon: Instagram,
      hasUrl: !!instagramUrl,
      tooltip: instagramUrl ? 'View saved profile' : 'Search Instagram (Google)',
    },
    {
      name: 'LinkedIn',
      platform: 'linkedin' as const,
      icon: Linkedin,
      hasUrl: false,
      tooltip: 'Search LinkedIn (Google)',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Social Research
        </span>
      </div>

      {/* Search / Direct-link Buttons */}
      <div className="flex gap-2">
        {socialButtons.map(({ name, platform, icon: Icon, hasUrl, tooltip }) => (
          <Tooltip key={name}>
            <TooltipTrigger asChild>
              <Button
                variant={hasUrl ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleSocialClick(platform)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Per-platform URL save/clear */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Save Verified Profiles</span>

        {/* Facebook URL */}
        <div className="space-y-1">
          {facebookUrl ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-start text-left truncate"
                onClick={() => window.open(facebookUrl, '_blank')}
              >
                <Facebook className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">{facebookUrl}</span>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleClear('facebook')}
                    disabled={isSaving === 'facebook'}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear Facebook URL</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex gap-1">
              <Input
                placeholder="facebook.com/profile..."
                value={fbInput}
                onChange={(e) => setFbInput(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleSave('facebook')}
                disabled={isSaving === 'facebook' || !fbInput.trim()}
              >
                <Save className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Instagram URL */}
        <div className="space-y-1">
          {instagramUrl ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-start text-left truncate"
                onClick={() => window.open(instagramUrl, '_blank')}
              >
                <Instagram className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">{instagramUrl}</span>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleClear('instagram')}
                    disabled={isSaving === 'instagram'}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear Instagram URL</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex gap-1">
              <Input
                placeholder="instagram.com/username..."
                value={igInput}
                onChange={(e) => setIgInput(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleSave('instagram')}
                disabled={isSaving === 'instagram' || !igInput.trim()}
              >
                <Save className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
