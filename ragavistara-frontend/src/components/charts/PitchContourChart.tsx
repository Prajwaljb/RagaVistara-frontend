import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PitchPoint } from '@/lib/types'

export default function PitchContourChart({ data }: { data: PitchPoint[] }) {
  return (
    <div className="rounded-2xl border border-white/10 p-4">
      <div className="text-sm mb-2">Pitch Contour</div>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="t" tickFormatter={(v) => `${v}s`} stroke="#71717a" />
            <YAxis stroke="#71717a" />
            <Tooltip formatter={(value: number, name) => [value.toFixed(2), name === 'f0' ? 'Hz' : name]} labelFormatter={(l) => `${l}s`} />
            <Line type="monotone" dataKey="f0" stroke="#22c55e" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


