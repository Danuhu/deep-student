# DeepStudent 战略深度调研：从 206 star 到伟大开源项目（2026-07-04）

> 方法：5 个事实收集子代理（架构/多端/功能闭环/UIUX/社区）+ 主代理独立竞品与增长调研 + GitHub API 自采数据 + 团队既有评审文档交叉验证。
> 结论与判断全部由主代理负责；子代理只提供证据。
> 数据快照：2026-07-04，v0.9.42，nightly 分支。

---

## 0. 执行摘要（TL;DR）

**206 star 不是产品体量问题，是分发缺失问题——但直接去 launch 会浪费唯一一次点火机会。**

三个核心事实：

1. **产品体量已经是 20k-star 级别**：78.4 万行代码（TS 42.8 万 + Rust 35.6 万）、67 张 SQLite 表、28 个内置技能、6 OCR 引擎、4000+ 测试用例。同赛道的 DeepTutor（HKUDS）用更少的功能面在 111 天拿到 20k star——**这个赛道的需求已被验证，缺口不在赛道**。
2. **16 个月只做过一次分发**：star 月度时间线显示，2025-03 至 2026-02 共约 50 star（月均 4.5）；2026-03-01 发了一篇 V2EX 帖子后，3 月+48、4 月+39、5 月+43——**唯一一次分发动作直接制造了唯一一段增长**，且 6 月已衰减到 +23、7 月 +3。全部 Release 累计下载仅 2,163 次。repo topics 为空、README 截图全中文、无 GIF/视频、无 Discord、watchers 只有 3。
3. **闭环故事有一个致命漏洞**：卖点是"导入→理解→练习→制卡→记忆"的闭环，但卡片只能导出到 Anki（应用内无复习界面）、无 FSRS、掌握度数据不驱动任何调度、记忆系统只服务聊天。**闭环在"记忆"这最后一环漏气**——而这恰好是最该拿来讲故事的一环。

**战略主线（后文详述）**：先用 1-2 个版本把"三分钟首启体验 + 英文门面 + P0 缺陷 + CI 门禁"做成 launch-ready，然后在同一个 48 小时窗口打 Show HN + Product Hunt + Reddit + B站/小红书的组合点火，之后转入 release-driven 增长 + 社区建设，v2.0 用"应用内 FSRS 复习中心 + 引用回源 + 学习任务台"把闭环故事补真。

---

## 1. 现状盘点：项目真实规模（事实层）

| 维度 | 数据 |
|---|---|
| 代码规模 | TS/TSX 428,455 行（1,477 文件）+ Rust 355,996 行（395 文件） |
| 最大前端模块 | chat 131,465 行（占 features 54%）、settings 35,512、learning-hub 28,316 |
| 最大后端模块 | chat_v2 89,758 行、vfs 59,792、data_governance 50,356 |
| 数据层 | 4 schema / 70 迁移 / 67 张表；SQLite(r2d2池+WAL) + LanceDB(混合检索+rerank) + Blob |
| Tauri 命令面 | `#[tauri::command]` 出现 722 处 |
| AI 接入 | 11 内置 vendor、14 协议适配器、6 OCR 引擎、MCP 5 种传输 |
| 技能系统 | 28 个内置技能（6 复合 + 22 工具组）、SKILL.md 三层加载 |
| 测试资产 | Vitest 250 文件 ~1,777 用例、Rust ~1,947 `#[test]`、Playwright CT 5 |
| i18n | zh/en 各 41 个 namespace、~14,980 key，两侧无缺失键 |
| 发布 | 43 个 release、release-please 自动化、mac/win/linux/android 四平台 CI |

**判断**：这是一个被严重低估的工程量。问题从来不是"做得不够多"，而是做的东西没有被看见、被理解、被信任。后文所有建议都围绕这三个词展开。

---

## 2. 社区诊断：206 star 的解剖

### 2.1 Star 时间线（GitHub API 自采，按月）

```
2025-03 ▏5    2025-09 ▏2
2025-04 ▏6    2025-10 ▏3
2025-05 ▏7    2025-11 ▏3
2025-06 ▏9    2025-12 ▏1
2025-07 ▏8    2026-02 ▏3
2025-08 ▏3    2026-03 ████████ 48   ← V2EX 帖(3-01) + v0.9.35
              2026-04 ██████▌ 39
              2026-05 ███████ 43
              2026-06 ███▊ 23       ← 衰减
              2026-07 ▏3 (至4日)
```

