# 代理 7 状态文档 —— 平台基座与全局体验

## 任务目标
全面深入审阅并优化平台基座与全局体验域:数据治理(备份/恢复/审计/迁移)、云同步
(S3/WebDAV/FTP)、加密安全(crypto/secure_store)、应用装配(lib.rs/commands.rs/
capabilities)、可观测性(日志/崩溃/看门狗)、配置开关、应用壳(App.tsx/main.tsx/
layout/lazyComponents)、设置中心、命令面板、仪表盘统计、待办/番茄钟、基础 UI 库
(components/ui)、数据导入导出 UI、服务与主题、i18n、调试面板。
同时承担 commands.rs / lib.rs / App.tsx / locales 共享文件一致性仲裁。
低风险优化直接实施并验证;高风险方案登记等用户确认。

## 当前状态
【接力会话 #2 已接管,feed_id=F-YYPYX】磁盘危机已解除(E 盘清理后可用 261.7GB)。
工作区 target 在重建中(5.23GB,有 cargo/rustc 进程活跃,疑似上会话遗留或其他代理)。
本会话计划:先做读代码类审阅(T4/T5/T6),待构建锁空闲后补 cargo check + cargo test
backup/cloud/crypto 复验 O1/O2,再继续 T7-T13。
最后更新:2026-06-12 23:58

## TODO 计划
- [x] T1 备份/恢复:备份完整性(SQLite+Lance+Blob)、恢复原子性、大库性能(2026-06-12,核心路径已审,2 项修复待验证;backup_job_manager/commands_backup 细节为抽查)
- [x] T2 云同步:整改方案 D1-D11 标记全部在码(seq+游标/快照/检疫/统一LWW/契约v2/按设备墓碑/方向参数/VACUUM INTO/O1诚实化),收敛与冲突机制按方案落地;待 cargo test 跑同步单测复证(2026-06-12)
- [x] T3 加密:CryptoService AES-256-GCM+随机nonce、密钥0600(Unix)、SecureStore 随机种子派生+legacy迁移、云凭据 hydrate 全入口覆盖、Debug 全部 REDACTED、无凭据日志泄露;遗留 2 个低危建议见 F7/F8(2026-06-12)
- [ ] T4 commands.rs/lib.rs:命令注册一致性、错误转换规范、未注册/僵尸命令排查
- [ ] T5 Tauri capabilities 权限最小化(default/mobile/pomodoro-mini/test.json)
- [ ] T6 审计日志覆盖面与隐私(data_governance/audit,不记录敏感内容)
- [ ] T7 App.tsx 启动链路性能、懒加载切分合理性、全局状态初始化顺序
- [ ] T8 基础 UI 库:组件 API 一致性、design tokens、可访问性(焦点环/ARIA)
- [ ] T9 i18n:npm run check:i18n、中英 key 完整性、硬编码文案排查
- [ ] T10 更新器(useAppUpdater/plugin-updater)与崩溃恢复(config_recovery/crash_logger/anr_watchdog)
- [ ] T11 全局错误边界(ErrorBoundary)覆盖与降级体验
- [ ] T12 设置中心、命令面板、仪表盘/待办/番茄钟壳层体验快审
- [ ] T13 汇总:发现统计/已修复清单/待用户决策项,最终汇报
- [ ] T14 环境恢复:解决 npm ERESOLVE、补全 node_modules、恢复前端验证基线

