/**
 * ステーキングパネルコンポーネント
 * 
 * ステーキング中の情報表示と新しいステーキングの作成を提供します。
 */

import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'ethers';
import type { StakeInfo, StakePeriod } from '../../types/staking';
import { STAKE_PLANS, PERIOD_APY } from '../../types/staking';

/**
 * StakingPanelコンポーネントのProps
 */
interface StakingPanelProps {
  /** ステーキング情報（ステーキングしていない場合はnull） */
  stakeInfo: StakeInfo | null;
  /** ステーキングを実行する関数 */
  onStake: (amount: bigint, period: StakePeriod) => Promise<boolean>;
  /** ステーキングを解除する関数 */
  onUnstake: () => Promise<boolean>;
  /** 報酬をClaimする関数 */
  onClaim: () => Promise<boolean>;
  /** 読み込み中かどうか */
  isLoading: boolean;
}

/**
 * StakingPanelコンポーネント
 */
export const StakingPanel = ({
  stakeInfo,
  onStake,
  onUnstake,
  onClaim,
  isLoading,
}: StakingPanelProps) => {
  // ステーキングフォームの状態
  const [selectedPeriod, setSelectedPeriod] = useState<StakePeriod>(30);
  const [amount, setAmount] = useState<string>('');
  const [pendingReward, setPendingReward] = useState<number>(0);

  /**
   * 保留中の報酬を計算する関数
   * 実際のコントラクトから取得する必要がありますが、ここでは仮の計算
   */
  useEffect(() => {
    if (!stakeInfo) {
      setPendingReward(0);
      return;
    }

    const now = Date.now();
    const startTime = stakeInfo.startTime;
    const elapsedMs = now - startTime;

    // APYを1日あたりの利率に変換（単純化された計算）
    const dailyRate = stakeInfo.apy / 100 / 365;
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    
    // 保留中の報酬 = ステーキング額 × 日利 × 経過日数 - 既にClaimした額
    const calculatedReward = stakeInfo.amount * dailyRate * elapsedDays;
    setPendingReward(Math.max(0, calculatedReward - stakeInfo.claimedReward));
  }, [stakeInfo]);

  /**
   * プログレスバーの値を計算する関数（0-100）
   */
  const getProgress = (): number => {
    if (!stakeInfo) return 0;
    
    const now = Date.now();
    const startTime = stakeInfo.startTime;
    const endTime = stakeInfo.endTime;
    const totalPeriod = endTime - startTime;
    const elapsed = now - startTime;

    if (elapsed >= totalPeriod) return 100;
    return (elapsed / totalPeriod) * 100;
  };

  /**
   * 経過日数を計算する関数
   */
  const getElapsedDays = (): number => {
    if (!stakeInfo) return 0;
    
    const now = Date.now();
    const startTime = stakeInfo.startTime;
    const elapsedMs = now - startTime;
    return Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  };

  /**
   * 総日数を取得する関数
   */
  const getTotalDays = (): number => {
    if (!stakeInfo) return 0;
    return stakeInfo.period;
  };

  /**
   * ステーキングを実行する関数
   */
  const handleStake = async () => {
    if (!amount || isLoading) return;

    try {
      // parseEtherを使用して文字列をBigInt（Wei単位）に変換
      const amountInWei = parseEther(amount);
      const success = await onStake(amountInWei, selectedPeriod);
      
      if (success) {
        // 成功したらフォームをリセット
        setAmount('');
      }
    } catch (error) {
      console.error('ステーキングエラー:', error);
    }
  };

  /**
   * Claimを実行する関数
   */
  const handleClaim = async () => {
    if (isLoading) return;
    
    try {
      await onClaim();
    } catch (error) {
      console.error('Claimエラー:', error);
    }
  };

  /**
   * Unstakeを実行する関数
   */
  const handleUnstake = async () => {
    if (!stakeInfo?.canUnstake || isLoading) return;
    
    try {
      await onUnstake();
    } catch (error) {
      console.error('Unstakeエラー:', error);
    }
  };

  // ステーキング中の場合は詳細パネルを表示
  if (stakeInfo) {
    const progress = getProgress();
    const elapsedDays = getElapsedDays();
    const totalDays = getTotalDays();

    return (
      <div className="w-full max-w-3xl mx-auto p-6 backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl border border-white/20 animate-fade-in">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">ステーキング中</h2>
          <div className="text-5xl font-extrabold bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end bg-clip-text text-transparent">
            {stakeInfo.apy}% APY
          </div>
        </div>

        {/* ステーキング詳細情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* ステーキング額 */}
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <p className="text-gray-300 text-sm mb-1">ステーキング額</p>
            <p className="text-2xl font-bold text-white">
              {formatEther(BigInt(Math.floor(stakeInfo.amount * 10 ** 18)))} WLDG
            </p>
          </div>

          {/* ロック期間 */}
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <p className="text-gray-300 text-sm mb-1">ロック期間</p>
            <p className="text-2xl font-bold text-white">{totalDays} 日</p>
          </div>

          {/* 保留中報酬 */}
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <p className="text-gray-300 text-sm mb-1">保留中報酬</p>
            <p className="text-2xl font-bold text-green-400">
              {pendingReward.toFixed(4)} WLDG
            </p>
          </div>

          {/* 累計獲得報酬 */}
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <p className="text-gray-300 text-sm mb-1">累計獲得報酬</p>
            <p className="text-2xl font-bold text-yellow-400">
              {stakeInfo.claimedReward.toFixed(4)} WLDG
            </p>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>経過日数: {elapsedDays} 日</span>
            <span>残り: {Math.max(0, totalDays - elapsedDays)} 日</span>
          </div>
          <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Claimボタン */}
          <button
            onClick={handleClaim}
            disabled={pendingReward <= 0 || isLoading}
            className={`
              flex-1 px-6 py-3 rounded-lg font-semibold text-white
              transition-all duration-300 transform
              ${pendingReward > 0 && !isLoading
                ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:scale-105 hover:shadow-lg active:scale-95'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                処理中...
              </span>
            ) : (
              `💰 Claim報酬 (${pendingReward.toFixed(4)} WLDG)`
            )}
          </button>

          {/* Unstakeボタン */}
          <button
            onClick={handleUnstake}
            disabled={!stakeInfo.canUnstake || isLoading}
            className={`
              flex-1 px-6 py-3 rounded-lg font-semibold text-white
              transition-all duration-300 transform
              ${stakeInfo.canUnstake && !isLoading
                ? 'bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 hover:scale-105 hover:shadow-lg active:scale-95'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                処理中...
              </span>
            ) : stakeInfo.canUnstake ? (
              '🔓 Unstake'
            ) : (
              '🔒 ロック中'
            )}
          </button>
        </div>
      </div>
    );
  }

  // 未ステーキングの場合はフォームを表示
  return (
    <div className="w-full max-w-3xl mx-auto p-6 backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl border border-white/20 animate-fade-in">
      {/* ヘッダー */}
      <h2 className="text-3xl font-bold text-white text-center mb-6">ステーキング</h2>

      {/* プラン選択 */}
      <div className="mb-6">
        <p className="text-gray-300 text-sm mb-3">プランを選択</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAKE_PLANS.map((plan) => (
            <button
              key={plan.period}
              onClick={() => setSelectedPeriod(plan.period)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-300 transform
                ${selectedPeriod === plan.period
                  ? 'border-gradient-start bg-gradient-to-br from-white/20 to-white/10 shadow-lg scale-105'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:scale-102'
                }
              `}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{plan.icon}</div>
                <div className="text-white font-semibold mb-1">{plan.name}</div>
                <div className="text-xl font-bold bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end bg-clip-text text-transparent">
                  {plan.apy}% APY
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 選択されたプランの詳細 */}
      {(() => {
        const selectedPlan = STAKE_PLANS.find((p) => p.period === selectedPeriod);
        if (!selectedPlan) return null;

        return (
          <div className="mb-6 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <p className="text-gray-300 text-sm mb-2">{selectedPlan.description}</p>
            <p className="text-white font-semibold">
              期間: {selectedPlan.period}日 ({selectedPlan.periodMonths}ヶ月) | APY: {selectedPlan.apy}%
            </p>
          </div>
        );
      })()}

      {/* 金額入力 */}
      <div className="mb-6">
        <label className="block text-gray-300 text-sm mb-2">
          ステーキング額 (WLDG)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          min="0"
          step="0.0001"
          className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gradient-start focus:border-transparent"
        />
        {amount && (
          <p className="mt-2 text-sm text-gray-400">
            入力額: {amount} WLDG
            {' → '}
            {parseEther(amount).toString()} Wei
          </p>
        )}
      </div>

      {/* 予想報酬の表示 */}
      {amount && parseFloat(amount) > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 backdrop-blur-sm border border-green-500/20">
          <p className="text-gray-300 text-sm mb-1">期間終了時の予想報酬</p>
          <p className="text-2xl font-bold text-green-400">
            {(parseFloat(amount) * (PERIOD_APY[selectedPeriod] / 100)).toFixed(4)} WLDG
          </p>
          <p className="text-xs text-gray-400 mt-1">
            (元本 {amount} WLDG + 報酬 {((parseFloat(amount) * PERIOD_APY[selectedPeriod]) / 100).toFixed(4)} WLDG)
          </p>
        </div>
      )}

      {/* Stakeボタン */}
      <button
        onClick={handleStake}
        disabled={!amount || parseFloat(amount) <= 0 || isLoading}
        className={`
          w-full px-6 py-4 rounded-lg font-semibold text-white text-lg
          transition-all duration-300 transform
          ${amount && parseFloat(amount) > 0 && !isLoading
            ? 'bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end hover:scale-105 hover:shadow-lg active:scale-95'
            : 'bg-gray-600 cursor-not-allowed opacity-50'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin mr-2">⏳</span>
            処理中...
          </span>
        ) : (
          `🚀 ${selectedPeriod}日プランでステーキング`
        )}
      </button>
    </div>
  );
};