**读法**：前 11 个月月均 4.5 星 = 项目不可见；一篇 V2EX 帖制造了全部增长动能；无后续分发动作，动能正在耗尽。**这是"分发决定增长"的教科书级自证。**

### 2.2 下载与用户规模（Release assets 累计）

| 产物 | 下载量 |
|---|---|
| .exe (Windows) | 750 |
| .apk (Android) | 400 |
| .dmg + .app.tar.gz (macOS) | 464 |
| .deb/.rpm/.AppImage (Linux) | 108 |
| **安装包合计** | **~1,722** |

峰值版本 v0.9.35（2026-03-14，V2EX 帖后）642 次。**真实用户量级：数百人，以中文 Windows/Android 用户为主。** star/下载转化率其实不差——缺的是曝光总量，不是转化率。

### 2.3 社区基础设施缺口清单

| 项 | 现状 | 对照（DeepTutor 25k star） |
|---|---|---|
| repo topics | **空** | 9 个精准 topic（ai-tutor, rag, multi-agent…） |
| README 首屏 | 中文截图、无 GIF/视频、双语混排 | badge 矩阵 + arXiv 徽章 + Discord 徽章 + 英文导航条 |
| 社区阵地 | 无 Discord/Telegram；Discussions 开了但无引导 | Discord + WeChat 群 + Discussions + 可投票 roadmap |
| Issue 生态 | 累计仅 15 个 issue，good-first-issue 1 个 | 41 open / 数百 closed，70 贡献者 |
| PR | 102 个 PR、60 merged，外部贡献者 2-3 人 | 70 contributors |
| 信任背书 | 无论文/无技术博客/无媒体报道 | arXiv 预印本 + HKU 实验室品牌 + 多语文档站 |
| 贡献者体验 | CONTRIBUTING 引用被 gitignore 的 AGENTS.md（死链）；CLA 强制 | CONTRIBUTING 完整、无 CLA |
| 官网 | deepstudent.cn 中文优先，.cn 域名 | deeptutor.info |

### 2.4 仓库门面的具体硬伤

1. **README 截图 59 张全部是中文界面 + 中文文件名**（`example/软件主页图.png`……）。英文用户点进来的第一感受是"这不是给我用的"。AFFiNE COO 复盘明确指出：README 是产品页，hero 图 + 3-5 个 GIF + 前 200 词内 quickstart，缺一样流量就跳出。
2. **`deep-agent-ref/`（一个完整的第三方参考项目）、`note/翻译键缺失详细报告.md`、`docs/6.12|6.13/`（8 个 agent 的运行日志）都在公开仓库里**——对外部开发者是噪音，也暴露内部流程。
3. **零 GIF/零视频**。学习工作台是强视觉产品，"一句话生成导图/制卡"的 wow moment 只能靠动图传达。
4. AGPL 本身不是问题（Cherry Studio 47k、Khoj 34.8k 都是 AGPL 终端应用），**但 CLA + 死链 AGENTS.md 的组合对个人贡献者是真实劝退**。

---

## 3. 竞品格局（2026-07）

### 3.1 学习智能体赛道（直接竞品）

| 项目 | Star | 形态 | 关键差异 |
|---|---|---|---|
| **DeepTutor** (HKUDS) | 25.2k | Python+Docker/PyPI, Web+CLI | 多代理解题双循环、TutorBots、EduHub 技能市场（ClawHub 兼容）、arXiv 论文、53 releases、70 贡献者 |
| **Open Notebook** | 26.7k | Docker, MIT | NotebookLM 平替、播客生成、18+ provider |
| **Khoj** | 34.8k | 自托管+云, AGPL | 第二大脑、Obsidian/Emacs/WhatsApp 入口 |
| **AnythingLLM** | 61k | 桌面+Docker, MIT | RAG 工作区（也用 LanceDB）、agent builder |
| **SurfSense** | 14.4k | Docker | 团队向、二级 RAG+重排 |
| PageLM | 1.6k | Web | 教育向 NotebookLM，quiz/闪卡/播客 |
| KnowNote | 1.0k | Electron | "local-first NotebookLM"，方向与 DS 部分重叠 |
| StudyFetch（闭源） | - | SaaS | **700 万学生用户**，全靠 TikTok 创作者营销 |

