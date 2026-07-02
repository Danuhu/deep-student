# 产品对标调研：OpenCode / WorkBuddy / QClaw / Codex App / Claude App（2026-07-02）

> 目的：对标五款 2026 年主流 AI 桌面/代理产品的功能与 UX 设计，结合 Deep Student 的特殊性（本地优先、无账号、BYO-key、学习域、Tauri 桌面+Android、中文用户），提炼可落地的优化方向。
> 前置阅读：`docs/reviews/uiux-benchmark-cherrystudio-opencode-codexapp-2026-06-12.md`（Cherry Studio 设计系统治理、OpenCode TUI、Codex 2026-04 前的能力已覆盖，本文不重复，只补 5-6 月新动向）。
> 信息截至 2026-07-01。

---

## 一、五款产品速览与 2026 年中新动向

### 1. OpenCode（v1.17.x，2026-06）——「会话即资产」的时间旅行与多窗口

定位不变（开源编码代理，客户端/服务端分离），6 月桌面版的增量集中在**会话管理精细化**：

- **会话快照与回滚（Session Snapshots & Revert）**：可把会话回滚到任意一条历史消息，**连同文件改动一起回退**。「对话 + 副作用」作为整体可撤销，是 6 月最重要的信任基建。
- **Chrome 式标签页体系**：`mod+1..9` 切换、可拖拽排序、标签 hover 显示项目/路径/分支/服务器预览卡、每窗口独立标签集、失效会话自动关标签。会话被当作「浏览器标签」级别的一等公民管理。
- **可搜索模型选择器 + composer 内模型管理**：模型切换不再进设置页。
- **提问弹窗可最小化**（question prompts minimize/restore）：代理提问不再阻塞界面，用户可以先干别的再回来答。
- **移动端 PWA 补课**：底部导航、safe-area、会话布局精调——验证了「代理产品最终都要长出移动伴侣形态」。

**对 DS 的启示**：AI 修改学习资料（笔记/思维导图/卡片）的「整轮回滚」价值极高；会话标签 hover 预览可borrow 到 session-browser；「提问不阻塞」对应 DS 的 ToolApprovalCard——审批卡也应可最小化挂起。

### 2. WorkBuddy（腾讯，2026-03）——任务中心而非聊天中心

定位：全场景办公 AI 工作台（「小龙虾」，OpenClaw 系）。核心 UX 范式与聊天产品根本不同：

- **信息架构是「任务」不是「会话」**：创建任务（选工作模式→描述→加上下文）→ 任务列表（按状态筛选）→ 对话跟进 → **结果面板**（Artifacts / All Files / Changes / Preview 四视图）。
- **交付物直接写进真实文件**：官方卖点「你的最终产出永远不经过剪贴板」——图表直接是 Excel、报告直接是 Word/PPT，不是聊天窗里的 markdown。
- **多代理并行工作流**：一个任务拆成 A/B/C/D/E 多个代理并行（检索、整理、写作、排版），过程与结果都留档供审查。
- **技能生态**：20+ 内置技能包 + 一键导入 OpenClaw 技能 + 零代码自建技能。
- **沙箱 + 授权文件夹**：默认隔离，只能碰用户明确授权的目录。
- **IM 遥控**：企业微信 1 分钟接入，手机发语音指令、办公电脑执行（QQ/飞书/钉钉原生支持）。

**对 DS 的启示**：这是「学习任务台」的完整参照——DS 的制卡（task-dashboard）、批改、翻译、调研本质都是长任务，但目前散落在各特性里，没有统一的任务列表/状态筛选/结果面板；产物也常困在聊天流里而非落进学习资源库。

### 3. QClaw（腾讯，国际版 2026-04）——消费级代理的「零门槛 + 养成系」

定位：个人本地 AI 代理（OpenClaw 消费壳），面向完全非技术用户：

- **3 分钟上手**：下载 → 注册 → 扫码，无终端、无 Python、无 API 配置。预集成多家顶级模型，**BYO API key 是可选项而非门槛**。
- **IM 即界面**：WhatsApp/Telegram/微信/QQ 里加个「联系人」，像给朋友发消息一样指挥自己的电脑。手机是遥控器，电脑是执行体。
- **场景化预配代理包**：QClaw It（跑腿：订票/报税）、QClaw Daily（习惯养成：健身/睡眠/健康打卡）、QClaw Up（工作：营销/求职）。**用户不是从零配置代理，而是领养一只已经会干活的**。
- **Claw Gateway 安全层**：实时检测恶意指令与技能投毒、记录 AI 每一步操作、权限可逐项关闭。「安全」做成了可见的产品层而非文档承诺。
- **本地处理 + 养成叙事**：数据在用户设备内处理；「cultivate（养成）」是官方措辞——代理越用越懂你（长期记忆）。
- 数据点：中国版上线 10 天破百万用户；国际版 5 天开发、99% 代码由 QClaw 自己生成。

