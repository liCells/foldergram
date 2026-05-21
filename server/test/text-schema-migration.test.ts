import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type DatabaseModule = typeof import('../src/db/database.js');

describe.sequential('text schema migration', () => {
  let tempRoot = '';
  let databaseManager: DatabaseModule['databaseManager'];

  beforeAll(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'insta-text-schema-'));
  });

  beforeEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
    await fs.mkdir(tempRoot, { recursive: true });

    vi.unstubAllEnvs();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATA_ROOT', path.join(tempRoot, 'data'));
    vi.stubEnv('GALLERY_ROOT', path.join(tempRoot, 'gallery'));
    vi.stubEnv('DB_DIR', path.join(tempRoot, 'db'));
    vi.stubEnv('THUMBNAILS_DIR', path.join(tempRoot, 'thumbnails'));
    vi.stubEnv('PREVIEWS_DIR', path.join(tempRoot, 'previews'));
    vi.resetModules();

    ({ databaseManager } = await import('../src/db/database.js'));
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    vi.resetModules();
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it('creates text_posts and folder_shared_descriptions tables', () => {
    const tables = databaseManager.connection
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;
    const names = new Set(tables.map((row) => row.name));

    expect(names.has('text_posts')).toBe(true);
    expect(names.has('folder_shared_descriptions')).toBe(true);
  });

  it('creates the expected columns for text_posts', () => {
    const columns = databaseManager.connection
      .prepare('PRAGMA table_info(text_posts)')
      .all() as Array<{ name: string }>;
    const names = new Set(columns.map((column) => column.name));

    expect(names).toEqual(new Set([
      'id',
      'folder_id',
      'filename',
      'extension',
      'relative_path',
      'absolute_path',
      'file_size',
      'checksum_or_fingerprint',
      'mtime_ms',
      'first_seen_at',
      'sort_timestamp',
      'text_content',
      'text_format',
      'is_deleted',
      'deleted_at',
      'is_trashed',
      'trashed_at',
      'created_at',
      'updated_at'
    ]));
  });

  it('creates the expected columns for folder_shared_descriptions', () => {
    const columns = databaseManager.connection
      .prepare('PRAGMA table_info(folder_shared_descriptions)')
      .all() as Array<{ name: string }>;
    const names = new Set(columns.map((column) => column.name));

    expect(names).toEqual(new Set([
      'folder_id',
      'source_relative_path',
      'source_absolute_path',
      'source_extension',
      'source_file_size',
      'source_mtime_ms',
      'text_content',
      'text_format',
      'updated_at'
    ]));
  });
});
