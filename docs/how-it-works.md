---
title: How It Works
description: The indexing model, storage layout, scan lifecycle, and feed logic behind Foldergram.
---

# How It Works

## Architecture at a glance

Foldergram has two deliberate layers:

1. A scanner/indexer that walks the gallery tree, updates SQLite, and generates derivatives.
2. A runtime API and SPA that read indexed data from SQLite and serve static derivative assets.

That separation is the core performance decision in the project.

## Source discovery model

Foldergram recursively walks `GALLERY_ROOT` and applies these rules:

- Hidden paths are skipped.
- Managed storage paths under the gallery root are skipped.
- Folder exclusions from `GALLERY_EXCLUDED_FOLDERS` and saved `General Settings` rules are skipped.
- Any non-hidden folder that directly contains supported media becomes an indexed album.
- Files directly in `GALLERY_ROOT` are ignored.
- Nested folders are treated separately from their parent folders.
- In the default reserved-stories mode, a child `stories/` folder beneath an indexed owner folder is withheld from normal album discovery and scanned separately as story data.

## Reserved stories folders

By default, Foldergram treats `AppFolder/stories` as a reserved subtree for
that app folder.

The scan model is:

- direct media inside `AppFolder/stories` becomes a `story_root` folder used for the avatar story set
- each direct child directory under `AppFolder/stories` becomes one `story_capsule`
- nested media below that direct child directory is collected recursively into the same capsule
- reserved story folders do not become normal app folders while this mode is enabled
- if the reserved root has no direct media but highlight capsules exist, Foldergram synthesizes an avatar-story entry from recent highlight media

This behavior is controlled by the Settings toggle `Treat stories folders as
normal app folders`. When that legacy mode is enabled, `stories/` folders are
discovered like ordinary app folders again.

## Excluded folders

Foldergram merges exclusion rules from:

- `GALLERY_EXCLUDED_FOLDERS`
- custom rules saved from `Settings -> General Settings`

Rule semantics are intentionally simple:

- values without a slash match folder names anywhere in the gallery tree
- values with a slash match one exact relative path below `GALLERY_ROOT`

Excluded folders are skipped during startup scans, rescans, and watcher-driven
discovery work. Changing the saved runtime rules updates `app_settings`
immediately, but a follow-up scan from `Settings -> Scan & Library` is still
required so already-indexed matches can be soft-removed from the library.

## Storage layout

By default the app uses:

```text
data/
  gallery/       # originals
  db/
    gallery.sqlite
  thumbnails/    # mirrored thumbnail derivatives
  previews/      # mirrored preview derivatives
```

The database schema includes:

- `folders`
- `images`
- `scan_runs`
- `app_settings`
- `folder_scan_state`
- `likes`

## What is stored per indexed post

The `images` table stores:

- normalized relative and absolute paths
- file size and `mtime_ms`
- width and height
- media type and MIME type
- duration for videos
- a fingerprint built from `relative_path + file_size + mtime_ms`
- `sort_timestamp`
- `taken_at` and `taken_at_source`
- mirrored derivative paths
- playback strategy for videos
- soft-delete state

## Stable ordering

Foldergram preserves stable sort order across rescans.

If a file already exists in the database, the scanner keeps its prior
`sort_timestamp`. If not, it falls back to:

1. the existing `first_seen_at`, if present
2. the current file `mtime_ms`

That prevents older posts from jumping around every time the library is rescanned.

## Soft delete and reactivation

Foldergram does not hard-delete missing indexed files during scans.

Instead it:

- marks missing files as `is_deleted = 1`
- keeps their historical row data
- reactivates them if the same relative path reappears later

Direct user-triggered delete actions are different. Those remove the source file
and derivatives first, then mark or remove the indexed records as part of the
delete flow.

## Folder shortcuts during scans

To avoid unnecessary work, Foldergram records per-folder scan signatures in
`folder_scan_state`. If a folder signature still matches and metadata coverage is
complete, the scanner can skip reprocessing every file in that folder.

That shortcut is bypassed when Foldergram needs to repair unchanged derivatives
or when gallery-root assumptions no longer match.

## Full scan lifecycle

During a full scan, Foldergram:

1. Walks the gallery tree to discover source folders.
2. Stats supported files in those folders.
3. Resolves folder records and stable slugs.
4. Scans reserved `stories/` subtrees for owner folders when reserved-stories mode is active.
5. Reads or refreshes media metadata.
6. Marks missing indexed rows as deleted.
7. Queues derivative work for changed or missing outputs.
8. Writes scan status to `scan_runs`.

## Incremental scans and watching

The project includes a chokidar watcher for development. It batches changes with
a `700ms` debounce window and chooses between:

- a full rescan for directory add/remove events
- an incremental scan for file-level changes

The watcher is not part of request handling, and request handlers never scan the
filesystem directly.

## Feed behavior

The home feed supports three modes:

| Mode | Behavior |
| --- | --- |
| `recent` | Uses `taken_at` when available, otherwise `sort_timestamp`, then diversifies bursts from the same folder. |
| `rediscover` | Surfaces posts older than 180 days and prioritizes liked items within that older pool. |
| `random` | Uses a deterministic seeded shuffle so a browsing session stays stable while paging. |

## Reels behavior

The `/reels` route reads only indexed video candidates from SQLite. It does not
scan the filesystem on request.

The page opens with the app-wide default configured in Settings and does not
provide an inline mode switch of its own.

| Mode | Behavior |
| --- | --- |
| `recommended` | Builds a seeded queue from indexed videos using freshness, likes, folder-affinity signals from recent navigation, portrait fit, duration fit, and a small deterministic jitter. It also penalizes immediate repeats from the same folder when alternatives exist. |
| `recent` | Uses newest indexed videos first. |
| `random` | Uses a deterministic seeded shuffle so the queue stays stable while paging. |

## Moments and highlights

`GET /api/feed/moments` can return either Moments or Highlights.

### Moments

Foldergram prefers date-based moments when the library has enough EXIF-backed
timestamps:

- at least `24` indexed posts
- at least `18` posts with `taken_at_source = 'exif'`
- at least `30%` EXIF coverage

The current date-driven capsules are:

- On This Day
- This Week
- Last Year Around Now

### Highlights

When date coverage is too sparse, Foldergram falls back to curated sets:

- Recent Batches
- Forgotten Favorites
- Deep Cuts
- Lucky Dip

## Folder stories

Folder stories use separate SQLite-backed queries from `GET /api/feed/moments`.

- folder summaries expose whether a folder currently has an avatar-story entry point
- `GET /api/folders/:slug/stories` returns the folder's avatar story and highlight capsules
- `GET /api/folders/:slug/stories/:id` pages through the media for one story capsule
- neither route walks the filesystem on request

## Folder rebuild requirement

Foldergram tracks the last successful gallery root. If that path changes and
there is already indexed content, the scanner marks the library as requiring a
rebuild. This is meant to prevent silent cross-library drift in the index and
cached derivatives.

## Runtime read model

Once data is indexed:

- folder pages read from SQLite
- feed pages read from SQLite
- likes read from SQLite
- moments, highlights, and folder stories read from SQLite
- thumbnails and previews are served as static files
- originals are served by image ID only
