# 代理 6 状态文档 —— 笔记·导图·翻译·作文批改

## 任务目标

对职责域(笔记 Milkdown/Crepe 编辑器与导出、知识导图、翻译工作台、AI 作文批改)做全面代码审阅:登记问题、实施域内低风险优化并逐项验证、高风险方案只登记待用户确认,最终输出发现统计/修复清单/待决策项。

## 当前状态

T1-T4 审阅完毕(17 项发现);T4.5 的 10 项低风险修复(A6-01~A6-10)已全部实施。验证:vitest 解析器 5/5 通过、tsc --noEmit 零错误、cargo check 通过(本域模块零警告)、cargo test(pipeline 单测)运行中。下一步 T5(笔记自动保存)。最后更新:2026-06-12 23:25(UTC+8 翌日 07:25 勿混淆,以本地时间为准)

⚠️ 环境事件:E 盘曾满到 0 字节导致本文档被一次失败写入清空,已凭会话上下文完整重建。已删除 `src-tauri/target/debug`(62GB 可再生编译产物)腾出 118.9GB;下次 cargo check 会全量重编(首次较慢,属正常)。个别 proc-macro DLL 被运行中进程锁定未删成,无碍。

## TODO 计划

- [x] T0 创建状态文档、摸清职责域文件结构(2026-06-12)
- [x] T1 作文批改后端审阅:pipeline/types/mod/custom_modes/text_stats/events(2026-06-12)
- [x] T2 作文批改前端审阅:useEssayGradingStream/markerParser/streamingMarkerParser/GradingStreamRenderer/StreamingAnnotatedText/EssayGradingWorkbench/SettingsDrawer/essayGradingApi/exportFormatter(2026-06-12)
- [x] T3 翻译后端审阅:pipeline/chat_popover/mod/events/types(2026-06-12)
- [x] T4 翻译前端审阅:useTranslationStream/TranslateWorkbench/TranslationMain/SourcePanel/TargetPanel/ComparisonView/PromptPanel(2026-06-12)
- [x] T4.5 实施 T1-T4 低风险修复(A6-01~A6-10)并验证(2026-06-12;cargo test 结果待确认)
- [ ] T5 笔记自动保存与冲突
- [ ] T6 Crepe 编辑器:粘贴清洗(XSS)、撤销栈、大文档性能、保存时序防丢字
- [ ] T7 笔记后端:notes_manager.rs
- [ ] T8 笔记导出:notes_exporter.rs 各格式保真度、特殊字符/公式/图片
- [ ] T9 导图核心:mindmapStore.ts / AI diff
- [ ] T10 导图视图:大图渲染性能/大纲转换/背诵遮挡
- [ ] T11 四特性交互一致性:快捷键、保存提示、AI 加载态、错误提示风格
- [ ] T12 LLM 输出畸形(JSON 解析失败)兜底体验横查
- [ ] T13 汇总:发现统计、修复清单、待用户决策项,最终汇报

## 审阅发现

### 拟修复(低风险,T4.5 实施中)

