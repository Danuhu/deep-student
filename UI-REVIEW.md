# Deep Student -- UI Review

**Audited:** 2026-05-01
**Baseline:** Abstract 6-pillar UX best practices (no UI-SPEC.md exists)
**Screenshots:** Not captured (no dev server running; code-only audit)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | 20+ hardcoded Chinese strings, missing i18n keys, generic error messages |
| 2. Visuals | 2/4 | Duplicate design systems (src/ vs study-ui/), inconsistent component implementations, 15K lines of CSS |
| 3. Color | 1/4 | Dark mode broken in Settings, ModernSidebar, ChatV2Page; 100+ hardcoded hex values despite robust token system; 754 accent overuses |
| 4. Typography | 2/4 | 8+ font sizes and 5+ font weights in use; no enforced scale despite defined semantic tokens |
| 5. Spacing | 2/4 | 200+ arbitrary px/rem values; spacing tokens exist but unused in component code |
| 6. Experience Design | 2/4 | Good ErrorBoundary and skeleton patterns but silent error swallowing, no URL routing, 2.3K-line monolithic App.tsx, 12K-line CSS file |

**Overall: 11/24**

---

## Top 3 Priority Fixes

1. **Dark mode is broken across 4+ major components** -- Settings, ModernSidebar, ChatV2Page, and LearningHubSidebar have zero `dark:` Tailwind classes, rendering them unusable in dark mode. The mobile settings sheet (`App.tsx:2210`) uses hardcoded `#FFFFFF`/`#111111` colors that ignore the theme entirely. Additionally, 100+ hardcoded hex values across the codebase bypass the theme system. **Fix:** Audit all hardcoded colors against theme-colors.css tokens. Add `dark:` variants to Settings, ModernSidebar, and ChatV2Page. Add ESLint rule blocking `#` and `rgb(` in TSX files.

2. **Duplicate design systems creating maintenance debt** -- `src/components/ui/shad/` (30 components, Tailwind 3, HSL, React 18) and `study-ui/src/components/ui/` (18 components, Tailwind 4, oklch, React 19) are completely independent implementations. Buttons differ (NotionButton vs Radix Slot+CVA), icon libraries differ (Lucide vs Phosphor), token systems differ. Every UI change potentially needs to be made twice. **Fix:** Define a formal migration roadmap. The `study-ui/` shell (AppChrome.tsx at 606 lines, app.css at 464 lines) demonstrates the target architecture. Prioritize migrating shell components first.

3. **Monolithic files creating performance and maintainability issues** -- `App.css` (11,990 lines, ~240KB), `DeepStudent.css` (2,998 lines), `TauriAdapter.ts` (4,031 lines), `InputBarUI.tsx` (2,869 lines), `App.tsx` (2,306 lines). Single-component bottlenecks that couple routing, state, layout, theming, and content rendering. **Fix:** Decompose App.tsx into AppShell (titlebar+sidebar+layout), AppRouter (view management), and AppProviders (theme/i18n/store wrapping). Split InputBarUI.tsx into focused sub-components. Break App.css into feature-scoped modules.

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

**P0 -- Hardcoded Chinese strings (no i18n):**

| Location | Issue |
|----------|-------|
| `src/chat-v2/plugins/blocks/paperSave.tsx:43-73` | `STAGE_LABELS` object with 8 hardcoded Chinese stage names (`'下载中'`, `'去重'`, `'存储'`, `'处理'`, `'索引'`, etc.) |
| `src/chat-v2/plugins/blocks/paperSave.tsx:235` | `title={retryError ?? undefined}>重试失败` -- hardcoded error message |
| `src/chat-v2/plugins/blocks/paperSave.tsx:64` | 8 stage label entries defined as component-level constants, not i18n keys |
| `src/App.tsx:258` | `aria-label={downloading ? '下载中...' : '点击更新'}` -- not i18n-ized |
| `src/App.tsx:260` | `{downloading ? '下载中' : '更新'}` -- button text hardcoded |
| `src/chat-v2/components/input-bar/InputBarUI.tsx:1034` | `const studyUiSendButtonAriaLabel = '发送消息';` -- hardcoded, no `t()` wrapper |