**对 DS 的启示**：DS 与 QClaw 共享「本地、隐私、你的设备你做主」哲学，但上手体验是天壤之别——DS 首启没有引导，BYO-key 是硬门槛。QClaw Daily 的习惯养成 = DS 复习打卡/番茄钟的直接对标，说明「学习教练养成系」有大众市场验证。

### 4. Codex App（OpenAI，2026-05/06 增量）——远程指挥与工作流固化

在 4 月版（项目/线程、任务侧栏、自动化+审阅队列）基础上，5-6 月新增：

- **Codex Remote GA（6-16）**：ChatGPT 手机 app 直接指挥家里/公司的 Mac/Windows 主机——看进度、批准操作；QR 一对一配对认证。**手机不执行，只指挥**。
- **Record & Replay（6 月，macOS）**：录制一遍你的操作演示，自动转成可复用技能。「教 AI 干活」从写 prompt 变成「做给它看」。
- **Appshots（6-10）**：连按两下 Command，把前台应用窗口截图+可读文本直接发给 Codex。系统级「看我屏幕」入口。
- **Goal mode 转正（5-21）**：给目标而非指令，代理自主推进直到达成。
- **Computer Use 扩展到 Windows（5-29）**、**Chrome 扩展**（并行浏览器工作流）、**/init**（生成项目说明）、**未读会话分区**、**usage/profile 页**（用量透明化）。

**对 DS 的启示**：Appshots 式系统级入口对学习场景极合适（看网课/读论文时一键问「这页什么意思」）；Record & Replay 提示了技能创建的低门槛化方向；「手机指挥桌面」验证了跨设备任务协同的需求。

### 5. Claude App / Cowork（Anthropic，2026）——知识工作代理的「监督型」范式

Claude Desktop 内置 **Cowork 模式**（与 Chat 模式切换），把 Claude Code 的代理架构包装给非技术用户：

- **模式选择器**：同一入口，Chat（对话起草）vs Cowork（跨应用多步交付）。产品矩阵明确「什么场景用什么模式」。
- **本地文件夹授权模型**：用户选定 Cowork 可读写的文件夹，成品直接回写到这些文件夹。
- **Projects = 工作区**：相关任务分组，携带自己的文件、上下文与记忆。
- **子代理并行 + 长任务后台跑**：描述结果，走开，回来收成品（Excel 带公式、PPT、格式化文档）。
- **引用回源（citations）**：交付物中的结论**引用回真实文件与消息**，可核查。
- **Scheduled tasks**：定时/周期任务。
- **Dispatch**：一条与 Claude 的连续对话，手机/桌面都能说话；Claude 自己判断该在哪个工作区干活，干完把结果发回给你（桌面 app 需在线）。
- **插件市场**：技能+连接器打包成 plugin，企业可自建私有市场与治理（分发策略、预审批、按组覆盖）。
- 安全叙事：「人类监督下的代理」——重大决策留给用户。

**对 DS 的启示**：「模式选择器」优于 DS 当前把代理能力藏进聊天工具调用的做法；「引用回源」是学习产品刚需（AI 说的每个结论能跳回 PDF 原文位置）；Projects 的「任务+文件+记忆」分组与 DS 的课题（topic）概念天然对应。

---

## 二、2026 年中的行业收敛点（六条共性）

1. **任务中心取代聊天中心**：WorkBuddy 的任务列表、Codex 的线程+任务侧栏、Cowork 的委托-交付，全都把「聊天」降级为任务的跟进方式。聊天流里堆产物的时代结束了。
2. **交付物落地真实文件 + 引用回源**：产出直接写进用户的文件体系（WorkBuddy/Cowork），结论可溯源（Cowork citations、Codex sources）。
3. **会话/操作可回滚**：OpenCode 快照回滚、Codex diff 审阅暂存回退。「代理动过的东西能整体撤销」成为信任底线。
4. **手机 = 指挥端**：Codex Remote、Cowork Dispatch、QClaw/WorkBuddy IM 遥控。重活在桌面/主机跑，手机负责发起、监督、审批、收结果。
5. **主动性（proactive）产品化**：OpenClaw heartbeat、Cowork scheduled tasks、Codex automations+线程心跳、QClaw Daily 例行。代理从「问答」走向「值守」。
6. **安全做成可见的 UX**：Claw Gateway 行动日志、Codex 审批分级+沙箱、Cowork 文件夹授权、WorkBuddy 沙箱。授权范围、行动记录、一键断电都是界面元素而非文档。

