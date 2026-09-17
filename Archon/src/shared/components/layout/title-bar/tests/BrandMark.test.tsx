import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { APP_NAME } from '@/core/constants/app.constants'
import { BrandMark } from '../BrandMark'

describe('BrandMark', () => {
  it('shows the app name next to the square', () => {
    render(<BrandMark />)
    expect(screen.getByText(APP_NAME)).toBeInTheDocument()
  })

  it('hides the name in compact mode but keeps it as the accessible name', () => {
    render(<BrandMark compact />)
    expect(screen.queryByText(APP_NAME)).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: APP_NAME })).toBeInTheDocument()
  })
})
