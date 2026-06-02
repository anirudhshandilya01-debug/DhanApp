import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import type { Settings } from '../shared/types'
import {
  addHolding,
  getHoldings,
  getSettings,
  removeHolding,
  saveSettings,
  updateHolding,
  type HoldingInput
} from './services/store'
import { newsEngine } from './services/newsFetcher'
import { analyze } from './services/analyzer'
import { lookupOrFetchSymbol, searchUniverse } from './services/stockUniverse'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 960,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#14110f',
    title: 'Dhan Advisor',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // Open external links (news articles) in the user's real browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  // electron-vite injects the dev server URL in development.
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    void mainWindow.loadURL(devUrl)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function pushDataUpdated(): void {
  mainWindow?.webContents.send('data:updated')
}

async function buildAnalysis() {
  const [holdings, settings] = await Promise.all([getHoldings(), getSettings()])
  const news = newsEngine.getState().scores
  return analyze(holdings, news, settings)
}

function registerIpc(): void {
  ipcMain.handle('holdings:get', () => getHoldings())

  ipcMain.handle('holding:add', async (_e, input: HoldingInput) => {
    const res = await addHolding(input)
    return res
  })

  ipcMain.handle('holding:update', (_e, id: string, patch) =>
    updateHolding(id, patch)
  )

  ipcMain.handle('holding:remove', (_e, id: string) => removeHolding(id))

  ipcMain.handle('universe:search', (_e, q: string) => searchUniverse(q))

  ipcMain.handle('universe:lookup', (_e, symbol: string) => lookupOrFetchSymbol(symbol))

  ipcMain.handle('analysis:get', () => buildAnalysis())

  ipcMain.handle('news:get', () => newsEngine.getState())

  ipcMain.handle('news:refresh', () => newsEngine.refresh())

  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:save', async (_e, patch: Partial<Settings>) => {
    const settings = await saveSettings(patch)
    newsEngine.reconfigure(settings.refreshMinutes, settings.freshnessHours)
    return settings
  })
}

app.whenReady().then(async () => {
  registerIpc()

  // Whenever fresh verified news lands, nudge the UI to re-pull analysis + news.
  newsEngine.onUpdate(() => pushDataUpdated())

  const settings = await getSettings()
  newsEngine.start(settings.refreshMinutes, settings.freshnessHours)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  newsEngine.stop()
  if (process.platform !== 'darwin') app.quit()
})
