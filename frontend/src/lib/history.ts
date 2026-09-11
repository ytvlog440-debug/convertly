export interface ConversionHistoryItem {
  jobId: string
  toolId: string
  toolName: string
  inputName: string
  outputFileId: string
  outputFilename: string
  sizeBytes: number
  mimeType: string
  timestamp: number
}

const STORAGE_KEY = 'convertly_recent_conversions'
const RETENTION_MS = 120 * 60 * 1000 // 120 minutes TTL

export function getRecentConversions(): ConversionHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: ConversionHistoryItem[] = JSON.parse(raw)
    const now = Date.now()
    // Auto purge items exceeding 120-minute privacy retention window
    return parsed.filter((item) => now - item.timestamp < RETENTION_MS)
  } catch {
    return []
  }
}

export function addRecentConversion(item: ConversionHistoryItem): void {
  try {
    const current = getRecentConversions()
    const filtered = current.filter((i) => i.jobId !== item.jobId)
    const updated = [item, ...filtered].slice(0, 15)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('convertly:history_updated'))
  } catch {
    // Ignore storage quota limits
  }
}

export function clearRecentConversions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event('convertly:history_updated'))
  } catch {
    // Ignore
  }
}
