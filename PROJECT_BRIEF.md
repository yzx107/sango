# Sango Project Brief

## 一句话定位

Sango 是一个网页端 Three.js / TypeScript 三国历史策略游戏 Demo，目标是重现童年经典 FC 三国策略游戏《霸王的大陆》带来的“选君主、经营城池、出征扩张、统一天下”的策略节奏与复古气质，但所有代码、地图、美术、UI、文本、数值和资产都必须是原创实现。

## 灵感来源与边界

本项目可以参考《霸王的大陆》这类 8-bit 三国策略游戏的抽象玩法结构：

- 189 年左右群雄开局。
- 玩家选择君主。
- 多势力争夺城池。
- 回合制城池经营。
- 武将带兵出征。
- 自动战斗和战报。
- 最终目标是统一全图。
- 低分辨率像素感、有限色板、复古战略界面。

本项目不能复制任何商业游戏内容：

- 不使用原作截图、ROM dump、精灵、头像、地图、Logo、音乐、音效、字体文件。
- 不逐像素复刻原作 UI。
- 不照搬原作地图布局、城池数值、武将数值表、剧情台词或菜单文案。
- 不生成“看起来像原作截图”的完整菜单图作为可识别背景。
- 不使用带有商业游戏商标、Logo、标题或可识别版式的素材。

允许使用：

- 真实历史人物姓名。
- 真实历史地名。
- 189 年群雄割据的历史大背景。
- 通用策略游戏机制，例如回合制、城池经营、征兵、出征、自动战斗、势力关系。
- 原创像素风、低多边形沙盘、竹简/漆木/铜饰质感等视觉语言。

一句话规则：**复刻的是记忆里的玩法爽感和 8-bit 三国战略气质，不复刻任何原作资产或精确界面。**

## 当前游戏形态

技术栈：

- Vite
- TypeScript
- Three.js
- Playwright
- localStorage 单机存档

当前已实现：

- 3D 低多边形沙盘地图。
- 189 年 12 月“群雄初起”开局。
- 7 位可选君主：
  - 刘备
  - 曹操
  - 孙坚
  - 袁绍
  - 董卓
  - 刘焉
  - 马腾
- 30 座真实历史城池。
- 69 名历史人物。
- 命令书行动资源。
- 城池经营：农业、商业、城防、民忠、技术。
- 军事：征兵、训练、出征。
- 行军动画。
- 自动战斗结算。
- 单挑数值演算和小场景。
- AI 回合。
- 存档、读档、重新开局。
- 君主选择页。
- 顶部资源条、右侧城池面板、左侧小地图、底部日志。
- Gemini 生成的君主头像与开局背景已接入 `public/assets/generated/`。

当前远程仓库：

- `https://github.com/yzx107/sango`

## 游戏体验目标

玩家打开游戏后应该感受到：

1. 这是一款“老派三国策略游戏”的现代网页 3D 沙盘版本。
2. 第一眼能选君主，理解自己从哪里开局。
3. 每回合命令书有限，不能无限操作，有经典回合策略节奏。
4. 城池、道路和相邻出征形成清晰的战略路径。
5. 玩家可以通过经营和出征逐步扩张。
6. AI 会推进世界，不是静态地图。
7. 美术有 FC / 8-bit 怀旧味道，但 UI 仍然适合现代桌面浏览器阅读。

## 美术方向

关键词：

- 8-bit inspired
- retro strategy map
- FC/NES-era mood
- limited palette
- hard edge pixel art
- deep teal
- dark ink black
- old gold
- muted cinnabar red
- rice white text
- lacquered wood panel
- bronze border
- sand table strategy board

应该做：

- 原创像素君主头像，统一构图。
- 无乱码、无英文标签、无错误人物名。
- 背景应像“复古战略地图氛围纹理”，不是完整菜单截图。
- UI 面板要像原创的竹简、漆木、铜边战略界面。
- 文字要清晰，不用强 CRT 模糊遮挡可读性。
- 移动端不能横向溢出。

