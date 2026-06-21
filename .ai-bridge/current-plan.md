# Sango Agent Bridge Plan

## 当前 S0.1 任务：ORCHESTRATION-HARDENING

Owner: Codex Game Development Agent

Task ID: S0.1-ORCHESTRATION-HARDENING

目标：修正双生图 provider、任务发现、合同校验和 PR 审查门，不修改任何游戏玩法。

范围：

- `AssetRequest.owner` 支持 `unassigned`、`codex`、`antigravity`。
- `AssetRequest.provider` 支持 `auto`、`codex-native`、`antigravity-native`、`openai-api`、`gemini-api`、`procedural`、`manual`。
- 本地 skill 只禁止 Gemini 硬依赖，不禁止 Codex 在匹配 provider 时生图。
- 增加 worker capability / heartbeat 合同。
- 增加 `npm run queue:validate`，实际校验四类队列 JSON 与 worker heartbeat。
- CI 执行 `npm run agent:loop -- --json`、`queue:validate`、`assets:validate`。
- `agent:loop` 自动检查或初始化 `agent-task` 标签，标签不可用时显式报告。
- WebP 暂时从支持格式移除，资产校验严格检查扩展名、MIME、magic bytes、尺寸和 sha256。
- 后续 agent 使用 `agent/<task-id>-<owner>` 分支创建 PR，禁止直接推送 `main`。

完成后：

- Codex 运行 `npm run agent:loop -- --json`、`npm run agent:check`、`npm run queue:validate`、`npm run assets:validate`、`npm run build`、`npm test`。
- Codex 更新 `.ai-bridge/agent-status.md`。
- 推送 `agent/S0.1-ORCHESTRATION-HARDENING-codex` 并创建 PR，等待 ChatGPT / user 审查。

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

## Antigravity 当前任务

Owner: Antigravity Local Art/UI Agent

目标：完成 Sango Phase 1 美术资产定稿与 UI 视觉统一。不要修改核心游戏逻辑。

请先读取：

1. `PROJECT_BRIEF.md`
2. `AGENTS.md`
3. `.ai-bridge/current-plan.md`
4. `public/assets/generated/manifest.json`
5. `README.md`

必做：

1. 检查 7 张君主头像：
   - 路径：`public/assets/generated/rulers/*.png`
   - 检查刘备、曹操、孙坚、袁绍、董卓、刘焉、马腾是否风格统一、构图统一、无乱码文字、无明显生成缺陷。
   - 特别检查袁绍、马腾头像内置文字；如果文字不合适，请裁掉或重新生成。
2. 修正图片格式：
   - 当前部分 `.png` 文件实际内部为 JPEG 编码。
   - 推荐保持现有文件路径不变，转成真正 PNG。
   - 如果改扩展名为 `.jpg`，必须同步代码引用和 manifest。
3. 更新 `public/assets/generated/manifest.json`：
   - 记录每张图用途、尺寸、真实格式、生成工具、提示摘要、生成批次。
   - 不要把 Gemini 正式图写成 fallback 或占位图。
4. 优化开局背景：
   - 当前 `public/assets/generated/backgrounds/ruler-select.png` 像完整英文菜单截图。
   - 请替换为原创复古战略地图氛围背景，避免可读英文、避免完整菜单 UI、避免商业游戏截图感。
5. UI 视觉统一：
   - 可修改 `src/styles.css`。
   - 重点：君主选择页、顶部条、右侧城池面板、弹窗边框。
   - 保持文字可读，不加重 CRT 模糊滤镜。
   - 手机端不能横向溢出。

禁止：

- 不要修改 `src/game/`
- 不要修改 `src/data/`
- 不要修改战斗、AI、命令书、存档逻辑
- 不要提交 `dist/`、`artifacts/`、`test-results/`
- 不要使用商业游戏截图、ROM 素材、原 Logo、原文案或精确 UI 布局

完成后：

1. 更新 `.ai-bridge/agent-status.md`，写清：
   - 生成/替换了哪些资产
   - 哪些文件被修改
   - manifest 是否同步
   - 是否还有需要 Codex 接入的问题
   - 建议 Codex 跑哪些验证命令
2. 停止并交给 Codex 做构建、截图和测试。

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
