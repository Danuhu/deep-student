# 代理 2 状态文档 —— 统一数据层与资源中心

## 任务目标
全面审阅 + 低风险优化以下职责域(详见 agent-2.md):
- 后端:VFS(vfs/ 全目录含 repos)、向量存储(lance_vector_store.rs、vector_store.rs、vfs/lance_store.rs)、DSTU 协议(dstu/)、数据库(database/、migrations/、models.rs、database_optimizations.rs)、文件管理(file_manager.rs、unified_file_manager.rs、data_space.rs、textbooks_db.rs、package_manager.rs)、文档处理调度(document_processing_service.rs、background_tasks.rs、startup_cleanup.rs)
- 前端:learning-hub(资源中心)、src/dstu、资源相关 api/stores
- 共享文件 models.rs 本组是一致性负责人
- 不动:OCR 实现(代理3)、备份/云同步(代理7)、commands.rs 整体架构(代理7)

## 当前状态
TODO 1-10 审阅完毕,9 项修复已实施且 **cargo check 通过**(独立 target-agent2 目录,9m04s,exit 0,仅既有警告)。`cargo test --lib vfs::` 后台运行中。剩余:TODO 11 汇总报告 + 测试结果确认。最后更新:2026-06-12 23:25

## TODO 计划
- [x] 0. 创建状态文档,摸清目录结构(2026-06-12)
- [x] 1. SQLite:SQL 注入防护(参数化检查)、事务边界、迁移可重入性、索引有效性(2026-06-12)
- [x] 2. 向量化流水线:队列调度、失败重试、断点续传、状态上报准确性(2026-06-12)
- [x] 3. Embedding 维度/模型切换:索引兼容与重建策略(2026-06-12)
- [x] 4. LanceDB 读写路径:错误处理、并发安全、损坏恢复(2026-06-12)
- [x] 5. DSTU 协议:路径遍历、权限校验、资源访问控制(2026-06-12,结论:防护完整,无新发现)
- [x] 6. 文件管理:SHA256 去重、孤儿 Blob 清理、磁盘占用(2026-06-12,结论:两阶段删除+tombstone+启动清扫完备)
- [x] 7. 删除级联清理:SQLite 元数据 + Lance 向量 + Blob 三处一致性(2026-06-12,与 TODO 2/6 合并审阅,F3/F4 修复即此项)
- [x] 8. models.rs / vfs/types.rs:serde 兼容性、前端类型同步(2026-06-12,结论:55 个 Serialize 结构体全部 camelCase,与前端 TS 接口对齐)
- [x] 9. 资源中心 UI:列表虚拟化、搜索防抖、向量化状态轮询(2026-06-12,结论:三项全部达标,无需改动)
- [x] 10. DSTU 前端 api 封装审阅(2026-06-12,结论:已有多轮加固,无新发现)
- [ ] 11. 汇总审阅报告(等待 cargo test 结果,然后向用户最终汇报)

