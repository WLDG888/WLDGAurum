/**
 * モンスター育成システムのカスタムフック
 * 
 * このフックは、MiniKitを使用してモンスターコントラクトとやり取りします。
 * 主な機能：
 * - モンスター情報の取得
 * - モンスターの作成（World ID検証付き）
 * - 進化ルートの選択
 * - 24時間報酬のClaim
 * - モンスターの進化
 * - 自動リフレッシュ
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { Contract, ethers, type BrowserProvider } from 'ethers';
import type { MonsterInfo, EvolutionBranch } from '../types/monster';

/**
 * フックの戻り値の型定義
 */
interface UseMonsterReturn {
  /** 現在のモンスター情報（存在しない場合はnull） */
  monster: MonsterInfo | null;
  /** データ読み込み中かどうか */
  isLoading: boolean;
  /** エラーメッセージ（エラーがない場合はnull） */
  error: string | null;
  /** コントラクトとの接続状態 */
  isConnected: boolean;
  /** モンスターを作成する関数 */
  createMonster: (branch: EvolutionBranch) => Promise<void>;
  /** 進化ルートを選択する関数 */
  selectBranch: (branch: EvolutionBranch) => Promise<void>;
  /** 24時間報酬をClaimする関数 */
  claimDailyReward: () => Promise<void>;
  /** モンスターを進化させる関数 */
  evolveMonster: () => Promise<void>;
  /** モンスター情報を手動でリフレッシュする関数 */
  refreshMonster: () => Promise<void>;
}

/**
 * モンスターコントラクトのABI（最小限の定義）
 * 実際のコントラクトに合わせて調整してください
 */
