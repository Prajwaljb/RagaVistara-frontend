import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, NavLink } from 'react-router-dom'
import ThemeToggle from '@/components/ui/ThemeToggle'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

const Home = lazy(() => import('./routes/Home'))
const Analyze = lazy(() => import('./routes/Analyze'))
const Compare = lazy(() => import('./routes/Compare'))
const History = lazy(() => import('./routes/History'))
const Datasets = lazy(() => import('./routes/Datasets'))
const Experiments = lazy(() => import('./routes/Experiments'))
const Docs = lazy(() => import('./routes/Docs'))
const About = lazy(() => import('./routes/About'))

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh flex flex-col">
        <header className="sticky top-0 z-40 glass border-b border-white/10">
          <div className="hdr">
            <NavLink to="/" className="text-xl font-semibold">Raga Vistara</NavLink>
            <nav className="nv">
              <NavLink to="/analyze">Analyze</NavLink>
              <NavLink to="/compare">Compare</NavLink>
              <NavLink to="/history">History</NavLink>
              <NavLink to="/datasets">Datasets</NavLink>
              <NavLink to="/experiments">Experiments</NavLink>
              <NavLink to="/docs">Docs</NavLink>
              <NavLink to="/about">About</NavLink>
            </nav>
            <div className="flex items-center gap-3">
              <a href="https://github.com" aria-label="GitHub" className="text-sm underline">GitHub</a>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">
          <ErrorBoundary>
            <Suspense fallback={<div className="p-6" role="status" aria-live="polite">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/analyze" element={<Analyze />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/history" element={<History />} />
                <Route path="/datasets" element={<Datasets />} />
                <Route path="/experiments" element={<Experiments />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <footer className="border-t border-white/10 text-xs text-neutral-400">
          <div className="mx-auto max-w-7xl px-4 py-6 flex items-center justify-between">
            <span>Raga Vistara · MIT</span>
            <span>FastAPI · v0.1</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}
export default App