import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function TempoChart({ bpm }: { bpm?: number }) {
  const data = Array.from({ length: 50 }, (_, i) => ({ t: i, bpm }))
  return (
    <div className="rounded-2xl border border-white/10 p-4">
      <div className="text-sm mb-2">Tempo</div>
      <div style={{ width: '100%', height: 180 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="t" stroke="#71717a" hide />
            <YAxis stroke="#71717a" />
            <Tooltip formatter={(v: number) => `${v} bpm`} />
            <Area type="monotone" dataKey="bpm" stroke="#22c55e" fill="#22c55e33" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


