---
title: Troubleshooting
description: Common Foldergram issues and the exact implementation details behind them.
---

# Troubleshooting

## The app says the library storage is unavailable

Foldergram checks the configured:

- gallery directory
- thumbnails directory
- previews directory

If any of those are unavailable, the UI reports the reason exposed by the
backend.

Check:

- the configured paths in `.env`
- whether those paths exist
- whether `DB_DIR`, `THUMBNAILS_DIR`, and `PREVIEWS_DIR` are writable by the current process

`GALLERY_ROOT` is scanned read-only. It does not need write access unless you
use delete actions that remove originals from the gallery.

## The database keeps resetting

If `DB_DIR` is unavailable, Foldergram falls back to an in-memory SQLite
database. That means indexed state disappears when the process stops.

Fix the configured database directory first.

## Nothing is being indexed

Start with the gallery structure rules:

- files directly inside `GALLERY_ROOT` are ignored
- hidden folders are ignored
- a folder is indexed only when it directly contains supported media

This will not be indexed:

```text
gallery/
  loose-file.jpg
  trips/
    oslo/
      notes.txt
```

This will be indexed:

```text
gallery/
  trips/
    oslo/
      IMG_0001.jpg
```

## Rescan returns a rebuild-required message

This happens when the configured gallery root changed after a prior successful
library index already existed.

Use Settings or `POST /api/admin/rebuild-index` to rebuild the library against
the new root.

## I moved files into different folders and expected them to stay the same post

After the derivative-layout upgrade migration has completed, full rescans can
preserve the same indexed row, likes, and derivative paths for safe file moves.

Check:

- that a full scan has already completed since the upgrade
- that the moved file kept the same size and modification time
- that the old source path is genuinely gone, not duplicated

If a move is ambiguous, Foldergram falls back to the older delete-and-new
behavior to avoid matching the wrong file.

## Old thumbnails or previews are still on disk after files disappeared

Missing originals are soft-deleted first. Stale derivatives are cleaned up only
after the retention window on a later successful full scan.

That is intentional so temporary share outages or accidental moves do not
immediately delete cached derivatives.

## Moments are missing and highlights appear instead

That is expected when the library does not have enough EXIF-backed timestamps.

Foldergram switches to Highlights unless it has:

- at least `24` indexed posts
- at least `18` EXIF-backed posts
- at least `30%` EXIF coverage

## A folder named `stories` stopped appearing as a normal album

That is expected when Foldergram is using the default reserved-stories mode.

In that mode, `AppFolder/stories` is reinterpreted as folder-story data instead
of a standalone app folder.

If you want folders literally named `stories` to remain ordinary app folders:

1. open `Settings -> General Settings`
2. enable `Treat stories folders as normal app folders`
3. save the change
4. run a scan from `Settings -> Scan & Library`

## A folder is still showing up after I excluded it

Folder exclusions can come from:

- `GALLERY_EXCLUDED_FOLDERS` in `.env` or Docker Compose
- custom rules in `Settings -> General Settings`

Check:

- rules without a slash match folder names anywhere in the gallery tree
- rules with a slash match one exact relative path below `GALLERY_ROOT`
- env-backed rules require a restart to change
- custom rules require `Save changes`, then a full scan from `Settings -> Scan & Library`

If the folder was already indexed before the rule existed, it will stay visible
until that scan finishes and soft-removes it from the index.

## Videos fail to index or generate previews

Check that both tools are installed and available on `PATH`:

- `ffprobe`
- `ffmpeg`

Foldergram uses them directly for supported video files.

## A video opens from the original file instead of a generated preview

That is a normal optimization. Foldergram streams the original file directly
when the video is already suitable for browser playback under the current size
and codec rules.

See [Media Processing](/media-processing) for the exact conditions.

## The development watcher is not reacting

The watcher is not a permanent always-on background process for every startup
path. It is development-only and is started by the scan and rebuild flows.

If needed:

1. run a manual scan from Settings
2. make your filesystem change again

## Likes disappeared after a rebuild

That is expected for `Rebuild Library Index`. The rebuild resets the indexed
library tables, including `likes`.

Thumbnail-only rebuilds do not clear likes.

## Docs build fails

Use the root command:

```bash
pnpm build:docs
```

If it fails, check for:

- broken internal links
- invalid frontmatter
- mistakes in `docs/.vitepress/config.ts`

## The app still behaves oddly in development after frontend changes

The client actively unregisters previously installed service workers in
development. Reload once after startup if you previously visited a production
build from the same origin and the browser still has stale cached assets.
