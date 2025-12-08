import * as fal from "@fal-ai/serverless-client";
import { Download, Loader2, Play, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface VideoDisplayProps {
  videoUrl: string | null;
  isLoading: boolean;
  progress?: number; // 0-100
  onVideoUpdate?: (url: string) => void;
}

export function VideoDisplay({ videoUrl, isLoading, progress, onVideoUpdate }: VideoDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGeneratingEdit, setIsGeneratingEdit] = useState(false);

  const handleEditVideo = async () => {
    if (!videoUrl || !editPrompt) return;
    setIsGeneratingEdit(true);
    try {
      const result: any = await fal.subscribe('fal-ai/kling-video/o1/video-to-video/edit', {
        input: {
          video_url: videoUrl,
          prompt: editPrompt,
        },
        logs: true,
      });

      if (result.video && result.video.url) {
        if (onVideoUpdate) {
          onVideoUpdate(result.video.url);
        }
        setIsEditing(false);
        setEditPrompt('');
      }
    } catch (error) {
      console.error("Video edit failed:", error);
      alert("Failed to edit video.");
    } finally {
      setIsGeneratingEdit(false);
    }
  };

  if (!videoUrl && !isLoading) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
        <Play className="w-12 h-12 mb-4 opacity-20" />
        <p>Your generated video will appear here</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="animate-pulse">Generating your masterpiece...</p>
        {progress !== undefined && (
          <div className="w-64 h-2 bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group">
        <video
          src={videoUrl!}
          controls
          className="w-full h-full object-contain"
          autoPlay
          loop
        />
        {onVideoUpdate && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium backdrop-blur-sm transition-colors shadow-lg"
            >
              Edit Video
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 animate-in fade-in slide-in-from-top-2">
          <label className="text-xs text-slate-400 mb-2 block">Edit Instruction (Kling O1)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g. Change the background to a futuristic city..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleEditVideo}
              disabled={isGeneratingEdit || !editPrompt}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isGeneratingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Edit
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <a
          href={videoUrl!}
          download="generated-video.mp4"
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Video
        </a>
      </div>
    </div>
  );
}
