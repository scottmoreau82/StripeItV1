import { Deal } from '../types';

/**
 * StripeItDealValidationSystem
 * Centralized validation logic for car deals.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export const validateDeal = (data: Partial<Deal>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.customerName?.trim()) {
    errors.push({ field: 'customerName', message: 'Customer name is required' });
  }

  if (!data.purchasedVehicle?.trim()) {
    errors.push({ field: 'purchasedVehicle', message: 'Purchased vehicle is required' });
  }

  if (!data.date) {
    errors.push({ field: 'date', message: 'Deal date is required' });
  }

  if (!data.dealNumber?.trim()) {
    errors.push({ field: 'dealNumber', message: 'Deal # is required' });
  }

  if (!data.stockNumber?.trim()) {
    errors.push({ field: 'stockNumber', message: 'Stock # is required' });
  }

  if (!data.newOrUsed) {
    errors.push({ field: 'newOrUsed', message: 'Selection of New or Used is required' });
  }

  if (data.frontEndGross === undefined || data.frontEndGross === null || isNaN(Number(data.frontEndGross))) {
    errors.push({ field: 'frontEndGross', message: 'Front end gross is required' });
  }

  if (data.backEndGross === undefined || data.backEndGross === null || isNaN(Number(data.backEndGross))) {
    errors.push({ field: 'backEndGross', message: 'Back end gross is required' });
  }

  // Conditional Required Fields
  if (data.tradedVehicle === "__REQUIRED_BUT_EMPTY__") {
    errors.push({ field: 'tradedVehicle', message: 'Traded vehicle is required' });
  }

  if (data.isSplitDeal && (!(data as any).splitPartnerName || !(data as any).splitPartnerName.trim())) {
    errors.push({ field: 'splitPartnerName', message: 'Partner name is required' });
  }

  if (data.isSplitDeal && data.splitPercentage !== undefined) {
    if (data.splitPercentage > 100 || data.splitPercentage < 0) {
      errors.push({ field: 'splitPercentage', message: 'Split percentage must be between 0 and 100' });
    }
  }

  return errors;
};
