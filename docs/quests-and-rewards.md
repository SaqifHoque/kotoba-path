# Daily quests and study badges

Feature 11 adds optional daily effort goals to Today and the end of a typed-review
batch. The UI uses static petals, clear progress bars and a quiet completion
message. There is no automatic sound or motion.

## Goals and evidence

- **Recall five questions:** five actual scheduled answers earn two petals.
- **Connect meaning and reading:** a scheduled answer for each skill earns one
  petal. A combined recall in the reading path covers both.

Incorrect scheduled answers count as effort. Learning checks, reference browsing,
sentence practice, skipped questions and unscored input-format retries do not.
Counters stop at the goals; this is not an accuracy score or mastery claim.

A day follows the device's local calendar. The client sends epoch boundaries from
local midnight through the current instant, supporting 23- and 25-hour DST days.
The lower boundary is included; the upper boundary is excluded. Future-dated
receipts are not counted before their time. A new day resets daily petals, while
ordinary saved subject progress remains intact.

## Current badges

- **First words:** at least one saved typed vocabulary subject has both tracks.
- **Chapter connections:** all eleven starter subjects have both tracks.
- **Strong foundations:** all starter subjects currently have meaning and reading
  at Guru I or above.

Badges are derived from saved records, including imported records. They are
current milestones, rather than permanent awards; a retention badge can change
after a lapse. Imported progress contains no daily history evidence and therefore
does not award daily petals by itself.

## Server and device reconciliation

The read-only authenticated endpoint is:

`GET /api/study-profile/activity?from=…&to=…&pendingIds=…`

It uses the same profile-cookie/account-owner boundary as review history, returns
`Cache-Control: no-store`, accepts a window of at most 26 hours and at most ten
validated receipt IDs, and returns capped recalls, meaning/reading flags and
which requested IDs are already included.

The query reads immutable scheduled receipts by **occurrence time**, so late
offline uploads count on their original day. It uses one streaming SQL statement
and a small response. Because occurrence time remains inside the existing JSON
receipt, query work is linear in a profile's scheduled history; this version adds
no schema migration or occurrence-time index. Goal counts cap at five and parsing
can skip irrelevant rows once both goals are established.

The client snapshots at most seven representative pending receipts: five recalls
and a representative of each skill. Their UUIDs let it reconcile against the
server snapshot without counting the same receipt twice during acknowledgement.
A single receipt can satisfy both goals, but never counts as two recalls.
Existing receipt UUID uniqueness remains the durable idempotency boundary.

If the endpoint is unavailable, the display labels its device-only evidence.
Already-synced history may be absent from those partial counts. The public demo
uses attempts kept in this browser. Pending receipts retain the existing saving
and storage guarantees; quests introduce no additional storage key.

Requests refresh on mount, saved-state updates, manual refresh and approximately
every thirty seconds while mounted. The day check runs every second. Request
generation, day and account checks prevent stale responses from replacing newer
evidence. Loading/account changes hide another account's results. Badges derive
freshly from current saved state.

## Persistence boundaries

Petals, quest completion and badges are recomputed, never written as currency,
completion flags or subject progress. They do not change review dates, stages,
notes, level gates, exports or history. Actual scheduled answers continue through
the existing atomic progress/history save. Guests and signed-in users use the
same isolated history sources as before.

## Review guide and validation

- `study-quests.ts`: day boundaries, evidence selection/deduplication, capped
  goals and badge definitions.
- `StudyActivity.java` and the profile controller: read-only evidence endpoint.
- Quest service: account/day/request guards and server/pending reconciliation.
- Quest component: Today and review-summary presentation.

Run `npm run test:quests`, `npm run test:engines`, `npm run build` and
`npm run build:demo` in frontend; run `mvn test` in backend.

Local verification passed all 21 frontend engine suites, 26 backend tests and
production/demo builds (initial bundle about 577 kB, within existing budgets).
Tests cover wrong answers, first/both skills, pending/server overlap, deduplication,
late uploads, time boundaries/DST, profile isolation, invalid requests and current
badges without progress mutation.

Desktop and 390px Chrome against a real API and isolated H2 database verified:
five incorrect scheduled answers earn three petals; completion appears after a
batch and survives Today/reload; refresh causes no progress writes; a receipt
present on both server and device counts once; offline pending evidence survives
reload with its label; another profile starts at zero. Existing notes and exact
history counts remain intact. No browser runtime errors were reported.
