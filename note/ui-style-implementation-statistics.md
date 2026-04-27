# DeepStudent UI 样式与组件实现分裂统计

日期：2026-04-25

分支：`feat/study-ui-migration`

工作区：`/Users/ba7mlv/Documents/Coding/deep-student/.worktrees/study-ui-migration`

## 结论

当前 DeepStudent 确实存在多套组件样式和实现方式并存的情况。主要不是某一个组件写法不一致，而是历史 UI、shad/Radix 包装、Notion/study-ui 迁移层、页面内 Tailwind class、全局 CSS 和少量 inline style 同时在发挥作用。

最值得后续优先收敛的是：

1. Button：`NotionButton` 已经成为产品主体的主入口，但仍有原生 `<button>`、`src/components/ui/shad/Button.tsx`、`study-ui/src/components/ui/button.tsx`、`ShellButton`、`modern-buttons.css` 并存。
2. Dialog/Sheet/Modal：`NotionDialog`、`UnifiedModal`、shad `Sheet`、study-ui `dialog/sheet`、以及各业务自定义 Dialog/Modal 文件并存。
3. Input/Select/Form 控件：原生控件仍较多，同时存在 shad controls、`AppSelect`、`ModernSelect`、study-ui controls。
4. Surface/Card/Panel：大量业务组件自带 card/panel/surface 结构，和 shad `Card`、study-ui `Surface/Card` 同时存在。
5. CSS 层：`App.css`、`DeepStudent.css`、`chat-v2/styles/*` 仍承担大量全局和局部覆盖，`!important` 数量偏高，后续迁移时容易出现级联回归。

## 统计口径

扫描范围：

- `src/**/*.{ts,tsx,css}`
- `study-ui/src/**/*.{ts,tsx,css}`
- 排除：`node_modules`、`dist`、`src-tauri`、`test-results`

产品主体口径额外排除：

- `__tests__`
- `*.test.*`
- `*.source.test.*`
- `src/debug-panel/**`
- `src/chat-v2/dev/**`

GSD 说明：本 worktree 的 `.planning` 下没有 phase `SUMMARY.md` / `UI-SPEC.md` 产物，且 `gsd-sdk query init.phase-op ""` 返回 `phase required for init phase-op`，所以本次按全局代码审计模式输出统计报告，而不是某个 phase 的 `UI-REVIEW.md`。

## 总量概览

| 指标 | 全量 | 产品主体 |
|---|---:|---:|
| 扫描文件 | 1,411 | 1,269 |
| TSX 文件 | 584 | 518 |
| CSS 文件 | 64 | 63 |
| `className=` 次数 | 18,919 | 16,087 |
| `style={{...}}` 次数 | 887 | 498 |
| 原生 `<button>` 次数 | 336 | 177 |
| 含原生 `<button>` 文件数 | 109 | 66 |
| 原生 input/select/textarea 次数 | 309 | 195 |
| 含原生表单控件文件数 | 123 | 83 |
| CSS import 次数 | 66 | 65 |
| shad UI import 次数 | 419 | 335 |
| direct Radix import 次数 | 15 | 15 |
| 引入 `lucide-react` 文件数 | 411 | 363 |
| 引入 `@phosphor-icons/react` 文件数 | 21 | 21 |
| `cn(...)` 次数 | 1,616 | 1,595 |
| `cva(...)` 次数 | 6 | 6 |
| CSS 总行数 | 39,413 | 39,012 |
| `!important` 次数 | 1,568 | 1,568 |
| `@media` 次数 | 137 | 136 |

## 组件族分裂统计

### Button

现状：

- 主迁移入口：`src/components/ui/NotionButton.tsx`
- 共享 token/primitive：`src/components/ui/buttonPrimitiveContract.ts`
- shad 包装：`src/components/ui/shad/Button.tsx`
- study-ui 独立实现：`study-ui/src/components/ui/button.tsx`
- shell 独立实现：`study-ui/src/components/shell/ShellButton.tsx`
- 全局按钮样式：`src/styles/modern-buttons.css`
- 仍存在原生 `<button>`。

产品主体统计：

- Button 相关实现文件：8
- 原生 `<button>`：177 次，分布于 66 个文件
- `NotionButton` 出现文件：302
- `study-ui/src/components/ui/button` 引用文件：13
- `src/components/ui/shad/Button` 在产品主体中未发现直接引用，主要出现在 `src/debug-panel/**`

判断：

