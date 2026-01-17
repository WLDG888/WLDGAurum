/**
 * モンスター育成システムの型定義
 * このファイルには、モンスターのレベル、進化ルート、報酬などの型定義が含まれています。
 */

/**
 * モンスターのレベル（1から10まで）
 * union型: 複数の値のうちいずれかを選択できる型
 * 例: 1 | 2 | 3 | ... | 10
 */
export type MonsterLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * レベル定数（レベル値を参照する際に使用）
 */
export const MonsterLevels = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
  LEVEL_6: 6,
  LEVEL_7: 7,
  LEVEL_8: 8,
  LEVEL_9: 9,
  LEVEL_10: 10,
} as const;

/**
 * モンスターの進化ルート
 * - POWER: パワータイプ - 攻撃力重視
 * - SPEED: スピードタイプ - 速度重視
 * - BALANCE: バランスタイプ - バランス型
 * union型: 文字列リテラルのいずれかを選択できる型
 */
export type EvolutionBranch = 'POWER' | 'SPEED' | 'BALANCE';

/**
 * 進化ルート定数（進化ルートを参照する際に使用）
 */
export const EvolutionBranches = {
  POWER: 'POWER',
  SPEED: 'SPEED',
  BALANCE: 'BALANCE',
} as const;

/**
 * レベル別の24時間報酬（WLDG単位）
 * Record型: キーと値のペアを定義する型
 * 例: { 1: 0.1, 2: 0.3, ... }
 */
export const LEVEL_REWARDS: Record<MonsterLevel, number> = {
  [MonsterLevels.LEVEL_1]: 0.1,
  [MonsterLevels.LEVEL_2]: 0.3,
  [MonsterLevels.LEVEL_3]: 0.5,
  [MonsterLevels.LEVEL_4]: 0.8,
  [MonsterLevels.LEVEL_5]: 1.0,
  [MonsterLevels.LEVEL_6]: 1.3,
  [MonsterLevels.LEVEL_7]: 1.5,
  [MonsterLevels.LEVEL_8]: 1.9,
  [MonsterLevels.LEVEL_9]: 2.4,
  [MonsterLevels.LEVEL_10]: 3.0,
};

/**
 * 進化ルートの詳細情報
 * interface: オブジェクトの構造を定義する型
 */
export interface BranchInfo {
  /** ルート名（POWER, SPEED, BALANCE） */
  name: EvolutionBranch;
  /** 表示用のアイコン（絵文字やアイコンネーム） */
  icon: string;
  /** テーマカラー（TailwindクラスやCSSカラーコード） */
  color: string;
  /** ルートの説明文 */
  description: string;
}

/**
 * 各進化ルートの詳細情報マップ
 * 各ルートのアイコン、色、説明を定義
 */
export const BRANCH_INFO: Record<EvolutionBranch, BranchInfo> = {
  [EvolutionBranches.POWER]: {
    name: EvolutionBranches.POWER,
    icon: '⚡',
    color: 'red',
    description: '攻撃力と体力に優れたパワータイプ。高いダメージを出せるが、速度は遅め。',
  },
  [EvolutionBranches.SPEED]: {
    name: EvolutionBranches.SPEED,
    icon: '💨',
    color: 'blue',
    description: '素早い動きが得意なスピードタイプ。回避率が高く、連続攻撃が可能。',
  },
  [EvolutionBranches.BALANCE]: {
    name: EvolutionBranches.BALANCE,
    icon: '⚖️',
    color: 'purple',
    description: 'バランスの取れた万能型。攻撃、防御、速度のすべてが平均的に高い。',
  },
};

/**
 * モンスターの完全な情報
 * プレイヤーが所有するモンスターの全データを表す
 */
export interface MonsterInfo {
  /** モンスターの一意なID（ウォレットアドレスなど） */
  id: string;
  /** 現在のレベル（1-10） */
  level: MonsterLevel;
  /** 選択された進化ルート */
  evolutionBranch: EvolutionBranch;
  /** モンスターの名前 */
  name: string;
  /** 経験値（次のレベルに必要な経験値を計算する際に使用） */
  experience: number;
  /** 最後に報酬を受け取った時刻（タイムスタンプ） */
  lastClaimTime: number;
  /** モンスターが作成された時刻（タイムスタンプ） */
  createdAt: number;
}
