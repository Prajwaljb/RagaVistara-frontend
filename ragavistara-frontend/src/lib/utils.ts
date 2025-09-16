export function formatConfidence(p: number | undefined) {
  if (typeof p !== 'number') return '—'
  return `${Math.round(p * 100)}%`
}

export function formatHz(hz?: number) {
  if (!hz && hz !== 0) return '—'
  return `${hz.toFixed(2)} Hz`
}

export function formatBpm(bpm?: number) {
  if (!bpm && bpm !== 0) return '—'
  return `${bpm} bpm`
}


