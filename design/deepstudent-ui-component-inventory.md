# DeepStudent UI 组件混用清单

日期：2026-04-28  
分支：`feat/study-ui-migration`  
Worktree：`/Users/ba7mlv/Documents/Coding/deep-student/.worktrees/study-ui-migration`

## 扫描口径

- 扫描范围：`src/` 和 `study-ui/src/`
- 计入文件：1188 个产品源码文件，其中 520 个 TSX 文件
- 排除：测试文件、`*.source.test.*`、`src/debug-panel/`、`src/mcp-debug/`、`src/components/dev/`
- 数字含义：`refs/files` 表示 JSX 或原生标签出现次数 / 涉及文件数；`imports/files` 表示 import 语句次数 / 涉及文件数
- 注意：这是静态扫描，用于人工校对真实页面状态；不会替代浏览器中的视觉核对

## 总览结论

当前 DeepStudent 同时存在三套 UI 入口：

1. 主应用现行入口：`NotionButton`、`NotionDialog`、`src/components/ui/shad/*`、`AppMenu`、`CustomScrollArea`、`UnifiedSidebar`
2. 迁移实验入口：`study-ui/src/components/ui/*`、`study-ui/src/components/shell/*`
3. 旧/业务直写入口：原生 `<button>`、`<input>`、`<select>`、`<textarea>`，以及业务组件内部自定义 panel/card/menu 样式

`src/components/style-lab/StyleDebugPage.tsx` 里的指标需要刷新：

| 指标 | 页面当前写死值 | 当前静态扫描值 |
|---|---:|---:|
| Native buttons | 177 | 184 refs / 66 files |
| Native controls | 195 | 198 refs / 83 files |
| CSS `!important` | 1,568 | 1,621 |
| NotionButton refs | 302 | 301 import files；1560 JSX refs / 301 files |

## 混用组件族

| 组件族 | 当前入口 | 当前信号 |
|---|---|---|
| Button | `NotionButton` 301 imports / 301 files；main `shad/Button` 1 / 1；`study-ui Button` 5 / 5；`ShellButton` 2 / 2；原生 `<button>` 184 refs / 66 files | `NotionButton` 已是主入口；`study-ui Button` 是迁移实验入口；原生按钮仍是最大遗留面 |
| Dialog / Overlay / Menu | `NotionDialog` 52 / 52；main `shad Sheet/Popover/Tooltip` 13 / 13；`study-ui Dialog/Sheet/Tooltip/DropdownMenu` 7 / 4；`AppMenu` 47 / 46；原生 `details/summary` 6 / 6 | 弹层、Sheet、菜单当前是最明显的多入口区域 |
| Form controls | main `shad Input/Textarea/Switch/Checkbox/Slider/Label/Combobox/Command/Popover` 165 / 90；`study-ui Input/Textarea/Switch` 6 / 3；`AppSelect` 49 JSX refs / 23 files；原生 input/select/textarea 198 refs / 83 files | 输入控件已经有 shad 主路径，但选择器和原生控件仍分散 |
| Surface / Card | main `shad Card` 31 / 31；`study-ui Card/Surface` 6 / 4 | `Card` 和 `Surface` 的语义边界需要人工确认：业务 panel 是否该继续自定义 |
| Tabs | main `shad Tabs` 16 / 16；`study-ui Tabs` 2 / 2 | 两套 Tabs 同时存在，迁移期间需要避免页面内混搭 |
| Sidebar / Shell / Layout | `ModernSidebar` 1 / 1；`UnifiedSidebar` 8 / 8；main layout 19 / 19；`study-ui shell` 2 / 2 | 主应用 Shell 与 `study-ui` Shell 并行，导航行、标题栏、窗口控制需要重点校对 |
| Scroll | `CustomScrollArea` 111 / 111；main `shad ScrollArea` 0 / 0 | 滚动容器基本集中在 `CustomScrollArea` |
| Feedback / Status | main `shad Badge/Alert/Progress/Skeleton` 101 / 82；`UnifiedNotification/NotificationContainer` 146 / 144 | 状态展示分为局部 badge/progress 和全局 notification 两类 |
| Icons | `lucide-react` 370 / 365；主应用 Phosphor 20 / 11；`study-ui` Phosphor 20 / 9；自定义 `StudySidebarIcons` 4 / 4 | 主应用以 lucide 为主，`study-ui` 以 Phosphor 为主，图标体系明显混用 |
| Specialist widgets | CodeMirror 15 / 5；Milkdown 22 / 6；Recharts 6 / 6；XYFlow 21 / 21；DnD libs 35 / 14；resizable panels 5 / 5 | 这些是领域型组件，不建议强行并入通用 primitive，但需要统一外层 shell/token |