const MONSTER_CONTRACT_ABI = [
  // モンスター情報を取得する関数
  {
    name: 'getMonsterInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [
      { name: 'level', type: 'uint8' },
      { name: 'branch', type: 'uint8' },
      { name: 'name', type: 'string' },
      { name: 'experience', type: 'uint256' },
      { name: 'lastClaimTime', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' },
    ],
  },
  // モンスターを作成する関数（World ID検証付き）
  {
    name: 'createMonster',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'root', type: 'uint256' },
      { name: 'nullifierHash', type: 'uint256' },
      { name: 'proof', type: 'uint256[8]' },
    ],
    outputs: [],
  },
  // 進化ルートを選択する関数
  {
    name: 'selectBranch',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'branch', type: 'uint8' }],
    outputs: [],
  },
  // 24時間報酬をClaimする関数
  {
    name: 'claimDailyReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // モンスターを進化させる関数
  {
    name: 'evolveMonster',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

/**
 * 進化ルートを数値に変換するヘルパー関数
 */
const branchToNumber = (branch: EvolutionBranch): number => {
  switch (branch) {
    case 'POWER':
      return 0;
    case 'SPEED':
      return 1;
    case 'BALANCE':
      return 2;
    default:
      return 0;
  }
};

/**
 * 進化ルートを文字列に変換するヘルパー関数
 */
const numberToBranch = (num: number): EvolutionBranch => {
  switch (num) {
    case 0:
      return 'POWER';
    case 1:
      return 'SPEED';
    case 2:
      return 'BALANCE';
    default:
      return 'POWER';
  }
};

/**
 * モンスター育成システムのカスタムフック
 * 
 * @returns {UseMonsterReturn} モンスター情報と操作関数
 */
export const useMonster = (): UseMonsterReturn => {
  // 状態管理
  const [monster, setMonster] = useState<MonsterInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // MiniKitインスタンス、プロバイダー、コントラクトインスタンスを保持
  const minikitRef = useRef<MiniKit | null>(null);
  const providerRef = useRef<BrowserProvider | null>(null);
  const contractRef = useRef<Contract | null>(null);
  const refreshIntervalRef = useRef<number | null>(null);

  /**
   * エラーをクリアするヘルパー関数
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * エラーハンドリング関数
   */
  const handleError = useCallback((err: unknown, message: string) => {
    console.error(`[useMonster] ${message}:`, err);
    
    // エラーオブジェクトからメッセージを取得
    if (err instanceof Error) {
      setError(`${message}: ${err.message}`);
    } else if (typeof err === 'string') {
      setError(`${message}: ${err}`);
    } else {
      setError(message);
    }
  }, []);

  /**
   * MiniKitを初期化し、コントラクトに接続する関数
   */
  const initializeContract = useCallback(async () => {
    try {
      const contractAddress = import.meta.env.VITE_MONSTER_CONTRACT;
      
      // 環境変数が設定されているか確認
      if (!contractAddress) {
        throw new Error('VITE_MONSTER_CONTRACT環境変数が設定されていません');
      }

      // MiniKitを初期化
      // 注意: 実際のMiniKit APIに合わせて調整してください
      const minikit = new MiniKit();
      minikitRef.current = minikit;

      // ウォレットに接続してプロバイダーを取得
      // 注意: MiniKitの実際のAPIに合わせて調整してください
      // 一般的には、MiniKitはEIP-1193プロバイダーを提供するか、
      // window.ethereumを使用してプロバイダーを作成します
      const minikitProvider = await (minikit as any).connect?.() || (window as any).ethereum;
      if (!minikitProvider) {
        throw new Error('ウォレットに接続できませんでした');
      }

      const provider = new ethers.BrowserProvider(minikitProvider);
      providerRef.current = provider;
      setIsConnected(true);

      // コントラクトインスタンスを作成
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, MONSTER_CONTRACT_ABI, signer);
      contractRef.current = contract;

      console.log('[useMonster] コントラクト初期化完了');
    } catch (err) {
      handleError(err, 'コントラクト初期化エラー');
      setIsConnected(false);
    }
  }, [handleError]);

  /**
   * モンスター情報を取得する関数
   */
  const fetchMonsterInfo = useCallback(async () => {
    if (!contractRef.current || !minikitRef.current) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      clearError();

      // 現在のアカウントアドレスを取得
      if (!providerRef.current) {
        throw new Error('プロバイダーに接続されていません');
      }
      
      const signer = await providerRef.current.getSigner();
      const account = await signer.getAddress();

      // コントラクトからモンスター情報を取得
      const result = await contractRef.current.getMonsterInfo(account);

      // 結果をパースしてMonsterInfo形式に変換
      // 注意: コントラクトの戻り値の形式に合わせて調整してください
      const monsterInfo: MonsterInfo = {
        id: account,
        level: Number(result.level) as MonsterInfo['level'],
        evolutionBranch: numberToBranch(Number(result.branch)),
        name: result.name || 'Unnamed Monster',
        experience: Number(result.experience),
        lastClaimTime: Number(result.lastClaimTime) * 1000, // 秒からミリ秒に変換
        createdAt: Number(result.createdAt) * 1000, // 秒からミリ秒に変換
      };

      setMonster(monsterInfo);
      console.log('[useMonster] モンスター情報取得完了:', monsterInfo);
    } catch (err) {
      // モンスターが存在しない場合はnullを設定（エラーではない）
      if (err instanceof Error && err.message.includes('Monster does not exist')) {
        setMonster(null);
      } else {
        handleError(err, 'モンスター情報取得エラー');
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError]);

  /**
   * モンスターを作成する関数（World ID検証付き）
   * 
   * @param branch 進化ルート（現在は未使用だが、将来コントラクトで使用する可能性がある）
   */
  const createMonster = useCallback(async (branch: EvolutionBranch) => {
    if (!contractRef.current || !minikitRef.current) {
      throw new Error('コントラクトに接続されていません');
    }

    try {
      setIsLoading(true);
      clearError();
      
      // 注意: branchパラメータは将来的にコントラクトで使用する可能性があります
      console.log('[useMonster] 進化ルート:', branch);

      // World ID検証を実行
      const appId = import.meta.env.VITE_WORLD_APP_ID;
      if (!appId) {
        throw new Error('VITE_WORLD_APP_ID環境変数が設定されていません');
      }

      if (!minikitRef.current) {
        throw new Error('MiniKitが初期化されていません');
      }

      // World ID検証を実行
      // 注意: 実際のMiniKit APIに合わせて調整してください
      // MiniKitのverifyメソッドの実際のシグネチャに合わせて修正してください
      const verifyResult = await (minikitRef.current as any).verify?.(appId) || {
        merkle_root: BigInt(0),
        nullifier_hash: BigInt(0),
        proof: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
      };

      // コントラクトのcreateMonsterを呼び出し
      // 注意: コントラクトがbranchパラメータを受け取る場合は追加してください
      const tx = await contractRef.current.createMonster(
        verifyResult.merkle_root,
        verifyResult.nullifier_hash,
        verifyResult.proof
      );

      // トランザクションの完了を待機
      await tx.wait();

      console.log('[useMonster] モンスター作成完了');

      // モンスター情報を再取得
      await fetchMonsterInfo();
    } catch (err) {
      handleError(err, 'モンスター作成エラー');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError, fetchMonsterInfo]);

  /**
   * 進化ルートを選択する関数
   */
  const selectBranch = useCallback(async (branch: EvolutionBranch) => {
    if (!contractRef.current) {
      throw new Error('コントラクトに接続されていません');
    }

    try {
      setIsLoading(true);
      clearError();

      const branchNumber = branchToNumber(branch);

      // コントラクトのselectBranchを呼び出し
      const tx = await contractRef.current.selectBranch(branchNumber);
      await tx.wait();

      console.log('[useMonster] 進化ルート選択完了:', branch);

      // モンスター情報を再取得
      await fetchMonsterInfo();
    } catch (err) {
      handleError(err, '進化ルート選択エラー');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError, fetchMonsterInfo]);

  /**
   * 24時間報酬をClaimする関数
   */
  const claimDailyReward = useCallback(async () => {
    if (!contractRef.current) {
      throw new Error('コントラクトに接続されていません');
    }

    try {
      setIsLoading(true);
      clearError();

      // コントラクトのclaimDailyRewardを呼び出し
      const tx = await contractRef.current.claimDailyReward();
      await tx.wait();

      console.log('[useMonster] 報酬Claim完了');

      // モンスター情報を再取得
      await fetchMonsterInfo();
    } catch (err) {
      handleError(err, '報酬Claimエラー');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError, fetchMonsterInfo]);

  /**
   * モンスターを進化させる関数
   */
  const evolveMonster = useCallback(async () => {
    if (!contractRef.current) {
      throw new Error('コントラクトに接続されていません');
    }

    try {
      setIsLoading(true);
      clearError();

      // コントラクトのevolveMonsterを呼び出し
      const tx = await contractRef.current.evolveMonster();
      await tx.wait();

      console.log('[useMonster] モンスター進化完了');

      // モンスター情報を再取得
      await fetchMonsterInfo();
    } catch (err) {
      handleError(err, 'モンスター進化エラー');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError, fetchMonsterInfo]);

  /**
   * モンスター情報を手動でリフレッシュする関数
   */
  const refreshMonster = useCallback(async () => {
    await fetchMonsterInfo();
  }, [fetchMonsterInfo]);

  /**
   * コンポーネントマウント時に初期化とモンスター情報取得を実行
   */
  useEffect(() => {
    initializeContract().then(() => {
      fetchMonsterInfo();
    });

    // クリーンアップ関数
    return () => {
      // 自動リフレッシュを停止
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [initializeContract, fetchMonsterInfo]);

  /**
   * 自動リフレッシュ（30秒ごとにモンスター情報を更新）
   */
  useEffect(() => {
    if (isConnected && !refreshIntervalRef.current) {
      refreshIntervalRef.current = window.setInterval(() => {
        fetchMonsterInfo();
      }, 30000); // 30秒ごと
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isConnected, fetchMonsterInfo]);

  return {
    monster,
    isLoading,
    error,
    isConnected,
    createMonster,
    selectBranch,
    claimDailyReward,
    evolveMonster,
    refreshMonster,
  };
};
