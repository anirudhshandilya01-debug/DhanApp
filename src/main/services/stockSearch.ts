// Stock search: fetches Yahoo Finance data as a tool, answers via Gemini Flash.

const YF_HEADERS = { 'User-Agent': 'DhanAdvisor/1.0 (personal portfolio research tool)' }
const GEMINI_MODEL = 'gemini-3.1-flash-lite'

interface YfMeta {
  symbol?: string
  regularMarketPrice?: number
  previousClose?: number
  regularMarketDayHigh?: number
  regularMarketDayLow?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  marketCap?: number
  regularMarketChangePercent?: number
}

interface GeminiPart {
  text?: string
  functionCall?: { name: string; args: Record<string, unknown> }
  functionResponse?: { name: string; response: unknown }
}

interface GeminiContent {
  role: string
  parts: GeminiPart[]
}

interface GeminiResponse {
  candidates?: Array<{
    content?: GeminiContent
    finishReason?: string
  }>
  error?: { message: string }
}

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'get_stock_data',
        description:
          'Fetch current market data for an Indian NSE-listed stock from Yahoo Finance. ' +
          'Returns price, day range, 52-week range, market cap, and recent price history.',
        parameters: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'NSE stock symbol, e.g. TCS, RELIANCE, HDFCBANK, INFY'
            }
          },
          required: ['symbol']
        }
      }
    ]
  }
]

const SYSTEM_PROMPT =
  'You are a concise stock market assistant for Indian equity investors (NSE). ' +
  'Use the get_stock_data tool to fetch live market data before answering questions ' +
  'about specific stocks. Keep answers brief, factual, and in plain text (no markdown). ' +
  'Always mention the current price and day change when you have the data.'

async function fetchStockData(symbol: string): Promise<object> {
  const ticker = `${symbol.toUpperCase()}.NS`
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`
  const res = await fetch(url, { headers: YF_HEADERS })
  if (!res.ok) throw new Error(`No data for ${ticker} (HTTP ${res.status})`)

  const data = (await res.json()) as { chart?: { result?: Array<{ meta?: YfMeta; timestamp?: number[]; indicators?: { quote?: Array<{ close?: (number | null)[] }> } }> } }
  const result = data?.chart?.result?.[0]
  if (!result) throw new Error(`No chart data returned for ${ticker}`)

  const meta: YfMeta = result.meta ?? {}
  const closes = result.indicators?.quote?.[0]?.close ?? []
  const timestamps = result.timestamp ?? []

  const history = timestamps
    .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().split('T')[0], close: closes[i] }))
    .filter((h) => h.close != null)
    .slice(-5)

  return {
    symbol: meta.symbol ?? ticker,
    currentPrice: meta.regularMarketPrice,
    previousClose: meta.previousClose,
    changePercent: meta.regularMarketChangePercent != null
      ? `${meta.regularMarketChangePercent >= 0 ? '+' : ''}${meta.regularMarketChangePercent.toFixed(2)}%`
      : undefined,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    marketCapCr: meta.marketCap != null ? Math.round(meta.marketCap / 1e7) : undefined,
    recentDailyCloses: history
  }
}

async function geminiPost(
  contents: GeminiContent[],
  apiKey: string
): Promise<GeminiResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      tools: TOOLS,
      contents
    })
  })
  return (await res.json()) as GeminiResponse
}

export async function searchStock(query: string, apiKey: string): Promise<string> {
  if (!apiKey.trim()) {
    return 'Set your Gemini API key in Settings to enable stock search.'
  }

  const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: query }] }]

  // Up to 3 tool-call rounds (safety limit).
  for (let round = 0; round < 3; round++) {
    const resp = await geminiPost(contents, apiKey)

    if (resp.error) throw new Error(resp.error.message)

    const candidate = resp.candidates?.[0]
    if (!candidate?.content) throw new Error('Empty response from Gemini')

    const modelContent = candidate.content
    contents.push(modelContent)

    // Collect all function calls in this turn.
    const calls = modelContent.parts.filter((p) => p.functionCall)
    if (calls.length === 0) {
      // Final text answer.
      const text = modelContent.parts.find((p) => p.text)?.text
      return text ?? 'No response.'
    }

    // Execute all tool calls and build the function response turn.
    const responseParts: GeminiPart[] = await Promise.all(
      calls.map(async (part) => {
        const fc = part.functionCall!
        let response: unknown
        try {
          if (fc.name === 'get_stock_data') {
            response = await fetchStockData(String(fc.args.symbol ?? ''))
          } else {
            response = { error: `Unknown function: ${fc.name}` }
          }
        } catch (err) {
          response = { error: (err as Error).message }
        }
        return { functionResponse: { name: fc.name, response } }
      })
    )

    contents.push({ role: 'user', parts: responseParts })
  }

  throw new Error('Gemini did not produce a final answer after tool calls.')
}