- **A6-01**(bug/中,essay+translation 后端)`essay_grading/pipeline.rs` 与 `translation/pipeline.rs` 的 SSE 解析只按 `\n\n` 分帧;CRLF 风格供应商/代理(`\r\n\r\n`)下事件永远解析不到 → essay 误报 Incomplete、translation 返回空文本却标记 Completed,缓冲区无限增长。修复:兼容两种分隔符。
- **A6-02**(bug/中,translation 后端)`translation/pipeline.rs::stream_translate` 无 `StreamStatus::Incomplete` 检测:流被中途掐断(无 [DONE])仍按 Completed 返回部分译文并静默保存。essay 侧已有 M-064 防护,translation 缺失。已核实所有 provider 适配器正常结束都会发 `StreamEvent::Done`,故"无 Done=异常"成立。修复:移植 M-064 模式。
- **A6-03**(bug/中,essay 后端)`pipeline.rs::guess_image_mime` 对 base64 头部做 `&base64_data[..24]` 字符串切片,非 ASCII 输入可能 panic;且带 `data:image/...;base64,` 前缀的输入会解码失败回退 jpeg。修复:安全字节切片 + 剥离 data URI 前缀。
- **A6-04**(correctness/中低,essay 后端)`pipeline.rs::sanitize_user_input` 英文过滤模式过宽:裸 `disregard`、`ignore all` 会把正常题干/范文内容替换为"[已过滤]"(雅思题干常见此类词)。修复:收窄为注入语境短语(如 "ignore all previous instructions")。
- **A6-05**(quality/低,essay 后端)`pipeline.rs` 对 `previous_result` 截断只保留头部 8000 字符,而上一轮"总分/总结"在尾部 → 多轮重批丢失关键上下文。修复:头+尾保留、中间打省略标记。
- **A6-06**(bug/高,translation 前端)`TranslateWorkbench.tsx` 自动翻译 useEffect 依赖 `isTranslating`:翻译完成 → effect 重跑 → 相同文本再次入队 → **无限循环重复烧 API**。修复:记录上次翻译签名(文本+语向+风格参数),相同则跳过。
- **A6-07**(leak/中,translation 前端)`useTranslationStream.ts`:① `listen()` await 期间组件卸载 → 监听器泄漏(unlistenRef 已被置空);② 卸载时不取消后端流,后端继续白跑。essay 侧 hook 两者都已正确处理。修复:对齐 essay hook 模式(disposed 检查 + 卸载时 cancel)。
- **A6-08**(bug/低,essay 前端)`markerParser.ts`:① `parseMarkers` 不处理嵌套/重叠标记,嵌套时内层文本重复渲染;② `parseScore`/`removeScoreTag` 正则仅接受 `total=` 在前——后端与 streamingMarkerParser 均兼容 `total/max` 任意顺序,LLM 返回 max 在前时前端解析失败而后端成功,行为分裂。修复:重叠跳过 + 正则兼容两种顺序。
- **A6-09**(bug/低,essay 前端)`streamingMarkerParser.ts::restoreCodeBlocks` 用 `String.replace(placeholder, original)`,代码块内容含 `$&`/`$'` 等序列会被当作替换模式破坏。修复:用函数形式替换。
- **A6-10**(UX/低,essay 前端)`SettingsDrawer.tsx` 提示系统提示词支持 `{{essay}}` 占位符,但后端从不替换它(作文是拼在 user prompt 里的),用户写了会原样发给 LLM。修复:移除误导提示。

### 登记待用户决策(高风险/产品取舍,不动手)

- **A6-11**(perf/中,essay+translation 双域)`events.rs::emit_data` 每个 chunk 重发全量 accumulated 文本 → IPC 流量 O(n²),长文尾段每 chunk 重传几十 KB。改造需前后端事件契约同改(改发增量),影响 chat_popover、双 hook 等所有消费方,建议专项处理。
- **A6-12**(quality/低,essay 后端)LLM 返回超出模式满分的分数时按 clamp 截断(如 85/100 在雅思模式下变 9/9)而非按比例换算;截断 vs 换算是业务取舍。
- **A6-13**(UX/中,essay 前后端)纯图片输入流程矛盾:前端允许只传图(多模态模型),后端却强制 `input_text` 非空 → 纯图批改被挡;文本模型时图片被静默丢弃无任何提示。需要产品决策(允许纯图?提示丢弃?)。
- **A6-14**(cleanup)死代码群:`AnnotatedText.tsx` 无人引用(其依赖的 parseMarkers 仅测试在用)、`essayGradingApi.listSessions` 返回类型与注释不符且无人调用、`GradingHistory`/`TranslationHistory` 已被 DSTU 侧边栏取代。建议统一清理,等用户确认。
- **A6-15**(improvement,translation)长文(上限 50K 字符)单次请求无分段策略,超长文易超时/超 token;双栏同步滚动是高度比例映射,长段落场景对不齐。改进项,涉及较大改造。
- **A6-16**(consistency/低,translation 前端)`TranslateWorkbench` 清空确认用 `window.confirm`,essay 域用 NotionAlertDialog——归入 T11 一致性横查时统一。
- **A6-17**(minor)字符上限前端用 UTF-16 code unit(`text.length`),后端用 Unicode 标量(`chars().count()`),含 emoji 时边界不一致;影响极小,仅登记。

### 其他备忘

- `translation/pipeline.rs` 的 `TranslationDeps.db`(旧 SQLite 句柄)仅注释提及"迁移期",实际未使用——可与 A6-14 一起清理。
- `SettingsDrawer.handleSave` 仅校验名称非空,`total_max_score`/维度分可填 0;后端有兜底但展示百分比会奇怪。小校验补强,可并入后续批次。
- `essayGradingApi.ts` 标记 @deprecated 但 Workbench 仍用其 getModels/getGradingModes/getSession/getRounds/createSession——迁移到 essayDstuAdapter 是跨批次工作,登记不动。

## 已实施的优化

全部于 2026-06-12 实施,验证:`npx vitest run src/essay-grading/markerParser.test.ts` 5/5 通过;`npx tsc --noEmit` 零错误;`cargo check` 通过且 essay_grading/translation 模块零警告。

