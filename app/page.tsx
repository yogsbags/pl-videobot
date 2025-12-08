"use client";

import { AudioUploader } from '@/components/AudioUploader';
import { ImageGenerator } from '@/components/ImageGenerator';
import { ImageUploader } from '@/components/ImageUploader';
import { ModelSelector, ModelType } from '@/components/ModelSelector';
import { ReelType, ReelTypeSelector } from '@/components/ReelTypeSelector';
import { ScriptGenerator } from '@/components/ScriptGenerator';
import { VideoDisplay } from '@/components/VideoDisplay';
import { VideoPromptInput } from '@/components/VideoPromptInput';
import * as fal from "@fal-ai/serverless-client";
import { AlertCircle, Settings2, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

fal.config({
  proxyUrl: "/api/fal/proxy",
});

// Map our internal model IDs to actual Fal.ai endpoint IDs
const FAL_ENDPOINTS: Record<ModelType, string> = {
  'wan-2.5': 'fal-ai/wan-25-preview/text-to-video',
  'kling-2.6': 'fal-ai/kling-video/v2.6/pro/text-to-video', // Updated to v2.6 Pro
  'omnihuman-1.5': 'fal-ai/bytedance/omnihuman/v1.5',
  'runway-gen-4': 'fal-ai/runway-gen3/turbo/text-to-video',
};

// Image-to-Video Endpoints
const I2V_ENDPOINTS: Record<ModelType, string> = {
  'wan-2.5': 'fal-ai/wan-25-preview/image-to-video',
  'kling-2.6': 'fal-ai/kling-video/v2.6/pro/image-to-video', // Updated to v2.6 Pro
  'omnihuman-1.5': 'fal-ai/bytedance/omnihuman/v1.5',
  'runway-gen-4': 'fal-ai/runway-gen3/turbo/image-to-video',
};

export default function Home() {
  const [reelType, setReelType] = useState<ReelType>('educational');
  const [model, setModel] = useState<ModelType>('wan-2.5');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | undefined>(undefined);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // New settings for Wan 2.5 / Advisor
  const [resolution, setResolution] = useState<'720p' | '480p' | '1080p'>('720p');
  const [duration, setDuration] = useState<'5' | '10'>('10');

  // Price Calculation
  const estimatedPrice = useMemo(() => {
    if (model === 'omnihuman-1.5') {
      // OmniHuman: ~$0.16/s (varies, but using user's initial prompt estimate or safe default)
      // Actually prompt said 0.16 for OmniHuman in ModelSelector.
      // Assuming 5s default for OmniHuman if duration not applicable, or use duration if supported?
      // OmniHuman usually depends on audio length.
      return "0.50 - 1.50"; // Variable based on audio
    }
    if (model === 'wan-2.5') {
      // Wan 2.5: Resolution-based pricing
      // 480p: $0.05/s, 720p: $0.10/s, 1080p: $0.15/s
      const costPerSec = resolution === '480p' ? 0.05 : resolution === '720p' ? 0.10 : 0.15;
      const secs = parseInt(duration);
      return (secs * costPerSec).toFixed(2);
    }
    return "Credit"; // Other models
  }, [model, duration]);

  const handleOptimization = (optimized: string, recommendedModel: ModelType) => {
    setPrompt(optimized);
    setModel(recommendedModel);
  };

  const handleReelTypeSelect = (type: ReelType) => {
    setReelType(type);
    if (type === 'advisor') {
      setModel('wan-2.5'); // Updated to Wan 2.5 as default for Advisor
    }
  };

  const handleGenerate = async () => {
    if (model !== 'omnihuman-1.5' && !prompt) return;
    if (model === 'omnihuman-1.5' && (!imageUrl || !audioUrl)) return;

    setIsGenerating(true);
    setVideoUrl(null);
    setError(null);
    setProgress(0);

    try {
      // Choose endpoint based on whether an image is provided
      const endpointId = imageUrl
        ? I2V_ENDPOINTS[model] || FAL_ENDPOINTS[model]
        : FAL_ENDPOINTS[model];

      if (!endpointId) throw new Error(`Model ${model} not configured yet`);

      let input: any = {};

      if (model === 'omnihuman-1.5') {
        // OmniHuman specific payload
        if (!imageUrl || !audioUrl) {
          throw new Error("OmniHuman requires both an Image and Audio file.");
        }
        input = {
          image_url: imageUrl,
          audio_url: audioUrl,
        };
      } else {
        // Standard Text/Image to Video (Wan 2.5, etc)
        input = {
          prompt: prompt,
          aspect_ratio: resolution === '720p' ? "9:16" : "16:9", // Approximate mapping or use actual resolution if API supports
          duration_seconds: parseInt(duration),
        };
        // For Wan 2.5 specifically, check if we need exact resolution string like "720x1280"
        // Fal usually accepts 'aspect_ratio' nicely. "9:16" is standard for Reels (720x1280 or 1080x1920)
        // If user explicitly wants resolution control, we can pass that if the model supports it.
        // Let's stick to aspect_ratio 9:16 for vertical reels as default.

        if (imageUrl) {
          input.image_url = imageUrl;
        }

        // Add duration if supported by model (Wan 2.5 supports it)
        // Add duration if supported by model (Wan 2.5 supports it)
        if (model === 'wan-2.5') {
          if (audioUrl) {
            input.audio_url = audioUrl;
          }
        }
      }

      const result: any = await fal.subscribe(endpointId, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            // Simulate progress or use logs if available
            setProgress((prev) => Math.min(prev + 5, 90));
          }
        },
      });

      if (result.video && result.video.url) {
        setVideoUrl(result.video.url);
        setProgress(100);
      } else {
        throw new Error("No video URL in response");
      }

    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || "Failed to generate video");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-4 border border-emerald-500/20">
            <Sparkles className="w-3 h-3" />
            PL Capital AI Studio
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">
            Social Media Video Generator
          </h1>
          <p className="text-slate-500">Create viral financial content with Wan 2.5, Kling, and OmniHuman</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Controls */}
          <div className="space-y-8">


            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs">1</span>
                Select Strategy
              </h2>
              <ReelTypeSelector selectedType={reelType} onSelect={handleReelTypeSelect} />
            </section>

            {/* Resolution & Duration settings for Wan 2.5 / others */}
            {model !== 'omnihuman-1.5' && (
              <section className="bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Video Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Resolution</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                    >
                      <option value="720p">720p (HD)</option>
                      <option value="1080p">1080p (FHD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                    >
                      <option value="5">5 Seconds</option>
                      <option value="10">10 Seconds</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            <section>
              {model !== 'omnihuman-1.5' && (
                <>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs">2</span>
                    Refine Prompt
                  </h2>
                  <VideoPromptInput
                    prompt={prompt}
                    setPrompt={setPrompt}
                    reelType={reelType}
                    onOptimize={handleOptimization}
                  />
                </>
              )}

              {model === 'omnihuman-1.5' && (
                <ImageGenerator prompt={prompt} onImageGenerated={setImageUrl} />
              )}

              <ImageUploader image={imageUrl} onImageUpload={setImageUrl} />

              {(model === 'omnihuman-1.5' || model === 'wan-2.5') && (
                <>
                  <ScriptGenerator
                    onAudioGenerated={setAudioUrl}
                    clonedVoiceId={clonedVoiceId}
                  />
                  <AudioUploader
                    audioUrl={audioUrl}
                    onAudioUpload={setAudioUrl}
                    onVoiceCloned={setClonedVoiceId}
                  />
                </>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs">3</span>
                Select Model
              </h2>
              <ModelSelector selectedModel={model} onSelect={setModel} />
            </section>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm px-1">
                <span className="text-slate-500">Estimated Cost:</span>
                <span className="font-mono font-medium text-emerald-400 flex items-center gap-1">
                  {model !== 'kling-2.6' && '$'}{estimatedPrice}
                </span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || (model === 'omnihuman-1.5' ? (!imageUrl || !audioUrl) : !prompt)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating Video...' : 'Generate Video'}
              </button>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs">4</span>
              Preview
            </h2>
            <VideoDisplay
              videoUrl={videoUrl}
              isLoading={isGenerating}
              progress={progress}
              onVideoUpdate={setVideoUrl}
            />

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">{error}</div>
              </div>
            )}

            {/* Debug Info */}
            <div className="mt-8 p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-xs font-mono text-slate-500">
              <div className="mb-2 font-semibold text-slate-400">Current Configuration:</div>
              <div>Strategy: {reelType}</div>
              <div>Model: {model}</div>
              <div className="truncate">Prompt: {prompt || '(empty)'}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
