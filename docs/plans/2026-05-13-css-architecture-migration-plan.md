# CSS Architecture Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate from monolithic global CSS to Tailwind v4 + CSS Modules + feature-based directory structure.

**Architecture:** Tailwind v4 CSS-first config with `@theme` directive, semantic design tokens as CSS variables (3-layer: primitives → semantic → @theme), CSS Modules for complex component styles, feature-based directory organization with enforced boundaries.

**Tech Stack:** Tailwind CSS v4, @tailwindcss/vite, CSS Modules (Vite native), eslint-plugin-boundaries, stylelint

---

## Task 1: Upgrade Tailwind v3 → v4

**Files:**
- Remove: `tailwind.config.js`
- Remove: `postcss.config.js`
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/app/global.css`
- Modify: `src/styles/tailwind.css` (will be replaced by global.css)

**Step 1: Install Tailwind v4 packages**

Run:
```bash
pnpm remove tailwindcss postcss autoprefixer
pnpm add -D tailwindcss@4 @tailwindcss/vite
```

**Step 2: Update vite.config.ts**

Remove the PostCSS/Tailwind imports and `css.postcss` block. Add `@tailwindcss/vite` plugin:

```ts
import tailwindcss from "@tailwindcss/vite";

// In plugins array (before react()):
tailwindcss(),

// Remove entire css.postcss block:
// css: {
//   postcss: {
//     plugins: [tailwindcss(), autoprefixer()],
//   },
// },
```

**Step 3: Delete postcss.config.js**

Run: `rm postcss.config.js`

**Step 4: Run the official upgrade codemod**

Run:
```bash
npx @tailwindcss/upgrade
```

This will:
- Scan all source files for deprecated class names
- Migrate `tailwind.config.js` content into CSS `@theme` directives
- Update the CSS entry point

Review the output carefully. The codemod may create a new CSS file or modify existing ones.

**Step 5: Verify dev server starts**

Run: `pnpm dev`
Expected: Vite starts without errors on port 1422

**Step 6: Verify build succeeds**

Run: `pnpm build`
Expected: Build completes without CSS-related errors

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: upgrade Tailwind CSS v3 → v4 with @tailwindcss/vite"
```

---

## Task 2: Establish Token System

**Files:**
- Create: `src/tokens/primitives.css`
- Create: `src/tokens/semantic.css`
- Modify: `src/app/global.css` (or whatever the codemod produced as entry)
- Remove (eventually): `src/styles/shadcn-variables.css`
- Remove (eventually): `src/styles/theme-colors.css`

**Step 1: Create src/tokens/ directory**

Run: `mkdir -p src/tokens`

**Step 2: Create primitives.css**

Extract the raw color values from `shadcn-variables.css` (lines 96-171) into a clean primitives file:

```css
/* src/tokens/primitives.css */
/* Raw color palette — not consumed directly by components */

:root {
  /* Neutral grays (hue 0, pure neutral) */
  --gray-0: 0 0% 100%;
  --gray-50: 0 0% 99%;
  --gray-100: 0 0% 98%;
  --gray-150: 0 0% 96%;
  --gray-200: 0 0% 95%;
  --gray-300: 0 0% 94%;
  --gray-400: 0 0% 93%;
  --gray-500: 0 0% 88%;
  --gray-600: 220 6% 42%;
  --gray-700: 220 9% 18%;
  --gray-800: 0 0% 14%;
  --gray-850: 0 0% 12%;
  --gray-900: 0 0% 11%;
  --gray-925: 0 0% 9%;
  --gray-950: 0 0% 0%;

  /* Blue (default accent) */
  --blue-500: 217 70% 50%;
  --blue-600: 215 72% 42%;
  --blue-700: 215 72% 32%;
  --blue-light: 214 64% 72%;

  /* Red */
  --red-500: 0 65% 51%;
  --red-dark: 0 55% 45%;

  /* Green */
  --green-500: 152 60% 36%;
  --green-dark: 152 55% 42%;

  /* Amber/Warning */
  --amber-500: 38 70% 45%;
  --amber-dark: 38 65% 50%;

  /* Status */
  --status-idle: 220 8% 50%;
  --status-idle-dark: 220 6% 55%;
}

:root.dark {
  /* Dark mode primitives are handled via semantic remapping */
}
```

