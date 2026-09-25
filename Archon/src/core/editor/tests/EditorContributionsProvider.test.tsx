import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { EditorContribution, FileKind } from '@/core/types'
import { EditorContributionsProvider, useEditorContribution } from '../EditorContributionsProvider'

const docEditor: EditorContribution = {
  kind: 'ardoc',
  Editor: () => <p>document editor</p>
}

function Lookup({ kind }: { kind: FileKind | undefined }): React.JSX.Element {
  const contribution = useEditorContribution(kind)
  if (!contribution) return <p>none</p>
  const { Editor } = contribution
  return <Editor tab={{ tabId: 't1', filePath: '/a.ardoc', kind: contribution.kind }} />
}

describe('EditorContributionsProvider', () => {
  it('finds the contribution registered for a kind', () => {
    render(
      <EditorContributionsProvider contributions={[docEditor]}>
        <Lookup kind="ardoc" />
      </EditorContributionsProvider>
    )
    expect(screen.getByText('document editor')).toBeInTheDocument()
  })

  it('returns nothing for unregistered or missing kinds', () => {
    render(
      <EditorContributionsProvider contributions={[docEditor]}>
        <Lookup kind="ardiag" />
        <Lookup kind={undefined} />
      </EditorContributionsProvider>
    )
    expect(screen.getAllByText('none')).toHaveLength(2)
  })

  it('rejects two contributions for the same kind', () => {
    // React logs the thrown render error; keep the test output clean.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() =>
      render(
        <EditorContributionsProvider contributions={[docEditor, { ...docEditor }]}>
          <Lookup kind="ardoc" />
        </EditorContributionsProvider>
      )
    ).toThrow('Duplicate editor contribution for "ardoc"')
    spy.mockRestore()
  })
})
