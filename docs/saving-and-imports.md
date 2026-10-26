# Saving and importing progress

All learning screens share one progress-saving indicator. Lessons no longer display export/restore controls. Open **Profile → Data & privacy** to download or import progress; account creation, sign-in, recovery, and sign-out are in **Profile → Account & devices**.

## Saving states

- **Saved to your account** appears after an authenticated server save is confirmed, including acknowledgements for submitted review attempts.
- **Progress saved** confirms a guest server save. The explanation clarifies that this guest profile is linked to the current browser; an account enables cross-device access.
- **Saved on this device** means a complete progress snapshot was successfully written to browser storage. Offline accounts can retry saving when connected. The public demo uses device-only saving.
- **Progress needs attention** appears when neither a confirmed server save nor a complete device copy is available. Keep the tab open and download learning data before leaving. The status does not claim that a failed storage write succeeded.
- Connecting and saving have their own pending states. A server save can still succeed when a device copy fails; the device warning remains visible.

Pending review attempts stay in the existing duplicate-safe outbox. Importing progress creates no artificial history events and does not clear that outbox. Account switching and registration keep their existing identity checks and guest-migration behavior.

## One progress download

**Download learning data** creates `kotoba-learning-progress.json`, with a `kotoba-path-progress` format marker, version 1, export time, and a `progress` object containing the starting-point profile, kanji reviews, vocabulary reviews, and Forge state. Forge includes mnemonic notes and personal meaning synonyms.

This is a progress snapshot, not an account export: it excludes credentials, recovery keys, server revisions, review history, and pending history events. Synced history stays with the account; pending attempts remain in the original browser until acknowledged. Browser routine preferences are not included.

## Preview before import

Choose **Import previous progress** and a JSON file up to 32 MB. Unified files and older standalone Forge files are recognized directly. For an older `{version:1,cards:…}` file, explicitly choose kanji or vocabulary before previewing; the old format did not identify its type.

Preview shows additions, updates, unchanged incoming items, changes to starting-point/Forge settings, and records absent from the current catalog that will be skipped. Nothing is applied until **Import and merge progress**. Cancel leaves progress unchanged. Invalid files cannot be confirmed.

Recognized and unknown records are validated before unknown subjects are omitted. Validation checks versions, field shapes, entry limits, dates, counters, notes, and synonym preferences. Imported snapshots use canonical fields. Newer review attempts are preserved; independent Forge tracks, notes, and preferences use the existing merge rules, including synonym-removal tombstones. Empty files do not reset progress. Repeated imports are idempotent.

If current in-memory progress changes while preview is open, its counts refresh and confirmation is required again. A server revision conflict triggers the existing fetch-and-merge flow, preserving newer work from another device. Successful import closes suspended reading-path sessions to avoid continuing an obsolete queue. Account changes invalidate previews.

Unreadable existing browser data remains preserved; importing does not silently overwrite that protected copy. New progress can still be saved to the server or downloaded from the current tab.

## Verification

`npm run test:saving` checks save-state messaging, unified/legacy files, immutable previews, count summaries, stale snapshots, tombstones, canonical downloads, invalid records, bounds, and repeated merges. `npm run test:engines` includes it. Run the production and public-demo builds as well.

Browser verification follows Settings → file selection → preview/cancel/confirmation → profile API → browser cache → reload. It also covers concurrent server updates, registration, sign-out/sign-in isolation, offline recovery, failed storage writes, in-memory downloads, device-only demo saving, and mobile import controls.
