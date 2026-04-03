import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getMediaTypeFromExtension,
  getPreviewRelativePath,
  getThumbnailRelativePath
} from '../src/utils/image-utils.js';

type AppConfigModule = typeof import('../src/config/env.js');
type ScannerServiceModule = typeof import('../src/services/scanner-service.js');
type RepositoriesModule = typeof import('../src/db/repositories.js');

const generateThumbnailDerivativeMock = vi.fn();
const generateDerivativesMock = vi.fn();
const readMediaMetadataMock = vi.fn();

describe.sequential('startup behavior', () => {
  let tempRoot = '';
  let appConfig: AppConfigModule['appConfig'];
  let scannerService: ScannerServiceModule['scannerService'];
  let folderRepository: RepositoriesModule['folderRepository'];
  let imageRepository: RepositoriesModule['imageRepository'];
  let maintenanceRepository: RepositoriesModule['maintenanceRepository'];
  let scanRunRepository: RepositoriesModule['scanRunRepository'];

  beforeAll(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'insta-startup-behavior-'));

    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATA_ROOT', path.join(tempRoot, 'data'));
    vi.stubEnv('GALLERY_ROOT', path.join(tempRoot, 'gallery'));
    vi.stubEnv('DB_DIR', path.join(tempRoot, 'db'));
    vi.stubEnv('THUMBNAILS_DIR', path.join(tempRoot, 'thumbnails'));
    vi.stubEnv('PREVIEWS_DIR', path.join(tempRoot, 'previews'));
  });

  beforeEach(async () => {
    generateThumbnailDerivativeMock.mockReset();
    generateDerivativesMock.mockReset();
    readMediaMetadataMock.mockReset();

    await fs.rm(tempRoot, { recursive: true, force: true });
    await fs.mkdir(tempRoot, { recursive: true });

    vi.resetModules();
    vi.doMock('../src/services/derivative-service.js', () => ({
      generateDerivatives: generateDerivativesMock,
      generateThumbnailDerivative: generateThumbnailDerivativeMock,
      readMediaMetadata: readMediaMetadataMock
    }));

    ({ appConfig } = await import('../src/config/env.js'));
    ({ scannerService } = await import('../src/services/scanner-service.js'));
    ({ folderRepository, imageRepository, maintenanceRepository, scanRunRepository } = await import('../src/db/repositories.js'));

    await Promise.all([
      fs.mkdir(appConfig.galleryRoot, { recursive: true }),
      fs.mkdir(appConfig.thumbnailsDir, { recursive: true }),
      fs.mkdir(appConfig.previewsDir, { recursive: true })
    ]);

    readMediaMetadataMock.mockImplementation(async (sourcePath: string) => {
      const mediaType = getMediaTypeFromExtension(path.extname(sourcePath));
      return {
        width: mediaType === 'video' ? 1080 : 1600,
        height: mediaType === 'video' ? 1920 : 1200,
        takenAt: null,
        durationMs: mediaType === 'video' ? 12_000 : null,
        mediaType,
        playbackStrategy: 'preview',
        isAnimated: false
      };
    });

    generateDerivativesMock.mockImplementation(async (_sourcePath: string, relativePath: string) => {
      const mediaType = getMediaTypeFromExtension(path.extname(relativePath));
      return {
        width: mediaType === 'video' ? 1080 : 1600,
        height: mediaType === 'video' ? 1920 : 1200,
        takenAt: null,
        durationMs: mediaType === 'video' ? 12_000 : null,
        mediaType,
        playbackStrategy: 'preview',
        isAnimated: false,
        thumbnailPath: getThumbnailRelativePath(relativePath),
        previewPath: getPreviewRelativePath(relativePath, mediaType),
        generatedThumbnail: true,
        generatedPreview: true
      };
    });
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    vi.resetModules();
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it('queues a startup scan when the library has no indexed folders yet', async () => {
    await createSourceFile('fresh/photo-1.jpg');

    const action = scannerService.handleStartup('startup');

    expect(action).toBe('scan');

    await waitFor(() => scanRunRepository.latestCompleted()?.status === 'completed');
    expect(imageRepository.countFeed()).toBe(1);
  });

  it('skips the startup scan when an index already exists for the current gallery root', async () => {
    await createSourceFile('fresh/photo-1.jpg');
    maintenanceRepository.resetLibraryIndex();
    await scannerService.scanAll('manual');
    const lastRunId = scanRunRepository.latest()?.id ?? null;

    const action = scannerService.handleStartup('startup');

    expect(action).toBe('idle');
    await wait(50);
    expect(scanRunRepository.latest()?.id ?? null).toBe(lastRunId);
  });

  it('keeps startup idle when legacy derivative migration is still pending and waits for a manual scan', async () => {
    const relativePath = 'legacy/photo-1.jpg';
    const absolutePath = await createSourceFile(relativePath);
    const thumbnailPath = getThumbnailRelativePath(relativePath);
    const previewPath = getPreviewRelativePath(relativePath, 'image');
    const folder = folderRepository.upsert({
      slug: 'legacy',
      name: 'legacy',
      folderPath: 'legacy'
    });

    await fs.mkdir(path.dirname(path.join(appConfig.thumbnailsDir, thumbnailPath)), { recursive: true });
    await fs.mkdir(path.dirname(path.join(appConfig.previewsDir, previewPath)), { recursive: true });
    await fs.writeFile(path.join(appConfig.thumbnailsDir, thumbnailPath), 'legacy-thumb');
    await fs.writeFile(path.join(appConfig.previewsDir, previewPath), 'legacy-preview');

    imageRepository.upsert({
      folderId: folder.id,
      filename: 'photo-1.jpg',
      extension: '.jpg',
      relativePath,
      absolutePath,
      fileSize: Buffer.byteLength(`source:${relativePath}`),
      width: 1600,
      height: 1200,
      mediaType: 'image',
      mimeType: 'image/jpeg',
      durationMs: null,
      fingerprint: `${relativePath}:1`,
      mtimeMs: Date.parse('2026-03-07T12:00:00.000Z'),
      firstSeenAt: '2026-03-07T12:00:00.000Z',
      sortTimestamp: Date.parse('2026-03-07T12:00:00.000Z'),
      takenAt: Date.parse('2026-03-07T12:00:00.000Z'),
      takenAtSource: 'mtime',
      exifJson: '{}',
      thumbnailPath,
      previewPath
    });

    const action = scannerService.handleStartup('startup');

    expect(action).toBe('idle');
    await wait(50);

    const untouched = imageRepository.getByRelativePath(relativePath);
    expect(untouched?.asset_key).toBeNull();
    expect(untouched?.thumbnail_path).toBe(thumbnailPath);
    expect(untouched?.preview_path).toBe(previewPath);

    await scannerService.scanAll('manual');

    const migrated = imageRepository.getByRelativePath(relativePath);
    expect(migrated?.asset_key).toMatch(/^[a-f0-9]{32}$/);
    expect(migrated?.thumbnail_path).not.toBe(thumbnailPath);
    expect(migrated?.preview_path).not.toBe(previewPath);
  });

  async function createSourceFile(relativePath: string): Promise<string> {
    const absolutePath = path.join(appConfig.galleryRoot, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, `source:${relativePath}`);
    return absolutePath;
  }
});

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitFor(check: () => boolean, timeoutMs = 2000): Promise<void> {
  const startedAt = Date.now();

  while (!check()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('Timed out waiting for startup scan to finish');
    }

    await wait(25);
  }
}
