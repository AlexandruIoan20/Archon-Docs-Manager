import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { TagInput } from '../TagInput'

function Harness({ initial }: { initial: string[] }): React.JSX.Element {
  const [tags, setTags] = useState(initial)
  return (
    <div data-testid="tags">
      <TagInput
        tags={tags}
        onAdd={(tag) => setTags((current) => [...current, tag])}
        onRemove={(tag) => setTags((current) => current.filter((t) => t !== tag))}
      />
    </div>
  )
}

function tagTexts(): string[] {
  return within(screen.getByTestId('tags'))
    .queryAllByRole('button', { name: /^Remove / })
    .map((button) => button.getAttribute('aria-label')?.replace('Remove ', '') ?? '')
}

function type(value: string, key: string): void {
  const input = screen.getByRole('textbox', { name: 'Add tag…' })
  fireEvent.change(input, { target: { value } })
  fireEvent.keyDown(input, { key })
}

describe('TagInput', () => {
  it('adds a trimmed tag on Enter and clears the input', () => {
    render(<Harness initial={['enrichment']} />)
    type('  t1566  ', 'Enter')
    expect(tagTexts()).toEqual(['enrichment', 't1566'])
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('ignores empty and duplicate tags', () => {
    render(<Harness initial={['enrichment']} />)
    type('   ', 'Enter')
    type('enrichment', 'Enter')
    expect(tagTexts()).toEqual(['enrichment'])
  })

  it('removes the last tag on Backspace in an empty input', () => {
    render(<Harness initial={['enrichment', 't1566']} />)
    type('', 'Backspace')
    expect(tagTexts()).toEqual(['enrichment'])
  })

  it('keeps tags on Backspace while the input has text', () => {
    render(<Harness initial={['enrichment']} />)
    type('abc', 'Backspace')
    expect(tagTexts()).toEqual(['enrichment'])
  })

  it('removes a tag with its × button', () => {
    render(<Harness initial={['enrichment', 't1566']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove enrichment' }))
    expect(tagTexts()).toEqual(['t1566'])
  })
})
