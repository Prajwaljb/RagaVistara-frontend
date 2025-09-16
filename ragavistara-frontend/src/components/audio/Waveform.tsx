import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

export default function Waveform({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: 96,
      waveColor: '#6b7280',
      progressColor: '#7c3aed',
      cursorColor: '#ffffff',
      barWidth: 2,
      barGap: 1,
      normalize: true,
      responsive: true,
    })
    wavesurferRef.current = ws
    ws.on('ready', () => setReady(true))
    ws.load(src)
    return () => {
      ws.destroy()
      wavesurferRef.current = null
    }
  }, [src])

  return (
    <div className="rounded-2xl border border-white/10 p-4">
      <div ref={containerRef} />
      <div className="mt-3 flex gap-2">
        <button
          className="rounded-full bg-white/10 px-3 py-1 text-xs"
          onClick={() => wavesurferRef.current?.playPause()}
          disabled={!ready}
        >
          Play/Pause
        </button>
        <input
          type="range"
          min={0}
          max={200}
          defaultValue={0}
          className="w-40"
          onChange={(e) => wavesurferRef.current?.zoom(Number(e.target.value))}
          aria-label="Zoom"
        />
      </div>
    </div>
  )
}


