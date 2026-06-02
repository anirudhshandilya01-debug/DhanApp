import type { Sector } from '../../shared/types'

export function inr(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export function inrExact(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

const SECTOR_COLORS: Record<string, string> = {
  Financials: '#d9a441',
  IT: '#6fb6c2',
  Energy: '#e0876a',
  FMCG: '#8fc28b',
  Auto: '#c28fbf',
  Pharma: '#7d9fe0',
  Metals: '#b9a36f',
  Infrastructure: '#cf9a5a',
  Telecom: '#9ec27a',
  Consumer: '#e0b65a',
  Chemicals: '#7ac2a6',
  Realty: '#c2887d',
  Power: '#d6b46a',
  Cement: '#a09a8a',
  Other: '#8a8175'
}

export function sectorColor(sector: string): string {
  return SECTOR_COLORS[sector] ?? SECTOR_COLORS.Other
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso)
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

// Formats an ISO UTC string as "02 Jun 2026, 03:45 PM IST"
export function toISTString(iso: string): string {
  return (
    new Date(iso).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST'
  )
}

// Formats an ISO date string like "2024-01-15" to "15 Jan 2024"
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