Note: The exact values should be extracted from the existing `shadcn-variables.css`. The above is a starting template — adjust HSL values to match current production appearance exactly.

**Step 3: Create semantic.css**

Map primitives to semantic tokens. Preserve all existing variable names that components currently reference (--background, --foreground, --primary, etc.) for backward compatibility:

```css
/* src/tokens/semantic.css */
/* Semantic tokens — consumed by components and @theme */

:root {
  /* Core surfaces */
  --background: var(--gray-0);
  --foreground: var(--gray-700);
  --card: var(--gray-50);
  --card-foreground: var(--gray-700);
  --popover: var(--gray-50);
  --popover-foreground: var(--gray-700);
  --secondary: var(--gray-100);
  --secondary-foreground: var(--gray-700);
  --muted: var(--gray-300);
  --muted-foreground: var(--gray-600);
  --accent: var(--gray-400);
  --accent-foreground: var(--gray-700);

  /* Borders & inputs */
  --border: var(--gray-500);
  --input: var(--gray-200);
  --ring: 214 62% 50%;

  /* Navigation */
  --titlebar-background: var(--gray-150);
  --nav-background: var(--gray-200);

  /* Destructive */
  --destructive: var(--red-500);
  --destructive-foreground: var(--gray-0);

  /* Status colors */
  --success: var(--green-500);
  --success-foreground: 0 0% 100%;
  --warning: var(--amber-500);
  --warning-foreground: 0 0% 100%;
  --info: var(--blue-500);
  --info-foreground: 0 0% 100%;
  --danger: 0 55% 50%;
  --danger-foreground: 0 0% 100%;

  /* Radius */
  --radius: 0.5rem;
  --radius-shell-panel: 18px;
  --radius-shell-toolbar: 16px;
  --radius-shell-row: 14px;
  --radius-shell-control: 12px;
  --radius-shell-window-control: 10px;
  --radius-shell-dialog: 22px;
}

:root.dark {
  --background: var(--gray-925);
  --foreground: 0 0% 96%;
  --card: var(--gray-850);
  --card-foreground: 0 0% 96%;
  --popover: var(--gray-850);
  --popover-foreground: 0 0% 96%;
  --secondary: var(--gray-800);
  --secondary-foreground: 0 0% 96%;
  --muted: var(--gray-800);
  --muted-foreground: 0 0% 60%;
  --accent: 0 0% 15%;
  --accent-foreground: 0 0% 96%;
  --border: 0 0% 18%;
  --input: var(--gray-800);
  --ring: 214 58% 68%;
  --titlebar-background: var(--gray-900);
  --nav-background: var(--gray-950);
  --destructive: var(--red-dark);
  --destructive-foreground: 0 0% 100%;
  --success: var(--green-dark);
  --warning: var(--amber-dark);
  --info: 217 65% 55%;
  --danger: 0 50% 48%;
}
```

**Step 4: Wire tokens into the Tailwind v4 entry CSS**

Update the main CSS entry (created/modified by the v4 codemod) to import tokens and expose via `@theme`:

```css
/* src/app/global.css (or the v4 entry file) */
@import "tailwindcss";
@import "../tokens/primitives.css";
@import "../tokens/semantic.css";

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-info: hsl(var(--info));
  --color-success: hsl(var(--success));
  --color-warning: hsl(var(--warning));
  --color-danger: hsl(var(--danger));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}
```

**Step 5: Update main.tsx or App.tsx import to use new entry**

Replace the CSS import chain in `src/App.tsx` (lines 47-56):

```ts
// Before:
import './styles/tailwind.css';
import './styles/shadcn-variables.css';
import './styles/theme-colors.css';

// After:
import './app/global.css';
```

Keep `shadcn-variables.css` and `theme-colors.css` imported temporarily (after global.css) for backward compat during migration. They will be removed once all tokens are migrated.

