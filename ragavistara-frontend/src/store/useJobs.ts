import { create } from 'zustand'
import { api } from '@/lib/api'
import type { AnalyzeOptions, AnalyzeResponse, Job } from '@/lib/types'

interface JobsState {
  jobs: Record<string, Job>
  createJob: (file: File, options: AnalyzeOptions) => Promise<string>
  fetchJob: (id: string) => Promise<Job | undefined>
  removeJob: (id: string) => Promise<void>
}

export const useJobs = create<JobsState>((set, get) => ({
  jobs: {},
  async createJob(file, options) {
    const data = new FormData()
    data.append('file', file)
    data.append('options', JSON.stringify(options))
    const res = await api.post<AnalyzeResponse>('/analyze', data)
    return res.data.jobId
  },
  async fetchJob(id) {
    const res = await api.get<Job>(`/jobs/${id}`)
    const job = res.data
    set((s) => ({ jobs: { ...s.jobs, [id]: job } }))
    return job
  },
  async removeJob(id) {
    await api.delete(`/jobs/${id}`)
    set((s) => {
      const copy = { ...s.jobs }
      delete copy[id]
      return { jobs: copy }
    })
  },
}))