`NotionButton` 已经是事实主入口，但 Button 家族还没有完成“一个 primitive，多种包装”的闭环。`study-ui/src/components/ui/button.tsx` 和 `src/components/ui/shad/Button.tsx` 都使用 `cva`，但分别维护自己的 variants；`src/components/ui/shad/Button.tsx` 已经接入 `buttonPrimitiveContract`，`study-ui` 版本还没有接入父项目 primitive。

建议：

1. 保留 `buttonPrimitiveContract.ts` 作为唯一 token 合同。
2. 将 `study-ui/src/components/ui/button.tsx` 的 variant/size 映射同步到 `buttonPrimitiveContract.ts`，或明确它只是迁移参考实现。
3. 对产品主体中的 66 个原生 `<button>` 文件做分批替换，优先处理主流程和设置页。
4. 评估 `src/styles/modern-buttons.css` 是否还能删除或降级为兼容层。

### Dialog / Sheet / Modal

现状：

- `src/components/ui/NotionDialog.tsx`
- `src/components/UnifiedModal.tsx`
- `src/components/ui/shad/Dialog.tsx`
- `src/components/ui/shad/Sheet.tsx`
- `study-ui/src/components/ui/dialog.tsx`
- `study-ui/src/components/ui/sheet.tsx`
- 多个业务自定义 Dialog/Modal 文件。

产品主体统计：

- Dialog/Modal/Sheet 命名相关实现文件：46
- direct `@radix-ui/react-dialog` 引用文件：3
- `NotionDialog` 出现文件：52
- `UnifiedModal` 出现文件：6
- shad `Dialog/Sheet` 引用文件：6
- study-ui `dialog/sheet` 引用文件：3

判断：

Dialog 体系比 Button 更分散。`UnifiedModal` 当前只是包了一层 `NotionDialog`，但业务层同时还有 `NotionDialog`、shad `Sheet`、study-ui `Sheet` 和业务 Modal CSS。

建议：

1. 明确一个 Dialog 合同：`NotionDialog` 或 shad/Radix 包装二选一作为产品主入口。
2. Sheet/Drawer 类交互保留独立 primitive，但使用同一 overlay、radius、spacing、focus-ring token。
3. 将 `UnifiedModal` 标记为兼容 wrapper，后续只迁移旧用法，不再新增。
4. 优先检查大体量文件：`QuestionBankExportDialog.tsx`、`SyncConflictDialog.tsx`、`ShadApiEditModal.tsx`、`BatchEditDialog.tsx`。

### Sidebar / Drawer / Navigation

现状：

- `src/components/ui/unified-sidebar/*`
- `src/components/ModernSidebar.tsx`
- `src/components/settings/SettingsSidebar.tsx`
- `src/chat-v2/pages/SessionSidebarContent.tsx`
- `src/components/notes/NotesSidebar*.tsx`
- `src/components/learning-hub/LearningHubSidebar*.tsx`
- `study-ui/src/components/shell/Sidebar.tsx`

产品主体统计：

- Sidebar/Drawer 命名相关实现文件：25
- `UnifiedSidebar` / `unified-sidebar` 出现文件：15
- `SettingsSidebar` 出现文件：2
- `SessionSidebar` 出现文件：2
- `NotesSidebar` 出现文件：4

判断：

这里已经有比较明确的收敛方向：`UnifiedSidebar` + `font-sidebar-study-ui` + shell token。但业务侧仍保留多套 sidebar 容器和 row class 逻辑。

建议：

1. 把 `src/components/ui/unified-sidebar` 定为产品 sidebar primitive。
2. 将 `SettingsSidebar`、`SessionSidebarContent`、`NotesSidebarV2` 的 row/header/search/footer 差异沉淀为配置或 slots。
3. 对旧 `ModernSidebar` 明确生命周期：继续作为 app 主导航，还是迁移到 `UnifiedSidebar`。

### Inputs / Select / Form Controls

现状：

- 原生 `<input>` / `<select>` / `<textarea>`
- `src/components/ui/shad/Input.tsx`
- `src/components/ui/shad/Textarea.tsx`
- `src/components/ui/shad/Switch.tsx`
- `src/components/ui/shad/Slider.tsx`
- `src/components/ui/shad/Combobox.tsx`
- `src/components/ui/app-menu/AppSelect.tsx`
- `src/components/ModernSelect.tsx`
- `study-ui/src/components/ui/input.tsx`
- `study-ui/src/components/ui/textarea.tsx`
- `study-ui/src/components/ui/switch.tsx`

产品主体统计：

- Input/Select/Textarea/Switch/Slider 命名相关实现文件：42
- 原生表单控件：195 次，分布于 83 个文件
- shad controls 引用文件：81
- `AppSelect` 出现文件：26
- `ModernSelect` 出现文件：1
- study-ui controls 引用文件：3

