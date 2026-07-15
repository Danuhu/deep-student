# ChatAnki Agent Full-Loop Tauri UI Test Record

## Run Metadata

- App: Deep Student Anki Agent Test
- Implementation worktree: `/Volumes/cipan/deep-student`
- UI verification worktree: `/Volumes/cipan/deep-student-anki-agent`
- Integration branch / commit at handoff: `os` / `ed18bd207`
- Date: 2026-07-14 (Asia/Shanghai)
- Tester: Codex, using Computer Use and the repo-local dev UI bridge
- Launch command: `VITE_DS_UI_BRIDGE=1 npm run tauri dev -- --config <isolated desktop override>`
- Bundle identifier: `com.deepstudent.ankiagenttest`
- App version: 0.9.42
- OS: macOS
- Data policy: isolated local app data; synthetic Basic/Cloze/diagnostic fixtures only; no external LLM request
- Final process policy: the isolated `tauri dev` process remains running as requested

## Feature Map

| Area | Entry point | Visible capabilities | Gated or risky actions | Notes |
| --- | --- | --- | --- | --- |
| Startup | `npm run tauri dev` | Dev window, app shell, local database | None | Verified the isolated bundle ID and test data directory |
| Flashcards Today | Workbench flashcards app | Due count, start session, error/empty states | Rating changes local FSRS state | Rating was performed by the tester as a real user action, never by an Agent tool |
| Flashcards Library | Library tab | Pagination, search, enqueue, review, pause/resume, delete | Delete requires confirmation | Uses durable IDs returned by persistence |
| Flashcards Statistics | Statistics tab | Total, due, FSRS buckets, reviews today | None | Refreshed after writes and after restart |
| Review Session | Library/Today review action | Template render, Cloze reveal, edit, rate, undo, suspend | Local writes only | Verified persistence after app restart |
| ChatAnki guardrails | Local command responses and visible errors | Durable ID mapping, diagnostic-card rejection | No Agent rating tool exists | Agent review mutations are covered separately by Rust and contract tests |

## Synthetic Fixtures

| Fixture | Durable card ID | Purpose |
| --- | --- | --- |
| Basic | `38685b0f-f490-48da-b57b-a49d6bc3b97b` | Edit, enqueue, user rating, undo, restart persistence |
| Cloze | `1369777a-d90c-48cc-81cd-88388aea6e34` | Cloze masking/reveal and suspend/resume |
| Diagnostic | `24abb42b-5027-4cd1-ba80-e14ca22f1037` | Explicit review-queue rejection |

All fixtures use the tag `ui-agent-e2e-20260714`.

## Checklist

| ID | Area | Scenario | Steps | Expected | Status | Evidence / notes |
| --- | --- | --- | --- | --- | --- | --- |
| START-01 | Startup | Launch isolated dev app | Start configured `tauri dev`; inspect window, bundle, and data path | Dev app opens against isolated data | Pass | Window title `Deep Student Anki Agent Test`; data under `~/Library/Application Support/com.deepstudent.ankiagenttest/slots/slotA` |
| SEED-01 | Persistence | Save synthetic Basic and Cloze cards | Call registered persistence command through the dev bridge | Temporary inputs map to durable UUIDs | Pass | Durable IDs above were returned and reused throughout the run |
| LIB-01 | Library | Browse and search saved cards | Open Flashcards, switch to Library, search fixture text/tag | Cards render with schedule state | Pass | Library showed all three fixtures; Basic/Cloze were due and diagnostic was not enqueued |
| LIB-02 | Library | Enqueue, pause, and resume | Enqueue Basic/Cloze; pause and resume Cloze; refresh | State changes are visible and durable | Pass | Due count changed `1 -> 2`; Cloze suspend/resume changed due `2 -> 1 -> 2` |
| LIB-03 | Library | Delete cancel path | Open delete confirmation and cancel | Card remains present and usable | Pass | Cloze remained present after cancel; destructive confirmation was not accepted |
| GUARD-01 | Error state | Reject diagnostic card from review | Attempt to enqueue diagnostic fixture | Explicit error; no queue/session is created | Pass | UI rejected the diagnostic card and it remained `not enqueued` after restart |
| REVIEW-01 | Basic | Render, flip, edit, rate, undo | Start Basic review; edit; tester selects Good; undo | User action updates FSRS; undo restores prior state | Pass | Front persisted as `UI Basic: What survives restart? [edited]`; due `2 -> 1 -> 2`; latest rating was undone |
| REVIEW-02 | Cloze | Hide and reveal Cloze answer | Start Cloze review; inspect front; flip | Front masks the answer; back reveals it | Pass | `Paris` was masked on the front and visible after flip |
| REVIEW-03 | Session | Suspend and restore current card | Suspend Cloze; restore it | Session and library reconcile without mock state | Pass | Due count and card controls reconciled immediately in the real UI |
| NAV-01 | Navigation | Today, Library, Statistics tabs | Switch among all tabs after writes | Correct screen renders without blocking error | Pass | All three views rendered current persisted data |
| STATS-01 | Statistics | Reflect final review state | Open Statistics after undo and resume | Counts match persisted state | Pass | Total enqueued `2`, due `2`, new `2`, reviews today `0`, suspended `0` |
| RESTART-01 | Persistence | Restart isolated dev app | Relaunch same isolated bundle; revisit Today/Library/Statistics | Cards, edits, and FSRS state persist | Pass | After restart: three library cards, edited Basic text, two due cards, and identical statistics |
| UI-01 | Layout | Desktop visual sanity | Inspect the desktop-size test window during each workflow | No overlap, clipping, blank template, or unreadable control | Pass | Basic/Cloze templates, library controls, dialogs, and statistics remained readable |

## Restart Persistence Snapshot

- Library count: 3 cards.
- Due cards: Basic and Cloze, both unsuspended.
- Basic front: `UI Basic: What survives restart? [edited]`.
- Basic back: `A durable card ID, FSRS state, and review log.`.
- Statistics: total enqueued 2, due 2, new 2, learning 0, review 0, relearning 0, suspended 0, reviews today 0.
- SQLite corroboration: Basic review version 4, Cloze review version 2, diagnostic card has no FSRS state.

## Issues

| Issue ID | Severity | Area | Title | Repro steps | Expected | Actual | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INCIDENT-01 | Low | Test isolation | One relaunch briefly used the production bundle identifier | Launch a dev build without the isolated identifier override | All verification uses isolated app data | Normal startup touched `com.deepstudent.app` and created blank session `sess_ee711e98-23c3-4f45-a83d-b632f31a4498`; no manual UI action followed | Process was stopped immediately; no production record was edited or deleted | Contained; disclosed for audit |

## Confirmation-Required Items

| ID | Action | Why confirmation is required | Last safe step reached | Status |
| --- | --- | --- | --- | --- |
| LIB-DELETE | Confirm deletion | Destructive local UI action | Delete dialog opened and cancel path verified | Not executed |
