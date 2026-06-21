export type FactionId = 'xuanqi' | 'canghe' | 'yueyao' | 'shulan' | 'beiyan' | 'xichui';

export type RegionId =
  | 'central'
  | 'jiangdong'
  | 'bashu'
  | 'jingxiang'
  | 'hebei'
  | 'xiliang'
  | 'liaodong'
  | 'nanman';

export type TerrainKind = 'plain' | 'river' | 'mountain' | 'forest' | 'pass' | 'coast';

export type DomesticAction = 'agriculture' | 'commerce' | 'defense' | 'loyalty' | 'technology';

export type MilitaryAction = 'recruit' | 'train';

export type GamePhase = 'player' | 'ai' | 'settlement';

export type GameOutcome = 'playing' | 'victory' | 'defeat';

export interface Faction {
  id: FactionId;
  name: string;
  color: string;
  banner: string;
  capitalId: string;
  style: string;
}

export interface CityData {
  id: string;
  name: string;
  region: RegionId;
  terrain: TerrainKind;
  ownerId: FactionId;
  x: number;
  z: number;
  population: number;
  gold: number;
  grain: number;
  troops: number;
  defense: number;
  loyalty: number;
  commerce: number;
  agriculture: number;
  technology: number;
  governorId: string;
  generalIds: string[];
}

export interface CityState extends CityData {
  morale: number;
  acted: boolean;
}

export interface GeneralData {
  id: string;
  name: string;
  age: number;
  factionId: FactionId;
  cityId: string;
  force: number;
  intelligence: number;
  politics: number;
  leadership: number;
  loyalty: number;
  stamina: number;
  skills: string[];
  bio: string;
}

export interface GeneralState extends GeneralData {
  available: boolean;
}

export interface GameLog {
  id: number;
  turn: number;
  text: string;
  tone: 'info' | 'good' | 'warn' | 'battle';
}

export interface DuelRound {
  round: number;
  attackerText: string;
  defenderText: string;
  attackerStamina: number;
  defenderStamina: number;
}

export interface DuelReport {
  attackerGeneralId: string;
  defenderGeneralId: string;
  winnerGeneralId: string | null;
  moraleSwing: number;
  rounds: DuelRound[];
}

export interface BattleReport {
  id: string;
  sourceId: string;
  targetId: string;
  attackerFactionId: FactionId;
  defenderFactionId: FactionId;
  attackerGeneralIds: string[];
  defenderGeneralIds: string[];
  attackerTroops: number;
  defenderTroops: number;
  attackerLosses: number;
  defenderLosses: number;
  attackerWon: boolean;
  logs: string[];
  duel?: DuelReport;
}

export interface MarchOrder {
  id: string;
  sourceId: string;
  targetId: string;
  factionId: FactionId;
  generalIds: string[];
  troops: number;
  progress: number;
  duration: number;
  playerOwned: boolean;
}

export interface BattleConfig {
  troopWeight: number;
  leadershipWeight: number;
  forceWeight: number;
  defenseWeight: number;
  moraleWeight: number;
  grainWeight: number;
  technologyWeight: number;
  terrainBonus: Record<TerrainKind, number>;
  randomRange: number;
}

export interface GameState {
  year: number;
  month: number;
  turn: number;
  phase: GamePhase;
  mode: 'classic' | 'sandbox';
  outcome: GameOutcome;
  playerFactionId: FactionId;
  factions: Record<FactionId, Faction>;
  cities: Record<string, CityState>;
  generals: Record<string, GeneralState>;
  diplomacy: Record<string, number>;
  logs: GameLog[];
  reports: BattleReport[];
  marches: MarchOrder[];
  selectedCityId: string | null;
}