**P0 -- Missing i18n keys:**
- 3 keys in `common.json` exist in en-US but missing from zh-CN (`data_stats`, `siliconflow`, `status_options`)
- 1 key in `notes.json` exists in en-US but missing from zh-CN (`editor.buttons`)

**P1 -- Generic error messages:**
- 6 instances of `"Unknown error"` as catch-all across `chatV2.json`, `learningHub.json`, `common.json`, `anki.json`, `template.json` -- users get no actionable guidance when errors occur

**P1 -- Hardcoded English fallback text:**
- `src/App.tsx:1947` -- `Loading...` (not i18n-ized)
- `src/lazyComponents.tsx:32` -- `<div>{t('loading')}</div>` adequate but could be contextualized per view

---

### Pillar 2: Visuals (2/4)

**P0 -- Duplicate design systems:**
- `src/components/ui/shad/` -- 30 shadcn components (Alert, Badge, Breadcrumb, Button, Card, Checkbox, Collapsible, Combobox, Command, Dialog, Input, Label, Popover, Progress, ScrollArea, Separator, Sheet, Skeleton, Slider, Switch, Table, Tabs, TagInput, Textarea, Tooltip)
- `study-ui/src/components/ui/` -- 18 components (button, card, dialog, dropdown-menu, input, sheet, surface, switch, tabs, textarea, tooltip)
- Different implementations: NotionButton vs Radix Slot+CVA button, different CSS variable systems (HSL vs oklch), different Tailwind versions (3.4 vs 4.1)

**P1 -- View layer rendering approach:**
- `src/app/components/ViewLayerRenderer.tsx` uses `visibility: hidden` + `contentVisibility: hidden` for inactive views -- functional but prevents proper URL-based navigation and deep linking
- All views remain mounted in DOM, increasing memory footprint
- Navigation is purely state-driven with no URL-based routing, preventing deep linking and browser back/forward support

**P1 -- Inconsistent icon libraries:**
- Main app uses `lucide-react` (Feather-style)
- study-ui uses `@phosphor-icons/react` (Phosphor-style)
- Both libraries coexist in the codebase -- two different visual styles mixed in the same UI

**P1 -- CSS bloat:**
- `src/App.css`: 11,990 lines
- `src/DeepStudent.css`: 2,998 lines
- Combined 14,988 lines of CSS with unclear organization and overlapping concerns
- 12 separate CSS files imported in `App.tsx` in specific order, risking specificity wars

**P2 -- Accessibility attributes spread thin:**
- 826 ARIA usages across `src/` sounds adequate, but distributed across ~230 components and 42 CSS files
- Many interactive elements likely lack proper labeling
- `study-ui/` has 77 ARIA usages -- more focused and intentional for the shell scope

**Good patterns:**
- Shell design in `study-ui/` uses proper surface layering (`--surface-nav`, `--surface-root`, `--surface-elevated`)
- Lucide and Phosphor icons are each used consistently within their respective systems
- `CustomScrollArea` component provides consistent scrolling behavior

---

### Pillar 3: Color (1/4)

**P0 -- Dark mode completely missing from major components:**

| Component | `dark:` classes found | Status |
|-----------|----------------------|--------|
| `Settings.tsx` | 0 | Unusable in dark mode |
| `ModernSidebar.tsx` | 0 | Unusable in dark mode |
| `ChatV2Page.tsx` | 0 | Unusable in dark mode |
| `LearningHubSidebar.tsx` | 0 | Unusable in dark mode |
| `InputBarUI.tsx` | 9 | Partial support |

