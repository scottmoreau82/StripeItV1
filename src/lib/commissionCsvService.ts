import { 
  PayPlan, 
  PayPlanRule, 
  PayPlanTier, 
  VolumeBonus, 
  VolumeBonusType, 
  VolumeBonusScope, 
  VolumeBonusFilter, 
  MiniLadderTier, 
  CustomMini, 
  HourlyConfig, 
  HourlyPayoutModel,
  SubscriptionTier
} from '../types';

/**
 * StripeItCommissionCsvService
 * Handles conversion between PayPlan object and CSV string for the Commission Architect.
 */

// CSV Headers for the generic row format
const CSV_HEADER = ['Type', 'ID', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'].join(',');

export const commissionCsvService = {
  /**
   * Serializes a PayPlan to a multi-section CSV string
   */
  exportToCsv(plan: Partial<PayPlan>): string {
    const rows: string[] = [CSV_HEADER];

    // 1. METADATA
    rows.push(['METADATA', 'plan', 
      plan.name || '', 
      plan.frontEndPercentage || 0, 
      plan.backEndPercentage || 0, 
      plan.miniAmount || 0, 
      plan.flatPerUnitAmount || 0, 
      plan.splitDealBehavior || 'standard', 
      plan.isAdvanced || false,
      plan.schemaVersion || '1.0',
      plan.frontDeficitRecoveryEnabled || false
    ].join(','));

    // 2. TIER (Matrix)
    if (plan.tiers) {
      plan.tiers.forEach(t => {
        rows.push(['TIER', t.id, 
          t.threshold ?? '', 
          t.maxUnits ?? '', 
          t.frontRate ?? '', 
          t.backRate ?? '', 
          t.bonusAmount || 0, 
          t.perUnitBonus || 0, 
          t.isRetroactive || false,
          t.frontRetroactive || false,
          t.backRetroactive || false
        ].join(','));
      });
    }

    // 3. RULE
    if (plan.rules) {
      plan.rules.forEach(r => {
        rows.push(['RULE', r.id, 
          r.name, 
          r.condition, 
          r.operator, 
          r.threshold, 
          r.rewardType, 
          r.rewardValue, 
          r.active
        ].join(','));
      });
    }

    // 4. VOLUME_BONUS
    if (plan.volumeBonuses) {
      plan.volumeBonuses.forEach(b => {
        rows.push(['VOLUME_BONUS', b.id, 
          b.threshold, 
          b.amount, 
          b.type, 
          b.scope, 
          b.filter, 
          b.active,
          b.notes || ''
        ].join(','));
      });
    }

    // 5. MINI_TIER
    if (plan.miniTiers) {
      plan.miniTiers.forEach(t => {
        rows.push(['MINI_TIER', t.id, 
          t.threshold ?? '', 
          t.maxUnits ?? '', 
          t.newMini, 
          t.usedMini, 
          t.isRetroactive, 
          t.active
        ].join(','));
      });
    }

    // 6. CUSTOM_MINI
    if (plan.customMinis) {
      plan.customMinis.forEach(m => {
        rows.push(['CUSTOM_MINI', m.id, 
          m.label, 
          m.amount, 
          m.active, 
          m.filter
        ].join(','));
      });
    }

    // 7. HOURLY
    if (plan.hourlyConfig) {
      const h = plan.hourlyConfig;
      rows.push(['HOURLY', 'config', 
        h.active, 
        h.rate, 
        h.hoursWorked, 
        h.model
      ].join(','));
    }

    // 8. FLAGS
    rows.push(['FLAGS', 'config',
      plan.isRulesEnabled || false,
      plan.isVolumeBonusActive || false,
      plan.isVolumeBonusEngineActive || false,
      plan.isSplitBehaviorActive || false,
      plan.isFlatPerUnitActive || false,
      plan.isMinisAndHourlyActive || false,
      plan.isMinisActive || false,
      plan.isHourlyActive || false
    ].join(','));

    return rows.join('\n');
  },

  /**
   * Parses a CSV string back into a partial PayPlan object
   */
  parseCsv(csv: string): Partial<PayPlan> {
    const lines = csv.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) throw new Error('Invalid CSV: No data found.');

    const header = lines[0].split(',');
    if (header[0] !== 'Type' || header[1] !== 'ID') {
      throw new Error('Invalid CSV: Header mismatch.');
    }

    const plan: Partial<PayPlan> = {
      tiers: [],
      rules: [],
      volumeBonuses: [],
      miniTiers: [],
      customMinis: []
    };

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const type = cols[0];

      switch (type) {
        case 'METADATA':
          plan.name = cols[2];
          plan.frontEndPercentage = parseFloat(cols[3]) || 0;
          plan.backEndPercentage = parseFloat(cols[4]) || 0;
          plan.miniAmount = parseFloat(cols[5]) || 0;
          plan.flatPerUnitAmount = parseFloat(cols[6]) || 0;
          plan.splitDealBehavior = cols[7] as any;
          plan.isAdvanced = cols[8] === 'true';
          plan.schemaVersion = cols[9];
          plan.frontDeficitRecoveryEnabled = cols[10] === 'true';
          break;

        case 'TIER':
          plan.tiers?.push({
            id: cols[1] || crypto.randomUUID(),
            threshold: cols[2] === '' ? undefined : parseFloat(cols[2]),
            maxUnits: cols[3] === '' ? undefined : parseFloat(cols[3]),
            frontRate: cols[4] === '' ? undefined : parseFloat(cols[4]),
            backRate: cols[5] === '' ? undefined : parseFloat(cols[5]),
            bonusAmount: parseFloat(cols[6]) || 0,
            perUnitBonus: parseFloat(cols[7]) || 0,
            isRetroactive: cols[8] === 'true',
            frontRetroactive: cols[9] === 'true',
            backRetroactive: cols[10] === 'true'
          });
          break;

        case 'RULE':
          plan.rules?.push({
            id: cols[1] || crypto.randomUUID(),
            name: cols[2],
            condition: cols[3] as any,
            operator: cols[4] as any,
            threshold: parseFloat(cols[5]) || 0,
            rewardType: cols[6] as any,
            rewardValue: parseFloat(cols[7]) || 0,
            active: cols[8] === 'true'
          });
          break;

        case 'VOLUME_BONUS':
          plan.volumeBonuses?.push({
            id: cols[1] || crypto.randomUUID(),
            threshold: parseFloat(cols[2]) || 0,
            amount: parseFloat(cols[3]) || 0,
            type: cols[4] as VolumeBonusType,
            scope: cols[5] as VolumeBonusScope,
            filter: cols[6] as VolumeBonusFilter,
            active: cols[7] === 'true',
            notes: cols[8] || ''
          });
          break;

        case 'MINI_TIER':
          plan.miniTiers?.push({
            id: cols[1] || crypto.randomUUID(),
            threshold: cols[2] === '' ? undefined : parseFloat(cols[2]),
            maxUnits: cols[3] === '' ? undefined : parseFloat(cols[3]),
            newMini: parseFloat(cols[4]) || 0,
            usedMini: parseFloat(cols[5]) || 0,
            isRetroactive: cols[6] === 'true',
            active: cols[7] === 'true'
          });
          break;

        case 'CUSTOM_MINI':
          plan.customMinis?.push({
            id: cols[1] || crypto.randomUUID(),
            label: cols[2],
            amount: parseFloat(cols[3]) || 0,
            active: cols[4] === 'true',
            filter: cols[5] as VolumeBonusFilter
          });
          break;

        case 'HOURLY':
          plan.hourlyConfig = {
            active: cols[2] === 'true',
            rate: parseFloat(cols[3]) || 0,
            hoursWorked: parseFloat(cols[4]) || 0,
            model: cols[5] as HourlyPayoutModel
          };
          break;

        case 'FLAGS':
          plan.isRulesEnabled = cols[2] === 'true';
          plan.isVolumeBonusActive = cols[3] === 'true';
          plan.isVolumeBonusEngineActive = cols[4] === 'true';
          plan.isSplitBehaviorActive = cols[5] === 'true';
          plan.isFlatPerUnitActive = cols[6] === 'true';
          plan.isMinisAndHourlyActive = cols[7] === 'true';
          plan.isMinisActive = cols[8] === 'true';
          plan.isHourlyActive = cols[9] === 'true';
          break;
      }
    }

    return plan;
  },

  /**
   * Validates the structure and types of a parsed PayPlan
   */
  validatePlan(plan: Partial<PayPlan>): string[] {
    const errors: string[] = [];

    if (!plan.name) errors.push('Missing plan name.');
    
    if (plan.tiers && plan.tiers.length > 0) {
      plan.tiers.forEach((t, i) => {
        if (t.threshold !== undefined && isNaN(t.threshold)) errors.push(`Tier ${i+1}: Invalid threshold.`);
        if (t.frontRate !== undefined && isNaN(t.frontRate)) errors.push(`Tier ${i+1}: Invalid front rate.`);
        if (t.backRate !== undefined && isNaN(t.backRate)) errors.push(`Tier ${i+1}: Invalid back rate.`);
      });
    } else {
      errors.push('Plan must have at least one commission tier.');
    }

    // Validate enum values loosely
    if (plan.splitDealBehavior && !['standard', 'half_mini'].includes(plan.splitDealBehavior)) {
      errors.push(`Invalid split behavior: ${plan.splitDealBehavior}`);
    }

    return errors;
  }
};
