import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  Brain,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gamepad2,
  Heart,
  HeartHandshake,
  Home,
  MessageSquarePlus,
  Network,
  PenLine,
  Pin,
  Play,
  RefreshCw,
  ScrollText,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  AlertCircle,
  Feather,
  X,
} from 'lucide-react';
import type { PsychologyLaw, StructuredLawData } from '../../types';
import { PSYCHOLOGY_GAMES } from '../../data/games';
import { OverlappingStack, OverlappingItem } from '../ui/OverlappingStack';
import { THINKER_ITEMS } from '../ui/OverlappingStackLabModal';
import { SilverSpeechText, LawVoiceToggleSwitch } from '../ui/SilverSpeechText';
import { gameAudio } from '../../utils/gameAudio';
import type { SegmentRange } from '../../utils/lawSpeechEngine';
import {
  AdjacentLawsResult,
  LawBookCodex,
} from '../../utils/lawBookFolioBuilder';
import {
  LawMarginaliaNoteInput,
  LawMarginaliaNoteRecord,
  countMarginaliaForLaw,
  filterMarginaliaForPage,
} from '../../utils/lawMarginaliaHelpers';
import {
  LawMarginaliaUpdatePatch,
  createLawMarginaliaNote,
  deleteLawMarginaliaNote,
  subscribeToLawMarginalia,
  updateLawMarginaliaNote,
} from '../../services/lawMarginaliaService';
import { LawMarginaliaPageOverlay } from './LawMarginaliaPageOverlay';
import {
  LawPageBookmarkRecord,
  MAX_BOOKMARK_NOTE_LENGTH,
  clampLawBookPageIndex,
  computeReadingProgressPercent,
  filterPagePinsForLaw,
  findReadingProgressForLaw,
  getBookPageMeta,
} from '../../utils/lawReadingBookmarkHelpers';
import {
  createPagePinBookmark,
  deleteLawPageBookmark,
  saveReadingProgressBookmark,
  subscribeToAllLawPageBookmarks,
} from '../../services/lawReadingBookmarkService';
import { useReviewSchedule } from '../../context/ReviewScheduleContext';
import {
  classifyReviewDueStatus,
  formatReviewCountdown,
  previewNextIntervals,
} from '../../utils/lawSpacedRepetition';

interface LawBookReaderProps {
  law: PsychologyLaw;
  codex: LawBookCodex;
  adjacent: AdjacentLawsResult;
  relatedLawItems: OverlappingItem[];
  mastery: number;
  bookmarked: boolean;
  structuredLaw: StructuredLawData | null;
  isGeneratingAI: boolean;
  structuredError: string | null;
  activeCaseTab: 'life' | 'workplace' | 'relationship' | 'business';
  setActiveCaseTab: (tab: 'life' | 'workplace' | 'relationship' | 'business') => void;
  selectedGameChoice: 'A' | 'B' | null;
  onSelectGameChoice: (choice: 'A' | 'B') => void;
  activeQuizIdx: number;
  setActiveQuizIdx: React.Dispatch<React.SetStateAction<number>>;
  quizAnswers: Record<number, number>;
  onSelectQuizOption: (idx: number) => void;
  isSpeakingThisLaw: boolean;
  activeCpIndex: number;
  segments: Record<string, SegmentRange | undefined>;
  onToggleAudio: () => void;
  onToggleBookmark: () => void;
  onRefreshAI: () => void;
  onOpenJournal: () => void;
  onOpenAITutor: () => void;
  onSwitchToScrollMode: () => void;
  fontScale: string;
  userId?: string | null;
  initialPageIndex?: number;
}

interface FlipAnimationState {
  direction: 'next' | 'prev';
  fromSpread: number;
  toSpread: number;
}

