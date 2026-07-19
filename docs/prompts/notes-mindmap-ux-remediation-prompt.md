# Deep Student 笔记 + 大纲/导图 UIUX 改造落地 Prompt

> **用途**：把本文件完整粘贴（或 `@` 引用）给实现代理，要求按优先级落地优化。
> **调研日期**：2026-07-19
> **调研规模**：第一轮 16 路（笔记 vs Obsidian/Notion）+ 第二轮 13 路（手感微细节 + 幕布大纲/导图）
> **配套画布（中文）**：
> - `~/.cursor/projects/Volumes-cipan-deep-student/canvases/notes-uiux-gap-analysis.canvas.tsx`
> - `~/.cursor/projects/Volumes-cipan-deep-student/canvases/notes-fluency-mubu-mindmap.canvas.tsx`
> **仓库根**：`/Volumes/cipan/deep-student`

---

## 0. 你的任务

你是 Deep Student 的实现代理。请在本仓库内，按本文 **P0 → P1 → P2** 顺序改造 **笔记模块（Workbench Notes）** 与 **思维导图/大纲模块（MindMap + OutlineView）** 的 UI/UX，目标是：

1. **用起来顺手**（肌肉记忆、键盘瞬移、落点正确、无空转快捷键）优先于「功能看起来多」。
2. **笔记**对齐 Obsidian 的导航/链接/搜索落点手感 + Notion 的文档平静感（非数据库）。
3. **大纲/导图**对齐幕布「一棵树、两种投影」+ Enter/Tab/Shift+Tab 三键闭环；学习能力（背诵/挖空/引用对话）作为差异化，**不要做成幕布紫克隆或更弱 PKM**。
4. 每个改动要有测试或明确手工验收步骤；禁止大范围无关重构。
5. 改完后用中文简短汇报：做了什么、测了什么、刻意没做什么。

**成功标准（口令）**：

- 笔记：点 `[[链接]]` 必打开；⌘N 落在当前笔记所在文件夹；全文搜索打开滚到命中；⌘P/⌘O 快速打开可用。
- 大纲：闭眼只靠 Enter/Tab 能连续记一章；编辑中 ⌘V 可贴成树；⌘Z 走文档历史。
- 双视图：大纲打结构 → 切导图拖节点 → 回大纲位置正确；折叠/聚焦尽量保留。
- 不做：Notion 数据库/同步块、Obsidian 插件生态、幕布紫皮肤、导图自由连线白板。

---

## 1. 产品定位与对齐原则（必读）

### 1.1 当前身份（代码事实）

- **直播笔记壳**：`src/features/workbench/apps/notes/NotesWorkspaceApp.tsx`（非已下线的 `NotesHome`）。
- **编辑器**：Milkdown/Crepe WYSIWYG，Markdown 为源；`NotesCrepeEditor.tsx`。
- **导图/大纲**：同一 `MindMapDocument` 树；`MindMapContentView.tsx` 内 `outline ⇄ mindmap`；可嵌在 Notes workspace 的 mindmap tab。
- **混合体**：Obsidian 式工作台壳（树/标签页/分屏/反链）+ Notion 式页面画布（约 816px、大标题）。

### 1.2 对齐 / 分叉

| 方向 | 对齐什么 | 不对齐什么 |
|------|----------|------------|
| **Obsidian** | Quick Switcher、链接跳转、搜到落点、新建跟目录、修饰键开目标、反链、本地文件诚实感 | 插件生态、全局图谱 piloting、YAML 当主库、默认双模式 Source/LP |
| **Notion** | 空页即写、slash、悬停手柄、选区浮条、暖色纸面、轻量属性、删可回退 | Everything-is-block、数据库、同步块、万能 Turn into、封面文化 |
| **幕布** | 三键闭环、zoom 进主题、一树两视、折叠徽章、中性画布、100ms 级折叠 | `#5856d5` 紫皮肤、自由画布、把导图做成第二套数据模型 |
| **Deep Student** | 引用到对话、Canvas AI Diff、背诵/挖空、Hub 多类型资料、资源引用 | 做成「幕布+开关」或「Obsidian 阉割版」 |

