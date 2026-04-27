# Phase 2 Summary: Live Provider UAT And Release Hardening

**Status:** Complete
**Started:** 2026-04-26
**Completed:** 2026-04-26

## 2026-04-26 Attempt

Prepared and ran a safe live-smoke harness:

```bash
node scripts/deepseek-live-smoke.mjs
```

The harness does not print API keys or model response bodies. It reports only model IDs, request field shape, HTTP status, response IDs, and usage metadata.

## Current Result

Initial live provider calls did not run because the current shell did not have the required credentials:

- `DEEPSEEK_API_KEY`: absent
- `SILICONFLOW_API_KEY`: absent

After the user provided an official DeepSeek key for this session only, official DeepSeek V4 Flash live smoke passed:

| Provider | Model | Mode | Expected request dialect | Result |
|----------|-------|------|--------------------------|--------|
| DeepSeek official | `deepseek-v4-flash` | Thinking disabled | `thinking.type=disabled`, no sampling controls | Passed, HTTP 200 |
| DeepSeek official | `deepseek-v4-flash` | Thinking high | `thinking.type=enabled`, `reasoning_effort=high`, no sampling controls | Passed, HTTP 200 |
| DeepSeek official | `deepseek-v4-flash` | Thinking max | `thinking.type=enabled`, `reasoning_effort=max`, no sampling controls | Passed, HTTP 200 |

Observed usage sanity:

- Disabled: prompt 10, completion 2, total 12, no reasoning content.
- High: prompt 10, completion 34, total 44, reasoning tokens 31.
- Max: prompt 89, completion 43, total 132, reasoning tokens 40.

After the user provided a SiliconFlow key for this session only, SiliconFlow V3.2 live smoke also passed:

| Provider | Model | Mode | Expected request dialect | Result |
|----------|-------|------|--------------------------|--------|
| SiliconFlow | `deepseek-ai/DeepSeek-V3.2` | Thinking enabled | `enable_thinking=true`, `thinking_budget=512`, sampling controls preserved | Passed, HTTP 200 |

Observed usage sanity:

- V3.2: prompt 10, completion 83, total 93, reasoning tokens 81.

## Request Shape Verified Locally

- Official V4 disabled request uses `thinking.type=disabled`.
- Official V4 high request uses `thinking.type=enabled` and `reasoning_effort=high`.
- Official V4 max request uses `thinking.type=enabled` and `reasoning_effort=max`.
- Official V4 smoke requests do not include `temperature`, `top_p`, `presence_penalty`, or `frequency_penalty`.
- SiliconFlow V3.2 request uses `enable_thinking=true` and `thinking_budget=512`.
- SiliconFlow V3.2 request keeps `temperature`, `top_p`, `presence_penalty`, and `frequency_penalty`.

## Source Check

DeepSeek official docs checked on 2026-04-26:

- Current official model names include `deepseek-v4-flash` and `deepseek-v4-pro`.
- Official V4 context length is 1M.
- Thinking mode supports `thinking.type=enabled/disabled` and `reasoning_effort=high|max`.
- Thinking mode does not support `temperature`, `top_p`, `presence_penalty`, or `frequency_penalty`; they are accepted for compatibility but ineffective.

## How To Continue

Run the smoke with live keys in the same worktree:

```bash
DEEPSEEK_API_KEY="..." \
SILICONFLOW_API_KEY="..." \
node scripts/deepseek-live-smoke.mjs
```

Optional overrides:

```bash
DEEPSEEK_V4_MODEL="deepseek-v4-pro" \
SILICONFLOW_V32_MODEL="deepseek-ai/DeepSeek-V3.2" \
DEEPSEEK_BASE_URL="https://api.deepseek.com" \
SILICONFLOW_BASE_URL="https://api.siliconflow.cn/v1" \
node scripts/deepseek-live-smoke.mjs
```

## Remaining Work

- If SiliconFlow still has no V4 model, keep SiliconFlow V4 marked as future-compatible by contract tests only.

## Release Hardening

Release/QA notes were added in `docs/DEEPSEEK-V4-V32-RELEASE-NOTES.md`.

The notes cover:

- Supported official V4, official alias, SiliconFlow V3.2, and future SiliconFlow V4 matrix.
- Official V4 reasoning effort: user-facing `high` / `max` only; disabled thinking is `thinking.type=disabled`.
- Official V4 thinking sampling-control suppression.
- SiliconFlow V3.2 compatibility with `enable_thinking`, `thinking_budget`, and preserved sampling controls.
- Future SiliconFlow V4 rule: V4 capability semantics with SiliconFlow payload dialect, not official payload fields.
- 1M context metadata and cost caution.
- Unrelated OCR parser broad-filter follow-up decision.

## Final Hardening Addendum

After final review, the DeepSeek family rule was tightened:

- `supportsReasoning` is treated as model capability, not the user's current thinking toggle. V4 thinking-off configs still explicitly send disabled thinking.
- DeepSeek V4-shaped models use `high` / `max` only, including future SiliconFlow V4 if SiliconFlow exposes it.
- Future SiliconFlow V4 keeps the SiliconFlow host toggle (`enable_thinking`) but uses the V4 depth field (`reasoning_effort=high|max`), not V3.2 `thinking_budget`.
- SiliconFlow V3.2 exposes UI presets `low` / `medium` / `high` / `xhigh`, mapped to `thinking_budget` 2048 / 8192 / 16384 / 32768.
- Chat AdvancedPanel locks sampling sliders for DeepSeek V4 thinking mode across official and future SiliconFlow V4, while V3.2 remains editable.
- The Chat input-bar atom button is runtime-only and does not mutate settings-page model defaults.
- The runtime state label is explicit: V4 shows `推理: high|max|关闭`, V3.2 shows `推理: 低|中|高|超高|关闭`, and other models remain toggle-only.
- Runtime depth is normalized on model switch: V4 keeps only `high|max`, V3.2 keeps only `low|medium|high|xhigh`, and toggle-only models clear DeepSeek-specific depth fields.

Final focused verification passed:

- Frontend focused Vitest: 4 files, 18 tests passed.
- Rust DeepSeek adapter tests: 15 passed.
- Rust runtime reasoning override tests: 2 focused tests passed.
- `node --check scripts/deepseek-live-smoke.mjs` passed.
- `rustfmt --edition 2021 --check` passed for touched Rust files.
- `git diff --check` passed for touched DeepSeek/runtime/doc scopes.
- Targeted secret scan over touched DeepSeek files found no API keys.

Full `npx tsc --noEmit --pretty false` remains blocked by broader worktree type errors outside the DeepSeek runtime/adapter scope.
