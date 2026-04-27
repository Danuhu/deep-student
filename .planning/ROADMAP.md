# Roadmap: DeepStudent DeepSeek Adapter Milestone

## Overview

This roadmap focuses on one brownfield milestone: make DeepStudent's DeepSeek family integration version-aware without fragmenting the adapter. Phase 1 implements the shared capability/request model for official DeepSeek V4, SiliconFlow V3.2, and future SiliconFlow V4-shaped models. Phase 2 performs live-provider smoke testing and release hardening once real keys are available.

## Phases

**Phase Numbering:**
- Integer phases (1, 2): Planned milestone work.
- Decimal phases (1.1, 1.2): Urgent insertions, if needed.

- [x] **Phase 1: DeepSeek V4/V3.2 Adapter Alignment** - Implement version-aware DeepSeek capability and request handling without splitting the family adapter.
- [x] **Phase 2: Live Provider UAT And Release Hardening** - Validate official V4 and SiliconFlow V3.2 with real keys, then document remaining operational guidance.

## Phase Details

### Phase 1: DeepSeek V4/V3.2 Adapter Alignment
**Goal**: DeepStudent correctly routes DeepSeek official V4, official aliases, SiliconFlow V3.2, and future SiliconFlow V4-shaped models through one DeepSeek family adapter with provider-specific request dialects and version-specific capabilities.
**Depends on**: Nothing (first phase)
**Requirements**: [DSK-01, DSK-02, DSK-03, DSK-04, DSK-05, DSK-06, DSK-07, DSK-08, DSK-09, DSK-10, DSK-11, DSK-12, DSK-13, DSK-14]
**Success Criteria** (what must be TRUE):
  1. Official DeepSeek V4 high/max/disabled thinking requests match official API semantics.
  2. SiliconFlow DeepSeek V3.2 request behavior and sampling controls do not regress.
  3. Future SiliconFlow V4-shaped model IDs receive DeepSeek V4 capabilities while preserving SiliconFlow request dialect.
  4. DeepSeek V4 context window resolves to 1,000,000 tokens across shared capability metadata, while V3.2 remains 128,000 tokens.
  5. Tests cover the official V4, official alias, SiliconFlow V3.2, and future SiliconFlow V4-shaped cases.
**Plans**: 3 plans

Plans:
- [x] 01-01: Normalize DeepSeek family capability profiles and context-window metadata.
- [x] 01-02: Harden DeepSeek provider request dialect handling for official V4 and SiliconFlow V3.2/V4.
- [x] 01-03: Add focused regression tests for V4 thinking, V3.2 compatibility, and context inference.

### Phase 2: Live Provider UAT And Release Hardening
**Goal**: Prove the adapter changes against real official DeepSeek V4 and SiliconFlow V3.2 credentials, then document live-smoke expectations and known limitations.
**Depends on**: Phase 1
**Requirements**: [DSK-15]
**Success Criteria** (what must be TRUE):
  1. Official DeepSeek V4 live smoke covers non-thinking, high thinking, and max thinking requests.
  2. SiliconFlow DeepSeek V3.2 live smoke confirms existing user behavior remains compatible.
  3. Long-context smoke or a documented manual checklist validates the 1M context path as far as practical without excessive cost.
  4. Release notes explain V4 thinking controls, ignored sampling controls, and the SiliconFlow V4 future-compatibility rule.
**Plans**: 2 plans

Plans:
- [x] 02-01: Run or document provider live-smoke checks with real keys.
- [x] 02-02: Finalize user-facing notes and release hardening.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. DeepSeek V4/V3.2 Adapter Alignment | 3/3 | Complete | 2026-04-26 |
| 2. Live Provider UAT And Release Hardening | 2/2 | Complete | 2026-04-26 |