**P0 -- Mobile settings sheet has hardcoded colors (no dark mode, no tokens):**
`src/App.tsx:2210-2227` contains a massive hardcoded style block:
- `bg-[#FFFFFF]`, `text-[#111111]`, `border-[#E0E3EA]`, `shadow-[0_-12px_34px_rgba(17,17,17,0.10)]`
- `bg-[#C9CDD6]`, `text-[#6E737D]`, `text-[#5F636D]`
- `hover:bg-[#F1F3F6]`, `hover:text-[#111111]`, `focus-visible:ring-[#6AA5FF]`

These values ignore the `theme-colors.css` token system entirely and will never adapt to dark mode or theme palette changes.

**P0 -- Hardcoded colors in production components:**

| File | Lines | Colors |
|------|-------|--------|
| `src/components/Settings.tsx` | 926-1003 | 12 hardcoded hex values: `#FFFFFF`, `#111111`, `#ECEEF3`, `#EEF0F4`, `#6E737D`, `#5F636D`, `#F6F7FA` |
| `src/components/DataImportExport.tsx` | 1612-1621 | `#f1f5f9`, `#cbd5e1` |
| `src/main.tsx` | 268-345 | 20 hardcoded values: `#fafafa`, `#1a1a1a`, `#2563eb`, `#f5f5f5`, `#d32f2f`, `#16a34a`, `#333`, `#666` |
| `src/components/LoadingScreen.tsx` | 186-187 | `#3b82f6`, `#1d4ed8` gradient stops |
| `src/chat-v2/components/renderers/CodeBlock.tsx` | 372 | `background:#fff;color:#111` |

**P1 -- Accent color overuse:**
- 754 uses of `text-primary`, `bg-primary`, `border-primary` in `src/`
- Compare: only 16 uses in `study-ui/`
- Accent should appear on ~10-15 interactive elements; 754 indicates decoration is being confused with interaction emphasis

**Good patterns:**
- `src/styles/theme-colors.css` (766 lines) -- exceptionally thorough token system with semantic surface tokens, desktop shell tokens, button variant tokens, brand palette, status tokens, and full dark mode support
- `src/styles/shadcn-variables.css` -- HSL variable definitions for 8 theme palettes (blue, purple, green, orange, pink, teal, muted, paper)
- `study-ui/src/styles/app.css` -- clean Tailwind 4 CSS variable approach with oklch color space

---

### Pillar 4: Typography (2/4)

**P1 -- No enforced typography scale despite defined tokens:**

| Font Size | Status |
|-----------|--------|
| `text-xs` | In use |
| `text-sm` | Dominates (appears most frequently by far) |
| `text-base` | In use |
| `text-lg` | In use |
| `text-xl` | In use |
| `text-2xl` | In use |
| `text-3xl` | In use |
| `text-4xl` | In use |
| `text-5xl` | In use |

9 distinct font sizes in use. Best practice for a single-purpose desktop app is 4-5 sizes with a clear hierarchy.

**P1 -- 5+ font weights in use:**

| Weight | Usage Pattern |
|--------|---------------|
| `font-light` | Rare, inconsistent |
| `font-normal` | Body text |
| `font-medium` | Overwhelmingly dominant |
| `font-semibold` | Emphasis, headings |
| `font-bold` | Strong emphasis |

**P1 -- Arbitrary font sizes bypassing the scale:**
- `text-[10px]` in `workspaceStatus.tsx`, `ankiCardsBlock.tsx`
- `text-[13px]` in `App.tsx:2220`
- `text-[15px]` in `content.tsx:61-62`
- `text-[18px]` in `App.tsx:2217`

**Good patterns:**
- `src/styles/shadcn-variables.css` defines proper semantic typography tokens: `--font-size-xs` through `--font-size-3xl`, weights from `--font-weight-normal` through `--font-weight-bold`, and line-heights
- CSS variable-based font family: `--font-family`, `--font-family-cn`, `--font-mono`
- `study-ui/src/styles/app.css` uses Tailwind 4's fluid type scale

---

### Pillar 5: Spacing (2/4)

