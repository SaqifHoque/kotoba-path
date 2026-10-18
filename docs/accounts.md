# Learning accounts

Choose **Save across devices** in the sidebar. On mobile, open the navigation menu first.

Create a username with 3–40 ASCII letters, numbers, or underscores and a password of 15–128 characters. Usernames ignore capitalization. Registration claims the current database browser profile, keeping its proficiency, kanji reviews, vocabulary, Forge settings, notes, and mastery. The client waits for pending saves before registering. The previous guest cookie cannot read or modify a claimed profile.

Save the recovery key shown after registration. No email address or mail service is required. If you forget the password, **Recover account** accepts the username, saved key, and a new password. Recovery revokes all existing sessions and returns a replacement key. The previous key becomes invalid. Losing both password and key means the account cannot be recovered through the app. Keys are displayed once and are never stored in browser storage.

Sign in on another device to restore the account's database progress. Signing in does not import an unrelated guest profile into an existing account. Guest work stays separate in browser storage; export backups before changing browsers. Registration is the supported guest-to-account migration path. There is no account-to-account merge or email recovery.

Signing out revokes this device's session and returns to guest study. Account caches remain in their own namespace for offline recovery and are not loaded into another account. Other tabs reload on account changes; profile requests carry an owner header so a stale tab cannot write one person's progress into another account. Already loaded lessons can still be practised during an outage; sync waits until identity can be verified again.

## API and storage

- `GET /api/account`: current public account identity, or `{ "id": "guest" }`. Expired session cookies are cleared.
- `POST /api/study-profile/register`: `{ "username", "password" }`; claims the browser profile and returns `{ "id", "username", "recoveryKey" }`. This route intentionally shares the legacy guest cookie's path.
- `POST /api/account/login`: `{ "username", "password" }`; returns the public account identity.
- `POST /api/account/recover`: `{ "username", "password", "recoveryKey" }`; resets the password, revokes sessions, and returns the public identity and replacement key.
- `POST /api/account/logout`: revokes the current session.

All account mutations require `X-Kotoba-Request: 1`; cross-site Fetch Metadata requests are rejected. Account profile writes require `X-Kotoba-Owner` equal to the account ID; guest clients may use `guest`. Requests whose owner disagrees with the active cookie receive 409. Account IDs are public identifiers, not authentication tokens. Existing guest clients retain their profile API compatibility. Revision checks protect concurrent snapshots, and [review history](review-history.md) preserves distinct attempts with duplicate-safe uploads.

Flyway V3 adds accounts, sessions, and shared IP throttle buckets without modifying existing study JSON. Passwords use independently salted PBKDF2-HMAC-SHA256 with 600,000 iterations. Session and recovery keys have 256 bits of randomness; only SHA-256 digests are stored. Sessions last 30 days, rotate on authentication, and use HttpOnly, SameSite=Strict cookies scoped to `/api`. Cookies are Secure on HTTPS requests. Authentication attempts are limited to 20 per remote address per ten-minute bucket, including failures, shared across instances. There is no account-level lockout, MFA, or email verification in this release.

## Deployment

Serve the frontend and `/api` on the same origin over HTTPS in production. The default configuration does not trust forwarded headers. Behind a trusted TLS reverse proxy, set `FORWARD_HEADERS_STRATEGY=framework`, ensure the edge overwrites all incoming forwarded headers, and prevent clients from reaching the backend directly. This ensures Secure cookies and the correct client address for throttling. Plain HTTP development uses non-Secure cookies. Back up the database: account credentials and progress must be restored together.

## Validation

Run `mvn verify` in `backend`, then `npm run test:engines` and `npm run build` in `frontend`. Account integration tests cover guest migration, cross-device restoration, password/token storage, stale-tab rejection, cross-site requests, validation, duplicate names, throttling, recovery rotation, session expiry, and logout. Existing guest-profile tests also continue to run.

Security references: [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) and [session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
