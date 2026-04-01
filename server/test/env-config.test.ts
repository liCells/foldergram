import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type EnvModule = typeof import('../src/config/env.js');

describe.sequential('derivative mode env config', () => {
  let tempRoot = '';

  async function stubBaseEnv() {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATA_ROOT', path.join(tempRoot, 'data'));
    vi.stubEnv('GALLERY_ROOT', path.join(tempRoot, 'gallery'));
    vi.stubEnv('DB_DIR', path.join(tempRoot, 'db'));
    vi.stubEnv('THUMBNAILS_DIR', path.join(tempRoot, 'thumbnails'));
    vi.stubEnv('PREVIEWS_DIR', path.join(tempRoot, 'previews'));
  }

  beforeAll(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'insta-env-config-'));
  });

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    vi.resetModules();
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it('uses preview and eager defaults when the new env vars are unset', async () => {
    await stubBaseEnv();
    vi.doMock('dotenv', () => ({
      default: {
        config: vi.fn()
      }
    }));

    const { appConfig } = await import('../src/config/env.js') as EnvModule;

    expect(appConfig.imageDetailSource).toBe('preview');
    expect(appConfig.derivativeMode).toBe('eager');
    expect(appConfig.galleryExcludedFolders).toEqual([]);
  });

  it('parses excluded folder env rules with trimming and dedupe', async () => {
    await stubBaseEnv();
    vi.stubEnv('GALLERY_EXCLUDED_FOLDERS', ' @eaDir , thumbnails , Archive/cache , @eaDir ');
    vi.doMock('dotenv', () => ({
      default: {
        config: vi.fn()
      }
    }));

    const { appConfig } = await import('../src/config/env.js') as EnvModule;

    expect(appConfig.galleryExcludedFolders).toEqual(['@eaDir', 'thumbnails', 'Archive/cache']);
  });

  it('rejects invalid enum values for derivative-related env vars', async () => {
    await stubBaseEnv();
    vi.stubEnv('IMAGE_DETAIL_SOURCE', 'fullres');
    vi.stubEnv('DERIVATIVE_MODE', 'background');
    vi.doMock('dotenv', () => ({
      default: {
        config: vi.fn()
      }
    }));

    await expect(import('../src/config/env.js')).rejects.toThrow();
  });

  it('rejects invalid excluded folder env rules', async () => {
    await stubBaseEnv();
    vi.stubEnv('GALLERY_EXCLUDED_FOLDERS', '../outside,*/cache');
    vi.doMock('dotenv', () => ({
      default: {
        config: vi.fn()
      }
    }));

    await expect(import('../src/config/env.js')).rejects.toThrow();
  });
});
