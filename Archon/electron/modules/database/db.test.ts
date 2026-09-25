// @vitest-environment node
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { closeAll, openAppDb, openDatabase, openWorkspaceDb } from './db'
import { runMigrations, type Migration } from './migrations'
import { migration001Initial } from './migrations/001_initial'
import { WORKSPACE_MIGRATIONS } from './migrations/workspace'

const version = (db: ReturnType<typeof openDatabase>): number =>
  db.pragma('user_version', { simple: true }) as number

describe('runMigrations', () => {
  it('applies each migration once and bumps user_version', () => {
    const db = openDatabase(':memory:', [])
    const calls: number[] = []
    const migrations: Migration[] = [
      { version: 2, name: 'two', up: (d) => (calls.push(2), d.exec('CREATE TABLE b (x)')) },
      { version: 1, name: 'one', up: (d) => (calls.push(1), d.exec('CREATE TABLE a (x)')) }
    ]

    expect(runMigrations(db, migrations)).toEqual([1, 2])
    expect(version(db)).toBe(2)
    expect(runMigrations(db, migrations)).toEqual([])
    expect(calls).toEqual([1, 2])
  })

  it('rolls a failing migration back together with its version', () => {
    const db = openDatabase(':memory:', [])
    const broken: Migration = {
      version: 1,
      name: 'broken',
      up: (d) => {
        d.exec('CREATE TABLE half (x)')
        throw new Error('boom')
      }
    }
    expect(() => runMigrations(db, [broken])).toThrow('boom')
    expect(version(db)).toBe(0)
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'half'").get()).toBeUndefined()
  })

  it('creates the workspace schema with FTS5', () => {
    const db = openDatabase(':memory:', WORKSPACE_MIGRATIONS)
    const tables = db
      .prepare<[], { name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name)
    expect(tables).toEqual(
      expect.arrayContaining([
        'files',
        'file_tags',
        'doc_links',
        'diagram_nodes',
        'node_tags',
        'search_fts'
      ])
    )
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
  })

  it('rebuilds a version 1 index for the .ardoc / .ardiag kinds', () => {
    const db = openDatabase(':memory:', [migration001Initial])
    const insert = (id: string, kind: string): void => {
      db.prepare(
        'INSERT INTO files (id, rel_path, kind, title, mtime_ms, size) VALUES (?, ?, ?, ?, 0, 0)'
      ).run(id, `${id}.${kind}`, kind, id)
    }
    insert('old', 'soardoc')

    runMigrations(db, WORKSPACE_MIGRATIONS)

    expect(version(db)).toBe(2)
    expect(db.prepare('SELECT COUNT(*) AS n FROM files').get()).toEqual({ n: 0 })
    expect(() => insert('new', 'ardoc')).not.toThrow()
    expect(() => insert('legacy', 'soardoc')).toThrow()
  })
})

describe('database files', () => {
  let userData: string

  beforeEach(async () => {
    userData = await mkdtemp(join(tmpdir(), 'ar-db-'))
  })

  afterEach(async () => {
    closeAll()
    await rm(userData, { recursive: true, force: true })
  })

  it('keeps one connection per file, in WAL mode', () => {
    const db = openWorkspaceDb(userData, 'ws-1')
    expect(openWorkspaceDb(userData, 'ws-1')).toBe(db)
    expect(db.pragma('journal_mode', { simple: true })).toBe('wal')
    expect(openAppDb(userData)).not.toBe(db)
  })

  it('rejects workspace ids that could escape the indexes folder', () => {
    expect(() => openWorkspaceDb(userData, '../evil')).toThrow('Invalid workspace id')
  })
})
