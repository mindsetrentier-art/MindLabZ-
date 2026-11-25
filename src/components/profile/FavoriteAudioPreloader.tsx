import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  HardDriveDownload,
  CheckCircle2,
  Trash2,
  Play,
  Square,
  WifiOff,
  Loader2,
  Bookmark,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EMOTIONAL_PSYCHOLOGY_LAWS } from '../../data/emotionalLaws';
import {
  LawSpeechSegment,
  VOICE_PRESETS,
  buildLawSpeechSegmentsFromLaw,
  isLawPreloadedForPreset,
  preloadLawAudio,
  stopLawSpeech,
  toggleLawSpeech,
  useLawSpeech,
  useLawSpeechPreferences,
} from '../../utils/lawSpeechEngine';
import {
  OfflineLawManifest,
  clearAllOfflineAudioCache,
  formatAudioCacheBytes,
  getOfflineCacheStats,
  removeOfflineLawCache,
} from '../../utils/offlineAudioCache';
import { gameAudio } from '../../utils/gameAudio';

interface ResolvedFavoriteLaw {
  id: string;
  title: string;
  categoryLabel: string;
  segments: LawSpeechSegment[];
}

export const FavoriteAudioPreloader: React.FC = () => {
  const { user, laws } = useApp();
  const [prefs] = useLawSpeechPreferences();
  const { activeLawId, globalIsSpeaking } = useLawSpeech();

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [totalCachedBytes, setTotalCachedBytes] = useState<number>(0);
  const [manifestsByLaw, setManifestsByLaw] = useState<Record<string, OfflineLawManifest>>({});
  const [readyForPresetMap, setReadyForPresetMap] = useState<Record<string, boolean>>({});
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  const [isBatchDownloading, setIsBatchDownloading] = useState<boolean>(false);
  const [activeDownloadingLawId, setActiveDownloadingLawId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{
    currentIndex: number;
    totalLaws: number;
    currentTitle: string;
    chunkDone: number;
    chunkTotal: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const favoriteItems = useMemo<ResolvedFavoriteLaw[]>(() => {
    const bookmarkIds = Array.isArray(user?.bookmarks) ? user.bookmarks : [];
    if (bookmarkIds.length === 0) return [];

    const lawById = new Map(laws.map((l) => [l.id, l]));
    const emoById = new Map(EMOTIONAL_PSYCHOLOGY_LAWS.map((e) => [e.id, e]));

    const resolved: ResolvedFavoriteLaw[] = [];
    for (const id of bookmarkIds) {
      const stdLaw = lawById.get(id);
      if (stdLaw) {
        resolved.push({
          id: stdLaw.id,
          title: stdLaw.nameZh,
          categoryLabel: stdLaw.categoryZh || '心理学定律',
          segments: buildLawSpeechSegmentsFromLaw(stdLaw),
        });
        continue;
      }
      const emoLaw = emoById.get(id);
      if (emoLaw) {
        resolved.push({
          id: emoLaw.id,
          title: emoLaw.titleZh,
          categoryLabel: emoLaw.sectionTitle || '亲密关系心法',
          segments: [
            { key: 'title', text: emoLaw.titleZh, separator: '。' },
            { key: 'core', text: emoLaw.corePrinciple, separator: '。' },
            { key: 'mechanism', text: emoLaw.deepBreakdown.mechanism, separator: '。' },
            { key: 'case', text: emoLaw.lifeCase.scenario, separator: '。' },
            { key: 'summary', text: emoLaw.practicalTakeaways.summary, separator: '。' },
          ],
        });
      }
    }
    return resolved;
  }, [user?.bookmarks, laws]);

  const refreshCacheState = useCallback(async () => {
    setLoadingStats(true);
    try {
      const stats = await getOfflineCacheStats();
      setTotalCachedBytes(stats.totalBytes);

      const mMap: Record<string, OfflineLawManifest> = {};
      for (const m of stats.manifests) {
        mMap[m.lawId] = m;
      }
      setManifestsByLaw(mMap);

      const readinessEntries = await Promise.all(
        favoriteItems.map(async (item) => {
          const ready = await isLawPreloadedForPreset(item.segments, prefs.voicePreset);
          return [item.id, ready] as const;
        })
      );
      const rMap: Record<string, boolean> = {};
      for (const [id, ready] of readinessEntries) {
        rMap[id] = ready;
      }
      setReadyForPresetMap(rMap);
    } finally {
      setLoadingStats(false);
    }
  }, [favoriteItems, prefs.voicePreset]);

  useEffect(() => {
    void refreshCacheState();
  }, [refreshCacheState]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      abortRef.current?.abort();
    };
  }, []);

  const activePresetLabel =
    VOICE_PRESETS.find((p) => p.id === prefs.voicePreset)?.label || '温婉女声';

  const cachedFavoriteCount = favoriteItems.filter((item) => readyForPresetMap[item.id]).length;
  const uncachedFavoriteItems = favoriteItems.filter((item) => !readyForPresetMap[item.id]);

  const handlePreloadSingle = async (item: ResolvedFavoriteLaw) => {
    if (isBatchDownloading || activeDownloadingLawId) return;
    if (!isOnline) {
      setStatusMessage({
        type: 'error',
        text: '当前处于离线状态，无法下载新音频；已缓存定律可直接点击试听离线播放。',
      });
      return;
    }

    gameAudio.playTap();
    setStatusMessage(null);
    const controller = new AbortController();
    abortRef.current = controller;
    setActiveDownloadingLawId(item.id);
    setBatchProgress({
      currentIndex: 1,
      totalLaws: 1,
      currentTitle: item.title,
      chunkDone: 0,
      chunkTotal: 1,
    });

    const res = await preloadLawAudio({
      lawId: item.id,
      lawTitle: item.title,
      segments: item.segments,
      preset: prefs.voicePreset,
      signal: controller.signal,
      onChunkProgress: (done, total) => {
        setBatchProgress({
          currentIndex: 1,
          totalLaws: 1,
          currentTitle: item.title,
          chunkDone: done,
          chunkTotal: total,
        });
      },
    });

    setActiveDownloadingLawId(null);
    setBatchProgress(null);
    abortRef.current = null;
    await refreshCacheState();

    if (res.ok) {
      gameAudio.playSuccess();
      setStatusMessage({
        type: 'success',
        text: `「${item.title}」已缓存至本机（${formatAudioCacheBytes(res.totalBytes)}），弱网或离线时亦可流畅倾听。`,
      });
    } else if (res.error !== 'aborted') {
      setStatusMessage({
        type: 'error',
        text: res.error || '音频预加载失败，请检查网络连接后重试。',
      });
    }
  };

  const handleBatchPreloadFavorites = async () => {
    if (isBatchDownloading || activeDownloadingLawId) return;
    const targets = uncachedFavoriteItems.length > 0 ? uncachedFavoriteItems : favoriteItems;
    if (targets.length === 0) return;

    if (!isOnline) {
      setStatusMessage({
        type: 'error',
        text: '当前处于离线状态，恢复网络连接后即可预加载收藏定律音频。',
      });
      return;
    }

    gameAudio.playTap();
    setStatusMessage(null);
    const controller = new AbortController();
    abortRef.current = controller;
    setIsBatchDownloading(true);

    let successCount = 0;
    let lastError = '';

    for (let i = 0; i < targets.length; i++) {
      if (controller.signal.aborted) break;
      const item = targets[i];
      setActiveDownloadingLawId(item.id);
      setBatchProgress({
        currentIndex: i + 1,
        totalLaws: targets.length,
        currentTitle: item.title,
        chunkDone: 0,
        chunkTotal: 1,
      });

      const res = await preloadLawAudio({
        lawId: item.id,
        lawTitle: item.title,
        segments: item.segments,
        preset: prefs.voicePreset,
        signal: controller.signal,
        onChunkProgress: (done, total) => {
          setBatchProgress({
            currentIndex: i + 1,
            totalLaws: targets.length,
            currentTitle: item.title,
            chunkDone: done,
            chunkTotal: total,
          });
        },
      });

      if (res.ok) {
        successCount += 1;
      } else if (res.error === 'aborted') {
        break;
      } else {
        lastError = res.error || '部分定律请求失败';
      }
    }

    setIsBatchDownloading(false);
    setActiveDownloadingLawId(null);
    setBatchProgress(null);
    abortRef.current = null;
    await refreshCacheState();

    if (controller.signal.aborted) {
      setStatusMessage({
        type: 'info',
        text: `已暂停预加载，已完成缓存 ${successCount} 条收藏定律。`,
      });
    } else if (successCount === targets.length) {
      gameAudio.playSuccess();
      setStatusMessage({
        type: 'success',
        text: `已成功为「${activePresetLabel}」离线缓存 ${successCount} 条收藏定律，断网或弱网环境下可直接听读。`,
      });
    } else if (successCount > 0) {
      setStatusMessage({
        type: 'info',
        text: `已缓存 ${successCount} / ${targets.length} 条定律；其余项目暂未完成（${lastError}）。`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: lastError || '预加载未完成，请稍后重试。',
      });
    }
  };

  const handleCancelDownload = () => {
    abortRef.current?.abort();
  };

  const handleRemoveSingleCache = async (item: ResolvedFavoriteLaw) => {
    gameAudio.playTap();
    if (globalIsSpeaking && activeLawId === item.id) {
      stopLawSpeech(item.id);
    }
    await removeOfflineLawCache(item.id);
    await refreshCacheState();
    setStatusMessage({
      type: 'info',
      text: `已移除「${item.title}」的本地离线音频缓存。`,
    });
  };

  const handleClearAllCache = async () => {
    gameAudio.playTap();
    if (globalIsSpeaking) {
      stopLawSpeech();
    }
    await clearAllOfflineAudioCache();
    await refreshCacheState();
    setStatusMessage({
      type: 'info',
      text: '已清空本机所有离线语音缓存，释放本地存储空间。',
    });
  };

  const progressPercent = batchProgress
    ? Math.min(
        100,
        Math.round(
          (((batchProgress.currentIndex - 1) +
            batchProgress.chunkDone / Math.max(1, batchProgress.chunkTotal)) /
            Math.max(1, batchProgress.totalLaws)) *
            100
        )
      )
    : 0;

  return (
    <div className="pt-4 border-t border-stone-200/80 space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
            <HardDriveDownload className="w-3.5 h-3.5 text-slate-700" />
            <span>离线语音预加载 · Preload Audio</span>
          </span>
          <div className="flex items-center gap-2 text-[11px] text-stone-500 flex-wrap">
            <span>收藏定律 {favoriteItems.length} 条</span>
            <span aria-hidden="true">·</span>
            <span className="font-numeric tabular-nums">
              已缓存 {cachedFavoriteCount} / {favoriteItems.length}（{activePresetLabel}）
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-numeric tabular-nums">
              本地已用 {loadingStats ? '计算中...' : formatAudioCacheBytes(totalCachedBytes)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isBatchDownloading ? (
            <button
              type="button"
              onClick={handleCancelDownload}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>停止缓存</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBatchPreloadFavorites}
              disabled={favoriteItems.length === 0 || Boolean(activeDownloadingLawId)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                favoriteItems.length === 0 || activeDownloadingLawId
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer shadow-xs'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {uncachedFavoriteItems.length === 0 && favoriteItems.length > 0
                  ? '重新校准全部缓存'
                  : uncachedFavoriteItems.length > 0
                  ? `预加载全部未缓存 (${uncachedFavoriteItems.length})`
                  : '预加载收藏音频'}
              </span>
            </button>
          )}

          {totalCachedBytes > 0 && !isBatchDownloading && (
            <button
              type="button"
              onClick={handleClearAllCache}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空缓存</span>
            </button>
          )}
        </div>
      </div>

      {/* Offline Notice Banner when Disconnected */}
      {!isOnline && (
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
          <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            当前处于离线或无连接状态：下方标记「离线可听」的收藏定律可直接播放本地缓存人声，无需联网。
          </span>
        </div>
      )}

      {/* Active Batch / Single Progress Bar */}
      {batchProgress && (
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-stone-800 flex items-center gap-1.5 truncate">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700 shrink-0" />
              <span className="truncate">
                正在下载至本机：{batchProgress.currentTitle}（{batchProgress.currentIndex}/
                {batchProgress.totalLaws}）
              </span>
            </span>
            <span className="font-numeric tabular-nums font-semibold text-stone-700 shrink-0">
              {progressPercent}%
            </span>
          </div>
          <progress
            value={Math.max(4, progressPercent)}
            max={100}
            aria-label="收藏定律离线音频预加载进度"
            className="w-full h-1.5 rounded-full overflow-hidden appearance-none bg-stone-200 [&::-webkit-progress-bar]:bg-stone-200 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-stone-900 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-200 [&::-moz-progress-bar]:bg-stone-900 [&::-moz-progress-bar]:rounded-full"
          />
        </div>
      )}

      {/* Inline Status Feedback */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : 'bg-stone-100 border-stone-200 text-stone-700'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Bookmarked Favorites List */}
      {favoriteItems.length === 0 ? (
        <div className="p-5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center space-y-1.5">
          <Bookmark className="w-4 h-4 text-stone-400 mx-auto" />
          <p className="text-xs font-medium text-stone-700">暂无已收藏的心理学定律</p>
          <p className="text-[11px] text-stone-500">
            在定律库中点击右上角书签收藏任意定律，即可在此处预加载语音至本地离线收听。
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200/90 bg-[#FAF8F5] divide-y divide-stone-200/70 max-h-72 overflow-y-auto">
          {favoriteItems.map((item) => {
            const isCachedCurrent = Boolean(readyForPresetMap[item.id]);
            const manifest = manifestsByLaw[item.id];
            const isThisDownloading = activeDownloadingLawId === item.id;
            const isThisSpeaking = globalIsSpeaking && activeLawId === item.id;

            return (
              <div
                key={item.id}
                className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-white/70 transition-colors"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-semibold text-stone-900 truncate flex items-center gap-1.5">
                    {isCachedCurrent && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 flex-wrap">
                    <span>{item.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    {isCachedCurrent ? (
                      <span className="text-emerald-700 font-medium">
                        离线可听 ·{' '}
                        {manifest?.totalBytes
                          ? formatAudioCacheBytes(manifest.totalBytes)
                          : '已缓存'}
                      </span>
                    ) : manifest ? (
                      <span>已缓存其他音色 · 可更新为「{activePresetLabel}」</span>
                    ) : (
                      <span>未缓存（仅在线人声或本地合成）</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Direct Audition / Offline Playback Test */}
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      toggleLawSpeech({
                        lawId: item.id,
                        segments: item.segments,
                      });
                    }}
                    title={isThisSpeaking ? '停止播放' : isCachedCurrent ? '播放本地离线音频' : '朗读试听'}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium inline-flex items-center gap-1 border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isThisSpeaking
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {isThisSpeaking ? (
                      <>
                        <Square className="w-2.5 h-2.5 fill-current" />
                        <span>停止</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{isCachedCurrent ? '离线收听' : '试听'}</span>
                      </>
                    )}
                  </button>

                  {/* Preload Single Law */}
                  {!isCachedCurrent && (
                    <button
                      type="button"
                      disabled={isBatchDownloading || Boolean(activeDownloadingLawId)}
                      onClick={() => handlePreloadSingle(item)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium inline-flex items-center gap-1 border transition-colors whitespace-nowrap shrink-0 ${
                        isThisDownloading
                          ? 'bg-stone-200 text-stone-700 border-stone-300 cursor-wait'
                          : isBatchDownloading || activeDownloadingLawId
                          ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                          : 'bg-white hover:bg-stone-900 hover:text-white hover:border-stone-900 text-stone-800 border-stone-200 cursor-pointer'
                      }`}
                    >
                      {isThisDownloading ? (
                        <>
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          <span>缓存中</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-2.5 h-2.5" />
                          <span>缓存</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Remove Single Cached Law */}
                  {(isCachedCurrent || manifest) && !isThisDownloading && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSingleCache(item)}
                      title="移除此定律离线缓存"
                      aria-label={`移除 ${item.title} 的离线音频缓存`}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
