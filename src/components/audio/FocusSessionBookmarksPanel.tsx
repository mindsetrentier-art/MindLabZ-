import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  BookmarkPlus,
  Check,
  Cloud,
  Pencil,
  Play,
  Trash2,
  X,
  ArrowUpDown,
} from 'lucide-react';
import {
  BINAURAL_PRESETS,
  NATURE_PRESETS,
  FocusAudioSnapshot,
  FocusSessionBookmark,
  buildBookmarkSegmentFromSnapshot,
  cognitiveFocusAudio,
  formatSessionTimestamp,
} from '../../utils/cognitiveFocusAudio';
import {
  createFocusBookmark,
  deleteFocusBookmark,
  renameFocusBookmark,
  subscribeToFocusBookmarks,
} from '../../services/focusBookmarkService';
import { sortFocusBookmarks } from '../../utils/focusBookmarkHelpers';
import { useApp } from '../../context/AppContext';
import { gameAudio } from '../../utils/gameAudio';

interface FocusSessionBookmarksPanelProps {
  externalCaptureTrigger?: number;
}

export const FocusSessionBookmarksPanel: React.FC<FocusSessionBookmarksPanelProps> = ({
  externalCaptureTrigger = 0,
}) => {
  const { firebaseUser, openAuthModal } = useApp();
  const [snap, setSnap] = useState<FocusAudioSnapshot>(() =>
    cognitiveFocusAudio.getSnapshot()
  );
  const [bookmarks, setBookmarks] = useState<FocusSessionBookmark[]>([]);
  const [labelInput, setLabelInput] = useState('');
  const [sortMode, setSortMode] = useState<'newest' | 'timestamp'>('newest');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [activeBookmarkId, setActiveBookmarkId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return cognitiveFocusAudio.subscribe(setSnap);
  }, []);

  useEffect(() => {
    const unsub = subscribeToFocusBookmarks(
      firebaseUser?.uid,
      (items) => {
        setBookmarks(items);
      },
      () => {
        setErrorMessage('书签云端同步遇到异常，已自动保留本地记录。');
      }
    );
    return () => unsub();
  }, [firebaseUser?.uid]);

  const handleCaptureBookmark = async (customLabelOverride?: string) => {
    if (isSaving) return;
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSaving(true);
    try {
      gameAudio.playTap();
      const latestSnap = cognitiveFocusAudio.getSnapshot();
      const segment = buildBookmarkSegmentFromSnapshot(
        latestSnap,
        customLabelOverride !== undefined ? customLabelOverride : labelInput
      );
      const created = await createFocusBookmark(firebaseUser?.uid, segment);
      setLabelInput('');
      setActiveBookmarkId(created.id);
      setStatusMessage(
        `已记录时间戳 ${formatSessionTimestamp(created.timestampSec)} · ${created.label}`
      );
    } catch {
      setErrorMessage('保存时间戳书签失败，请稍后重试。');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (externalCaptureTrigger > 0) {
      void handleCaptureBookmark('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCaptureTrigger]);

  const handleRevisitBookmark = (bm: FocusSessionBookmark) => {
    setErrorMessage(null);
    gameAudio.playTap();
    cognitiveFocusAudio.applySessionBookmark(bm, { autoPlay: true });
    setActiveBookmarkId(bm.id);
    setStatusMessage(
      `已跳转至 ${formatSessionTimestamp(bm.timestampSec)} 并恢复「${bm.label}」声场`
    );
  };

  const startRename = (bm: FocusSessionBookmark) => {
    setEditingId(bm.id);
    setEditingLabel(bm.label);
    setErrorMessage(null);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingLabel('');
  };

  const submitRename = async (bookmarkId: string) => {
    const trimmed = editingLabel.trim();
    if (!trimmed) {
      cancelRename();
      return;
    }
    setErrorMessage(null);
    try {
      await renameFocusBookmark(firebaseUser?.uid, bookmarkId, trimmed);
      setEditingId(null);
      setEditingLabel('');
    } catch {
      setErrorMessage('重命名书签失败，请稍后重试。');
    }
  };

  const handleDelete = async (bm: FocusSessionBookmark) => {
    setErrorMessage(null);
    try {
      gameAudio.playTap();
      await deleteFocusBookmark(firebaseUser?.uid, bm.id);
      if (activeBookmarkId === bm.id) {
        setActiveBookmarkId(null);
      }
    } catch {
      setErrorMessage('删除书签失败，请稍后重试。');
    }
  };

  const activeBinaural =
    BINAURAL_PRESETS.find((p) => p.id === snap.binauralPresetId) ||
    BINAURAL_PRESETS[0];
  const activeNature =
    NATURE_PRESETS.find((n) => n.id === snap.naturePresetId) || NATURE_PRESETS[0];

  const orderedBookmarks = sortFocusBookmarks(bookmarks, sortMode);

  return (
    <section
      aria-label="专注时段时间戳书签"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900">
            01. 专注时段时间戳书签
          </h2>
          <p className="text-xs text-stone-600">
            收藏当前专注进度时间点与声场混音配置，随时一键回溯并续播心流片段。
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {firebaseUser ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <Cloud className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>云端同步已开启</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              <Cloud className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>本地保存中 · 登录同步多端</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-2xs">
        {/* Top Capture Bar */}
        <div className="p-5 bg-[#FAF8F5] border-b border-stone-200/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-center shrink-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                  CURRENT TIME
                </div>
                <div
                  data-testid="focus-current-timestamp"
                  className="font-mono tabular-nums text-xl font-bold text-stone-950"
                >
                  {formatSessionTimestamp(snap.sessionElapsedSec)}
                </div>
              </div>

              <div className="min-w-0 space-y-1">
                <div className="text-xs font-semibold text-stone-900 truncate">
                  {activeBinaural.nameZh} · {activeNature.nameZh}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-stone-600 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>Δf {snap.beatHz.toFixed(1)} Hz</span>
                  <span aria-hidden="true">·</span>
                  <span>载波 {snap.carrierHz} Hz</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    混音 {Math.round(snap.binauralMix * 100)}% /{' '}
                    {snap.naturePresetId === 'none'
                      ? '0%'
                      : `${Math.round(snap.natureMix * 100)}%`}
                  </span>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleCaptureBookmark();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto md:min-w-[380px]"
            >
              <label htmlFor="focus-bookmark-label-input" className="sr-only">
                时间戳书签备注名称
              </label>
              <input
                id="focus-bookmark-label-input"
                type="text"
                maxLength={80}
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="备注片段标题（可选，如：深度心流切入点）"
                className="flex-1 min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-700/30 focus:border-sky-700"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
              >
                <BookmarkPlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{isSaving ? '保存中...' : '收藏当前时间戳'}</span>
              </button>
            </form>
          </div>

          {(statusMessage || errorMessage) && (
            <div
              role="status"
              className={`text-xs px-3.5 py-2 rounded-xl border ${
                errorMessage
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-sky-50/70 border-sky-200 text-sky-900'
              }`}
            >
              {errorMessage || statusMessage}
            </div>
          )}
        </div>

        {/* List Toolbar */}
        <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <Bookmark className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
            <span className="font-medium text-stone-900">
              已保存片段 ({orderedBookmarks.length})
            </span>
          </div>

          {orderedBookmarks.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setSortMode((prev) => (prev === 'newest' ? 'timestamp' : 'newest'))
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200 hover:border-stone-400 text-[11px] font-medium text-stone-700 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              <ArrowUpDown className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>{sortMode === 'newest' ? '按保存时间排序' : '按时间戳排序'}</span>
            </button>
          )}
        </div>

        {/* Saved Bookmarks List */}
        {orderedBookmarks.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-medium text-stone-800">
              尚无专注时间戳书签
            </p>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              开启专注声场后，随时点击「收藏当前时间戳」，即可将该时刻的计时进度、脑波差频与自然声景混音比例完整存档。
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-200/80">
            {orderedBookmarks.map((bm) => {
              const binauralMeta =
                BINAURAL_PRESETS.find((p) => p.id === bm.binauralPresetId) ||
                BINAURAL_PRESETS[0];
              const natureMeta =
                NATURE_PRESETS.find((n) => n.id === bm.naturePresetId) ||
                NATURE_PRESETS[0];
              const isEditing = editingId === bm.id;
              const isCurrent = activeBookmarkId === bm.id;

              return (
                <li
                  key={bm.id}
                  className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isCurrent ? 'bg-sky-50/40' : 'hover:bg-stone-50/70'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleRevisitBookmark(bm)}
                      title={`跳转至 ${formatSessionTimestamp(bm.timestampSec)} 播放`}
                      className={`px-3 py-1.5 rounded-lg font-mono tabular-nums text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                        isCurrent
                          ? 'bg-sky-700 border-sky-700 text-white'
                          : 'bg-stone-100 border-stone-200 text-stone-900 hover:bg-stone-900 hover:text-white hover:border-stone-900'
                      }`}
                    >
                      {formatSessionTimestamp(bm.timestampSec)}
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      {isEditing ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            void submitRename(bm.id);
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            maxLength={80}
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') cancelRename();
                            }}
                            autoFocus
                            aria-label="编辑书签名称"
                            className="flex-1 min-w-0 px-2.5 py-1 rounded-lg border border-sky-700 text-xs text-stone-900 bg-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="p-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 cursor-pointer"
                            aria-label="保存名称"
                          >
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelRename}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 cursor-pointer"
                            aria-label="取消编辑"
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-stone-900 truncate">
                            {bm.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] font-mono text-sky-700 font-semibold shrink-0">
                              · 当前定位
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-[11px] text-stone-600 font-mono tabular-nums flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>
                          {binauralMeta.nameZh} ({bm.beatHz.toFixed(1)} Hz)
                        </span>
                        <span className="text-stone-300" aria-hidden="true">
                          ·
                        </span>
                        <span>{natureMeta.nameZh}</span>
                        <span className="text-stone-300" aria-hidden="true">
                          ·
                        </span>
                        <span>载波 {bm.carrierHz} Hz</span>
                        <span className="text-stone-300 hidden sm:inline" aria-hidden="true">
                          ·
                        </span>
                        <span className="hidden sm:inline">
                          混音 {Math.round(bm.binauralMix * 100)}% /{' '}
                          {bm.naturePresetId === 'none'
                            ? '0%'
                            : `${Math.round(bm.natureMix * 100)}%`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleRevisitBookmark(bm)}
                      className="min-h-[34px] px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
                    >
                      <Play className="w-3 h-3 fill-current shrink-0" aria-hidden="true" />
                      <span>跳转播放</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startRename(bm)}
                      className="min-h-[34px] min-w-[34px] p-2 rounded-xl border border-stone-200 hover:border-stone-400 text-stone-600 hover:text-stone-900 inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      aria-label={`重命名书签 ${bm.label}`}
                      title="重命名书签"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(bm)}
                      className="min-h-[34px] min-w-[34px] p-2 rounded-xl border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-500 hover:text-rose-700 inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      aria-label={`删除书签 ${bm.label}`}
                      title="删除书签"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
