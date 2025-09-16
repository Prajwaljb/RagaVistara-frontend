import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
})

if (import.meta.env.VITE_USE_MOCKS === 'true') {
  // Lazy import to avoid bundling issues
  import('./mock').then(({ installAxiosMocks }) => installAxiosMocks(api))
}


