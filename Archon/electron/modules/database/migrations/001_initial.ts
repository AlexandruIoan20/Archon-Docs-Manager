import type { Migration } from './index'

/** Workspace index: files, tags, document ↔ diagram links, diagram nodes, full-text search. */
export const migration001Initial: Migration = {
  version: 1,
  name: 'initial',
  up: (db) => {
    db.exec(`
      CREATE TABLE files (
        id           TEXT PRIMARY KEY,
        rel_path     TEXT UNIQUE NOT NULL,
        kind         TEXT NOT NULL CHECK (kind IN ('soardoc', 'soardiag')),
        title        TEXT NOT NULL,
        diagram_type TEXT,
        created      TEXT,
        modified     TEXT,
        mtime_ms     INTEGER NOT NULL,
        size         INTEGER NOT NULL
      );

      CREATE TABLE file_tags (
        file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
        tag     TEXT NOT NULL,
        PRIMARY KEY (file_id, tag)
      );
      CREATE INDEX file_tags_tag ON file_tags(tag);

      CREATE TABLE doc_links (
        doc_id     TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
        diagram_id TEXT NOT NULL,
        PRIMARY KEY (doc_id, diagram_id)
      );
      CREATE INDEX doc_links_diagram ON doc_links(diagram_id);

      CREATE TABLE diagram_nodes (
        file_id     TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
        node_id     TEXT NOT NULL,
        node_type   TEXT,
        label       TEXT,
        subtitle    TEXT,
        description TEXT,
        PRIMARY KEY (file_id, node_id)
      );

      CREATE TABLE node_tags (
        file_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        tag     TEXT NOT NULL,
        PRIMARY KEY (file_id, node_id, tag),
        FOREIGN KEY (file_id, node_id) REFERENCES diagram_nodes(file_id, node_id) ON DELETE CASCADE
      );
      CREATE INDEX node_tags_tag ON node_tags(tag);

      CREATE VIRTUAL TABLE search_fts USING fts5(
        file_id UNINDEXED,
        node_id UNINDEXED,
        title,
        body,
        tokenize = 'unicode61 remove_diacritics 2'
      );
    `)
  }
}

export const WORKSPACE_MIGRATIONS: readonly Migration[] = [migration001Initial]
