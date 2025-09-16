import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { Job } from './types'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const jobs = new Map<string, Job>()

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

export function installAxiosMocks(instance: AxiosInstance) {
  instance.interceptors.request.use(async (config: AxiosRequestConfig) => {
    if (!config.url) return config
    const url = config.url

    if (config.method === 'post' && url.endsWith('/analyze')) {
      return handleAnalyze(config)
    }
    if (config.method === 'get' && url.match(/\/jobs\//)) {
      return handleJobGet(config)
    }
    if (config.method === 'delete' && url.match(/\/jobs\//)) {
      return handleJobDelete(config)
    }
    if (config.method === 'get' && url.startsWith('/history/')) {
      return handleHistoryDetail(config)
    }
    if (config.method === 'get' && url.startsWith('/history')) {
      return handleHistory(config)
    }
    return config
  })
}

async function handleAnalyze(config: AxiosRequestConfig) {
  const id = makeId()
  const job: Job = { id, status: 'queued', progress: 0 }
  jobs.set(id, job)

  // Simulate async progress
  ;(async () => {
    await sleep(400)
    update(id, { status: 'running', progress: 0.2 })
    await sleep(400)
    update(id, { progress: 0.6 })
    await sleep(400)
    update(id, {
      status: 'done',
      progress: 1,
      result: {
        topRaga: { name: 'Yaman', confidence: 0.92 },
        top3: [
          { name: 'Yaman', confidence: 0.92 },
          { name: 'Kalyan', confidence: 0.05 },
          { name: 'Bhoop', confidence: 0.03 },
        ],
        tonicHz: 261.63,
        tempoBpm: 84,
        pitchContour: Array.from({ length: 400 }, (_, i) => ({ t: i / 100, f0: 200 + 40 * Math.sin(i / 10) })),
        swaraHistogram: [
          { swara: 'Sa', p: 0.23 },
          { swara: 'Re', p: 0.12 },
          { swara: 'Ga', p: 0.18 },
          { swara: 'Ma', p: 0.11 },
          { swara: 'Pa', p: 0.17 },
          { swara: 'Dha', p: 0.10 },
          { swara: 'Ni', p: 0.09 },
        ],
        stems: [
          { name: 'vocals', url: '/stems/mock/vocals.wav' },
          { name: 'percussion', url: '/stems/mock/percussion.wav' },
        ],
      },
    })
  })()

  // Axios adapter-like shortcut: mock response
  config.adapter = async () => {
    await sleep(300)
    return {
      data: { jobId: id },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  return config
}

function update(id: string, partial: Partial<Job>) {
  const current = jobs.get(id)
  if (!current) return
  jobs.set(id, { ...current, ...partial })
}

async function handleJobGet(config: AxiosRequestConfig) {
  const id = String(config.url).split('/').pop()!
  config.adapter = async () => {
    await sleep(300)
    const job = jobs.get(id)
    if (!job) {
      return { data: { error: 'Not found' }, status: 404, statusText: 'Not Found', headers: {}, config }
    }
    return { data: job, status: 200, statusText: 'OK', headers: {}, config }
  }
  return config
}

async function handleJobDelete(config: AxiosRequestConfig) {
  const id = String(config.url).split('/').pop()!
  jobs.delete(id)
  config.adapter = async () => ({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config })
  return config
}

async function handleHistory(config: AxiosRequestConfig) {
  config.adapter = async () => {
    await sleep(350)
    const now = Date.now()
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: makeId(),
      filename: `clip_${i + 1}.wav`,
      date: new Date(now - i * 86400000).toISOString(),
      duration: 45 + i,
      topRaga: ['Yaman', 'Bhairav', 'Bhoop'][i % 3],
      confidence: 0.7 + (i % 3) * 0.1,
    }))
    return { data: { items, total: 42 }, status: 200, statusText: 'OK', headers: {}, config }
  }
  return config
}

async function handleHistoryDetail(config: AxiosRequestConfig) {
  const id = String(config.url).split('/').pop()!
  config.adapter = async () => {
    await sleep(250)
    // Build a deterministic mock from id
    const seed = id.charCodeAt(0) % 3
    const base = 200 + seed * 10
    const result = {
      topRaga: { name: ['Yaman', 'Bhairav', 'Bhoop'][seed], confidence: 0.8 - seed * 0.05 },
      top3: [
        { name: 'Yaman', confidence: 0.8 },
        { name: 'Kalyan', confidence: 0.12 },
        { name: 'Bhoop', confidence: 0.08 },
      ],
      tonicHz: 261.63 + seed,
      tempoBpm: 80 + seed * 4,
      pitchContour: Array.from({ length: 300 }, (_, i) => ({ t: i / 50, f0: base + 30 * Math.sin((i + seed * 3) / 12) })),
      swaraHistogram: [
        { swara: 'Sa', p: 0.2 },
        { swara: 'Re', p: 0.12 },
        { swara: 'Ga', p: 0.18 },
        { swara: 'Ma', p: 0.11 },
        { swara: 'Pa', p: 0.17 },
        { swara: 'Dha', p: 0.10 },
        { swara: 'Ni', p: 0.12 },
      ],
      stems: [{ name: 'vocals', url: '/stems/mock/vocals.wav' }],
    }
    return { data: { id, filename: `${id}.wav`, date: new Date().toISOString(), duration: 60, result }, status: 200, statusText: 'OK', headers: {}, config }
  }
  return config
}


