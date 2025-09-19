import { useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useJobs } from '@/store/useJobs'
import ResultSummary from '@/components/results/ResultSummary'
import PitchContourChart from '@/components/charts/PitchContourChart'
import Waveform from '@/components/audio/Waveform'
import Spectrogram from '@/components/audio/Spectrogram'
import SwaraHistogram from '@/components/charts/SwaraHistogram'
import TempoChart from '@/components/charts/TempoChart'
import UploadCard from '@/components/file/UploadCard'
import RecordCard from '@/components/file/RecordCard'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export default function Analyze() {
  const [file, setFile] = useState<File | null>(null)
  const [tab, setTab] = useState<'upload' | 'record'>('upload')
  const [jobId, setJobId] = useState<string | null>(null)
  const jobs = useJobs((s) => s.jobs)
  const createJob = useJobs((s) => s.createJob)
  const fetchJob = useJobs((s) => s.fetchJob)
  const schema = useMemo(() => z.object({
    modelPreset: z.string(),
    raga: z.boolean(),
    tonic: z.boolean(),
    pitch: z.boolean(),
    tempo: z.boolean(),
    swara_pdf: z.boolean(),
  }), [])
  const { register, handleSubmit, watch } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { modelPreset: 'RagaNet v1', raga: true, tonic: true, pitch: true, tempo: true, swara_pdf: true },
  })

  useEffect(() => {
    if (!jobId) return
    const id = jobId
    let active = true
    const interval = setInterval(async () => {
      const job = await fetchJob(id)
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

  async function runAnalysis() {
    if (!file) return
    const opts = { ...watch(), separation: false }
    const id = await createJob(file, opts)
    setJobId(id)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="text-2xl font-semibold mb-4">Analyze</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-white/10 p-1 flex gap-1 text-sm bg-white/5">
            <button
              className={`px-4 py-2 rounded-xl ${tab === 'upload' ? 'bg-brand text-white' : 'bg-transparent hover:bg-white/10'}`}
              onClick={() => setTab('upload')}
              type="button"
            >
              Upload
            </button>
            <button
              className={`px-4 py-2 rounded-xl ${tab === 'record' ? 'bg-brand text-white' : 'bg-transparent hover:bg-white/10'}`}
              onClick={() => setTab('record')}
              type="button"
            >
              Record
            </button>
          </div>
          {tab === 'upload' ? (
            <div className="panel">
              <UploadCard file={file} onSelect={setFile} />
            </div>
          ) : (
            <div className="panel">
              <RecordCard onRecorded={setFile} />
            </div>
          )}
        </div>
        <form className="space-y-3" onSubmit={handleSubmit(() => runAnalysis())}>
          <div className="panel">
            <div className="text-base font-medium mb-3">Options</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked {...register('raga')} /> Raga ID</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked {...register('tonic')} /> Tonic/Pitch</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked {...register('tempo')} /> Tempo</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked {...register('swara_pdf')} /> Swara Notation PDF</label>
            {/* Removed separation option from Analyze */}
            {/* <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked {...register('separation')} /> Separation</label> */}
            <div className="mt-4">
              <button
                type="submit"
                disabled={!file}
                className={`btn-brand ${!file ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Run Analysis
              </button>
            </div>
          </div>
        </form>
      </div>
      <div className="mt-4">
        <button
          disabled={!file}
          onClick={runAnalysis}
          className={`rounded-full px-4 py-2 text-sm ${file ? 'bg-brand' : 'bg-white/10 cursor-not-allowed'}`}
        >
          Run Analysis
        </button>
      </div>

      {jobId && (
        <div className="mt-6 space-y-4">
          <div className="text-sm text-neutral-300">
            Status: {jobs[jobId]?.status ?? 'queued'} · Progress: {Math.round((jobs[jobId]?.progress ?? 0) * 100)}%
          </div>
          {jobs[jobId]?.result && (
            <>
              <div className="panel">
                <ResultSummary result={jobs[jobId]!.result!} />
              </div>
              {jobs[jobId]!.result!.pitchContour && (
                <PitchContourChart data={jobs[jobId]!.result!.pitchContour!} />
              )}
              {jobs[jobId]!.result!.swaraHistogram && (
                <SwaraHistogram data={jobs[jobId]!.result!.swaraHistogram!} />
              )}
              {jobs[jobId]!.result!.swaraPdfUrl && (
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      try {
                        const url = new URL(jobs[jobId]!.result!.swaraPdfUrl, import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').toString()
                        const response = await fetch(url)
                        if (!response.ok) throw new Error('Network response was not ok')
                        const blob = await response.blob()
                        const downloadUrl = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = downloadUrl
                        a.download = 'swaras_notation.pdf'
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
                        window.URL.revokeObjectURL(downloadUrl)
                      } catch (error) {
                        alert('Failed to download PDF: ' + error)
                      }
                    }}
                    className="btn-brand px-4 py-2 rounded"
                  >
                    Download Swara Notation PDF
                  </button>
                </div>
              )}
              {/* Demo audio: if stems exist, use first stem URL; otherwise omit waveform */}
              {jobs[jobId]!.result!.stems?.[0] && (
                <Waveform src={jobs[jobId]!.result!.stems![0].url} />
              )}
              {jobs[jobId]!.result!.stems?.[0] && (
                <Spectrogram src={jobs[jobId]!.result!.stems![0].url} />
              )}
              <TempoChart bpm={jobs[jobId]!.result!.tempoBpm} />
            </>
          )}
        </div>
      )}
    </div>
  )
}


