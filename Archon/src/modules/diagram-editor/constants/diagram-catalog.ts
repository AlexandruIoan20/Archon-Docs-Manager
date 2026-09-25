import type { UmlDiagramType } from '@/core/types'
import type { IconName } from '@/shared/components/icons'

export type DiagramCategory = 'structural' | 'behavioral'

export interface DiagramCategoryInfo {
  id: DiagramCategory
  label: string
  /** Shown after the group title in the grid. */
  note: string
  icon: IconName
}

export interface DiagramCatalogEntry {
  id: UmlDiagramType
  category: DiagramCategory
  /** „State machine”; the dialog adds „diagram”. */
  name: string
  description: string
  icon: IconName
}

export const DIAGRAM_CATEGORIES: readonly DiagramCategoryInfo[] = [
  {
    id: 'structural',
    label: 'Structural',
    note: 'what the system is made of',
    icon: 'layers'
  },
  {
    id: 'behavioral',
    label: 'Behavioral',
    note: 'what the system does over time',
    icon: 'play'
  }
]

/** The 14 UML 2.5 diagram types offered by the „New diagram” dialog. */
export const DIAGRAM_CATALOG: readonly DiagramCatalogEntry[] = [
  {
    id: 'class',
    category: 'structural',
    name: 'Class',
    description: 'Classes, attributes and their relations',
    icon: 'box'
  },
  {
    id: 'object',
    category: 'structural',
    name: 'Object',
    description: 'Instances and links at one moment',
    icon: 'rect'
  },
  {
    id: 'component',
    category: 'structural',
    name: 'Component',
    description: 'Parts of the system and their interfaces',
    icon: 'plusBox'
  },
  {
    id: 'composite',
    category: 'structural',
    name: 'Composite structure',
    description: 'The inside of a class: parts and ports',
    icon: 'grid4'
  },
  {
    id: 'package',
    category: 'structural',
    name: 'Package',
    description: 'Namespaces and their dependencies',
    icon: 'folder'
  },
  {
    id: 'deployment',
    category: 'structural',
    name: 'Deployment',
    description: 'Nodes, artifacts and where they run',
    icon: 'shield'
  },
  {
    id: 'profile',
    category: 'structural',
    name: 'Profile',
    description: 'Stereotypes that extend UML',
    icon: 'layers'
  },
  {
    id: 'usecase',
    category: 'behavioral',
    name: 'Use case',
    description: 'Actors and the goals they reach',
    icon: 'circle'
  },
  {
    id: 'activity',
    category: 'behavioral',
    name: 'Activity',
    description: 'Actions, decisions and their flow',
    icon: 'flow'
  },
  {
    id: 'state',
    category: 'behavioral',
    name: 'State machine',
    description: 'States and the events between them',
    icon: 'branch'
  },
  {
    id: 'sequence',
    category: 'behavioral',
    name: 'Sequence',
    description: 'Messages between lifelines, in order',
    icon: 'list'
  },
  {
    id: 'communication',
    category: 'behavioral',
    name: 'Communication',
    description: 'Numbered messages over links',
    icon: 'link'
  },
  {
    id: 'timing',
    category: 'behavioral',
    name: 'Timing',
    description: 'State changes along a time axis',
    icon: 'weight'
  },
  {
    id: 'interaction',
    category: 'behavioral',
    name: 'Interaction overview',
    description: 'Interactions composed as a flow',
    icon: 'play'
  }
]

export function catalogEntry(id: UmlDiagramType): DiagramCatalogEntry {
  const entry = DIAGRAM_CATALOG.find((e) => e.id === id)
  if (!entry) throw new Error(`Unknown diagram type: ${id}`)
  return entry
}
