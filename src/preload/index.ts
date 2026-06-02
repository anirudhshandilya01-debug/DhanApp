import { contextBridge, ipcRenderer } from 'electron'
import type {
  Analysis,
  Holding,
  NewsState,
  Settings,
  UniverseStock
} from '../shared/types'
import type { HoldingInput } from '../main/services/store'

const api = {
  getHoldings: (): Promise<Holding[]> => ipcRenderer.invoke('holdings:get'),
  addHolding: (input: HoldingInput): Promise<Holding[]> =>
    ipcRenderer.invoke('holding:add', input),
  updateHolding: (
    id: string,
    patch: Partial<Pick<Holding, 'investedInr' | 'name' | 'sector'>>
  ): Promise<Holding[]> => ipcRenderer.invoke('holding:update', id, patch),
  removeHolding: (id: string): Promise<Holding[]> =>
    ipcRenderer.invoke('holding:remove', id),
  searchUniverse: (q: string): Promise<UniverseStock[]> =>
    ipcRenderer.invoke('universe:search', q),
  lookupSymbol: (symbol: string): Promise<UniverseStock | undefined> =>
    ipcRenderer.invoke('universe:lookup', symbol),
  getAnalysis: (): Promise<Analysis> => ipcRenderer.invoke('analysis:get'),
  getNews: (): Promise<NewsState> => ipcRenderer.invoke('news:get'),
  refreshNews: (): Promise<NewsState> => ipcRenderer.invoke('news:refresh'),
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (patch: Partial<Settings>): Promise<Settings> =>
    ipcRenderer.invoke('settings:save', patch),
  /** Fires when the background engine has new verified data. */
  onDataUpdated: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('data:updated', handler)
    return () => ipcRenderer.removeListener('data:updated', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type DhanApi = typeof api
