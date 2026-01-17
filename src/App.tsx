/**
 * メインアプリケーションコンポーネント
 * 
 * フロー:
 * 1. MiniKit初期化チェック（World App内かどうか）
 * 2. ウォレットアドレス取得
 * 3. モンスター作成状態チェック
 * 4. メインアプリ（タブナビゲーション）
 */

import { useState, useEffect } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMonster } from './hooks/useMonster';
import { useStaking } from './hooks/useStaking';
import { MonsterCard } from './components/Monster/MonsterCard';
import { EvolutionSelector } from './components/Monster/EvolutionSelector';
import { StakingPanel } from './components/Staking/StakingPanel';
import { SwapRedirect } from './components/Swap/SwapRedirect';
import type { EvolutionBranch } from './types/monster';

/**
 * タブの種類
 */
type Tab = 'Monster' | 'Swap' | 'Staking';

/**
 * Appコンポーネント
 */
function App() {
  // 状態管理
  const [isWorldApp, setIsWorldApp] = useState<boolean | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Monster');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // カスタムフック
  const monsterHook = useMonster();
  const stakingHook = useStaking();

  /**
   * MiniKit初期化チェック（World App内かどうか確認）
   */
  useEffect(() => {
    const checkWorldApp = async () => {
      try {
        // MiniKitが利用可能かどうかをチェック
        // 注意: 実際のMiniKit APIに合わせて調整してください
        const minikit = new MiniKit();
        
        // World App内かどうかを確認
        // window.parentが存在し、World Appコンテキスト内かどうか
        const isInWorldApp = window.self !== window.top || 
          (window as any).parent?.location?.hostname?.includes('world.org') ||
          (window as any).WorldID !== undefined;

        if (!isInWorldApp) {
          // World App外の場合はQRランディングページにリダイレクト
          window.location.href = '/qr-landing.html';
          return;
        }

        setIsWorldApp(true);

        // ウォレットアドレスを取得
        try {
          const provider = await (minikit as any).connect?.() || (window as any).ethereum;
          if (provider) {
            const accounts = await provider.request?.({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
            }
          }
        } catch (err) {
          console.error('ウォレット取得エラー:', err);
        }
      } catch (err) {
        console.error('MiniKit初期化エラー:', err);
        // エラーが発生してもアプリを続行（開発モードなど）
        setIsWorldApp(true);
      } finally {
        setIsInitializing(false);
      }
    };

    checkWorldApp();
  }, []);

  /**
   * モンスター作成ハンドラー
   */
  const handleCreateMonster = async (branch: EvolutionBranch) => {
    try {
      await monsterHook.createMonster(branch);
    } catch (error) {
      console.error('モンスター作成エラー:', error);
    }
  };

  /**
   * Claimハンドラー
   */
  const handleClaim = async (): Promise<boolean> => {
    try {
      await monsterHook.claimDailyReward();
      return true;
    } catch (error) {
      console.error('Claimエラー:', error);
      return false;
    }
  };

  /**
   * 進化ハンドラー
   */
  const handleEvolve = async (): Promise<boolean> => {
    try {
      await monsterHook.evolveMonster();
      return true;
    } catch (error) {
      console.error('進化エラー:', error);
      return false;
    }
  };

  /**
   * 進化ルート選択ハンドラー
   */
  const handleSelectBranch = async (branch: EvolutionBranch) => {
    try {
      await monsterHook.selectBranch(branch);
    } catch (error) {
      console.error('進化ルート選択エラー:', error);
    }
  };

  // 初期化中
  if (isInitializing || isWorldApp === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">初期化中...</div>
      </div>
    );
  }

  // World App外の場合はリダイレクト（既に処理済み）

  // モンスター未作成の場合は作成画面
  if (!monsterHook.monster && monsterHook.isConnected) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-white text-center mb-8">モンスターを作成</h1>
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6">
            <p className="text-gray-300 text-center mb-6">
              World ID認証を行い、モンスターを作成してください
            </p>
            <div className="grid grid-cols-3 gap-4">
              {['POWER', 'SPEED', 'BALANCE'].map((branch) => (
                <button
                  key={branch}
                  onClick={() => handleCreateMonster(branch as EvolutionBranch)}
                  disabled={monsterHook.isLoading}
                  className="px-4 py-3 rounded-lg bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end text-white font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // モンスター作成済み・ルート未選択の場合は進化ルート選択
  // 注意: モンスターにルート情報が含まれていない場合のチェックが必要です
  // ここでは簡易的に、evolutionBranchが存在しない場合としています
  const needsEvolutionSelection = monsterHook.monster && 
    !monsterHook.monster.evolutionBranch;

  if (needsEvolutionSelection) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <EvolutionSelector
          onSelect={handleSelectBranch}
          isLoading={monsterHook.isLoading}
        />
      </div>
    );
  }

  // メインアプリ（タブナビゲーション）
  return (
    <div className="min-h-screen flex flex-col">
      {/* 固定ヘッダー（アドレス表示） */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/10 border-b border-white/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">World Monster DeFi</h1>
            {walletAddress && (
              <div className="text-sm text-gray-300 font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ（ヘッダーとフッターの間） */}
      <main className="flex-1 pt-20 pb-24 px-4 container mx-auto">
        {activeTab === 'Monster' && monsterHook.monster && (
          <MonsterCard
            monsterInfo={monsterHook.monster}
            onClaim={handleClaim}
            onEvolve={handleEvolve}
            isLoading={monsterHook.isLoading}
          />
        )}
        
        {activeTab === 'Swap' && (
          <SwapRedirect />
        )}
        
        {activeTab === 'Staking' && (
          <StakingPanel
            stakeInfo={stakingHook.stakeInfo}
            onStake={stakingHook.stake}
            onUnstake={stakingHook.unstake}
            onClaim={stakingHook.claim}
            isLoading={stakingHook.isLoading}
          />
        )}
      </main>

      {/* 固定フッター（タブナビゲーション） */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/10 border-t border-white/20">
        <div className="container mx-auto px-4 py-2">
          <nav className="flex justify-around">
            <button
              onClick={() => setActiveTab('Monster')}
              className={`
                flex-1 py-3 px-4 rounded-lg font-semibold transition-all
                ${activeTab === 'Monster'
                  ? 'bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end text-white'
                  : 'text-gray-300 hover:text-white'
                }
              `}
            >
              🐉 Monster
            </button>
            <button
              onClick={() => setActiveTab('Swap')}
              className={`
                flex-1 py-3 px-4 rounded-lg font-semibold transition-all
                ${activeTab === 'Swap'
                  ? 'bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end text-white'
                  : 'text-gray-300 hover:text-white'
                }
              `}
            >
              💱 Swap
            </button>
            <button
              onClick={() => setActiveTab('Staking')}
              className={`
                flex-1 py-3 px-4 rounded-lg font-semibold transition-all
                ${activeTab === 'Staking'
                  ? 'bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end text-white'
                  : 'text-gray-300 hover:text-white'
                }
              `}
            >
              💰 Staking
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default App;
