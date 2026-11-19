# Indexed quest activity

Daily quest requests now use indexed receipt fields rather than streaming and
parsing the learner's scheduled history. The response shape, day boundaries,
effort rules, capped goals and pending-receipt reconciliation are unchanged.

## Data and migration

Flyway V5 adds `occurred_at bigint` and `skill varchar(12)` to `review_event`.
A Java migration reads existing receipts in sequence order, 500 at a time,
projects the two fields and updates those rows. It does not rewrite receipt JSON,
sequence IDs, event IDs, profile IDs, receipt times, outcomes or profile state.

The migration validates timestamp type/range and the meaning/reading/both skill
values before enforcing not-null and check constraints. It fails on malformed
legacy activity fields rather than silently inventing evidence. New receipts
write both projections in the same existing progress/history transaction.
Idempotent retries retain their original receipt and projections.

Indexes support:

- `(profile_id, kind, occurred_at)`: bounded day-window recall queries.
- `(profile_id, kind, skill, occurred_at)`: meaning/reading evidence probes.
- The existing unique `(profile_id, event_id)`: requested pending-ID lookups.

Keep V5 and the version-one projection contract stable after release. Future
receipt formats or projection changes require an explicit migration decision.

## Query behavior

The service returns at most five recall rows and at most one row for each skill
probe. Skill evidence is queried independently, so a reading answer after the
first five receipts still satisfies the reading goal. Each of at most ten
requested receipt IDs uses an isolated profile/ID lookup with the same scheduled
kind and time window. Duplicate requested IDs do not duplicate evidence.

All queries execute within a read-only repeatable-read transaction so counts,
skill flags and matched pending IDs share one consistent database snapshot.
No activity query selects or parses `event_json`.

Cost follows the selected indexes and requested day, rather than requiring a
full-history JSON scan. The database chooses its plan; small tables or broad
windows can legitimately lead to different plans. The new indexes add storage
and insertion work.

## Deployment requirements

This migration requires a coordinated backend restart:

1. Stop old backend writers and take a database backup.
2. Start one updated backend to run Flyway V5 and confirm successful completion.
3. Start any remaining instances with the updated writer.

An old binary does not supply the new required fields and cannot append receipts
after V5. Mixed old/new writers and an unplanned binary downgrade are unsupported.
Use a validated database restore or a separately planned compatibility change for
rollback.

PostgreSQL supports transactional DDL. H2 DDL may commit during migration; if a
migration fails, keep writers stopped and inspect the failure. Restore the
pre-upgrade backup before retrying unless a deliberate repair has been validated.
Do not simply mark a failed migration successful. Original JSON receipts are
preserved when projection validation fails.

## Verification

Run `mvn test` or `mvn package` in backend. Local validation passed 32 backend
tests and the unchanged frontend production build.

- H2 V4 → V5: 1,202 receipts across multiple batches, two profiles sharing a UUID,
  zero/max timestamps, every original history field and profile revision/state,
  projection parity, constraints and Flyway validation/no-op re-run.
- Malformed legacy fields stop migration with source receipts preserved.
- Indexed results match a JSON oracle across 1,121 mixed receipts, profiles,
  skills, learning/scheduled kinds and windows. H2 query plans use the activity
  indexes, including an absent-skill probe.
- Existing API tests plus a new writer/retry test preserve atomicity and receipt
  identity.
- Isolated PostgreSQL 14: initialize V4, seed 5,001 legacy receipts, migrate V5,
  compare a digest covering every original history field, and check all projected
  values against JSON. The digest is identical and mismatch count is zero.
- PostgreSQL EXPLAIN ANALYZE uses the activity-day index for the tested capped
  daily query, skill probe and empty-window probe without forcing index selection.
- Chrome → real API → migrated PostgreSQL: legacy activity, five new scheduled
  answers, capped daily petals, both skills, exact pending-ID matching, read-only
  refresh, saved notes/history/reload, 390px layout and zero runtime errors.

No live or existing user database was used for verification. Frontend engine
suites were not rerun because this PR changes backend behavior only; the existing
CI continues to run the application checks.
