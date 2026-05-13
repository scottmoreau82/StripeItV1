/**
 * Truncates a number to a specific number of decimal places without rounding.
 */
export const truncateToDecimal = (num: number, places: number): number => {
  if (isNaN(num)) return 0;
  const factor = Math.pow(10, places);
  // Using Math.trunc instead of Math.floor for correct negative truncation
  return Math.trunc(num * factor) / factor;
};

/**
 * Normalizes a numeric string into a valid number based on matrix rules.
 * Rule: 1 decimal place max, truncate, ignore trailing zeros.
 */
export const normalizeMatrixNumber = (input: string): number | undefined => {
  if (input === '') return undefined;
  const sanitized = input.replace(/[^0-9.-]/g, '');
  if (sanitized === '' || sanitized === '-') return undefined;
  const num = parseFloat(sanitized);
  return truncateToDecimal(num, 1);
};

/**
 * Normalizes a currency input string into a number with 2 decimal place truncation.
 */
export const normalizeCurrencyNumber = (input: string): number | undefined => {
  if (input === '') return undefined;
  const sanitized = input.replace(/[^0-9.-]/g, '');
  if (sanitized === '' || sanitized === '-') return undefined;
  const num = parseFloat(sanitized);
  return truncateToDecimal(num, 2);
};

/**
 * Formats a number for display in a general numeric field.
 * Removes unnecessary .0 and keeps up to 1 decimal place.
 */
export const formatMatrixValue = (num: number): string => {
  if (num === null || num === undefined) return '';
  // Truncate first to be safe
  const truncated = truncateToDecimal(num, 1);
  return truncated.toString();
};

/**
 * Formats a number for display as currency with $ and commas.
 * Only shows decimals if cents exist (up to 2).
 */
export const formatCurrencyValue = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return '';
  
  const truncated = truncateToDecimal(num, 2);
  const isNegative = truncated < 0;
  const absoluteValue = Math.abs(truncated);
  
  const hasCents = absoluteValue % 1 !== 0;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });

  const formattedValue = formatter.format(absoluteValue);
  return `${isNegative ? '-' : ''}$${formattedValue}`;
};