### 1.3 手感公式（验收用）

```
笔记顺手 = 瞬移(键盘) + 可预期修饰键 + 就地预览 + 断链可生长 + 打开即定位 + chrome可消失 + 60fps
大纲顺手 = Enter/Tab/⇧Tab 三键闭环 + IME不误触 + 行首合并 + zoom面包屑 + 粘贴成树 + 结构撤销
导图顺手 = 同一棵树投影 + 切换保焦点/折叠 + 多选拖不丢 + 键盘与大纲语义可预期
```

---

## 2. 架构地图（改哪里）

### 2.1 笔记

| 区域 | 路径 |
|------|------|
| Workbench 壳 | `src/features/workbench/apps/notes/NotesWorkspaceApp.tsx` + `.css` |
| 文件树 | `src/features/workbench/apps/notes/tree/**` |
| 搜索 | `NotesSearchOverlay.tsx`, `parseTagQuery.ts`, `highlightRanges.ts` |
| 反链/属性 | `NotesBacklinksPanel.tsx`, `NotesPropertiesTab.tsx`, `NotesContextPanel.tsx` |
| 编辑器 | `src/features/notes/NotesCrepeEditor.tsx`, `components/NotesEditor*` , `MobileEditorToolbar*` |
| Crepe/链接 | `src/components/crepe/**`, `plugins/wikilink/**`, `plugins/mention/**` |
| 命令 | `src/command-palette/modules/notes.commands.ts` |
| 事件桥 | `WorkbenchEventBridge`（接 `DSTU_OPEN_NOTE` / `navigateToNote`） |
| 创建/打开 | `createFromWikilink.ts`, `wikilinkNotesCache.ts`, DSTU `createEmpty` |
| 库导入导出 | `NotesLibraryManager.tsx`（须接到 Workbench，勿只挂死 NotesHome） |
| 排版 token | `src/styles/notes-typography.css` |

### 2.2 导图 / 大纲

| 区域 | 路径 |
|------|------|
| 宿主 | `src/features/mindmap/MindMapContentView.tsx` |
| 大纲 | `src/features/mindmap/views/OutlineView.tsx` |
| 画布 | `components/mindmap/MindMapCanvas.tsx`, `MindMapView*.tsx` |
| 键盘 | `hooks/useMindMapKeyboard.ts`（仅画布）；大纲键在 `OutlineView.handleKeyDown` |
| 剪贴板 | `hooks/useMindMapClipboard.ts`, `utils/pasteMarkdown.ts` |
| Store | `store/mindmapStore.ts` |
| 快捷键表 | `constants/shortcuts.ts` |
| 挖空/背诵 | `BlankedText.tsx`, `blankRanges.ts`, `ReciteStatusBar.tsx` |
| Workbench app | `src/features/workbench/apps/mindmap/**` |
| 样式 | `styles/mindmap.css`, `outline-enhancements.css` |

### 2.3 已知双轨（改造时统一到 Workbench 真相）

- Legacy `NotesHome` / `DndFileTree` / `NotesTabsBar` **已下线或非主路径**，新能力不要只接 legacy。
- 笔记属性：Workspace 统一右栏 vs Learning Hub 浮动 overlay（`propertiesPanelDisabled`）。
- 大纲键盘 ≠ 画布键盘（Tab 语义不同：缩进 vs 加子节点）——须在帮助与「幕布兼容」开关里写清。

---

## 3. P0 — 必须先做（阻断「顺手」）

实现代理应 **优先完整做完 P0**，再进入 P1。每项含：症状、根因、改造要求、关键路径、验收。

### 3.1 笔记 P0

#### N-P0-1：接线 `DSTU_OPEN_NOTE`（点链接必开笔记）