**判断**：
- DeepTutor 证明了"开源 AI 学习工作台"有 20k+ 的需求池，也抢走了这个心智的英文首位。**DS 不能再用"我也是学习工作台"进场，必须打差异**。
- DS 真实的差异化恰好是 DeepTutor 没有的三样：**① 原生桌面+Android（全赛道唯一有真移动端的）；② 本地优先无 Docker（下载即用 vs `docker compose up`）；③ 学习资产的结构化闭环（题库/错题/复习计划/导图/翻译/作文是数据库实体，不是聊天产物）**。DeepTutor 是"围绕文档的多代理导师"，DS 是"围绕学习资产的工作台"——这个差异是真实的，但 README 现在用 13 个功能的罗列把它淹没了。

### 3.2 桌面 AI 客户端（间接竞品，抢"装机位"）

LobeChat 78k / AnythingLLM 61k / Cherry Studio 47k / Jan 25k+。**注意 Cherry Studio 的 roadmap 已列入 Android/iOS Phase 1 和 HarmonyOS**——DS 的移动端窗口期不是永久的，大约还有 6-12 个月。

### 3.3 巨头动向（定义用户预期）

- **ChatGPT Study Mode**（免费开放）：苏格拉底式引导、知识检查、跨会话进度追踪。
- **Gemini Guided Learning + LearnLM**：教育微调模型、Classroom 分发、NotebookLM 已内置闪卡/测验。

**判断**：巨头把"引导式学习对话"做成了免费标配，纯"AI 学习聊天"已无差异空间。开源产品剩下的护城河 = **数据所有权 + 学习资产的深度结构化 + 可扩展性（技能/MCP）+ 跨端本地**。DS 的架构押注（VFS 统一数据层）押对了方向，需要把最后一环补全（见 §6）。

### 3.4 复习/记忆赛道

FSRS 已是 Anki 默认调度器（23.10+），`ts-fsrs`/`fsrs-rs` 库成熟；2026 年涌现一批 Tauri+FSRS+AI 制卡的小应用（Recall、Pupil 等，均 <100 star）。**"AI 制卡 + FSRS 复习 + 学习资产联动"的整合位置没有强者占据**——这是 DS v2.0 的机会（现状：DS 无 FSRS，卡片复习只能去 Anki，题目复习用的是 SM-2）。

---

## 4. 增长规律：200 → 20k 的已验证路径

综合 AFFiNE（0→60k，COO 复盘）、DeepTutor（0→20k/111天）、sspai 5000-star 复盘、Product Hunt 单人项目案例：

1. **README = 产品页**：hero 图 + 3-5 个功能 GIF + 前 200 词 quickstart。没有这个，任何流量都会跳出。
2. **48 小时集中点火**：Show HN（周二 09:00 ET）+ Product Hunt + Reddit（r/selfhosted、r/LocalLLaMA）+ 中文渠道（B站/小红书/少数派/V2EX）同窗口引爆 → star 速率触发 GitHub Trending → Trending 的算法流量再放大（AFFiNE 单日 +1,100 的来源）。**分散发比集中发的效果差一个数量级。**
3. **英文优先拿干净的增长信号**：AFFiNE 刻意 English-only 冷启动；HN 一次首页 = 500-2,000 star。中文渠道带用户和下载，英文渠道带 star 和贡献者——**两者都要，但 repo 门面必须英文优先**。
4. **PH 的价值是徽章不是流量**（72h 流量跌 80-90%）；AFFiNE 18 个月发了 30+ 次 PH。
5. **月 12 后切换到 release-driven 增长**：稳定发版 + release notes 点名贡献者 + 版本级二次 launch。
6. **刷 star 必死**：GitHub 算法识别异常速率并取消 Trending 资格。
7. **社区存活率**：3+ 维护者的项目存活率比单人高 70%；首次贡献者 PR 响应 <24h 是留存关键。

**对 DS 的适配判断**：DS 已有的 43 个 release、release-please、四平台 CI 是"release-driven 增长"的好底子；缺的是第 1、2、3 步——而且**只有一次冷启动机会**（HN 对重复提交宽容度低），所以必须先把 §5-6 的 launch-blocker 清掉再点火。

