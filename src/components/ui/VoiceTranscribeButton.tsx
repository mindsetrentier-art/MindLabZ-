import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface VoiceTranscribeButtonProps {
  onTranscript: (text: string) => void;
  onError?: (err: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const VoiceTranscribeButton: React.FC<VoiceTranscribeButtonProps> = ({
  onTranscript,
  onError,
  className = '',
  size = 'md',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordSeconds(0);

        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size === 0) {
          setIsRecording(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const res = await fetch('/api/audio/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType,
            }),
          });

          const data = await res.json();
          if (res.ok && data.text) {
            onTranscript(data.text);
          } else {
            onError?.(data.error || 'Aucun texte détecté dans l’audio.');
          }
        } catch (err: any) {
          onError?.(err?.message || 'Erreur lors de la transcription audio.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      onError?.('Accès au microphone refusé ou indisponible.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const btnDims = size === 'sm' ? 'h-8 px-2.5 text-[11px]' : 'h-10 px-3 text-xs';

  return (
    <button
      type="button"
      disabled={isTranscribing}
      onClick={isRecording ? stopRecording : startRecording}
      title={
        isRecording
          ? 'Arrêter et transcrire (gemini-3.5-transcribe)'
          : 'Dicter avec le microphone (gemini-3.5-transcribe)'
      }
      className={`rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 btn-press cursor-pointer ${btnDims} ${
        isRecording
          ? 'bg-[#EF4444] text-white shadow-[0_0_14px_rgba(239,68,68,0.45)] animate-pulse'
          : isTranscribing
          ? 'bg-[#EDE9FE] text-[#6C4CF1]'
          : 'bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#6C4CF1] border border-[#DDD6FE]'
      } ${className}`}
    >
      {isTranscribing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Transcription...</span>
        </>
      ) : isRecording ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current" />
          <span className="font-numeric">{recordSeconds}s</span>
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
};