## 审阅发现
| # | 文件/位置 | 类型 | 严重度 | 描述 | 处理 |
|---|-----------|------|--------|------|------|
| F1 | vfs/repos 6 个文件(exam/translation/textbook/resource/essay/question_repo) | bug | 中 | 搜索路径未转义 LIKE 通配符 `%`/`_`,用户搜索含这些字符时结果错误(todo_repo/note_repo 已有正确实现,其余 6 个漏掉,共 7 处调用点) | 已修复:repos/mod.rs 新增共享 escape_like_pattern,7 处调用点全部加转义 + ESCAPE 子句 |
| F2 | vfs/repos/exam_repo.rs 3 处(purge/restore/delete) | 安全 | 低 | SAVEPOINT 名称用外部传入的 exam_id 拼接,仅替换 `-`;rusqlite 单语句限制使实际不可注入,但属纵深防御缺口 | 已修复:新增 sanitize_savepoint_suffix,只保留字母数字下划线 |
| F3 | vfs/index_service.rs delete_resource_index | bug | 中 | 删除索引时先删 SQLite units 再由调用方删 Lance 向量;若调用方失败/进程崩溃,向量永久孤儿(元数据已丢,无法重试)。已有 __lance_orphan_queue 基础设施但此路径未接入 | 已修复:改用 purge_index_artifacts_by_resource(入列后删除,后台 drain 兜底,幂等) |
| F4 | vfs/indexing.rs:1670(废弃的 index_resource) | bug | 低 | 废弃方法重建索引时直接删 units,若资源曾被新服务索引过会孤儿化真实向量 | 已修复:同 F3 改用 purge 变体 |
| F5 | vfs/repos/path_cache_repo.rs invalidate_by_path_prefix | 坏味道 | 低 | LIKE 前缀含 `%`/`_` 时过度失效(超集匹配);对缓存失效来说方向安全(宁可多删),不改 | 建议保持现状,已记录 |
| F6 | vfs/repos/embedding_repo.rs set_index_state / set_mm_index_state | bug | 中 | 索引成功转 indexed 时不重置 index_retry_count;历史失败 3 次的资源被编辑后重新入队,首次失败即被 claim_for_indexing 的 retry<3 条件拒之门外,直接卡 failed | 已修复:状态转 indexed 时连带清零对应 retry_count |
| F7 | vfs/indexing.rs index_additional_pending_text_units 错误早退路径 | bug | 中 | OCR 文本块嵌入失败 early-return 时资源停留 indexing 状态,UI 永远显示"索引中",需重启应用才被 recover_stuck_indexing 兜底 | 已修复:早退前显式 mark_failed(可重试) |
| F8 | vfs/lance_store.rs delete_by_embedding_ids | bug | 中 | 逐表删除失败仅 warn 后继续,函数恒返回 Ok;孤儿队列 drain 误以为删除成功而出列,LanceDB 故障期间孤儿向量永久丢失 | 已修复:收集首个错误并返回 Err,失败条目留在队列等下轮重试 |
| F9 | vfs/lance_store.rs ensure_table | 性能 | 低 | 每次搜索/写入都重发 2 个 create_index 请求(靠 "already exists" 报错当 no-op),高频检索下网络/IO 开销可观 | 已修复:进程内 ensured_tables 缓存,双索引确认就绪才入缓存;drop_table 同步失效 |
| F10 | lance_vector_store.rs emb_cache | 性能 | 低 | 嵌入缓存按条数(10000)封顶不看维度,4096 维 float32 时理论峰值 ~160MB 内存 | 仅记录,改动涉及缓存策略权衡,待用户决策 |
| F11 | database/mod.rs list_anki_library_cards | bug | 低 | Anki 卡片库搜索 LIKE 未转义通配符(F1 同类,database/ 属本组);用户搜 `%`/`_` 结果错误 | 已修复:复用 vfs::repos::escape_like_pattern + ESCAPE 子句(O7) |

## 已实施的优化
| # | 改动文件 | 改动说明 | 验证结果 |
|---|----------|----------|----------|
| O1 | vfs/repos/mod.rs | 新增共享 escape_like_pattern helper | cargo check ✅ |
| O2 | vfs/repos/{exam,translation,textbook,resource,essay,question}_repo.rs | F1:7 处搜索加 LIKE 转义 + ESCAPE;F2:exam_repo 3 处 SAVEPOINT 名称消毒 | cargo check ✅ |
| O3 | vfs/index_service.rs、vfs/indexing.rs | F3/F4:删除索引路径接入 __lance_orphan_queue | cargo check ✅ |
| O4 | vfs/repos/embedding_repo.rs | F6:indexed 状态转换时重置 retry_count(text/mm 两处) | cargo check ✅ |
| O5 | vfs/indexing.rs | F7:OCR 嵌入失败早退前 mark_failed | cargo check ✅ |
| O6 | vfs/lance_store.rs | F8:delete_by_embedding_ids 错误传播;F9:ensure_table 就绪缓存 + drop_table 失效 | cargo check ✅ |
| O7 | database/mod.rs list_anki_library_cards | F11:Anki 搜索 LIKE 转义(复用共享 helper) | 待增量 cargo check(在 O1-O6 验证后追加) |

