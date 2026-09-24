import type { FileEntry, FolderEntry, TreeEntry } from '@/core/types'

const file = (relPath: string): FileEntry => {
  const name = relPath.split('/').pop() as string
  return {
    kind: name.endsWith('.soardiag') ? 'soardiag' : 'soardoc',
    name,
    baseName: name.slice(0, name.lastIndexOf('.')),
    relPath
  }
}

const folder = (relPath: string, children: TreeEntry[]): FolderEntry => ({
  kind: 'folder',
  name: relPath.split('/').pop() as string,
  relPath,
  children
})

/** The structure the plan 08 acceptance criteria describe. */
export const SAMPLE_TREE: FolderEntry = folder('', [
  folder('Architecture', [
    folder('Architecture/Reference', [
      file('Architecture/Reference/platform-overview.soardiag'),
      file('Architecture/Reference/data-flows.soardoc')
    ])
  ]),
  folder('Playbooks', [
    folder('Playbooks/Phishing', [
      file('Playbooks/Phishing/phishing-triage.soardiag'),
      file('Playbooks/Phishing/triage-notes.soardoc')
    ]),
    folder('Playbooks/Ransomware', [file('Playbooks/Ransomware/containment.soardiag')])
  ]),
  folder('Runbooks', [file('Runbooks/on-call.soardoc')]),
  folder('Empty', []),
  file('incident-policy.soardoc')
])