**P1 -- 200+ arbitrary px/rem values:**

Top offenders in `src/App.tsx`:
- `h-[min(86dvh,calc(100dvh-0.5rem))]`, `max-h-[calc(100dvh-0.5rem)]`, `rounded-t-[24px]`
- `max-w-[150px]`, `max-w-[100px]`, `max-w-[560px]`
- `min-h-[200px]`, `h-[450px]`, `h-[250px]`, `h-[600px]`, `min-h-[60px]`
- `size-[18px]`, `w-[3.125rem]`
- `shadow-[0_-12px_34px_rgba(17,17,17,0.10)]`

In `src/chat-v2/`:
- `text-[10px]` on 15+ elements in `workspaceStatus.tsx`
- `max-w-[200px]`, `max-w-[100px]`, `max-w-[300px]`, `max-w-[150px]`
- `min-h-[200px]`, `h-[450px]`, `h-[600px]`, `h-[300px]`

**P1 -- Chaotic spacing class distribution:**
The top 30 most-used spacing classes show inconsistent gap values (gap-85 through gap-405 with no clustering around standard scale values like 4, 8, 12, 16, 20, 24). This indicates no vertical rhythm standard.

**P1 -- Two separate spacing systems:**
- Main app uses Tailwind 3.x spacing scale
- study-ui uses Tailwind 4.x spacing (different default scale)
- `src/styles/shadcn-variables.css` defines spacing tokens (`--space-shell-layout-gap: 14px`, `--space-shell-section-gap: 18px`) but these go unused in component code

**Good patterns:**
- CSS variables for shell layout: `--shell-navigation-width`, `--shell-titlebar-height`, `--topbar-safe-area`
- `study-ui/` components use consistent, token-based spacing

---

### Pillar 6: Experience Design (2/4)

**P0 -- Silent error swallowing in production:**
- `src/App.tsx` -- 10 catch blocks, most only `console.warn`/`console.error` with no user-facing notification
- `src/App.tsx:526` -- `catch (err)` on maintenance status query silently ignores failure
- `src/App.tsx:1448` -- `catch (error)` on WebView settings persistence logs but doesn't retry or notify
- Users may experience silent failures with no indication anything went wrong

**P0 -- Giant monolithic files:**

| File | Lines | Issue |
|------|-------|-------|
| `src/App.css` | 11,990 | 12K lines of CSS, impossible to audit or tree-shake |
| `src/DeepStudent.css` | 2,998 | Overlaps with App.css, unclear delineation |
| `src/chat-v2/adapters/TauriAdapter.ts` | 4,031 | Single adapter with 4K lines |
| `src/chat-v2/components/input-bar/InputBarUI.tsx` | 2,869 | Input component nearly 3K lines |
| `src/App.tsx` | 2,306 | Main app component 2.3K lines |

**P1 -- No URL-based routing:**
- Navigation is purely state-driven (`currentView` + CSS visibility toggling)
- No browser back/forward button support without custom `useNavigationHistory` hook
- No deep linking to specific sessions, resources, or settings tabs
- Cannot share links to specific content

**P1 -- Responsive behavior inconsistencies:**
- 774 responsive breakpoint usages found but no systematic mobile/desktop/tablet test documentation
- Mobile layout is handled ad-hoc across components (MobileLayoutProvider, UnifiedMobileHeader, MobileSlidingLayout)
- `study-ui/` shell has proper platform detection (`DesktopPlatform`, responsive environment) but no content features migrated yet

**P1 -- Loading state inconsistency:**
- `src/main.tsx` uses inline-styled loading screen with hardcoded colors
- `PageLoadingFallback` from `src/lazyComponents.tsx` uses different styling
- Chat system uses `ChatSkeleton` with hardcoded widths
- `NoTagTreeShadPanel` uses shadcn `Skeleton` component (most consistent approach)
- No shared skeleton/loading pattern enforced across views

