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
type ScannerServiceModule = typeof import('../src/services/scanner-service.js');

const generateThumbnailDerivativeMock = vi.fn();
const generateDerivativesMock = vi.fn();
const readMediaMetadataMock = vi.fn();

describe.sequential('text gallery service', () => {
  let tempRoot = '';
  let appConfig: AppConfigModule['appConfig'];
  let galleryService: GalleryServiceModule['galleryService'];
  let scannerService: ScannerServiceModule['scannerService'];

  beforeAll(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'insta-text-gallery-service-'));

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

  it('returns mixed media and text items in the feed with stable content ids', async () => {
    await createSourceFile('videos/1.mp4');
    await createSourceFile('videos/desc.txt', 'hello world');

    await scannerService.scanAll('manual');

    const payload = galleryService.getFeed(1, 20, 'recent');

    expect(payload.total).toBe(2);
    expect(payload.items.map((item) => item.contentId)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^media:/), expect.stringMatching(/^text:/)])
    );
  });

  it('returns text detail by content id', async () => {
    await createSourceFile('videos/desc.md', '# hello\n\nbody');

    await scannerService.scanAll('manual');

    const item = galleryService.getFeed(1, 20, 'recent').items.find((entry) => entry.mediaType === 'text');
    expect(item).toBeDefined();

    const detail = galleryService.getImageDetail(item!.contentId);
    expect(detail?.mediaType).toBe('text');
    expect(detail?.textContent).toContain('# hello');
    expect(detail?.textFormat).toBe('markdown');
  });

  it('returns shared description in media detail payloads', async () => {
    await createSourceFile('videos/trip/1.mp4');
    await createSourceFile('videos/trip/desc.txt', 'shared note');

    await scannerService.scanAll('manual');

    const item = galleryService.getFeed(1, 20, 'recent').items.find((entry) => entry.mediaType === 'video');
    expect(item).toBeDefined();

    const detail = galleryService.getImageDetail(item!.contentId);
    expect(detail?.sharedDescription).toContain('shared note');
    expect(detail?.sharedDescriptionFormat).toBe('plain');
  });

  it('includes text posts in search results and matches their body content', async () => {
    await createSourceFile('videos/notes.md', '# Travel Plan\n\nVisit the panda reserve at dawn.');
    await createSourceFile('videos/1.mp4');

    await scannerService.scanAll('manual');

    const payload = galleryService.searchMedia('panda reserve', 1, 20);

    expect(payload.total).toBe(1);
    expect(payload.items[0]?.mediaType).toBe('text');
    expect(payload.items[0]?.contentId).toMatch(/^text:/);
  });

  async function createSourceFile(relativePath: string, contents = 'source'): Promise<void> {
    const absolutePath = path.join(appConfig.galleryRoot, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, `${contents}:${relativePath}`);
  }
});