1. **A6-01** `essay_grading/pipeline.rs` + `translation/pipeline.rs`:新增 `find_sse_event_boundary()`(两文件各一份,保持模块独立),SSE 分帧兼容 `\n\n` 与 `\r\n\r\n`;附单测 `sse_boundary_handles_lf_and_crlf`。
2. **A6-02** `translation/pipeline.rs`:`StreamStatus` 新增 `Incomplete`;流未收 DONE 即结束时不再按 Completed 返回部分译文,改为报错"翻译流式响应异常中断"(对齐 essay 的 M-064);`run_translation` 与 `chat_popover.rs` 的 match 分支同步处理(popover 发 Error 事件)。
3. **A6-03** `essay_grading/pipeline.rs::guess_image_mime`:剥离 data URI 前缀(声明 MIME 直接采信);魔数检测改用 `str::get` 字节边界安全切片,非 ASCII 输入不再可能 panic;附单测。
4. **A6-04** `essay_grading/pipeline.rs::sanitize_user_input`:英文过滤从裸词("disregard"、"ignore all")收窄为注入语境正则(动词+指令对象同现);"ignore all distractions" 等正常文本不再被破坏;附单测。
5. **A6-05** `essay_grading/pipeline.rs`:新增 `truncate_keep_head_tail()`,previous_input/previous_result 超长时保留头 5/8+尾 3/8(总预算 8000 字符),不再丢失尾部总分/总结;附单测。
6. **A6-06** `TranslateWorkbench.tsx`:新增 `buildTranslationSig`+`lastTranslatedSigRef`,自动翻译 effect 在参数签名未变时跳过,修复"翻译完成→isTranslating 翻转→同文无限重译"的循环;恢复历史会话时已有译文视为已翻译。
7. **A6-07** `useTranslationStream.ts`:对齐 essay hook 的 E-3 模式——新增 `currentSessionIdRef`;`listen()` await 后检查挂载状态,卸载则立即 unlisten;卸载 effect 中取消后端流(`cancel_stream`);`cancelTranslation` 改读 ref 防过期闭包。
8. **A6-08** `markerParser.ts`:`parseMarkers` 排序加同位长匹配优先+跳过重叠区间(嵌套标记不再重复渲染);`parseScore`/`removeScoreTag` 兼容 total/max 任意属性顺序(对齐后端与流式解析器);附 2 个单测。
9. **A6-09** `streamingMarkerParser.ts::restoreCodeBlocks`:占位符回填改用函数替换,代码块含 `$&`/`$'` 等不再被破坏;附单测。
10. **A6-10** `SettingsDrawer.tsx`:移除"系统提示词支持 {{essay}} 占位符"的误导提示(后端从不替换该占位符);locales 中的孤儿键未动(避免触碰共享文件)。

## 跨组问题(发现但不属于本组职责域)

- SSE 按 `\n\n` 分帧的同款问题大概率也存在于聊天主链路(providers/chat 域,代理 1/2 辖区);本组只修 essay_grading/translation 两处,聊天侧请对应代理核查。
- `window.confirm` 风格不统一问题在其他域可能同样存在(本组只管翻译/作文/笔记/导图四特性内)。

## 共享文件改动登记

- (暂无;A6-10 若删 i18n 键则需登记 locales——当前方案只删 SettingsDrawer 中的提示行,不动 locales)

## 接力须知

1. 本会话经 MCP feed 工作(feed_id=F-4J5QG):收到指令后持续 feed-task-update 记录进度、interactive_feedback 收集反馈,直到用户说完成。
2. T1-T4 审阅已完,发现全部在上面;接力会话请直接从 T4.5 未完成的修复继续(按 A6-01~A6-10 顺序),每改完一项就在「已实施的优化」登记并勾选。
3. 验证命令(README 3.4):`cd src-tauri && cargo check`(target/debug 已被清,首次全量重编很慢属正常)、`cargo clippy`、前端 `npm run type-check`(若无此脚本则 `npx tsc --noEmit`)、`npx vitest run src/essay-grading/markerParser.test.ts`(改解析器后必跑)。
4. 改动纪律:不动域外文件;commands.rs/lib.rs/models.rs/App.tsx/locales 只改与本域直接相关段落并登记;不引入新依赖;未经用户要求不 git commit/push。
5. E 盘空间紧张是常态风险:写文件前可先 `Get-PSDrive E` 看剩余;若再满,优先清 `src-tauri/target`(可再生)。
