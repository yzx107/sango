import type { Faction, FactionId } from '../game/types';

export const factions: Record<FactionId, Faction> = {
  xuanqi: {
    id: 'xuanqi',
    name: '玄麒盟',
    color: '#c64a32',
    banner: '麒',
    capitalId: 'luoyuan',
    style: '稳守中原，以农商养兵。',
  },
  canghe: {
    id: 'canghe',
    name: '苍河府',
    color: '#2f7eb8',
    banner: '河',
    capitalId: 'tangling',
    style: '据水网与商路，偏好技术与城防。',
  },
  yueyao: {
    id: 'yueyao',
    name: '越曜军',
    color: '#2c9b6f',
    banner: '曜',
    capitalId: 'landu',
    style: '江海富庶，擅长快速扩张。',
  },
  shulan: {
    id: 'shulan',
    name: '蜀岚盟',
    color: '#d59a2f',
    banner: '岚',
    capitalId: 'jinping',
    style: '山地坚韧，重农业与关隘防守。',
  },
  beiyan: {
    id: 'beiyan',
    name: '北燕庭',
    color: '#7657a8',
    banner: '燕',
    capitalId: 'yanyuan',
    style: '北境骑阵，偏好兵力压制。',
  },
  xichui: {
    id: 'xichui',
    name: '西陲部',
    color: '#a36936',
    banner: '陲',
    capitalId: 'liangsha',
    style: '西岭强兵，机会主义出击。',
  },
};
