import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Check,
  Feather,
  Loader2,
  Mic,
  Pencil,
  Plus,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import {
  LawMarginaliaNoteInput,
  LawMarginaliaNoteRecord,
  MARGINALIA_INK_PRESETS,
  MARGINALIA_SCRIPT_PRESETS,
  MARGINALIA_ZONE_PRESETS,
  MAX_MARGINALIA_CONTENT_LENGTH,
  MarginaliaAnchorZone,
  MarginaliaHandwritingStyle,
  MarginaliaInkColor,
  MarginaliaSourceMode,
  appendDictatedPhrase,
  getInkPreset,
  getScriptPreset,
  getZonePreset,
} from '../../utils/lawMarginaliaHelpers';
import type { LawMarginaliaUpdatePatch } from '../../services/lawMarginaliaService';

interface SpeechRecognitionAlternativeLike {
  transcript?: string;
}

interface SpeechRecognitionResultLike {
  isFinal?: boolean;
  [index: number]: SpeechRecognitionAlternativeLike | undefined;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstanceLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstanceLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

interface LawMarginaliaPageOverlayProps {
  lawId: string;
  pageIndex: number;
  pageTitle: string;
  notesOverlayOpen: boolean;
  notes: LawMarginaliaNoteRecord[];
  onToggleOverlay: () => void;
  onCreateNote: (
    input: Omit<LawMarginaliaNoteInput, 'userId'>
  ) => Promise<LawMarginaliaNoteRecord>;
  onUpdateNote: (
    existingNote: LawMarginaliaNoteRecord,
    patch: LawMarginaliaUpdatePatch
  ) => Promise<LawMarginaliaNoteRecord>;
  onDeleteNote: (noteId: string) => Promise<void>;
}

export const LawMarginaliaPageOverlay: React.FC<
  LawMarginaliaPageOverlayProps
> = ({
  lawId,
  pageIndex,
  pageTitle,
  notesOverlayOpen,
  notes,
  onToggleOverlay,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  // Composer state
  const [composerExpanded, setComposerExpanded] = useState(notes.length === 0);
  const [draftText, setDraftText] = useState('');
  const [interimSpeech, setInterimSpeech] = useState('');
  const [inkColor, setInkColor] = useState<MarginaliaInkColor>('sepia');
  const [handwritingStyle, setHandwritingStyle] =
    useState<MarginaliaHandwritingStyle>('cursive');
  const [anchorZone, setAnchorZone] =
    useState<MarginaliaAnchorZone>('side-margin');
  const [sourceMode, setSourceMode] = useState<MarginaliaSourceMode>('typed');
  const [isSaving, setIsSaving] = useState(false);

  // Edit existing marginalia state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editInk, setEditInk] = useState<MarginaliaInkColor>('sepia');
  const [editScript, setEditScript] =
    useState<MarginaliaHandwritingStyle>('cursive');
  const [editZone, setEditZone] = useState<MarginaliaAnchorZone>('side-margin');
  const [isUpdating, setIsUpdating] = useState(false);

  // Voice dictation state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [dictationError, setDictationError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const speechFinalBufferRef = useRef<string>('');
  const activeModeRef = useRef<'mediarecorder' | 'webspeech' | null>(null);

  const cleanupDictationResources = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {
        // Ignore abort errors on teardown
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
        }
      } catch {
        // Ignore recorder stop errors on teardown
      }
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    activeModeRef.current = null;
    setIsRecording(false);
    setRecordSeconds(0);
    setInterimSpeech('');
  }, []);

  // Reset transient state when switching law or page
  useEffect(() => {
    cleanupDictationResources();
    setDraftText('');
    setEditingNoteId(null);
    setDictationError(null);
    setSourceMode('typed');
  }, [lawId, pageIndex, cleanupDictationResources]);

  // Expand composer automatically if overlay is opened on an unannotated page
  useEffect(() => {
    if (notesOverlayOpen && notes.length === 0) {
      setComposerExpanded(true);
    }
  }, [notesOverlayOpen, notes.length]);

  useEffect(() => {
    return () => {
      cleanupDictationResources();
    };
  }, [cleanupDictationResources]);

  const applyDictatedResult = useCallback((spoken: string) => {
    const cleaned = spoken.trim();
    if (!cleaned) return;
    setDraftText((prev) => appendDictatedPhrase(prev, cleaned));
    setSourceMode('dictated');
  }, []);

  const startVoiceDictation = async () => {
    setDictationError(null);
    speechFinalBufferRef.current = '';
    setInterimSpeech('');
    setComposerExpanded(true);

    const SpeechCtor = getSpeechRecognitionCtor();
    const canMediaRecord =
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined';

    if (!canMediaRecord && !SpeechCtor) {
      setDictationError('当前浏览器暂不支持麦克风语音听写，请直接落笔输入。');
      return;
    }

    // Start optional Web Speech API companion for real-time caption & fallback
    const launchSpeechCompanion = (isPrimaryMode: boolean) => {
      if (!SpeechCtor) return;
      try {
        const recognition = new SpeechCtor();
        recognition.lang = 'zh-CN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let finalChunk = '';
          let interimChunk = '';
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const res = event.results[i];
            const transcript = res?.[0]?.transcript || '';
            if (res?.isFinal) {
              finalChunk += transcript;
            } else {
              interimChunk += transcript;
            }
          }
          if (finalChunk.trim()) {
            if (isPrimaryMode) {
              applyDictatedResult(finalChunk);
            } else {
              speechFinalBufferRef.current = appendDictatedPhrase(
                speechFinalBufferRef.current,
                finalChunk
              );
            }
          }
          setInterimSpeech(interimChunk);
        };

        recognition.onerror = (event) => {
          if (isPrimaryMode && event.error && event.error !== 'no-speech' && event.error !== 'aborted') {
            setDictationError('语音听写未能识别清晰语音，请靠近麦克风重试或直接输入。');
          }
        };

        recognition.onend = () => {
          if (isPrimaryMode && activeModeRef.current === 'webspeech') {
            setIsRecording(false);
            setInterimSpeech('');
            if (timerRef.current !== null) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setRecordSeconds(0);
            activeModeRef.current = null;
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        // Non-blocking fallback
      }
    };

    if (!canMediaRecord && SpeechCtor) {
      activeModeRef.current = 'webspeech';
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
      launchSpeechCompanion(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

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
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // Ignore stop error
          }
          recognitionRef.current = null;
        }
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordSeconds(0);
        setInterimSpeech('');

        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const webSpeechCaptured = speechFinalBufferRef.current.trim();
        speechFinalBufferRef.current = '';

        if (blob.size === 0) {
          if (webSpeechCaptured) {
            applyDictatedResult(webSpeechCaptured);
          }
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
            body: JSON.stringify({ audioBase64: base64Audio, mimeType }),
          });

          const data = await res.json().catch(() => ({}));
          if (res.ok && typeof data.text === 'string' && data.text.trim()) {
            applyDictatedResult(data.text);
          } else if (webSpeechCaptured) {
            applyDictatedResult(webSpeechCaptured);
          } else {
            setDictationError(
              data.error || '未能识别清晰语音，请尝试再说一次或直接手动书写。'
            );
          }
        } catch (err) {
          if (webSpeechCaptured) {
            applyDictatedResult(webSpeechCaptured);
          } else {
            setDictationError(
              err instanceof Error
                ? err.message
                : '语音转写服务暂不可用，请直接键入批注。'
            );
          }
        } finally {
          setIsTranscribing(false);
          activeModeRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      activeModeRef.current = 'mediarecorder';
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);

      // Run browser speech recognition silently for live preview + zero-fail fallback
      launchSpeechCompanion(false);
    } catch {
      setDictationError('无法访问麦克风权限，请在浏览器设置中允许录音后重试。');
    }
  };

  const stopVoiceDictation = () => {
    if (activeModeRef.current === 'webspeech') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore stop errors
        }
      }
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      setRecordSeconds(0);
      setInterimSpeech('');
      activeModeRef.current = null;
      return;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSaveNewNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftText.trim();
    if (!cleaned || isSaving) return;
    setIsSaving(true);
    setDictationError(null);
    try {
      await onCreateNote({
        lawId,
        pageIndex,
        content: cleaned,
        inkColor,
        handwritingStyle,
        anchorZone,
        sourceMode,
      });
      setDraftText('');
      setSourceMode('typed');
      setComposerExpanded(false);
    } catch (err) {
      setDictationError(
        err instanceof Error ? err.message : '保存批注失败，请重试。'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingNote = (note: LawMarginaliaNoteRecord) => {
    setEditingNoteId(note.id);
    setEditDraft(note.content);
    setEditInk(note.inkColor);
    setEditScript(note.handwritingStyle);
    setEditZone(note.anchorZone);
  };

  const handleConfirmEdit = async (note: LawMarginaliaNoteRecord) => {
    const cleaned = editDraft.trim();
    if (!cleaned || isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdateNote(note, {
        content: cleaned,
        inkColor: editInk,
        handwritingStyle: editScript,
        anchorZone: editZone,
      });
      setEditingNoteId(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const activeInkPreset = getInkPreset(inkColor);
  const activeScriptPreset = getScriptPreset(handwritingStyle);

  // Subtle on-page corner marginalia indicator when overlay is folded
  if (!notesOverlayOpen) {
    if (notes.length === 0) return null;
    const latestNote = notes[0];
    const latestInk = getInkPreset(latestNote.inkColor);
    const latestScript = getScriptPreset(latestNote.handwritingStyle);

    return (
      <div
        data-marginalia-interactive="true"
        className="absolute top-12 right-4 sm:right-6 z-20 max-w-[195px]"
      >
        <button
          type="button"
          onClick={onToggleOverlay}
          aria-label={`展开第 ${pageIndex + 1} 页的 ${notes.length} 处手写批注`}
          className="group marginalia-ink-slip w-full text-left px-3 py-2 rounded-lg border cursor-pointer transition-transform hover:-translate-y-0.5"
          style={{
            backgroundColor: latestInk.tintRgba,
            borderColor: latestInk.borderRgba,
            color: latestInk.textHex,
            transform: `rotate(${latestNote.tiltDeg}deg)`,
          }}
        >
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono opacity-85">
            <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold">
              <Feather className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">{notes.length} 处批注</span>
            </span>
            <span className="underline underline-offset-2 whitespace-nowrap">
              展开
            </span>
          </div>
          <p
            className={`${latestScript.className} text-sm leading-snug line-clamp-1 mt-0.5`}
          >
            {latestNote.content}
          </p>
        </button>
      </div>
    );
  }

  // Open Translucent Vellum Marginalia Overlay directly on this book page
  return (
    <div
      data-marginalia-interactive="true"
      role="region"
      aria-label={`第 ${pageIndex + 1} 页手写批注覆层`}
      className="marginalia-vellum-overlay absolute inset-0 z-25 flex flex-col p-4 sm:p-6 overflow-hidden animate-fadeIn select-text"
    >
      {/* Top Marginalia Leaf Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#C8933B]/35 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#8E5B13]">
            <Feather className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              第 {pageIndex + 1} 页 · {pageTitle}
            </span>
          </div>
          <p className="text-[11px] text-[#5E564E] mt-0.5 tabular-nums">
            页边半透羊皮批注纸（共 {notes.length} 处手记）
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!composerExpanded && (
            <button
              type="button"
              onClick={() => setComposerExpanded(true)}
              className="min-h-[34px] px-2.5 py-1 rounded-lg luxury-dark-btn text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>落笔新增</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleOverlay}
            aria-label="收起当前页批注纸"
            className="min-h-[34px] px-2.5 py-1 rounded-lg luxury-surface-btn text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>合上批注</span>
          </button>
        </div>
      </div>

      {/* Scrollable Page Marginalia Notes + Inline Composer */}
      <div className="flex-1 overflow-y-auto pt-3 pr-1 space-y-3">
        {/* Saved Handwritten Marginalia Cards Grouped Cleanly by Zone */}
        {notes.length > 0 && (
          <div className="space-y-2.5">
            {MARGINALIA_ZONE_PRESETS.map((zoneMeta) => {
              const zoneNotes = notes.filter(
                (item) => item.anchorZone === zoneMeta.id
              );
              if (zoneNotes.length === 0) return null;

              return (
                <div key={zoneMeta.id} className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#6E675F] flex items-center gap-1.5">
                    <span>{zoneMeta.labelZh}</span>
                    <span className="h-px flex-1 bg-[#C8933B]/25" />
                  </div>

                  {zoneNotes.map((note) => {
                    const ink = getInkPreset(note.inkColor);
                    const script = getScriptPreset(note.handwritingStyle);
                    const isEditing = editingNoteId === note.id;

                    return (
                      <article
                        key={note.id}
                        className="marginalia-ink-slip marginalia-lined-vellum rounded-xl border p-3.5 transition-transform"
                        style={{
                          borderColor: ink.borderRgba,
                          backgroundColor: ink.tintRgba,
                          transform: isEditing
                            ? 'rotate(0deg)'
                            : `rotate(${note.tiltDeg}deg)`,
                        }}
                      >
                        {isEditing ? (
                          <div className="space-y-2.5">
                            <textarea
                              value={editDraft}
                              onChange={(e) =>
                                setEditDraft(
                                  e.target.value.slice(
                                    0,
                                    MAX_MARGINALIA_CONTENT_LENGTH
                                  )
                                )
                              }
                              rows={3}
                              aria-label="编辑手写批注内容"
                              className={`w-full rounded-lg border border-stone-300/80 bg-white/85 px-3 py-2 text-base sm:text-lg leading-[28px] focus:outline-none focus:ring-2 focus:ring-[#C8933B]/45 ${
                                getScriptPreset(editScript).className
                              }`}
                              style={{ color: getInkPreset(editInk).textHex }}
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {MARGINALIA_INK_PRESETS.map((preset) => (
                                  <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => setEditInk(preset.id)}
                                    aria-label={`更换墨色：${preset.labelZh}`}
                                    aria-pressed={editInk === preset.id}
                                    className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                                      editInk === preset.id
                                        ? 'scale-110 border-[#181411]'
                                        : 'border-white/90 opacity-75 hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: preset.swatchHex }}
                                  />
                                ))}
                                <select
                                  value={editScript}
                                  onChange={(e) =>
                                    setEditScript(
                                      e.target.value as MarginaliaHandwritingStyle
                                    )
                                  }
                                  aria-label="更换字体"
                                  className="ml-1 text-[11px] rounded-md border border-stone-300 bg-white px-2 py-1 text-[#2B2520]"
                                >
                                  {MARGINALIA_SCRIPT_PRESETS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.labelZh}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={editZone}
                                  onChange={(e) =>
                                    setEditZone(
                                      e.target.value as MarginaliaAnchorZone
                                    )
                                  }
                                  aria-label="更换批注位置"
                                  className="text-[11px] rounded-md border border-stone-300 bg-white px-2 py-1 text-[#2B2520]"
                                >
                                  {MARGINALIA_ZONE_PRESETS.map((z) => (
                                    <option key={z.id} value={z.id}>
                                      {z.shortZh}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteId(null)}
                                  className="min-h-[32px] px-2.5 rounded-lg border border-stone-300 bg-white text-[11px] font-semibold text-[#5E564E] cursor-pointer"
                                >
                                  取消
                                </button>
                                <button
                                  type="button"
                                  disabled={isUpdating || !editDraft.trim()}
                                  onClick={() => handleConfirmEdit(note)}
                                  className="min-h-[32px] px-3 rounded-lg luxury-dark-btn text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>保存修改</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p
                              className={`${script.className} text-lg sm:text-[1.22rem] leading-[1.65] whitespace-pre-wrap break-words`}
                              style={{ color: ink.textHex }}
                            >
                              {note.content}
                            </p>

                            <div className="mt-2 pt-2 border-t border-black/10 flex items-center justify-between gap-2 text-[10px] font-mono text-[#5E564E]">
                              <span className="truncate">
                                {getZonePreset(note.anchorZone).shortZh} ·{' '}
                                {note.sourceMode === 'dictated'
                                  ? '语音听写手记'
                                  : '手书批注'}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startEditingNote(note)}
                                  aria-label="编辑此条批注"
                                  className="min-h-[30px] px-2 rounded-md hover:bg-black/5 inline-flex items-center gap-1 text-[#3F3831] cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" aria-hidden="true" />
                                  <span>编辑</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteNote(note.id)}
                                  aria-label="删除此条批注"
                                  className="min-h-[30px] px-2 rounded-md hover:bg-rose-100/80 inline-flex items-center gap-1 text-[#8C1D35] cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                                  <span>擦除</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Inline Handwritten & Dictated Composer directly on the Page */}
        {composerExpanded && (
          <form
            onSubmit={handleSaveNewNote}
            className="rounded-xl border border-[#C8933B]/45 bg-[#FFFDF8]/95 p-3.5 space-y-3 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#181411] inline-flex items-center gap-1.5">
                <Feather className="w-3.5 h-3.5 text-[#8E5B13]" aria-hidden="true" />
                <span>在第 {pageIndex + 1} 页落笔或口述批注</span>
              </span>

              {/* Fountain Ink Swatches */}
              <div
                className="flex items-center gap-1.5"
                role="group"
                aria-label="选择钢笔墨水色"
              >
                {MARGINALIA_INK_PRESETS.map((preset) => {
                  const selected = inkColor === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setInkColor(preset.id)}
                      aria-label={preset.labelZh}
                      aria-pressed={selected}
                      title={preset.labelZh}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                        selected
                          ? 'scale-115 border-[#181411] ring-2 ring-[#C8933B]/40'
                          : 'border-white opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset.swatchHex }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Calligraphic Script & Margin Zone Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                className="flex items-center gap-1"
                role="group"
                aria-label="选择手写字体"
              >
                {MARGINALIA_SCRIPT_PRESETS.map((script) => {
                  const active = handwritingStyle === script.id;
                  return (
                    <button
                      key={script.id}
                      type="button"
                      onClick={() => setHandwritingStyle(script.id)}
                      aria-pressed={active}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#181411] text-[#FAF8F5]'
                          : 'bg-[#F4EFE4] text-[#57514A] hover:text-[#181411]'
                      }`}
                    >
                      {script.labelZh}
                    </button>
                  );
                })}
              </div>

              <div
                className="flex items-center gap-1"
                role="group"
                aria-label="选择页边位置"
              >
                {MARGINALIA_ZONE_PRESETS.map((zone) => {
                  const active = anchorZone === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setAnchorZone(zone.id)}
                      aria-pressed={active}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#8E5B13] text-white'
                          : 'bg-[#FAF4E8] border border-stone-300/70 text-[#5E564E] hover:text-[#181411]'
                      }`}
                    >
                      {zone.shortZh}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ruled Vellum Handwritten Input */}
            <div className="relative">
              <textarea
                value={draftText}
                onChange={(e) => {
                  setDraftText(
                    e.target.value.slice(0, MAX_MARGINALIA_CONTENT_LENGTH)
                  );
                  if (!e.target.value.trim()) {
                    setSourceMode('typed');
                  }
                }}
                rows={4}
                placeholder={`用${activeInkPreset.labelZh}写下第 ${pageIndex + 1} 页的眉批、灵感，或点击下方「语音听写」口述成字…`}
                aria-label={`第 ${pageIndex + 1} 页手写批注输入框`}
                className={`marginalia-lined-vellum w-full rounded-xl border border-[#C8933B]/35 px-3.5 py-2.5 text-lg sm:text-[1.2rem] leading-[28px] placeholder:text-sm placeholder:font-sans placeholder:text-[#8A8076] focus:outline-none focus:ring-2 focus:ring-[#C8933B]/45 resize-y ${activeScriptPreset.className}`}
                style={{ color: activeInkPreset.textHex }}
              />
              {interimSpeech && (
                <div className="mt-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs text-[#7A5011]">
                  正在听写识别：{interimSpeech}
                </div>
              )}
            </div>

            {dictationError && (
              <div
                role="alert"
                className="rounded-lg bg-[#FDF4F6] border border-[#A82442]/30 px-3 py-2 text-xs text-[#8C1D35]"
              >
                {dictationError}
              </div>
            )}

            {/* Composer Footer: Dictation + Char Count + Save */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTranscribing}
                  onClick={
                    isRecording ? stopVoiceDictation : startVoiceDictation
                  }
                  aria-pressed={isRecording}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    isRecording
                      ? 'bg-[#A82442] text-white'
                      : isTranscribing
                      ? 'bg-[#EFE8D9] text-[#6E675F]'
                      : 'luxury-surface-btn text-[#2B2520]'
                  }`}
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>正在转写…</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                      <span className="tabular-nums">
                        停止听写 ({recordSeconds}s)
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-[#8E5B13]" aria-hidden="true" />
                      <span>语音听写</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] font-mono tabular-nums text-[#6E675F]">
                  {draftText.length} / {MAX_MARGINALIA_CONTENT_LENGTH}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {notes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setComposerExpanded(false)}
                    className="min-h-[36px] px-2.5 rounded-xl text-xs font-semibold text-[#5E564E] hover:text-[#181411] cursor-pointer whitespace-nowrap"
                  >
                    收起书写栏
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving || !draftText.trim() || isRecording}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-xl luxury-dark-btn text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                >
                  <Feather className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isSaving ? '落墨留存中…' : '落笔留存'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