**Step 6: Verify dev server and visual appearance**

Run: `pnpm dev`
Expected: App renders identically to before. Check light/dark mode, accent palettes.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(tokens): establish 3-layer design token system with Tailwind v4 @theme"
```

---

## Task 3: Create Directory Skeleton

**Files:**
- Create directories only (no file moves yet)

**Step 1: Create feature directories**

Run:
```bash
mkdir -p src/features/chat/components src/features/chat/hooks src/features/chat/stores src/features/chat/styles
mkdir -p src/features/notes/components src/features/notes/hooks src/features/notes/stores src/features/notes/styles
mkdir -p src/features/learning-hub/components src/features/learning-hub/hooks src/features/learning-hub/stores src/features/learning-hub/styles
mkdir -p src/features/mindmap/components src/features/mindmap/hooks src/features/mindmap/stores src/features/mindmap/styles
mkdir -p src/features/pdf/components src/features/pdf/hooks src/features/pdf/stores src/features/pdf/styles
mkdir -p src/features/practice/components src/features/practice/hooks src/features/practice/stores src/features/practice/styles
mkdir -p src/features/settings/components src/features/settings/hooks src/features/settings/styles
mkdir -p src/features/template-management/components src/features/template-management/stores src/features/template-management/styles
mkdir -p src/features/skills-management/components src/features/skills-management/styles
mkdir -p src/features/todo/components src/features/todo/styles
mkdir -p src/features/pomodoro/components src/features/pomodoro/styles
mkdir -p src/features/command-palette/components src/features/command-palette/hooks src/features/command-palette/styles
mkdir -p src/features/voice-input/components src/features/voice-input/hooks
```

**Step 2: Create shared directories**

Run:
```bash
mkdir -p src/shared/ui
mkdir -p src/shared/components
mkdir -p src/shared/hooks
mkdir -p src/shared/utils
mkdir -p src/shared/styles
```

**Step 3: Create placeholder index files for features**

For each feature, create a minimal `index.ts`:

```ts
// src/features/chat/index.ts
// Public API for chat feature — exports will be added during migration
export {};
```

Repeat for all features.

**Step 4: Add .gitkeep to empty directories if needed**

Run: `find src/features src/shared -type d -empty -exec touch {}/.gitkeep \;`

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: create feature-based directory skeleton for CSS migration"
```

---

## Task 4: Configure Lint Rules

**Files:**
- Modify: `package.json` (add devDependencies)
- Create: `.stylelintrc.json`
- Modify: `eslint.config.js` or equivalent

**Step 1: Install lint packages**

Run:
```bash
pnpm add -D stylelint stylelint-config-standard eslint-plugin-boundaries
```

**Step 2: Create .stylelintrc.json**

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "declaration-no-important": true,
    "max-nesting-depth": 3,
    "selector-max-specificity": "0,4,2",
    "no-descending-specificity": null
  },
  "overrides": [
    {
      "files": ["src/shared/styles/platform-compat.css", "src/shared/styles/vendor-overrides.css"],
      "rules": {
        "declaration-no-important": null
      }
    }
  ]
}
```

**Step 3: Add eslint-plugin-boundaries configuration**

Add to ESLint config (the exact location depends on current eslint setup — check for `eslint.config.js` or `.eslintrc`):

```js
// In eslint config, add boundaries plugin and rules:
{
  plugins: ['boundaries'],
  settings: {
    'boundaries/elements': [
      { type: 'feature', pattern: 'src/features/*' },
      { type: 'shared', pattern: 'src/shared/*' },
      { type: 'app', pattern: 'src/app/*' },
      { type: 'tokens', pattern: 'src/tokens/*' },
      { type: 'lib', pattern: 'src/lib/*' },
    ],
    'boundaries/ignore': ['**/*.test.*', '**/*.spec.*'],
  },
  rules: {
    'boundaries/element-types': [
      'warn', // Start as warn, upgrade to error after migration
      {
        default: 'disallow',
        rules: [
          { from: 'feature', allow: ['shared', 'lib', 'tokens'] },
          { from: 'shared', allow: ['shared', 'lib', 'tokens'] },
          { from: 'app', allow: ['feature', 'shared', 'lib', 'tokens'] },
        ],
      },
    ],
  },
}
```

Note: Set to `warn` initially since existing code violates boundaries. Upgrade to `error` after migration is complete.

**Step 4: Add lint scripts to package.json**

```json
{
  "scripts": {
    "lint:css": "stylelint 'src/**/*.css' 'src/**/*.module.css'",
    "lint:css:fix": "stylelint 'src/**/*.css' 'src/**/*.module.css' --fix"
  }
}
```

**Step 5: Verify lint runs without crashing**

Run: `pnpm lint:css`
Expected: May report violations in existing code (that's fine — we'll fix during migration). Should not crash.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: add stylelint + eslint-plugin-boundaries for CSS architecture enforcement"
```

