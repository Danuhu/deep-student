# DSTU Test

`dstu-test/` collects the local, real-environment test system used for Deep Student Tauri testing:

- `dstu-test/scripts/tauri-lab.mjs`: multi-instance Tauri control plane for real desktop UI testing.
- `docker/docker-compose.sync-test.yml`: local WebDAV and MinIO cloud-sync fixture.
- `skills/`: Codex skills that teach agents how to use `tauri-lab` and run cloud-sync E2E tests safely.
- `docs/`: investigation notes, design docs, and run reports from the first real test passes.

The intent is that a collaborator can clone the repo, install the skills, start fixtures, launch many isolated Tauri windows, and let Codex or subagents drive real UI workflows while assertions inspect SQLite, logs, metrics, and WebDAV state afterward.

## Quick Start

From the repository root:

Prerequisites:

- macOS with Codex Desktop Computer Use available for real UI driving.
- Node/npm dependencies installed for this repository.
- A local Tauri macOS app bundle already built at `src-tauri/target/debug/bundle/macos/Deep Student.app`.
- Docker Desktop running when using WebDAV/MinIO cloud fixtures.
- The macOS `sqlite3`, `xattr`, `/usr/libexec/PlistBuddy`, and `launchctl` commands available. These are present on a normal macOS install.

```sh
npm run dstu-test:install-skills -- --force
npm run tauri-lab -- service start --json
npm run tauri-lab -- project register deep-student \
  --cwd "$PWD" \
  --source-app "src-tauri/target/debug/bundle/macos/Deep Student.app" \
  --json
```

Create and start a small pool:

```sh
npm run tauri-lab -- pool create deep-student smoke-03 --count 3 --json
npm run tauri-lab -- pool start smoke-03 --concurrency 2 --wait --metrics --timeout 90 --json
npm run tauri-lab -- agent checkout smoke-03 \
  --owner codex-smoke-a \
  --purpose "manual UI smoke" \
  --start --wait --metrics \
  --json
```

Use the returned `target.app` path as the Computer Use app target. When multiple agents are active, never pick windows from the global app list; use leases and exact app paths only.

## Cloud Fixtures

Preferred WebDAV fixture for automated runs:

```sh
npm run tauri-lab -- fixture webdav start sync-webdav \
  --username ds-test \
  --password ds-pass \
  --root deep-student-e2e \
  --json
npm run tauri-lab -- fixture webdav credentials sync-webdav --json
```

Docker Compose fixture for collaborators who want explicit WebDAV and MinIO containers:

```sh
npm run dstu-test:cloud:up
npm run dstu-test:cloud:down
```

The Compose WebDAV endpoint is `http://127.0.0.1:8080`, username `webdav`, password `webdav123`.

## Data Images

`tauri-lab` images are runtime artifacts stored outside the repo under `TAURI_LAB_HOME` or `~/Library/Application Support/tauri-lab/images`. They are intentionally not committed.

Images should normally be created on the machine running the tests. A copied image can work, but may contain absolute paths or machine-specific fixture state depending on what the app saved through the UI.

Useful commands:

```sh
npm run tauri-lab -- image list --json
npm run tauri-lab -- image inspect lh-shell-seed --json
npm run tauri-lab -- image create lh-shell-seed \
  --from-instance learning-apps-05-05 \
  --scope home \
  --description "Learning Hub shell seed" \
  --json
npm run tauri-lab -- pool create deep-student lh-05 --count 5 --image lh-shell-seed --json
```

Create images from stopped instances by default. Use `--live` only for disposable smoke seeds.

## Parallel Agents

For five Codex subagents, use a 10-15 instance pool and assign leases from the parent agent:

```sh
npm run tauri-lab -- pool create deep-student sync-e2e-15 --count 15 --image lh-shell-seed --json
npm run tauri-lab -- pool start sync-e2e-15 --concurrency 4 --wait --metrics --timeout 90 --json
npm run tauri-lab -- agent checkout sync-e2e-15 --owner codex-sync-agent-a --purpose "writer" --json
npm run tauri-lab -- agent targets --owner codex-sync-agent-a --json
```

Each subagent must verify before Computer Use:

```sh
npm run tauri-lab -- agent verify <instance-id> \
  --owner codex-sync-agent-a \
  --app "<exact target.app path>" \
  --require-running \
  --json
```

Cleanup:

```sh
npm run tauri-lab -- lease audit --json
npm run tauri-lab -- lease clear --pool sync-e2e-15 --json
npm run tauri-lab -- pool stop sync-e2e-15 --concurrency 4 --json
```

## Evidence And Debugging

After meaningful UI actions or failures:

```sh
npm run tauri-lab -- evidence snapshot <instance-id> --tail 300 --json
npm run tauri-lab -- logs <instance-id> --kind backend --tail 200
npm run tauri-lab -- logs <instance-id> --kind frontend --tail 200
npm run tauri-lab -- fixture webdav tree sync-webdav --json
```

Use SQLite/WebDAV/log checks only as assertions after real UI operations. The test entry point remains the real Tauri UI through Computer Use.
