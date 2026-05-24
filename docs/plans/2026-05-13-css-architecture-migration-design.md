# CSS Architecture Migration Design

**Date:** 2026-05-13
**Status:** Approved
**Branch:** nightly (worktree: study-ui-migration)

## Summary

Migrate from monolithic global CSS (App.css 12K lines + DeepStudent.css 3K lines + 60+ scattered CSS files) to a modern, maintainable architecture: Tailwind v4 first + CSS Modules fallback, feature-based directory structure, semantic design tokens as single source of truth.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Migration strategy | Hybrid (C) | Concentrate on App.css first, then gradual for rest |
| Styling standard | Tailwind v4 first + CSS Modules fallback | Matches existing shadcn/ui patterns, CSS Modules for complex cases (CrepeEditor, PDF) |
| Token architecture | CSS variables as source of truth (3-layer) | Already using CSS vars, v4 @theme eliminates config bridging |
| Directory structure | Feature-based reorganization | Co-locate styles with features during migration |
| Tailwind version | v4 (direct, skip v3 intermediate) | Already touching all CSS files, avoid double migration |
| Dependency cleanup | Deferred to separate phase | Orthogonal concern, avoid scope creep |

## Target Architecture

### Directory Structure

```
src/
  app/                          # Application shell
    shell/
    navigation/
    App.tsx
    global.css                  # reset + base typography + token import

  tokens/                       # Design Token single source of truth
    primitives.css              # Raw palette (--blue-500, --gray-100...)
    semantic.css                # Semantic layer + dark mode remapping
    index.css                   # Unified entry

  features/                     # Self-contained feature modules
    chat/
      components/
      hooks/
      stores/
      styles/                   # CSS Modules (complex cases only)
      index.ts                  # Public API
    notes/
    learning-hub/
    mindmap/
    pdf/
    practice/
    settings/
    template-management/
    skills-management/
    todo/
    pomodoro/
    command-palette/
    voice-input/

  shared/                       # Cross-feature shared code
    ui/                         # Atomic components (Button, Dialog, Select...)
      shad/
      app-menu/
    components/                 # Shared business components
    hooks/
    utils/
    styles/                     # Shared style utilities
      platform-compat.css       # Android/WebView fixes (global)
      vendor-overrides.css      # Third-party lib overrides (global)
      animations.css
      scrollbar.css
      responsive.css

  lib/                          # Pure utility functions (cn, utils)
  stores/                       # Global stores (ui, network, system)
  config/
  i18n/
  types/
```

### Token System (Tailwind v4)

```css
/* src/tokens/primitives.css */
:root {
  --blue-50: 214 100% 97%;
  --blue-500: 217 91% 60%;
  --blue-600: 221 83% 53%;
  --gray-50: 210 40% 98%;
  --gray-100: 220 14% 96%;
  --gray-200: 220 13% 91%;
  --gray-500: 215 16% 47%;
  --gray-700: 215 19% 35%;
  --gray-800: 217 33% 17%;
  --gray-900: 222 47% 11%;
  --red-500: 0 84% 60%;
  /* ... complete palette */
}

/* src/tokens/semantic.css */
:root {
  --semantic-primary: var(--blue-600);
  --semantic-background: var(--gray-50);
  --semantic-surface: 0 0% 100%;
  --semantic-text: var(--gray-900);
  --semantic-text-muted: var(--gray-500);
  --semantic-border: var(--gray-200);
  --semantic-muted: var(--gray-100);
  --semantic-destructive: var(--red-500);
  --semantic-accent: var(--blue-500);
  --semantic-radius-sm: 0.25rem;
  --semantic-radius-md: 0.5rem;
  --semantic-radius-lg: 0.75rem;
  --semantic-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --semantic-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

html[data-theme="dark"] {
  --semantic-primary: var(--blue-500);
  --semantic-background: var(--gray-900);
  --semantic-surface: var(--gray-800);
  --semantic-text: var(--gray-50);
  --semantic-text-muted: var(--gray-400);
  --semantic-border: var(--gray-700);
  --semantic-muted: var(--gray-800);
}

/* src/app/global.css */
@import "tailwindcss";
@import "../tokens/primitives.css";
@import "../tokens/semantic.css";

@theme {
  --color-primary: hsl(var(--semantic-primary));
  --color-background: hsl(var(--semantic-background));
  --color-surface: hsl(var(--semantic-surface));
  --color-text: hsl(var(--semantic-text));
  --color-text-muted: hsl(var(--semantic-text-muted));
  --color-border: hsl(var(--semantic-border));
  --color-muted: hsl(var(--semantic-muted));
  --color-destructive: hsl(var(--semantic-destructive));
  --color-accent: hsl(var(--semantic-accent));
  --radius-sm: var(--semantic-radius-sm);
  --radius-md: var(--semantic-radius-md);
  --radius-lg: var(--semantic-radius-lg);
  --shadow-sm: var(--semantic-shadow-sm);
  --shadow-md: var(--semantic-shadow-md);
}
```