---

## Task 5: Visual Regression Baseline (Optional but Recommended)

**Files:**
- Create: `tests/visual/` directory
- Create: `tests/visual/baseline.spec.ts`

**Step 1: Create visual test directory**

Run: `mkdir -p tests/visual`

**Step 2: Create baseline screenshot script**

```ts
// tests/visual/baseline.spec.ts
import { test } from '@playwright/test';

const PAGES = [
  { name: 'chat', url: '/?view=chat-v2' },
  { name: 'settings', url: '/?view=settings' },
  { name: 'learning-hub', url: '/?view=learning-hub' },
  { name: 'notes', url: '/?view=notes' },
  { name: 'todo', url: '/?view=todo' },
];

for (const page of PAGES) {
  test(`baseline screenshot: ${page.name}`, async ({ page: p }) => {
    await p.goto(`http://localhost:1422${page.url}`);
    await p.waitForLoadState('networkidle');
    await p.screenshot({ path: `tests/visual/baseline-${page.name}.png`, fullPage: true });
  });
}
```

Note: This is a simplified template. The actual navigation mechanism depends on how the app handles view switching (it uses `currentView` state, not URL routing). Adjust the test to trigger view changes via the app's navigation mechanism.

**Step 3: Commit**

```bash
git add -A
git commit -m "test: add visual regression baseline screenshots for CSS migration"
```

---

## Task 6: Migrate Settings Feature (First Module — Low Risk)

**Files:**
- Move: `src/components/settings/` → `src/features/settings/components/`
- Move: `src/components/Settings.css` → `src/features/settings/styles/settings.module.css`
- Modify: All settings component imports
- Modify: `src/App.tsx` (update import paths)
- Modify: `src/features/settings/index.ts`

**Step 1: Move settings components**

Run:
```bash
mv src/components/settings/* src/features/settings/components/
mv src/components/Settings.css src/features/settings/styles/
```

**Step 2: Convert Settings.css to CSS Module**

Rename: `src/features/settings/styles/Settings.css` → `src/features/settings/styles/settings.module.css`

Review the file (757 lines). For each class:
- Simple layout/spacing/color → convert to Tailwind classes in the component
- Complex styles (multi-property, pseudo-elements, animations) → keep in module

Update component to import module:
```tsx
import styles from '../styles/settings.module.css';
// Use: className={styles.settingsPanel}
```

**Step 3: Update all import paths referencing settings components**

Search for: `from.*components/settings` and `from.*Settings.css`
Update to: `from '@/features/settings'` (via index.ts) or direct path

**Step 4: Create settings/index.ts public API**

```ts
// src/features/settings/index.ts
export { SettingsPage } from './components/SettingsPage';
// ... other public exports
```

**Step 5: Verify dev server**

Run: `pnpm dev`
Navigate to settings page. Verify visual appearance matches baseline.

**Step 6: Verify build**

Run: `pnpm build`
Expected: No errors

**Step 7: Commit**

```bash
git add -A
git commit -m "refactor(settings): migrate to features/ with CSS Modules"
```

---

## Task 7-11: Migrate Remaining Small Modules

Repeat Task 6 pattern for each module in order:

- **Task 7:** todo + pomodoro (small, independent)
- **Task 8:** learning-hub / dashboard
- **Task 9:** notes + mindmap
- **Task 10:** pdf
- **Task 11:** chat (largest — do last)

Each task follows the same pattern:
1. Move files to `src/features/<name>/`
2. Convert co-located CSS to CSS Modules
3. Convert simple styles to Tailwind
4. Update imports
5. Create `index.ts` public API
6. Verify visually
7. Commit atomically

---

## Task 12: Decompose App.css

**Files:**
- Modify: `src/App.css` (12K lines → 0)
- Create: Multiple `*.module.css` files in feature directories
- Create: `src/shared/styles/legacy.css` (temporary, for unclassifiable styles)

**Step 1: Analyze App.css content by selector prefix**

Use grep to categorize:
```bash
grep -n '^\.' src/App.css | head -200
```

Group selectors by feature domain based on class name prefixes.

**Step 2: Extract feature-specific styles**

For each feature (chat, notes, pdf, etc.):
1. Cut relevant selectors from App.css
2. Place into `src/features/<name>/styles/<name>.module.css`
3. Update component to import the module
4. Remove `!important` where CSS Module scope makes it unnecessary

**Step 3: Extract shared/generic styles**

Styles that don't belong to any feature:
- Layout utilities → convert to Tailwind or `src/shared/styles/layout.css`
- Animation keyframes → `src/shared/styles/animations.css`
- Scrollbar styles → `src/shared/styles/scrollbar.css`

**Step 4: Remaining unclassifiable styles**

Place in `src/shared/styles/legacy.css` with TODO comments:
```css
/* TODO: Identify owner and migrate to feature module */
.some-orphan-class { ... }
```

**Step 5: Remove App.css import from App.tsx**

Replace with feature-specific imports (already done in Tasks 6-11) and shared imports.

**Step 6: Verify**

Run: `pnpm dev` + `pnpm build`
Check all pages visually.

**Step 7: Commit**

```bash
git add -A
git commit -m "refactor: decompose App.css into feature CSS Modules (12K lines eliminated)"
```

---

## Task 13: Decompose DeepStudent.css

**Files:**
- Remove: `src/DeepStudent.css` (2998 lines → 0)
- Create: `src/shared/styles/platform-compat.css`
- Create: `src/shared/styles/vendor-overrides.css`
- Modify: Feature CSS Modules (absorb relevant overrides)

**Step 1: Classify DeepStudent.css content**

- Lines 1-~500: Android/WebView compat → `shared/styles/platform-compat.css` (stays global)
- Chat layout overrides → `features/chat/styles/layout.module.css`
- Component protection (badges, checkboxes) → into respective component CSS Modules
- Third-party lib overrides → `shared/styles/vendor-overrides.css`

**Step 2: Move platform compat styles**

These legitimately need global scope (they target platform-specific behaviors):
```css
/* src/shared/styles/platform-compat.css */
/* Android WebView compatibility — must remain global */
```

**Step 3: Eliminate !important**

For each `!important` declaration:
- If now in a CSS Module → remove (module scope provides sufficient specificity)
- If targeting a vendor lib → use `:where()` to lower vendor specificity instead
- If truly unavoidable → document why in a comment

**Step 4: Remove DeepStudent.css import from App.tsx**

**Step 5: Verify**

Run: `pnpm dev` + `pnpm build`
Test on mobile viewport sizes (the compat styles are critical for mobile).

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: decompose DeepStudent.css — eliminate !important, scope overrides"
```

