export type ContentRef =
  | { kind: 'media'; id: number }
  | { kind: 'text'; id: number };

export function encodeMediaContentId(id: number): string {
  return `media:${id}`;
}

export function encodeTextContentId(id: number): string {
  return `text:${id}`;
}

export function parseContentId(value: string | number): ContentRef | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return { kind: 'media', id: value };
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return { kind: 'media', id: Number.parseInt(trimmed, 10) };
  }

  const mediaMatch = /^media:(\d+)$/.exec(trimmed);
  if (mediaMatch) {
    return { kind: 'media', id: Number.parseInt(mediaMatch[1]!, 10) };
  }

  const textMatch = /^text:(\d+)$/.exec(trimmed);
  if (textMatch) {
    return { kind: 'text', id: Number.parseInt(textMatch[1]!, 10) };
  }

  return null;
}