**Good patterns:**
- ErrorBoundary wrapping at top level in `src/main.tsx:358` with i18n-aware fallback UI, copy-to-clipboard for error logs
- ChatContainer has skeleton layout (`ChatSkeleton` component at line 163)
- Disabled states on 1231 elements -- buttons, inputs, actions
- Destructive action confirmation patterns (actionLockRef on Anki save/export)
- Proper error state styling with `text-destructive` / `bg-destructive` usage
- Empty state handling: `isEmptyContent` checks in MessageItem, `forceEmptyPreview` in ChatContainer, empty list detection in DialogControl

---

## Accessibility Findings

**P0 -- Missing alt text on images:**
- Multiple `<img>` and `<Image>` elements without `alt` attributes in learning-hub and notes components

**P1 -- Keyboard navigation gaps:**
- Custom `role="button"` elements on header hotzones have keyboard handlers but no `aria-pressed` or `aria-expanded` states
- `ModernSidebar` session list items lack `aria-current` when active

**P1 -- Focus management inconsistency:**
- `focus-visible:ring` present on some elements but inconsistent across components
- Mobile settings sheet close button has `focus-visible:ring-2` but many other interactive elements do not

---

## Architecture Notes

**P0 -- Tailwind config isolation:**
- `tailwind.config.js` content paths only include `./src/**/*.{ts,tsx,js,jsx}`
- study-ui has its own Tailwind 4 config via `@tailwindcss/vite` plugin
- Classes from study-ui are NOT available in the main app and vice versa
- This means migration requires full component replacement, not gradual adoption

**P1 -- Registry safety:**
- `study-ui/components.json` uses only official shadcn registry (`https://ui.shadcn.com/schema.json`)
- No third-party registries configured -- clean audit

**P1 -- Event listener hygiene is good:**
- 17 `addEventListener` calls, 17 matching `removeEventListener` calls in cleanup

---

## Two-System Comparison

| Metric | src/ (legacy) | study-ui/ (target) |
|--------|---------------|---------------------|
| App shell lines | 2,306 (App.tsx) | 606 (AppChrome.tsx) |
| Main CSS lines | 11,990 + 2,998 | 464 (app.css) |
| Accent color usages | 754 | 16 |
| Hardcoded hex colors | 100+ | 8 (in app.css config only) |
| Arbitrary spacing values | 200+ | 26 |
| ARIA attributes | 826 (spread thin) | 77 (focused on shell) |
| Font sizes in use | 9 | 5 (controlled by Tailwind 4) |
| React version | 18 | 19 |
| Tailwind version | 3 | 4 |
| Icon library | Lucide | Phosphor |
| Design token approach | Token files exist but bypassed | Tokens are the source of truth |

---

## Summary: P0 Issues (Must Fix)

| # | Issue | Impact | Files |
|---|-------|--------|-------|
| 1 | Dark mode broken in Settings | Settings unusable in dark mode | `Settings.tsx` |
| 2 | Dark mode broken in ModernSidebar | Navigation unusable in dark mode | `ModernSidebar.tsx` |
| 3 | Dark mode broken in ChatV2Page | Main feature unusable in dark mode | `ChatV2Page.tsx` |
| 4 | Dark mode broken in LearningHubSidebar | Learning hub unusable in dark mode | `LearningHubSidebar.tsx` |
| 5 | Mobile settings sheet hardcoded colors | No dark mode or theme support | `App.tsx:2203-2236` |
| 6 | Hardcoded Chinese strings (no i18n) | zh-CN users see mixed languages | `paperSave.tsx`, `SessionSidebarContent.tsx`, `InputBarUI.tsx` |
| 7 | Missing i18n keys | Translation gaps in zh-CN | `common.json`, `notes.json` |
| 8 | Silent error swallowing (10 catch blocks) | Users not informed of failures | `App.tsx` |

## Summary: P1 Issues (Should Fix)

