'use client';

import { Loader2, Mic, Square, Trash2 } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleConfirm = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  const handleDiscard = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 max-w-md w-full space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Record Voice Sample</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {!audioUrl ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-12">
              {isRecording ? (
                <>
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                    <Mic className="w-16 h-16 text-red-500 relative z-10" />
                  </div>
                  <p className="text-2xl font-mono text-white mb-2">{formatTime(recordingTime)}</p>
                  <p className="text-sm text-slate-400">Recording in progress...</p>
                </>
              ) : (
                <>
                  <Mic className="w-16 h-16 text-slate-500 mb-6" />
                  <p className="text-sm text-slate-400 text-center mb-4">
                    Click the button below to start recording your voice sample.<br />
                    <span className="text-xs text-slate-500">Minimum 10 seconds recommended for best results</span>
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Square className="w-5 h-5" />
                  Stop Recording
                </button>
              ) : (
                <>
                  <button
                    onClick={onCancel}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-6 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startRecording}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Duration</span>
                <span className="text-lg font-mono text-white">{formatTime(recordingTime)}</span>
              </div>
              <audio controls src={audioUrl} className="w-full" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDiscard}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Discard
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Use This Recording
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
