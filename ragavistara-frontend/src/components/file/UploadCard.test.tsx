import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UploadCard from './UploadCard'

describe('UploadCard', () => {
  it('renders prompt and clears selection', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<UploadCard file={null} onSelect={onSelect} />)
    expect(screen.getByText(/Drop audio here/i)).toBeTruthy()
    // Simulate set file then clear
    render(<UploadCard file={new File(['a'], 'a.wav', { type: 'audio/wav' })} onSelect={onSelect} />)
    await user.click(screen.getByText(/Clear/i))
    expect(onSelect).toHaveBeenCalledWith(null)
  })
})


