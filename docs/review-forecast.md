# Review forecast

Today shows the workload already scheduled across the reading path, vocabulary, and Kanji Forge. Choose **Next 24 hours** for six rolling four-hour windows, or **Next 7 days** for the remainder of today and the following six local calendar days.

- **Due now** includes overdue reviews and reviews due at the current instant.
- Future rows show only reviews becoming due within that interval. They do not repeat the overdue backlog. Each interval includes its start and excludes its end.
- Kanji are cards, vocabulary are words, and Forge counts meaning and reading questions separately. The columns keep those units separate.
- Only known catalog items and currently eligible vocabulary appear. Vocabulary eligibility uses the same target-band, learned-kanji, and assumed-foundation rules as the study queues. Forge Burned tracks are excluded.
- A review beyond the selected window still appears as the next scheduled date. Empty schedules explain how to begin; a window with no additional work displays that state explicitly.

The forecast is a snapshot of existing review dates. It does not predict future answers, new lessons, or the reviews those actions may create. Completing a review changes its next date through the existing scheduler; returning to Today updates the forecast from that state. Counts refresh every ten seconds while Today is open. Dates use the device time zone, with calendar arithmetic for daylight-saving boundaries.

## Data flow

The existing study-profile API and browser cache populate `StudySyncService`. Today derives a read-only forecast from that state and the shared catalog. Changing the display range neither saves profile data nor records history. No API, database schema, review algorithm, account preference, or new dependency is required. Offline cached progress follows the same calculation.

## Verification

Run `npm run test:forecast` from `frontend`. It tests exact boundaries, queue-count parity, separate Forge tracks, vocabulary prerequisites and assumed foundations, unknown catalog IDs, Burned exclusion, distant dates, time passing, and unchanged input state. It runs in Asia/Tokyo and America/New_York, including the 23-hour spring day and 25-hour autumn day. `npm run test:engines` includes this suite.

Browser verification covers an empty profile; saved API schedules; both display ranges; a completed Forge review moving from Due now to a future window; reload; cached offline schedules and reconnection; keyboard range controls; and a 390px-wide screen. Forecast toggles leave profile revision and review history unchanged.
