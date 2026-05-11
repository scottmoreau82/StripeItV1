import { Deal, DealStatus } from '../types';

/**
 * StripeItRandomDealSystem
 * Generates realistic random deal data for rapid testing and demonstrations.
 */

const CUSTOMERS = [
  'Liam Johnson', 'Olivia Smith', 'Noah Williams', 'Emma Brown', 
  'James Jones', 'Ava Garcia', 'William Miller', 'Sophia Davis', 
  'Benjamin Rodriguez', 'Isabella Martinez', 'Lucas Hernandez', 'Mia Lopez'
];

const VEHICLES = [
  '2024 Honda Accord', '2021 Toyota Camry', '2023 Ford Explorer', 
  '2022 Chevrolet Silverado', '2024 Honda CR-V', '2020 Jeep Grand Cherokee',
  '2024 Toyota RAV4', '2021 Nissan Rogue', '2023 Hyundai Tucson', '2022 Kia Telluride'
];

export const randomDealService = {
  generateRandomDeal(): Partial<Deal> {
    const isNew = Math.random() > 0.5;
    const frontGross = Math.floor(Math.random() * 4000) + 500;
    const backGross = Math.floor(Math.random() * 2500) + 200;
    const isSplit = Math.random() > 0.8;
    
    const statuses = [DealStatus.SUBMITTED, DealStatus.FINALIZED, DealStatus.DRAFT];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      customerName: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
      purchasedVehicle: VEHICLES[Math.floor(Math.random() * VEHICLES.length)],
      stockNumber: `${isNew ? 'N' : 'U'}${Math.floor(Math.random() * 9000) + 1000}`,
      newOrUsed: isNew ? 'new' : 'used',
      frontEndGross: frontGross,
      backEndGross: backGross,
      isSplitDeal: isSplit,
      splitPercentage: isSplit ? 50 : undefined,
      status: randomStatus,
      date: new Date().toISOString().split('T')[0],
      dealNumber: `X-${Math.floor(Math.random() * 10000)}`
    };
  }
};
