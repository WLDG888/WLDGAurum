/**
 * Puf.financeへのスワップリダイレクトコンポーネント
 * 
 * WLD/WLDGスワップを行うための外部リンクを提供します。
 */

/**
 * SwapRedirectコンポーネント
 */
export const SwapRedirect = () => {
  // 環境変数からPuf.financeのURLを取得
  const swapUrl = import.meta.env.VITE_PUF_SWAP_URL || 'https://world.org/mini-app?app_id=app_15daccf5b7d4ec9b7dbba044a8fdeab5&path=/app/token/0xdB00597630a54fEa24395EF2212159C997Bf3612';

  /**
   * 外部リンクを新しいタブで開く関数
   */
  const handleOpenSwap = () => {
    window.open(swapUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl border border-white/20 animate-fade-in">
      {/* ヘッダー */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">💱</div>
        <h2 className="text-3xl font-bold text-white mb-2">WLD/WLDG Swap</h2>
        <p className="text-gray-300">
          Puf.financeでトークンをスワップできます
        </p>
      </div>

      {/* Puf.financeの説明 */}
      <div className="mb-6 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-2">Puf.financeについて</h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          Puf.financeはWorldchain上で動作する分散型取引所（DEX）です。
          安全にWLDとWLDGトークンをスワップできます。
          低い手数料と高い流動性を提供し、あなたのトークン取引をサポートします。
        </p>
      </div>

      {/* 外部リンクボタン */}
      <div className="mb-6">
        <button
          onClick={handleOpenSwap}
          className="w-full px-6 py-4 rounded-lg font-semibold text-white text-lg bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-300 transform"
        >
          🔗 Puf.financeでスワップする
        </button>
      </div>

      {/* 注意事項（警告表示） */}
      <div className="p-4 rounded-xl bg-yellow-500/20 backdrop-blur-sm border-2 border-yellow-500/50">
        <div className="flex items-start">
          <span className="text-2xl mr-3">⚠️</span>
          <div className="flex-1">
            <h4 className="text-yellow-400 font-semibold mb-2">ご注意</h4>
            <ul className="text-yellow-300 text-sm space-y-1 list-disc list-inside">
              <li>スワップは外部サイト（Puf.finance）で実行されます</li>
              <li>取引前に取引内容を必ず確認してください</li>
              <li>手数料やスリッページ設定にご注意ください</li>
              <li>新しいタブでPuf.financeが開きます</li>
              <li>このアプリとは別のサービスですので、ご自身の責任でご利用ください</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 補足情報 */}
      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 backdrop-blur-sm border border-blue-500/20">
        <p className="text-blue-300 text-xs text-center">
          💡 ヒント: スワップ後、このページをリロードすると最新の残高が反映されます
        </p>
      </div>
    </div>
  );
};
