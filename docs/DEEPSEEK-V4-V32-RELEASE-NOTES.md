# DeepSeek V4 / V3.2 Adapter Release Notes

**Date:** 2026-04-26
**Scope:** DeepSeek official V4, official aliases, SiliconFlow DeepSeek V3.2, and future SiliconFlow-hosted V4-shaped model IDs.

## Summary

DeepStudent keeps a single DeepSeek family adapter. Model-version capabilities and provider request dialects are handled separately:

- Model version decides capabilities such as V4 thinking behavior, sampling-control handling, and context-window metadata.
- Provider dialect decides request field names, such as official DeepSeek `thinking` / `reasoning_effort` versus SiliconFlow `enable_thinking` plus the version-specific thinking control.

This avoids separate V3.2/V4 adapters while preserving current SiliconFlow V3.2 users.

## Supported Matrix

| Provider | Model IDs | Status | Request dialect | Context metadata |
|----------|-----------|--------|-----------------|------------------|
| DeepSeek official | `deepseek-v4-flash`, `deepseek-v4-pro` | Supported | Official V4 | 1,000,000 tokens |
| DeepSeek official aliases | `deepseek-chat`, `deepseek-reasoner` | Supported as V4-compatible aliases | Official V4 | 1,000,000 tokens |
| SiliconFlow | `deepseek-ai/DeepSeek-V3.2` | Supported and live-smoked | SiliconFlow | 128,000-token class |
| SiliconFlow future V4 | V4-shaped IDs such as `deepseek-ai/DeepSeek-V4-Pro`, if offered later | Contract-tested only, not live-smoked yet | SiliconFlow + V4 high/max effort | 1,000,000 tokens |

Important: SiliconFlow V4 should not be described as live-tested until SiliconFlow actually offers a V4 model and a live smoke is run against it.

## DeepSeek V4 Thinking Controls

DeepSeek V4 exposes only two user-facing reasoning-effort choices, whether hosted by DeepSeek official or by SiliconFlow in the future:

- `high`
- `max`

Turning thinking off is not a reasoning-effort budget. DeepStudent sends:

- DeepSeek official thinking on: `thinking.type=enabled` plus `reasoning_effort=high|max`
- DeepSeek official thinking off: `thinking.type=disabled`
- SiliconFlow future V4 thinking on: `enable_thinking=true` plus `reasoning_effort=high|max`
- SiliconFlow future V4 thinking off: `enable_thinking=false`

The UI must not show `none`, `unset`, or `unspecified` as a V4 reasoning-effort option. Internal empty values may exist only as implementation state.

## Settings Defaults vs Chat Runtime Overrides

DeepStudent separates saved model defaults from per-chat runtime controls:

- Settings page values define the model profile defaults and capability metadata.
- The Chat input-bar atom button only writes Chat runtime overrides into `ChatParams`.
- The main atom button stays a quick on/off toggle.
- The visible runtime state pill next to the atom button opens the depth menu only for versioned DeepSeek controls.

Runtime menu behavior:

| Model family | Runtime depth options | Display examples |
|--------------|-----------------------|------------------|
| DeepSeek V4, including future SiliconFlow V4 | `high`, `max` | `推理: high`, `推理: max`, `推理: 关闭` |
| SiliconFlow DeepSeek V3.2 | `low`, `medium`, `high`, `xhigh` | `推理: 低`, `推理: 中`, `推理: 高`, `推理: 超高`, `推理: 关闭` |
| Other models | Toggle only | `推理: 开启`, `推理: 关闭` |

When the active model changes, runtime depth fields are normalized by model version:

- V4 accepts only `high` / `max`; legacy `xhigh` becomes `max`.
- V3.2 accepts only `low` / `medium` / `high` / `xhigh`; V4 `max` becomes `xhigh` and maps to `thinking_budget=32768`.
- Toggle-only models clear versioned runtime depth fields instead of carrying a DeepSeek-specific budget into another provider.

Turning thinking off preserves the last selected runtime depth in Chat state for convenience, but the actual request still sends a disabled-thinking payload and does not send an active effort field.

## DeepSeek V4 Sampling Controls

DeepSeek V4 thinking mode accepts several sampling parameters for compatibility, but they do not take effect in thinking mode. DeepStudent suppresses these fields for active V4 thinking requests:

- `temperature`
- `top_p`
- `presence_penalty`
- `frequency_penalty`
- `logprobs`

This avoids misleading users into thinking those knobs affect V4 thinking output.

## SiliconFlow DeepSeek V3.2 Compatibility

SiliconFlow V3.2 keeps the existing SiliconFlow dialect:

- `enable_thinking`
- `thinking_budget`

SiliconFlow V3.2 exposes four UI depth presets that map to `thinking_budget`:

| UI option | Chinese label | thinking_budget |
|-----------|---------------|-----------------|
| `low` | 低 | 2,048 |
| `medium` | 中 | 8,192 |
| `high` | 高 | 16,384 |
| `xhigh` | 超高 | 32,768 |

SiliconFlow V3.2 also keeps sampling controls configurable:

- `temperature`
- `top_p`
- `presence_penalty`
- `frequency_penalty`

Do not strip V3.2 sampling controls as if it were V4.

## Future SiliconFlow V4 Rule

If SiliconFlow later offers V4-shaped DeepSeek model IDs, DeepStudent should apply DeepSeek V4 capability rules while preserving SiliconFlow request field names.

That means:

- Use V4 context metadata and V4 sampling-control restrictions.
- Keep SiliconFlow's host dialect for the thinking toggle: `enable_thinking`.
- Use the V4 depth contract: `reasoning_effort=high|max`, not V3.2 `thinking_budget`.
- Do not switch SiliconFlow-hosted models to official DeepSeek `thinking.type` unless SiliconFlow explicitly documents that dialect.

## 1M Context Guidance

DeepSeek V4 Flash/Pro and official aliases carry 1,000,000-token context metadata in DeepStudent. This metadata is used for model capability display and Chat V2 budgeting.

Release and QA guidance:

- Treat 1M as capability metadata, not a reason to automatically send maximum-length prompts.
- Long-context live tests can be expensive and slow; keep routine smoke tests small.
- If a 1M-path check is needed, run a bounded manual checklist first and only perform large-token calls with explicit cost approval.
- V3.2 should remain in the 128,000-token class.

## Live Smoke Results

Live smoke was run on 2026-04-26.

| Provider | Model | Mode | Result |
|----------|-------|------|--------|
| DeepSeek official | `deepseek-v4-flash` | Thinking disabled | Passed, HTTP 200 |
| DeepSeek official | `deepseek-v4-flash` | Thinking high | Passed, HTTP 200 |
| DeepSeek official | `deepseek-v4-flash` | Thinking max | Passed, HTTP 200 |
| SiliconFlow | `deepseek-ai/DeepSeek-V3.2` | Thinking enabled with sampling controls preserved | Passed, HTTP 200 |

The smoke harness is `scripts/deepseek-live-smoke.mjs`. It reports request shape, HTTP status, response metadata, and usage, but does not print API keys or model response bodies.

## Known Follow-Up

The broad Rust filter `cargo test -p deep-student deepseek` also matches an unrelated OCR parser UTF-8 boundary test in unchanged code. Focused LLM manager DeepSeek adapter/profile tests pass. If CI or release workflows require the broad filter to pass, file a separate OCR parser follow-up rather than mixing it into the V4/V3.2 adapter release.
