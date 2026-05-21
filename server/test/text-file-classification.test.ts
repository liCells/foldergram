import { describe, expect, it } from 'vitest';

import {
  getMediaTypeFromExtension,
  getMimeTypeFromExtension,
  isReservedDescriptionFilename,
  isSupportedMediaFile,
  isSupportedTextFile
} from '../src/utils/image-utils.js';

describe('text file classification', () => {
  it('recognizes supported text files separately from media files', () => {
    expect(isSupportedTextFile('notes.txt')).toBe(true);
    expect(isSupportedTextFile('entry.md')).toBe(true);
    expect(isSupportedTextFile('photo.jpg')).toBe(false);
    expect(isSupportedTextFile('clip.mp4')).toBe(false);

    expect(isSupportedMediaFile('photo.jpg')).toBe(true);
    expect(isSupportedMediaFile('clip.mp4')).toBe(true);
    expect(isSupportedMediaFile('notes.txt')).toBe(false);
  });

  it('recognizes reserved description filenames', () => {
    expect(isReservedDescriptionFilename('desc.txt')).toBe(true);
    expect(isReservedDescriptionFilename('desc.md')).toBe(true);
    expect(isReservedDescriptionFilename('description.txt')).toBe(true);
    expect(isReservedDescriptionFilename('description.md')).toBe(true);

    expect(isReservedDescriptionFilename('notes.txt')).toBe(false);
    expect(isReservedDescriptionFilename('description.mdx')).toBe(false);
  });

  it('maps text extensions to the text media type and mime types', () => {
    expect(getMediaTypeFromExtension('.txt')).toBe('text');
    expect(getMediaTypeFromExtension('.md')).toBe('text');
    expect(getMediaTypeFromExtension('.jpg')).toBe('image');
    expect(getMediaTypeFromExtension('.mp4')).toBe('video');

    expect(getMimeTypeFromExtension('.txt')).toBe('text/plain');
    expect(getMimeTypeFromExtension('.md')).toBe('text/markdown');
  });
});
