export const mapEdges: [string, string][] = [
  ['luoyuan', 'xuling'],
  ['luoyuan', 'liangtai'],
  ['luoyuan', 'sichuan'],
  ['xuling', 'chenqiu'],
  ['xuling', 'mianjin'],
  ['chenqiu', 'hengqiu'],
  ['chenqiu', 'landu'],
  ['liangtai', 'tangling'],
  ['liangtai', 'zhangyuan'],
  ['sichuan', 'yanyuan'],
  ['sichuan', 'zhangyuan'],
  ['zhangyuan', 'liangsha'],
  ['liangsha', 'jinyu'],
  ['jinyu', 'ziguan'],
  ['ziguan', 'jinping'],
  ['jinping', 'mingu'],
  ['jinping', 'tangling'],
  ['mingu', 'tengyue'],
  ['tengyue', 'xianglin'],
  ['xianglin', 'xiangzhu'],
  ['tangling', 'mianjin'],
  ['tangling', 'xiangzhu'],
  ['mianjin', 'jinglu'],
  ['mianjin', 'yunpu'],
  ['jinglu', 'yunpu'],
  ['yunpu', 'landu'],
  ['landu', 'quze'],
  ['landu', 'haixiu'],
  ['quze', 'haixiu'],
  ['yanyuan', 'hengqiu'],
  ['hengqiu', 'liaochuan'],
  ['liaochuan', 'xuanhai'],
  ['hengqiu', 'xuanhai'],
  ['yanyuan', 'zhangyuan'],
];

export const rivers: string[][] = [
  ['jinyu', 'liangtai', 'luoyuan', 'mianjin', 'yunpu', 'landu', 'haixiu'],
  ['mingu', 'jinping', 'tangling', 'xiangzhu', 'xianglin'],
];

export const mountainBelts = [
  { x: -19, z: -4, count: 13, spreadX: 6, spreadZ: 5 },
  { x: -16, z: 7, count: 18, spreadX: 8, spreadZ: 7 },
  { x: -2, z: 16, count: 10, spreadX: 8, spreadZ: 4 },
];

export const forestBelts = [
  { x: 7, z: 12, count: 45, spreadX: 9, spreadZ: 5 },
  { x: -11, z: 16, count: 42, spreadX: 9, spreadZ: 5 },
  { x: -7, z: -8, count: 34, spreadX: 7, spreadZ: 5 },
  { x: 6, z: -3, count: 24, spreadX: 5, spreadZ: 4 },
];