- **症状**：Workbench 内点已解析 `[[wikilink]]` / `@mention` 无反应或被 Chat canvas 接走。
- **根因**：点击派发 `DSTU_OPEN_NOTE`；Workbench 桥只听 `navigateToNote`；Notes workspace 零监听。
- **改造**：在 `WorkbenchEventBridge`（或 Notes workspace）将 `DSTU_OPEN_NOTE` → 与 `navigateToNote` 同源的 `requestWorkspaceResource({ type:'note', id })`；Notes 聚焦时优先当前 workspace。
- **路径**：`crepe/plugins/wikilink/types.ts` `dispatchOpenNote`；`mention/click.ts`；`WorkbenchEventBridge.tsx`；`useChatPageEvents.ts`（勿破坏 Chat，但 Notes 内必须自洽）。
- **验收**：Notes 窗口内点链接 → 打开/激活对应 tab；不强制跳 Chat。

#### N-P0-2：新建 / 幽灵链创建落在「当前上下文文件夹」

- **症状**：⌘N 或点未解析 `[[新标题]]` 创建后落在库根或过期 `selectedFolderId`。
- **根因**：`selectedFolderId` 仅在选中 **folder** 时更新；`createNoteFromWikilinkTitle` 无 `folderId`；`createResource` 用陈旧 folder。
- **改造**：
  1. 打开/选中笔记时：`selectedFolderId = parent(activeNote)`。
  2. ⌘N / ribbon 新建 / `createFromWikilink` / 反链 unresolved 创建：统一 `createEmpty({ folderId })` 或等价。
  3. 创建后 `openResource`，不单靠未接线的 `DSTU_OPEN_NOTE`。
- **路径**：`NotesWorkspaceApp.tsx` `createResource` / `selectTreeItem`；`createFromWikilink.ts`；`NotesCrepeEditor.tsx`。
- **验收**：在文件夹 A 的笔记里 ⌘N → 新笔记在 A；点幽灵链创建 → 在当前笔记父目录，并打开。

#### N-P0-3：修复 ⌘⇧O / `toggle-outline` 空转

- **症状**：命令显示可用，按了无面板。
- **根因**：`NOTES_TOGGLE_OUTLINE` → `NoteContentView.toggleRightPanel`，但 Workspace 设 `propertiesPanelDisabled`，内嵌面板不渲染；真大纲在 `NotesBacklinksPanel` 的 Properties tab。
- **改造**：Workbench 下 `toggle-outline` → `setBacklinksOpen(true)` + 切到 `properties` tab（或等价可见大纲）。禁止空转。
- **路径**：`notes.commands.ts`；`NotesWorkspaceApp.tsx`；`NoteContentView.tsx`。
- **验收**：快捷键/命令面板一键打开可见大纲。

#### N-P0-4：库级 ZIP 导入/导出接回 Workbench

- **症状**：`NotesLibraryManager` 只挂已下线 `NotesHome`；Learning Hub「导出全部」降级。
- **改造**：Workbench 命令/空态/设置入口接通 `NotesLibraryManager`（或同等 ZIP API）；`NOTES_EXPORT_ALL` / import 必须真实可用。
- **路径**：`NotesLibraryManager.tsx`；`NotesLibraryDialog.tsx`；`NotesWorkspaceApp` 或 command palette。
- **验收**：可从 Notes workspace 导出/导入 Markdown ZIP。

#### N-P0-5：拖笔记/资源 → 编辑器插入 `[[wikilink]]`

- **症状**：侧栏拖到编辑器不能插链接（Obsidian 核心手势）。
- **改造**：`dragstart` 带 note id/title → 编辑器 drop → `formatWikiLink` / `insertWikilink`；与图片 drop 分流。
- **路径**：tree `TreeRow` / DnD；`NotesCrepeEditor` drop；`WB_RESOURCE_MIME`；wikilink helpers。
- **验收**：从树拖笔记到正文 → 插入已解析 `[[标题]]`。

#### N-P0-6：⌘P 不再空转（Quick Open）

