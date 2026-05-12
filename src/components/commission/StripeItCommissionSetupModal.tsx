import React from 'react';
import { Modal } from '../ui/Modal';
import { FullscreenMobileFlow } from '../layout/MobileFullscreenFlow';
import { StripeItCommissionMatrixPanel } from './StripeItCommissionMatrixPanel';
import { PayPlan } from '@/src/types';
import { useResponsive } from '@/src/hooks/useResponsive';

/**
 * StripeItCommissionSetupModal
 * Canonical modal wrapper for the commission matrix setup.
 * Handles both desktop modal and mobile fullscreen flow.
 */

interface StripeItCommissionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<PayPlan> | null;
  onSubmit: (data: Partial<PayPlan>) => Promise<void>;
  isLoading?: boolean;
}

export const StripeItCommissionSetupModal: React.FC<StripeItCommissionSetupModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isLoading
}) => {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <FullscreenMobileFlow
        isOpen={isOpen}
        onClose={onClose}
        title="Commission Matrix"
      >
        <StripeItCommissionMatrixPanel 
          initialData={initialData || {}} 
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </FullscreenMobileFlow>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Commission Matrix"
      className="max-w-5xl"
    >
      <StripeItCommissionMatrixPanel 
        initialData={initialData || {}} 
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </Modal>
  );
};

