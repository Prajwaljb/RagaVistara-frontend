import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'
import PitchContourChart from '@/components/charts/PitchContourChart'
import type { PitchPoint } from '@/lib/types'

type Detail = { id: string; filename: string; result: { pitchContour?: PitchPoint[]; topRaga: { name: string } } }

export default function Compare() {
  const [params] = useSearchParams()
  const [items, setItems] = useState<Detail[]>([])
  const ids = useMemo(() => params.getAll('id').slice(0, 3), [params])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const results = await Promise.all(ids.map((id) => api.get(`/history/${id}`).then((r) => r.data)))
      if (!cancelled) setItems(results)
    })()
    return () => {
      cancelled = true
    }
  }, [ids])

  const overlays = items
    .map((d, i) => ({ label: d.result.topRaga.name, data: d.result.pitchContour?.map((p) => ({ ...p, series: i })) || [] }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="text-2xl font-semibold mb-4">Compare</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.id} className="rounded-2xl border border-white/10 p-4 text-sm">
            <div className="font-medium mb-2">{it.filename}</div>
            {it.result.pitchContour && <PitchContourChart data={it.result.pitchContour} />}
          </div>
        ))}
      </div>
    </div>
  )
}