- **症状**：`global.quick-search` / `mod+p` hidden，无 listener。
- **改造**：Notes 聚焦时 `mod+p` → `NotesSearchOverlay` quick-open（可与 ⌘O 同路径）；删除无监听绑定。
- **路径**：`notes.commands.ts` / global commands；`NotesWorkspaceApp`；`NotesSearchOverlay.tsx`。
- **验收**：⌘P / ⌘O 都能快速打开笔记。

#### N-P0-7：全文搜索打开 → 落点 / 预填查找

- **症状**：有 snippet，打开只到文首。
- **改造**：`openWorkspaceSearchResult` 传 query；打开后调用现有 `FindReplacePanel` / searchHighlight 跳首个 match。
- **路径**：`NotesSearchOverlay.tsx`；`NotesWorkspaceApp`；`FindReplacePanel` / `searchHighlight`。
- **验收**：全文搜打开后滚到命中并高亮。

#### N-P0-8：视觉/铬层最小一致性（笔记）

- **改造（可同一 PR 或紧随）**：
  - 选定 Hybrid：文档面 Notion 向、壳 Obsidian 向；给 explorer 轻微 `muted`/nav surface，与正文 `--background` 分层。
  - 统一圆角：树行用 `--notes-radius-row`，勿混 shell 14px 与 notes 6px 无文档分叉。
  - 删除或接线死字段 `explorerWidth`（要么真可拖，要么停止 persist 假宽度）。
- **路径**：`NotesWorkspaceApp.css`；`NotesWorkspaceTree.css`；`notes-typography.css`。

### 3.2 大纲 / 导图 P0

#### M-P0-1：编辑态结构化粘贴

- **症状**：焦点在 textarea 时 ⌘V 不走 `pasteMarkdownChildren`。
- **根因**：`useMindMapClipboard` 对 `TEXTAREA` 直接 return。
- **改造**：编辑态识别 Markdown/缩进列表 → 贴为子树/兄弟；普通文本仍行内粘贴；一次撤销可回滚。
- **路径**：`useMindMapClipboard.ts`；`pasteMarkdown.ts`；`OutlineView.tsx`。
- **验收**：编辑一行时粘贴 `- a\n  - b` → 成树。

#### M-P0-2：编辑态文档级撤销

- **症状**：大纲打字时 ⌘Z = 浏览器控件撤销，与 store 历史脱节。
- **根因**：`MindMapContentView` 仅在非输入上下文处理 undo。
- **改造**：结构操作与提交后的文本进入 store history；编辑态 ⌘Z 优先文档历史（或 IME 结束后与 store 对齐的策略，需测中文输入）。
- **路径**：`MindMapContentView.tsx`；`mindmapStore.ts`。
- **验收**：缩进/合并/粘贴树后 ⌘Z 能撤；中文 IME 组字不被误伤。

#### M-P0-3：降低「静态行 ↔ textarea」摩擦（处处可打）

- **症状**：非编辑是静态 div，聚焦才挂载 textarea，快速 ↑↓ 易丢键。
- **改造**：优先方案——可见行保持可编辑输入面，或预挂载焦点行±N；保证结构操作后 caret 同步回可打行（`outlineCaret.ts`）。
- **路径**：`OutlineView.tsx`；`outlineCaret.ts`。
- **验收**：↑↓ 扫行后直接打字无需二次点击。

#### M-P0-4：多行节点方向键

- **症状**：⇧Enter 可换行，但 ↑↓ 始终跨节点。
- **改造**：光标不在行首/行尾时，↑↓ 在 textarea 内移动；边界再跨节点（保留 goal column）。
- **路径**：`OutlineView.tsx` `handleKeyDown` ~↑↓。
- **验收**：多行标题内方向键行为符合常规编辑器。

#### M-P0-5：冻结三键契约 + IME 保护

- **契约（不可漂移）**：
  - Enter：行末同级 / 行中拆分 / 行首插空（保持现有合理语义并补测试）
  - Tab / Shift+Tab：整节点（含子树）缩进/反缩进
  - 行首 Backspace：合并上一节点；空节点 Backspace：删节点
- **IME**：`isComposing` 时不触发结构键。
- **验收**：e2e 或 vitest 锁定三键；中文输入 Enter 不上屏误建节点。

