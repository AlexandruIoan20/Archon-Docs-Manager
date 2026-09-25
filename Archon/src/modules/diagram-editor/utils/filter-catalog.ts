import {
  DIAGRAM_CATALOG,
  DIAGRAM_CATEGORIES,
  type DiagramCatalogEntry,
  type DiagramCategory,
  type DiagramCategoryInfo
} from '../constants/diagram-catalog'

export type CategoryFilter = 'all' | DiagramCategory

export interface CatalogGroup {
  category: DiagramCategoryInfo
  entries: DiagramCatalogEntry[]
}

/**
 * The catalog in the category, matching the query (name or description, any
 * case), grouped by category in catalog order. Empty groups are left out.
 */
export function filterCatalog(
  category: CategoryFilter,
  query: string,
  catalog: readonly DiagramCatalogEntry[] = DIAGRAM_CATALOG
): CatalogGroup[] {
  const q = query.trim().toLowerCase()
  const matches = (entry: DiagramCatalogEntry): boolean =>
    q === '' || entry.name.toLowerCase().includes(q) || entry.description.toLowerCase().includes(q)

  return DIAGRAM_CATEGORIES.filter((c) => category === 'all' || c.id === category)
    .map((c) => ({
      category: c,
      entries: catalog.filter((entry) => entry.category === c.id && matches(entry))
    }))
    .filter((group) => group.entries.length > 0)
}

/** How many types each filter holds, for the counters. */
export function categoryCounts(
  catalog: readonly DiagramCatalogEntry[] = DIAGRAM_CATALOG
): Record<CategoryFilter, number> {
  const count = (id: DiagramCategory): number => catalog.filter((e) => e.category === id).length
  return { all: catalog.length, structural: count('structural'), behavioral: count('behavioral') }
}