---

## Task 14: Migrate Shared UI Components

**Files:**
- Move: `src/components/ui/` → `src/shared/ui/`
- Move: `src/components/shared/` → `src/shared/components/`
- Update: All imports across the codebase

**Step 1: Move UI primitives**

Run:
```bash
mv src/components/ui/* src/shared/ui/
mv src/components/shared/* src/shared/components/
```

**Step 2: Update tsconfig paths**

Ensure `@/shared/*` resolves correctly (already configured in tsconfig from design doc).

**Step 3: Bulk update imports**

Use find-and-replace across codebase:
- `@/components/ui/` → `@/shared/ui/`
- `@/components/shared/` → `@/shared/components/`

**Step 4: Verify**

Run: `pnpm typecheck && pnpm build`

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move shared UI components to src/shared/"
```

---

## Task 15: Migrate Global Stores and Hooks

**Files:**
- Move feature-specific stores to their features
- Move feature-specific hooks to their features
- Keep global stores in `src/stores/`
- Move generic hooks to `src/shared/hooks/`

**Step 1: Move feature-specific stores**

```bash
mv src/stores/notesTreeStore.ts src/features/notes/stores/
mv src/stores/pdfProcessingStore.ts src/features/pdf/stores/
mv src/stores/pdfSettingsStore.ts src/features/pdf/stores/
mv src/stores/questionBankStore.ts src/features/practice/stores/
mv src/stores/reviewPlanStore.ts src/features/practice/stores/
mv src/stores/templateAiStore.ts src/features/template-management/stores/
```

**Step 2: Move generic hooks to shared**

```bash
mv src/hooks/useBreakpoint.ts src/shared/hooks/
mv src/hooks/useTheme.ts src/shared/hooks/
mv src/hooks/useNetworkStatus.ts src/shared/hooks/
```

Move feature-specific hooks to their respective features.

**Step 3: Update all imports**

**Step 4: Verify**

Run: `pnpm typecheck && pnpm build`

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: relocate stores and hooks to feature/shared boundaries"
```

