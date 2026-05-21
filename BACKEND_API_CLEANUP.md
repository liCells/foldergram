# Backend API Cleanup

This file records backend endpoints that the current frontend no longer uses after removing likes, collections, share-style actions, and original-media download/open controls from the product UI.

## No Longer Used By Frontend

### Likes

- `GET /api/likes`
- `POST /api/images/:id/like`
- `DELETE /api/images/:id/like`

### Collections / Saved Items

- `GET /api/collections`
- `POST /api/collections`
- `PATCH /api/collections/:slug`
- `DELETE /api/collections/:slug`
- `GET /api/collections/:slug/images`
- `GET /api/images/:id/collections`
- `POST /api/images/:id/save`
- `DELETE /api/images/:id/save`
- `POST /api/collections/:slug/images/:id`
- `DELETE /api/collections/:slug/images/:id`

### Original Media Direct Actions

- `GET /api/originals/:id`

This endpoint is no longer linked from feed cards, post detail, stories, or reels.

## Still Used Elsewhere

- `GET /api/images/:id`
- `POST /api/images/:id/trash`
- `POST /api/images/:id/restore`
- delete-related media and folder endpoints
- scan, rebuild, folders, feed, reels, places, and search endpoints

## Notes

- The backend routes remain in place for now.
- Auth payload fields and backend capability names related to likes or collections may still exist even though the frontend no longer exposes those product features.
