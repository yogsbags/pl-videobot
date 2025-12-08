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
import { AlertCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';

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

  const handleOptimization = (optimized: string, recommendedModel: ModelType) => {
    setPrompt(optimized);
    setModel(recommendedModel);
  };

  const handleReelTypeSelect = (type: ReelType) => {
    setReelType(type);
    if (type === 'advisor') {
      setModel('omnihuman-1.5');
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
        // Standard Text/Image to Video
        input = {
          prompt: prompt,
          aspect_ratio: "9:16",
        };
        if (imageUrl) {
          input.image_url = imageUrl;
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

              {model === 'omnihuman-1.5' && (
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

            <button
              onClick={handleGenerate}
              disabled={isGenerating || (model === 'omnihuman-1.5' ? (!imageUrl || !audioUrl) : !prompt)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating Video...' : 'Generate Video'}
            </button>
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
