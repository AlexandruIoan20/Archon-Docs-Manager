import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { EditorContribution, FileKind } from '@/core/types'

type ContributionMap = ReadonlyMap<FileKind, EditorContribution>

const EditorContributionsContext = createContext<ContributionMap>(new Map())

export interface EditorContributionsProviderProps {
  contributions: readonly EditorContribution[]
  children: ReactNode
}

function buildMap(contributions: readonly EditorContribution[]): ContributionMap {
  const map = new Map<FileKind, EditorContribution>()
  for (const contribution of contributions) {
    if (map.has(contribution.kind)) {
      throw new Error(`Duplicate editor contribution for "${contribution.kind}"`)
    }
    map.set(contribution.kind, contribution)
  }
  return map
}

/**
 * Makes the editors registered in `App.tsx` available to the shell, which
 * looks them up by file kind and never imports an editor module itself.
 */
export function EditorContributionsProvider({
  contributions,
  children
}: EditorContributionsProviderProps): React.JSX.Element {
  const map = useMemo(() => buildMap(contributions), [contributions])
  return <EditorContributionsContext value={map}>{children}</EditorContributionsContext>
}

/** The editor registered for a file kind, or `undefined` if none is. */
// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useEditorContribution(kind: FileKind | undefined): EditorContribution | undefined {
  const map = useContext(EditorContributionsContext)
  return kind ? map.get(kind) : undefined
}
