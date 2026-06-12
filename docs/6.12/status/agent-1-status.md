# 代理 1 状态文档 —— 对话引擎与 AI 能力扩展

## 任务目标
全面深入审阅 Chat V2 对话全链路(后端 Pipeline ↔ 前端界面)+ 所有"给 AI 接能力"的扩展层:
模型供应商(9 家)、技能系统、MCP、联网搜索/深度调研、智能记忆、语音输入输出。
识别 bug/坏味道/性能隐患/安全风险/体验问题;域内实施低风险优化(高风险方案只登记、等用户确认);
全程维护本状态文档以便接力。

## 当前状态
T1/T2/T3 已审完,发现 F1-F10。用户已授权全部修复("同意所有修复,继续干,全修好")。O1-O6 已验证通过;O7-O10(F2/F5/F7/F9)代码已写完,cargo check 验证中。下一步 T4 供应商适配一致性。最后更新:2026-06-12 23:55

## TODO 计划
- [x] T1 后端 Pipeline 全链路审阅(2026-06-12):pipeline.rs/tool_loop.rs/llm_adapter.rs/send_message.rs/state.rs 全读;发现 F1-F5
- [x] T2 工具执行器与审批机制(2026-06-12):approval_manager/approval_scope/approval_handlers 全读;敏感度默认 fail-closed(None≠Low 需审批)、scope 键 v2 按 server 隔离、防通配桶污染,设计良好,无新发现
- [x] T3 多模型并行(变体对比)与多 Tab 并发(2026-06-12):variant_context.rs/multi_variant.rs/approval链路/事件通道/前端 queue 全读;发现 F6(计费重复)、F8(变体审批失效)、F9(session_id 污染)、F10(队列引用丢失);事件通道按 session 隔离设计良好,变体取消级联(child_token)正确
- [x] T4 9 家供应商适配一致性(2026-06-13):13 个 RequestAdapter 全读(注册表/聚合平台跳过/scope优先设计良好,各家参数差异处理到位且有单测);providers/mod.rs 4 个 ProviderAdapter 流式解析全读(per-request 实例化无跨流污染);model2_pipeline HTTP 重试(429 Retry-After/5xx 退避/401403 直返)设计良好;发现 F11-F16,修复 F11-F14
- [ ] T5 技能三级加载(内置→全局→项目)覆盖规则与 Token 节省(chat_v2/skills.rs、前端 features/chat/skills、features/skills-management)
- [ ] T6 MCP 连接生命周期:断连重连、工具 schema 校验、错误透传(src-tauri/src/mcp/、src/mcp/、src/mcp-debug/)
- [ ] T7 7 搜索引擎适配降级与配额;深度调研长链路中断恢复(tools/web_search.rs 等)
- [ ] T8 记忆系统:提取→比对→决策→写入幂等性,隐私模式阻断外呼(memory/)
- [ ] T9 API Key 等敏感信息日志/事件/错误泄漏排查(全域 grep + 审计)
- [ ] T10 前端 chat store 状态膨胀与内存泄漏(长会话、多 Tab 切换)(features/chat/core、stores)
- [ ] T11 流式渲染性能:大消息/长会话渲染抖动、不必要全量重渲染(features/chat/components、plugins)
- [ ] T12 语音输入输出(voice_input.rs、tts.rs、features/voice-input)
- [ ] T13 推理与注入策略(reasoning_policy.rs、injection_budget.rs)、用量追踪(llm_usage/)
- [ ] T14 会话基础(session_manager.rs、persistent_message_queue.rs)
- [ ] T15 域内低风险优化实施 + 验证(穿插进行,集中登记)
- [ ] T16 最终总结:发现统计/已修复清单/待用户决策项

