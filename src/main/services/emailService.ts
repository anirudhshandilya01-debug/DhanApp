import { spawn } from 'child_process'
import { join } from 'path'
import { app } from 'electron'
import type { EmailAnalysisState, Holding, StockEmailSummary } from '../../shared/types'

// reading-mails lives alongside dhan-advisor under Desktop/apps/
const SCRIPT_DIR = join(
  app.getPath('desktop'),
  'apps',
  'reading-mails',
  'reading_mail_service',
  'src'
)

// On Windows the Python Launcher ("py") is most reliable; fall back to python/python3.
const PYTHON_BIN = process.platform === 'win32' ? 'py' : 'python3'

let cached: EmailAnalysisState = {
  data: [],
  lastUpdated: null,
  isFetching: false,
  error: null
}

function runAnalyzer(holdings: Holding[]): Promise<StockEmailSummary[]> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(SCRIPT_DIR, 'email_stock_analyzer.py')
    const proc = spawn(PYTHON_BIN, [scriptPath], { cwd: SCRIPT_DIR })

    const payload = JSON.stringify(holdings.map((h) => ({ symbol: h.symbol, name: h.name })))
    proc.stdin.write(payload)
    proc.stdin.end()

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    proc.on('error', (err) => reject(new Error(`Cannot start Python: ${err.message}`)))

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python exited ${code}: ${stderr.trim()}`))
        return
      }
      try {
        const result = JSON.parse(stdout.trim())
        if (!result.success) {
          reject(new Error(result.error ?? 'Unknown error from email analyzer'))
        } else {
          resolve(result.data as StockEmailSummary[])
        }
      } catch {
        reject(new Error(`Bad output from email analyzer: ${stdout.slice(0, 200)}`))
      }
    })
  })
}

export function getEmailState(): EmailAnalysisState {
  return cached
}

export async function fetchEmailAnalysis(holdings: Holding[]): Promise<EmailAnalysisState> {
  if (cached.isFetching) return cached

  cached = { ...cached, isFetching: true, error: null }

  try {
    const data = await runAnalyzer(holdings)
    cached = { data, lastUpdated: new Date().toISOString(), isFetching: false, error: null }
  } catch (err) {
    cached = { ...cached, isFetching: false, error: (err as Error).message }
  }

  return cached
}
