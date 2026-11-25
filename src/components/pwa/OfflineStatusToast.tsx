import React, { useEffect, useRef, useState } from 'react';
import { WifiOff, Wifi, BookOpenCheck, X } from 'lucide-react';

type ConnectionNoticeMode = 'offline' | 'restored';

const OFFLINE_AUTO_HIDE_MS = 9000;
const RESTORED_AUTO_HIDE_MS = 3400;
const EXIT_ANIMATION_MS = 240;

export const OfflineStatusToast: React.FC = () => {
  const [noticeMode, setNoticeMode] = useState<ConnectionNoticeMode | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const wasOfflineRef = useRef<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  };

  const dismissToast = () => {
    clearTimers();
    setIsExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setNoticeMode(null);
      setIsExiting(false);
    }, EXIT_ANIMATION_MS);
  };

  const scheduleAutoDismiss = (delayMs: number) => {
    clearTimers();
    hideTimerRef.current = setTimeout(() => {
      dismissToast();
    }, delayMs);
  };

  const showNotice = (mode: ConnectionNoticeMode) => {
    clearTimers();
    setIsExiting(false);
    setNoticeMode(mode);
    scheduleAutoDismiss(mode === 'offline' ? OFFLINE_AUTO_HIDE_MS : RESTORED_AUTO_HIDE_MS);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If launched offline, show subtle toast gently once mounted
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      wasOfflineRef.current = true;
      const initTimer = setTimeout(() => {
        showNotice('offline');
      }, 200);
      return () => clearTimeout(initTimer);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      wasOfflineRef.current = true;
      showNotice('offline');
    };

    const handleOnline = () => {
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        showNotice('restored');
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearTimers();
    };
  }, []);

  if (!noticeMode) return null;

  const isOffline = noticeMode === 'offline';

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={clearTimers}
      onMouseLeave={() =>
        scheduleAutoDismiss(isOffline ? OFFLINE_AUTO_HIDE_MS : RESTORED_AUTO_HIDE_MS)
      }
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.75rem)] max-w-md pointer-events-none"
    >
      <div
        className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-stone-900/95 backdrop-blur-xl text-stone-100 border shadow-[0_18px_42px_-12px_rgba(15,23,42,0.55)] px-4 py-3.5 ${
          isOffline ? 'border-amber-400/30' : 'border-emerald-400/35'
        } ${isExiting ? 'animate-daily-push-exit' : 'animate-daily-push-enter'}`}
      >
        {/* Top Metallic Accent Hairline */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] ${
            isOffline
              ? 'bg-gradient-to-r from-amber-400/80 via-slate-300/80 to-transparent'
              : 'bg-gradient-to-r from-emerald-400/85 via-teal-300/75 to-transparent'
          }`}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                isOffline
                  ? 'bg-amber-500/15 border-amber-400/35 text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
              }`}
            >
              {isOffline ? (
                <WifiOff className="w-4 h-4" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold tracking-tight text-white">
                  {isOffline ? '离线模式 · 连接已断开' : '网络已恢复连接'}
                </span>
                {isOffline && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-600/70 text-slate-200">
                    <BookOpenCheck className="w-3 h-3 text-amber-300" />
                    <span>缓存内容仍可阅读</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-stone-300 leading-relaxed">
                {isOffline
                  ? '您当前处于离线状态，已缓存的心理学定律档案与本地语音朗读功能仍可正常阅览与学习。'
                  : '互联网连接已重新建立，学习进度与云端数据同步现已就绪。'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissToast}
            aria-label="关闭网络状态提示"
            className="w-7 h-7 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/90 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
