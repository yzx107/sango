# Sango Agent Bridge Plan

## 当前 RFC 任务：AI-DRIVEN-OPEN-WORLD

Owner: Codex Game Development Agent

Task ID: RFC-0001-AI-OPEN-WORLD

继承基线：S0.1-ORCHESTRATION-HARDENING 已合入 `main`；本 RFC 不回滚或修改该编排基础设施。

目标：创建一个仅文档的 Draft PR，让 Codex 与 Antigravity 共同评审长期产品方向。

范围：

- 新增 `docs/rfcs/0001-ai-driven-open-world.md`，提出 AI-driven living Three Kingdoms open world 的长期方向。
- 请求 Antigravity 对视觉语言、战略层到在地层转场、NPC 记忆/关系/意图呈现做 UX 评审。
- Codex 提交技术可行性评审，明确 simulation-first、Action API、deterministic fallback 和固定 seed 测试边界。
- 更新 `.ai-bridge/loop-state.md` 为 `needs_review`，`next_owner` 设置为 ChatGPT Remote Reviewer。
- 通过 Draft PR 交给 ChatGPT Remote Reviewer 和项目 owner 审查。

文件范围：

- Allowed:
  - `docs/rfcs/0001-ai-driven-open-world.md`
  - `.ai-bridge/current-plan.md`
  - `.ai-bridge/loop-state.md`
  - `.ai-bridge/agent-status.md`
  - `.ai-bridge/reviews/pending/review-rfc-0001-antigravity-visual-ux.json`
  - `.ai-bridge/reviews/completed/review-rfc-0001-codex-feasibility.json`
- Locked:
  - `src/**`
  - `tests/**`
  - `public/assets/**`
  - `package.json`
  - `package-lock.json`

完成后：

- Codex 运行文档范围内的合同检查：
  - `npm run agent:check`
  - `npm run queue:validate`
  - `npm run assets:validate`
  - `npm run build`
- Codex 更新 `.ai-bridge/agent-status.md`。
- 推送 `agent/RFC-0001-AI-OPEN-WORLD-codex-docs` 并创建 Draft PR，等待 ChatGPT Remote Reviewer、Antigravity 和项目 owner 审查。
- 注：原编排包指定 `rfc/ai-driven-open-world`，但当前 GitHub Actions 分支策略只允许 `agent/*` PR 分支；因此最终可审 PR 使用 `agent/*` 分支，避免 RFC 评审入口红灯。

## 当前协作模式

- ChatGPT：通过 GitHub 远程读取仓库，负责需求拆解、代码/资产审查、验收意见。
- Antigravity：本地美术与 UI agent，负责生成和替换像素头像、背景、UI 视觉稿、CSS 视觉微调。
- Codex：本地 Three.js 游戏开发 agent，负责游戏系统、Three.js 渲染、数据、测试、构建和发布。

## 当前事实源

- 远程仓库：`https://github.com/yzx107/sango`
- 本地工作区：`/Volumes/Data/Ryan/sango`
- 项目介绍：`PROJECT_BRIEF.md`
- 协作入口：`AGENTS.md`
- 状态报告：`.ai-bridge/agent-status.md`
- Loop 状态：`.ai-bridge/loop-state.md`
- 文件锁：`.ai-bridge/file-locks.md`
- 自动化说明：`docs/AUTOMATED_DEVELOPMENT.md`
- 队列 Schema：`.ai-bridge/schemas/`
- 资产清单：`public/assets/generated/manifest.json`

## 文件归属

