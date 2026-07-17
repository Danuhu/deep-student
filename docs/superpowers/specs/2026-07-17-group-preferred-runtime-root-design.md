# 课题首选 Runtime Root 设计

日期：2026-07-17

## 目标

课题（`SessionGroup`）可绑定本机已授权的 **runtime root**，使该课题会话内 shell / 只读文件工具在**未显式传 `root_id`** 时默认落在该目录。

## 非目标

- 不复用 / 不改变多 Agent 的 `workspaceId`
- 不通过「设为工作区」(`set_workspace_root`) 实现课题绑定
- 本阶段不把 `authorized_*` 提升为可写工作区（授权根保持现有 RO 语义）
- 不引入裸绝对路径作为执行 cwd（必须经 `runtime_root_by_id`）

## 数据模型

表：`chat_v2_session_groups`

| 列 | 类型 | 同步 | 说明 |
|----|------|------|------|
| `default_runtime_root_id` | TEXT NULL | 同步（LWW） | `workspace` 或 `authorized_*`；未绑定为 NULL |
| `preferred_project_root_path` | TEXT NULL | **不同步**（local-derived） | 本机展示用绝对路径缓存；跨机忽略 |

API / TS 字段（camelCase）：

- `defaultRuntimeRootId?: string | null`
- `preferredProjectRootPath?: string | null`（仅本机展示；清空绑定一并清）

## 行为

1. **缺省注入**：`local_shell_*`、只读 workspace FS（list/read）在 args 无 `root_id`/`rootId` 时，使用会话所属课题的 `default_runtime_root_id`；`cwd` 仍默认 `"."`。
2. **显式优先**：模型/调用方传入的 `root_id`（含 `temp`/`artifacts`/`workspace`）一律覆盖课题默认。
3. **失效降级**：本机找不到该 root（未授权 / 已 revoke）→ 降级为 `workspace`，不抛致命错误阻断整轮；日志可记 warn。
4. **写工具**：不因课题绑定放宽；写路径仍遵守现有 root access（authorized 只读）。
5. **绑定校验**：create/update group 时若提供 `defaultRuntimeRootId`，必须本机 `runtime_root_by_id` 可解析；空字符串表示清除。
6. **移组**：前端更新 session metadata snapshot（与 `groupSystemPromptSnapshot` 同模式）；后端执行以 DB 课题字段为准。

## UI

`GroupEditorDialog` 增加「默认项目目录」：

- 列出 `chat_v2_list_runtime_roots`（workspace + authorized）
- 浏览目录 → `chat_v2_authorize_runtime_root` → 选中绑定
- 清除绑定
- 展示 path 用 `preferredProjectRootPath` 或 roots 列表中的 path

## 关键注入点（后端）

- `approval_scope::normalized_shell_runtime_location` 增加可选 default，或在调用前把缺省 `root_id` 写入 args
- `tool_loop` 审批路径与 execute 路径使用同一规范化后的 args
- `workspace_fs_executor` 读/列缺省一致
- **权威来源**：session → `group_id` → group 行；前端 SendOptions 透传仅作可观测/兜底，不可信任覆盖未校验 id

## 测试最低集

- Migration 可幂等应用；repo CRUD 读写新列
- Sync：`preferred_project_root_path` 不进入上行；`default_runtime_root_id` 进入
- Shell：缺 `root_id` 注入课题 root；显式 `root_id` 不被覆盖；失效降级 workspace
- FE：类型/编辑器提交字段；移组 snapshot；适配器透传（若实现）

## 已锁定取舍

- 方案 A：绑定 root_id（非切全局 workspace、非纯 prompt）
- 授权根本阶段保持只读
- path 列 device-local