## 审阅发现
| # | 文件/位置 | 类型 | 严重度 | 描述 | 处理 |
|---|----------|------|--------|------|------|
| F1 | chat_v2/pipeline/tool_loop.rs:690-782 | bug | 中 | 外层 LLM 重试(timeout/连接错误)复用同一 adapter(Arc)，register_stream_hooks 不会重置累积状态。若 600s 超时时已流出部分内容(timeout 丢弃 future 但 adapter 已累积)，重试会把第二次响应追加到第一次的部分内容后 → 内容重复(UI+DB)。注释"重新注册 hooks 以清理累积状态"不成立 | 已修复(见 O1) |
| F2 | chat_v2/pipeline/constants.rs:38 + tool_loop.rs:677 | 体验 | 低 | LLM_STREAM_TIMEOUT_SECS=600 是整个流的总时长而非空闲超时；长 agentic 生成(>10min)即使流式健康也会被强制超时。model2_pipeline 内部无空闲超时补偿 | 已修复(见 O7) |
| F3 | chat_v2/handlers/send_message.rs:1384-1393,1452-1455 | bug | 低 | find_preceding_user_message* 用 timestamp<=查找前序用户消息;若相邻消息时间戳相同(同毫秒)，可能选错消息。retry/edit 删除逻辑已改为 index-based(P0修复)但查找逻辑未同步 | 已修复(见 O2) |
| F4 | chat_v2/handlers/send_message.rs:1652-1693 | bug | 低 | chat_v2_continue_message 在 try_register_stream 之前就执行 restore_todo_list_from_db 修改内存 TodoList;若会话已有活跃流,注册失败返回错误但内存状态已被覆盖 | 已修复(见 O3) |
| F5 | chat_v2/pipeline/tool_loop.rs:48-70 | 坏味道 | 低 | has_heartbeat 检查 ctx.tool_results 全量历史而非本轮结果;一次 coordinator_sleep continue_execution=true 后所有后续轮次都被视为有心跳(直到50上限)。有 MAX_HEARTBEAT_COUNT+ABSOLUTE_MAX_RECURSION 兜底,风险有限 | 已修复(见 O8) |
| F6 | llm_manager/model2_pipeline.rs:2657 + chat_v2/pipeline/tool_loop.rs:861 | bug | 中 | Token 用量双重计费:call_unified_model_2_stream 仅被 chat_v2 调用,函数内部 record_llm_usage 一次,tool_loop 每轮成功后又记一次 → 单变体每轮 LLM 调用在 llm_usage_logs 写入 2 条(token 统计 2 倍);多变体路径(task_context="chat_v2_variant")只记内部 1 次,口径不一致 | 已修复(见 O4) |
| F7 | chat_v2/approval_manager.rs + tool_loop.rs request_tool_approval | 坏味道 | 低 | 用户取消流时审批 future 被 select! 丢弃,pending sender 残留(只在 timeout/channel-closed 分支调用 cancel_with_session);之后用户对残留 UI 响应会触发 remember 持久化(意图明确,可接受),pending 条目在 respond 时被弹出,无累积泄漏路径,影响极小 | 已修复(见 O9) |
| F8 | multi_variant.rs:1141,1307 + tool_loop.rs execute_single_tool | bug | 高 | 多变体审批完全失效:multi_variant 以复合键 "{session}:{variant}" 作为 session_id 注册审批 pending,但前端 BlockingApprovalBar 响应时传真实 session_id,ApprovalManager.respond 按 (session,tool_call_id) 精确匹配 → 永远找不到等待者,返回 approval_expired;用户点"允许"无效,工具只能等 60s 超时被拒。"本会话允许"(session_remembered) 同理写入真实键、读取复合键,永远不命中 | 已修复(见 O5) |
| F9 | multi_variant.rs:1307 → ExecutionContext.session_id | bug | 高 | 多变体下 ExecutionContext.session_id 是复合键 "{session}:{variant}",所有按 session 查库的工具在变体模式下失效:subagent_executor get_session 查不到会话、attachment_executor 校验 param_session_id != ctx.session_id 拒绝访问、skills_executor load_session_state_v2 读写到不存在的会话、chatanki/workspace 所有权校验失败。todo_executor 依赖复合键做变体间内存隔离(复查:sleep_executor 实际按 workspace_id 隔离、且需要真实 session_id 写库,复合键反而破坏它) | 已修复(用户授权,见 O10) |
| F10 | features/chat/core/store/queueActions.ts maybeDequeue | bug | 中 | 队列出队发送丢弃入队时快照的 contextRefs:send 链路从 store.pendingContextRefs 现值读取引用 → ①用户流式期间改草稿引用会被错误附到队列消息上(串扰);②首条出队后非 sticky 引用被清空,后续队列项全部丢引用 | 已修复(见 O6) |
| F11 | llm_manager/adapters/moonshot.rs:96 | bug | 低 | K2.5 路径 enable_thinking.unwrap_or(true) 忽略模型配置中保存的 enable_thinking/thinking_enabled——用户在配置里关闭思考无效;与其他 8 家适配器的 resolve_enable_thinking 优先级不一致 | 已修复(见 O11) |
| F12 | providers/mod.rs OpenAIAdapter::parse_stream + utils/sse_buffer.rs | bug | 中 | OpenAI 兼容解析器严格要求 "data: "(带空格)前缀,SSE 规范允许 "data:" 无空格(部分供应商/中转站省略)→ 这类流所有数据行被静默丢弃,表现为"连接正常但无任何输出";Responses/Anthropic 解析器是宽容的,口径不一致。check_done_marker 同样问题 | 已修复(见 O12) |
| F13 | llm_manager/mod.rs create_http_client_with_fallback + model2_pipeline.rs | bug | 高 | reqwest 0.11 的 ClientBuilder::timeout(300s) 覆盖「连接+整个响应体下载」——流式响应总时长 >300s 时被 reqwest 中途强杀(早于 Pipeline 600s 超时,实际有效上限是 300s!)。长 agentic 生成必死;之前因 F15 的"部分成功"语义被掩盖成静默截断 | 已修复(见 O13) |
| F14 | providers/mod.rs OpenAIResponsesAdapter::parse_stream | bug | 中 | response.failed / error 事件被吞掉只发 Done:供应商返回的失败原因(配额不足/参数错误)完全丢失,前端只看到空响应,无日志可查 | 已修复(见 O14) |
| F15 | model2_pipeline.rs:2293-2299 流读取 Err 分支 | 体验 | 低 | 流中途读错误且已有部分内容时 break 并按"部分成功"返回 Ok——内容被静默截断,用户无感知(无截断标记事件);F13 修复后触发概率大幅下降。建议:发截断警示事件供前端标记,需前端配合,登记待后续 | 登记(改动涉及前后端协作,暂不动) |
| F16 | model2_pipeline.rs:2693 call_unified_model_stream_with_config | 坏味道 | 低 | 全仓无调用方的死代码(~1000 行,含完整流式循环副本),与主路径双份维护易漂移(本次 SafetyBlocked 修复就要同步改两处) | 登记(删除属大改动,待用户确认) |

