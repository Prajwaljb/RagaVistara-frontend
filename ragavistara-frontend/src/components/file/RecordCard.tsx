import { useEffect, useRef, useState } from 'react'

interface RecordCardProps {
  onRecorded: (file: File | null) => void
}

export default function RecordCard({ onRecorded }: RecordCardProps) {
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    let timer: number | undefined
    if (recording) {
      const start = Date.now()
      timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 200)
    } else setElapsed(0)
    return () => clearInterval(timer)
  }, [recording])

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    chunksRef.current = []
    mr.ondataavailable = (e) => chunksRef.current.push(e.data)
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
      onRecorded(file)
    }
    mediaRef.current = mr
    mr.start()
    setRecording(true)
  }

  function stop() {
    mediaRef.current?.stop()
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop())
    setRecording(false)
  }

  return (
    <div className="rounded-2xl border border-white/10 p-6">
      <div className="text-sm text-neutral-300 mb-2">Simple Recorder</div>
      <div className="flex items-center gap-3">
        {!recording ? (
          <button onClick={start} className="rounded-full bg-brand px-4 py-2 text-sm">Record</button>
        ) : (
          <button onClick={stop} className="rounded-full bg-white/10 px-4 py-2 text-sm">Stop</button>
        )}
        <span className="text-xs text-neutral-400" aria-live="polite">Elapsed: {elapsed}s</span>
      </div>
    </div>
  )
}