| # | Issue | Impact | Files |
|---|-------|--------|-------|
| 1 | Duplicate design systems | Double maintenance, inconsistent UX | `src/components/ui/shad/` + `study-ui/src/components/ui/` |
| 2 | 12K-line App.css | Performance, maintainability | `src/App.css` |
| 3 | 4K-line TauriAdapter | Debugging difficulty | `src/chat-v2/adapters/TauriAdapter.ts` |
| 4 | 2.9K-line InputBarUI.tsx | Single component too large | `src/chat-v2/components/input-bar/InputBarUI.tsx` |
| 5 | No URL routing | No deep linking, poor shareability | `src/App.tsx` |
| 6 | 200+ arbitrary spacing values | Inconsistent spacing | Throughout `src/` |
| 7 | 754 accent color overuses | Visual noise, unclear hierarchy | Throughout `src/` |
| 8 | "Unknown error" catch-all messages | Poor error UX | 5 locale JSON files |
| 9 | Missing alt text on images | Accessibility violations | learning-hub, notes components |
| 10 | Two icon libraries mixed | Visual inconsistency | lucide-react + phosphor-icons |

---

## Registry Safety

The `study-ui/components.json` uses only the official shadcn registry (`https://ui.shadcn.com/schema.json`). No third-party registries are configured. Registry audit is clean -- no flags.

---

## Files Audited

- `src/App.tsx` (2,306 lines)
- `src/App.css` (11,990 lines)
- `src/DeepStudent.css` (2,998 lines)
- `src/main.tsx`
- `src/components/ModernSidebar.tsx`
- `src/components/Settings.tsx` (1,799 lines)
- `src/components/ErrorBoundary.tsx`
- `src/components/LoadingScreen.tsx`
- `src/components/DataImportExport.tsx`
- `src/components/NoTagTreeShadPanel.tsx`
- `src/styles/theme-colors.css`
- `src/styles/shadcn-variables.css`
- `src/styles/typography.css`
- `src/styles/thinking-scrollbar.css`
- `src/styles/notion-animations.css`
- `src/styles/ios-safe-area.css`
- `src/styles/responsive-utilities.css`
- `src/styles/modern-buttons.css`
- `src/styles/shadcn-overrides.css`
- `src/chat-v2/adapters/TauriAdapter.ts` (4,031 lines)
- `src/chat-v2/components/ChatContainer.tsx`
- `src/chat-v2/components/input-bar/InputBarUI.tsx` (2,869 lines)
- `src/chat-v2/components/MessageItem.tsx`
- `src/chat-v2/pages/ChatV2Page.tsx`
- `src/chat-v2/pages/SessionSidebarContent.tsx`
- `src/chat-v2/pages/useSessionLifecycle.ts`
- `src/chat-v2/pages/useChatPageLayout.tsx`
- `src/chat-v2/plugins/blocks/paperSave.tsx`
- `src/chat-v2/plugins/blocks/ankiCardsBlock.tsx`
- `src/chat-v2/plugins/blocks/workspaceStatus.tsx`
- `src/chat-v2/plugins/blocks/mcpTool.tsx`
- `src/chat-v2/plugins/blocks/components/ChatAnkiProgressCompact.tsx`
- `src/chat-v2/plugins/chat/SearchPanel.tsx`
- `src/chat-v2/plugins/chat/MultiSelectModelPanel.tsx`
- `src/chat-v2/workspace/components/SubagentContainer.tsx`
- `src/chat-v2/workspace/components/WorkspaceLogInline.tsx`
- `src/chat-v2/workspace/components/AgentCard.tsx`
- `src/chat-v2/components/renderers/CodeBlock.tsx`
- `src/chat-v2/components/panels/UnifiedSourcePanel.tsx`
- `src/app/components/ViewLayerRenderer.tsx`
- `src/components/learning-hub/LearningHubSidebar.tsx` (2,796 lines)
- `src/components/QuestionBankEditor.tsx`
- `src/translation/TranslationStreamRenderer.tsx`
- `src/lazyComponents.tsx`
- `src/contexts/DialogControlContext.tsx`
- `src/locales/en-US/` (42 JSON files)
- `src/locales/zh-CN/` (42 JSON files)
- `tailwind.config.js`
- `study-ui/src/components/shell/AppChrome.tsx` (606 lines)
- `study-ui/src/components/shell/Sidebar.tsx` (411 lines)
- `study-ui/src/components/shell/Titlebar.tsx`
- `study-ui/src/components/shell/WindowControls.tsx`
- `study-ui/src/components/shell/ShellButton.tsx`
- `study-ui/src/components/ui/button.tsx`
- `study-ui/src/components/ui/sheet.tsx`
- `study-ui/src/styles/app.css` (464 lines)
- `study-ui/components.json`

