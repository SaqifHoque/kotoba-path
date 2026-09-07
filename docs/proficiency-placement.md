# Proficiency-based starting points

The learning path can now begin near a learner's current reading ability instead of requiring level 1.

## Starting profile

- Choose N5 through N1, or choose **Not sure**.
- **Studying** starts recommendations in the selected band.
- **Comfortable** starts recommendations one band higher, capped at N1.
- The difficulty bands are estimates derived from the curriculum's Japanese school-grade data. They are not official JLPT vocabulary or kanji lists.

Kanji below the target are shown as *assumed familiar*. They are never silently marked learned, so the learner can open a five-card foundation check and any existing review history remains authoritative.

## Optional self-check

The self-check samples five kanji from the selected band. The learner reveals each answer and reports whether both a meaning and reading were recalled. Scores at the edges suggest one adjacent band; middle scores retain the current band. It is a starting-point aid, not a JLPT assessment, and it never writes kanji mastery records.

## Persistence

The profile and latest self-check are stored beside kanji review progress in the database and cached in the browser. An `updatedAt` timestamp resolves profile changes while the existing per-kanji merge rules preserve review attempts and due dates. Older clients that omit the profile field cannot erase a saved profile.