不应该做：

- 直接模拟某个商业游戏标题画面。
- 在背景图里写 `THREE KINGDOMS`、`SELECT FACTION` 之类英文菜单。
- 在头像里带错误名字或英文拼音。
- 生成带明显商标、Logo、版权感边框的图。
- 把美术做成写实三国影视风；本项目要复古策略像素感。

## Antigravity 的职责

Antigravity 是本地美术/UI agent。

优先任务：

- 生成和替换 `public/assets/generated/` 中的头像与背景。
- 更新 `public/assets/generated/manifest.json`。
- 检查图片真实格式、尺寸、清晰度和是否有文字错误。
- 微调 `src/styles.css`，让 UI 和资产风格一致。
- 必要时给 Codex 留下具体 UI 接入建议。

不要做：

- 不改 `src/game/`。
- 不改 `src/data/`。
- 不改战斗、AI、命令书、存档、路径和数值系统。
- 不提交构建产物和测试截图。

完成后必须更新：

- `.ai-bridge/agent-status.md`

## Codex 的职责

Codex 是本地 Three.js 游戏开发 agent。

必须使用 Three.js game skill 套件：

- `threejs-game-director`
- `threejs-gameplay-systems`
- `threejs-game-ui-designer`
- `threejs-qa-release`
- 需要图像生成/接入时使用 `threejs-image-generator`

优先任务：

- 游戏系统。
- Three.js 渲染。
- 数据模型。
- 回合、AI、战斗、存档。
- 测试和验证。
- 接入 Antigravity 交付的美术资产。
- 维护项目文档和协作协议。

Codex 接手 Antigravity 工作后需要跑：

```bash
npm run build
npm run validate:data
npm test
npm run verify:visual
```

涉及画面和移动端时继续跑：

```bash
npm run inspect:canvas
node scripts/inspect-threejs-canvas.mjs --mobile --out artifacts/canvas-inspection
```

## ChatGPT Remote Reviewer 的职责

ChatGPT 通过 GitHub 远程读取项目，负责：

- 读 `PROJECT_BRIEF.md` 理解项目目标。
- 读 `AGENTS.md` 理解协作机制。
- 读 `.ai-bridge/current-plan.md` 理解当前任务。
- 读 `.ai-bridge/agent-status.md` 理解最新交付状态。
- 审查 GitHub diff。
- 指出范围偏离、复刻风险、测试缺口和下阶段建议。

ChatGPT 不应只根据聊天上下文猜项目目标；必须以仓库文档为事实源。

## 当前资产问题

当前 `public/assets/generated/` 中已有 Gemini 生成资源，但仍需美术 agent 复核：

- 7 张头像是否统一。
- 袁绍、马腾图内文字是否需要裁掉或重出。
- `.png` 文件内部编码是否为 JPEG。
- 背景图是否过于像完整英文菜单截图。
- `manifest.json` 是否准确记录真实格式和生成批次。

## 当前最高优先级

下一步不是加新玩法，而是让 Antigravity 完成美术资产定稿：

1. 重做或修正背景图，去掉完整菜单截图感和英文文字。
2. 修正头像内文字问题。
3. 统一图片真实格式。
4. 更新 manifest。
5. 交回 Codex 做构建、截图和自动测试。

## 验收标准

第一阶段美术/UI 定稿完成需要满足：

- GitHub 远程文档能让新 agent 明确知道项目是“受《霸王的大陆》启发的原创 Three.js 三国策略 Demo”。
- 资产不包含商业游戏素材或明显照搬 UI。
- 背景不含英文菜单或错误文本。
- 头像统一、无乱码、无明显错误。
- `manifest.json` 与文件真实状态一致。
- 桌面君主选择页可读。
- 手机君主选择页无横向溢出。
- 地图主界面仍能进入。
- `npm run build` 通过。
