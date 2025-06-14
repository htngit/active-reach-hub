
import { useSystemSettings } from './useSystemSettings';

const CURRENCY_SYMBOLS = {
  USD: '$',
  IDR: 'Rp',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  SGD: 'S$',
  MYR: 'RM',
  THB: '฿',
} as const;

export const useCurrency = () => {
  const { settings } = useSystemSettings();
  
  const currency = settings?.currency || 'USD';
  const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || '$';

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return `${symbol}0`;
    
    // Format based on currency type
    if (currency === 'IDR') {
      return `${symbol}${amount.toLocaleString('id-ID')}`;
    }
    
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return {
    currency,
    symbol,
    formatCurrency,
  };
};
