import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SwaraBin } from '@/lib/types'

export default function SwaraHistogram({ data }: { data: SwaraBin[] }) {
  return (
    <div className="rounded-2xl border border-white/10 p-4">
      <div className="text-sm mb-2">Swara Histogram</div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="swara" stroke="#71717a" />
            <YAxis stroke="#71717a" />
            <Tooltip formatter={(v: number) => `${Math.round(v * 100)}%`} />
            <Bar dataKey="p" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