判断：

表单控件是后续改进收益很高的区域。shad controls 已经存在，但原生控件仍多，尤其设置页、模板管理、批量编辑等复杂页面容易出现尺寸、focus、disabled、错误态不一致。

建议：

1. 先建立 `Input`、`Textarea`、`Select`、`Switch`、`Slider` 的使用准则。
2. 将 `AppSelect` 和 `ModernSelect` 的职责拆清：菜单选择器、通用 select、模型选择器不要混用。
3. 优先迁移原生控件热点：`McpToolsSection.tsx`、`TemplateManager.tsx`、`EnhancedTemplateEditor.tsx`、`BatchEditDialog.tsx`。

### Scroll Area

现状：

- `src/components/custom-scroll-area.tsx`
- `src/components/ui/shad/ScrollArea.tsx`
- `src/components/crepe/hooks/useSlashMenuCustomScrollbar.ts`
- `src/styles/thinking-scrollbar.css`
- 多处 CSS 直接写 `overflow` / `scrollbar`。

产品主体统计：

- Scroll 命名相关实现文件：7
- `ScrollArea` / `custom-scroll-area` / scrollbar 相关引用文件：122
- 含 overflow/scrollbar 的 CSS 文件：46

判断：

Scroll 不是组件数量最多的族，但覆盖面很广。不同滚动容器在 chat、notes、crepe、settings、pdf 中可能出现滚动条样式和边界阴影不一致。

建议：

1. 明确主滚动容器使用 `CustomScrollArea` 还是 shad `ScrollArea`。
2. 将 scrollbar token 收到 `theme-colors.css` 或统一 scrollbar CSS。
3. 禁止新业务 CSS 直接写独立 scrollbar，除非是编辑器/第三方组件隔离层。

### Surface / Card / Panel

现状：

- `src/components/ui/shad/Card.tsx`
- `study-ui/src/components/ui/card.tsx`
- `study-ui/src/components/ui/surface.tsx`
- 大量业务组件自带 Card/Panel 命名或 `.card` class。

产品主体统计：

- Card/Surface/Panel 命名相关实现文件：73
- shad `Card` 引用文件：30
- study-ui `Card/Surface` 引用文件：4
- `.card` / card class 相关引用文件：184

判断：

Surface 家族目前最像“样式经验分散在业务里”。这会影响页面密度、圆角、边框、阴影、hover 状态的一致性。

建议：

1. 给 `Surface`、`Card`、`Panel` 明确语义分层：页面背景、分组容器、重复项卡片、弹层面板。
2. 将重复的 `.card` 类迁移为 `Card` 或 `Surface` variants。
3. 优先处理高密度页面：learning-hub、settings、question bank、chat plugin panels。

### Icons

产品主体统计：

- `lucide-react` 引用文件：363
- `@phosphor-icons/react` 引用文件：21
- inline `<svg>` 文件：29

判断：

图标库边界还不够清晰。当前产品主体主要是 lucide，study-ui/shell/sidebar 迁移中引入了 Phosphor，另有少量 inline SVG。

建议：

1. 规定图标库边界：例如产品通用动作继续 lucide，study-ui 迁移 shell/sidebar 暂时允许 Phosphor。
2. 新增按钮图标优先使用已有 icon 组件库，不再新增业务 inline SVG。
3. 把稳定品牌/文件类型图标保留在 `src/components/icons` 或 learning-hub icons，不混进普通动作按钮。

## CSS 层热点

产品主体 CSS：

- CSS 文件：63
- CSS 总行数：39,012
- `!important`：1,568
- `@media`：136

最大 CSS 文件：

| 文件 | 行数 |
|---|---:|
| `src/App.css` | 11,935 |
| `src/DeepStudent.css` | 2,988 |
| `src/components/crepe/CrepeEditor.css` | 1,505 |
| `src/chat-v2/styles/chat.css` | 1,395 |
| `src/components/pdf/enhanced-pdf.css` | 1,237 |
| `src/chat-v2/styles/chat-beautify.css` | 1,136 |
| `src/chat-v2/styles/markdown.css` | 1,132 |
| `src/components/TemplateManager.css` | 987 |
| `src/components/mindmap/mindmap.css` | 913 |
| `src/chat-v2/styles/analysis.css` | 882 |

`!important` 最集中：

