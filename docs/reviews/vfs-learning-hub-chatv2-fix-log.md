# VFS / 学习资源管理器 / chat_v2 审阅问题修复记录

> 修复日期：2026-06-10 起
> 对应问题清单：`docs/reviews/vfs-learning-hub-chatv2-review-findings.md`
> 状态：✅ 已完成 / 🚧 进行中 / ⏸ 暂缓（含原因）

---

## ✅ A1 questions_fts 外部内容表触发器模式错误（🔴）

- 新增迁移 `src-tauri/migrations/vfs/V20260610__fix_questions_fts_triggers.sql`：
  - 重建 INSERT/UPDATE/DELETE 三个触发器为 FTS5 外部内容表官方要求的 `'delete'` 命令模式（携带 OLD 列值），UPDATE/DELETE 仅在 `OLD.deleted_at IS NULL`（旧行确实在索引中）时执行删除命令，避免对未索引行发 delete 造成新的腐化；
  - `INSERT INTO questions_fts(questions_fts) VALUES('rebuild')` 一次性重建存量索引；
  - rebuild 会把软删除行也索引进去，随后用 'delete' 命令批量移除 `deleted_at IS NOT NULL` 的行，恢复"软删除不可搜索"语义。

## ✅ A2 blob 物理文件在事务内被删除（🔴，含系统性扩散点）

核心方案：**两阶段删除**——事务内只递减引用计数（保留 ref_count=0 行），物理文件删除推迟到事务提交后的清扫阶段。即使崩溃也只是延迟回收，不再可能"DB 回滚复活、文件已丢"。

- `blob_repo.rs::decrement_ref_with_conn`：ref_count 归零时不再内联调用 `cleanup_blob_with_conn`（不再在调用方事务内 `fs::remove_file`），保留行待清扫。
- 清扫点（事务提交后调用 `cleanup_unreferenced[_with_conn]`，其内部仍会写 `__blob_deletion_queue` 传播 tombstone）：
  - `file_repo.rs::purge_file` / `purge_deleted_files`
  - `attachment_repo.rs::purge_attachment` / `purge_deleted_attachments`
  - `textbook_repo.rs::purge_textbook` / `purge_deleted_textbooks`
  - `folder_repo.rs::purge_folder`
  - `lib.rs` 应用启动时后台清扫一次（崩溃恢复兜底）。

## ✅ 新发现并修复：purge 函数 BEGIN 嵌套事务错误（🔴）

- 审阅中发现 `folder_repo::purge_folder_tree_resources_with_conn` 在 SAVEPOINT 事务内嵌套调用了使用 `BEGIN IMMEDIATE` 的各类型 purge 函数，SQLite 会报 "cannot start a transaction within a transaction" → **包含文件/笔记/导图的文件夹永远无法从回收站彻底删除**。
- 修复：以下函数从 `BEGIN IMMEDIATE/COMMIT/ROLLBACK` 改为可嵌套的 `SAVEPOINT/RELEASE/ROLLBACK TO`：
  - `file_repo.rs::purge_file_with_conn`（vfs_file_purge_tx）
  - `attachment_repo.rs::purge_attachment_with_conn`（vfs_attachment_purge_tx）
  - `textbook_repo.rs::purge_textbook_with_conn`（vfs_textbook_purge_tx）
  - `note_repo.rs::purge_note_with_conn`（vfs_note_purge_tx）
  - `mindmap_repo.rs::purge_mindmap_with_conn`（vfs_mindmap_purge_tx）
  - exam/translation/essay 的 purge 原本就是 SAVEPOINT 或无事务（由调用方管理），无需改动。

## ✅ F3 软删除清向量不清 units / 恢复后不重建索引（🔴）

`src-tauri/src/dstu/trash_handlers.rs`：

- `cleanup_vector_index` 重构为调用 `VfsIndexService::delete_resource_index_full`（删 Lance 向量 + 删 `vfs_index_units`/`vfs_index_segments` + 刷新维度计数），不再只删向量留下孤儿 SQLite 索引记录；
- `dstu_trash_restore` 成功后新增调用 `mark_resource_pending_after_restore` → `VfsIndexStateRepo::mark_pending`，恢复的资源会被后台索引循环自动重建索引，不再"恢复后永久检索不到"；
- `dstu_permanently_delete`（含 essay_session 子 essays）与 `dstu_empty_trash` 的清理同样升级为完整清理，修复 `vfs_index_units` 对 `resources` 无外键导致 purge 后 units/segments 残留的问题。

## ✅ F5 增量同步孤立 Lance 向量从不清理（🟠）

核心方案：**孤立向量入队 + 后台排空**（与 blob 两阶段删除同思路）。

- 新增迁移 `src-tauri/migrations/vfs/V20260611__add_lance_orphan_queue.sql`：创建本地队列表 `__lance_orphan_queue(lance_row_id PK, resource_id, enqueued_at, retry_count)`，不参与云同步；
- `index_service.rs::sync_resource_units_with_conn`：删除消失 Units 时收集到的 `orphaned_lance_row_ids` 不再只打 warn 日志，而是与业务变更同连接/同事务 `INSERT OR IGNORE` 入队；
- `indexing.rs::VfsFullIndexingService` 新增 `drain_lance_orphan_queue(limit)`：批量取队列条目，对 text/multimodal 两个 modality 调用 `delete_by_embedding_ids` 真删向量；成功出队，失败递增 `retry_count`（≥10 放弃并告警）；
- `process_pending_batch` 每轮开头先排空队列（上限 200 条/轮），即后台索引循环自动消化；
- `data_governance/migration/vfs.rs`：注册 `V20260610`/`V20260611` 两个迁移定义，`VFS_ALL_TABLE_NAMES` 增加 `__lance_orphan_queue`，`VFS_TABLE_COUNT` 34→35，并修正了此前已过期的迁移计数/最新版本断言（32→35、20260525→20260611）。