### Styling Rules

1. **Default:** Tailwind utility classes via `cn()` helper
2. **Complex components (>50 lines of style logic):** `ComponentName.module.css`
3. **Global styles allowed ONLY in:**
   - `src/tokens/` (design tokens)
   - `src/app/global.css` (reset, base typography)
   - `src/shared/styles/platform-compat.css` (WebView fixes)
   - `src/shared/styles/vendor-overrides.css` (third-party lib overrides)
4. **Forbidden:** `!important` (enforced by stylelint)
5. **Forbidden:** Cross-feature direct imports (enforced by eslint-plugin-boundaries)

### Feature Module Boundary Rules

```ts
// ALLOWED
import { NotesHome } from '@/features/notes';        // via index.ts
import { Button } from '@/shared/ui/shad/Button';    // shared layer
import { cn } from '@/lib/utils';                     // lib layer

// FORBIDDEN
import { InternalNoteCard } from '@/features/notes/components/InternalNoteCard';  // internal
import { ChatBubble } from '@/features/chat/components/ChatBubble';              // cross-feature
```

## Migration Phases

### Phase 0: Infrastructure Setup (1-2 days)

No business code changes. Establish new architecture skeleton.

1. Upgrade Tailwind v3 → v4
   - Install `tailwindcss@4`, `@tailwindcss/postcss`, `@tailwindcss/vite`
   - Delete `tailwind.config.js`, update `postcss.config.js`
   - Run `npx @tailwindcss/upgrade` codemod
   - Create `src/app/global.css` with `@import "tailwindcss"` + `@theme`

2. Establish token system
   - Create `src/tokens/primitives.css` (extract from shadcn-variables.css + theme-colors.css)
   - Create `src/tokens/semantic.css` (semantic mapping + dark mode)
   - Wire into `global.css` via `@theme`

3. Create directory skeleton
   - `src/features/` with empty subdirectories
   - `src/shared/` structure

4. Configure lint rules
   - `eslint-plugin-boundaries` — forbid cross-feature imports
   - `stylelint` — forbid `!important`, max nesting depth 3
   - Tailwind v4 eslint plugin

5. Visual regression baseline
   - Playwright screenshots of 8-10 key pages
   - Store as comparison baseline

**Acceptance:** `pnpm dev` starts normally, all existing features work, new token system active, old CSS still loaded (coexistence period).

### Phase 1: App.css Decomposition (5-7 days)

Highest priority. Eliminate the 12K-line monolith.

**Content classification:**
- `.chat-*`, `.message-*` → `features/chat/styles/`
- `.note-*`, `.editor-*` → `features/notes/styles/`
- `.pdf-*`, `.reader-*` → `features/pdf/styles/`
- `.settings-*` → `features/settings/styles/`
- `.dashboard-*` → `features/learning-hub/styles/`
- Generic layout/utilities → `shared/styles/`
- Unclassifiable → `shared/styles/legacy.css` (marked TODO)

**Migration order (low risk → high risk):**
1. settings
2. todo / pomodoro
3. learning-hub / dashboard
4. notes / mindmap
5. pdf
6. chat (largest, last)

**Per-module process:**
1. Cut styles from App.css
2. Convert to `*.module.css` (add scope)
3. Simple styles (flex, spacing, colors) → convert to Tailwind classes directly
4. Complex styles (animations, pseudo-elements, deep nesting) → keep as CSS Module
5. Update component imports
6. Playwright screenshot comparison
7. One PR per module

