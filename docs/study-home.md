# Today: study home and setup

The app now opens on **Today**. It restores the shared catalog and study profile before choosing a session, so a fresh render does not mistake an existing account for a new learner. A failed catalog request has a retry control; a database outage keeps the existing local-cache recovery and sync warnings.

## First visit and returning learners

Learners with no profile, review progress, or saved browser routine see a short setup form:

- **Reading path** uses the existing N5–N1/Not sure selection and studying/comfortable distinction. The starting bands remain school-grade estimates, not official JLPT classifications. Easier kanji may be assumed familiar, never marked mastered. The optional self-check remains on the learning path.
- **Kanji Forge** starts at level 1 for a new Forge learner and retains any existing Forge level and records. Reading-path proficiency does not establish Forge mastery.

Both routines remain available. Setup changes the browser's preferred routine and, only for Reading path, the existing proficiency profile. It does not complete lessons, change review stages/dates, erase attempts, or create review-history entries. Existing placement results are preserved when updating the starting profile.

Returning learners are not forced through setup. Without a saved preference, Forge-only progress selects Forge; otherwise the reading path remains the default. **Change study setup** is always available from the next-step panel. Signing in or out keeps the established account boundaries. The routine preference is stored in `kotoba-study-home-v1`, using the existing account-specific cache namespace. Account registration copies the current guest routine to the new account namespace. This preference belongs to the browser; proficiency and learning progress continue to sync through the existing profile API.

## Daily plan

The first suggestion is the oldest eligible due work, across path kanji, vocabulary, and Forge. A tied due time favors the selected routine. With no due work, the reading path suggests unlocked vocabulary before new kanji; Forge suggests eligible lessons within its existing limits. When the selected routine has no available lesson, the page shows the next review time or offers the reading encyclopedia.

Queue cards use explicit units: path **kanji**, vocabulary **words**, and Forge **questions across subjects**. They are not added into a misleading shared item count. Forge questions count meaning and reading separately. Burned tracks have no scheduled review. Forge's daily new-item limit, 50-Apprentice guard, 20-due-question guard, and prerequisite gates still apply.

The dashboard and vocabulary screen share the same proficiency filter/ranking helper. All counts describe currently eligible queues under the existing rules; this PR does not change vocabulary prerequisites, SRS algorithms, or level allocation. New-kanji suggestions use the existing proficiency recommendations. Due counts and next-review times refresh every ten seconds while Today is open. There are no background reminders or notifications.

## Session shortcuts and shared startup

The main suggestion and queue buttons start real sessions:

- Kanji lessons introduce up to ten recommended cards; due reviews start a batch of up to twenty.
- Vocabulary opens Words & reading and starts up to ten eligible words, due first.
- Forge lessons start up to five eligible items; Forge reviews start up to forty due skill questions.

Launch requests are consumed once, so unrelated state updates do not restart a session. Ordinary sidebar navigation still opens the existing screens. Once the reading path has been visited, its unfinished session stays mounted when visiting Today or another screen, preserving the earlier navigation behavior. A new shortcut explicitly starts a fresh batch; completed answers remain saved.

`StudyCatalogService` shares one validated catalog request per app boot and initializes study sync independently of any hidden feature screen. Root, reading path, and Forge reuse that result. Catalog failures can be retried because failed requests are not retained as successful cached results. Review history can now rely on app-level initialization rather than a hidden path component.

## Validation

Run `npm run test:engines` and `npm run build` in `frontend`. `npm run test:home` covers due priorities, ties, cross-mode reviews, eligibility, distinct count units, Burned exclusion, daily reset, workload guards, immutable planning, preference validation, and returning-user detection. The existing engine suites continue to run through CI. No backend schema, endpoint, or dependency changes are required.

## Review forecast

Today also shows [upcoming review workload](review-forecast.md) for the next 24 hours or seven local calendar days. Due-now work stays separate from newly due rows, and kanji, words, and Forge questions keep separate counts. The forecast reads existing schedules and updates after completed reviews.
