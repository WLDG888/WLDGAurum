/**
 * ステーキングシステムの型定義
 * このファイルには、ステーキングのロック期間、APY、プラン情報などの型定義が含まれています。
 */

/**
 * ステーキングのロック期間（日数）
 * union型: 複数の値のうちいずれかを選択できる型
 * 例: 30 | 90 | 180 | 365
 */
export type StakePeriod = 30 | 90 | 180 | 365;

/**
 * ロック期間定数（期間値を参照する際に使用）
 */
export const StakePeriods = {
  DAYS_30: 30,
  DAYS_90: 90,
  DAYS_180: 180,
  DAYS_365: 365,
} as const;

/**
 * 期間別のAPY（年利回り）
 * Record型: キーと値のペアを定義する型
 * 例: { 30: 1, 90: 2, ... }
 */
export const PERIOD_APY: Record<StakePeriod, number> = {
  [StakePeriods.DAYS_30]: 3,  // 30日: 3% APY
  [StakePeriods.DAYS_90]: 5,  // 90日: 5% APY
  [StakePeriods.DAYS_180]: 8, // 180日: 8% APY
  [StakePeriods.DAYS_365]: 10, // 365日: 10% APY
};

/**
 * ステーキング情報
 * interface: オブジェクトの構造を定義する型
 * ユーザーがステーキングしている情報を表す
 */
export interface StakeInfo {
  /** ステーキングの一意なID */
  id: string;
  /** ステーキングした金額（WLDG単位） */
  amount: number;
  /** 選択されたロック期間（日数） */
  period: StakePeriod;
  /** APY（年利回り、パーセント） */
  apy: number;
  /** ステーキング開始時刻（タイムスタンプ） */
  startTime: number;
  /** ステーキング終了時刻（タイムスタンプ） */
  endTime: number;
  /** 受け取れる報酬の総額（WLDG単位） */
  totalReward: number;
  /** 既に受け取った報酬の額（WLDG単位） */
  claimedReward: number;
  /** ステーキングが解除可能かどうか */
  canUnstake: boolean;
}

/**
 * ステーキングプラン情報
 * 各プランの詳細情報を表す
 */
export interface StakePlan {
  /** プラン名 */
  name: string;
  /** ロック期間（日数） */
  period: StakePeriod;
  /** 期間を月数で表現（表示用） */
  periodMonths: number;
  /** APY（年利回り、パーセント） */
  apy: number;
  /** プランの説明文 */
  description: string;
  /** プランの表示色（TailwindクラスやCSSカラーコード） */
  color: string;
  /** プランのアイコン（絵文字やアイコンネーム） */
  icon: string;
}

/**
 * 全ステーキングプランの配列
 * 各プランの詳細情報を定義
 */
export const STAKE_PLANS: StakePlan[] = [
  {
    name: '30日プラン',
    period: StakePeriods.DAYS_30,
    periodMonths: 1,
    apy: PERIOD_APY[StakePeriods.DAYS_30],
    description: '短期間のステーキングプラン。1%のAPYで30日間ロックします。',
    color: 'blue',
    icon: '📅',
  },
  {
    name: '90日プラン',
    period: StakePeriods.DAYS_90,
    periodMonths: 3,
    apy: PERIOD_APY[StakePeriods.DAYS_90],
    description: '中期間のステーキングプラン。2%のAPYで90日間ロックします。',
    color: 'green',
    icon: '📆',
  },
  {
    name: '180日プラン',
    period: StakePeriods.DAYS_180,
    periodMonths: 6,
    apy: PERIOD_APY[StakePeriods.DAYS_180],
    description: '長期間のステーキングプラン。4%のAPYで180日間ロックします。',
    color: 'orange',
    icon: '📋',
  },
  {
    name: '365日プラン',
    period: StakePeriods.DAYS_365,
    periodMonths: 12,
    apy: PERIOD_APY[StakePeriods.DAYS_365],
    description: '最長期間のステーキングプラン。6%のAPYで365日間ロックします。',
    color: 'purple',
    icon: '🗓️',
  },
];