#### M-P0-6：双视图切换保真（编辑连续性）

- **现状**：树/焦点/选区/viewRoot/视口在 store 层保留；但互斥卸载、切换前清空 `editingNodeId`、多选锚点在 Outline 本地丢失。
- **改造**：
  1. 切换时保留「目标节点 + 是否应进入编辑」；切回自动 focus，尽量恢复 caret。
  2. 多选锚点进 store。
  3. undo/redo/save/copy/paste 提到 ContentView 共享层（键盘导航可视图分叉）。
  4. 尽量 CSS 保活或减少 remount 闪烁。
- **路径**：`MindMapContentView.tsx` `switchView`；`OutlineView`；store。
- **验收**：编辑中切导图再切回，仍在同一节点且可继续打字；折叠跨视图保留。

#### M-P0-7：画布多选拖不退化

- **症状**：`MindMapCanvas` 拖拽起始 `setSelection([node.id])` 清掉多选。
- **改造**：多选拖整组 reparent；落点反馈保持。
- **路径**：`MindMapCanvas.tsx` ~936；`dropTarget.ts`。
- **验收**：框选多个 → 拖到新父 → 全部移动。

#### M-P0-8：学习入口可见性（最小）

- **改造**：工具栏「学习」分组：背诵 / 隐藏已完成；背诵按钮有文案；无挖空时 CTA。不必一次做完 Anki 打通。
- **路径**：`MindMapContentView.tsx`；`ReciteStatusBar.tsx`；i18n `mindmap.json`。

---

## 4. P1 — 高杠杆手感（P0 后）

### 4.1 笔记 P1

| ID | 项 | 要求 |
|----|----|------|
| N-P1-1 | 历史 ← → | 渲染 `canBack/canForward` 按钮；快捷键改 window capture（titlebar portal 丢焦点） |
| N-P1-2 | 统一 `[[` / `@` | 产品主路径定为 wikilink；`@` 插入也进同一反链索引（或明确文档）；消除「有时没反链」 |
| N-P1-3 | 反链 incoming | 提升/流式候选，削弱 256 盲区；`@` 与 `[[` 一并计入 |
| N-P1-4 | 树 hover 操作 + Delete | hover 新建/更多；键盘 Delete → 删除对话框 |
| N-P1-5 | 移动端 activeStates + 删除线 | `buildMobileEditorCommands` 接 strikethrough；传入 `activeStates` |
| N-P1-6 | Workbench 拖入 MD 导入 | 复用 Learning Hub `importMarkdown*` |
| N-P1-7 | createFromWikilink 刷新 | 可靠 resolve，少用整文 `setMarkdown` hack |
| N-P1-8 | 块级菜单 | Crepe 手柄：Turn into（有限：p/h/list/quote）/ Duplicate / Delete |
| N-P1-9 | 搜索模式键盘切换 | overlay 内 Ctrl+Tab 或 ⌘⇧F 切换 quick-open/full-text |
| N-P1-10 | 冲突 UI | 编辑器内横幅：留远端 / 恢复我的（勿只靠全局 toast） |
| N-P1-11 | 空态学习化 | 空 pane：新学习笔记 + 导入 + Ask Agent；接死 key `open_assistant` 或替换 |
| N-P1-12 | 引用到对话 / AI 编辑 | 提到一等 chrome（非仅右键） |

### 4.2 大纲/导图 P1