---

## 5. 六维短板清单（判断层，证据来自子代理+内部评审文档）

### 5.1 技术栈与架构

| # | 短板 | 证据 | 判断 |
|---|---|---|---|
| 1 | **CI 不跑自己已有的 1,777 个前端测试**，也不跑 eslint/clippy；E2E workflow 被禁用 | ci.yml 仅 tsc + cargo check + sync 矩阵 | **P0**。launch 后 issue 流量上来，没有测试门禁的仓库会在外部 PR 下迅速劣化。这是所有工程债里 ROI 最高的一项 |
| 2 | 上帝文件：`sync/mod.rs` 12,262 行、`vfs/handlers.rs` 7,440、`commands.rs` 5,817、`TauriAdapter.ts` 4,137 | 子代理 A1.4 | P1。不影响用户但决定"外部贡献者敢不敢碰"。拆分应与 good-first-issue 计划联动 |
| 3 | 热路径 `.unwrap()` 密度：全库 1,779 处，`chat_v2/repo.rs` 224 处、sync 173 处 | 子代理 A5 | P1。聊天与同步是最高频路径，任何 panic = 用户眼中的闪退 |
| 4 | 启动串行初始化：迁移+全量 DB+LLM+Lance 全部在 setup 同步完成 | lib.rs L285-691 | P1。数据量大的老用户首窗延迟线性涨，损害"轻快"卖点 |
| 5 | 722 个 Tauri command 无域分层 | 子代理 A4 | P2。配合 #2 一起治理 |
| 6 | 死依赖/死目录：`@tabler/icons-react` 0 引用、`features/practice`=`export {}`、`deep-agent-ref/` 整个子项目、BottomTabBar 布局变量残留 | 子代理 A2/C8 | P2。launch 前清一轮，公开仓库的整洁度就是可信度 |
| 7 | feature 边界规则形同虚设（65 文件跨界 import，规则仅 warn） | eslint boundaries | P2 |

### 5.2 多端实现

| # | 短板 | 证据 | 判断 |
|---|---|---|---|
| 1 | **Release CI 未同步 MainActivity.kt**：返回键接管 + 安全区注入只在本地构建脚本里生效，官方 APK 可能是 Tauri 默认模板 | build_android.sh L205-217 有 sync；release.yml 无此步骤 | **P0**。若属实，官方渠道 Android 用户"一划返回就退出 App"——最高频手势直接坏。发版前必须验证 |
| 2 | Linux 窗口装饰缺失：decorations:false + WindowControls 仅 Windows 渲染 → Debian/KDE 无关闭按钮、不能拉伸（issue #65/#66 未修） | github-issues-review | **P0（launch-blocker）**。HN/Reddit 的受众 Linux 浓度极高，这个 bug 会出现在评论区第一条 |
| 3 | 移动端"判定标准 4 套"（<640/<768/UA/混合），640-768px 行为撕裂 | mobile review A-6 | P1 |
| 4 | 移动端导航不对称：待办/模板管理在部分抽屉无入口；三个页面三种抽屉宽度 | mobile review A-2/A-7/A-8 | P1。移动端 65 项问题中 4×P0/18×P1，建议按该文档 §7 路线图消化 |
| 5 | iOS 停留在"本地脚本可构建"：无 CI、developmentTeam 空、系统 OCR Swift 插件未实现 | 子代理 B4 | P2。诚实标注比假装支持好（README 现在写 "iOS can be built locally" 是合适的） |
| 6 | 纯 Web 版距离 6-12 人月（150+ 文件直连 invoke，无 BackendPort 抽象） | 子代理 B7 | 明确**不做**，但新代码建议走统一 adapter，给未来留门 |

### 5.3 功能设计与学习闭环

