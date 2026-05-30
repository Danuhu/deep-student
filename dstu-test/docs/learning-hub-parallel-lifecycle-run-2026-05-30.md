# Learning Hub Parallel Lifecycle Run - 2026-05-30

## Purpose

Use multiple Codex subagents to drive five isolated real Tauri windows and test the actual lifecycle experience of Learning Hub learning applications.

## Environment

- Repo: `<deep-student-repo>`
- Pool: `learning-apps-05`
- Instances: 5 running Tauri app bundles
- Coordination: `tauri-lab` leases plus `agent targets` and `agent verify`
- Entry point: real UI operations through Computer Use
- Assertions: tauri-lab evidence snapshots, logs, SQLite checks, and UI observations after UI actions

## Assignments

| Agent | Owner | Instance | Focus |
| --- | --- | --- | --- |
| A | `learning-agent-a-notes-mindmap` | `learning-apps-05-01` | Notes and mind map lifecycle |
| B | `learning-agent-b-exam` | `learning-apps-05-02` | Exam/question-set lifecycle |
| C | `learning-agent-c-translation-essay` | `learning-apps-05-03` | Translation and essay lifecycle |
| D | `learning-agent-d-doc-previews` | `learning-apps-05-04` | Textbook/document preview lifecycle |
| E | `learning-agent-e-shell` | `learning-apps-05-05` | Finder shell, folders, search, tabs |

All agents confirmed their assigned exact `.app` path with `agent targets` and `agent verify` before Computer Use actions. Parent `lease audit --json` stayed clean during the run.

## Results

### Agent A - Notes And Mind Map

Status: partial pass.

- Passed: first-run agreement, Learning Hub navigation, note creation, note title/content editing, close and reopen persistence.
- Passed: mind map creation, adding a child node, close and reopen basic persistence.
- Blocked: Markdown import through macOS file picker. The fixture file was selected and previewed, but the `Open` button stayed disabled.

Evidence:

- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-01/2026-05-30T04-22-21-985Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-01/2026-05-30T04-23-22-924Z`

### Agent B - Exam

Status: partial pass.

- Passed: first-run agreement, Learning Hub navigation, empty exam creation, close and reopen.
- Passed: `exam_sheets`, `resources`, and `folder_items` records were created.
- Passed: empty import state is understandable; parse button is disabled before file selection.
- Passed: `All question sets` filters the created empty exam.
- Blocked: practice, wrong-answer, manage, stats, favorites, and topic flows cannot be fully tested from an empty exam because the UI depends on existing questions.
- Finding: empty exam has no visible manual "add first question" path. The user appears forced into import/recognition first.

Evidence:

- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-02/2026-05-30T04-22-12-777Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-02/2026-05-30T04-22-40-834Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-02/2026-05-30T04-23-04-104Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-02/2026-05-30T04-23-49-664Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-02/2026-05-30T04-26-18-072Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-02/2026-05-30T04-26-51-948Z`

### Agent C - Translation And Essay

Status: partial pass with two failures.

- Passed: translation resource creation and panel discovery.
- Passed: translation input enables the translate button; the agent did not click it to avoid external model/network calls.
- Passed: essay resource creation and panel discovery.
- Passed: essay input enables the grading button; the agent did not click it to avoid external model calls.
- Finding: translation draft text is lost after closing and reopening the resource. SQLite still showed empty `source` and `translated` fields.
- Finding: essay text became polluted with a reversed-looking prefix after an unexpected navigation to Settings and back. This needs focused reproduction to separate product behavior from Computer Use/focus behavior.

Evidence:

- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-03/2026-05-30T04-22-12-138Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-03/2026-05-30T04-22-29-894Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-03/2026-05-30T04-23-17-444Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-03/2026-05-30T04-25-40-756Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-03/2026-05-30T04-26-24-901Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-03/2026-05-30T04-29-25-423Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-03/2026-05-30T04-30-32-074Z`

### Agent D - Textbook And Document Preview

Status: partial pass.

- Passed: imported two local fixtures through real UI:
  - `/tmp/deep-student-learning-fixtures/agent-d/agent-d-textbook.md`
  - `/tmp/deep-student-learning-fixtures/agent-d/agent-d-table.csv`
- Passed: Markdown textbook opens and shows the rich-text preview toolbar.
- Passed: CSV table opens and shows table preview.
- Passed: search for `table` filters the list to the CSV resource.
- Passed: closing back to the list preserves both resources.
- Finding: pressing Enter on a list item did not open it; it entered a drag state and showed `Dragging was cancelled.`
- Finding: Recent view was inconsistent, showing empty at one point and later showing recent entries with timestamps.
- Blocked: "save to local" entry was not located.

Evidence:

- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-04/2026-05-30T04-23-59-520Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-04/2026-05-30T04-26-12-282Z`

### Agent E - Finder Shell

Status: partial pass with shell findings.

- Passed: folder creation.
- Passed: entering folder and breadcrumb display.
- Passed: creating two notes inside the folder.
- Passed: DB checks showed two `notes` and two `folder_items` under the folder.
- Passed: tab lifecycle for two notes: open, switch, close, return to grid.
- Passed: search for `Shell-E-Note-2` filtered to one visible result.
- Passed: quick access for notes, all files, and textbook empty state.
- Finding: Recent did not show newly created/opened notes and stayed at `0 items` in this run.
- Finding: after creating a folder, the grid initially showed `1 item` but no visible card until switching view/navigation.
- Observation: CJK literal typing through Computer Use did not enter the full Chinese folder name; ASCII settable value worked.

Evidence:

- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-05/2026-05-30T04-22-05-701Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-05/2026-05-30T04-22-33-937Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-05/2026-05-30T04-24-02-872Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-05/2026-05-30T04-25-36-344Z`
- `~/Library/Application Support/tauri-lab/evidence/learning-apps-05-05/2026-05-30T04-28-49-210Z`

## Cross-Cutting Findings

1. Recent view is inconsistent across agents. Agent E saw newly created/opened notes missing from Recent; Agent D saw Recent empty at one point and later populated.
2. File picker/import paths are fragile. Markdown import selected a valid file but could not enable Open; textbook fixture import did succeed in another instance.
3. Empty exam lifecycle lacks a visible manual first-question path, blocking non-import practice lifecycle coverage.
4. Keyboard activation on document list items can enter drag cancellation instead of opening the resource.
5. Translation draft input is not persisted on close/reopen before translation is executed.
6. Grid/list refresh can show item counts before item cards become visible.

## Follow-Up Tests

- Focused Recent-view reproducibility with controlled create/open/close timing.
- Focused file-picker behavior for Markdown import versus textbook import.
- Seeded exam with one synthetic question, then test practice, wrong answers, management, stats, favorites, topics, and reset/delete confirmation boundaries.
- Translation draft autosave expectation decision: either persist drafts or warn before close.
- Essay input corruption reproduction with slower text entry and controlled navigation.
- Keyboard contract: Enter should open selected resource, not start drag.

## Data Image Follow-Up

After this run, `tauri-lab` gained a reusable data-image flow. A smoke image was created from Agent E's shell instance:

```sh
npm run tauri-lab -- image create lh-shell-seed \
  --from-instance learning-apps-05-05 \
  --scope home \
  --description "Learning Hub shell seed with folder, notes, search/tab state smoke data" \
  --force \
  --json
```

The image was applied to `image-smoke-01` with `instance create ... --image lh-shell-seed`, then started successfully. SQLite verification showed `resources=2` and `folder_items=2`, and Computer Use opened directly to the main app without the first-run agreement page. This confirms seeded Learning Hub state can be reused for future lifecycle runs.

Smoke evidence:

- `~/Library/Application Support/tauri-lab/evidence/image-smoke-01/2026-05-30T04-56-22-441Z`
