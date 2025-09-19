export type JobStatus = 'queued' | 'running' | 'done' | 'failed'

export interface AnalyzeOptions {
  raga: boolean
  tonic: boolean
  pitch: boolean
  tempo: boolean
  separation: boolean
  swara_pdf: boolean
  modelPreset?: string
}

export interface AnalyzeResponse { jobId: string }

export interface PitchPoint { t: number; f0: number }
export interface SwaraBin { swara: string; p: number }
export interface Stem { name: string; url: string }

export interface JobResult {
  topRaga: { name: string; confidence: number }
  top3: { name: string; confidence: number }[]
  tonicHz?: number
  tempoBpm?: number
  pitchContour?: PitchPoint[]
  swaraHistogram?: SwaraBin[]
  stems?: Stem[]
  swaraPdfUrl?: string
}

export interface Job {
  id: string
  status: JobStatus
  progress: number
  result?: JobResult
  error?: string | null
}


