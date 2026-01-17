/**
 * モンスター情報を表示するカードコンポーネント
 * 
 * モンスターのレベル、進化ルート、報酬情報などを表示し、
 * Claimと進化のアクションを提供します。
 */

import { useState, useEffect } from 'react';
// formatEther: BigIntの値をEther単位の文字列に変換する関数
// コントラクトから取得した値がBigInt形式の場合に使用します
import { formatEther } from 'ethers';
import type { MonsterInfo } from '../../types/monster';
import { LEVEL_REWARDS, BRANCH_INFO } from '../../types/monster';

/**
 * MonsterCardコンポーネントのProps
 */
interface MonsterCardProps {
  /** モンスター情報 */
  monsterInfo: MonsterInfo;
  /** 報酬をClaimする関数 */
  onClaim: () => Promise<boolean>;
  /** モンスターを進化させる関数 */
  onEvolve: () => Promise<boolean>;
  /** 読み込み中かどうか */
  isLoading: boolean;
}

/**
 * MonsterCardコンポーネント
 */
export const MonsterCard = ({
  monsterInfo,
  onClaim,
  onEvolve,
  isLoading,
}: MonsterCardProps) => {
  // カウントダウンの状態管理（秒単位）
  const [countdown, setCountdown] = useState<number>(0);

  /**
   * Claim可能かどうかを判定する関数
   * 最後のClaim時刻から24時間経過していればClaim可能
   */
  const canClaim = (): boolean => {
    const now = Date.now();
    const lastClaimTime = monsterInfo.lastClaimTime;
    const cooldownTime = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）
    return now >= lastClaimTime + cooldownTime;
  };

  /**
   * 進化可能かどうかを判定する関数
   * レベルが10未満で、経験値が十分な場合に進化可能
   * 注意: 実際のコントラクトの進化条件に合わせて調整してください
   */
  const canEvolve = (): boolean => {
    return monsterInfo.level < 10; // 最大レベルは10
  };

  /**
   * 進化コストを計算する関数（仮の実装）
   * 実際のコントラクトのコストに合わせて調整してください
   * 
   * formatEther: BigInt形式のWei単位の値をEther単位の文字列に変換
   */
  const getEvolutionCost = (): string => {
    // レベルに応じた進化コスト（WLDG単位）
    const costMap: Record<number, number> = {
      1: 0.1,
      2: 0.2,
      3: 0.3,
      4: 0.5,
      5: 0.8,
      6: 1.2,
      7: 1.8,
      8: 2.5,
      9: 3.5,
    };
    const cost = costMap[monsterInfo.level] || 0;
    
    // formatEtherの使用例: numberからBigIntに変換してformatEtherで表示
    // コントラクトから直接BigInt形式で取得する場合は: formatEther(costFromContract)
    const costInWei = BigInt(Math.floor(cost * 10 ** 18)); // numberをWei単位のBigIntに変換
    return formatEther(costInWei); // formatEtherでEther単位の文字列に変換
  };

  /**
   * 育成日数を計算する関数
   */
  const getDaysSinceCreation = (): number => {
    const now = Date.now();
    const createdAt = monsterInfo.createdAt;
    const diffMs = now - createdAt;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  /**
   * Claim可能時刻までの残り時間を計算する関数（秒単位）
   */
  const calculateCountdown = (): number => {
    const now = Date.now();
    const lastClaimTime = monsterInfo.lastClaimTime;
    const cooldownTime = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）
    const nextClaimTime = lastClaimTime + cooldownTime;
    const remaining = nextClaimTime - now;
    
    if (remaining <= 0) {
      return 0;
    }
    
    return Math.floor(remaining / 1000); // 秒単位に変換
  };

  /**
   * 秒数を時分秒の文字列に変換する関数
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * カウントダウンを更新するuseEffect
   */
  useEffect(() => {
    // 初回計算
    setCountdown(calculateCountdown());

    // 1秒ごとに更新
    const interval = setInterval(() => {
      const newCountdown = calculateCountdown();
      setCountdown(newCountdown);
    }, 1000);

    return () => clearInterval(interval);
  }, [monsterInfo.lastClaimTime]);

  // 進化ルート情報を取得
  const branchInfo = BRANCH_INFO[monsterInfo.evolutionBranch];
  
  // 現在のレベルの報酬額を取得
  const nextReward = LEVEL_REWARDS[monsterInfo.level];
  
  // Claim可能かどうか
  const isClaimable = canClaim();
  
  // 進化可能かどうか
  const isEvolvable = canEvolve();
  
  // 育成日数
  const daysSinceCreation = getDaysSinceCreation();

  // Claimボタンのクリックハンドラー
  const handleClaim = async () => {
    if (!isClaimable || isLoading) return;
    
    try {
      await onClaim();
    } catch (error) {
      console.error('Claimエラー:', error);
    }
  };

  // 進化ボタンのクリックハンドラー
  const handleEvolve = async () => {
    if (!isEvolvable || isLoading) return;
    
    try {
      await onEvolve();
    } catch (error) {
      console.error('進化エラー:', error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl border border-white/20 animate-fade-in">
      {/* モンスターヘッダー */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-6">
        {/* レベルと名前 */}
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {monsterInfo.name}
          </h2>
          <div className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end bg-clip-text text-transparent">
            Lv. {monsterInfo.level}
          </div>
        </div>

        {/* 進化ルート */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
          <span className="text-2xl">{branchInfo.icon}</span>
          <span className="text-white font-semibold">{branchInfo.name}</span>
        </div>
      </div>

      {/* 報酬情報カード */}
      <div className="mb-6 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <p className="text-gray-300 text-sm mb-1">次の報酬額</p>
            <p className="text-2xl font-bold text-white">
              {nextReward.toFixed(1)} WLDG
            </p>
          </div>
          
          {!isClaimable && countdown > 0 && (
            <div className="mt-4 md:mt-0">
              <p className="text-gray-300 text-sm mb-1">Claim可能まで</p>
              <p className="text-xl font-mono font-bold text-yellow-400">
                {formatTime(countdown)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Claimボタン */}
        <button
          onClick={handleClaim}
          disabled={!isClaimable || isLoading}
          className={`
            flex-1 px-6 py-3 rounded-lg font-semibold text-white
            transition-all duration-300 transform
            ${isClaimable && !isLoading
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
          ) : isClaimable ? (
            '💰 報酬をClaim'
          ) : (
            `⏰ Claim不可 (${formatTime(countdown)})`
          )}
        </button>

        {/* 進化ボタン */}
        {isEvolvable && (
          <button
            onClick={handleEvolve}
            disabled={isLoading}
            className={`
              flex-1 px-6 py-3 rounded-lg font-semibold text-white
              transition-all duration-300 transform
              ${!isLoading
                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:scale-105 hover:shadow-lg active:scale-95'
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
              `✨ 進化する (${getEvolutionCost()} WLDG)`
            )}
          </button>
        )}
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
        {/* 累計Claim回数 */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-1">累計Claim回数</p>
          <p className="text-xl font-bold text-white">
            {/* 注意: 実際のコントラクトから取得する必要があります */}
            --
          </p>
        </div>

        {/* 累計報酬 */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-1">累計報酬</p>
          <p className="text-xl font-bold text-white">
            {/* 注意: 実際のコントラクトから取得する必要があります */}
            -- WLDG
          </p>
        </div>

        {/* 育成日数 */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-1">育成日数</p>
          <p className="text-xl font-bold text-white">
            {daysSinceCreation} 日
          </p>
        </div>
      </div>

      {/* 進化ルート説明 */}
      <div className="mt-6 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
        <p className="text-gray-300 text-sm text-center">
          {branchInfo.description}
        </p>
      </div>
    </div>
  );
};
