# Cloud Sync Parallel E2E Run - 2026-05-30

## Purpose

Validate that five Codex subagents can run real, UI-driven Deep Student cloud sync tests in parallel without driving the same Tauri window, while using a shared local Docker WebDAV fixture.

## Environment

- Repo: `<deep-student-repo>`
- Pool: `sync-e2e-15`
- Instances: 15 running, 14 leased to test agents, 1 reserve
- WebDAV fixture: `sync-webdav-parallel`
- WebDAV endpoint: `http://127.0.0.1:18081/`
- WebDAV server: Docker container `tauri-lab-webdav-sync-webdav-parallel`
- Image: `yuqing-agent:latest`
- Fixture root: `deep-student-parallel-e2e`

The original `bytemark/webdav:latest` pull timed out. The run used the repo-supported `node-builtin` WebDAV server inside the local Docker image instead, preserving the Docker-based cloud fixture requirement.

## Anti-Collision Protocol

- Parent agent started the daemon, fixture, pool, and leases.
- Subagents received only their assigned exact `.app` paths.
- Subagents were instructed not to select windows from the global Computer Use target list.
- Each subagent verified `lease list --json` before UI actions.
- Each subagent confirmed it did not operate unassigned app paths.

Finding: the anti-collision protocol must also cover shared fixtures. A subagent network-interruption scenario coincided with the shared WebDAV fixture being stopped, which broke another agent's conflict test. Future runs must forbid subagents from stopping/restarting shared fixtures. Interruption scenarios should use bad endpoints/credentials or a parent-allocated exclusive fixture.

Follow-up hardening landed after this run:

- `agent targets --owner <owner>` returns only the windows leased to that Codex owner, so a subagent can rediscover its assignment without browsing the global Computer Use list.
- `agent verify <instance> --owner <owner> --app <path> --require-running --json` fails fast if the instance is leased to someone else, the app path does not match, or the window is not running.
- `lease audit --json` checks active leases for duplicate app targets.
- `lease clear --pool <pool-id> --json` gives the parent a clean post-run lease cleanup path.

## Assignment

| Agent | Owner | Instances | Scenario |
| --- | --- | --- | --- |
| A | `codex-sync-agent-a-upload` | `01`, `02`, `03` | Fresh config, connection, upload-only, missing password recovery |
| B | `codex-sync-agent-b-download` | `04`, `05` | Download-only hydration |
| C | `codex-sync-agent-c-conflict` | `06`, `07`, `08` | Bidirectional sync and conflicts |
| D | `codex-sync-agent-d-backup-restore` | `09`, `10`, `11` | Backup, history, restore, restart activation |
| E | `codex-sync-agent-e-retry-cleanup` | `12`, `13`, `14` | Retry/interruption and stale config cleanup |
| Reserve | `codex-sync-agent-reserve` | `15` | Spare |

## Results

### Agent A - Upload And Missing Password

Status: partial pass.

- Fresh WebDAV config passed on `01` and `02`.
- Connection test passed.
- Missing-password `401 Unauthorized` was reproduced on `01`, then recovered after entering the password.
- Upload-only passed on `01` and `02`; UI showed pending `1 -> 0`, synced `0 -> 1`.
- `03` reached the sync config page but did not complete the half-config persistence/recovery path before run收束.

Evidence:

- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-01/2026-05-30T03-28-48-717Z`
- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-02/2026-05-30T03-39-53-581Z`
- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-03/2026-05-30T03-44-35-065Z`

### Agent B - Download-Only Hydration

Status: pass.

- Seed device `04` uploaded one remote change.
- Reader device `05` downloaded that remote change.
- Reader did not upload its own local pending change.
- SQLite assertions passed: seed sessions `1`, reader sessions `2`, reader change log `2`, reader conflicts `0`.
- WebDAV contained seed manifest only; no reader upload artifact.

Evidence:

- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-04/2026-05-30T03-29-38-115Z`
- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-05/2026-05-30T03-37-24-914Z`

Observation: reader backend summary reported `conflicts=1`, while UI/SQLite actionable conflicts were `0`. This needs a focused log semantics check.

### Agent C - Bidirectional And Conflict

Status: blocked by shared fixture interruption.

- Devices `06`, `07`, and `08` all configured WebDAV successfully.
- `06` triggered bidirectional sync.
- Sync failed with `WebDAV PROPFIND ... connection refused (os error 61)`.
- Fixture was found stopped at the failure point and later restarted.
- No `agent-c-conflict` remote files were written.
- Conflict count/actionable row validation was not reached.

Evidence:

- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-06/2026-05-30T03-42-25-931Z`
- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-06/2026-05-30T03-46-25-914Z`
- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-07/2026-05-30T03-46-25-673Z`
- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-08/2026-05-30T03-46-25-977Z`

### Agent D - Backup And Restore

Status: partial / wrong path exercised.

- Device `09` configured WebDAV after one password-entry `401` recovery.
- Device `09` created a local todo marker.
- Device `09` uploaded data governance changes successfully: pending `4 -> 0`, synced `4`.
- Cloud ZIP backup, backup history, restore, pending slot, restart activation, and post-restore sanity were not reached.
- The UI path to "history/restore" was not stable enough for the subagent to find.

Evidence:

- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-09/2026-05-30T03-44-31-661Z`
- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-10/2026-05-30T03-44-31-794Z`
- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-11/2026-05-30T03-44-31-734Z`

### Agent E - Retry And Cleanup

Status: partial pass.

- Device `12` tested bad endpoint `http://127.0.0.1:18082/`.
- UI reported `MKCOL` retried three times and failed with connection refused.
- Device `12` then restored the correct endpoint, reproduced one password-entry `401`, re-entered password, connected successfully, saved config, and uploaded.
- `13` reached connection-test input stage; `14` accepted协议 only.
- Stale config cleanup, clear config followed by backup/sync, and post-restore sync sanity were not completed.

Evidence:

- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-12/2026-05-30T03-32-11-865Z`
- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-12/2026-05-30T03-40-04-589Z`
- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-13/2026-05-30T03-44-46-490Z`
- `~/Library/Application Support/tauri-lab/evidence/sync-e2e-15-14/2026-05-30T03-44-46-425Z`

Observation: one early wrong-root upload created a stray path outside the intended fixture root structure. Future assertions should check both expected root presence and absence of sibling stray paths.

## Final WebDAV Files Under Fixture Root

- `agent-a-upload/data_governance/changes/sync-e2e-15-01/...json.zst`
- `agent-a-upload/data_governance/changes/sync-e2e-15-02/...json.zst`
- `agent-a-upload/data_governance/manifests/sync-e2e-15-01.json`
- `agent-a-upload/data_governance/manifests/sync-e2e-15-02.json`
- `agent-b-download/data_governance/changes/sync-e2e-15-04/...json.zst`
- `agent-b-download/data_governance/manifests/sync-e2e-15-04.json`
- `agent-d-backup-restore/data_governance/changes/sync-e2e-15-09/...json.zst`
- `agent-d-backup-restore/data_governance/manifests/sync-e2e-15-09.json`
- `agent-e-retry-cleanup/retry-primary/data_governance/manifests/sync-e2e-15-12.json`

## Issues Found

1. Shared WebDAV fixture operations are a global resource and can break another subagent. Add a hard rule: subagents cannot stop/restart shared fixtures.
2. Password fields sometimes appear filled but are not actually submitted to the backend, producing `401 Unauthorized`. Real keyboard entry recovered the issue.
3. Download-only behaved correctly at the data level, but one backend summary reported `conflicts=1` while UI/SQLite actionable conflicts were `0`.
4. Backup/history/restore UI path was not discoverable enough for the subagent to complete the intended restore test.
5. Root/path entry is easy to get wrong and can create stray files outside the intended fixture root.

## Recommended Next Run

- Give each destructive/interruption agent an exclusive WebDAV fixture.
- Keep one shared fixture only for non-disruptive upload/download/bidirectional tests.
- Add a parent-side guard that periodically checks fixture uptime and aborts scenario C-style sync if the shared fixture stops.
- Make each subagent run `agent verify` before its first Computer Use call and include that result in its report.
- Add an assertion for "no files outside assigned scenario prefix".
- Add a focused backup/restore UI map before delegating restore tests again.
