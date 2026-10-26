# Unified study navigation

The main navigation is organized by purpose: **Today**, **Learn**, **Review**, **Library**, and **Profile**. Kanji Forge and the reading path remain available inside the learning tools, with their existing progress, notes, review dates, and account data intact. Review history is under Review; account access and progress files are under Profile → Data & privacy.

## One next step

Today provides one primary action: resume an open session, start the most overdue available review, or begin the next lesson for the selected preference. Counts keep kanji, vocabulary words, and typed questions separate. The existing review forecast remains available.

A new learner can start typed lessons immediately. **Adjust starting point** optionally changes lesson preference or reading-path proficiency. Existing users keep their saved preference; existing reading-path progress continues to select that course when no preference was saved. Preferences are shared between Today and Learn, including an in-memory fallback when browser storage fails. They remain isolated by the current account's cache namespace.

Learn shows the next eligible lesson and actual milestones from existing course data. The typed course counts kanji whose meaning and reading have both reached Guru toward its level gate. Reading-path progress counts introduced kanji within the current level. Assumed foundations never count as completed work. These are current course milestones, not authored chapter progress; versioned chapters belong to the subsequent curriculum work.

**Other study options** exposes the two existing courses and lets users change lesson preference. Selecting a preference or browsing the hubs does not mark content learned, change review dates, or create history events. The current schedules are not merged into a new shared mastery score.

## Review queues

Review shows the next due review and separate kanji, vocabulary, and typed-answer queues. Empty queues are disabled. Vocabulary review launches are due-only: completing a review batch does not introduce new words. Opening a fresh vocabulary review starts the current due queue even when a previous session was launched in the same tab. Words rescheduled while a batch is open cannot earn another early review through that batch.

## Navigation and open sessions

Reading-path and typed-course screens remain mounted while browsing this tab, but hidden screens are explicitly removed from layout. Today offers **Continue session** for the most recently selected open course. Learn and Review also list open sessions. Current input, feedback, and remaining questions survive ordinary navigation. Explicitly starting another session in the same course replaces that course’s unfinished queue; completed work stays recorded.

This is in-memory continuity, not a saved session file. Reloading, changing accounts, or importing progress closes suspended sessions. Completed work remains saved through the existing synchronization service. A progress import resets both course screens to prevent resuming an obsolete queue. Account registration still keeps the one-time recovery key visible in Profile until the user completes that step.

The compact navigation closes after selection, supports Escape, and returns keyboard focus to the menu button when dismissed. Closed compact navigation is inert. The active primary section has `aria-current`, and navigation moves focus to the main content landmark. Reduced-motion preferences remain supported.

## Verification

`npm run test:overview` covers new/existing preferences, primary-section mappings, lesson eligibility, separate milestone semantics, and due-only vocabulary queues. It is included in `npm run test:engines`. Run production and public-demo builds as well.

Browser verification follows Today → actual lesson/review → study-profile API → updated overview. It covers optional onboarding, read-only browsing, typed and reading-path sessions, draft-input preservation, due-only vocabulary, history counts, progress import, account registration, offline cache/reconnection, and compact navigation on a 390px screen.
