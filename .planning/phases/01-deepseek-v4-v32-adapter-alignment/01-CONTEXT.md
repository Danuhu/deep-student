# Phase 1: DeepSeek V4/V3.2 Adapter Alignment - Context

**Gathered:** 2026-04-26
**Status:** Complete
**Source:** Conversation and documentation review

<domain>
## Phase Boundary

This phase delivers the code-level DeepSeek family adapter/capability alignment. It should make official DeepSeek V4, official aliases, SiliconFlow V3.2, and future SiliconFlow V4-shaped model IDs behave correctly in settings, request construction, context budgeting metadata, and tests.

This phase does not require real provider keys. Live UAT moves to Phase 2.
</domain>

<decisions>
## Implementation Decisions

### Adapter Architecture
- Use one `DeepSeekAdapter` for the DeepSeek family.
- Do not introduce separate V3.2/V4/provider-specific adapters.
- Provider differences should be modeled as request dialect/profile differences.
- Model-version differences should be modeled as capability profile differences.

### Official DeepSeek V4
- Thinking on: send `thinking.type=enabled`.
- Thinking off: send `thinking.type=disabled`.
- Reasoning effort UI exposes `high` and `max` only.
- Internal unspecified/null state may exist for defaults, but must not appear as a user-facing budget choice.
- V4 thinking mode should remove or disable sampling controls official docs say are ignored.
- Do not manually inject Hugging Face `REASONING_EFFORT_MAX` prompt text.

### SiliconFlow
- Current SiliconFlow DeepSeek V3.2 remains on existing V3.2 behavior.
- Future SiliconFlow V4-shaped IDs should reuse V4 capability rules while preserving SiliconFlow request dialect.

### Context Window
- DeepSeek V4 Flash/Pro and official V4 aliases should resolve to 1,000,000 context tokens.
- SiliconFlow DeepSeek V3.2 should remain 128,000 context tokens.
- Context window is local capability metadata; it is not a request parameter sent to DeepSeek.

### the agent's Discretion
- Exact Rust/TypeScript type names and file organization may follow existing code style.
- It is acceptable to keep output-token defaults conservative while exposing context-window capability accurately.
- If backend-wide context-window persistence is too invasive, implement the smallest compatible shared metadata path and document the limitation.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — milestone scope, decisions, and constraints.
- `.planning/REQUIREMENTS.md` — checkable requirements.
- `.planning/ROADMAP.md` — phase boundary and success criteria.

### DeepSeek Code
- `src-tauri/src/llm_manager/adapters/deepseek.rs` — DeepSeek request adaptation.
- `src-tauri/src/llm_manager/adapters/mod.rs` — adapter wiring and shared adapter types.
- `src-tauri/src/llm_manager/mod.rs` — API config, capability inference, and model manager behavior.
- `src-tauri/src/llm_manager/builtin_vendors.rs` — built-in DeepSeek vendor/model metadata.
- `scripts/model-capability-registry.json` — model registry context/output metadata.

### Frontend Capability/UI
- `src/utils/apiCapabilityEngine.ts` — API capability inference.
- `src/utils/modelCapabilities.ts` — model defaults and model capability helpers.
- `src/components/settings/ShadApiEditModal.tsx` — settings modal controls for context window and reasoning effort.
- `src/components/settings/SiliconFlowSection.tsx` — SiliconFlow model capability flow.
- `src/chat-v2/plugins/chat/AdvancedPanel.tsx` — Chat V2 budget UI.
- `src/chat-v2/adapters/TauriAdapter.ts` — Chat V2 bridge to Tauri model info.

### Tests
- `src/utils/__tests__/apiCapabilityEngine.test.ts` — frontend capability inference coverage.
- `tests/vitest/settings/deepseekReasoningEffortContract.test.ts` — settings contract coverage for DeepSeek reasoning effort.
- Rust unit tests near `src-tauri/src/llm_manager/adapters/deepseek.rs` and `src-tauri/src/llm_manager/mod.rs` — request payload and capability behavior.
</canonical_refs>

<specifics>
## Specific Ideas

- Add or normalize a `context_window` / `max_context_tokens` field in shared model capability data.
- Ensure official aliases `deepseek-chat` and `deepseek-reasoner` are interpreted as V4 Flash where appropriate after the official V4 cutoff.
- Keep V4 Pro explicit model IDs separate from `deepseek-reasoner` alias if needed.
- Strip `temperature`, `top_p`, `presence_penalty`, and `frequency_penalty` for official V4 thinking payloads.
- Keep SiliconFlow V3.2 sampling controls intact.
- Add future-proof test model IDs such as `deepseek-ai/DeepSeek-V4-Pro` for SiliconFlow V4-shaped matching.
</specifics>

<deferred>
## Deferred Ideas

- Real-key live smoke testing moves to Phase 2.
- DeepSeek V4 tokenizer integration for exact long-context token counting moves to v2 unless needed for this phase's tests.
- Full provider registry rewrite is out of scope.
</deferred>

---

*Phase: 01-deepseek-v4-v32-adapter-alignment*
*Context gathered: 2026-04-26 via conversation and documentation review*
