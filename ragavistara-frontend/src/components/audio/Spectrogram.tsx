import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
// @ts-expect-error: spectrogram plugin may not have types
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.esm.js'

export default function Spectrogram({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const spectroRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current || !spectroRef.current) return
    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: 0,
      waveColor: 'transparent',
      plugins: [
        SpectrogramPlugin.create({
          container: spectroRef.current,
          labels: true,
        }),
      ],
    })
    ws.load(src)
    return () => ws.destroy()
  }, [src])

  return (
    <div className="rounded-2xl border border-white/10 p-4">
      <div className="text-sm mb-2">Spectrogram</div>
      <div ref={containerRef} />
      <div ref={spectroRef} />
    </div>
  )
}


