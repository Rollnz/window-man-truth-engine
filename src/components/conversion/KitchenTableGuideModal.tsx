import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { useLeadFormSubmit } from '@/hooks/useLeadFormSubmit';
import { ROUTES } from '@/config/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { trackModalOpen } from '@/lib/gtm';

interface KitchenTableGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function KitchenTableGuideModal({ isOpen, onClose, onSuccess }: KitchenTableGuideModalProps) {
  const {
    values,
    getFieldProps,
    hasError,
    getError,
    validateAll
  } = useFormValidation({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    schemas: {
      firstName: commonSchemas.firstName,
      email: commonSchemas.email
    }
  });

  const {
    submit,
    isSubmitting
  } = useLeadFormSubmit({
    sourceTool: 'kitchen-table-guide',
    formLocation: 'modal',
    leadScore: 40,
    redirectTo: ROUTES.QUOTE_SCANNER,
    successTitle: 'Guide Unlocked!',
    successDescription: 'Check your inbox - the guide is on its way.'
  });

  // Track modal open
  useEffect(() => {
    if (isOpen) {
      trackModalOpen({ modalName: 'kitchen_table_guide', sourceTool: 'kitchen-table-guide' });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    
    const success = await submit({
      email: values.email,
      name: `${values.firstName}${values.lastName ? ' ' + values.lastName : ''}`,
      phone: values.phone || undefined
    });

    if (success) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[500px] p-0 overflow-hidden border-0"
        style={{ 
          background: 'linear-gradient(135deg, #d0e4f7 0%, #73b1e7 16%, #0a77d5 34%, #539fe1 61%, #539fe1 61%, #87bcea 100%)'
        }}
      >
        <div className="p-6">
          <div 
            className="rounded-xl p-6 sm:p-8 ring-1 ring-white/30"
            style={{ 
              background: 'radial-gradient(ellipse at center, #e2bbb7 0%, #f0d5d2 25%, #ffffff 60%, #ffffff 100%)',
              boxShadow: '0 35px 60px -15px rgba(0, 0, 0, 0.35), 0 20px 25px -10px rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            {/* Form Title */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Kitchen Table Defense Kit</h2>
              <p className="text-sm text-slate-600 mt-1">Free PDF • Instant Access</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: First Name | Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input 
                    id="modal-firstName" 
                    {...getFieldProps('firstName')} 
                    placeholder="First name" 
                    className={`bg-white border border-black focus:border-primary focus:outline-none transition-all duration-300 ${hasError('firstName') ? 'border-destructive' : ''}`}
                    style={{ boxShadow: 'none' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(57, 147, 221, 0.25), 0 0 20px rgba(57, 147, 221, 0.15)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    disabled={isSubmitting} 
                    autoComplete="given-name" 
                  />
                  {hasError('firstName') && <p className="text-xs text-destructive mt-1">{getError('firstName')}</p>}
                </div>
                <div>
                  <Input 
                    id="modal-lastName" 
                    {...getFieldProps('lastName')} 
                    placeholder="Last name" 
                    className="bg-white border border-black focus:border-primary focus:outline-none transition-all duration-300"
                    style={{ boxShadow: 'none' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(57, 147, 221, 0.25), 0 0 20px rgba(57, 147, 221, 0.15)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    disabled={isSubmitting} 
                    autoComplete="family-name" 
                  />
                </div>
              </div>
              
              {/* Row 2: Email | Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input 
                    id="modal-email" 
                    type="email" 
                    {...getFieldProps('email')} 
                    placeholder="Email address" 
                    className={`bg-white border border-black focus:border-primary focus:outline-none transition-all duration-300 ${hasError('email') ? 'border-destructive' : ''}`}
                    style={{ boxShadow: 'none' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(57, 147, 221, 0.25), 0 0 20px rgba(57, 147, 221, 0.15)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    disabled={isSubmitting} 
                    autoComplete="email" 
                  />
                  {hasError('email') && <p className="text-xs text-destructive mt-1">{getError('email')}</p>}
                </div>
                <div>
                  <Input 
                    id="modal-phone" 
                    type="tel" 
                    {...getFieldProps('phone')} 
                    placeholder="Phone" 
                    className="bg-white border border-black placeholder:text-slate-500 focus:border-primary focus:outline-none transition-all duration-300"
                    style={{ boxShadow: 'none' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(57, 147, 221, 0.25), 0 0 20px rgba(57, 147, 221, 0.15)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    disabled={isSubmitting} 
                    autoComplete="tel" 
                  />
                </div>
              </div>
              
              <Button type="submit" variant="cta" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Me the Guide'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </Button>
              
              <p className="text-xs text-black text-center">
                We'll also save this to your private Windowman Vault.
              </p>
            </form>

            <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-slate-200 text-xs text-black">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> No Spam
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> No Sales Calls
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> No Contractor Handoff
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
