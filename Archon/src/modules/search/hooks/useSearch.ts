import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { SearchResult } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { useDebouncedCallback } from '@/shared/hooks/useDebounce'

export const SEARCH_DEBOUNCE_MS = 150
export const SEARCH_MIN_CHARS = 2

export interface SearchState {
  results: SearchResult[]
  /** The query the results are for (it trails the typed text by the debounce). */
  query: string
  /** Fewer than 2 characters: nothing is searched. */
  tooShort: boolean
  loading: boolean
  error: Error | null
}

/** Full-text search over the workspace index, 150ms after typing stops. */
export function useSearch(text: string): SearchState {
  const [query, setQuery] = useState(text.trim())
  const debounced = useDebouncedCallback(setQuery, SEARCH_DEBOUNCE_MS)
  useEffect(() => debounced(text.trim()), [text, debounced])

  const enabled = query.length >= SEARCH_MIN_CHARS
  const { data, isFetching, error } = useQuery({
    queryKey: ['search', query],
    queryFn: () => ipcClient.search.query(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 5_000,
    retry: false
  })

  return {
    results: enabled ? (data ?? []) : [],
    query,
    tooShort: text.trim().length < SEARCH_MIN_CHARS,
    loading: enabled && isFetching,
    error: error as Error | null
  }
}
