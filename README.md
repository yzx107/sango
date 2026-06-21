# Sango 历史三国策略 Demo

Vite + TypeScript + Three.js 单机回合策略 Demo。当前第一阶段把原先虚构低多边形沙盘迁移为 189 年“群雄初起”历史题材垂直切片：7 位可选君主、30 座真实城池、69 名历史人物、命令书行动资源、自动战斗、AI 扩张、存读档和原创复古视觉基线。

本项目不使用任何商业游戏截图、ROM 素材、精灵、Logo、原文案、原数值表或精确 UI 布局。历史人物、地名、年份与通用回合策略机制用于原创实现。

## 运行

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:5188/`。生产构建：

```bash
npm run build
npm run preview
```

## 验证

```bash
npm run validate:data
npm test
npm run verify:visual
npm run inspect:canvas
```

`assets:fallback` 会重新生成本地原创程序化像素占位图，仅在外部生成资产缺失时使用：

```bash
npm run assets:fallback
```

当前已接入 Gemini 生成的君主头像与开局背景，清单见 `public/assets/generated/manifest.json`。

## 操作

- 首次进入或点击“重新开局”后，先选择 7 位君主之一。
- 左键选择城池，右侧面板执行内政、征兵、训练、出征。
- 鼠标拖拽旋转沙盘，滚轮缩放。
- `WASD` 或方向键平移视角。
- `Space` 结束当前回合。
- `Tab` 切换势力总览。
- `Esc` 关闭弹窗。
- 顶部按钮支持存档、读档、重新开局与结束回合。

## 当前内容

- 开局：公元 189 年 12 月，剧本名“群雄初起”。
- 势力：刘备、曹操、孙坚、袁绍、董卓、刘焉、马腾。
- 城池：襄平、北平、蓟、南皮、邺、平原、北海、下邳、陈留、许昌、洛阳、长安、宛、汝南、寿春、江夏、襄阳、江陵、长沙、柴桑、建业、吴、会稽、汉中、梓潼、成都、江州、建宁、武威、天水。
- 武将：69 名历史人物，含武力、智力、政治、统率、忠诚、体力、技能标签和原创简介。
- 命令书：每回合按玩家城池数刷新，内政、征兵、训练、出征各消耗 1 枚。
- 沙盘：地形起伏、山脉、河流、道路、森林、城池、旗帜、选中高亮和小地图。
- 战斗：相邻敌城出征、武将与兵力选择、行军动画、自动结算、归属变化、战报弹窗。
- 单挑：战前概率触发，使用 3D 小竞技场和 5 回合数值演算表现。
- AI：按粮草、金钱、边境压力和弱敌机会做有限行动，并在控制台输出决策。
- 存档：使用 `localStorage` v2 存档；旧虚构剧本存档会被安全拒绝并回到君主选择。

## 扩展入口

- 剧本与存档版本：`src/data/scenarios.ts`。
- 城池与道路：`src/data/cities.ts`、`src/data/mapGraph.ts`。
- 武将：`src/data/generals.ts`。
- 势力：`src/data/factions.ts`。
- 战斗公式：`src/data/battleConfig.ts`。
- 命令书与初始状态：`src/game/GameState.ts`。
- AI 行为：`src/game/AISystem.ts`。
- 城池经营收益：`src/game/EconomySystem.ts`。
- 沙盘表现：`src/render/`。
- 面板、弹窗、君主选择：`src/ui/`。

## 已知问题

- 当前美术资产来自 Gemini 生成文件；后续如继续迭代，应保持 `manifest.json` 与文件路径同步。
- AI 仍是轻量规则，不做深度战略搜索。
- 外交只有关系数值占位，还没有谈判、同盟、劝降等操作。
- 单挑是数值与小场景表现，还没有复杂动作拆招。
- Vite 生产构建可能继续提示 Three.js chunk 偏大，本阶段不做无关拆包。
