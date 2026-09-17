import { useQuery } from '@tanstack/react-query'
import type { AppInfo, AppPlatform } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { QUERY_KEYS } from '@/core/constants/app.constants'

const selectPlatform = (info: AppInfo): AppPlatform => info.platform

/**
 * The OS the app runs on, or `undefined` until main answers (or if the bridge
 * is missing). The platform never changes during a session, so it is fetched once.
 */
export function usePlatform(): AppPlatform | undefined {
  const { data } = useQuery({
    queryKey: QUERY_KEYS.appInfo,
    queryFn: ipcClient.app.getInfo,
    staleTime: Infinity,
    select: selectPlatform
  })
  return data
}
