import { Loader2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { ModelType } from './ModelSelector';
import { ReelType } from './ReelTypeSelector';

interface VideoPromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  reelType: ReelType;
  onOptimize: (optimizedPrompt: string, recommendedModel: ModelType) => void;
}

export function VideoPromptInput({ prompt, setPrompt, reelType, onOptimize }: VideoPromptInputProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    if (!prompt.trim()) return;

    setIsOptimizing(true);
    try {
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: prompt, reelType }),
      });

      const data = await res.json();
      if (data.optimizedPrompt) {
        onOptimize(data.optimizedPrompt, data.recommendedModel);
      }
    } catch (err) {
      console.error("Optimization failed", err);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-3 mb-8">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-300">Video Description</label>
        <button
          onClick={handleOptimize}
          disabled={isOptimizing || !prompt.trim()}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
        >
          {isOptimizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          Magic Optimize for {reelType.replace('_', ' ')}
        </button>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your video idea (e.g., 'Nifty 50 hitting all time high with fireworks')..."
        className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none resize-none transition-all"
      />
    </div>
  );
}
