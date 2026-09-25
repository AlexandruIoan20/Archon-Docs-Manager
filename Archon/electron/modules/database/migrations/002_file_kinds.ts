import { workspaceSchemaSql } from './001_initial'
import type { Migration } from './index'

/**
 * `.soardoc` / `.soardiag` became `.ardoc` / `.ardiag`. SQLite cannot alter a CHECK
 * constraint, and the index is only a cache of the disk, so the schema is rebuilt
 * empty; the next fullSync repopulates it.
 */
export const migration002FileKinds: Migration = {
  version: 2,
  name: 'file-kinds',
  up: (db) => {
    db.exec(`
      DROP TABLE search_fts;
      DROP TABLE node_tags;
      DROP TABLE diagram_nodes;
      DROP TABLE doc_links;
      DROP TABLE file_tags;
      DROP TABLE files;
    `)
    db.exec(workspaceSchemaSql(['ardoc', 'ardiag']))
  }
}
