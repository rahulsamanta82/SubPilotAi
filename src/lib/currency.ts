export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rateToUSD: number; // How many units of this currency equal 1 USD
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rateToUSD: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', rateToUSD: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rateToUSD: 0.78 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToUSD: 155.0 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rateToUSD: 1.37 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToUSD: 1.50 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToUSD: 83.5 },
];

const RATES_MAP: Record<string, number> = SUPPORTED_CURRENCIES.reduce((acc, curr) => {
  acc[curr.code] = curr.rateToUSD;
  return acc;
}, {} as Record<string, number>);

/**
 * Converts an amount from one currency to another using the mock exchange rates.
 */
export function convertCurrency(amount: number, from: string, to: string): number {
  const fromRate = RATES_MAP[from.toUpperCase()] || 1.0;
  const toRate = RATES_MAP[to.toUpperCase()] || 1.0;

  // Convert from input currency to USD base
  const amountInUSD = amount / fromRate;
  
  // Convert from USD base to target currency
  return amountInUSD * toRate;
}

/**
 * Formats a currency value with its appropriate symbol and decimal places.
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode.toUpperCase()) || { symbol: '$', code: 'USD' };
  
  // Yen doesn't typically have fractional cents
  const decimals = currency.code === 'JPY' ? 0 : 2;
  
  const formattedValue = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${currency.symbol}${formattedValue}`;
}

/**
 * Uses the user's browser locale to automatically suggest the most relevant base currency.
 */
export function suggestCurrencyFromLocale(): string {
  try {
    const locale = (navigator.language || (navigator.languages && navigator.languages[0]) || 'en-US').toLowerCase();
    
    // Check for exact matches or language-region codes
    if (locale.includes('-in') || locale.includes('_in') || locale === 'hi') {
      return 'INR';
    }
    if (locale.includes('-gb') || locale.includes('_gb') || locale.includes('-uk') || locale.includes('_uk')) {
      return 'GBP';
    }
    if (locale.includes('-jp') || locale.includes('_jp') || locale === 'ja') {
      return 'JPY';
    }
    if (locale.includes('-ca') || locale.includes('_ca')) {
      return 'CAD';
    }
    if (locale.includes('-au') || locale.includes('_au')) {
      return 'AUD';
    }
    
    // Eurozone check
    const euroLocales = [
      '-fr', '-de', '-it', '-es', '-nl', '-be', '-ie', '-at', '-fi', '-pt', '-gr', '-cy', '-ee', '-lv', '-lt', '-lu', '-mt', '-sk', '-si',
      '_fr', '_de', '_it', '_es', '_nl', '_be', '_ie', '_at', '_fi', '_pt', '_gr', '_cy', '_ee', '_lv', '_lt', '_lu', '_mt', '_sk', '_si'
    ];
    if (euroLocales.some(el => locale.includes(el))) {
      return 'EUR';
    }
    
    // Check base language codes
    const baseLang = locale.split('-')[0].split('_')[0];
    const langToCurrency: Record<string, string> = {
      'fr': 'EUR',
      'de': 'EUR',
      'it': 'EUR',
      'es': 'EUR',
      'nl': 'EUR',
      'ja': 'JPY',
      'hi': 'INR'
    };
    
    if (langToCurrency[baseLang]) {
      return langToCurrency[baseLang];
    }
  } catch (e) {
    console.warn('[Currency Detection] Failed to detect currency from locale, defaulting to USD:', e);
  }
  return 'USD';
}

