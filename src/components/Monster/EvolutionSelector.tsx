/**
 * 進化ルート選択コンポーネント
 */
import type { EvolutionBranch } from '../../types/monster';
import { BRANCH_INFO } from '../../types/monster';

interface EvolutionSelectorProps {
  onSelect: (branch: EvolutionBranch) => Promise<void>;
  isLoading: boolean;
}

export const EvolutionSelector = ({ onSelect, isLoading }: EvolutionSelectorProps) => {
  const handleSelect = async (branch: EvolutionBranch) => {
    if (isLoading) return;
    await onSelect(branch);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl border border-white/20 animate-fade-in">
      <h2 className="text-3xl font-bold text-white text-center mb-6">進化ルートを選択</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(BRANCH_INFO).map((branch) => (
          <button
            key={branch.name}
            onClick={() => handleSelect(branch.name)}
            disabled={isLoading}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border-2 border-white/20 hover:border-white/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-4xl mb-2">{branch.icon}</div>
            <div className="text-white font-semibold mb-2">{branch.name}</div>
            <div className="text-gray-300 text-sm">{branch.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
