import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { FullscreenMobileFlow } from '../layout/MobileFullscreenFlow';
import { DealerDealForm } from '../forms/DealerDealForm';
import { Button } from '../ui/Button';
import { DealerDeal, LogField } from '@/src/types';
import { dealerService } from '@/src/services/dealerService';
import { organizationService } from '@/src/services/organizationService';
import { useAuth } from '@/src/contexts/AuthContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { getFriendlyErrorMessage } from '@/src/lib/firebase';
import { AlertCircle } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { DEFAULT_LOG_FIELDS } from '@/src/constants';

/**
 * DealerLogDealModal
 * Orchestrates the dealer deal entry workflow.
 */
interface DealerLogDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DealerLogDealModal: React.FC<DealerLogDealModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { profile, user } = useAuth();
  const { isMobile } = useResponsive();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<LogField[]>(DEFAULT_LOG_FIELDS);

  // Load organization log configuration
  useEffect(() => {
    const loadConfig = async () => {
      if (!isOpen || !profile?.orgId) return;
      try {
        const org = await organizationService.getOrganization(profile.orgId);
        if (org?.logConfig?.fields) {
          setFields(org.logConfig.fields.sort((a, b) => a.order - b.order));
        } else {
          setFields(DEFAULT_LOG_FIELDS);
        }
      } catch (err) {
        console.error("Failed to load log config:", err);
      }
    };
    loadConfig();
  }, [isOpen, profile?.orgId]);

  const handleSubmit = async (data: Partial<DealerDeal>) => {
    if (!profile?.orgId || !user?.uid) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await dealerService.saveDeal(profile.orgId, user.uid, data);
      setIsSubmitting(false);
      window.dispatchEvent(new CustomEvent('stripeit:dealer-deal-saved'));
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
       console.error("Dealer Log Deal Error:", err);
       setError(getFriendlyErrorMessage(err));
       setIsSubmitting(false);
    }
  };

  const errorBanner = error && (
    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
      <div>
        <Typography variant="label" className="text-red-100 font-bold block mb-1 uppercase tracking-wider text-[10px]">
          Operational Failure
        </Typography>
        <Typography variant="small" className="text-red-200/70">
          {error}
        </Typography>
      </div>
    </div>
  );

  const footer = (
    <div className="flex gap-4">
      <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button 
        form="dealer-deal-form" 
        type="submit" 
        className="flex-1 shadow-glow glow-primary" 
        isLoading={isSubmitting}
      >
        Log Deal
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <FullscreenMobileFlow
        isOpen={isOpen}
        onClose={onClose}
        title="Log Dealer Deal"
        footer={footer}
      >
        <div className="p-4">
          {errorBanner}
          <DealerDealForm fields={fields} onSubmit={handleSubmit} isLoading={isSubmitting} />
        </div>
      </FullscreenMobileFlow>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dealer Deal Entry"
      maxWidth="max-w-4xl"
    >
      <div className="p-1">
        {errorBanner}
        <DealerDealForm fields={fields} onSubmit={handleSubmit} isLoading={isSubmitting} />
      </div>
      <div className="mt-8">
        {footer}
      </div>
    </Modal>
  );
};
