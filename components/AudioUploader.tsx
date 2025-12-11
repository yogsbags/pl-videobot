import * as fal from "@fal-ai/serverless-client";
import { Loader2, Mic, Music, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { AudioRecorder } from './AudioRecorder';

interface AudioUploaderProps {
  audioUrl: string | null;
  onAudioUpload: (url: string | null) => void;
  onVoiceCloned?: (voiceId: string) => void;
}

export function AudioUploader({ audioUrl, onAudioUpload, onVoiceCloned }: AudioUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showCloneOptions, setShowCloneOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloneInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await fal.storage.upload(file);
      onAudioUpload(url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload audio. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloneFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await cloneVoice(file);
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setShowRecorder(false);
    setShowCloneOptions(false);

    // Convert blob to file
    const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
    await cloneVoice(file);
  };

  const cloneVoice = async (file: File) => {
    setIsCloning(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/clone-voice', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.id || data.voice_id) {
        const voiceId = data.id || data.voice_id;
        if (onVoiceCloned) onVoiceCloned(voiceId);
        alert(`Voice cloned successfully! ID: ${voiceId}`);
      } else {
        throw new Error(data.error || "Failed to clone voice");
      }
    } catch (error: any) {
      console.error("Cloning failed:", error);
      alert(`Failed to clone voice: ${error.message}`);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Music className="w-4 h-4" />
          Reference Audio (Required for OmniHuman)
        </label>
        {audioUrl && (
          <button
            onClick={() => {
              onAudioUpload(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Remove
          </button>
        )}
      </div>

      {!audioUrl ? (
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-slate-900/50 transition-all group"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mb-2" />
            ) : (
              <Upload className="w-6 h-6 text-slate-500 group-hover:text-emerald-500 mb-2 transition-colors" />
            )}
            <p className="text-sm text-slate-400 group-hover:text-slate-300 text-center">
              {isUploading ? "Uploading..." : "Upload Audio File"}
            </p>
          </div>

          <div
            onClick={() => setShowCloneOptions(true)}
            className="border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all group"
          >
            {isCloning ? (
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
            ) : (
              <Mic className="w-6 h-6 text-slate-500 group-hover:text-indigo-500 mb-2 transition-colors" />
            )}
            <p className="text-sm text-slate-400 group-hover:text-slate-300 text-center">
              {isCloning ? "Cloning Voice..." : "Clone Voice from Audio"}
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full bg-slate-900 rounded-xl p-4 border border-slate-700 flex items-center gap-3">
          <Music className="w-5 h-5 text-emerald-500" />
          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-slate-400 truncate">{audioUrl}</p>
          </div>
          <audio controls src={audioUrl} className="h-8 w-32" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <input
        ref={cloneInputRef}
        type="file"
        accept="audio/*"
        onChange={handleCloneFileChange}
        className="hidden"
      />

      {/* Clone Options Modal */}
      {showCloneOptions && !showRecorder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 max-w-md w-full space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Clone Voice</h3>
              <button
                onClick={() => setShowCloneOptions(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-400">
              Choose how you want to provide your voice sample for cloning:
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setShowCloneOptions(false);
                  setShowRecorder(true);
                }}
                className="border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all group"
              >
                <Mic className="w-8 h-8 text-slate-500 group-hover:text-indigo-500 mb-3 transition-colors" />
                <p className="text-sm text-slate-400 group-hover:text-slate-300 text-center font-medium">
                  Record Now
                </p>
                <p className="text-xs text-slate-500 mt-1 text-center">
                  Use your microphone
                </p>
              </button>

              <button
                onClick={() => {
                  setShowCloneOptions(false);
                  cloneInputRef.current?.click();
                }}
                className="border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-slate-900/50 transition-all group"
              >
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-500 mb-3 transition-colors" />
                <p className="text-sm text-slate-400 group-hover:text-slate-300 text-center font-medium">
                  Upload File
                </p>
                <p className="text-xs text-slate-500 mt-1 text-center">
                  Choose audio file
                </p>
              </button>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">💡 Tip:</strong> For best results, provide at least 10 seconds of clear speech without background noise.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audio Recorder */}
      {showRecorder && (
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => {
            setShowRecorder(false);
            setShowCloneOptions(true);
          }}
        />
      )}
    </div>
  );
}
