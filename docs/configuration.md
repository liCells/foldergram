---
title: Configuration
description: Environment variables, path rules, and scan concurrency controls in Foldergram.
---

# Configuration

For source installs, Foldergram reads `.env` from the repository root and
validates it in `server/src/config/env.ts`.

In the default Docker Compose setup, the container uses the image's built-in
production defaults plus the mounted `./data/...` volumes. The source-install
`.env` file is not read directly inside the container unless you wire that in
yourself.

## Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `SERVER_PORT` | `4141` | Production Express port. Used by Docker and `pnpm start`. |
| `DEV_SERVER_PORT` | `4140` | Express server port during `pnpm dev`. |
| `DEV_CLIENT_PORT` | `4141` | Base Vite dev server port during `pnpm dev`. The client may fall forward through `4144`. The same range is allowed for non-production local-origin mutation checks. |
| `DATA_ROOT` | `./data` | Base directory used when specific paths are not set. |
| `DATA_DIR` | unset | Optional alias that falls back into `DATA_ROOT` resolution when `DATA_ROOT` is absent. |
| `GALLERY_ROOT` | `./data/gallery` | Source media root. Foldergram scans below this path. |
| `DB_DIR` | `./data/db` | SQLite directory. Database file is `gallery.sqlite`. |
| `THUMBNAILS_DIR` | `./data/thumbnails` | Generated thumbnail output root. |
| `PREVIEWS_DIR` | `./data/previews` | Generated preview output root. |
| `IMAGE_DETAIL_SOURCE` | `preview` | For image detail pages, use generated previews or stream originals. Videos ignore this flag. |
| `DERIVATIVE_MODE` | `eager` | Generate derivatives during scans or lazily on the first protected derivative request. |
| `LOG_VERBOSE` | `0` | Truthy values are `1`, `true`, `yes`, and `on`. |
| `SCAN_DISCOVERY_CONCURRENCY` | `4` | Discovery concurrency, validated from `1` to `32`. |
| `SCAN_DERIVATIVE_CONCURRENCY` | `4` | Derivative concurrency, validated from `1` to `32`. |
| `PUBLIC_DEMO_MODE` | `0` | When enabled, mutating API routes return `403` for read-only demo deployments. |
| `CSRF_TRUSTED_ORIGINS` | unset | Comma-separated extra browser origins allowed for mutating API requests. Useful behind reverse proxies or HTTPS terminators. |
| `NODE_ENV` | `development` | Must be `development`, `test`, or `production`. |

## Access protection configuration

Shared-password protection is **not** configured in `.env`.

Instead:

- enable it from the Settings page
- Foldergram stores the password hash and session metadata in SQLite `app_settings`
- deleting or replacing the SQLite database resets the configured password protection state

The built-in auth model is a small role-based password gate for one app
instance, not a multi-user account system.

## Path resolution rules

- Relative paths are resolved from the repository root.
- Absolute paths are used as-is.
- `THUMBNAILS_DIR` and `PREVIEWS_DIR` must be separate, non-overlapping directories.
- `THUMBNAILS_DIR` cannot contain `GALLERY_ROOT`.
- `PREVIEWS_DIR` cannot contain `GALLERY_ROOT`.

Foldergram normalizes path separators so the same rules work with POSIX-style and
Windows-style paths.

## Detail source and derivative timing

### `IMAGE_DETAIL_SOURCE`

Accepted values:

- `preview`
- `original`

Behavior:

- applies to image detail pages only
- `preview` keeps `/image/:id` on generated preview assets
- `original` makes image detail pages use `/api/originals/:id`
- does not change feed cards, folder grids, avatars, or other list surfaces
- does not change video default playback behavior

### `DERIVATIVE_MODE`

Accepted values:

- `eager`
- `lazy`

Behavior:

- `eager` generates thumbnails and previews during scans
- `lazy` still indexes metadata during scans, but missing files are generated on the first request to `/thumbnails/...` or `/previews/...` and then cached on disk
- lazy mode applies to thumbnails and previews
- lazy mode keeps derivative URLs deterministic because the indexed relative derivative paths are still stored in SQLite

### Recommended combinations

| Goal | Suggested config |
| --- | --- |
| Current behavior | `IMAGE_DETAIL_SOURCE=preview`, `DERIVATIVE_MODE=eager` |
| Lowest upfront processing for large libraries | `IMAGE_DETAIL_SOURCE=original`, `DERIVATIVE_MODE=lazy` |

### Settings actions and lazy mode

- `Scan Library` always refreshes index metadata.
- `Rebuild Library Index` resets and rebuilds the SQLite-backed index, then reuses any matching derivatives already on disk.
- In `DERIVATIVE_MODE=lazy`, neither a normal scan nor `Rebuild Library Index` pre-generates missing thumbnails or previews.
- `Regenerate Thumbnails` remains a manual thumbnail and video-poster rebuild only. It does not rebuild previews.

## Managed path ignores

If your configured database, thumbnails, or previews directories live inside the
gallery tree, Foldergram computes their relative paths and excludes them from
discovery. That prevents generated files from being re-indexed as source media.

## Recommended local `.env`

`.env.example` intentionally keeps only the development ports. Production
runtimes still use `SERVER_PORT`, which defaults to `4141` unless you override
it in Docker Compose or at process start.

```bash
DEV_CLIENT_PORT=4141
DEV_SERVER_PORT=4140
DATA_ROOT=./data
GALLERY_ROOT=./data/gallery
DB_DIR=./data/db
THUMBNAILS_DIR=./data/thumbnails
PREVIEWS_DIR=./data/previews
IMAGE_DETAIL_SOURCE=preview
DERIVATIVE_MODE=eager
LOG_VERBOSE=0
SCAN_DISCOVERY_CONCURRENCY=4
SCAN_DERIVATIVE_CONCURRENCY=4
PUBLIC_DEMO_MODE=0
CSRF_TRUSTED_ORIGINS=
NODE_ENV=development
```

## Concurrency tuning

`SCAN_DISCOVERY_CONCURRENCY` affects filesystem stat and metadata discovery work.
`SCAN_DERIVATIVE_CONCURRENCY` affects Sharp and FFmpeg jobs.

Practical guidance:

- Keep the defaults on smaller machines.
- Increase discovery concurrency only when storage is fast enough to benefit.
- Increase derivative concurrency only when CPU, RAM, and disk bandwidth can handle it.

## Gallery structure expectations

Foldergram ignores files placed directly in `GALLERY_ROOT`.

It indexes only folders that directly contain supported media:

```text
gallery/
  loose-file.jpg         # ignored
  trips/
    oslo/
      IMG_0001.jpg       # indexed folder
    berlin/
      notes.txt          # not indexed
```

## Gallery root changes

Foldergram stores the last successful gallery root in `app_settings`.

When the configured gallery root changes and there is already indexed content,
Foldergram marks the library as requiring a rebuild. Until that rebuild happens:

- startup scanning is deferred
- manual rescans return `409`
- thumbnail rebuilds return `409`

Viewer-safe shell status comes from `GET /api/status`.

The current and previous gallery roots remain exposed only in
`GET /api/admin/stats`.