| # | 短板 | 证据 | 判断 |
|---|---|---|---|
| 1 | **复习环断裂**：Anki 卡片无应用内复习（只能 AnkiConnect/APKG 导出）；无 FSRS；题目复习用 SM-2 且与卡片体系互不相通 | 子代理 C3.e | **战略级**。"闭环"故事的最后一环是空的。这也是移动端"复习伴侣"定位的前提 |
| 2 | 掌握度数据是死水：answer_submissions/掌握率只回流到统计 UI，不驱动复习调度、不触发制卡、不进记忆 | 子代理 C3.d | 战略级。数据层优势没有兑现成智能 |
| 3 | 记忆系统只服务聊天注入，学习行为（练习/复习/番茄钟）不写入画像 | 子代理 C3.g | P1 |
| 4 | 产物落点不统一：调研报告→笔记 ✓、翻译/作文→VFS ✓，但制卡/批改/调研过程散落在聊天流，无统一任务中心 | 团队自己的 benchmark P1#6 | P1。对标 WorkBuddy 任务范式 |
| 5 | 错题系统废弃但 README 心智仍在（"错题归档"）；qbank 双轨写入（preview_json vs questions 表）历史问题 | prompt_builder.rs 注释、vfs review D12 | P1。功能宣称与实现要对齐 |
| 6 | 引用不回源：RAG 回答无法点击跳回 PDF 页码/笔记段落 | benchmark P1#10 | P1。学习场景的"可核查"是信任刚需 |

### 5.4 UI/UX 与首次体验

| # | 短板 | 证据 | 判断 |
|---|---|---|---|
| 1 | **无 onboarding**：首启只有用户协议弹窗；不配 API key 发消息才收到一条 warning toast | 子代理 D5（`onboarding_completed_flows` key 存在但无 UI 引用） | **P0（launch-blocker）**。QClaw 的 3 分钟标准是 2026 消费级底线；DS 有 SiliconFlow 一键分配的底子，缺的是把它编排成首启向导 |
| 2 | 硬编码中文 2,471 处（仅 src/components 范围）混进英文界面 | check-i18n 输出 | P0（英文 launch 前必须清核心路径）。i18n key 本身是齐的，问题是没用上 |
| 3 | 设置搜索索引建好了但 UI 没接线（props 改名 `_settingsSearchIndex` 弃用） | 子代理 D6.4 | P1。11 个 tab、1,800 个设置 key 没有搜索，新用户会迷路 |
| 4 | 空状态用 ⚠️ emoji 兜底、错误页无插画/无行动指引 | 子代理 D3 | P2 |
| 5 | 设计系统双轨：NotionButton(824 处) vs shad Button(85 处)、NotionDialog vs Sheet 并存 | 子代理 D1 | P2。收敛方向已对（eslint 规则在），继续执行即可 |
| 6 | 图标已基本统一 Phosphor（449 文件），@tabler 是死依赖 | 子代理 D3 | 好消息，删依赖即可 |

### 5.5 生命周期闭环（数据治理）

| # | 短板 | 证据 | 判断 |
|---|---|---|---|
| 1 | 云同步实为"ZIP 整库备份 + 后写覆盖"，行级同步是实验性双轨；无合并、无冲突预览 UI | 子代理 B6、cloud-sync 文档 | P1。README 的 "△ experimental" 标注是诚实的，但产品内要把"备份"与"同步"的心智分开，避免用户以为是 Obsidian Sync 级别 |
| 2 | 备份恢复后的 device identity/游标串库风险（remediation plan INV 清单进行中） | FABLE_SOTA_GOAL P0 | P1，按既有 remediation plan 走 |
| 3 | 审计日志/加密（AES-256-GCM+Argon2id）已成体系 | 子代理 C10 | 优势项，应该在官网/README 作为隐私卖点显性化 |

### 5.6 性能与技术选型

| # | 短板 | 证据 | 判断 |
|---|---|---|---|
| 1 | manualChunks 只分了 i18n/pdfjs/mermaid；katex 在 mindmap 里静态 import；Milkdown 未分包 | vite.config | P1，一天工作量 |
| 2 | 聊天消息列表已虚拟化 ✓、流式 markdown 有 flowtoken ✓、r2d2+WAL ✓、Lance 混合检索+rerank ✓ | 子代理 A10/A6 | 基础是健康的，选型（Tauri/SQLite/Lance/Zustand）我全部认可，**不建议任何重选型**。Tauri 移动端"桌面伴侣级"成熟度与 DS 的移动端定位匹配 |
| 3 | chat_v2/repo.rs 循环内单条 SQL（N+1 苗头） | 子代理 cffb 4.3 | P2 |

