# Phase 2 Context: Live Provider UAT And Release Hardening

**Phase:** 2 - Live Provider UAT And Release Hardening
**Status:** Ready for live UAT
**Depends on:** Phase 1

## Goal

Validate the DeepSeek adapter alignment against real providers before release: official DeepSeek V4 and SiliconFlow DeepSeek V3.2 must both work, and the future SiliconFlow V4 rule must remain documented.

## Current Ground Truth

- Phase 1 verified the local request/capability contracts with focused Vitest and Rust tests.
- Official DeepSeek V4 should expose user-facing reasoning effort as only `high` and `max`.
- Official DeepSeek V4 thinking can be disabled through `thinking.type=disabled`; disabled is not a reasoning-effort budget option.
- Official DeepSeek V4 thinking ignores sampling controls, so DeepStudent strips `temperature`, `top_p`, `presence_penalty`, `frequency_penalty`, and `logprobs` when V4 thinking is active.
- SiliconFlow DeepSeek V3.2 keeps SiliconFlow request fields such as `enable_thinking` and `thinking_budget`, and preserves sampling controls.
- If SiliconFlow later ships V4-shaped DeepSeek models, DeepStudent should apply V4 capability rules while keeping SiliconFlow request field names.
- V4 Flash/Pro and official aliases carry 1,000,000-token context metadata; current V3.2 remains 128,000-token class metadata.

## Required Credentials

- Official DeepSeek API key with access to V4 Flash/Pro or current V4 aliases.
- SiliconFlow API key with access to `deepseek-ai/DeepSeek-V3.2`.

## Safety Notes

- Do not commit API keys, local credential files, or captured response bodies containing secrets.
- Prefer tiny live prompts for smoke tests; long-context validation should use a bounded manual checklist unless the user explicitly accepts token cost.
- Keep Phase 2 focused on live validation and release notes. Do not refactor adapter architecture unless live evidence shows a blocker.

## Known Residual From Phase 1

- Broad `cargo test -p deep-student deepseek` also matches an unchanged OCR parser UTF-8 boundary test and currently fails there. Focused DeepSeek LLM manager adapter/profile tests pass.
