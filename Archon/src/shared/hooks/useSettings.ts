import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult
} from '@tanstack/react-query'
import type { AppSettings, SettingsPatch } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { DEFAULT_SETTINGS, QUERY_KEYS } from '@/core/constants/app.constants'
import { mergeSettings } from '@/core/settings/normalize-settings'

/** Also used by `main.tsx` to load the settings before the first render. */
export const settingsQuery = queryOptions({
  queryKey: QUERY_KEYS.settings,
  queryFn: ipcClient.settings.get,
  // Main is the only writer and every write goes through `useUpdateSettings`.
  staleTime: Infinity,
  // A local IPC failure is not transient; retrying would only delay startup.
  retry: false
})

/** The stored settings, or the defaults while they are unavailable. */
export function useSettings(): AppSettings {
  const { data } = useQuery(settingsQuery)
  return data ?? DEFAULT_SETTINGS
}

const UPDATE_MUTATION_KEY = ['settings', 'update'] as const

/**
 * Partial settings update with an optimistic cache write: the UI reacts
 * immediately; if main rejects the change, the cache is reloaded from main.
 */
export function useUpdateSettings(): UseMutationResult<AppSettings, Error, SettingsPatch> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: UPDATE_MUTATION_KEY,
    mutationFn: ipcClient.settings.update,
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: settingsQuery.queryKey })
      queryClient.setQueryData(settingsQuery.queryKey, (current) =>
        mergeSettings(current ?? DEFAULT_SETTINGS, patch)
      )
    },
    onError: (error) => {
      console.error('[settings] update failed', error)
      // Restoring a snapshot could drop other in-flight changes; main has the truth.
      void queryClient.invalidateQueries({ queryKey: settingsQuery.queryKey })
    },
    onSuccess: (stored) => {
      // An older answer must not undo a newer optimistic change still in flight;
      // the last pending update brings the complete state.
      const pending = queryClient.isMutating({ mutationKey: UPDATE_MUTATION_KEY })
      if (pending <= 1) queryClient.setQueryData(settingsQuery.queryKey, stored)
    }
  })
}
