import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { FullscreenMobileFlow } from '../layout/MobileFullscreenFlow';
import { DealerDealForm } from '../forms/DealerDealForm';
import { Button } from '../ui/Button';
import { DealerDeal } from '@/src/types';
import { dealerService } from '@/src/services/dealerService';
import { useAuth } from '@/src/contexts/AuthContext';
import { useResponsive } from '@/src/hooks/useResponsive';

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

  const handleSubmit = async (data: Partial<DealerDeal>) => {
    if (!profile?.orgId || !user?.uid) return;
    
    setIsSubmitting(true);
    try {
      await dealerService.saveDeal(profile.orgId, user.uid, data);
      setIsSubmitting(false);
      window.dispatchEvent(new CustomEvent('stripeit:dealer-deal-saved'));
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
       console.error("Dealer Log Deal Error:", error);
       setIsSubmitting(false);
    }
  };

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
          <DealerDealForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        </div>
      </FullscreenMobileFlow>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dealer Deal Entry"
      maxWidth="max-w-2xl"
    >
      <DealerDealForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      <div className="mt-8">
        {footer}
      </div>
    </Modal>
  );
};