---

## Additional Findings from Parallel Deep-Dive Agents

These were identified by specialized sub-agents (CSS/token, a11y/error, i18n/copywriting) and complement the 6-pillar audit above.

### P0 — Keyboard accessibility: session actions are mouse-only
`src/components/ModernSidebar.tsx:745,767,782` — Three `<span role="button">` elements with `tabIndex={-1}` for pin/unpin/archive actions. Only visible on hover. Keyboard-only users cannot access session management. **Fix:** Change to `<button>`, remove `tabIndex={-1}`, add keyboard handlers.

### P0 — Crash recovery screen invisible in dark mode
`src/main.tsx:268-345` — `TopLevelFallback` uses 12+ hardcoded hex values (`#fafafa`, `#1a1a1a`, `#2563eb`, `#fff`). In dark mode, dark text on dark backgrounds makes the crash screen unreadable. **Fix:** Use theme CSS variables.

### P0 — Global store boot failure swallowed silently
`src/main.tsx:590-595` — `registerAllStores().catch()` logs only. If store registration fails, the app breaks with no user-facing fallback. MCP silently fails at `src/main.tsx:392` with zero error UI. **Fix:** Add a critical error boundary for core initialization failures.

### P0 — Design token format collision between the two systems
`study-ui/src/styles/app.css` uses direct values (`--background: #FFFFFF`, `--primary: oklch(...)`) while `src/styles/shadcn-variables.css` uses HSL triplets (`--background: 0 0% 100%`). When both load, the cascade silently overwrites. Components using `hsl(var(--primary))` break if study-ui's values win. **Fix:** Namespace study-ui tokens (e.g., `--sui-background`) until migration completes.

### P1 — Inconsistent mobile breakpoints cause layout mismatch
`src/hooks/useBreakpoint.ts` — `isSmallScreen` uses `< 768px` for shell, chat panels use `isMobile` at `< 640px`. Between 640-768px, the shell renders desktop layout but panels render mobile variants. `src/config/breakpoints.ts:31` hardcodes `639` instead of referencing `BREAKPOINTS.sm`. **Fix:** Standardize to `< 768px` (md) everywhere.

### P1 — Dead CSS code
- `.desktop-shell-*` in `src/App.css` (39 refs): zero TSX usage
- `src/styles/notion-animations.css` (452 lines): never imported
- `src/styles/thinking-scrollbar.css`: never imported
**Fix:** Remove dead files and class blocks.

### P1 — 30+ duplicate CSS selectors between App.css and DeepStudent.css
`.app`, `.chat-container`, `.content-body`, `.left-panel`, `.btn-primary`, `.btn-secondary`, `.action-buttons`, `.analysis-layout`, `.content-header`, `.back-button`, `.edit-modal` and ~20 more appear in both files. Style depends on load order. **Fix:** Consolidate, remove duplicates.

### P1 — Non-interactive role="button" elements lack keyboard handlers
- `src/components/settings/SiliconFlowSection.tsx:935-936` — `role="button"` + `tabIndex={0}`, no `onKeyDown`
- `src/components/notes/NotesTabsBar.tsx:86-87` — same pattern
**Fix:** Use `<button>` elements or add keyboard handlers.
