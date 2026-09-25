import { migration001Initial } from './001_initial'
import { migration002FileKinds } from './002_file_kinds'
import type { Migration } from './index'

export const WORKSPACE_MIGRATIONS: readonly Migration[] = [
  migration001Initial,
  migration002FileKinds
]
