import type { JobResult } from '@/lib/types'
import { formatBpm, formatConfidence, formatHz } from '@/lib/utils'

export default function ResultSummary({ result }: { result: JobResult }) {
  return (
    <div className="rounded-2xl border border-white/10 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-400">Top Raga</div>
          <div className="text-xl font-semibold">{result.topRaga.name}</div>
        </div>
        <div className="text-sm bg-white/10 rounded-full px-3 py-1">
          Confidence: {formatConfidence(result.topRaga.confidence)}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
        <div className="rounded-lg bg-white/5 p-3">
          <div className="text-neutral-400">Tonic</div>
          <div className="font-medium">{formatHz(result.tonicHz)}</div>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <div className="text-neutral-400">Tempo</div>
          <div className="font-medium">{formatBpm(result.tempoBpm)}</div>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <div className="text-neutral-400">Alt.</div>
          <div className="font-medium">{result.top3.slice(1).map((r) => r.name).join(', ') || '—'}</div>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <div className="text-neutral-400">Duration</div>
          <div className="font-medium">~{(result.pitchContour?.at(-1)?.t ?? 0).toFixed(1)} s</div>
        </div>
      </div>
    </div>
  )
}


