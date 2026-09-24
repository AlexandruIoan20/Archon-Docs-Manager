import { AppError } from '../errors'
import { getIndexStatus, getSearchRepo, rebuildIndex } from '../index-service'
import { handleResult } from './typed-ipc'

/** Workspace index and full-text search (plan 10; the search UI comes in plan 20). */
export function registerDbHandlers(): void {
  handleResult('index:get-status', () => getIndexStatus())
  handleResult('index:rebuild', () => rebuildIndex())
  handleResult('index:list-tags', () => getSearchRepo().listTags())

  handleResult('search:query', (_event, text, limit) => {
    if (typeof text !== 'string') throw new AppError('INVALID_ARGUMENT', 'Query must be a string')
    return getSearchRepo().query(text.slice(0, 500), limit)
  })
}