---

## 6. 战略：定位、叙事与版本路线

### 6.1 定位抉择（必须先回答的问题）

三个可选定位：

- **A. 中国学生的 AI 学习工作台**：主打考研/四六级/高考场景，渠道 B站/小红书/公众号。用户最真实（下载数据证明），但 GitHub star 天花板低（中文渠道 star 转化差），且商业化压力会提前到来。
- **B. 全球开源 AI 学习工作台**：英文优先，对标/差异化 DeepTutor，渠道 HN/PH/Reddit。star 天花板高，但支持成本（英文 issue/文档/社区）翻倍，且 DeepTutor 已占英文心智首位。
- **C. 双轨：repo/产品英文优先，社区双语双阵地**（我的建议）。理由：① 20k star 数学上只存在于全球渠道；② 产品的中文用户获取并不依赖 repo 门面（V2EX/B站用户看官网和帖子）；③ DS 对 DeepTutor 的差异（原生多端/无 Docker/学习资产结构化）恰好是英文自托管人群（r/selfhosted、r/LocalLLaMA）最买账的点。

### 6.2 一句话叙事（替换 13 项功能罗列）

现 README 的问题：功能表格 + 对比矩阵 = 参数页，不是故事。V2EX 真实反馈："全是术语，看不懂它是干嘛的。"

建议主叙事（英文首屏）：

> **Your study materials, finally alive.** Import a textbook — chat with it, mind-map it, quiz yourself on it, turn weak spots into flashcards, and review them on your phone. All local, all yours, no Docker, no account.

支撑三卖点（每个配一个 GIF）：
1. **One data layer** — 同一份 PDF 在问答/导图/题库/卡片间流转，零复制（现有真实差异）。
2. **Own your data** — SQLite 就在你的磁盘上，AES-256 加密备份到你自己的 WebDAV/S3（把已建成的数据治理显性化）。
3. **Desktop + Android, out of the box** — 全赛道唯一（窗口期 6-12 个月，要快）。

### 6.3 版本路线图（4 个大版本）

**v0.10 — "Launch-Ready"（4-8 周，冻结新功能）**

产品：
- 首启向导：选语言 → 检测 Ollama / SiliconFlow 一键分配（已有）/ 粘贴任意 OpenAI 兼容 key → 内置示例资料包 → 引导发出第一条带引用的消息。目标 3 分钟。
- 修 Linux 窗口装饰（#65/66）、移动端 4 个 P0、验证并修复 release APK 的 MainActivity 同步。
- 清核心路径硬编码中文；英文界面截图重制（59 张 → 精选 10 张 EN + 4-5 个 GIF）。

工程：
- CI 门禁：vitest + eslint + clippy 入 ci.yml；恢复 smoke E2E（启动+发消息）。
- 清死依赖/死目录（@tabler、deep-agent-ref、note/、docs/6.12-13 移出或 ignore）。✅ 已落地 2026-07-04：@tabler 已卸载；docs/6.12、6.13 已迁入 gitignore 的 docs/archive/；deep-agent-ref/、note/ 此前已 ignore。
- chat_v2/repo.rs 与 sync 热路径 unwrap 清理。

门面：
- README 重写（EN 主 + CN 链接）、topics 填满、Discussions 分区（Announcements/Q&A/Ideas）、开 Discord + QQ 群、good-first-issue 挂 10 个（从上帝文件拆分任务里出）。
- 官网英文版 + deepstudent.app 或 .ai 域名评估。

**v1.0 — "The Launch"（点火周）**

- 周二 09:00 ET Show HN（标题打"local-first, no Docker, real Android app"差异点）+ 同日 Product Hunt + r/selfhosted + r/LocalLLaMA；同 48h 内 B站视频 + 小红书 + 少数派 + V2EX 更新帖。
- 配套一篇硬核技术博客：《一个本地优先学习应用的数据层设计：SQLite + LanceDB + Blob 的统一 VFS》——DS 没有 HKU/arXiv 背书，工程深度博客是最可信的替代背书，HN 尤其吃这套。
- launch 后 48h 全员回评论/回 issue（<2h 首响）。
- 目标：Trending 上榜、当月 +2,000-5,000 star、Discord 500 人。

**v1.x — "Community"（3-6 个月）**