| 文件 | `!important` 次数 |
|---|---:|
| `src/DeepStudent.css` | 469 |
| `src/components/crepe/CrepeEditor.css` | 345 |
| `src/App.css` | 276 |
| `src/chat-v2/styles/chat-beautify.css` | 87 |
| `src/chat-v2/styles/markdown.css` | 71 |
| `src/components/notes/NotesHome.css` | 49 |
| `src/components/TemplateManager.css` | 31 |
| `src/components/mindmap/mindmap.css` | 24 |
| `src/chat-v2/components/Variant/ParallelVariantView.css` | 23 |
| `src/chat-v2/components/renderers/ThinkingChain.css` | 21 |

入口样式链：

`src/App.tsx` 一次性导入了 Tailwind、shad variables、theme-colors、`App.css`、`DeepStudent.css`、safe area、modern buttons、responsive utilities、typography、shadcn overrides 等 10 个样式文件。这说明主题 token 已经在迁移，但全局 CSS 仍然是主要级联来源。

## 最高优先级热点文件

产品主体中 `className` 最密集：

| 文件 | `className=` 次数 |
|---|---:|
| `src/components/QuestionBankEditor.tsx` | 392 |
| `src/components/learning-hub/views/IndexStatusView.tsx` | 315 |
| `src/components/settings/McpToolsSection.tsx` | 278 |
| `src/components/learning-hub/views/MemoryView.tsx` | 258 |
| `src/components/settings/ShadApiEditModal.tsx` | 233 |
| `study-ui/src/components/content/SettingsPanel.tsx` | 213 |
| `study-ui/src/components/content/settings-demo-sections.tsx` | 200 |
| `src/components/anki/TaskDashboardPage.tsx` | 188 |
| `src/components/settings/data-governance/BackupTab.tsx` | 179 |
| `src/components/DataImportExport.tsx` | 171 |

产品主体中 inline style 最密集：

| 文件 | `style={{...}}` 次数 |
|---|---:|
| `src/components/Settings.tsx` | 25 |
| `src/components/TemplateManager.tsx` | 19 |
| `src/components/pdf/EnhancedPdfViewer.tsx` | 18 |
| `src/components/shared/UnifiedDragDropZone.example.tsx` | 16 |
| `src/components/mindmap/views/OutlineView.tsx` | 14 |
| `src/components/anki/panels/ExportPanel.tsx` | 13 |
| `src/components/shared/CommonTooltip.example.tsx` | 13 |
| `src/chat-v2/components/input-bar/InputBarUI.tsx` | 11 |
| `src/main.tsx` | 11 |
| `src/components/SOTADashboardLite.tsx` | 10 |

产品主体中原生表单控件最密集：

| 文件 | 原生控件次数 |
|---|---:|
| `src/components/settings/McpToolsSection.tsx` | 19 |
| `src/components/TemplateManager.tsx` | 15 |
| `src/components/EnhancedTemplateEditor.tsx` | 13 |
| `src/components/BatchOperationToolbar/BatchEditDialog.tsx` | 11 |
| `src/components/FieldTypeConfigurator.tsx` | 9 |
| `src/components/learning-hub/views/MemoryView.tsx` | 8 |
| `src/components/Settings.tsx` | 7 |
| `src/components/todo/TodoMainPanel.tsx` | 7 |

## 建议的后续改进顺序

1. 先收敛 Button：以 `buttonPrimitiveContract.ts` 为唯一合同，逐步替换产品主体 66 个文件里的原生 `<button>`。
2. 再收敛 Form Controls：优先 `McpToolsSection`、`TemplateManager`、`EnhancedTemplateEditor`、`BatchEditDialog`。
3. 同步收敛 Dialog/Sheet：保留一个 Dialog 主入口，一个 Sheet/Drawer 主入口，把 `UnifiedModal` 视为兼容层。
4. 建立 Surface/Card 语义：减少业务里自定义 `.card` / panel class。
5. 最后做 CSS 分层削减：先拆 `App.css`、`DeepStudent.css` 的仍在使用部分，再处理 `!important` 高密度文件。

## 可验证的迁移 guardrails

后续每批迁移建议配套以下检查：

- `rg "<button\\b" src study-ui/src`：原生按钮数量应下降。
- `rg "style=\\{\\{" src study-ui/src`：inline style 数量应下降，动态 CSS 变量除外。
- `rg "!important" src/**/*.css`：全局覆盖数量应下降。
- `rg "NotionButton|buttonPrimitiveContract|components/ui/button"`：确认按钮体系仍走同一 primitive。
- `rg "NotionDialog|Dialog|Sheet|UnifiedModal"`：确认弹层入口没有继续扩散。
