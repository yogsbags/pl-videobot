import { clsx } from 'clsx';

export type ModelType = 'wan-2.5' | 'kling-2.6' | 'omnihuman-1.5' | 'runway-gen-4';

interface ModelSelectorProps {
  selectedModel: ModelType;
  onSelect: (model: ModelType) => void;
}

const MODELS: { id: ModelType; label: string; badge?: string; cost: string; features: string }[] = [
  { id: 'wan-2.5', label: 'Wan 2.5', badge: '4K Charts', cost: '~$0.05/s', features: 'Best for Text & Data' },
  { id: 'kling-2.6', label: 'Kling 2.6', badge: 'Audio', cost: 'Credit', features: 'Cinematic Motion + SFX' },
  { id: 'omnihuman-1.5', label: 'OmniHuman 1.5', badge: 'Lip-Sync', cost: '~$0.16/s', features: 'Talking Advisor' },
  { id: 'runway-gen-4', label: 'Runway Gen-4', cost: 'Premium', features: 'Consistent Characters' },
];

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {MODELS.map((model) => (
        <button
          key={model.id}
          onClick={() => onSelect(model.id)}
          className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left min-w-[200px]",
            selectedModel === model.id
              ? "border-blue-500 bg-blue-500/10 text-white"
              : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600"
          )}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{model.label}</span>
              {model.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 uppercase tracking-wider">
                  {model.badge}
                </span>
              )}
            </div>
            <div className="text-xs opacity-60">{model.features}</div>
          </div>
          <div className="text-xs font-mono opacity-50">{model.cost}</div>
        </button>
      ))}
    </div>
  );
}