- 每月一个 feature release + release notes 点名贡献者；每次大版本二次 launch（PH 可反复发）。
- 贡献者体系：AGENTS.md 脱敏公开（修死链）、架构导览文档、`good first issue` 常备 ≥15、首 PR 响应 <24h 的纪律。
- 技能生态轻量启动：GitHub 上建 `deepstudent-skills` 仓库 + 应用内一键导入 URL（不自建市场基建）；对齐 SKILL.md 生态兼容性（DeepTutor EduHub 走的 ClawHub 兼容路线值得跟进）。
- 从活跃贡献者中发展 1-2 名 co-maintainer（3+ 维护者存活率 +70%）。

**v2.0 — "The Learning Engine"（补全闭环故事）**

- **应用内 FSRS 复习中心**：ts-fsrs/fsrs-rs 引入；卡片与题目统一进复习队列；Anki 导出降级为"高级选项"而非唯一出口。
- **移动端 = 复习伴侣**：今日复习首屏化、桌面产卡→手机通知→通勤刷卡闭环（对标团队 benchmark P2#12）。
- **掌握度驱动**：错题→自动建议制卡；薄弱知识点→影响复习调度与练习出题；学习行为写入记忆画像。
- **引用回源**：RAG 回答点击跳回 PDF 页码/笔记段落。
- **学习任务台**：制卡/批改/翻译/调研统一任务实体 + 审阅队列（benchmark P1#6）。
- 叙事升级："Replace NotebookLM + Anki + your error notebook with one local app."

### 6.4 不做清单（同样重要）

- ❌ 纯 Web 版（6-12 人月，且稀释本地优先叙事）
- ❌ IM 遥控/接入（与无账号哲学冲突）
- ❌ 自建插件市场基建（GitHub repo + 导入链接足够）
- ❌ Computer Use 类能力（学习场景无刚需，安全面陡增）
- ❌ 多代理并行云执行（BYO-key 用户会被并行费用吓跑）
- ❌ 换许可证（AGPL 对终端应用无伤：Cherry Studio 47k/Khoj 35k 皆 AGPL；重新授权是精力黑洞）
- ❌ iOS App Store 上架（先维持"自构建指南"，等 star>5k 再评估）

---

## 7. 风险与诚实的反面观点

1. **"launch 前打磨"可能变成永远打磨**。给 v0.10 设硬 deadline（建议 8 周），到点即发，完美主义是 launch 的头号敌人。
2. **DeepTutor 的先发心智**。英文场"AI tutor"关键词已被占；DS 的差异叙事必须避开"tutor"词根，主打 "study workbench / local-first / your data"。
3. **两人团队的支持带宽**。launch 成功 = issue 量 ×10。CI 门禁、issue 模板、FAQ、Discussions 分流必须在 launch 前就位，否则会被淹死在支持里（这正是 v0.10 工程项的意义）。
4. **star ≠ 成功**。2026 年投资人/开发者都知道 star 可刷、可褪色。北极星建议定为"周活跃设备数（本地统计，用户自愿上报）+ 月度外部贡献者数"，star 是过程指标。
5. **移动端窗口期**。Cherry Studio 已把 Android/iOS 排上日程；"唯一有真移动端"的卖点保质期约 6-12 个月，v2.0 的复习伴侣要赶在窗口内立住。

---

## 8. 附录：数据来源

- 子代理事实报告 ×5（架构/多端/功能/UIUX/社区，2026-07-04）
- GitHub API：star 时间线、releases 下载量、issue/PR 计数、topics、CI runs
- 团队内部评审：mobile-uiux-review(65 项)、github-issues-review(15 issue 逐条)、anki-cardforge-review、vfs-learning-hub-chatv2-review、docs-distribution-review、uiux-benchmark ×2、FABLE_SOTA_GOAL
- 外部：DeepTutor repo/README/报道、AFFiNE 增长复盘（gingiris.tools）、sspai 5000-star 复盘、Open Notebook/Khoj/SurfSense/PageLM/KnowNote/Recall/Pupil 等 repo 数据、ChatGPT Study Mode / Gemini Guided Learning 官方页、Tauri 2 移动端 2026 评测、AGPL 采用研究（Pigsty 复盘、Google AGPL 政策）、StudyFetch 增长案例