**End state:** App.css deleted. Residual unclassified styles in `shared/styles/legacy.css` with TODO markers.

### Phase 2: DeepStudent.css Refactor (2-3 days)

After Phase 1 completes.

**Content classification:**
- Android/WebView compat fixes → `shared/styles/platform-compat.css` (stays global)
- Component protection styles (badge, checkbox anti-zoom) → into component CSS Modules
- Chat layout overrides → `features/chat/styles/layout.module.css`
- Third-party lib overrides → `shared/styles/vendor-overrides.css`

**Eliminate `!important`:**
- CSS Module scope naturally elevates specificity — most `!important` can be removed
- For vendor overrides: use `:where()` to lower lib specificity, or more specific selectors

**End state:** DeepStudent.css deleted.

### Phase 3: Directory Reorganization (3-4 days, parallelizable with Phase 1)

**Module moves:**
```
src/components/notes/              → src/features/notes/components/
src/components/mindmap/            → src/features/mindmap/components/
src/components/settings/           → src/features/settings/components/
src/components/todo/               → src/features/todo/components/
src/components/pomodoro/           → src/features/pomodoro/components/
src/components/pdf/                → src/features/pdf/components/
src/components/practice/           → src/features/practice/components/
src/components/skills-management/  → src/features/skills-management/components/
src/chat-v2/                       → src/features/chat/
src/command-palette/               → src/features/command-palette/
src/voice-input/                   → src/features/voice-input/
```

**Store moves:**
- `stores/notesTreeStore.ts` → `features/notes/stores/`
- `stores/pdfProcessingStore.ts` → `features/pdf/stores/`
- `stores/pdfSettingsStore.ts` → `features/pdf/stores/`
- `stores/questionBankStore.ts` → `features/practice/stores/`
- `stores/reviewPlanStore.ts` → `features/practice/stores/`
- `stores/templateAiStore.ts` → `features/template-management/stores/`
- `stores/notesTreeStore.ts` → `features/notes/stores/`
- Global stores remain: `src/stores/` (uiStore, networkStore, systemStatusStore, settingsShellStore)

**Hook moves:**
- Feature-specific hooks → corresponding `features/xxx/hooks/`
- Generic hooks (useBreakpoint, useTheme, useNetworkStatus) → `shared/hooks/`

**Each feature gets `index.ts` public API.**

**Update path aliases in tsconfig.json:**
```json
{
  "paths": {
    "@/features/*": ["src/features/*"],
    "@/shared/*": ["src/shared/*"],
    "@/tokens/*": ["src/tokens/*"],
    "@/lib/*": ["src/lib/*"],
    "@/stores/*": ["src/stores/*"],
    "@/config/*": ["src/config/*"]
  }
}
```

## Timeline

| Phase | Duration | Risk | Parallelizable |
|-------|----------|------|----------------|
| Phase 0 | 1-2 days | Low | — |
| Phase 1 | 5-7 days | Medium (visual regression) | Phase 3 |
| Phase 2 | 2-3 days | Medium | After Phase 1 |
| Phase 3 | 3-4 days | Low (file moves) | Phase 1 |

**Total: ~10-14 days** (single person, full-time)

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Visual regression during CSS migration | Playwright screenshot comparison per module |
| Tailwind v4 upgrade breaks existing classes | Run official codemod first, manual review |
| Import path breakage during directory moves | TypeScript compiler catches all broken imports |
| CSS Module specificity insufficient for vendor overrides | Use `:where()` on vendor CSS or layer ordering |
| Large PR review burden | One PR per module, keep atomic |

## Success Criteria

- [ ] App.css deleted (0 lines)
- [ ] DeepStudent.css deleted (0 lines)
- [ ] Zero `!important` in project CSS (enforced by stylelint)
- [ ] All features in `src/features/` with `index.ts` public API
- [ ] No cross-feature direct imports (enforced by eslint-plugin-boundaries)
- [ ] Tailwind v4 with `@theme` as sole token-to-utility bridge
- [ ] `pnpm dev` + `pnpm build` + `pnpm test` all pass
- [ ] Visual regression < 1px difference on key pages