## 域内审阅结论(无需改动的部分)
- **TODO 5 DSTU 协议**:DSTU 路径是纯虚拟路径(DB 查询,非文件系统);folder_handlers 对标题做控制字符/Unicode 全角绕过/路径分隔符/`..` 四层校验(历史 CRITICAL-003、HIGH-R002/R003、MEDIUM-009 修复);blob 物理路径由 hash 派生 + DB 登记的 relative_path,不接受用户路径;dstu_export 只返回字节由前端对话框落盘,后端无任意路径写入。path_parser::is_valid_path 含遍历测试用例。无新风险。
- **TODO 6 文件管理**:store_blob 原子写(唯一 tmp 名 + rename)、SHA256 去重 + ON CONFLICT 引用计数、同 hash 异扩展名复用既有路径(M1 修复);两阶段删除(事务内只减计数,提交后 cleanup_unreferenced 删文件);启动时清扫 ref_count=0 残留 + 24h 过期 tmp 文件;tombstone 队列(__blob_deletion_queue)供云同步传播。设计完备。
- **TODO 8 serde 同步**:vfs/types.rs 55 个 Serialize 结构体 57 处 rename_all="camelCase" 全覆盖;抽查 ResourceIndexStatus/IndexStatusSummary 后端字段与前端 vfsUnifiedIndexApi.ts TS 接口逐字段对齐。
- **TODO 9 资源中心 UI**:FinderFileList 列表/网格双模式均用 @tanstack/react-virtual 虚拟化(overscan 5/2);搜索 300ms useDebounce + finderStore 请求 ID 竞态防护;向量化状态用事件推送(vfs-index-progress)而非轮询,IndexStatusView 有 requestId + mountedRef 双保护。
- **TODO 10 DSTU 前端封装**:src/dstu/api.ts Result 模式统一错误处理,缓存失效静态导入防竞态(FIX-D001),路径提取有长度限制 + 非回溯正则防 ReDoS(FIX-D003)。无新发现。
- **辅助模块抽查**:background_tasks.rs(全局 TaskTracker + 5s 优雅关闭,设计良好);vector_store.rs(纯 trait 定义);unified_file_manager.rs(Android SAF/本地路径分类,保留 content:// 原始编码语义正确;本地路径来自系统文件对话框,符合桌面应用信任模型);document_processing_service.rs(Anki 文档分段,功能正常,存在 println! 调试日志的风格问题,未改动以免和代理4 的 Anki 域重叠);database/mod.rs settings 前缀 LIKE 为内部输入,安全。data_space.rs 浅层过目(槽位切换,与代理7 备份域交界,未深审)。

## 跨组问题(发现但不属于本组职责域)
| # | 涉及文件 | 问题描述 | 建议归属代理 |
|---|----------|----------|--------------|
| X1 | src/memory/service.rs:2384-2401、memory/evolution.rs:434 | 记忆笔记删除:Lance 删除失败仅 warn,units 照删,向量孤儿无重试;建议改用 index_unit_repo::purge_index_artifacts_by_resource(本组已为该函数接入孤儿队列) | 代理 1 |

## 共享文件改动登记
| # | 文件 | 改动段落/函数 | 原因 |
|---|------|---------------|------|
| (无,models.rs 未改动) | | | |

## 待用户决策项(高风险/权衡类,未实施)
| # | 事项 | 建议 |
|---|------|------|
| D1 | F10:lance_vector_store.rs emb_cache 改按字节预算封顶(当前按条数 10000) | 低优先级;大维度模型用户内存峰值可达 ~160MB,可改为 64MB 字节预算 LRU |

## 接力须知
- **验证状态**:cargo check 已通过(2026-06-12 23:20,独立 target 目录 target-agent2,避开多代理 target 锁冲突)。`cargo test --lib vfs::` 后台运行中(终端 89041),接力会话先看测试结果。
- 环境注意:本仓库多个子代理并行跑 cargo,共享 src-tauri/target 会 LNK1104 锁冲突;本组用 `$env:CARGO_TARGET_DIR="E:\2026ds\deep-student\src-tauri\target-agent2"` 隔离(已占 ~12GB 磁盘,E 盘充足)。不要 cargo clean 共享 target。
- 职责域规模:vfs/ 约 1.2MB 源码(handlers.rs 254KB、indexing.rs 194KB、types.rs 95KB),dstu/ 约 380KB(handlers.rs 236KB),database/ 约 370KB,repos/ 22 个文件约 1.1MB,lance_vector_store.rs 169KB,models.rs 71KB。
- 既往审阅记号:代码中有「★ 2026-06-12(第二轮审阅)」等注释,本轮(第三轮)新增记号为「★ 2026-06-12(本轮审阅)」或注明 F 编号;孤儿队列(__lance_orphan_queue)、两阶段 blob 删除等基础设施是前几轮产物,本轮在其上扩展接入面。
- 剩余工作:确认 cargo test 结果 → 向用户最终汇报(发现统计 10 项/已修复 9 项/待决策 1 项/跨组 1 项)。
- 未执行任何 git commit/push。
