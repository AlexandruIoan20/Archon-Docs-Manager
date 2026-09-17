import { createContext, useContext } from 'react'
import type { TitleBarDensity } from '@/core/constants/layout.constants'

/**
 * Density of the title bar, provided by `TitleBar`. Editor contributions read it
 * to fold their tools into menus; outside a title bar it defaults to `full`.
 */
export const TitleBarDensityContext = createContext<TitleBarDensity>('full')

export function useTitleBarDensity(): TitleBarDensity {
  return useContext(TitleBarDensityContext)
}