## 当前可用主应用组件

### `src/components/ui`

- `CommandPalette`
- `NotionButton`
- `NotionDialog`
- `ProviderIcon`
- `SiliconFlowLogo`
- `SnappySlider`

### `src/components/ui/shad`

- `Alert`
- `Badge`
- `Breadcrumb`
- `Button`
- `Card`
- `Checkbox`
- `Collapsible`
- `CollapsibleModelSelector`
- `Combobox`
- `Command`
- `Dialog`
- `Input`
- `Label`
- `Popover`
- `Progress`
- `ScrollArea`
- `Separator`
- `Sheet`
- `Skeleton`
- `Slider`
- `Switch`
- `Table`
- `Tabs`
- `TagInput`
- `Textarea`
- `Tooltip`

### `src/components/ui/app-menu`

- `AppMenu`
- `AppMenuContent`
- `AppMenuGroup`
- `AppMenuItem`
- `AppMenuSeparator`
- `AppMenuSwitchItem`
- `AppMenuTrigger`
- `AppSelect`

### `src/components/ui/unified-sidebar`

- `MobileSidebarLayout`
- `SidebarDrawer`
- `SidebarSheet`
- `UnifiedSidebar`
- `UnifiedSidebarSection`

## 当前可用 study-ui 组件

### `study-ui/src/components/ui`

- `button`
- `card`
- `dialog`
- `dropdown-menu`
- `input`
- `sheet`
- `surface`
- `switch`
- `tabs`
- `textarea`
- `tooltip`

### `study-ui/src/components/shell`

- `AppChrome`
- `FramelessResizeHandles`
- `ShellButton`
- `Sidebar`
- `SidebarUpdateBadge`
- `Titlebar`
- `WindowControls`

## 人工校对建议

优先校对这些真实页面区域：

1. 样式调试台：`src/components/style-lab/StyleDebugPage.tsx`
2. 主 Shell：`src/App.tsx`、`src/components/ModernSidebar.tsx`、`src/components/layout/*`
3. Chat V2：`src/chat-v2/pages/ChatV2Page.tsx`、`src/chat-v2/components/input-bar/InputBarUI.tsx`
4. Settings：`src/components/Settings.tsx`、`src/components/settings/*`
5. Learning Hub / Notes：`src/components/learning-hub/*`、`src/components/notes/*`
6. study-ui demo shell：`study-ui/src/App.tsx`、`study-ui/src/components/shell/*`、`study-ui/src/components/content/*`

人工校对时建议按组件族逐项看：

- Button：默认、hover、active、focus、disabled、icon-only、nav row
- Dialog / Sheet / Menu：overlay、圆角、阴影、关闭按钮、focus ring、移动端高度
- Form controls：输入框、选择器、textarea、switch、disabled/error/loading
- Surface / Card：页面背景、panel 背景、卡片边框、阴影、圆角密度
- Sidebar / Shell：折叠态、选中态、hover、标题栏、窗口控制、macOS safe area
- Icon：lucide 与 Phosphor 同屏时的线宽、尺寸、视觉重量
