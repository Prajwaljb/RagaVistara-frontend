import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultSummary from './ResultSummary'

describe('ResultSummary', () => {
  it('shows top raga and metrics', () => {
    render(
      <ResultSummary
        result={{
          topRaga: { name: 'Yaman', confidence: 0.92 },
          top3: [
            { name: 'Yaman', confidence: 0.92 },
            { name: 'Kalyan', confidence: 0.05 },
            { name: 'Bhoop', confidence: 0.03 },
          ],
          tonicHz: 261.63,
          tempoBpm: 84,
          pitchContour: [{ t: 0, f0: 0 }, { t: 1, f0: 220 }],
        }}
      />,
    )
    expect(screen.getByText('Yaman')).toBeInTheDocument()
    expect(screen.getByText(/Confidence:/)).toBeInTheDocument()
    expect(screen.getByText(/Hz/)).toBeInTheDocument()
    expect(screen.getByText(/bpm/)).toBeInTheDocument()
  })
})


