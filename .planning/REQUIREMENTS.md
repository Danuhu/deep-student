# Requirements: DeepStudent DeepSeek Adapter Milestone

**Defined:** 2026-04-26
**Core Value:** DeepStudent users can select the right DeepSeek model/version/provider combination and trust that thinking mode, context length, request payloads, and UI affordances match the actual model capability.

## v1 Requirements

### Adapter Architecture

- [x] **DSK-01**: DeepSeek family models share one `DeepSeekAdapter`; provider/version behavior is selected through profiles or capability metadata rather than separate adapters.
- [x] **DSK-02**: Official DeepSeek and SiliconFlow request dialects remain distinguishable so provider-specific fields are emitted only where appropriate.

### DeepSeek V4 Official API

- [x] **DSK-03**: Official DeepSeek V4 thinking mode sends `thinking.type=enabled` with `reasoning_effort=high` or `reasoning_effort=max`.
- [x] **DSK-04**: Official DeepSeek V4 non-thinking mode sends `thinking.type=disabled` and does not expose `none` or `unspecified` as user-facing budget choices.
- [x] **DSK-05**: Official DeepSeek V4 thinking mode strips or disables sampling controls that the official API says are ignored.
- [x] **DSK-06**: Official DeepSeek V4 API requests never manually inject Hugging Face `REASONING_EFFORT_MAX` prompt text.

### SiliconFlow Compatibility

- [x] **DSK-07**: SiliconFlow DeepSeek V3.2 keeps its existing thinking and sampling behavior.
- [x] **DSK-08**: Future SiliconFlow DeepSeek V4-shaped model IDs reuse DeepSeek V4 capability rules while preserving SiliconFlow provider request dialect.

### Context And Capability Metadata

- [x] **DSK-09**: DeepSeek V4 Flash/Pro and official V4 aliases resolve to a 1,000,000-token context window in shared model capability metadata.
- [x] **DSK-10**: SiliconFlow DeepSeek V3.2 resolves to the existing 128,000-token context window.
- [x] **DSK-11**: Chat history trimming, auto-budgeting, settings display, and model capability inference can consume the same DeepSeek context-window metadata.

### Verification

- [x] **DSK-12**: Unit or contract tests cover official V4 high/max/disabled thinking payloads.
- [x] **DSK-13**: Unit or contract tests cover SiliconFlow V3.2 compatibility and future SiliconFlow V4-shaped model IDs.
- [x] **DSK-14**: Tests cover V4 1M context inference and V3.2 128K context inference.
- [x] **DSK-15**: A live smoke checklist exists for official DeepSeek V4 and SiliconFlow V3.2 keys.

## v2 Requirements

### Long-Context Precision

- **DSK-V2-01**: DeepStudent can use a DeepSeek V4-compatible tokenizer for more precise long-context token counting.
- **DSK-V2-02**: DeepStudent can run an automated long-context live smoke test against official DeepSeek V4 when a key is configured.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New DeepSeek V4-only adapter | Family-level adapter plus profiles is cleaner and avoids duplicated protocol code |
| Manual max-thinking prompt injection | Official API exposes structured `reasoning_effort=max`; prompt injection is for raw HF template usage |
| Broad provider registry rewrite | This milestone only needs the metadata required for DeepSeek family correctness |
| Live calls without user keys | Real provider UAT requires user-owned official DeepSeek and SiliconFlow credentials |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DSK-01 | Phase 1 | Pending |
| DSK-02 | Phase 1 | Pending |
| DSK-03 | Phase 1 | Pending |
| DSK-04 | Phase 1 | Pending |
| DSK-05 | Phase 1 | Pending |
| DSK-06 | Phase 1 | Pending |
| DSK-07 | Phase 1 | Pending |
| DSK-08 | Phase 1 | Pending |
| DSK-09 | Phase 1 | Pending |
| DSK-10 | Phase 1 | Pending |
| DSK-11 | Phase 1 | Pending |
| DSK-12 | Phase 1 | Pending |
| DSK-13 | Phase 1 | Pending |
| DSK-14 | Phase 1 | Pending |
| DSK-15 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-04-26*
*Last updated: 2026-04-26 after initialization*
