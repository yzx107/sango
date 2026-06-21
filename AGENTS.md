# Sango Agent Collaboration Protocol

本仓库采用“远程审阅 + 本地美术 + 本地游戏开发”的三 agent 协作方式。所有 agent 都要先读取 `PROJECT_BRIEF.md` 理解项目目标，再遵守本文件，并继续读取 `.ai-bridge/current-plan.md` 和 `.ai-bridge/agent-status.md`。

## 角色边界

### ChatGPT Remote Reviewer

- 工作位置：GitHub 远程仓库。
- 主要职责：通过 GitHub 读取代码、资产清单、状态报告和提交历史，做需求拆解、审查 diff、提出验收意见。
- 默认不直接修改本地 workspace。
- 需要关注：
  - `README.md`
  - `PROJECT_BRIEF.md`
  - `AGENTS.md`
  - `.ai-bridge/current-plan.md`
  - `.ai-bridge/agent-status.md`
  - `public/assets/generated/manifest.json`
  - 最新 commit / PR diff

### Antigravity Local Art/UI Agent

- 工作位置：本地 workspace。
- 主要职责：美术资产、UI 视觉、版式、颜色、像素风格、截图检查。
- 优先修改：
  - `public/assets/generated/`
  - `public/assets/generated/manifest.json`
  - `src/styles.css`
  - 必要时少量修改 `src/ui/`
- 不应修改核心玩法、战斗、AI、数据数值，除非在 `.ai-bridge/current-plan.md` 中明确获得授权。
- 生成资产必须记录来源、用途、尺寸、文件名和提示摘要。
- 如果文件扩展名与真实编码不一致，例如 `.png` 内部是 JPEG，应在 manifest 或状态报告中标出，并在定稿前修正。

### Codex Game Development Agent

- 工作位置：本地 workspace。
- 主要职责：Three.js 游戏系统、数据模型、回合制、AI、战斗、性能、测试和构建。
- 必须使用 Three.js game skill 套件：
  - `threejs-game-director`
  - `threejs-gameplay-systems`
  - `threejs-game-ui-designer`
  - `threejs-qa-release`
  - 需要生成/接入图像时使用 `threejs-image-generator`
- 优先修改：
  - `src/game/`
  - `src/render/`
  - `src/data/`
  - `src/ui/`
  - `tests/`
  - `README.md`
- 不应覆盖 Antigravity 正在生成或刚落盘的资产，除非先在状态文件中记录接管原因。

## 共享状态文件

- `.ai-bridge/current-plan.md`：当前协作计划、任务队列、锁定文件、交接规则。
- `.ai-bridge/agent-status.md`：每个 agent 完成工作后写入的状态报告。
- `public/assets/generated/manifest.json`：生成资产清单，是 UI 代码引用资产的事实来源。

## 工作流

1. 开始前读取 `PROJECT_BRIEF.md`、`AGENTS.md`、`.ai-bridge/current-plan.md`、`.ai-bridge/agent-status.md`。
2. 在 `.ai-bridge/current-plan.md` 写明本轮 owner、目标、文件范围和验收命令。
3. 修改时只碰本轮声明的文件范围。
4. 完成后更新 `.ai-bridge/agent-status.md`，写清：
   - 做了什么
   - 改了哪些文件
   - 资产状态
   - 验证命令和结果
   - 未完成项
5. Codex 负责最终构建和测试：
   - `npm run build`
   - `npm run validate:data`
   - `npm test`
   - `npm run verify:visual`
   - 需要浏览器验收时运行 `npm run inspect:canvas`
6. 推送到 GitHub 后，ChatGPT 通过远程仓库审查最新状态。

## Git 规则

- 不在同一轮混入无关重构。
- 不提交 `dist/`、`artifacts/`、`test-results/`、`node_modules/`。
- 提交前运行至少 `npm run build`。
- 若当前工作树包含其他 agent 的未提交文件，先读状态文件判断归属，不要直接覆盖。
- commit message 使用简短动词短语，例如 `Add agent collaboration protocol`。

## 资产规则

- 君主头像稳定路径：
  - `public/assets/generated/rulers/liubei.png`
  - `public/assets/generated/rulers/caocao.png`
  - `public/assets/generated/rulers/sunjian.png`
  - `public/assets/generated/rulers/yuanshao.png`
  - `public/assets/generated/rulers/dongzhuo.png`
  - `public/assets/generated/rulers/liuyan.png`
  - `public/assets/generated/rulers/mateng.png`
- 开局背景稳定路径：
  - `public/assets/generated/backgrounds/ruler-select.png`
- 每次替换资产后必须同步 `public/assets/generated/manifest.json`。
- 不使用商业游戏截图、ROM 素材、精灵、Logo、原文案或精确 UI 布局。

## 冲突处理

- 如果 Antigravity 正在生成新一批资产，Codex 暂停资产替换，只做读取和报告。
- 如果 Codex 正在改核心系统，Antigravity 暂停 `src/game/`、`src/data/`、`src/render/` 的修改。
- 如果 ChatGPT 远程审查发现本地状态落后，以 GitHub 最新 commit 为远程事实，以本地 `git status` 为本地事实，先同步状态再继续。
