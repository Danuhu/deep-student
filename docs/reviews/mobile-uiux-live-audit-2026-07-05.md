# Deep Student 移动 UI 实测审查（2026-07-05）

环境：400×880（android-default）· `npm run ui:lab` · **ui-drive CLI**（不依赖 Cursor MCP 重启）

截图目录：`/tmp/ds-mobile-audit/shots/`（本机审查产物，未入库）

## 已覆盖页面

| 页面 | 截图 | 备注 |
|------|------|------|
| 聊天首页 | `01-chat-home-initial-s.png` | 空态正常 |
| 学习资源 | `03-learning-hub-s.png` | 空文件夹 |
| 待办 | `05-todo-s.png` | 收件箱 + 番茄钟 |
| 技能管理 | `06-skills-s.png` | 列表密集 |
| 制卡任务 | `11-task-dashboard-s.png` | 统计卡片区偏高 |
| 模板管理 | `12-templates-s.png` | 模板预览双栏 |
| 设置 | `13-settings-s.png` | **Sheet 叠在模板页上** |

## 确认问题（按优先级）

### P0 — 抽屉上下双栏未融合（架构）

`MobileSlidingLayout` 将**页内 sidebar**（会话/模板/待办工具等）与 **`MobileSidebarNavigation`**（全局 8 项）上下堆叠，中间 `border-t` 硬切，背景/滚动独立——与用户截图（聊天页、模板页）一致。桌面 `ModernSidebar` 为单一面板。详见 [mobile-uiux-interaction-tree-2026-07-05.md](./mobile-uiux-interaction-tree-2026-07-05.md)。

### P1 — 设置以 Sheet 叠层打开，底页仍可见

从「模板管理」进设置时，底部 Sheet 弹出，但顶栏仍显示 **「Anki制卡 > 卡片模板管理」**，用户会误以为还在模板页而非设置全屏。移动壳应改为全屏 `Settings` 视图或 Sheet 遮罩 + 独立标题。

### P1 — 学习资源空态提示含「右键」

空文件夹文案：**「点击上方按钮或右键新建」**，并展示「右键」pill。触屏设备无右键，应改为「长按 / 点 + 号」类表述（与 mobile-uiux-review 空态规范一致）。

### P1 — 侧栏下半区导航项需滚动才稳定可点

抽屉高度 880px 时，「制卡任务 / 模板管理 / 设置」贴底（y≈754–835）。从聊天页打开侧栏时，若未滚到底，自动化/用户都可能点不到——**应对 `@nav` 区做独立滚动或压缩上方 Todo 侧栏占位**。

### P2 — 控制台 React 警告（多页复现）

- `ChatV2Page` → `AppMenu`：**列表子项缺少 `key`**
- `TodoSidebar` → `NotionButton`：**`<button>` 嵌套 `<button>`**（validateDOMNesting）

不影响功能但说明移动 Todo/Chat 菜单 DOM 结构有问题。

### P2 — 无障碍/i18n 英文泄漏

- 技能管理页头按钮 aria/name 为 **`create`**（应为中文或 i18n key）
- 模板页 breadcrumb **「Anki制卡 >」** 在 400px 宽下挤压中间标题

### P2 — 技能卡片「启用」开关触控目标过小

快照显示「启用」按钮约 **36×18px**，低于 44px 触控规范；卡片整体可点但开关难戳。

### P2 — 制卡任务 Dashboard 首屏信息密度

统计区 + 「管理模板」大按钮占满首屏，任务列表需滚动才见；移动可考虑折叠统计或改为 Tab。

### P3 — 模板预览在窄屏仍并排双预览

「正面 / 背面」两列 E-Ink 预览在 400px 下可读但拥挤，建议移动改为单列堆叠。

## 工具链说明（给后续审查）

MCP **`dstu-ui-drive`** 已写入：

- 项目：`.cursor/mcp.json`
- 用户：`~/.cursor/mcp.json`

**Cursor 必须 Reload Window 后才会加载新 MCP**；当前会话已改用 CLI，效果等价：

```bash
npm run ui:lab          # 启动
npm run ui:drive -- snapshot --text
npm run ui:audit-mobile # 自动扫页 + 报告
npm run ui:lab:stop
```

## 下一步建议

1. 修 P1：设置移动导航、学习资源空态文案、侧栏 nav 滚动
2. 修 P2：ChatV2 AppMenu key、TodoSidebar 按钮嵌套、create 按钮 i18n
3. Reload Cursor 后启用 `dstu-ui-drive` MCP，后续审查可完全工具化

---

## 第二轮逐页走查（同日，已修复项）

按场景图 A–E 段人工逐页走查（chat 真实对话使用 SiliconFlow key 验证收发/思维链/标题生成均正常）。本轮新发现并**当场修复**：

| # | 问题 | 根因 | 修复 |
|---|------|------|------|
| 1 | 设置 Sheet 非全屏：顶部露出底页顶栏（z-1100 压住 z-50 sheet），可视高度仅 748px | `SheetContent side=bottom` 基类 `max-h-[85dvh]` + 圆角 + z-50 | `App.tsx` mobile-settings-sheet 覆写 `top-0 !h-[100dvh] !rounded-none !z-[1200]`，overlay `!z-[1190]`；设置在移动端为全屏页呈现（**不使用抽屉**，chip rail 切 tab） |
| 2 | 输入栏组合面板（技能/附件/参数）在**切走视图后残留悬浮**在新页面上（命令面板/程序化导航等无 pointerdown 的路径） | 面板 portal 到 body，宿主视图 `visibility:hidden` 不影响它 | `App.tsx` setCurrentView 广播 `app:view-switched`；`InputBarUI` 监听并关闭全部面板 |
| 3 | 对话控制面板「上下文长度」数值 887232 被固定 `w-12` 裁剪成 88723 | `SnappySliderValue` 输入框定宽 | 按值位数 `ch` 自适应宽度（`SnappySlider.tsx`） |
| 4 | 待办详情覆盖层只有 ~335px 高，字段被裁剪、下方大片空白 | `TodoMainPanel` 根节点 `flex-1` 在 MobileSlidingLayout 内容窗格（非 flex 容器）中塌缩 | 根节点补 `h-full` |
| 5 | 待办详情「截止日期」标签折行成两行 | 标签列 `w-16` 放不下 icon+四字 | 统一放宽为 `w-[4.75rem]`（11 处） |
| 6 | 命令面板在移动端显示 ⌘ 快捷键徽章与 `↑↓/↵/Esc` 键盘提示 | 桌面组件未做移动裁剪 | `CommandPalette.tsx` 小屏隐藏快捷键徽章与底部键盘提示 |
| 7 | 设置 chip rail 程序化切 tab（如跳转数据治理）后激活 chip 在可视区外 | rail 无 scrollIntoView 联动 | `Settings.tsx` activeTab 变化时 `scrollIntoView({inline:'center'})` |

走查确认正常：chat 真实收发/思维链折叠/消息操作菜单/token 统计、附件资源库选择器往返、会话抽屉分组展开、LH Finder 打开笔记编辑器并返回、待办快捷添加（`!高` 解析）、番茄钟面板、设置 模型服务/模型分配/常规/外观/MCP/数据治理 tab 内容完整渲染。

配套契约测试更新：`chatV2MobileSidebarLayerContract.test.ts` 由「抽屉打开时隐藏顶栏」改为「顶栏保持可见、汉堡按钮承担开/关切换」（与统一抽屉设计一致）。
