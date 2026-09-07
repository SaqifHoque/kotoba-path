import { ReviewProgress } from './kanji-engine';

// Review snapshots merge idempotently; restoring a backup never adds attempts.
export function mergeReviews(a: ReviewProgress, b: ReviewProgress): ReviewProgress {
  const result = {...a};
  for (const [key, value] of Object.entries(b)) {
    const old = result[key];
    if (!old || value.attempts > old.attempts || (value.attempts === old.attempts && value.due > old.due)) result[key] = value;
  }
  return result;
}
