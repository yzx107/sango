# Sango Agent Bridge Plan

## 当前协作模式

- ChatGPT：通过 GitHub 远程读取仓库，负责需求拆解、代码/资产审查、验收意见。
- Antigravity：本地美术与 UI agent，负责生成和替换像素头像、背景、UI 视觉稿、CSS 视觉微调。
- Codex：本地 Three.js 游戏开发 agent，负责游戏系统、Three.js 渲染、数据、测试、构建和发布。

## 当前事实源

- 远程仓库：`https://github.com/yzx107/sango`
- 本地工作区：`/Volumes/Data/Ryan/sango`
- 协作入口：`AGENTS.md`
- 状态报告：`.ai-bridge/agent-status.md`
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
| `README.md` / `AGENTS.md` | Codex | 项目说明和协作协议 |

## 本轮约定

1. Antigravity 如果继续生成新一批美术资产，只落盘到 `public/assets/generated/`，并更新 `manifest.json`。
2. Codex 在 Antigravity 生成期间不覆盖这些图片，只做检查、格式校验、页面接入和测试。
3. ChatGPT 远程审查时优先读取 `AGENTS.md` 和本文件，再审查 diff。
4. 任一 agent 完成后都要更新 `.ai-bridge/agent-status.md`，不要只在聊天里口头说明。

## 必跑验收

Codex 合并或提交前至少运行：

```bash
npm run build
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
