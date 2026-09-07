# Database-backed kanji progress

The learning path now saves kanji review snapshots through `GET` and `PUT /api/study-profile`.

Each browser receives a random profile identifier in an HttpOnly, SameSite=Strict cookie. It is scoped to the study-profile API, never appears in a URL, and lasts one year. This is browser-profile persistence, not login or account-based cross-device sync. Export a backup before moving browsers or clearing cookies.

The `study_profile` table stores a revision and validated JSON review state. A write includes the revision that was read. A stale write receives `409 Conflict`; the frontend fetches the newest snapshot, merges card states, and retries up to twice. The merge keeps the higher attempt count; when attempts tie, it keeps the later due date. This handles independent reviews and avoids adding attempts when a backup is restored repeatedly.

Existing browser data under `kotoba-kanji-reviews-v1` is read once, merged into the new profile, then retained as a local cache. A disconnected browser keeps working with that cache. The learning screen exposes **Retry sync** and only reports success after the database confirms it. Corrupt local data is preserved rather than overwritten. JSON import validates first and merges without erasing newer records.

By default, local backend runs use file-backed H2 at `backend/data/nihongo`; the directory is ignored by Git. Docker Compose continues to configure PostgreSQL through `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD`.

The API validates record shape, stage bounds, attempt counts, due-date bounds, request size, and profile revision. Missing cookies receive `401`; browser-declared cross-site writes receive `403`; malformed payloads receive `400`.

From `frontend`, run `npm run test:curriculum`, `npm run test:kanji`, `npm run test:sync`, and `npm run build`. Backend tests cover profile isolation, persistence, stale revisions, secure-cookie behavior, and invalid writes. Browser verification covers migration, database restore, offline retry, conflict merging, backup safety, and mobile layout.