---

## 三、Deep Student 的特殊性（照抄会翻车的地方）

| 特殊性 | 对策 |
|---|---|
| **学习域而非办公/编程域**：用户产出是理解、记忆、成绩，不是 PPT 和 PR | 「任务」要翻译成学习任务（制卡/批改/调研/大纲/复习计划）；「交付物」是卡组、笔记、错题本；审阅队列的心智是「老师批改完等你订正」 |
| **本地优先、无账号、无云端**：五家中四家有云/账号体系兜底 | 不做云端执行与账号中转；Dispatch/Remote 的 DS 版本 = WebDAV 同步 + 本地通知的产品化，或局域网设备直连；这同时是隐私卖点，应在 UX 中明示（QClaw 式「数据不出设备」标识） |
| **BYO-key 是第一道墙**：QClaw 证明「预集成模型+可选 key」才是消费级门槛 | 首启引导必须重做：检测本地 Ollama（已支持）→ 引导免费/低价渠道（SiliconFlow 已有专区）→ BYO-key 放最后；目标「3 分钟到第一次对话」 |
| **Tauri/WebKit 而非 Electron**：OpenCode 弃 Tauri 的教训在案 | 坚持轻量优势（Cherry 400MB+ 内存被诟病），重交互组件跨 WebKit 专项测试；不追 Chromium-only 特性 |
| **已有真 Android app**：五家都没有（靠 IM/ChatGPT app 中转） | 这是稀缺资产。方向不是接 IM（与无账号哲学冲突、合规复杂），而是把移动端做成「复习伴侣 + 任务发起端」 |
| **中文学习者 + 单人/小团队开源**：资源有限 | 只做高杠杆项；能复用现有基建（skills/MCP/记忆/task-dashboard/WebDAV）的优先 |

---

## 四、优化方向建议

### P0 —— 低成本、直接补短板

| # | 方向 | 对标来源 | 落地 |
|---|---|---|---|
| 1 | **首启引导重做（3 分钟到首答）** | QClaw 零门槛 | 首启向导：选语言→检测 Ollama/引导 SiliconFlow 免费额度/粘贴任意 OpenAI 兼容 key→发一条示例消息。移动端审计中的 GU-1（手势可供性提示）并入本项 |
| 2 | **审批卡可挂起 + 审批分级** | OpenCode 提问最小化、Codex 审批分级 | ToolApprovalCard 支持最小化到输入栏角标（不阻塞阅读）；增加「仅此次/本会话允许/总是允许」三档（上一份对标 P0#4，仍未落地） |
| 3 | **会话标签 hover 预览** | OpenCode v1.17 | session-browser 与侧栏会话项 hover 显示：所属课题/消息数/最后模型/token 用量小卡片 |
| 4 | **AI 行动日志（信任面板）** | Claw Gateway | 设置页新增「AI 操作记录」：每次工具调用对文件/待办/卡片做了什么、何时、哪个会话发起，可跳转。后端事件已有（chat_v2 tool events），主要是聚合展示 |
| 5 | **「数据不出设备」可见化** | QClaw 本地叙事 | 关于页/首启页明示：无账号、无遥测、key 存本地 keychain、同步走你自己的 WebDAV。把隐私从 README 移进产品 |

### P1 —— 结构性升级（中成本高价值）