## 审阅发现
| # | 文件/位置 | 类型 | 严重度 | 描述 | 处理 |
|---|-----------|------|--------|------|------|
| F1 | data_governance/backup/mod.rs `backup_single_database` / `backup_db_at_path` | bug | 中 | Busy/Locked 无重试上限,源库被长期锁定时备份线程无限挂起(恢复路径已有 P0 修复,备份路径漏改) | 已修复(上限 1200 次≈60s 无进展报错) |
| F2 | backup/mod.rs `restore_crypto_keys` | bug/安全 | 高 | 全局密钥文件(.master_key/.secure)恢复时直接覆盖且无快照;插槽式恢复只隔离了 DB,密钥覆盖立即生效;legacy 路径回滚也不还原密钥 → 恢复失败/放弃后旧加密数据永久无法解密 | 已修复(覆盖前快照到 backups/.pre_restore/crypto,rollback_from_pre_restore 回滚密钥;从 .pre_restore 自身恢复时跳过快照防自覆盖) |
| F3 | backup/mod.rs `backup_full`/`backup_with_assets`/`backup_tiered` | 坏味道 | 低 | 三个备份入口 ~80 行高度重复(DB 循环+密钥+审计库+工作区库) | 建议(重构属中风险,登记不动手) |
| F4 | backup/mod.rs lance 目录备份 | 一致性 | 中 | lance/ 向量目录按普通资产目录复制,备份期间 LanceDB 若在写入可能得到不一致快照(恢复后可重建,影响有限) | 建议(登记;重建机制已兜底) |
| F5 | commands_asset.rs `data_governance_restore_with_assets` | 一致性 | 低 | 该命令恢复到非活跃插槽但不恢复加密密钥,与 commands_restore.rs 主路径(恢复密钥)行为不一致;前端 UI 当前只用主路径 | 建议(UI 未使用,保持现状并登记) |
| F6 | 环境 | 环境 | 高 | E 盘满(target/ 占 96GB)导致一切写盘失败;node_modules 缺包+ERESOLVE;磁盘满还损坏了 target 内 time_macros DLL(LNK1104) | 已修复(删 incremental 33.7GB→55GB 可用;npm install --legacy-peer-deps 与 CI 一致,typecheck 通过;清理损坏产物重跑 cargo) |
| F7 | src-tauri/src/lib.rs:1874 | 健壮性 | 中 | `CryptoService::new(...).expect(...)`:.master_key 损坏(长度/Base64错误)时启动直接 panic,无恢复路径(config_recovery 不覆盖密钥文件) | 建议(改为可恢复错误+引导用户重置密钥,涉及启动链路属中风险,待用户确认) |
| F8 | secure_store.rs / crypto/mod.rs | 安全 | 低 | Windows 上 .master_key/.secure 无 ACL 收紧(仅 Unix 0600);本地单用户场景可接受 | 建议(登记备查) |
| F9 | secure_store.rs:417 `list_sensitive_keys` | 坏味道 | 低 | 永远返回空集,注释还停留在 keyring 时代;调用方若依赖它做"清理所有凭据"会漏删 | 建议(确认调用方后再处理) |
| F10 | lib.rs generate_handler | bug | 高 | 7 个 vfs::index_handlers 命令(vfs_unified_index_status/vfs_get_resource_units/vfs_reindex_unit/vfs_unified_batch_index/vfs_sync_resource_units/vfs_delete_resource_index/vfs_list_embedding_dims)定义了但从未注册,而前端 vfsUnifiedIndexApi/unifiedIndexStore/IndexStatusView/IndexDiagnosticPanel/vfsRagApi 一直在调用 → 这些 UI 操作运行时必报 "command not found" | 已修复(补注册,cargo check 验证中) |
| F11 | lib.rs generate_handler | bug | 中 | `preheat_mcp_tools`(cmd/mcp.rs:349)未注册,但设置页 MCP 编辑器重连按钮与 mcpService 启动预热都在调用;mcpService 把 not found 误判为"dev 环境不可用"静默吞掉,实际所有环境都不可用 | 已修复(补注册) |
| F12 | 命令注册一致性(全量扫描) | 坏味道 | 中 | 32 个 #[tauri::command] 定义未注册(除 F10/F11 外其余 24 个前端也不调用,属僵尸:textbooks_* 9 个、data_space 4 个、debug_commands 3 个、research 报告 4 个、check_anki_connect_availability、resource_get_content_from_vfs、test_rmcp_streamable_http、test_web_search_connectivity);另有 ~90 个前端 invoke 调用指向完全不存在的命令,其中大部分包装函数本身无人调用(死代码,集中在 utils/graphApi.ts、utils/settingsApi.ts research_*、api/debugDatabase.ts、services/resourceSyncService.ts) | 建议(僵尸命令与死包装器清理属删代码,登记待用户决策;明细见 %TEMP%/dead_invoke_analysis.txt 及本文档「跨组问题」) |
| F13 | DataImportExport.tsx:1130,1162 | bug | 高 | 「清空数据」按钮调用 purge_all_database_files 与 purge_active_data_dir_now,但这两个命令在 Rust 侧从未存在过(git 全历史 -S 检索为空)→ 确认对话框后必然报错,功能自始破损 | 登记待用户决策:方案A=暂时隐藏该入口;方案B=后端实现物理清空(破坏性命令,需谨慎设计);方案C=改走插槽体系(标记切换到空插槽+重启,与现有 data_space 架构一致,推荐) |
| F14 | features/settings/components/IndexMaintenanceSection.tsx:38 | bug | 中 | 设置页「索引维护」调用 rebuild_chat_fts,Rust 侧不存在该命令 → 按钮必报错;后端 chat FTS 重建逻辑归代理 1/2 域 | 跨组上报+本域 UI 跟进 |
| F15 | components/Dashboard.tsx | 坏味道 | 低 | 整个组件无人导入(已被 components/dashboard/* 替代),内部调用的 get_statistics 命令也不存在;纯死代码 | 建议(删除待用户决策) |
| F16 | src-tauri/capabilities/test.json + tauri.conf.json | 安全 | 高 | tauri.conf.json 未显式指定 `app.security.capabilities` → capabilities/ 目录下全部文件(含 test.json)在**所有构建**中生效;test.json 给 main 窗口放行 `https://*/*`+`http://*/*`,使 default.json/mobile.json 精心维护的 ~40 域名白名单形同虚设(2026-06-11 的安全评审结论"http 白名单无通配"实际不成立)。但注意:该通配目前是**承重墙**——前端 plugin-http 被 mcpService(自定义 MCP 服务器任意 URL)、VendorModelFetcher(自定义 OpenAI 兼容端点/LAN 地址)依赖,直接收紧会破坏这两个核心功能 | 建议(高风险,待用户决策:方案 A=把通配显式移入 default.json 并删 test.json,诚实化配置现状;方案 B=用户端点改走 Rust 代理后真正收紧白名单,需与代理 1 协同) |
| F17 | capabilities/default.json | 安全 | 低 | `core:webview:allow-internal-toggle-devtools` 在生产 capability 中,但 Cargo `devtools` feature 仅 dev 启用,生产为惰性权限;fs 桌面/文档/下载/图片目录递归读写较宽但符合本应用文档管理定位 | 建议(登记备查,无需改动) |
| F18 | data_governance/audit/mod.rs:22 | 坏味道 | 低 | 悬空 `#[cfg(feature = "data_governance")]` 只挂在 AuditLog 一个 struct 上(模块其余引用它的代码不受门控),若以 --no-default-features 构建会编译失败 | 已修复(移除该悬空 cfg) |
| F19 | data_governance/audit(T6 整体结论) | 体验 | 信息 | 审计覆盖面良好:迁移(coordinator)、备份(commands_backup)、恢复(commands_restore)、同步(commands_sync)均经 try_save_audit_log 落库,失败不阻断主流程且有 AuditHealthState 健康跟踪;隐私合规:仅记录路径/计数/耗时/错误消息,无用户内容;log_backup_start 等便捷方法仅测试使用(生产直接构造 AuditLog,可接受) | 无需处理 |
| F20 | App.tsx + lazyComponents.tsx | 性能 | 中 | 懒加载被 barrel 导入打穿:App.tsx 静态导入 features/settings、features/todo、features/pomodoro、features/learning-hub 的 barrel,而 barrel 同时再导出重页面(Settings/TodoPage/PomodoroPanel/LearningHubPage);其中 LazyLearningHubPage 还动态导入同一 barrel → Rollup 规则下 LearningHubPage **必然**并入首屏 chunk,代码分割完全失效;其余页面在 dev 必然全量加载、prod 依赖摇树不可靠 | 已修复(App.tsx 4 处改深路径导入;LazyLearningHubPage 改深路径动态导入;typecheck 通过) |
| F21 | main.tsx | 性能 | 低 | console.warn/error 被三层包装(早期过滤器+tauri_lab_frontend_log 桥+plugin-log forward),每条 warn/error 触发 1-2 次 IPC 且 tauri_lab 桥无节流、prod 也启用;窗口错误经 bridge 与 report_frontend_log 双路上报 | 建议(登记;若日志量大可给 tauri_lab 桥加节流或 dev-only) |
| F22 | main.tsx:431-444 | 坏味道 | 低 | StrictMode 仅在 production 启用而 dev 移除——StrictMode 的双调用诊断只在 dev 生效,生产是 no-op,等于全程无 StrictMode 检查;注释意图与 React 行为相反 | 建议(登记;恢复 dev StrictMode 需先清理双执行噪声,中风险) |
| F23 | src/locales/zh-CN/todo.json | bug | 低 | overdue.badgeAria/notificationBody 中文缺 i18next 复数后缀键(_other),带 count 调用时中文环境回落英文 | 已修复(补 _one/_other 键,check:i18n:missing 清零) |
| F24 | i18n 全局(T9 结论) | 体验 | 中 | check:i18n 通过(41 命名空间齐全、配置正确);但全仓硬编码中文 2464 处,本域大头 ModernSidebar.tsx 47 处、SkillsManagementPage 54 处;其余多属业务组 | 建议(本域 ModernSidebar 待办;全仓清理需各组协同,工程量大) |

## 已实施的优化
| # | 改动文件 | 改动说明 | 验证结果 |
|---|----------|----------|----------|
| O1 | src-tauri/src/data_governance/backup/mod.rs | `backup_single_database`、`backup_db_at_path` 增加 Busy/Locked 重试上限(≈60s 无进展即报错),与恢复路径 P0 修复对齐 | cargo check 待复验(首检 9m21s 通过但与编辑窗口重叠,需重跑) |
| O2 | src-tauri/src/data_governance/backup/mod.rs | `restore_crypto_keys` 覆盖前快照当前密钥至 .pre_restore/crypto(从 .pre_restore 恢复时跳过快照防自覆盖);`rollback_from_pre_restore` 增加密钥回滚 | 同上 |
| O3 | src-tauri/src/lib.rs | generate_handler 补注册 7 个 vfs::index_handlers 命令 + preheat_mcp_tools(F10/F11) | cargo check 验证中 |
| O4 | src-tauri/src/data_governance/audit/mod.rs | 移除悬空 #[cfg(feature = "data_governance")](F18) | 随 cargo check 一并验证 |
| O5 | src/App.tsx、src/lazyComponents.tsx | barrel 深路径化×5,修复懒加载分包失效(F20) | typecheck ✅(159s) |
| O6 | src/locales/zh-CN/todo.json | 补 overdue 复数键(F23) | check:i18n:missing ✅ 清零 |

## 跨组问题(发现但不属于本组职责域)
| # | 涉及文件 | 问题描述 | 建议归属代理 |
|---|----------|----------|--------------|
| X1 | src/features/chat/dev/playground/eval/cases.ts 等 22 文件 | 前端存活代码调用 `chat_v2_send`,Rust 侧无此命令(chat_v2 实际入口命令名不同?需核实调用路径是否真的可达) | 1 |
| X2 | src/services/ankiApiAdapter.ts → ankiCompletionNotifier.ts | `generate_anki_cards_for_segment` 被调用但 Rust 无实现 | 5 |
| X3 | src/components/anki/cardforge/engines/TaskController.ts | `get_document_state` 被调用但 Rust 无实现(仅 examples 引用,可能可达性低) | 5 |
| X4 | src/utils/graphApi.ts(unified_track_card_access/unified_get_card_stats/unified_generate_tag_hierarchy_preview_stream/unified_import_tag_hierarchy_from_content_stream)+ NoTagTreeShadPanel.tsx/cardAccessTracker.ts/cardHelpers.ts | 存活 UI 调用这些 unified_* 命令,Rust 侧不存在 → 标签层级生成/卡片访问统计等功能必报错 | 6(知识导图/标签)、5(卡片) |
| X5 | src/services/templateService.ts | 调用 get_statistics(Rust 无实现) | 5 |
| X6 | src/utils/chatApi.ts research_list/get/delete/export_all_reports + commands.rs:4273-4310 | research 报告命令 Rust 已实现但未注册,前端包装器也无人调用;另有 ~25 个 research_* 调用完全无 Rust 实现(settingsApi.ts),整个调研报告 API 面呈半拆除状态 | 1 |
| X7 | src/services/resourceSyncService.ts | resource_check_sync_needed/resource_sync_exam/resource_sync_note/resource_sync_textbook_pages 无 Rust 实现(包装器当前无人调用) | 2 |
| X8 | src-tauri/src/cmd/textbooks.rs(9 个 textbooks_* 命令) | 定义未注册且前端不调用,疑似已被 vfs_list_textbooks 等取代的遗留实现 | 2/3 |
| X9 | src/features/chat/context/vfsRefApi.ts | vfs_update_resource_hash 无 Rust 实现(调用方可达性待核实) | 2 |

## 共享文件改动登记
| # | 文件 | 改动段落/函数 | 原因 |
|---|------|---------------|------|
| S1 | src-tauri/src/lib.rs | generate_handler! 列表:vfs_get_all_index_status 之后插入 7 个 crate::vfs::index_handlers::* 注册;export_mcp_config 之后插入 crate::commands::preheat_mcp_tools | F10/F11 修复(注册一致性是本组仲裁职责) |
| S2 | (备注)lib.rs 工作区另有他组改动:crate::commands::cancel_document_processing 注册(+1 行,文档处理域→代理 3),与本组改动不冲突 | — | — |

## 接力须知
- 会话 #2(接力)2026-06-12 23:58 接管,feed_id=F-YYPYX(mcp-feedback-enhanced)。
- 磁盘已不再紧张:E 盘可用 261.7GB(用户授权清理了回收站/旧副本 ds91 的 target/kali 虚机/MuMu 镜像)。
  注意 E:\ds91\ai-mistake-manager 是本项目的旧副本,其 target 已删,与工作区无关。
- 会话 #1(2026-06-12 启动),feed_id=F-P92NC(mcp-feedback-enhanced)。
- 工作方式:按 TODO 顺序逐项审阅;每完成一个审阅单元立即更新本文档。
- 验证命令见 docs/6.12/README.md 3.4;后端改动需 `cargo check`(在 src-tauri/ 下,首次约 9-10 分钟)。
- 前端验证基线当前不可用:node_modules 缺包 + npm ERESOLVE(见 T14),修好前 typecheck/lint/test 的失败不一定与代码改动相关。
- 磁盘紧张:E 盘曾满;若再次空间不足可删 src-tauri/target/debug/incremental(可再生)。
- 未经用户明确要求不得 git commit/push。
- 生产恢复链路 = commands_restore.rs(恢复到非活跃插槽→重建同步基线→轮换设备ID→标记重启切换);legacy restore_with_assets/restore 主要被测试使用。
