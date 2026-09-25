import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  X,
  Send,
  Lightbulb,
  Brain,
  RefreshCw,
  Mic,
  MicOff,
  Radio,
  PhoneOff,
  Volume2,
  MessageSquare,
  AudioLines,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AITutorSkeleton } from './Skeleton';
import { VoiceTranscribeButton } from './VoiceTranscribeButton';

// Encode Float32Array (-1.0 to 1.0) into 16-bit little-endian PCM Base64
function float32ToPcm16Base64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Decode 16-bit little-endian PCM Base64 into AudioBuffer (24kHz)
function pcm16Base64ToAudioBuffer(
   audioCtx: AudioContext,
  base64: string,
  sampleRate = 24000
): AudioBuffer {
  const binary = atob(base64);
  const byteLength = binary.length;
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const sampleCount = Math.floor(byteLength / 2);
  const audioBuffer = audioCtx.createBuffer(1, sampleCount, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < sampleCount; i++) {
    channelData[i] = view.getInt16(i * 2, true) / 32768;
  }
  return audioBuffer;
}

export const AITutorModal: React.FC = () => {
  const { aiTutorOpen, setAiTutorOpen, activeContextLaw } = useApp();

  // Tab mode: 'chat' (includes gemini-3.5-transcribe mic dictation) or 'live' (gemini-3.8-live real-time voice)
  const [mode, setMode] = useState<'chat' | 'live'>('chat');

  // Chat & Transcription state
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [transcribeNotice, setTranscribeNotice] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([
    {
      role: 'assistant',
      content:
        '你好！我是智心堂的 AI 认知科学与心理学导师。你可以通过文字、麦克风语音转文字（gemini-3.5-transcribe）向我提问，或切换到「实时语音通话（gemini-3.8-live）」与我直接对话！',
    },
  ]);

  // Live API (gemini-3.8-live) state & refs
  const [liveStatus, setLiveStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [liveTranscripts, setLiveTranscripts] = useState<
    Array<{ speaker: 'user' | 'ai'; text: string }>
  >([]);

  // Use refs for audio/WebSocket callbacks as required by Live API rules to avoid stale closures
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef<boolean>(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const stopAllPlayback = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // Ignore already stopped sources
      }
    }
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setIsAiSpeaking(false);
  }, []);

  const stopLiveSession = useCallback(() => {
    stopAllPlayback();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // Ignore
      }
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Ignore
      }
      wsRef.current = null;
    }

    setLiveStatus('idle');
    setIsAiSpeaking(false);
  }, [stopAllPlayback]);

  // Clean up Live session when modal closes or unmounts
  useEffect(() => {
    if (!aiTutorOpen) {
      stopLiveSession();
    }
    return () => {
      stopLiveSession();
    };
  }, [aiTutorOpen, stopLiveSession]);

  const startLiveSession = async () => {
    stopLiveSession();
    setLiveError(null);
    setLiveStatus('connecting');

    try {
      // 1. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup 16kHz input AudioContext & 24kHz output AudioContext
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      // 3. Connect WebSocket to server /live bridge
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current) return;
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          const channelData = e.inputBuffer.getChannelData(0);
          const base64Audio = float32ToPcm16Base64(channelData);
          wsRef.current.send(JSON.stringify({ audio: base64Audio }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.status === 'connected') {
            setLiveStatus('connected');
            if (activeContextLaw && ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  text: `Contexte actuel: l'utilisateur consulte la loi psychologique "${activeContextLaw.nameZh}" (${activeContextLaw.nameEn}). Salue-le brièvement.`,
                })
              );
            }
          }

          if (msg.error) {
            setLiveError(msg.error);
            setLiveStatus('error');
          }

          if (msg.interrupted) {
            stopAllPlayback();
          }

          if (msg.audio && outputAudioCtxRef.current) {
            const outCtx = outputAudioCtxRef.current;
            if (outCtx.state === 'suspended') {
              outCtx.resume().catch(() => {});
            }
            const audioBuffer = pcm16Base64ToAudioBuffer(outCtx, msg.audio, 24000);
            const bufferSource = outCtx.createBufferSource();
            bufferSource.buffer = audioBuffer;
            bufferSource.connect(outCtx.destination);

            const startTime = Math.max(outCtx.currentTime, nextStartTimeRef.current);
            bufferSource.start(startTime);
            nextStartTimeRef.current = startTime + audioBuffer.duration;

            activeSourcesRef.current.push(bufferSource);
            setIsAiSpeaking(true);

            bufferSource.onended = () => {
              activeSourcesRef.current = activeSourcesRef.current.filter(
                (s) => s !== bufferSource
              );
              if (activeSourcesRef.current.length === 0) {
                setIsAiSpeaking(false);
              }
            };
          }

          if (msg.inputTranscript) {
            setLiveTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'user') {
                return [
                  ...prev.slice(0, -1),
                  { speaker: 'user', text: last.text + msg.inputTranscript },
                ];
              }
              return [...prev, { speaker: 'user', text: msg.inputTranscript }];
            });
          }

          if (msg.outputTranscript) {
            setLiveTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'ai') {
                return [
                  ...prev.slice(0, -1),
                  { speaker: 'ai', text: last.text + msg.outputTranscript },
                ];
              }
              return [...prev, { speaker: 'ai', text: msg.outputTranscript }];
            });
          }
        } catch (err) {
          console.error('Error handling Live WS message:', err);
        }
      };

      ws.onerror = () => {
        setLiveError('Erreur de connexion WebSocket Live API.');
        setLiveStatus('error');
      };

      ws.onclose = () => {
        setLiveStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
        setIsAiSpeaking(false);
      };
    } catch (err: any) {
      setLiveError(
        err?.message || "Impossible d'accéder au microphone pour la conversation vocale."
      );
      setLiveStatus('error');
    }
  };

  if (!aiTutorOpen) return null;

  const handleAsk = async (questionText?: string) => {
    const query = questionText || inputQuestion.trim();
    if (!query || loading) return;

    setInputQuestion('');
    setTranscribeNotice(null);
    setChatHistory((prev) => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          context: activeContextLaw
            ? {
                lawName: activeContextLaw.nameZh,
                lawEn: activeContextLaw.nameEn,
                category: activeContextLaw.categoryZh,
                shortExplanation: activeContextLaw.shortExplanation,
              }
            : null,
        }),
      });

      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || '抱歉，导师思考受阻，请稍后再试。',
        },
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '【智心 AI 导师分析】：认知科学研究表明，大脑在面对复杂情境时常依赖“快速启发式”（Heuristics）。保持元认知觉察（Metacognition）能助你在关键时刻摆脱偏见，做出更清晰的判断。',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = activeContextLaw
    ? [
        `请用生活中的真实故事通俗解释【${activeContextLaw.nameZh}】？`,
        `如何在日常工作或学习中利用【${activeContextLaw.nameZh}】提高效率？`,
        `如何防止自己掉入【${activeContextLaw.nameZh}】的思维陷阱？`,
      ]
    : [
        '为什么我们总是在最后一刻才开始赶工（拖延与蔡格尼克）？',
        '如何利用“双系统理论”在冲动消费前按下暂停键？',
        '为什么第一印象（首因效应）如此顽固，该如何扭转？',
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fadeIn"
      onClick={() => setAiTutorOpen(false)}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E6E2F5] overflow-hidden flex flex-col max-h-[88vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 art-dark-banner text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">
                  智心 AI 认知导师 · Studio Vocal
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  {activeContextLaw
                    ? `当前聚焦：${activeContextLaw.nameZh}`
                    : 'Transcription (gemini-3.5-transcribe) & Live Voice (gemini-3.8-live)'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAiTutorOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors btn-press cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Mode Selector Tabs: Chat + Transcription vs Live Voice Conversation */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/20 backdrop-blur-md rounded-2xl border border-white/15">
            <button
              type="button"
              onClick={() => {
                stopLiveSession();
                setMode('chat');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'chat'
                  ? 'bg-white text-[#532CD8] shadow-sm'
                  : 'text-white/85 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat & Dictée Audio</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('live')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'live'
                  ? 'bg-white text-[#532CD8] shadow-sm'
                  : 'text-white/85 hover:text-white'
              }`}
            >
              <AudioLines className="w-3.5 h-3.5" />
              <span>Conversation Live IA</span>
            </button>
          </div>
        </div>

        {mode === 'chat' ? (
          <>
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF9FF] text-sm">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] text-[#6C4CF1] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Brain className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`p-3.5 rounded-2xl max-w-[82%] leading-relaxed text-xs font-medium ${
                      msg.role === 'user'
                        ? 'chameleon-btn rounded-tr-none shadow-xs'
                        : 'bg-white text-[#18181B] border border-[#E6E2F5] rounded-tl-none shadow-xs whitespace-pre-wrap'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="space-y-2">
                  <AITutorSkeleton />
                  <div className="flex gap-2 justify-start items-center text-[11px] text-[#64748B] pl-10 py-1">
                    <RefreshCw className="w-3 h-3 text-[#6C4CF1] animate-spin" />
                    <span className="animate-pulse">
                      AI 导师正在检索认知神经科学知识库...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Transcription Status Notice */}
            {transcribeNotice && (
              <div className="px-4 py-1.5 bg-[#F5F3FF] border-t border-[#EDE9FE] text-[11px] text-[#532CD8] font-medium flex items-center justify-between">
                <span>{transcribeNotice}</span>
                <button
                  type="button"
                  onClick={() => setTranscribeNotice(null)}
                  className="text-[#64748B] hover:text-[#18181B]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Suggestion Chips */}
            <div className="px-4 py-2.5 bg-white border-t border-[#F5F3FF] flex gap-2 overflow-x-auto no-scrollbar">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  disabled={loading}
                  onClick={() => handleAsk(q)}
                  className="text-xs shrink-0 px-3 py-1.5 rounded-full bg-[#FAF9FF] text-[#6C4CF1] hover:bg-[#EDE9FE] transition-colors border border-[#E6E2F5] flex items-center gap-1.5 btn-press cursor-pointer"
                >
                  <Lightbulb className="w-3 h-3 text-[#F59E0B]" />
                  <span className="truncate max-w-[220px] font-medium">{q}</span>
                </button>
              ))}
            </div>

            {/* Input Bar with Microphone Transcription (gemini-3.5-transcribe) */}
            <div className="p-3 bg-white border-t border-[#E6E2F5] flex items-center gap-2">
              <VoiceTranscribeButton
                onTranscript={(text) => {
                  setInputQuestion((prev) => (prev ? `${prev} ${text}` : text));
                  setTranscribeNotice('✓ Audio transcrit via gemini-3.5-transcribe');
                }}
                onError={(err) => setTranscribeNotice(err)}
              />
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder={
                  activeContextLaw
                    ? `Parlez au micro ou écrivez sur ${activeContextLaw.nameZh}...`
                    : 'Dictez au micro (gemini-3.5-transcribe) ou écrivez votre question...'
                }
                className="flex-1 px-4 py-2.5 text-xs font-medium bg-[#FAF9FF] border border-[#E6E2F5] text-[#18181B] placeholder-[#94A3B8] rounded-2xl focus:outline-none focus:border-[#6C4CF1] focus:ring-1 focus:ring-[#6C4CF1]/20 shadow-xs"
              />
              <button
                onClick={() => handleAsk()}
                disabled={loading || !inputQuestion.trim()}
                className="w-10 h-10 rounded-2xl chameleon-btn disabled:opacity-40 flex items-center justify-center transition-all shadow-xs shrink-0 btn-press cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          /* Mode 2: Real-Time Voice Conversation Studio (gemini-3.8-live Live API) */
          <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-[#FAF9FF] to-[#F3EFFE] overflow-y-auto">
            {/* Top Status & Orb */}
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="text-xs font-bold text-[#532CD8] tracking-wide flex items-center gap-1.5">
                <Radio
                  className={`w-4 h-4 ${
                    liveStatus === 'connected'
                      ? 'text-[#10B981] animate-pulse'
                      : 'text-[#6C4CF1]'
                  }`}
                />
                <span>
                  {liveStatus === 'connected'
                    ? isAiSpeaking
                      ? 'Le Coach IA vous répond en direct (24kHz)...'
                      : isMuted
                      ? 'Microphone en sourdine'
                      : 'À votre écoute en temps réel (gemini-3.8-live)...'
                    : liveStatus === 'connecting'
                    ? 'Connexion au serveur vocal Gemini 3.8 Live...'
                    : 'Conversation Vocale Temps Réel · Gemini 3.8 Live'}
                </span>
              </div>

              {/* Animated Voice Orb */}
              <div className="relative flex items-center justify-center my-2">
                {liveStatus === 'connected' && (
                  <>
                    <div
                      className={`absolute w-36 h-36 rounded-full blur-xl transition-all duration-500 ${
                        isAiSpeaking
                          ? 'bg-[#6C4CF1]/35 scale-125 animate-pulse'
                          : 'bg-[#10B981]/25 scale-105 animate-aura-pulse'
                      }`}
                    />
                    <div className="absolute w-28 h-28 rounded-full border border-[#6C4CF1]/30 animate-ping" />
                  </>
                )}
                <div
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                    liveStatus === 'connected'
                      ? 'chameleon-btn scale-105'
                      : 'bg-white border-2 border-[#DDD6FE] text-[#6C4CF1]'
                  }`}
                >
                  {isAiSpeaking ? (
                    <Volume2 className="w-10 h-10 animate-bounce" />
                  ) : liveStatus === 'connected' ? (
                    <AudioLines className="w-10 h-10 animate-pulse" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </div>
              </div>

              <p className="text-xs text-[#64748B] max-w-xs leading-relaxed">
                {liveStatus === 'connected'
                  ? 'Parlez naturellement en français, chinois ou anglais. Vous pouvez interrompre le coach à tout moment.'
                  : 'Démarrez une session vocale bidirectionnelle à faible latence propulsée par le modèle gemini-3.8-live.'}
              </p>

              {liveError && (
                <div className="px-3.5 py-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] font-medium max-w-sm">
                  {liveError}
                </div>
              )}
            </div>

            {/* Live Real-Time Transcription Stream */}
            {liveTranscripts.length > 0 && (
              <div className="my-3 p-3 rounded-2xl bg-white/85 border border-[#E6E2F5] max-h-36 overflow-y-auto space-y-2 text-xs">
                {liveTranscripts.slice(-4).map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${
                      item.speaker === 'user' ? 'text-[#475569]' : 'text-[#532CD8] font-semibold'
                    }`}
                  >
                    <span className="shrink-0 font-bold">
                      {item.speaker === 'user' ? 'Vous :' : 'Coach IA :'}
                    </span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Live Call Action Controls */}
            <div className="pt-3 border-t border-[#E6E2F5] flex items-center justify-center gap-3">
              {liveStatus === 'connected' || liveStatus === 'connecting' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isMuted
                        ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                        : 'bg-white text-[#18181B] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>Réactiver Micro</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-[#10B981]" />
                        <span>Micro Actif</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={stopLiveSession}
                    className="px-5 py-2.5 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Terminer l’appel Live</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startLiveSession}
                  className="px-6 py-3 rounded-2xl chameleon-btn text-xs font-extrabold flex items-center gap-2 shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <AudioLines className="w-4 h-4" />
                  <span>Démarrer la Conversation Vocale (gemini-3.8-live)</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