| ID | 项 | 要求 |
|----|----|------|
| M-P1-1 | **幕布兼容键位开关** | 兼容档：⌘Enter=完成态，Shift+Enter=描述，⌘]/⌘[=zoom；子节点改 ⌘⇧Enter 或 Tab 后 Enter。默认档保持 DS 但帮助标注「非幕布」 |
| M-P1-2 | Zoom 与折叠解耦 | 圆点/快捷键 zoom；折叠用独立控件/快捷键；面包屑 +（加分）同级横跳 |
| M-P1-3 | Tab 无 trim 即时感 | 避免每次 indent 强制 trim 掉用户尾部分空格（或仅 blur 时 trim） |
| M-P1-4 | Delete 对齐 Backspace | 单行编辑 Delete 与 ⌫ 合并/删空语义一致 |
| M-P1-5 | 画布导航 | Arrow 尽量空间邻接；或文档标明「大纲序」并提供切换 |
| M-P1-6 | 平移默认更友好 | 降低「拖不动画布」；触控板/空格策略产品选择一种默认 |
| M-P1-7 | 背诵键盘 | 空格/Enter 揭示焦点下一空；大纲/画布挖空规则一致 |
| M-P1-8 | 描述 UX | 一键进出描述；可选「描述只显示首行」（背单词） |
| M-P1-9 | 命令命名 | Notes `toggle-outline` 与导图「大纲视图」勿混名；增加「导图：切换大纲/脑图」命令 |
| M-P1-10 | Word/HTML 粘贴成树 | 认列表/标题层级（不要求完整 docx 文件导入） |

### 4.3 视觉 / 微交互 P1

- 统一 notes 120ms hover / 150ms popup token；搜索/对话框 **退出** 动画。
- Tab 切换短 crossfade（&lt;200ms，尊重 reduced-motion）。
- 幕布向：折叠 100–150ms；hover 才出三角；行选中中性浅底；**禁止大面积品牌紫**。
- 阅读密度：接线已有 i18n `preferences.font_size` / `line_height` 或提供舒适/紧凑 preset；表格 `overflow-x: auto`；行内代码勿用 `--destructive` 色。

---

## 5. P2 — 打磨与后续

- 笔记：`![[embed]]` 子集、heading `[[Note#H]]`、unlinked mentions、local graph（仅 ego）、源码/raw 开关、页面图标、Focus/Zen 藏铬、真正 fuzzy + recents、peek 预览。
- 学习属性固定行：`subject` / `status` / `reviewAt`（非 Notion 属性动物园）。
- 笔记模板：听课/错题/应试 Markdown 骨架。
- 导图：演示模式、`.xmind` 导入、关联线快捷工具、鱼骨等结构（低优先级）。
- 选区 → 制卡此段；引用回源 PDF/标题（`scrollToHeading` 勿假成功）。
- Workbench 移动端：恢复 outline/tags、44px 触控、边缘滑动（可复用 `MobileSlidingLayout`）。

---

## 6. 明确不做（代理禁止擅自开做）

1. Notion 数据库 / 同步块 / 万能 Turn into 矩阵。
2. Obsidian 插件市场、主题市场、以 YAML 为主存储。
3. 全局关系图谱 piloting（除非 P2 ego local graph）。
4. 幕布 `#5856d5` 紫皮肤或紫色洗侧栏/子弹。
5. 导图自由坐标 + 随意连线网（XMind 完整画布）破坏同构。
6. 重建已删除的白板 Canvas。
7. 复活 NotesHome 为第二主路径（应删死代码或标明 legacy，能力迁 Workbench）。
8. 为对齐而破坏 Markdown round-trip / DSTU 同步假设。

---

## 7. 建议 PR 切片（降低风险）

按顺序开 PR，每 PR 可独立验收：

1. **PR-A 笔记跳转与落点**：N-P0-1, N-P0-2, N-P0-3
2. **PR-B 搜索与快捷键**：N-P0-6, N-P0-7, N-P1-1
3. **PR-C 库与拖链**：N-P0-4, N-P0-5, N-P1-6
4. **PR-D 大纲手感核心**：M-P0-1 … M-P0-5
5. **PR-E 双视图 + 多选拖**：M-P0-6, M-P0-7
6. **PR-F 幕布兼容键位 + Zoom**：M-P1-1, M-P1-2
7. **PR-G 视觉与空态**：N-P0-8, N-P1-11, 动效退出
8. **PR-H 学习入口**：M-P0-8, M-P1-7, N-P1-12

---

## 8. 测试要求

- 已有测试优先扩展：
  - `NotesWorkspaceApp.test.tsx`（含 folderId 行为——需修正固化错误预期）
  - `OutlineView` / `splitMerge.test.ts`
  - `MobileEditorToolbar.test.tsx`（activeStates）
  - `hideCompleted` / blankedText / recite 相关
- 新增：
  - wikilink 点击 → workspace open
  - create note folder context
  - outline paste markdown while editing
  - view switch preserves editing node
  - multi-select drag on canvas
- 手动：中文 IME、幕布用户三键口令、搜到落点、ZIP 往返。

---

## 9. 竞品对照速查（实现时自测）

### 9.1 Obsidian 前 10 分钟必杀

| 动作 | 必须成立 |
|------|----------|
| ⌘O/⌘P 打半个名 | 命中或一键新建 |
| 点 `[[链接]]` | 打开目标 |
| 搜到一句 | 打开并滚到命中 |
| 钉住再点链接 | （P1/P2）链接旁开；至少 pin 可用 |
| 新建 | 落在当前文件夹 |

### 9.2 幕布大纲口令

> 闭眼只靠 Enter/Tab 连续记一章；中途不用鼠标；删错 Backspace 能粘回；点圆点能钻进去背；出来结构还在。

### 9.3 幕布权威键（兼容档目标）

| 操作 | 幕布 |
|------|------|
| 同级 | Enter |
| 缩进/反缩进 | Tab / Shift+Tab |
| 完成 | Ctrl/⌘+Enter |
| 描述 | Shift+Enter |
| Zoom in/out | Ctrl/⌘+] / [ |
| 同级移动 | Ctrl/⌘+Shift+↑/↓ |
| 切导图 | Ctrl+Alt+Shift+M（或产品等价一键） |

### 9.4 Deep Student 现状冲突（兼容开关必须处理）

| 键 | 幕布 | DS Outline 现状 |
|----|------|-----------------|
| ⌘Enter | 完成 | 新建子节点 |
| Shift+Enter | 描述 | 节点内换行 |
| ⌘] / ⌘[ | zoom | 展开/折叠 |

---

## 10. 能力记分现状（避免重复造轮子）

**笔记（DS 约 26/39）**：wikilink/backlinks/search/tags/callouts/AI edit/refs→chat 已有；缺模板、弱属性、无笔记 embed、搜索落点弱。

**导图（DS 约 26/33）**：双视图、导出、背诵挖空、资源引用偏强；大纲键盘与幕布极致手感、双视图瞬时连续性偏弱。

**已具备勿重做**：Crepe slash/+ /drag、callout/toggle、KaTeX/mermaid、图片 DnD、收藏/标签、反链面板、结构预设（tree/logic/org）、OPML/MD/PNG/SVG、挖空持久化、AI Diff。

---

## 11. 交付格式（实现代理回复用户时）

1. 按 PR 切片列出已完成 ID（如 N-P0-1）。
2. 关键文件路径列表。
3. 测试：命令 + 结果。
4. 未做项与原因（指回本文章节）。
5. 风险/后续建议（一句话）。

---

## 12. 附录：调研来源索引

子代理主题（便于追问）：Notes IA / Visual / Editor chrome / Block slash / Tree / Links / Properties / Search / Micro-interactions / Empty / Mobile / Typography / Obsidian ref / Notion ref / Learning fit / Templates；第二轮 Obsidian/Notion fluency / DS notes friction / Mindmap canvas / Outline audit / Mubu outline / Mubu transform / Mubu visual / Scorecard / Dual-view / Recite / XMind-WF / Key ops。

画布：

- 宏观差异：`notes-uiux-gap-analysis.canvas.tsx`
- 手感+幕布：`notes-fluency-mubu-mindmap.canvas.tsx`

---

**一句话交给实现代理**：先修笔记断点（链接、落点、大纲命令、ZIP、拖链、⌘P、搜索落点）与大纲呼吸感（粘贴、撤销、可打、三键、IME、双视图、多选拖）；再上幕布兼容键位与学习入口；始终抄交互不抄幕布紫，不碰 Notion DB / Obsidian 插件生态。
