import type { UniverseStock } from '../../shared/types'

// A curated, sector-tagged universe of widely-followed NSE-listed companies.
// This powers three things with zero network dependency:
//   1. sector classification of whatever the user holds,
//   2. the candidate pool for new-stock suggestions, and
//   3. matching company mentions inside verified news headlines.
//
// It is intentionally a well-known subset (not the entire exchange). Extend it
// freely — each entry just needs a symbol, name, sector, and a few lowercase
// aliases that might appear in headlines.
export const UNIVERSE: UniverseStock[] = [
  // Financials
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Financials', aliases: ['hdfc bank', 'hdfcbank'] },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Financials', aliases: ['icici bank', 'icicibank'] },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financials', aliases: ['state bank of india', 'sbi ', 'sbin'] },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Financials', aliases: ['kotak mahindra', 'kotak bank'] },
  { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Financials', aliases: ['axis bank', 'axisbank'] },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Financials', aliases: ['bajaj finance', 'bajfinance'] },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', sector: 'Financials', aliases: ['bajaj finserv'] },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Financials', aliases: ['sbi life'] },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Financials', aliases: ['hdfc life'] },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank', sector: 'Financials', aliases: ['indusind'] },

  // IT
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', aliases: ['tata consultancy', 'tcs '] },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT', aliases: ['infosys', 'infy'] },
  { symbol: 'WIPRO', name: 'Wipro', sector: 'IT', aliases: ['wipro'] },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', aliases: ['hcl tech', 'hcltech'] },
  { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'IT', aliases: ['tech mahindra', 'techm'] },
  { symbol: 'LTIM', name: 'LTIMindtree', sector: 'IT', aliases: ['ltimindtree', 'mindtree'] },

  // Energy
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', aliases: ['reliance industries', 'reliance'] },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation', sector: 'Energy', aliases: ['ongc', 'oil and natural gas'] },
  { symbol: 'IOC', name: 'Indian Oil Corporation', sector: 'Energy', aliases: ['indian oil', 'ioc '] },
  { symbol: 'BPCL', name: 'Bharat Petroleum', sector: 'Energy', aliases: ['bharat petroleum', 'bpcl'] },
  { symbol: 'GAIL', name: 'GAIL India', sector: 'Energy', aliases: ['gail'] },

  // FMCG / Consumer
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', aliases: ['hindustan unilever', 'hul '] },
  { symbol: 'ITC', name: 'ITC', sector: 'FMCG', aliases: ['itc ltd', 'itc '] },
  { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG', aliases: ['nestle india', 'nestle'] },
  { symbol: 'BRITANNIA', name: 'Britannia Industries', sector: 'FMCG', aliases: ['britannia'] },
  { symbol: 'DABUR', name: 'Dabur India', sector: 'FMCG', aliases: ['dabur'] },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'FMCG', aliases: ['tata consumer'] },
  { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer', aliases: ['titan company', 'titan'] },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', sector: 'Consumer', aliases: ['asian paints'] },
  { symbol: 'TRENT', name: 'Trent', sector: 'Consumer', aliases: ['trent ', 'westside'] },

  // Auto
  { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto', aliases: ['maruti suzuki', 'maruti'] },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto', aliases: ['tata motors'] },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Auto', aliases: ['mahindra & mahindra', 'mahindra and mahindra'] },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', sector: 'Auto', aliases: ['bajaj auto'] },
  { symbol: 'EICHERMOT', name: 'Eicher Motors', sector: 'Auto', aliases: ['eicher', 'royal enfield'] },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Auto', aliases: ['hero motocorp', 'hero moto'] },

  // Pharma
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', aliases: ['sun pharma'] },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories", sector: 'Pharma', aliases: ["dr. reddy", 'dr reddy'] },
  { symbol: 'CIPLA', name: 'Cipla', sector: 'Pharma', aliases: ['cipla'] },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories", sector: 'Pharma', aliases: ["divi's", 'divis lab'] },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Pharma', aliases: ['apollo hospitals'] },

  // Metals
  { symbol: 'TATASTEEL', name: 'Tata Steel', sector: 'Metals', aliases: ['tata steel'] },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', sector: 'Metals', aliases: ['jsw steel'] },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals', aliases: ['hindalco'] },
  { symbol: 'COALINDIA', name: 'Coal India', sector: 'Metals', aliases: ['coal india'] },
  { symbol: 'VEDL', name: 'Vedanta', sector: 'Metals', aliases: ['vedanta'] },

  // Infra / Cement
  { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Infrastructure', aliases: ['larsen & toubro', 'larsen and toubro', 'l&t'] },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Cement', aliases: ['ultratech'] },
  { symbol: 'GRASIM', name: 'Grasim Industries', sector: 'Cement', aliases: ['grasim'] },
  { symbol: 'SHREECEM', name: 'Shree Cement', sector: 'Cement', aliases: ['shree cement'] },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements', sector: 'Cement', aliases: ['ambuja'] },

  // Telecom
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', aliases: ['bharti airtel', 'airtel'] },
  { symbol: 'IDEA', name: 'Vodafone Idea', sector: 'Telecom', aliases: ['vodafone idea', 'vi '] },

  // Power
  { symbol: 'NTPC', name: 'NTPC', sector: 'Power', aliases: ['ntpc'] },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', sector: 'Power', aliases: ['power grid', 'powergrid'] },
  { symbol: 'TATAPOWER', name: 'Tata Power', sector: 'Power', aliases: ['tata power'] },
  { symbol: 'ADANIPOWER', name: 'Adani Power', sector: 'Power', aliases: ['adani power'] },

  // Chemicals
  { symbol: 'PIDILITIND', name: 'Pidilite Industries', sector: 'Chemicals', aliases: ['pidilite', 'fevicol'] },
  { symbol: 'SRF', name: 'SRF', sector: 'Chemicals', aliases: ['srf ltd', 'srf '] },
  { symbol: 'UPL', name: 'UPL', sector: 'Chemicals', aliases: ['upl ltd', 'upl '] },

  // Realty / Infra-adjacent
  { symbol: 'DLF', name: 'DLF', sector: 'Realty', aliases: ['dlf ltd', 'dlf '] },
  { symbol: 'GODREJPROP', name: 'Godrej Properties', sector: 'Realty', aliases: ['godrej properties'] },

  // Other large caps
  { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Other', aliases: ['adani enterprises'] },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Infrastructure', aliases: ['adani ports'] },
  { symbol: 'DMART', name: 'Avenue Supermarts (DMart)', sector: 'Consumer', aliases: ['avenue supermarts', 'dmart', 'd-mart'] },
  { symbol: 'ZOMATO', name: 'Eternal (Zomato)', sector: 'Consumer', aliases: ['zomato', 'eternal ltd'] },
  { symbol: 'NYKAA', name: 'FSN E-Commerce (Nykaa)', sector: 'Consumer', aliases: ['nykaa'] },
  { symbol: 'PAYTM', name: 'One97 Communications (Paytm)', sector: 'Financials', aliases: ['paytm', 'one97'] }
]

const BY_SYMBOL = new Map(UNIVERSE.map((s) => [s.symbol.toUpperCase(), s]))

export function lookupSymbol(symbol: string): UniverseStock | undefined {
  return BY_SYMBOL.get(symbol.trim().toUpperCase())
}

export function searchUniverse(query: string, limit = 8): UniverseStock[] {
  const q = query.trim().toLowerCase()
  if (!q) return UNIVERSE.slice(0, limit)
  return UNIVERSE.filter(
    (s) =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.aliases.some((a) => a.includes(q))
  ).slice(0, limit)
}
