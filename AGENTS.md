# Project

DeepStudent DeepSeek Adapter Milestone

## Planning Context

Before planning or implementing work in this milestone, read:

- `.planning/STATE.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

For Phase 1 implementation, also read:

- `.planning/phases/01-deepseek-v4-v32-adapter-alignment/01-CONTEXT.md`
- `.planning/phases/01-deepseek-v4-v32-adapter-alignment/01-01-PLAN.md`
- `.planning/phases/01-deepseek-v4-v32-adapter-alignment/01-02-PLAN.md`
- `.planning/phases/01-deepseek-v4-v32-adapter-alignment/01-03-PLAN.md`

## Current Architecture Decision

DeepSeek family models should share one `DeepSeekAdapter`. Provider differences belong in provider request dialect/profile logic. Model-version differences belong in capability profiles.

## Safety

The worktree contains unrelated in-progress changes. Do not revert user edits or unrelated modified files while working on this milestone.