export const LawBookReader: React.FC<LawBookReaderProps> = ({
  law,
  codex,
  adjacent,
  relatedLawItems,
  mastery,
  bookmarked,
  structuredLaw,
  isGeneratingAI,
  structuredError,
  activeCaseTab,
  setActiveCaseTab,
  selectedGameChoice,
  onSelectGameChoice,
  activeQuizIdx,
  setActiveQuizIdx,
  quizAnswers,
  onSelectQuizOption,
  isSpeakingThisLaw,
  activeCpIndex,
  segments,
  onToggleAudio,
  onToggleBookmark,
  onRefreshAI,
  onOpenJournal,
  onOpenAITutor,
  onSwitchToScrollMode,
  fontScale,
  userId,
  initialPageIndex,
}) => {
  const navigate = useNavigate();

  const resolvedInitialPage =
    typeof initialPageIndex === 'number' ? clampLawBookPageIndex(initialPageIndex) : 0;

  // Desktop uses 6 spreads (0..5), mobile (<1024px) uses 12 single pages (0..11)
  const [spreadIdx, setSpreadIdx] = useState(() => Math.floor(resolvedInitialPage / 2));
  const [mobilePageIdx, setMobilePageIdx] = useState(resolvedInitialPage);
  const [mobileDirection, setMobileDirection] = useState<'next' | 'prev' | null>(null);
  const [flipState, setFlipState] = useState<FlipAnimationState | null>(null);
  const [notesOverlayOpen, setNotesOverlayOpen] = useState(false);
  const [marginaliaNotes, setMarginaliaNotes] = useState<LawMarginaliaNoteRecord[]>([]);
  const [allPageBookmarks, setAllPageBookmarks] = useState<LawPageBookmarkRecord[]>([]);
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState(false);
  const [pinNoteDraft, setPinNoteDraft] = useState('');
  const [pinTargetPageIdx, setPinTargetPageIdx] = useState(resolvedInitialPage);
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);
  const [bookmarkStatusMsg, setBookmarkStatusMsg] = useState<string | null>(null);
  const {
    getScheduleForLaw,
    reviewNowMs,
    submitReview,
  } = useReviewSchedule();
  const lawReviewSchedule = getScheduleForLaw(law.id);
  const flipTimerRef = useRef<number | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const totalSpreads = codex.spreads.length; // 6
  const totalPages = totalSpreads * 2; // 12

  // Subscribe to persistent handwritten marginalia for the active psychology law
  useEffect(() => {
    const unsubscribe = subscribeToLawMarginalia(
      userId,
      law.id,
      (notes) => setMarginaliaNotes(notes)
    );
    return () => unsubscribe();
  }, [userId, law.id]);

  // Subscribe to saved reading progress & pinned page bookmarks
  useEffect(() => {
    const unsubscribe = subscribeToAllLawPageBookmarks(
      userId,
      (records) => setAllPageBookmarks(records)
    );
    return () => unsubscribe();
  }, [userId]);

  // Reset or jump to initialPageIndex when switching law or URL ?page= target
  useEffect(() => {
    if (flipTimerRef.current !== null) {
      window.clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }
    const targetPage =
      typeof initialPageIndex === 'number' ? clampLawBookPageIndex(initialPageIndex) : 0;
    setSpreadIdx(Math.floor(targetPage / 2));
    setMobilePageIdx(targetPage);
    setPinTargetPageIdx(targetPage);
    setMobileDirection(null);
    setFlipState(null);
    setBookmarkPanelOpen(false);
    setBookmarkStatusMsg(null);
  }, [law.id, initialPageIndex]);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current !== null) {
        window.clearTimeout(flipTimerRef.current);
      }
    };
  }, []);

  const triggerDesktopSpreadFlip = useCallback(
    (targetSpread: number) => {
      const clamped = Math.max(0, Math.min(totalSpreads - 1, targetSpread));
      if (clamped === spreadIdx || flipState !== null) return;

      const direction: 'next' | 'prev' = clamped > spreadIdx ? 'next' : 'prev';
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      gameAudio.playPageTurn();
      setMobilePageIdx(clamped * 2);

      if (prefersReducedMotion) {
        setSpreadIdx(clamped);
        return;
      }

      setFlipState({
        direction,
        fromSpread: spreadIdx,
        toSpread: clamped,
      });

      flipTimerRef.current = window.setTimeout(() => {
        setSpreadIdx(clamped);
        setFlipState(null);
        flipTimerRef.current = null;
      }, 540);
    },
    [spreadIdx, flipState, totalSpreads]
  );

  const triggerMobilePageTurn = useCallback(
    (targetPage: number) => {
      const clamped = Math.max(0, Math.min(totalPages - 1, targetPage));
      if (clamped === mobilePageIdx) return;
      const direction: 'next' | 'prev' = clamped > mobilePageIdx ? 'next' : 'prev';
      gameAudio.playPageTurn();
      setMobileDirection(direction);
      setMobilePageIdx(clamped);
      setSpreadIdx(Math.floor(clamped / 2));
    },
    [mobilePageIdx, totalPages]
  );

  const jumpToPage = useCallback(
    (targetPageIndex: number) => {
      const clamped = clampLawBookPageIndex(targetPageIndex);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        triggerMobilePageTurn(clamped);
      } else {
        const targetSpread = Math.floor(clamped / 2);
        if (targetSpread !== spreadIdx) {
          triggerDesktopSpreadFlip(targetSpread);
        } else {
          setMobilePageIdx(clamped);
        }
      }
      setPinTargetPageIdx(clamped);
    },
    [spreadIdx, triggerDesktopSpreadFlip, triggerMobilePageTurn]
  );

  const handleTurnNext = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      if (mobilePageIdx < totalPages - 1) {
        triggerMobilePageTurn(mobilePageIdx + 1);
      }
    } else if (spreadIdx < totalSpreads - 1) {
      triggerDesktopSpreadFlip(spreadIdx + 1);
    }
  }, [mobilePageIdx, totalPages, spreadIdx, totalSpreads, triggerMobilePageTurn, triggerDesktopSpreadFlip]);

  const handleTurnPrev = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      if (mobilePageIdx > 0) {
        triggerMobilePageTurn(mobilePageIdx - 1);
      }
    } else if (spreadIdx > 0) {
      triggerDesktopSpreadFlip(spreadIdx - 1);
    }
  }, [mobilePageIdx, spreadIdx, triggerMobilePageTurn, triggerDesktopSpreadFlip]);

  // Keyboard book navigation (ArrowLeft / ArrowRight / Home / End)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleTurnNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleTurnPrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          triggerMobilePageTurn(0);
        } else {
          triggerDesktopSpreadFlip(0);
        }
      } else if (e.key === 'End') {
        e.preventDefault();
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          triggerMobilePageTurn(totalPages - 1);
        } else {
          triggerDesktopSpreadFlip(totalSpreads - 1);
        }
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setNotesOverlayOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTurnNext, handleTurnPrev, triggerMobilePageTurn, triggerDesktopSpreadFlip, totalPages, totalSpreads]);

  // Touch / Pointer Swipe Support
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'button, a, input, textarea, select, [role="tab"], [data-marginalia-interactive="true"]'
      )
    ) {
      return;
    }
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeStartRef.current) return;
    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;

    if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) {
        handleTurnNext();
      } else {
        handleTurnPrev();
      }
    }
  };

  const currentQuiz = codex.quizList[activeQuizIdx] || codex.quizList[0];
  const selectedQuizOption = quizAnswers[activeQuizIdx];
  const isCurrentQuizAnswered = selectedQuizOption !== undefined;

  const activeSpreadMeta = codex.spreads[spreadIdx] || codex.spreads[0];
  const leftEdgeLayers = Math.max(2, spreadIdx * 2 + 2);
  const rightEdgeLayers = Math.max(2, (totalSpreads - 1 - spreadIdx) * 2 + 2);

  const handleCreateMarginalia = useCallback(
    async (input: Omit<LawMarginaliaNoteInput, 'userId'>) => {
      const created = await createLawMarginaliaNote(userId, input);
      setMarginaliaNotes((prev) => [
        created,
        ...prev.filter((item) => item.id !== created.id),
      ]);
      return created;
    },
    [userId]
  );

  const handleUpdateMarginalia = useCallback(
    async (
      existingNote: LawMarginaliaNoteRecord,
      patch: LawMarginaliaUpdatePatch
    ) => {
      const updated = await updateLawMarginaliaNote(userId, existingNote, patch);
      setMarginaliaNotes((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      return updated;
    },
    [userId]
  );

  const handleDeleteMarginalia = useCallback(
    async (noteId: string) => {
      await deleteLawMarginaliaNote(userId, noteId);
      setMarginaliaNotes((prev) => prev.filter((item) => item.id !== noteId));
    },
    [userId]
  );

  const totalBookMarginaliaCount = countMarginaliaForLaw(marginaliaNotes, law.id);
  const savedProgress = findReadingProgressForLaw(allPageBookmarks, law.id);
  const savedPagePins = filterPagePinsForLaw(allPageBookmarks, law.id);

  const getCurrentActivePageIndex = useCallback((): number => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return mobilePageIdx;
    }
    return spreadIdx * 2;
  }, [mobilePageIdx, spreadIdx]);

  const showTimedStatus = useCallback((msg: string) => {
    setBookmarkStatusMsg(msg);
    window.setTimeout(() => {
      setBookmarkStatusMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  const handleSaveProgressAtPage = useCallback(
    async (pageIndex: number) => {
      if (isSavingBookmark) return;
      const clamped = clampLawBookPageIndex(pageIndex);
      const meta = getBookPageMeta(clamped);
      setIsSavingBookmark(true);
      try {
        const saved = await saveReadingProgressBookmark(userId, {
          lawId: law.id,
          lawNameZh: law.nameZh,
          lawNameEn: law.nameEn,
          categoryZh: law.categoryZh,
          pageIndex: clamped,
          pageTitle: `FOL. ${meta.roman} · ${meta.titleZh}`,
        });
        setAllPageBookmarks((prev) => [
          saved,
          ...prev.filter((item) => item.id !== saved.id),
        ]);
        gameAudio.playSuccess();
        showTimedStatus(`已保存阅读进度：第 ${clamped + 1} / ${totalPages} 页`);
      } catch (err) {
        console.error('Failed to save reading progress:', err);
      } finally {
        setIsSavingBookmark(false);
      }
    },
    [isSavingBookmark, userId, law.id, law.nameZh, law.nameEn, law.categoryZh, totalPages, showTimedStatus]
  );

  const handleToggleSinglePagePin = useCallback(
    async (pageIndex: number, noteText?: string) => {
      if (isSavingBookmark) return;
      const clamped = clampLawBookPageIndex(pageIndex);
      const existingPin = savedPagePins.find((p) => p.pageIndex === clamped);
      setIsSavingBookmark(true);
      try {
        if (existingPin && noteText === undefined) {
          await deleteLawPageBookmark(userId, existingPin.id);
          setAllPageBookmarks((prev) =>
            prev.filter((item) => item.id !== existingPin.id)
          );
          gameAudio.playTap();
          showTimedStatus(`已移除第 ${clamped + 1} 页书签`);
        } else {
          const meta = getBookPageMeta(clamped);
          const created = await createPagePinBookmark(userId, {
            lawId: law.id,
            lawNameZh: law.nameZh,
            lawNameEn: law.nameEn,
            categoryZh: law.categoryZh,
            pageIndex: clamped,
            pageTitle: `FOL. ${meta.roman} · ${meta.titleZh}`,
            note: noteText ?? '',
          });
          setAllPageBookmarks((prev) => [
            created,
            ...prev.filter((item) => item.id !== created.id),
          ]);
          gameAudio.playSuccess();
          setPinNoteDraft('');
          showTimedStatus(`已在第 ${clamped + 1} 页夹入书签`);
        }
      } catch (err) {
        console.error('Failed to toggle page bookmark:', err);
      } finally {
        setIsSavingBookmark(false);
      }
    },
    [isSavingBookmark, savedPagePins, userId, law.id, law.nameZh, law.nameEn, law.categoryZh, showTimedStatus]
  );

  const handleDeleteBookmarkRecord = useCallback(
    async (bookmarkId: string) => {
      try {
        await deleteLawPageBookmark(userId, bookmarkId);
        setAllPageBookmarks((prev) =>
          prev.filter((item) => item.id !== bookmarkId)
        );
        gameAudio.playTap();
      } catch (err) {
        console.error('Failed to delete page bookmark:', err);
      }
    },
    [userId]
  );

  // Renders any single page (0..11) cleanly for stationary spread, mobile leaf, or 3D turning face
  const renderPageContent = (pageIndex: number, isGhostFace = false) => {
    const spreadOfPage = Math.floor(pageIndex / 2);
    const spreadMeta = codex.spreads[spreadOfPage] || codex.spreads[0];
    const isLeftSide = pageIndex % 2 === 0;
    const pageNumber = pageIndex + 1;
    const isPinnedPage =
      !isGhostFace && savedPagePins.some((p) => p.pageIndex === pageIndex);
    const isSavedProgressPage =
      !isGhostFace && savedProgress?.pageIndex === pageIndex;

    const PageHeader = () => (
      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-300/60 text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-[#6E675F]">
        <span className="truncate">
          {isLeftSide
            ? `MINDLABZ 心理典藏 · ${codex.theme.collectionZh}`
            : `FOL. ${spreadMeta.roman} · ${spreadMeta.titleZh}`}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {isSavedProgressPage && (
            <span className="text-[10px] font-semibold text-[#157F5D] tracking-normal normal-case tabular-nums">
              已存进度
            </span>
          )}
          <span className="tabular-nums font-semibold text-[#8E5B13]">
            {codex.volumeNumberLabel}
          </span>
          {!isGhostFace && (
            <button
              type="button"
              onClick={() => handleToggleSinglePagePin(pageIndex)}
              aria-pressed={isPinnedPage}
              aria-label={isPinnedPage ? `取消第 ${pageNumber} 页书签` : `在第 ${pageNumber} 页添加书签`}
              title={isPinnedPage ? `取消第 ${pageNumber} 页书签` : `在第 ${pageNumber} 页夹入书签`}
              className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors cursor-pointer ${
                isPinnedPage
                  ? 'bg-[#961D38]/12 text-[#961D38] border border-[#961D38]/30'
                  : 'text-[#6E675F] hover:text-[#181411] hover:bg-stone-200/70'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isPinnedPage ? 'fill-[#961D38]' : ''}`} />
            </button>
          )}
        </div>
      </div>
    );

    const PageFooter = () => (
      <div className="mt-auto pt-4 border-t border-stone-300/50 flex items-center justify-between text-[11px] font-mono text-[#6E675F]">
        <span className="truncate">
          {isLeftSide ? law.nameZh : law.nameEn}
        </span>
        <span className="tabular-nums font-semibold text-[#2B2520] shrink-0">
          — {pageNumber} / {totalPages} —
        </span>
      </div>
    );

    let body: React.ReactNode = null;

    switch (pageIndex) {
      // ================================================================
      // PAGE 1 (Spread I Left): Engraved Atelier Frontispiece
      // ================================================================
      case 0:
        body = (
          <div className="flex-1 flex flex-col justify-between py-2 space-y-5">
            {/* Top Seal & Metadata */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider border"
                style={{
                  color: codex.theme.inkHighlightHex,
                  borderColor: `${codex.theme.accentHex}45`,
                  backgroundColor: `${codex.theme.accentHex}10`,
                }}
              >
                {codex.theme.sealLabel}
              </span>
              <span className="text-[11px] font-mono text-[#6E675F] tabular-nums">
                {law.categoryZh}心理学 · 证据 {structuredLaw?.evidence_level || law.evidenceLevel || 'A'} · 难度 {structuredLaw?.difficulty || law.difficulty}
              </span>
            </div>

            {/* Center Illuminated Book Title Plate */}
            <div className="my-auto py-4 sm:py-6 border-y border-[#C8933B]/35 space-y-4 text-center relative">
              <div className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#8E5B13]">
                {codex.theme.collectionEn}
              </div>

              {law.chapter && (
                <div className="text-xs font-serif-editorial italic text-[#6E675F]">
                  {law.chapter}
                </div>
              )}

              <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-[2.15rem] font-bold text-[#181411] tracking-tight leading-snug px-2">
                {isGhostFace ? (
                  law.nameZh
                ) : (
                  <SilverSpeechText
                    text={law.nameZh}
                    isSpeaking={isSpeakingThisLaw}
                    activeCpIndex={activeCpIndex}
                    segmentRange={segments.title}
                  />
                )}
              </h1>

              <p className="font-serif-editorial italic text-sm sm:text-base text-[#5E564E] tracking-wide">
                {law.nameEn}
              </p>

              {/* Fine Ornamental Divider */}
              <div className="flex items-center justify-center gap-3 pt-1" aria-hidden="true">
                <span className="w-10 h-px bg-[#C8933B]/45" />
                <span className="w-1.5 h-1.5 rotate-45 border border-[#C8933B]" />
                <span className="w-10 h-px bg-[#C8933B]/45" />
              </div>

              {/* Special Archival Sub-tags (Love Codex / Microexpression / Domain) */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#5E564E]">
                {law.isLoveCodex && law.subTag && (
                  <span className="font-medium text-[#961D38]">
                    爱情密码 · {law.subTag}
                  </span>
                )}
                {law.assignedCityZh && (
                  <span className="font-medium text-[#8E5B13]">
                    · 驻守首都 {law.assignedCityZh}
                  </span>
                )}
                {law.isMicroexpression && (
                  <span className="font-medium text-[#4338A6] tabular-nums">
                    {law.categoryZh}第 {law.categoryRank || 1} 名 · 微表情总榜 #{law.microGlobalRank || 1}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Colophon & Mastery Gauge */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6E675F]">
                  心智内化度 · 研习奖励{' '}
                  <strong className="font-numeric text-[#181411]">
                    +{structuredLaw?.xp || law.xpReward || 20} XP
                  </strong>
                </span>
                <span className="font-numeric font-bold text-[#181411] tabular-nums">
                  {mastery}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#EAE3D5] rounded-full overflow-hidden border border-stone-300/50">
                <div
                  className="h-full chameleon-bar rounded-full transition-all duration-300"
                  style={{ width: `${mastery}%` }}
                />
              </div>
              {!isGhostFace && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#6E675F]">
                    右页阅读精义，或点击右下角翻页 ›
                  </span>
                  <LawVoiceToggleSwitch
                    isOn={isSpeakingThisLaw}
                    onToggle={onToggleAudio}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </div>
        );
        break;

      // ================================================================
      // PAGE 2 (Spread I Right): Illuminated Definition & Key Marginalia
      // ================================================================
      case 1:
        body = (
          <div className="flex-1 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <span className="editorial-kicker text-[10px] text-[#8E5B13] block mb-1">
                  Prologue · 核心定律精义
                </span>
                <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411]">
                  卷首释义与本质法则
                </h2>
              </div>

              {/* Illuminated Quote Slate */}
              <div className="bg-white/75 border border-[#C8933B]/35 border-l-[3px] border-l-[#C8933B] p-5 rounded-r-xl shadow-2xs">
                <p className="book-drop-cap font-serif-editorial text-base sm:text-lg text-[#1F1A16] leading-loose">
                  {isGhostFace ? (
                    codex.displayDefinition
                  ) : (
                    <SilverSpeechText
                      text={codex.displayDefinition}
                      isSpeaking={isSpeakingThisLaw}
                      activeCpIndex={activeCpIndex}
                      segmentRange={segments.definition}
                    />
                  )}
                </p>
              </div>

              {/* Marginalia Note: Key Takeaway */}
              <div className="p-4 rounded-xl bg-[#FAF4E8] border border-stone-300/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8E5B13]">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>卷首批注 · 一句话醒世洞见</span>
                </div>
                <p className="text-sm text-[#2B2520] leading-relaxed font-medium">
                  {codex.keyTakeaway}
                </p>
              </div>
            </div>

            {/* Scientific/Ethical Seal Notice if present */}
            {codex.boundaryNotice && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  codex.boundaryNotice.tone === 'rose'
                    ? 'bg-rose-50/80 border-rose-200/80 text-rose-950'
                    : codex.boundaryNotice.tone === 'indigo'
                    ? 'bg-indigo-50/80 border-indigo-200/80 text-indigo-950'
                    : 'bg-amber-50/80 border-amber-200/80 text-amber-950'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{codex.boundaryNotice.title}</span>
                </div>
                <p className="leading-relaxed opacity-90">{codex.boundaryNotice.body}</p>
              </div>
            )}
          </div>
        );
        break;

      // ================================================================
      // PAGE 3 (Spread II Left): Cognitive & Neural Mechanism
      // ================================================================
      case 2:
        body = (
          <div className="flex-1 flex flex-col space-y-5">
            <div>
              <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
                Chapter I · Cognitive &amp; Neural Mechanism
              </span>
              <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#8E5B13] shrink-0" aria-hidden="true" />
                <span>认知科学底层机制与神经根基</span>
              </h2>
            </div>

            <div className="text-sm sm:text-base text-[#25201B] leading-[1.95] tracking-normal">
              <p className="book-drop-cap">
                {isGhostFace ? (
                  codex.displayMechanism
                ) : (
                  <SilverSpeechText
                    text={codex.displayMechanism}
                    isSpeaking={isSpeakingThisLaw}
                    activeCpIndex={activeCpIndex}
                    segmentRange={segments.mechanism}
                  />
                )}
              </p>
            </div>

            {law.whyItHappens &&
              !codex.displayMechanism.includes(law.whyItHappens.slice(0, 20)) && (
                <div className="p-4 rounded-xl bg-white/75 border border-stone-300/60 space-y-1.5">
                  <span className="text-xs font-bold text-[#181411]">
                    深层心理成因（Why It Happens）
                  </span>
                  <p className="text-xs sm:text-sm text-[#3F3831] leading-relaxed">
                    {law.whyItHappens}
                  </p>
                </div>
              )}
          </div>
        );
        break;

      // ================================================================
      // PAGE 4 (Spread II Right): Empirical Archive, Signs & Domain Roots
      // ================================================================
      case 3:
        body = (
          <div className="flex-1 flex flex-col space-y-4">
            <div>
              <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
                Chapter II · Empirical Archive &amp; Boundaries
              </span>
              <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411]">
                实证脉络、可观测线索与科学边界
              </h2>
            </div>

            {codex.domainDeepNotes.length > 0 ? (
              <div className="space-y-3">
                {codex.domainDeepNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/80 border border-stone-300/60 space-y-1"
                  >
                    <div className="text-xs font-bold text-[#8E5B13]">
                      {note.label}
                    </div>
                    <p className="text-xs sm:text-sm text-[#2B2520] leading-relaxed">
                      {note.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/80 border border-stone-300/60 space-y-1.5">
                  <div className="text-xs font-bold text-[#8E5B13]">
                    系统 1 直觉与系统 2 理性对照
                  </div>
                  <p className="text-xs sm:text-sm text-[#2B2520] leading-relaxed">
                    在时间压力或情绪唤醒状态下，大脑优先启用高效率但易偏差的自动启发式反应；当引入延迟判断与外部基准事实时，前额叶控制网络能有效校准这一效应。
                  </p>
                </div>
                {law.experimentSetup?.insight && (
                  <div className="p-4 rounded-xl bg-[#FAF4E8] border border-[#C8933B]/30 space-y-1.5">
                    <div className="text-xs font-bold text-[#181411]">
                      经典实证统计洞察
                    </div>
                    <p className="text-xs sm:text-sm text-[#2B2520] leading-relaxed">
                      {law.experimentSetup.insight}
                    </p>
                  </div>
                )}
              </div>
            )}

            {codex.boundaryNotice && (
              <div className="p-3.5 rounded-xl bg-stone-100/80 border border-stone-300/70 space-y-1 text-xs text-[#3F3831]">
                <div className="font-bold text-[#181411]">
                  {codex.boundaryNotice.title}
                </div>
                <p className="leading-relaxed">
                  {codex.boundaryNotice.detail || codex.boundaryNotice.body}
                </p>
              </div>
            )}
          </div>
        );
        break;

      // ================================================================
      // PAGE 5 (Spread III Left): Real Life & Story / Relationship Cases
      // ================================================================
      case 4:
        body = (
          <div className="flex-1 flex flex-col space-y-4">
            <div>
              <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
                Chapter III · Lived Scenarios (Part A)
              </span>
              <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] flex items-center gap-2">
                <Home className="w-4 h-4 text-[#8E5B13] shrink-0" aria-hidden="true" />
                <span>日常写照与亲密关系实案</span>
              </h2>
            </div>

            {law.storyScenario ? (
              <div className="p-4 rounded-xl bg-white/85 border border-[#C8933B]/35 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#8E5B13]">
                    沉浸式实案 · {law.storyScenario.title}
                  </span>
                  <span className="text-[#6E675F]">{law.storyScenario.setting}</span>
                </div>
                <p className="text-xs sm:text-sm text-[#2B2520] leading-relaxed">
                  {law.storyScenario.narrative}
                </p>
                <p className="text-xs text-[#4338A6] bg-indigo-50/70 p-2.5 rounded-lg leading-relaxed">
                  <strong>解码拆解：</strong>
                  {law.storyScenario.decodingBreakdown}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/85 border border-stone-300/60 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8E5B13]">
                  <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>日常生活映射（Daily Life）</span>
                </div>
                <p className="text-sm text-[#2B2520] leading-relaxed">
                  {codex.cases.life}
                </p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-[#FAF4E8] border border-stone-300/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#961D38]">
                <HeartHandshake className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>亲密与人际关系（Relationships）</span>
              </div>
              <p className="text-sm text-[#2B2520] leading-relaxed">
                {codex.cases.relationship}
              </p>
            </div>
          </div>
        );
        break;

      // ================================================================
      // PAGE 6 (Spread III Right): Workplace, Business & Interactive Case Reader
      // ================================================================
      case 5:
        body = (
          <div className="flex-1 flex flex-col space-y-4">
            <div>
              <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
                Chapter IV · Lived Scenarios (Part B)
              </span>
              <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#4338A6] shrink-0" aria-hidden="true" />
                <span>职场协作与商业博弈实证</span>
              </h2>
            </div>

            <div className="p-4 rounded-xl bg-white/85 border border-stone-300/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#4338A6]">
                <Briefcase className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>职场决策与协作（Workplace）</span>
              </div>
              <p className="text-sm text-[#2B2520] leading-relaxed">
                {codex.cases.workplace}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/85 border border-stone-300/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#157F5D]">
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>商业洞察与消费心理（Business）</span>
              </div>
              <p className="text-sm text-[#2B2520] leading-relaxed">
                {codex.cases.business}
              </p>
            </div>

            {/* Interactive Voice Sync Tab Switcher */}
            {!isGhostFace && (
              <div className="pt-2 border-t border-stone-300/60 space-y-2">
                <div className="text-[11px] font-mono text-[#6E675F]">
                  语音朗读焦点场景切换：
                </div>
                <div className="grid grid-cols-4 gap-1.5" role="tablist" aria-label="案例语音同步切换">
                  {[
                    { key: 'life', label: '日常' },
                    { key: 'workplace', label: '职场' },
                    { key: 'relationship', label: '关系' },
                    { key: 'business', label: '商业' },
                  ].map((tab) => {
                    const active = activeCaseTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveCaseTab(tab.key as any)}
                        className={`min-h-[36px] px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#181411] text-[#FAF8F5]'
                            : 'bg-white/80 border border-stone-300/70 text-[#57514A] hover:text-[#181411]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
        break;

      // ================================================================
      // PAGE 7 (Spread IV Left): Three Recognition Signals
      // ================================================================
      case 6:
        body = (
          <div className="flex-1 flex flex-col space-y-4">
            <div>
              <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
                Chapter V · Recognition Ledger
              </span>
              <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#4338A6] shrink-0" aria-hidden="true" />
                <span>三大触发识别信号</span>
              </h2>
            </div>

            <p className="text-xs text-[#6E675F] leading-relaxed">
              当下列认知与情绪特征在你的日常思考或互动中悄然浮现时，即意味着【{law.nameZh}】正在被激活：
            </p>

            <ul className="space-y-3">
              {codex.recognitionSignals.map((sig, idx) => (
                <li
                  key={idx}
                  className="p-4 rounded-xl bg-white/85 border border-stone-300/65 text-sm text-[#2B2520] leading-relaxed flex items-start gap-3"
                >
                  <span className="font-mono text-xs font-bold text-[#8E5B13] shrink-0 mt-0.5 tabular-nums">
                    0{idx + 1}
                  </span>
                  <span>{sig}</span>
                </li>
              ))}
            </ul>
          </div>
        );
        break;

      // ================================================================
      // PAGE 8 (Spread IV Right): Anti-Manipulation & Journal Reflection
      // ================================================================
      case 7:
        body = (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
                  Chapter VI · Countermeasures &amp; Reflection
                </span>
                <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#157F5D] shrink-0" aria-hidden="true" />
                  <span>反操控与破局防御策略</span>
                </h2>
              </div>

              <ul className="space-y-3">
                {codex.antiManipulation.map((defense, idx) => (
                  <li
                    key={idx}
                    className="p-4 rounded-xl bg-white/85 border border-stone-300/65 text-sm text-[#2B2520] leading-relaxed flex items-start gap-3"
                  >
                    <span className="text-[#157F5D] font-bold shrink-0 mt-0.5">✓</span>
                    <span>{defense}</span>
                  </li>
                ))}
              </ul>
            </div>

            {!isGhostFace && (
              <div className="p-4 rounded-xl bg-[#FAF4E8] border border-[#C8933B]/35 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#181411]">
                    写一则关于本定律的心智觉察手记
                  </div>
                  <div className="text-[11px] text-[#6E675F]">
                    将今日阅读体悟记录归档 (+50 XP)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenJournal}
                  className="luxury-dark-btn min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <PenLine className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>记录手记</span>
                </button>
              </div>
            )}
          </div>
        );
        break;

      // ================================================================
      // PAGE 9 (Spread V Left): Dialectical Decision Mini-Lab
      // ================================================================
      case 8:
        body = (
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
                  Chapter VII · Dialectical Lab
                </span>
                <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-[#5B45B8] shrink-0" aria-hidden="true" />
                  <span>{codex.game.title}</span>
                </h2>
              </div>
              <span className="luxury-badge-ink font-numeric text-xs font-semibold text-[#8E5B13] shrink-0">
                +30 XP
              </span>
            </div>

            <div className="bg-white/85 p-4 rounded-xl border border-stone-300/70 text-sm text-[#181411] leading-relaxed font-medium">
              {codex.game.scenario}
            </div>

            <div className="space-y-2.5">
              {(['A', 'B'] as const).map((choiceKey) => {
                const optionText =
                  choiceKey === 'A' ? codex.game.option_a : codex.game.option_b;
                const isSelected = selectedGameChoice === choiceKey;
                const isRational =
                  choiceKey === (codex.game.rational_choice || 'B').toUpperCase();

                return (
                  <button
                    key={choiceKey}
                    type="button"
                    disabled={isGhostFace || selectedGameChoice !== null}
                    onClick={() => onSelectGameChoice(choiceKey)}
                    aria-pressed={isSelected}
                    className={`w-full min-h-[54px] p-3.5 rounded-xl border-2 text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:cursor-default ${
                      selectedGameChoice === null
                        ? 'bg-white hover:bg-[#FAF7F1] border-stone-300/80 hover:border-[#D4A656] text-[#181411]'
                        : isRational
                        ? 'bg-[#EEF7F3] border-[#157F5D]/60 text-[#0F5C43]'
                        : isSelected
                        ? 'bg-[#FAF4E6] border-[#C8933B]/60 text-[#7A5011]'
                        : 'bg-stone-100/70 border-stone-200 text-[#6E675F]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-[#181411]">
                        选项 {choiceKey}
                      </span>
                      {selectedGameChoice !== null && isRational && (
                        <span className="text-[11px] font-semibold text-[#157F5D]">
                          系统 2 理性解
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed">{optionText}</p>
                  </button>
                );
              })}
            </div>

            {selectedGameChoice && (
              <div
                role="status"
                className="p-3.5 rounded-xl bg-[#FAF4E8] border border-[#D4A656]/40 text-xs sm:text-sm text-[#2B2520] leading-relaxed animate-fadeIn"
              >
                <strong className="block mb-1 text-[#181411]">实验洞察：</strong>
                {codex.game.insight}
              </div>
            )}
          </div>
        );
        break;

      // ================================================================
      // PAGE 10 (Spread V Right): Structured Dialectic Quiz
      // ================================================================
      case 9:
        body = (
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
                  Chapter VIII · Dialectic Quiz
                </span>
                <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411]">
                  定律思辨自测（{activeQuizIdx + 1} / {codex.quizList.length}）
                </h2>
              </div>

              {!isGhostFace && codex.quizList.length > 1 && (
                <div className="flex items-center gap-1.5 font-numeric">
                  {codex.quizList.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveQuizIdx(idx)}
                      aria-label={`切换至第 ${idx + 1} 题`}
                      className={`min-w-[34px] min-h-[34px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        activeQuizIdx === idx
                          ? 'bg-[#181411] text-white'
                          : quizAnswers[idx] !== undefined
                          ? 'bg-[#EEF7F3] text-[#157F5D] border border-[#157F5D]/30'
                          : 'bg-white border border-stone-300/80 text-[#57514A]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="font-serif-editorial text-sm sm:text-base font-bold text-[#181411] leading-relaxed">
              {currentQuiz.question}
            </p>

            <div className="space-y-2">
              {currentQuiz.options.map((ans, idx) => {
                const isSelected = selectedQuizOption === idx;
                const isCorrect = idx === currentQuiz.answer_index;
                const showSuccess = isCurrentQuizAnswered && isCorrect;
                const showWrong = isCurrentQuizAnswered && isSelected && !isCorrect;
                const letter = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isGhostFace || isCurrentQuizAnswered}
                    onClick={() => onSelectQuizOption(idx)}
                    aria-pressed={isSelected}
                    className={`w-full min-h-[44px] text-left p-3 rounded-xl text-xs sm:text-sm font-medium leading-relaxed border transition-all flex items-center justify-between gap-2.5 cursor-pointer disabled:cursor-default ${
                      showSuccess
                        ? 'bg-[#EEF7F3] border-[#157F5D]/60 text-[#0F5C43]'
                        : showWrong
                        ? 'bg-[#FDF4F6] border-[#A82442]/50 text-[#961D38]'
                        : 'bg-white/90 hover:bg-[#FAF7F1] border-stone-300/75 hover:border-[#D4A656] text-[#181411]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                          showSuccess
                            ? 'bg-[#157F5D] text-white'
                            : showWrong
                            ? 'bg-[#A82442] text-white'
                            : 'bg-[#EFE8D9] text-[#2B2520]'
                        }`}
                      >
                        {letter}
                      </span>
                      <span>{ans}</span>
                    </div>
                    {showSuccess && (
                      <CheckCircle2 className="w-4 h-4 text-[#157F5D] shrink-0" aria-hidden="true" />
                    )}
                    {showWrong && (
                      <AlertCircle className="w-4 h-4 text-[#A82442] shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            {isCurrentQuizAnswered && (
              <div
                role="status"
                className="p-3.5 bg-[#FAF4E8] border border-stone-300/70 rounded-xl text-xs text-[#2B2520] space-y-2 animate-fadeIn"
              >
                <p className="leading-relaxed">
                  <strong className="text-[#181411]">解析：</strong>
                  {currentQuiz.explanation}
                </p>
                {!isGhostFace && activeQuizIdx < codex.quizList.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveQuizIdx((prev) => prev + 1)}
                    className="luxury-dark-btn px-3.5 py-1.5 rounded-lg font-semibold text-xs cursor-pointer"
                  >
                    下一题 ({activeQuizIdx + 2}/{codex.quizList.length}) →
                  </button>
                )}
              </div>
            )}
          </div>
        );
        break;

      // ================================================================
      // PAGE 11 (Spread VI Left): Related Laws & Thinkers Constellation
      // ================================================================
      case 10:
        body = (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
                  Appendix I · Constellation &amp; Thinkers
                </span>
                <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411]">
                  同领域关联思维模型与思辨巨擘
                </h2>
                <p className="text-xs text-[#6E675F] mt-1">
                  点击叠放卡片依次散开，可随时翻阅同主题关联定律书籍。
                </p>
              </div>

              {!isGhostFace && (
                <OverlappingStack
                  items={relatedLawItems.length >= 4 ? relatedLawItems : THINKER_ITEMS}
                  maxVisible={4}
                  overlapRatio={1 / 3}
                  size="md"
                  layout="wrap"
                  staggerMs={40}
                  showToggleHint={true}
                />
              )}
            </div>

            {!isGhostFace && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/knowledge-graph?focus=${encodeURIComponent(law.id)}`)
                }
                className="luxury-surface-btn min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Network className="w-4 h-4 text-[#A66C1E]" aria-hidden="true" />
                <span>在 3D / D3 知识图谱中定位本定律</span>
              </button>
            )}
          </div>
        );
        break;

      // ================================================================
      // PAGE 12 (Spread VI Right): Colophon, AI Mentor, Arena & Next Book
      // ================================================================
      default:
        body = (
          <div className="flex-1 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
                  Colophon · 研习深化与下一章导引
                </span>
                <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411]">
                  合卷沉思 · 实境推演与续读
                </h2>
              </div>

              {!isGhostFace && (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={onOpenAITutor}
                    className="luxury-surface-btn w-full min-h-[46px] px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquarePlus className="w-4 h-4 text-[#4338A6]" aria-hidden="true" />
                      <span>向 AI 认知导师咨询本定律深度案例</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#6E675F]" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/game/${law.relatedGame}`)}
                    className="chameleon-btn w-full min-h-[46px] px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      <span>进入认知竞技场实战演练</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  {law.dispatchedGames && law.dispatchedGames.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {law.dispatchedGames.map((gid) => {
                        const g = PSYCHOLOGY_GAMES.find((item) => item.id === gid);
                        if (!g) return null;
                        return (
                          <button
                            key={gid}
                            type="button"
                            onClick={() => navigate(`/game/${gid}`)}
                            className="px-3 py-1.5 rounded-lg bg-[#181411] hover:bg-stone-800 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Gamepad2 className="w-3 h-3 text-amber-400" aria-hidden="true" />
                            <span>{g.nameZh}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Spaced Repetition Review Schedule Status for Favorited Law */}
              {!isGhostFace && bookmarked && lawReviewSchedule && (
                <div className="p-3.5 rounded-xl bg-white/85 border border-[#C8933B]/35 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#181411] inline-flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-[#8E5B13]" aria-hidden="true" />
                      <span>SM-2 间隔巩固排期</span>
                    </span>
                    <span
                      className={`font-mono text-[11px] font-semibold tabular-nums ${
                        classifyReviewDueStatus(lawReviewSchedule, reviewNowMs) === 'due'
                          ? 'text-[#961D38]'
                          : 'text-[#157F5D]'
                      }`}
                    >
                      {formatReviewCountdown(lawReviewSchedule.nextReviewAtMs, reviewNowMs)} · 第{' '}
                      {lawReviewSchedule.repetitions} 轮
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {previewNextIntervals(lawReviewSchedule, reviewNowMs).map((opt) => (
                      <button
                        key={opt.rating}
                        type="button"
                        onClick={() => {
                          void submitReview(law.id, opt.rating).then((updated) => {
                            if (updated) {
                              showTimedStatus(
                                `已记录《${law.nameZh}》间隔复习 · 下次：${formatReviewCountdown(updated.nextReviewAtMs, Date.now())}`
                              );
                            }
                          });
                        }}
                        className="px-2 py-1.5 rounded-lg bg-[#FAF7F1] border border-stone-200 hover:border-[#8E5B13] text-[11px] font-semibold text-[#181411] cursor-pointer text-center tabular-nums"
                      >
                        {opt.labelZh} · {opt.intervalLabel}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Continue to Next / Previous Law Book Volume */}
            {!isGhostFace && (adjacent.prevLaw || adjacent.nextLaw) && (
              <div className="p-4 rounded-xl bg-[#FAF4E8] border border-[#C8933B]/40 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#8E5B13]">
                  <span>继续翻阅全库典藏</span>
                  <span className="tabular-nums">
                    第 {adjacent.currentIndex + 1} / {adjacent.totalCount} 部
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {adjacent.prevLaw && (
                    <button
                      type="button"
                      onClick={() => navigate(`/law/${adjacent.prevLaw!.id}`)}
                      className="p-2.5 rounded-lg bg-white border border-stone-300/70 hover:border-[#C8933B] text-left cursor-pointer transition-colors"
                    >
                      <div className="text-[10px] font-mono text-[#6E675F]">
                        ‹ 上一部定律
                      </div>
                      <div className="text-xs font-bold text-[#181411] truncate mt-0.5">
                        {adjacent.prevLaw.nameZh}
                      </div>
                    </button>
                  )}
                  {adjacent.nextLaw && (
                    <button
                      type="button"
                      onClick={() => navigate(`/law/${adjacent.nextLaw!.id}`)}
                      className="p-2.5 rounded-lg bg-[#181411] hover:bg-stone-800 text-white text-left cursor-pointer transition-colors"
                    >
                      <div className="text-[10px] font-mono text-[#D4A656]">
                        下一部定律 ›
                      </div>
                      <div className="text-xs font-bold truncate mt-0.5">
                        {adjacent.nextLaw.nameZh}
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
        break;
    }

    const pageMarginalia = isGhostFace
      ? []
      : filterMarginaliaForPage(marginaliaNotes, law.id, pageIndex);

    return (
      <div className="relative h-full flex flex-col justify-between p-5 sm:p-7 lg:p-8 select-text">
        <PageHeader />
        <div className="flex-1 flex flex-col min-h-[380px] sm:min-h-[430px]">{body}</div>
        <PageFooter />
        {!isGhostFace && (
          <LawMarginaliaPageOverlay
            lawId={law.id}
            pageIndex={pageIndex}
            pageTitle={spreadMeta.titleZh}
            notesOverlayOpen={notesOverlayOpen}
            notes={pageMarginalia}
            onToggleOverlay={() => setNotesOverlayOpen((prev) => !prev)}
            onCreateNote={handleCreateMarginalia}
            onUpdateNote={handleUpdateMarginalia}
            onDeleteNote={handleDeleteMarginalia}
          />
        )}
      </div>
    );
  };

  // Determine which spread pages sit underneath during a 3D flip vs idle
  const baseLeftPageIdx =
    flipState === null
      ? spreadIdx * 2
      : flipState.direction === 'next'
      ? flipState.fromSpread * 2
      : flipState.toSpread * 2;

  const baseRightPageIdx =
    flipState === null
      ? spreadIdx * 2 + 1
      : flipState.direction === 'next'
      ? flipState.toSpread * 2 + 1
      : flipState.fromSpread * 2 + 1;

  const canGoPrevDesktop = spreadIdx > 0;
  const canGoNextDesktop = spreadIdx < totalSpreads - 1;
  const canGoPrevMobile = mobilePageIdx > 0;
  const canGoNextMobile = mobilePageIdx < totalPages - 1;

  return (
    <div
      className={`space-y-5 pb-12 mx-auto animate-fadeIn quiz-font-scope ${
        fontScale === 'xlarge' ? 'max-w-6xl' : 'max-w-5xl'
      }`}
      data-quiz-font-scale={fontScale}
    >
      {/* 1. Atelier Top Reading Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-300/70">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/learn')}
            className="luxury-surface-btn min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>返回定律藏书阁</span>
          </button>

          {adjacent.currentIndex >= 0 && (
            <div className="hidden sm:inline-flex items-center gap-1 text-xs font-mono text-[#6E675F] bg-white/75 border border-stone-200/80 rounded-xl px-2.5 py-1">
              <button
                type="button"
                disabled={!adjacent.prevLaw}
                onClick={() => adjacent.prevLaw && navigate(`/law/${adjacent.prevLaw.id}`)}
                className="p-0.5 rounded hover:text-[#181411] disabled:opacity-35 cursor-pointer disabled:cursor-default"
                title={adjacent.prevLaw ? `上一部：${adjacent.prevLaw.nameZh}` : '已是第一部'}
                aria-label="上一部心理学定律"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="tabular-nums px-1 text-[#181411] font-semibold">
                {adjacent.currentIndex + 1} / {adjacent.totalCount}
              </span>
              <button
                type="button"
                disabled={!adjacent.nextLaw}
                onClick={() => adjacent.nextLaw && navigate(`/law/${adjacent.nextLaw.id}`)}
                className="p-0.5 rounded hover:text-[#181411] disabled:opacity-35 cursor-pointer disabled:cursor-default"
                title={adjacent.nextLaw ? `下一部：${adjacent.nextLaw.nameZh}` : '已是最后一部'}
                aria-label="下一部心理学定律"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleSaveProgressAtPage(getCurrentActivePageIndex())}
            disabled={isSavingBookmark}
            className={`min-h-[38px] px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              savedProgress &&
              Math.floor(savedProgress.pageIndex / 2) === spreadIdx
                ? 'luxury-surface-btn border-[#157F5D]/50 bg-[#EEF7F3] text-[#0F5C43]'
                : 'luxury-surface-btn text-[#2B2520]'
            }`}
            title="保存当前阅读进度以便从主页快速续读"
          >
            {savedProgress &&
            Math.floor(savedProgress.pageIndex / 2) === spreadIdx ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-[#157F5D]" aria-hidden="true" />
            ) : (
              <BookmarkPlus className="w-3.5 h-3.5 text-[#8E5B13]" aria-hidden="true" />
            )}
            <span>
              {savedProgress &&
              Math.floor(savedProgress.pageIndex / 2) === spreadIdx
                ? `已存 P.${savedProgress.pageIndex + 1}`
                : '保存进度'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPinTargetPageIdx(getCurrentActivePageIndex());
              setBookmarkPanelOpen((prev) => !prev);
            }}
            aria-expanded={bookmarkPanelOpen}
            aria-label="管理书页书签与阅读进度"
            className={`min-h-[38px] px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              bookmarkPanelOpen
                ? 'luxury-dark-btn'
                : savedPagePins.length > 0 || savedProgress
                ? 'luxury-surface-btn border-[#C8933B]/60 bg-[#FAF4E6] text-[#5C3A16]'
                : 'luxury-surface-btn text-[#2B2520]'
            }`}
            title="查看或添加具体书页书签与阅读进度"
          >
            <Pin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>书页书签</span>
            {savedPagePins.length > 0 && (
              <span className="font-numeric tabular-nums text-[11px] font-bold">
                {savedPagePins.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setNotesOverlayOpen((prev) => !prev)}
            aria-pressed={notesOverlayOpen}
            aria-label={notesOverlayOpen ? '收起书页手写批注覆层' : '开启书页手写批注覆层'}
            className={`min-h-[38px] px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              notesOverlayOpen
                ? 'luxury-dark-btn'
                : totalBookMarginaliaCount > 0
                ? 'luxury-surface-btn border-[#C8933B]/60 bg-[#FAF4E6] text-[#5C3A16]'
                : 'luxury-surface-btn text-[#2B2520]'
            }`}
            title="切换手写 / 听写批注覆层 (快捷键 N)"
          >
            <Feather
              className={`w-3.5 h-3.5 ${
                notesOverlayOpen ? 'text-[#D4A656]' : 'text-[#8E5B13]'
              }`}
              aria-hidden="true"
            />
            <span>{notesOverlayOpen ? '退出批注' : '书页批注'}</span>
            {totalBookMarginaliaCount > 0 && (
              <span
                className={`font-numeric tabular-nums text-[11px] px-1.5 py-0.5 rounded-md ${
                  notesOverlayOpen
                    ? 'bg-white/15 text-[#F6E2B3]'
                    : 'bg-[#8E5B13]/12 text-[#5C3A16]'
                }`}
              >
                {totalBookMarginaliaCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onRefreshAI}
            disabled={isGeneratingAI}
            aria-busy={isGeneratingAI}
            className="luxury-surface-btn min-h-[38px] px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-55 whitespace-nowrap shrink-0"
            title="使用 Gemini 实时深化结构化内容"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{isGeneratingAI ? '解析中...' : '深度解析'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleAudio}
            aria-pressed={isSpeakingThisLaw}
            aria-label={isSpeakingThisLaw ? '停止语音朗读' : '开启语音朗读'}
            className={`min-h-[38px] min-w-[38px] px-2.5 rounded-xl inline-flex items-center justify-center cursor-pointer transition-colors ${
              isSpeakingThisLaw
                ? 'luxury-dark-btn'
                : 'luxury-surface-btn text-[#2B2520]'
            }`}
            title="语音朗读"
          >
            {isSpeakingThisLaw ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleBookmark}
            aria-pressed={bookmarked}
            aria-label={bookmarked ? '取消收藏本定律' : '设为收藏定律'}
            className={`luxury-surface-btn min-h-[38px] px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
              bookmarked
                ? 'border-[#961D38]/40 bg-[#FDF3F5] text-[#961D38]'
                : 'text-[#2B2520]'
            }`}
            title={bookmarked ? '已收藏，可在首页快速访问' : '设为收藏定律以便从首页快速进入'}
          >
            <Heart className={`w-3.5 h-3.5 ${bookmarked ? 'fill-[#961D38] text-[#961D38]' : ''}`} />
            <span className="hidden sm:inline">{bookmarked ? '已收藏' : '收藏定律'}</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToScrollMode}
            className="luxury-surface-btn min-h-[38px] px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            title="切换至经典 3D 视差长卷阅读模式"
          >
            <ScrollText className="w-3.5 h-3.5 text-[#8E5B13]" aria-hidden="true" />
            <span className="hidden sm:inline">长卷模式</span>
          </button>
        </div>
      </div>

      {/* Live Save Confirmation Feedback */}
      {bookmarkStatusMsg && (
        <div
          role="status"
          className="rounded-xl px-4 py-2 bg-[#EEF7F3] border border-[#157F5D]/35 text-xs text-[#0F5C43] font-semibold flex items-center justify-between gap-2 animate-fadeIn"
        >
          <span className="flex items-center gap-1.5">
            <BookmarkCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{bookmarkStatusMsg}</span>
          </span>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="underline font-bold cursor-pointer whitespace-nowrap shrink-0"
          >
            回首页查看 →
          </button>
        </div>
      )}

      {/* Inline Resume Banner when opening at Page 1 with existing reading progress */}
      {initialPageIndex === undefined &&
        savedProgress &&
        savedProgress.pageIndex > 0 &&
        spreadIdx === 0 &&
        mobilePageIdx === 0 && (
          <div className="rounded-2xl px-4 py-3 bg-[#FAF4E8] border border-[#C8933B]/45 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#2B2520] font-numeric tabular-nums">
              <BookmarkCheck className="w-4 h-4 text-[#8E5B13] shrink-0" aria-hidden="true" />
              <span>
                上次阅读进度：<strong className="text-[#181411]">第 {savedProgress.pageIndex + 1} / {totalPages} 页</strong>
                {' · '}
                {savedProgress.pageTitle}
                {' · '}
                {computeReadingProgressPercent(savedProgress.pageIndex)}%
              </span>
            </div>
            <button
              type="button"
              onClick={() => jumpToPage(savedProgress.pageIndex)}
              className="luxury-dark-btn min-h-[34px] px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>续读第 {savedProgress.pageIndex + 1} 页</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

      {/* Reading Progress & Specific Page Bookmarks Manager Panel */}
      {bookmarkPanelOpen && (
        <div
          role="region"
          aria-label="书页书签与阅读进度管理"
          className="rounded-2xl bg-[#FAF7F1] border border-[#C8933B]/45 p-4 sm:p-5 space-y-4 shadow-sm animate-fadeIn"
        >
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-300/60">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#8E5B13]">
                Reading Progress &amp; Page Pins
              </div>
              <h3 className="font-serif-editorial text-sm sm:text-base font-bold text-[#181411]">
                《{law.nameZh}》阅读进度与特定书页书签
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setBookmarkPanelOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6E675F] hover:text-[#181411] hover:bg-stone-200/70 cursor-pointer"
              aria-label="关闭书签管理面板"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Save Reading Progress & Add Page Pin */}
            <div className="space-y-3 bg-white/85 rounded-xl p-3.5 border border-stone-200/80">
              <div className="text-xs font-bold text-[#181411]">
                记录当前书页位置
              </div>

              {/* Page Selector (Desktop Left/Right or Current Page) */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPinTargetPageIdx(spreadIdx * 2)}
                  className={`hidden lg:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                    pinTargetPageIdx === spreadIdx * 2
                      ? 'bg-[#181411] text-[#FAF8F5] border-[#181411]'
                      : 'bg-[#FAF7F1] text-[#2B2520] border-stone-300'
                  }`}
                >
                  左页 P.{spreadIdx * 2 + 1}
                </button>
                <button
                  type="button"
                  onClick={() => setPinTargetPageIdx(spreadIdx * 2 + 1)}
                  className={`hidden lg:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                    pinTargetPageIdx === spreadIdx * 2 + 1
                      ? 'bg-[#181411] text-[#FAF8F5] border-[#181411]'
                      : 'bg-[#FAF7F1] text-[#2B2520] border-stone-300'
                  }`}
                >
                  右页 P.{spreadIdx * 2 + 2}
                </button>
                <span className="lg:hidden text-xs font-mono font-semibold text-[#8E5B13] tabular-nums">
                  当前单页：第 {mobilePageIdx + 1} / {totalPages} 页
                </span>
              </div>

              <input
                type="text"
                value={pinNoteDraft}
                onChange={(e) => setPinNoteDraft(e.target.value.slice(0, MAX_BOOKMARK_NOTE_LENGTH))}
                placeholder="可选备注（如：关键认知机制、防操控重点）..."
                className="w-full px-3 py-2 rounded-lg bg-[#FAF7F1] border border-stone-300 text-xs text-[#181411] placeholder-[#6E675F] focus:outline-none focus:border-[#8E5B13]"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isSavingBookmark}
                  onClick={() =>
                    handleSaveProgressAtPage(
                      typeof window !== 'undefined' && window.innerWidth < 1024
                        ? mobilePageIdx
                        : pinTargetPageIdx
                    )
                  }
                  className="luxury-dark-btn min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-[#D4A656]" />
                  <span>设为阅读进度</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingBookmark}
                  onClick={() =>
                    handleToggleSinglePagePin(
                      typeof window !== 'undefined' && window.innerWidth < 1024
                        ? mobilePageIdx
                        : pinTargetPageIdx,
                      pinNoteDraft
                    )
                  }
                  className="luxury-surface-btn min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Pin className="w-3.5 h-3.5 text-[#961D38]" />
                  <span>在此页夹入书签</span>
                </button>
              </div>
            </div>

            {/* Right Column: Saved Progress + Pinned Pages List */}
            <div className="space-y-2.5 bg-white/85 rounded-xl p-3.5 border border-stone-200/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#181411]">已存书页标记</span>
                <span className="font-numeric tabular-nums text-[#6E675F]">
                  {savedProgress ? '含续读进度 · ' : ''}
                  {savedPagePins.length} 枚书签
                </span>
              </div>

              {!savedProgress && savedPagePins.length === 0 ? (
                <p className="text-xs text-[#6E675F] py-3">
                  暂未保存该定律的书页书签或阅读进度，点击左侧按钮即可保存至云端与首页。
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {savedProgress && (
                    <div className="p-2.5 rounded-lg bg-[#EEF7F3] border border-[#157F5D]/30 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-[#0F5C43] tabular-nums">
                          阅读进度 · 第 {savedProgress.pageIndex + 1} / {totalPages} 页 ({computeReadingProgressPercent(savedProgress.pageIndex)}%)
                        </div>
                        <div className="text-[11px] text-[#3F3831] truncate">
                          {savedProgress.pageTitle}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => jumpToPage(savedProgress.pageIndex)}
                          className="px-2.5 py-1 rounded-md bg-[#0F5C43] text-white font-semibold text-[11px] cursor-pointer whitespace-nowrap"
                        >
                          跳转
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBookmarkRecord(savedProgress.id)}
                          className="p-1 rounded text-[#6E675F] hover:text-[#961D38] cursor-pointer"
                          aria-label="删除阅读进度"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {savedPagePins.map((pin) => (
                    <div
                      key={pin.id}
                      className="p-2.5 rounded-lg bg-[#FAF7F1] border border-stone-200/90 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[#181411] tabular-nums">
                          第 {pin.pageIndex + 1} 页 · {pin.pageTitle}
                        </div>
                        {pin.note && (
                          <div className="text-[11px] text-[#57514A] truncate">
                            {pin.note}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => jumpToPage(pin.pageIndex)}
                          className="px-2.5 py-1 rounded-md bg-[#181411] text-white font-semibold text-[11px] cursor-pointer whitespace-nowrap"
                        >
                          翻至此页
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBookmarkRecord(pin.id)}
                          className="p-1 rounded text-[#6E675F] hover:text-[#961D38] cursor-pointer"
                          aria-label={`删除第 ${pin.pageIndex + 1} 页书签`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {structuredError && (
        <div
          role="alert"
          className="rounded-xl px-4 py-2.5 bg-[#FDF4F6] border border-[#A82442]/25 text-xs text-[#961D38] flex items-center justify-between gap-2"
        >
          <span>{structuredError}</span>
          <button
            type="button"
            onClick={onRefreshAI}
            className="font-bold underline cursor-pointer shrink-0"
          >
            重试
          </button>
        </div>
      )}

      {/* 2. Physical Archival Book Codex Stage */}
      <div
        className="book-stage-perspective"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className="book-codex-binding rounded-[26px] p-2.5 sm:p-4 lg:p-5 relative">
          {/* Silk Bookmark Ribbon at top-right */}
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={bookmarked ? '取消收藏定律' : '收藏本定律以便快速访问'}
            className={`hidden sm:flex absolute right-10 -top-1 z-30 w-8 transition-all duration-300 cursor-pointer items-end justify-center pb-2.5 shadow-md ${
              bookmarked || savedProgress
                ? 'h-16 bg-gradient-to-b from-[#961D38] via-[#B42445] to-[#7D152C] text-[#F6E2B3]'
                : 'h-8 bg-gradient-to-b from-[#3B312A] to-[#261E19] text-stone-300 opacity-80 hover:opacity-100 hover:h-10'
            }`}
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
            }}
            title={
              savedProgress
                ? `已存阅读进度 P.${savedProgress.pageIndex + 1}${bookmarked ? ' · 已收藏定律' : ''}`
                : bookmarked
                ? '已收藏本定律'
                : '点击收藏本定律'
            }
          >
            {savedProgress && (
              <span className="text-[9px] font-mono font-bold tabular-nums leading-none">
                P.{savedProgress.pageIndex + 1}
              </span>
            )}
          </button>

          {/* =========================================================
              DESKTOP 2-PAGE SEWN BOOK SPREAD (lg and up)
             ========================================================= */}
          <div className="hidden lg:flex items-stretch relative">
            {/* Stacked Fore-Edge Pages Depth (Left) */}
            <div
              className="book-fore-edge-left rounded-l-md shrink-0 transition-[width] duration-300"
              style={{ width: `${leftEdgeLayers}px` }}
              aria-hidden="true"
            />

            {/* Main Open Two-Page Spread */}
            <div className="book-paper-deck flex-1 grid grid-cols-2 relative overflow-hidden rounded-lg min-h-[580px]">
              {/* Left Page Base */}
              <div className="book-gutter-left relative flex flex-col">
                {renderPageContent(baseLeftPageIdx, false)}

                {/* Left Curled Corner / Turn Backward Zone */}
                {canGoPrevDesktop && (
                  <button
                    type="button"
                    onClick={handleTurnPrev}
                    aria-label="向前翻一页"
                    title="点击或按 ← 键向前翻页"
                    className="group absolute bottom-0 left-0 w-16 h-16 cursor-pointer z-20 focus-visible:outline-none"
                  >
                    <span
                      className="book-corner-curl-left block w-6 h-6 group-hover:w-10 group-hover:h-10 opacity-75 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>

              {/* Right Page Base */}
              <div className="book-gutter-right relative flex flex-col border-l border-stone-300/40">
                {renderPageContent(baseRightPageIdx, false)}

                {/* Right Curled Corner / Turn Forward Zone */}
                {canGoNextDesktop && (
                  <button
                    type="button"
                    onClick={handleTurnNext}
                    aria-label="向后翻一页"
                    title="点击或按 → 键向后翻页"
                    className="group absolute bottom-0 right-0 w-16 h-16 cursor-pointer z-20 flex items-end justify-end focus-visible:outline-none"
                  >
                    <span
                      className="book-corner-curl-right block w-6 h-6 group-hover:w-10 group-hover:h-10 opacity-75 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>

              {/* Central Sewn Spine Gutter Overlay */}
              <div
                className="book-center-spine-crease pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 z-20"
                aria-hidden="true"
              />

              {/* Articulated 3D Turning Page Leaf Overlay during 540ms flip */}
              {flipState && (
                <div
                  aria-hidden="true"
                  className={`book-flip-leaf pointer-events-none absolute inset-y-0 w-1/2 z-30 ${
                    flipState.direction === 'next'
                      ? 'left-1/2 book-flip-leaf-next'
                      : 'left-0 book-flip-leaf-prev'
                  }`}
                >
                  {/* Front Face of Turning Leaf */}
                  <div
                    className={`book-flip-face absolute inset-0 overflow-hidden ${
                      flipState.direction === 'next'
                        ? 'book-gutter-right'
                        : 'book-gutter-left'
                    }`}
                  >
                    {renderPageContent(
                      flipState.direction === 'next'
                        ? flipState.fromSpread * 2 + 1
                        : flipState.fromSpread * 2,
                      true
                    )}
                  </div>

                  {/* Back Face of Turning Leaf */}
                  <div
                    className={`book-flip-face book-flip-face-back absolute inset-0 overflow-hidden ${
                      flipState.direction === 'next'
                        ? 'book-gutter-left'
                        : 'book-gutter-right'
                    }`}
                  >
                    {renderPageContent(
                      flipState.direction === 'next'
                        ? flipState.toSpread * 2
                        : flipState.toSpread * 2 + 1,
                      true
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stacked Fore-Edge Pages Depth (Right) */}
            <div
              className="book-fore-edge-right rounded-r-md shrink-0 transition-[width] duration-300"
              style={{ width: `${rightEdgeLayers}px` }}
              aria-hidden="true"
            />
          </div>

          {/* =========================================================
              MOBILE & TABLET SINGLE FOLIO LEAF (< 1024px)
             ========================================================= */}
          <div className="lg:hidden relative">
            <div
              key={mobilePageIdx}
              className={`book-paper-deck rounded-xl relative overflow-hidden min-h-[480px] flex flex-col ${
                mobileDirection === 'next'
                  ? 'book-mobile-reveal-next'
                  : mobileDirection === 'prev'
                  ? 'book-mobile-reveal-prev'
                  : ''
              }`}
            >
              {renderPageContent(mobilePageIdx, false)}

              {canGoNextMobile && (
                <button
                  type="button"
                  onClick={handleTurnNext}
                  aria-label="翻至下一页"
                  className="absolute bottom-0 right-0 w-12 h-12 flex items-end justify-end cursor-pointer z-20"
                >
                  <span className="book-corner-curl-right block w-6 h-6" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Book Chapter Index Ribbon & Tactile Page-Turn Bar */}
      <div className="rounded-2xl bg-white/90 border border-stone-200/90 p-3.5 sm:px-5 sm:py-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Previous Button */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <button
            type="button"
            onClick={handleTurnPrev}
            disabled={!canGoPrevMobile}
            className="lg:hidden min-h-[40px] px-3.5 py-2 rounded-xl luxury-surface-btn text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>上一页</span>
          </button>
          <button
            type="button"
            onClick={handleTurnPrev}
            disabled={!canGoPrevDesktop || flipState !== null}
            className="hidden lg:inline-flex min-h-[40px] px-3.5 py-2 rounded-xl luxury-surface-btn text-xs font-semibold items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>翻回上一跨页</span>
          </button>

          <span className="lg:hidden text-xs font-mono tabular-nums text-[#2B2520] font-semibold">
            第 {mobilePageIdx + 1} / {totalPages} 页
          </span>

          <button
            type="button"
            onClick={handleTurnNext}
            disabled={!canGoNextMobile}
            className="lg:hidden min-h-[40px] px-3.5 py-2 rounded-xl luxury-dark-btn text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            <span>下一页</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Spread / Chapter Direct Index Tabs */}
        <nav
          aria-label="书籍章节目录页码"
          className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5"
        >
          {codex.spreads.map((sp) => {
            const isActiveDesktop = spreadIdx === sp.index;
            const isActiveMobile = Math.floor(mobilePageIdx / 2) === sp.index;
            return (
              <button
                key={sp.roman}
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    triggerMobilePageTurn(sp.index * 2);
                  } else {
                    triggerDesktopSpreadFlip(sp.index);
                  }
                }}
                aria-current={isActiveDesktop ? 'page' : undefined}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                  isActiveDesktop || isActiveMobile
                    ? 'bg-[#181411] text-[#FAF8F5] font-semibold'
                    : 'bg-stone-100 text-[#57514A] hover:bg-stone-200 hover:text-[#181411]'
                }`}
              >
                <span className="font-mono text-[#D4A656]">{sp.roman}.</span>
                <span>{sp.titleZh}</span>
              </button>
            );
          })}
        </nav>

        {/* Next Button (Desktop) */}
        <button
          type="button"
          onClick={handleTurnNext}
          disabled={!canGoNextDesktop || flipState !== null}
          className="hidden lg:inline-flex min-h-[40px] px-3.5 py-2 rounded-xl luxury-dark-btn text-xs font-semibold items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          <span>翻阅下一跨页</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Screen-reader live announcement of current book page */}
      <div className="sr-only" aria-live="polite">
        正在阅读《{law.nameZh}》第 {activeSpreadMeta.roman} 卷：{activeSpreadMeta.titleZh}
      </div>
    </div>
  );
};
