import type { SourceInfo } from '../../shared/types'

// THE VERIFICATION ALLOWLIST.
//
// Background news fetching ONLY ever reads from these feeds. Anything that does
// not originate from one of these domains is discarded before it can influence
// a single suggestion. Each source carries an editorial `trustWeight` in [0,1]
// that is used to weight how much its coverage counts.
//
// These are established Indian financial publishers / exchanges. If you want to
// add a source, add it here with an honest trust weight and a working RSS URL.
export interface TrustedSource extends SourceInfo {
  feeds: string[]
}

export const TRUSTED_SOURCES: TrustedSource[] = [
  {
    id: 'moneycontrol',
    name: 'Moneycontrol',
    domain: 'moneycontrol.com',
    trustWeight: 0.9,
    feeds: [
      'https://www.moneycontrol.com/rss/marketreports.xml',
      'https://www.moneycontrol.com/rss/business.xml',
      'https://www.moneycontrol.com/rss/results.xml'
    ]
  },
  {
    id: 'economictimes',
    name: 'The Economic Times — Markets',
    domain: 'economictimes.indiatimes.com',
    trustWeight: 0.92,
    feeds: [
      'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
      'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms'
    ]
  },
  {
    id: 'livemint',
    name: 'Mint — Markets',
    domain: 'livemint.com',
    trustWeight: 0.9,
    feeds: ['https://www.livemint.com/rss/markets']
  },
  {
    id: 'businessstandard',
    name: 'Business Standard — Markets',
    domain: 'business-standard.com',
    trustWeight: 0.9,
    feeds: ['https://www.business-standard.com/rss/markets-106.rss']
  },
  {
    id: 'businessline',
    name: 'The Hindu BusinessLine — Markets',
    domain: 'thehindubusinessline.com',
    trustWeight: 0.88,
    feeds: ['https://www.thehindubusinessline.com/markets/feeder/default.rss']
  },
  {
    id: 'ndtvprofit',
    name: 'NDTV Profit — Markets',
    domain: 'ndtvprofit.com',
    trustWeight: 0.85,
    feeds: ['https://www.ndtvprofit.com/stories.rss']
  }
]

const ALLOWED_DOMAINS = new Set(TRUSTED_SOURCES.map((s) => s.domain))

/**
 * Domain-level verification. A link is trusted only if its host matches (or is a
 * subdomain of) a whitelisted publisher domain, and it is served over HTTPS.
 */
export function isVerifiedLink(link: string | undefined): boolean {
  if (!link) return false
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  for (const domain of ALLOWED_DOMAINS) {
    if (host === domain || host.endsWith(`.${domain}`)) return true
  }
  return false
}

export function publicSources(): SourceInfo[] {
  return TRUSTED_SOURCES.map(({ id, name, domain, trustWeight }) => ({
    id,
    name,
    domain,
    trustWeight
  }))
}
