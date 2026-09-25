import { useQuery } from '@tanstack/react-query'
import { ipcClient } from '@/core/ipc/ipc-client'

export const TAG_SUGGESTIONS_QUERY_KEY = ['index', 'tags'] as const

const NO_TAGS: readonly string[] = []

/**
 * The workspace's tags from the index, most used first. Empty while the
 * index is not ready or cannot be read: suggestions are only a convenience.
 */
export function useTagSuggestions(): readonly string[] {
  const { data } = useQuery({
    queryKey: TAG_SUGGESTIONS_QUERY_KEY,
    queryFn: async () => {
      const tags = await ipcClient.index.listTags()
      return [...tags].sort((a, b) => b.count - a.count).map((t) => t.tag)
    },
    staleTime: 30_000,
    retry: false
  })
  return data ?? NO_TAGS
}