## 已实施的优化
| # | 改动文件 | 改动说明 | 验证结果 |
|---|---------|---------|---------|
| O1 | chat_v2/pipeline/llm_adapter.rs + tool_loop.rs | 新增 ChatV2LLMAdapter::reset_stream_state();外层重试前显式重置累积内容/工具调用/think标签缓冲,保留块ID避免前端孤儿块(修复F1) | cargo check 通过 |
| O2 | chat_v2/handlers/send_message.rs | 新增 locate_preceding_user_message() index-based 查找,替换两处 timestamp<= 查找(修复F3) | cargo check 通过 |
| O3 | chat_v2/handlers/send_message.rs | chat_v2_continue_message:try_register_stream 提前到 restore_todo_list_from_db 之前,后续错误路径补 remove_stream(修复F4) | cargo check 通过 |
| O4 | llm_manager/model2_pipeline.rs | call_unified_model_2_stream 内部 record_llm_usage 仅在 task_context!="chat_v2" 时执行,消除单变体双重计费;多变体/其他调用方不受影响(修复F6) | cargo check 通过 |
| O5 | chat_v2/pipeline/tool_loop.rs | execute_single_tool 审批链路新增 approval_session_id:剥离 ":{variant}" 后缀还原真实 session_id(修复F8)。注:O10 实施后 session_id 本身已是真实值,该后缀剥离逻辑已被 O10 撤销简化 | cargo check 通过(后被 O10 取代) |
| O6 | features/chat/core/store/queueActions.ts | maybeDequeue 发送前将 pendingContextRefs 临时替换为队列项快照(保留草稿 sticky),发送后若用户未在窗口内修改(dirty=false)则恢复草稿引用(修复F10) | queueActions 29 项单测通过 + tsc typecheck 通过 |
| O7 | chat_v2/pipeline/constants.rs + helpers.rs + llm_adapter.rs + variant_adapter.rs + tool_loop.rs + multi_variant.rs | LLM 流式超时语义从「总时长600s」改为「空闲600s + 绝对上限2h」:adapter 增加 last_activity_at/touch_activity/idle_elapsed(所有 hook 回调刷新);helpers 新增 wait_llm_stream_with_idle_timeout(每10s轮询空闲时长);4 处调用点(单变体主调用/重试、变体首轮/工具轮)全部改造,超时错误消息区分 idle/total(修复F2) | cargo check 验证中 |
| O8 | chat_v2/context.rs + chat_v2/pipeline/tool_loop.rs | PipelineContext 新增 last_round_heartbeat 字段;has_heartbeat 改读该字段(仅最近一轮),每轮工具执行后更新(修复F5) | cargo check 验证中 |
| O9 | chat_v2/pipeline/helpers.rs + tool_loop.rs | ApprovalOutcome 新增 Cancelled;request_tool_approval 接收 cancellation_token,select! 同时监听审批响应与取消信号,流取消时立即 cancel_with_session 清理 pending 并发 approval_cancelled 事件(修复F7) | cargo check 验证中 |
| O10 | chat_v2/pipeline/multi_variant.rs + chat_v2/tools/todo_executor.rs + tool_loop.rs | F9 结构性修复:multi_variant 给 execute_tool_calls 传真实 session_id(变体隔离由 variant_id 参数承担);todo_executor 内部组合 session_id:variant_id 作为内存 TodoList 隔离键;tool_loop 审批链路撤销 O5 的后缀剥离逻辑、直接用真实 session_id。子代理/附件/技能状态/chatanki/workspace 所有权校验在变体模式下恢复正常(修复F9)。复查确认 sleep_executor 按 workspace_id 隔离、需要真实 session_id 写库,本修复顺带修好它 | cargo check 验证中 |
| O11 | llm_manager/adapters/moonshot.rs | K2.5 thinking 解析改为 enable_thinking.or(config.enable_thinking).unwrap_or(true):尊重配置开关,保持 K2.5 默认启用(修复F11) | cargo check 验证中 |
| O12 | providers/mod.rs + utils/sse_buffer.rs | OpenAIAdapter::parse_stream 改用 strip_prefix("data:") + 可选空格,兼容无空格 SSE;check_done_marker 同步兼容 "data:[DONE]";新增单测 openai_adapter_parse_stream_accepts_data_prefix_without_space(修复F12) | cargo check 验证中 |
| O13 | llm_manager/model2_pipeline.rs | 新增 STREAMING_REQUEST_TIMEOUT_SECS=7200,call_unified_model_2_stream 的请求 builder 按请求覆盖 .timeout(2h),解除 reqwest 客户端 300s 总超时对流式响应的截杀;挂起防护由 Pipeline 层空闲超时(O7)负责;非流式调用不受影响(修复F13,与O7配套) | cargo check 验证中 |
| O14 | providers/mod.rs + llm_manager/model2_pipeline.rs | Responses 解析器 response.failed/error 事件:记录错误日志 + 以 SafetyBlocked(type=provider_error) 上抛;model2 SafetyBlocked 分支区分 provider_error 与安全阻断,错误事件不再误标为"安全策略阻断"(修复F14) | cargo check 验证中 |

## 跨组问题(发现但不属于本组职责域)
| # | 涉及文件 | 问题描述 | 建议归属代理 |
|---|---------|---------|------------|

## 共享文件改动登记
| # | 文件 | 改动段落/函数 | 原因 |
|---|------|-------------|------|

## 接力须知
- 本会话通过 mcp-feedback-enhanced 与用户交互,feed_id=F-GLUT9;接力会话应重新注册自己的 feed_id。
- 工作目录 e:\2026ds\deep-student;验证命令见 docs/6.12/README.md 3.4(Windows PowerShell 5,不支持 &&,用 ; 分隔)。
- 未经用户明确要求不得 git commit/push;共享文件(commands.rs/lib.rs/models.rs/App.tsx/locales)只改本域段落并登记。
- 审阅顺序按 TODO 编号;每完成一个单元立即更新本文档。
