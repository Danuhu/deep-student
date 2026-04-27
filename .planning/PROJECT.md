# DeepStudent DeepSeek Adapter Milestone

## What This Is

DeepStudent is an open-source, local-first AI learning workbench that unifies study chat, notes, resources, mind maps, quizzes, flashcards, translation, and research workflows. This planning state scopes the current brownfield milestone: make DeepStudent's DeepSeek family integration correctly support official DeepSeek V4 while preserving SiliconFlow's current DeepSeek V3.2 behavior and preparing for future SiliconFlow V4 models.

## Core Value

DeepStudent users can select the right DeepSeek model/version/provider combination and trust that thinking mode, context length, request payloads, and UI affordances match the actual model capability.

## Requirements

### Validated

- DeepStudent already supports multiple LLM providers and DeepSeek-family model configuration through existing settings and adapter code.
- DeepStudent already has frontend capability inference for several DeepSeek V4-shaped model IDs and SiliconFlow V3.2-shaped IDs.
- DeepStudent already has Rust-side DeepSeek request adaptation work in progress for official V4 thinking behavior and SiliconFlow compatibility.

### Active

- [ ] Support official DeepSeek V4 thinking mode through official API parameters, not manual prompt injection.
- [ ] Preserve SiliconFlow DeepSeek V3.2 behavior while separating it from DeepSeek V4 capability rules.
- [ ] Treat future SiliconFlow DeepSeek V4 models as V4-capable models while preserving SiliconFlow's provider-specific request dialect.
- [ ] Promote DeepSeek V4's 1M context window from frontend heuristics into shared model capability metadata.
- [ ] Ensure V4 thinking mode disables or strips sampling controls that official docs say are ignored.
- [ ] Add tests covering official V4, official aliases, SiliconFlow V3.2, and future SiliconFlow V4-shaped model IDs.

### Out of Scope

- Replacing the existing `DeepSeekAdapter` with provider/version-specific adapters — this would fragment family behavior unnecessarily.
- Manually injecting Hugging Face `REASONING_EFFORT_MAX` text into official API requests — official API consumers should use structured parameters.
- Reworking all non-DeepSeek provider capability modeling in this milestone — only the minimum shared fields needed for DeepSeek context support are in scope.
- Live provider UAT without user-provided real keys — live smoke can be documented and run after keys are available.

## Context

The user explicitly challenged an earlier direction that appeared to split DeepSeek support too aggressively. The settled architecture is:

```text
DeepSeekAdapter
= DeepSeek family protocol adapter

Provider Profile
= official DeepSeek / SiliconFlow request dialect differences

Model Capability Profile
= DeepSeek V3.2 / DeepSeek V4 version-specific behavior
```

Official DeepSeek V4 exposes thinking through `thinking.type` and `reasoning_effort` with user-facing `high` and `max` choices. Turning thinking off uses `thinking.type=disabled`; `none` or `unspecified` should not be shown as reasoning-budget choices.

Official DeepSeek V4 thinking mode accepts `temperature`, `top_p`, `presence_penalty`, and `frequency_penalty` for compatibility but does not apply them. DeepStudent should not present those as effective controls when V4 thinking is enabled, and request construction should remove or suppress them where practical.

Hugging Face model cards for `deepseek-ai/DeepSeek-V4-Flash` and `deepseek-ai/DeepSeek-V4-Pro` list 1M context. V4 Flash is associated with the official `deepseek-chat` and `deepseek-reasoner` aliases after 2026-01-15. V4 Pro should be addressed explicitly as `deepseek-v4-pro`; the model card indicates the `deepseek-reasoner` alias is not currently supported for V4 Pro in official API usage.

The Hugging Face `encoding_dsv4.py` file contains a max-reasoning prompt prefix for raw model template usage, but official API integration should pass `reasoning_effort=max` rather than injecting that text into user/system messages.

## Constraints

- **Compatibility**: SiliconFlow's current DeepSeek V3.2 users must not regress while V4 support is added.
- **Architecture**: DeepSeek family models should share one adapter; provider and model-version differences belong in profiles/capabilities.
- **API correctness**: Official DeepSeek V4 should use official structured parameters for thinking mode.
- **Context budgeting**: 1M context is not an API parameter to send to DeepSeek; it is local capability metadata for prompt assembly, history trimming, UI display, and validation.
- **Testing**: Provider/version routing must be covered by unit and contract tests before live smoke testing.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep one `DeepSeekAdapter` for the DeepSeek family | The protocol is family-level; splitting by V3.2/V4/provider would duplicate logic and increase drift | - Pending |
| Model version decides capability profile | V3.2 and V4 differ in thinking semantics, context, and parameter effectiveness | - Pending |
| Provider decides request dialect | Official DeepSeek and SiliconFlow may encode thinking controls differently even for the same model family | - Pending |
| Show only `high` and `max` as V4 reasoning effort choices | Official V4 UI should not expose `none` or internal unspecified states as budget options | - Pending |
| Do not inject HF `REASONING_EFFORT_MAX` prompt in official API requests | Official API has structured `reasoning_effort=max`; manual injection pollutes user prompts | - Pending |
| V4 context window is 1,000,000 tokens in capability metadata | HF V4 Flash/Pro cards list 1M context; DeepStudent needs this for budgeting and display | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements invalidated? Move to Out of Scope with reason.
2. Requirements validated? Move to Validated with phase reference.
3. New requirements emerged? Add to Active.
4. Decisions to log? Add to Key Decisions.
5. "What This Is" still accurate? Update if drifted.

**After each milestone**:
1. Full review of all sections.
2. Core Value check: still the right priority?
3. Audit Out of Scope: reasons still valid?
4. Update Context with current state.

---
*Last updated: 2026-04-26 after initialization*
