# 全能搜索面板设计（标题栏搜索 icon 升级）

日期：2026-07-31
状态：已确认，待实现
范围：Legacy 壳模式（Workbench OS 模式不动，后续再议）

## 背景与动机

1. 标题栏 "DeepStudent" 旁的搜索 icon 目前只打开命令面板的「仅会话搜索」模式（`sessionSearchOnly`），功能单一且与 ⌘K 命令面板割裂。
2. 实测发现 FTS5 `unicode61` 分词器不切中文，中文子串搜索（如"备考"、"学习助手"）必然返回空 → 面板显示"未找到匹配的命令"。该问题已定位（根因见下），**本次搁置，另行处理**。
3. 诉求：搜索 icon 应承载「搜索推荐、设置、导航、面板」等能力，成为真正的全能入口。

## 决策记录

| 决策点 | 结论 |
|---|---|
| 落点 | 先改 Legacy 壳模式，Workbench 模式保持现状 |
| 与 ⌘K 的关系 | 统一升级为一套面板，icon 与 ⌘K 同一入口 |
| 推荐位首页 | 最近会话 + 常用命令 + 核心功能快捷入口 + 底部设置/导航/面板快捷区 |
| 设置/导航/面板呈现 | 首页快捷区 + 搜索关键词命中（注册为命令类别，复用 registry） |
| 中文搜索修复 | 本次不做，单独跟进（unicode61 CJK 单 token 问题） |

## 现状梳理（实现前确认过的事实）

- FTS 表 `chat_v2_content_fts(rowid, content)`，`tokenize='unicode61'`，由 `trg_blocks_fts_ai/au/au_clear/ad` 触发器维护（V20260301 建，V20260719 补 block_type 覆盖）。
- 搜索命令两条：`chat_v2_search_content`（正文 FTS，`escape_fts5_query` token 级引号防注入 + bm25 排序）、`chat_v2_search_sessions`（标题/描述/标签 LIKE）。
- 消费方：命令面板 `fetchChatSearchResults`、SessionBrowser（标题/内容两模式）、quick-assistant agent 工具、Workbench Spotlight provider。
- 迁移由 MigrationCoordinator 用裸 `rusqlite::Connection::open` 执行（coordinator.rs:1178），不走 ChatV2Database 连接池——任何 SQL 侧 UDF 需在池 init + 迁移执行点双注册（中文修复方案的注意点，本次不用）。

## 面板结构（两级状态）

### A. 推荐位首页（输入为空时）

自上而下：

1. **最近会话 Top 5**
   - 数据源：打开面板时 `invoke chat_v2_list_sessions`（status=active，limit=5~8），与侧边栏同一后端命令，不新增接口。
   - 交互：点击 → `navigate-to-session` 事件（复用 `openSessionFromPalette` 的既有跳转路径）+ 关闭面板。
   - 当前 active 会话高亮（通过 sessionManager），支持 ⌘+回车直达当前会话。
2. **常用命令 Top 6**
   - 数据源：`commandHistory.getFrequentCommandIds(6)`（commandHistory.ts:103，按 count 排序，已有 subscribe 机制）+ `getRecentCommandIds` 兜底。
   - 渲染：从 commandRegistry 取真实 Command（图标/文案/执行全复用），点击走标准执行路径。
3. **核心功能快捷入口（图标网格）**
   - 静态命令 ID 列表：新建会话、Anki 制卡、学习资源、待办、制卡任务、数据管理……全部用 registry 现有命令 ID（navigation.commands.ts / anki.commands.ts 已覆盖），执行路径与搜索命中一致。
4. **底部快捷区：设置 / 导航 / 面板**
   - 静态入口组，复用现有 navigate 命令（settings.commands.ts / navigation.commands.ts）。
   - 搜索时输入"设置""导航""面板"等关键词亦可命中（注册为命令类别 `settings.*` / `nav.*` / `panel.*`，或直接复用现有命令的自然关键词）。

### B. 搜索模式（输入 ≥1 字符）

- 现有命令 + 资源搜索逻辑（`searchCommands` + `useResourceSearch`）**完全不动**。
- 推荐位隐藏，仅显示搜索结果分组（命令 / 文件 / 会话 / 最近 / 收藏）。
- 无结果时保留现有空态"未找到匹配的命令"（中文搜索缺陷待后续修复）。

## 行为变更

1. `sessionSearchOnly` 废弃：`openSessionSearch` 不再打开"仅会话搜索"模式，icon 与 ⌘K 统一打开推荐位首页。
2. 最近 / 收藏视图切换钮保留（viewMode 机制不动）。
3. Workbench 模式下 icon 行为不变（仍改道 `openAppsPanel`）。
4. 移动端全屏形态（返回钮 + visualViewport 收缩）保持。

## 技术要点

- 主体改造 `CommandPalette.tsx` / `CommandPaletteProvider.tsx`：新增 `homeMode` 概念（输入为空且非 recent/favorites 时渲染推荐位首页组件）。
- 新增 `HomeRecommendations.tsx`（推荐位组件）与 `recentSessions.ts`（会话拉取 hook，250ms 内不重复请求、打开即刷新一次）。
- 最近会话缓存：面板关闭不清空，下次打开直接展示缓存 + 后台刷新，避免闪烁。
- i18n：新增 `command_palette:home_*` 系列文案（zh-CN / en-US 双语言）。
- 现有测试更新：`SessionSidebarContent.test.tsx` 中 `sessionSearchOnly` 相关断言、`command-palette` 测试套件。

## 测试计划

- 推荐位首页渲染：最近会话 / 常用命令 / 快捷入口 / 底部快捷区四块均出现，空数据时各块优雅降级（隐藏或显示引导文案）。
- 交互：点击会话 → 触发 `navigate-to-session`；点击快捷入口 → 执行对应命令并关闭面板。
- 回归：⌘K 打开面板默认进入推荐位首页；输入字符后进入搜索模式，分组与现有行为一致；最近/收藏模式不受影响。
- 中文搜索已知缺陷：新增一条「预期失败」测试用例记录现状（`"备考"` 无结果），待中文修复后翻转断言。

## 后续（不在本次范围）

- 中文 FTS 修复：FTS 表加 cjk 按字索引列 + 查询侧按字切分（方案已定，涉及迁移、UDF 双注册点、`escape_fts5_query` 改造）。
- Workbench OS 模式下 icon 的同类升级。
