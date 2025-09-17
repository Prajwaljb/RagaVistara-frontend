import { useState, useEffect } from 'react'
import UploadCard from '@/components/file/UploadCard'
import { useJobs } from '@/store/useJobs'
import Waveform from '@/components/audio/Waveform'

export default function Karaoke() {
  const [file, setFile] = useState<File | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const jobs = useJobs((s) => s.jobs)
  const createJob = useJobs((s) => s.createJob)
  const fetchJob = useJobs((s) => s.fetchJob)

  useEffect(() => {
    if (!jobId) return
    let active = true
    const interval = setInterval(async () => {
      const job = await fetchJob(jobId)
      if (!active) return
      if (job?.status === 'done' || job?.status === 'failed') {
        clearInterval(interval)
      }
    }, 600)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [jobId, fetchJob])

  async function runKaraoke() {
    if (!file) return
    // Only separation option enabled for karaoke
    const options = { separation: true, raga: false, tonic: false, pitch: false, tempo: false }
    const id = await createJob(file, options)
    setJobId(id)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h2 className="text-2xl font-semibold mb-4">Karaoke Converter</h2>
      <div className="panel mb-4">
        <UploadCard file={file} onSelect={setFile} />
      </div>
      <button
        disabled={!file}
        onClick={runKaraoke}
        className={`btn-brand px-6 py-2 rounded ${file ? '' : 'opacity-50 cursor-not-allowed'}`}
      >
        Run Karaoke
      </button>

      {jobId && (
        <div className="mt-6 space-y-4">
          <div className="text-sm text-neutral-300">
            Status: {jobs[jobId]?.status ?? 'queued'} · Progress: {Math.round((jobs[jobId]?.progress ?? 0) * 100)}%
          </div>
          {(jobs[jobId]?.status === 'failed' && (jobs[jobId]?.error || (jobs[jobId]?.result as any)?.error)) && (
            <div className="panel bg-red-900 text-red-300 p-4 rounded">
              <h3 className="text-lg font-medium mb-2">Error</h3>
              <pre className="whitespace-pre-wrap">{jobs[jobId].error ?? (jobs[jobId].result as any).error}</pre>
            </div>
          )}
          {jobs[jobId]?.result?.stems && (
            <div className="panel">
              <h3 className="text-lg font-medium mb-2">Instrumental Output</h3>
              {jobs[jobId]!.result!.stems!.map((stem) => (
                <div key={stem.name} className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{stem.name}</span>
                  <a
                    href={`http://localhost:8000${stem.url}`}
                    download
                    className="btn-brand text-xs px-2 py-1 rounded"
                  >
                    Download
                  </a>
                </div>
              ))}
              {jobs[jobId]!.result!.stems![0] && (
                <Waveform src={jobs[jobId]!.result!.stems![0].url} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
