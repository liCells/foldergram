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
type GalleryServiceModule = typeof import('../src/services/gallery-service.js');
type RepositoriesModule = typeof import('../src/db/repositories.js');
type ScannerServiceModule = typeof import('../src/services/scanner-service.js');

const generateThumbnailDerivativeMock = vi.fn();
const generateDerivativesMock = vi.fn();
const readMediaMetadataMock = vi.fn();

describe.sequential('text scan rules', () => {
  let tempRoot = '';
  let appConfig: AppConfigModule['appConfig'];
  let galleryService: GalleryServiceModule['galleryService'];
  let scannerService: ScannerServiceModule['scannerService'];
  let imageRepository: RepositoriesModule['imageRepository'];
  let textPostRepository: RepositoriesModule['textPostRepository'];
  let folderSharedDescriptionRepository: RepositoriesModule['folderSharedDescriptionRepository'];

  beforeAll(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'insta-text-scan-rules-'));

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
    ({ galleryService } = await import('../src/services/gallery-service.js'));
    ({ scannerService } = await import('../src/services/scanner-service.js'));
    ({ imageRepository, textPostRepository, folderSharedDescriptionRepository } = await import('../src/db/repositories.js'));

    await Promise.all([
      fs.mkdir(appConfig.galleryRoot, { recursive: true }),
      fs.mkdir(appConfig.thumbnailsDir, { recursive: true }),
      fs.mkdir(appConfig.previewsDir, { recursive: true })
    ]);

    readMediaMetadataMock.mockImplementation(async (absolutePath: string) => {
      const mediaType = getMediaTypeFromExtension(path.extname(absolutePath));
      return {
        width: mediaType === 'video' ? 1080 : 1600,
        height: mediaType === 'video' ? 1920 : 1200,
        takenAt: null,
        durationMs: mediaType === 'video' ? 4_000 : null,
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
        durationMs: mediaType === 'video' ? 4_000 : null,
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

  it('indexes root-level text files as standalone text posts', async () => {
    await createSourceFile('videos/1.mp4');
    await createSourceFile('videos/desc.txt', 'root text post');

    await scannerService.scanAll('manual');

    expect(imageRepository.getByRelativePath('videos/1.mp4')).toBeDefined();
    expect(textPostRepository.getByRelativePath('videos/desc.txt')).toBeDefined();
  });

  it('stores a child reserved description as shared text when media exists in that child folder', async () => {
    await createSourceFile('videos/trip/1.mp4');
    await createSourceFile('videos/trip/desc.txt', 'shared trip description');

    await scannerService.scanAll('manual');

    expect(imageRepository.getByRelativePath('videos/trip/1.mp4')).toBeDefined();
    expect(textPostRepository.getByRelativePath('videos/trip/desc.txt')).toBeUndefined();

    const folder = galleryService.listFolders().find((entry) => entry.folderPath === 'videos/trip');
    expect(folder).toBeDefined();
    expect(folderSharedDescriptionRepository.getByFolderId(folder!.id)?.text_content).toContain('shared trip description');
  });

  it('indexes a child reserved description as a text post when the child folder has no media', async () => {
    await createSourceFile('videos/trip/desc.txt', 'lonely text post');

    await scannerService.scanAll('manual');

    expect(textPostRepository.getByRelativePath('videos/trip/desc.txt')).toBeDefined();
    const folder = galleryService.listFolders().find((entry) => entry.folderPath === 'videos/trip');
    expect(folderSharedDescriptionRepository.getByFolderId(folder!.id)).toBeUndefined();
  });

  it('skips only the conflicting child folder when multiple reserved descriptions exist', async () => {
    await createSourceFile('videos/good/1.mp4');
    await createSourceFile('videos/bad/1.mp4');
    await createSourceFile('videos/bad/desc.txt', 'bad a');
    await createSourceFile('videos/bad/description.md', 'bad b');

    const scan = await scannerService.scanAll('manual');

    expect(scan?.status).toBe('completed');
    expect(imageRepository.getByRelativePath('videos/good/1.mp4')).toBeDefined();
    expect(imageRepository.getByRelativePath('videos/bad/1.mp4')).toBeUndefined();
  });

  async function createSourceFile(relativePath: string, contents = 'source'): Promise<void> {
    const absolutePath = path.join(appConfig.galleryRoot, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, `${contents}:${relativePath}`);
  }
});
