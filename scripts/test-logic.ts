import assert from 'node:assert'
import { analyze } from '../src/main/services/analyzer'
import { isVerifiedLink, publicSources } from '../src/main/services/sources'
import { searchUniverse, lookupSymbol, UNIVERSE } from '../src/main/services/stockUniverse'
import { NewsEngine } from '../src/main/services/newsFetcher'
import { DEFAULT_SETTINGS, type Holding, type NewsScore } from '../src/shared/types'

let passed = 0
function check(name: string, fn: () => void): void {
  fn()
  passed++
  console.log(`  ok  ${name}`)
}

// --- Verification layer ---
check('accepts whitelisted https link', () => {
  assert.equal(isVerifiedLink('https://www.moneycontrol.com/news/x.html'), true)
  assert.equal(isVerifiedLink('https://economictimes.indiatimes.com/markets/x'), true)
})
check('rejects non-whitelisted and http links', () => {
  assert.equal(isVerifiedLink('https://random-blog.example/post'), false)
  assert.equal(isVerifiedLink('http://www.moneycontrol.com/x'), false) // not https
  assert.equal(isVerifiedLink('not a url'), false)
  assert.equal(isVerifiedLink(undefined), false)
})
check('sources are all weighted in [0,1]', () => {
  for (const s of publicSources()) {
    assert.ok(s.trustWeight > 0 && s.trustWeight <= 1, s.name)
  }
})

// --- Universe ---
check('universe lookups and search work', () => {
  assert.equal(lookupSymbol('tcs')?.sector, 'IT')
  assert.ok(searchUniverse('bank').some((s) => s.symbol === 'HDFCBANK'))
  assert.ok(UNIVERSE.length > 40)
})

// --- Allocation + concentration flags ---
const concentrated: Holding[] = [
  { id: '1', symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', investedInr: 800000 },
  { id: '2', symbol: 'INFY', name: 'Infosys', sector: 'IT', investedInr: 200000 }
]
check('computes allocation percentages', () => {
  const a = analyze(concentrated, [], DEFAULT_SETTINGS)
  assert.equal(a.totalInvestedInr, 1000000)
  const tcs = a.byStock.find((s) => s.key === 'TCS')!
  assert.equal(Math.round(tcs.pct), 80)
  const it = a.bySector.find((s) => s.key === 'IT')!
  assert.equal(Math.round(it.pct), 100)
})
check('flags single-stock and single-sector concentration', () => {
  const a = analyze(concentrated, [], DEFAULT_SETTINGS)
  assert.ok(a.rebalance.some((r) => r.id === 'stock-conc-TCS'))
  assert.ok(a.rebalance.some((r) => r.id === 'sector-conc-IT'))
})
check('diversification score is low for single-sector portfolio', () => {
  const a = analyze(concentrated, [], DEFAULT_SETTINGS)
  assert.ok(a.diversificationScore < 35, `got ${a.diversificationScore}`)
})

// --- Suggestions favour under-weighted sectors & verified news ---
const fakeNews: NewsScore[] = [
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank',
    sector: 'Financials',
    mentions: 5,
    trustScore: 2.7,
    distinctSources: 3,
    headlines: [
      {
        title: 'HDFC Bank posts strong quarter',
        link: 'https://www.moneycontrol.com/x',
        sourceId: 'moneycontrol',
        sourceName: 'Moneycontrol',
        domain: 'moneycontrol.com',
        trustWeight: 0.9,
        publishedAt: new Date().toISOString()
      }
    ]
  }
]
check('suggests stocks outside held positions with reasons + evidence', () => {
  const a = analyze(concentrated, fakeNews, DEFAULT_SETTINGS)
  assert.ok(a.suggestions.length > 0)
  assert.ok(a.suggestions.every((s) => s.symbol !== 'TCS' && s.symbol !== 'INFY'))
  const hdfc = a.suggestions.find((s) => s.symbol === 'HDFCBANK')
  assert.ok(hdfc, 'expected HDFCBANK to surface')
  assert.ok(hdfc!.reasons.length > 0)
  assert.ok(hdfc!.evidence.length > 0, 'verified evidence should be attached')
})
check('balanced portfolio yields the all-clear note', () => {
  const balanced: Holding[] = [
    { id: '1', symbol: 'TCS', name: 'TCS', sector: 'IT', investedInr: 100000 },
    { id: '2', symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Financials', investedInr: 100000 },
    { id: '3', symbol: 'RELIANCE', name: 'Reliance', sector: 'Energy', investedInr: 100000 },
    { id: '4', symbol: 'ITC', name: 'ITC', sector: 'FMCG', investedInr: 100000 },
    { id: '5', symbol: 'SUNPHARMA', name: 'Sun Pharma', sector: 'Pharma', investedInr: 100000 },
    { id: '6', symbol: 'MARUTI', name: 'Maruti', sector: 'Auto', investedInr: 100000 }
  ]
  const a = analyze(balanced, [], DEFAULT_SETTINGS)
  assert.ok(a.diversificationScore > 60, `got ${a.diversificationScore}`)
})

// --- News engine scoring (no network) ---
check('news engine scores stocks from headlines', () => {
  const engine = new NewsEngine()
  // @ts-expect-error reach into private method for a deterministic unit test
  const scores: NewsScore[] = engine.scoreStocks([
    {
      title: 'Reliance Industries gains on earnings',
      link: 'https://www.livemint.com/x',
      sourceId: 'livemint',
      sourceName: 'Mint',
      domain: 'livemint.com',
      trustWeight: 0.9,
      publishedAt: new Date().toISOString()
    },
    {
      title: 'Tata Steel rallies on metals demand',
      link: 'https://www.business-standard.com/x',
      sourceId: 'businessstandard',
      sourceName: 'Business Standard',
      domain: 'business-standard.com',
      trustWeight: 0.9,
      publishedAt: new Date().toISOString()
    }
  ])
  assert.ok(scores.some((s) => s.symbol === 'RELIANCE'))
  assert.ok(scores.some((s) => s.symbol === 'TATASTEEL'))
})

console.log(`\nAll ${passed} logic checks passed.`)
