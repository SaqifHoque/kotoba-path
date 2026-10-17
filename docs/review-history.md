# Review history

Open **Review history** in the sidebar to see saved attempts from the kanji path, vocabulary sessions, and Kanji Forge. The newest received attempts appear first, 50 at a time. **Load older attempts** continues from a receipt cursor, so newly arriving offline attempts do not shift the older pages. **Refresh history** starts again with the newest receipts.

History begins with attempts recorded by this version. Existing review snapshots and imported backups do not create past attempts. Completing a kanji or vocabulary recall records the chosen Again/Hard/Good rating. A first introduction or a recall before its scheduled date is classified as learning. A learned item answered at or after its due time is classified as scheduled. Forge records a completed introduction only after its lesson checks pass, and a scheduled answer only when the engine accepts a mastery update. Unfinished lessons, personal notes, settings, placement checks, and extra-practice sessions do not create attempts.

The summary reports all recorded attempts, scheduled attempts, and scheduled recall. Good, Hard, and Correct count as recalled; Again and Incorrect do not. Learning checks are excluded from that percentage. These are learner-reported or answer-checked results, not a calibrated prediction of retention. Raw typed answers are not stored.

## Offline and concurrent saves

Every attempt gets a random UUID and an immutable payload. The browser stores each pending attempt under its own account-scoped key before sending its progress update. Separate keys prevent two tabs from overwriting a shared queue array. Unsaved attempts survive reloads when browser storage is available; if storage fails, a warning explains that the open tab is the remaining copy. Do not clear browser data while attempts are waiting to sync.

The client sends up to 100 pending events with each existing study-profile PUT. The backend locks the profile row, checks its revision and ownership, updates the snapshot, and appends events in a single transaction. A stale revision, invalid event, or altered payload for an existing UUID rolls back the entire save. Duplicate UUIDs with identical payloads are acknowledged without adding history rows. Events are removed from the outbox only after the server acknowledges their exact IDs; an event created while another request is in flight is not removed by that request's response.

After a conflict, the client reads the current snapshot, uses the existing merge policy, and retries with the same event IDs. A committed request whose response was lost can also be retried safely. Distinct attempts made by concurrent devices remain distinct history entries, even if they concern the same item. Old clients can omit events without erasing history. Registering an account claims the existing profile and its history together; signing in and out retains the account boundaries introduced in V3.

This PR does not replace the SRS algorithms or replay events into schedules. The existing snapshot merge still selects by attempt counts and scheduling ties (or Forge's review-track rules). Concurrent answers therefore need not add together in legacy snapshot counters. Use the history summary for event-based attempt counts and recall; the existing Forge dashboard still uses its snapshot counters. Full event-sourced scheduling and reconciliation are separate work.

## API

- `PUT /api/study-profile` accepts optional `reviewEvents` alongside the existing snapshot and revision. A successful response contains `revision` and `acknowledgedEvents`. Old callers that send no events receive an empty acknowledgement list.
- `GET /api/study-profile/reviews?limit=50&before=<cursor>` returns `events`, `nextCursor`, `total`, `scheduled`, and `remembered`. Limit is 1–100. The cursor is an opaque decimal string; omit it for the latest page. The response uses `Cache-Control: no-store` and the existing profile-cookie/session ownership checks.

Each event contains `id`, `mode` (`kanji`, `vocabulary`, or `forge`), `subject`, `label`, `skill` (`meaning`, `reading`, or `both`), `kind` (`learning` or `scheduled`), `outcome`, and `occurredAt`. Kanji/vocabulary outcomes are `again`, `hard`, or `good`; Forge outcomes are `correct` or `incorrect`. Returned records also include a decimal `sequence` and server `receivedAt` timestamp.

Attempt dates use the answering device's clock and display in the viewing device's timezone. Receipt cursors use database ordering, so offline uploads or skewed client clocks do not destabilize pagination. Summary queries within a page share a repeatable-read transaction. The API does not accept a profile ID; profile ownership is resolved from cookies, with the same expected-owner header as snapshot saves.

Flyway V4 adds an append-only `review_event` table, a per-profile UUID uniqueness constraint, and a profile/sequence index. It leaves existing JSON snapshots unchanged. Database backups should include history and profiles together. There is no history deletion, event export, or historical backfill UI in this release.

## Validation

Run `mvn verify` in `backend`, then `npm run test:engines` and `npm run build` in `frontend`. The history engine suite runs through `npm run test:history` and the existing CI aggregate. Backend tests cover atomic rollback, duplicate/lost-response retries, concurrent saves with conflict retry, account migration/isolation, stable pagination, recall summaries, and input bounds. Outbox tests cover concurrent tabs, identity namespaces, reload recovery, in-flight acknowledgements, bounded batches, and storage failures.
