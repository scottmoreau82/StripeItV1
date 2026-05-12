import { Deal, DealStatus, PayPlan } from '../types';
import { calculateDealCommission } from '../lib/commissionLogic';

/**
 * StripeItExportSystem
 * Handles the transformation of structured dealership data into portable formats.
 */

export const exportService = {
  /**
   * Generates a CSV string from an array of objects.
   */
  generateCSV(data: any[], headers: { key: string; label: string }[]): string {
    if (!data || data.length === 0) return '';

    const headerRow = headers.map(h => `"${h.label}"`).join(',');
    const rows = data.map(row => {
      return headers.map(h => {
        const value = h.key.split('.').reduce((obj, key) => obj?.[key], row);
        const formattedValue = value === null || value === undefined ? '' : value;
        // Escape quotes and wrap in quotes
        return `"${String(formattedValue).replace(/"/g, '""')}"`;
      }).join(',');
    });

    return [headerRow, ...rows].join('\n');
  },

  /**
   * Triggers a browser download of a CSV file.
   */
  downloadCSV(csvContent: string, fileName: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  /**
   * Standardize deal data for export.
   */
  prepareDealExportData(deals: Deal[], payPlan?: PayPlan | null) {
    return deals.map(deal => {
      const commission = payPlan ? calculateDealCommission(deal, payPlan, deals) : null;
      const splitRatio = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;
      
      return {
        date: deal.date,
        customer: deal.customerName,
        vehicle: deal.purchasedVehicle,
        stock: deal.stockNumber || '',
        condition: deal.newOrUsed.toUpperCase(),
        status: deal.status,
        frontGross: deal.frontEndGross * splitRatio,
        backGross: deal.backEndGross * splitRatio,
        totalGross: (deal.frontEndGross + deal.backEndGross) * splitRatio,
        estCommission: commission ? commission.finalPayout : 0,
        isSplit: deal.isSplitDeal ? `YES (${deal.splitPercentage || 50}%)` : 'NO'
      };
    });
  }
};