| 范围 | 默认 owner | 说明 |
| --- | --- | --- |
| `public/assets/generated/` | Antigravity | 生成头像、背景和装饰图 |
| `public/assets/generated/manifest.json` | Antigravity | 每批资产必须同步 |
| `src/styles.css` | Antigravity + Codex | 视觉由 Antigravity 主导，交互适配由 Codex 审核 |
| `src/ui/` | Codex | Antigravity 可提出视觉改造，Codex 保证交互和测试 |
| `src/game/` | Codex | 回合、战斗、AI、存档、命令书 |
| `src/render/` | Codex | Three.js 场景、相机、地形、城池、军队、特效 |
| `src/data/` | Codex | 城池、武将、势力、道路和剧本数据 |
| `tests/` | Codex | 自动化验收 |
| `.ai-bridge/schemas/` | Codex | 任务、AssetRequest、报告和审查请求合同 |
| `.ai-bridge/assets/` | Antigravity + Codex | Antigravity 处理生成队列，Codex 创建请求和验证结果 |
| `README.md` / `AGENTS.md` | Codex | 项目说明和协作协议 |

## 本轮约定

0. 当前自动 loop 状态以 `.ai-bridge/loop-state.md` 为准；如果状态是 `needs_review`，ChatGPT 或用户先审查，再决定是否回到 Antigravity。
1. Antigravity 接管美术/UI 定稿任务时，只落盘到 `public/assets/generated/`，并更新 `manifest.json`。
2. Codex 在 Antigravity 生成期间不覆盖这些图片，只做检查、格式校验、页面接入和测试。
3. ChatGPT 远程审查时优先读取 `AGENTS.md` 和本文件，再审查 diff。
4. 任一 agent 完成后都要更新 `.ai-bridge/agent-status.md`，不要只在聊天里口头说明。

## Antigravity 当前 RFC Review 任务

Owner: Antigravity Local Art/UI Agent

目标：仅审查 RFC-0001 的视觉与 UX 方向，不生成或替换资产，不修改核心游戏逻辑。

请先读取：

1. `PROJECT_BRIEF.md`
2. `AGENTS.md`
3. `.ai-bridge/current-plan.md`
4. `docs/rfcs/0001-ai-driven-open-world.md`
5. `.ai-bridge/reviews/pending/review-rfc-0001-antigravity-visual-ux.json`

必做：

1. 评审战略层与未来在地层是否能保持统一原创视觉语言。
2. 评审第一个可探索城市场景应采用的抽象程度，避免写实影视化或商业游戏截图感。
3. 评审战略地图进入在地层的桌面与移动端 UX。
4. 评审 NPC 记忆、关系、意图和不确定信息的呈现方式，避免压垮当前策略 UI。
5. 给出 Accept / Revise / Reject 建议和主要视觉/UX 风险。

禁止：

- 不要修改 `src/**`
- 不要修改 `tests/**`
- 不要修改 `public/assets/**`
- 不要修改 `package.json` 或 `package-lock.json`
- 不要创建 AssetRequest
- 不要使用商业游戏截图、ROM 素材、原 Logo、原文案或精确 UI 布局

完成后：

1. 在 PR comment、review note 或 `.ai-bridge/reviews/` 中提交视觉/UX 审查结论。
2. 停止并交给 ChatGPT Remote Reviewer 汇总评审意见。

## 必跑验收

Codex 合并或提交前至少运行：

```bash
npm run agent:loop -- --json
npm run agent:check
npm run queue:validate
npm run assets:validate
npm run build
npm test
```

涉及数据、存档、玩法、UI 流程时继续运行：

```bash
npm run validate:data
npm test
npm run verify:visual
```

涉及 Three.js 画面或移动端时继续运行：

```bash
npm run inspect:canvas
node scripts/inspect-threejs-canvas.mjs --mobile --out artifacts/canvas-inspection
```

## 状态记录模板

每个 agent 完成后在 `.ai-bridge/agent-status.md` 追加或改写为：

```md
## Agent Update - YYYY-MM-DD HH:mm

- Owner:
- Goal:
- Files changed:
- Assets changed:
- Validation:
- Open issues:
- Next owner:
```

同时更新 `.ai-bridge/loop-state.md`：

- 当前 owner 继续工作：保持 `state: in_progress`
- 需要美术：设置 `state: needs_art`
- 需要开发：设置 `state: needs_dev`
- 需要远程审查：设置 `state: needs_review`
- 完成：设置 `state: done`
