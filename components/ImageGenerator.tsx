import * as fal from "@fal-ai/serverless-client";
import { ImageIcon, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface ImageGeneratorProps {
  prompt: string;
  onImageGenerated: (url: string) => void;
}

export function ImageGenerator({ prompt: initialPrompt, onImageGenerated }: ImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [localPrompt, setLocalPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use local prompt if user typed one, otherwise use the one passed from parent (if any)
  const activePrompt = localPrompt || initialPrompt;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await fal.storage.upload(file);
      setReferenceImage(url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload reference image.");
    }
  };

  const handleOptimize = async () => {
    if (!activePrompt) return;
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: activePrompt,
          reelType: 'advisor'
        }),
      });
      const data = await res.json();
      if (data.optimizedPrompt) {
        setLocalPrompt(data.optimizedPrompt);
      }
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!activePrompt) return;
    setIsGenerating(true);
    try {
      const fullPrompt = `${gender} ${activePrompt}`;
      let result: any;

      console.log("Generating image with prompt:", fullPrompt);
      if (referenceImage) {
        // Use Wan 2.5 for Image-to-Image as requested
        result = await fal.run('fal-ai/wan-25-preview/image-to-image', {
          input: {
            prompt: fullPrompt,
            image_url: referenceImage,
          },
        });
      } else {
        // Use Flux 2 Flex for Text-to-Image
        result = await fal.run('fal-ai/flux-2-flex', {
          input: {
            prompt: fullPrompt,
            image_size: "portrait_4_3",
          },
        });
      }

      if (result.images && result.images.length > 0) {
        onImageGenerated(result.images[0].url);
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      alert("Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-4 space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Image Prompt</label>
        <div className="relative">
          <input
            type="text"
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            placeholder={initialPrompt || "Describe the advisor (e.g. Professional Indian financial advisor in a suit...)"}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || !activePrompt}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
            title="Optimize with Gemini"
          >
            {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div className="flex-1 mr-4">
          <label className="text-xs text-slate-400 mb-1 block">Optional Reference Image</label>
          {!referenceImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-slate-700 rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-900/50 transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Upload Reference</span>
            </div>
          ) : (
            <div className="relative h-12 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-between px-2">
              <img src={referenceImage} alt="Ref" className="h-full w-auto object-contain" />
              <button
                onClick={() => setReferenceImage(null)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end">
          <label className="text-xs text-slate-400 mb-1 block">Advisor Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as 'male' | 'female')}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500 min-w-[100px]"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerateImage}
        disabled={isGenerating || !activePrompt}
        className="w-full py-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        {referenceImage ? 'Generate with Wan 2.5 (Img2Img)' : `Generate ${gender === 'male' ? 'Male' : 'Female'} Reference Image`}
      </button>

      <p className="text-xs text-slate-500 text-center">
        {referenceImage
          ? "Uses Wan 2.5 Image-to-Image to transform your reference."
          : "Uses Flux 2 Flex model to generate a character."}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
