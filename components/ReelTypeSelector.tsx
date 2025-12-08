import { clsx } from 'clsx';
import { BookOpen, Film, TrendingUp, UserCheck, Zap } from 'lucide-react';
import React from 'react';

export type ReelType = 'educational' | 'market_update' | 'viral_hook' | 'advisor' | 'cinematic';

interface ReelTypeSelectorProps {
  selectedType: ReelType;
  onSelect: (type: ReelType) => void;
}

const REEL_TYPES: { id: ReelType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'educational', label: 'Educational', icon: <BookOpen className="w-5 h-5" />, desc: 'Explainers with clear text & charts' },
  { id: 'market_update', label: 'Market Update', icon: <TrendingUp className="w-5 h-5" />, desc: 'Data-driven news & tickers' },
  { id: 'viral_hook', label: 'Viral Hook', icon: <Zap className="w-5 h-5" />, desc: 'High-energy, cinematic visuals' },
  { id: 'advisor', label: 'Advisor', icon: <UserCheck className="w-5 h-5" />, desc: 'Trust-building talking head' },
  { id: 'cinematic', label: 'Cinematic', icon: <Film className="w-5 h-5" />, desc: 'Premium B-roll & storytelling' },
];

export function ReelTypeSelector({ selectedType, onSelect }: ReelTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      {REEL_TYPES.map((type) => (
        <button
          key={type.id}
          onClick={() => onSelect(type.id)}
          className={clsx(
            "flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105",
            selectedType === type.id
              ? "border-emerald-500 bg-emerald-50/10 text-emerald-400 shadow-lg shadow-emerald-500/20"
              : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-800"
          )}
        >
          <div className={clsx(
            "p-3 rounded-full mb-3",
            selectedType === type.id ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700/50"
          )}>
            {type.icon}
          </div>
          <span className="font-semibold text-sm mb-1">{type.label}</span>
          <span className="text-xs text-center opacity-70">{type.desc}</span>
        </button>
      ))}
    </div>
  );
}