| # | 方向 | 对标来源 | 落地 |
|---|---|---|---|
| 6 | **学习任务台（统一任务中心）** | WorkBuddy 任务范式、Codex 线程 | 把制卡（task-dashboard）、批改、翻译、深度调研统一为「任务」实体：任务列表（运行中/待审阅/已完成筛选）+ 结果面板（产物/涉及文件/变更）+ 完成后进**审阅队列**。产物一律落进学习资源库为真实节点（卡组/笔记/报告），聊天只是跟进入口 |
| 7 | **AI 编辑检查点回滚** | OpenCode 快照回滚 | AI 改笔记/思维导图/卡组前自动快照，会话侧「撤销这轮 AI 修改」一键整体回退（上一份对标 P1#10，行业已把它做成标配，优先级应提升） |
| 8 | **学习教练心跳（主动性）** | OpenClaw heartbeat、QClaw Daily、Cowork scheduled tasks | 基于现有 reminderScheduler + 记忆系统：每日学习摘要通知（到期卡片/待办/昨日薄弱点）、周报自动生成进审阅队列；activeHours 静默时段；无事保持沉默（HEARTBEAT_OK 范式）。桌面常驻 + Android 通知均可达 |
| 9 | **学习者画像记忆** | QClaw 养成、Cowork Projects memory | 现有 MemorySettingsSection 从「对话记忆」升级为结构化学习者画像：薄弱知识点、错题模式、学科偏好、目标（考研/雅思…），跨会话注入；用户可查看/编辑/删除每一条（可解释、可控） |
| 10 | **引用回源** | Cowork citations | RAG/文档问答的回答中，引用点击跳回 PDF 具体页码/笔记具体段落。学习场景的「可核查」比办公场景更硬性（防 AI 幻觉误导备考） |
| 11 | **Appshots 式全局提问** | Codex Appshots、Cherry 快捷助手 | 全局快捷键截取前台窗口/选区 → 迷你问答窗（Tauri 多窗口已有番茄钟先例）。看网课、读文献场景的杀手锏；注意 Cherry 教训：快捷键生命周期管理 |

### P2 —— 战略形态（需真机/用户验证后投入）

| # | 方向 | 对标来源 | 落地 |
|---|---|---|---|
| 12 | **移动端「复习伴侣」定位** | Codex Remote 反向启示 | 桌面产卡→手机通知→通勤刷卡的闭环产品化：任务完成推送、移动端「今日复习」首屏化。不追求移动端跑重任务 |
| 13 | **场景化代理包** | QClaw It/Daily/Up | 把 skills+模板打包成「考研英语教练」「错题分析师」「论文陪读」等预配包，一键领养；社区分享（skills 系统已具备雏形，需要打包与市场 UX） |
| 14 | **零代码技能创建** | WorkBuddy、Codex Record&Replay | 「把我刚才这轮对话固化成技能」一键化——从会话生成 skill 草稿（提示词+工具序列），比录屏回放更贴合 DS 现状 |
| 15 | **模式选择器** | Cowork Chat/Cowork 切换 | 若任务台（#6）落地，入口升级为「问答 / 深度任务」双模式，明示心智边界（即问即答 vs 委托-交付） |

### 不建议做的事

- **不接 IM 遥控**（微信/QQ/Telegram）：与无账号、本地优先哲学冲突，国内 IM 接入合规成本高，且 DS 有自己的移动端可承载同类需求。
- **不做云端执行/多代理并行大集群**：WorkBuddy 的多代理并行依赖云资源与credits 计费，DS 的 BYO-key 用户会被并行调用的费用吓跑；串行+清晰进度已够。
- **不为 Computer Use 类越界能力立项**：学习场景无刚需，安全面陡增。
- **不自建插件市场基建**（现在）：Cowork/Codex 的市场依托企业治理需求，DS 先用 GitHub 仓库 + 导入链接的轻量社区分发即可。

---

## 五、一句话总结

五款产品共同宣告：**2026 年的 AI 应用竞争在「委托-执行-审阅」闭环与「主动值守」能力，聊天窗只是入口之一。** Deep Student 的路径不是照抄办公代理，而是把这套范式翻译进学习域——统一学习任务台（P1#6）+ 检查点回滚（P1#7）+ 学习教练心跳（P1#8）构成下一阶段的主线，QClaw 式零门槛首启（P0#1）决定新用户能不能走到这条主线上。

---

## 附：信息来源

- OpenCode：GitHub `anomalyco/opencode` releases v1.17.8–v1.17.13（2026-06-17 ~ 07-01）
- WorkBuddy：workbuddy.ai 官网与文档（Quick Start/Task Management/View Results）、Tencent Cloud Techpedia 144114、AICost 评测（2026-03-10）、kdjingpai 产品页
- QClaw：qclawsg.qq.com、腾讯官方新闻稿（2026-04）、Help Net Security / eWeek / KrASIA 报道（2026-04-22/23）
- Codex App：OpenAI Release Notes（Codex Remote GA 6-16、26.616/26.609/26.608）、developersdigest 4-6 月变更综述、releases.sh（Computer Use Windows 5-29）
- Claude App/Cowork：claude.com/docs/cowork/overview、Cowork 产品指南与企业管理员指南、anthropic.com/product/claude-cowork
- OpenClaw 范式：docs.openclaw.ai（heartbeat/workspace/memory）、ClawMakers《Building Proactive Agents》、OpenClaw Playbook（heartbeat 配置）
