export function getOriginalMediaUrl(id: string | number): string {
  return `/api/originals/${encodeURIComponent(String(id))}`;
}

export function getOriginalMediaDownloadUrl(id: string | number): string {
  return `${getOriginalMediaUrl(id)}?download=1`;
}
