# Vocabulary pronunciation audio

Feature 8 of the learning redesign adds explicit word playback using Japanese
speech synthesis exposed by the device/browser. There are no bundled speaker
recordings or new audio-provider credentials. Controls identify the source as a
Japanese device voice or Japanese browser voice.

## Where to listen

- Starter reference chapter: each word has Hear word, Hear slowly, and an active
  Stop audio control. Closing the reference chapter stops playback.
- Guided chapter: word study cards offer audio; meaning/reading checks do not.
- Association explorer: the selected vocabulary item offers its whole-word audio.
- Scheduled typed reviews: audio appears after the answer is scored, and in the
  mistake list. No controls appear for an unanswered, unscored-retry or skipped
  question.
- Typed-course lesson/practice and reading-path vocabulary: audio is available
  while studying a word or after its answer is revealed/checked.

Nothing autoplays, including when a voice becomes available or the tab becomes
visible again. Replay replaces the previous utterance. Slow playback uses rate
0.75; normal playback uses rate 1. A word with multiple valid reading alternatives
lets the learner select the reading to hear.

## Reading and voice contract

The player speaks the published kana reading, not the kanji spelling. This keeps
ambiguous spellings attached to the reading being taught. Kana normalization and
alternative splitting reuse the answer-checking helpers. Duplicates are removed;
unsupported annotations/non-kana candidates are omitted rather than guessed. If
no supported reading remains, the control explains that audio is unavailable.

Only voices whose language is Japanese (`ja` or a Japanese locale) are eligible.
Local-service voices are preferred, then the Japan locale and platform default.
There is no English-voice fallback. Voice lists can arrive asynchronously; a
voiceschanged listener and Refresh audio action recheck availability. Missing
Japanese voices and browsers without speech support keep lessons usable and
show an unavailable message.

Synthesized pronunciation is a reading aid. It is not a reviewed speaker
recording or a pitch-accent reference. Voice quality and availability vary by
browser/device. A browser may expose a remote voice when no local Japanese voice
is available, so playback is not guaranteed offline for every voice. The app
adds no provider upload endpoint or audio asset download; synthesis is handled
by the browser's selected voice service.

The implementation follows the platform contracts documented in MDN:
[getVoices and voice availability](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices),
[local versus remote voice services](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService),
and [cancel clearing the speech queue](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/cancel).

## Playback lifecycle

`audio-player.ts` coordinates one utterance in the tab. Each control owns its
request, and callbacks carry a generation guard. Late start/end/error callbacks
from a cancelled utterance cannot overwrite a newer word's state. Destroying an
inactive control does not cancel another control's current playback.

Word/reading changes, leaving a view, moving to a check/new question, closing the
chapter, hiding the document, pagehide and progress imports stop active speech.
The app's existing account-change guard destroys active learning controls during
an account switch. Hidden course screens are also covered by app-shell
navigation cancellation, even when their components stay mounted.

The browser adapter retains the active utterance until it ends. Playback errors,
synchronous platform exceptions and missing events recover to a retryable state.
A 15-second startup watchdog and 30-second speaking watchdog prevent a control
from staying busy indefinitely. Cancel errors cannot block UI cleanup.

Audio does not write progress, preferences, notes, synonyms or review history.
It does not submit answers, choose a vocabulary rating, alter stages/due dates,
or award mastery. Existing save/sync and backup formats remain unchanged.

## Review guide and validation

- `word-audio.ts`: canonical word targets and Japanese-only voice selection.
- `audio-player.ts`: testable playback lifecycle, ownership and failure recovery.
- `word-audio.service.ts`: Web Speech adapter and document lifecycle events.
- `word-audio.component.*`: reusable play/slow/stop controls and availability UI.
- Learning/reference/review templates: placement and protected-question gating.
- App shell: cancellation when navigating or importing progress.

From `frontend`:

```sh
npm run test:audio
npm run test:engines
npm run build
npm run build:demo
```

All 18 engine suites and production/demo builds pass. The audio suite validates
3,053 typed-catalog word targets, all six authored starter words, kana/speed
selection, Japanese/local preference, delayed voice recovery, no autoplay,
ownership, cancellation races, voice loss, timeouts and exception recovery.

Desktop and 390px mobile browser checks use a deterministic speech adapter to
cover normal/slow/replay/stop, word/context/document cancellation, unavailable and
late voices, playback failures, quiz gating, source labels and unchanged device
progress/history. Legacy due-word review audio appears only after checking the
reading, does not select a rating, and stops when its retained course is hidden.
A separate test with Chrome's actual speech engine selected a Japanese voice,
sent `ひと` with `ja-JP`, and received native start/end events. This verifies API
playback, not subjective pronunciation quality on every device.

No backend API/schema, curriculum, dependency or licensed-media changes.
