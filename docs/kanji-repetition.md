# Kanji repetition engine (PR 2 of 3)

This module builds on the curriculum PR. It provides pure functions for review
scheduling, due-card selection, level unlocking, and validating serialized
progress. The following UI PR will call these functions and save browser data;
this PR does not yet add a review screen or write to storage.

Each character has an introduced flag, stage, due timestamp, and attempt count.
Hard or Good marks a kanji introduced. All kanji in each preceding level must
be introduced before a level unlocks. A later lapse does not relock completed
levels: introduction is distinct from permanent mastery.

- Good advances through intervals of 1, 3, 7, 14, 30, 60, then 120 days. Later
  successful reviews stay at 120 days.
- Hard returns in one day and reduces the stage by one (minimum zero).
- Again returns in ten minutes and resets the stage to zero. A previously
  introduced card stays introduced; a new card remains unintroduced.

Time is supplied by the caller in epoch milliseconds for deterministic tests.
Due cards include failed new cards and are ordered oldest due first. Calling
the scheduler does not itself persist data or send reminders. This is a simple
interval scheduler, not a calibrated model of memory retention.

The version-1 JSON envelope contains a cards object keyed by character.
Validation rejects invalid states and versions, accepts missing storage as an
empty record, and ignores characters outside the current catalog. Callers
must catch errors and preserve unreadable data rather than silently erase it.

From frontend, run npm run test:kanji, npm run test:curriculum, and npm run build.
Tests cover sequential unlocking, lapses, interval saturation, exact due-time
boundaries, due ordering, serialization round trips and corrupt records.