---

## Task 16: Remove Legacy CSS Files

**Files:**
- Remove: `src/styles/shadcn-variables.css` (merged into tokens/)
- Remove: `src/styles/theme-colors.css` (merged into tokens/)
- Remove: `src/styles/tailwind.css` (replaced by global.css)
- Remove: `src/App.css` (decomposed)
- Remove: `src/DeepStudent.css` (decomposed)
- Modify: `src/App.tsx` (clean up imports)

**Step 1: Remove old CSS imports from App.tsx**

The import section should now only have:
```ts
import './app/global.css';
import 'overlayscrollbars/overlayscrollbars.css';
```

All other styles are imported by their respective feature/shared modules.

**Step 2: Delete legacy files**

```bash
rm src/styles/shadcn-variables.css
rm src/styles/theme-colors.css
rm src/styles/tailwind.css
rm src/App.css
rm src/DeepStudent.css
```

**Step 3: Verify**

Run: `pnpm dev` + `pnpm build` + visual check all pages

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove legacy monolithic CSS files (App.css, DeepStudent.css, etc.)"
```

---

## Task 17: Upgrade Boundary Rules to Error

**Files:**
- Modify: ESLint config

**Step 1: Change boundaries rule from warn to error**

```js
'boundaries/element-types': ['error', { ... }]
```

**Step 2: Fix any remaining violations**

Run: `pnpm lint`
Fix all boundary violations.

**Step 3: Verify**

Run: `pnpm lint && pnpm build`

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: enforce feature boundary rules as errors"
```

---

## Task 18: Final Verification

**Step 1: Full build**

Run: `pnpm typecheck && pnpm build`

**Step 2: Run tests**

Run: `pnpm test`

**Step 3: Lint**

Run: `pnpm lint && pnpm lint:css`

**Step 4: Visual check**

Compare key pages against baseline screenshots.

**Step 5: Verify success criteria**

- [ ] App.css deleted (0 lines)
- [ ] DeepStudent.css deleted (0 lines)
- [ ] Zero `!important` in project CSS (except platform-compat and vendor-overrides)
- [ ] All features in `src/features/` with `index.ts` public API
- [ ] No cross-feature direct imports (enforced by eslint)
- [ ] Tailwind v4 with `@theme` as sole token-to-utility bridge
- [ ] `pnpm dev` + `pnpm build` + `pnpm test` all pass

**Step 6: Final commit (if any remaining changes)**

```bash
git add -A
git commit -m "chore: CSS architecture migration complete — all success criteria met"
```
