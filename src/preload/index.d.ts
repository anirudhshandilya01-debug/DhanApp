import type { DhanApi } from './index'

declare global {
  interface Window {
    api: DhanApi
  }
}

export {}
