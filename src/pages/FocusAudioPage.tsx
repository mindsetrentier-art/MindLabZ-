import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Headphones } from 'lucide-react';
import { CognitiveFocusAudioPlayer } from '../components/audio/CognitiveFocusAudioPlayer';
import { cognitiveFocusAudio, BinauralPresetId, NaturePresetId } from '../utils/cognitiveFocusAudio';
import { gameAudio } from '../utils/gameAudio';

interface CognitiveTaskPairing {
  title: string;
  bandSummary: string;
  rationale: string;
  binauralId: BinauralPresetId;
  natureId: NaturePresetId;
  route: string;
  ctaLabel: string;
}

const COGNITIVE_TASK_PAIRINGS: CognitiveTaskPairing[] = [
  {
    title: '急速认知博弈与工作记忆',
    bandSummary: '40 Hz Gamma · 林间细雨',
    rationale: '高频伽马差频辅助注意力快速绑定，结合宽频雨幕声掩蔽环境突发干扰。',
    binauralId: 'gamma-40',
    natureId: 'canopy-rain',
    route: '/game/brain-rush',
    ctaLabel: '进入极速挑战',
  },
  {
    title: '心理学定律系统精读',
    bandSummary: '14 Hz SMR · 山涧松风',
    rationale: '感觉运动节律 (SMR) 提供平稳无焦虑的阅读警觉度，适合长时间沉浸研习。',
    binauralId: 'smr-14',
    natureId: 'alpine-stream',
    route: '/learn',
    ctaLabel: '前往定律库',
  },
  {
    title: '逻辑证伪与深度推演',
    bandSummary: '18 Hz Mid-Beta · 暖炉棕噪',
    rationale: '中频贝塔节拍支持执行控制与推理判断，暖炉低频棕噪降低长时间听力疲劳。',
    binauralId: 'beta-18',
    natureId: 'night-hearth',
    route: '/game/falsification-challenge',
    ctaLabel: '开启证伪实验',
  },
  {
    title: '联想整合与心智复盘手记',
    bandSummary: '10 Hz Alpha · 深海长潮',
    rationale: '阿尔法节律与 0.09 Hz 海洋潮汐呼吸同频，助力情绪解离与记忆巩固归档。',
    binauralId: 'alpha-10',
    natureId: 'ocean-tide',
    route: '/journal',
    ctaLabel: '打开心智手记',
  },
];

export const FocusAudioPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLaunchPairing = (pairing: CognitiveTaskPairing) => {
    gameAudio.playTap();
    cognitiveFocusAudio.setBinauralPreset(pairing.binauralId);
    cognitiveFocusAudio.setNaturePreset(pairing.natureId);
    cognitiveFocusAudio.play();
    navigate(pairing.route);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-fadeIn">
      {/* Header Lead */}
      <header className="space-y-2 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
          <Headphones className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
          <span>COGNITIVE ACOUSTICS</span>
          <span aria-hidden="true">/</span>
          <span>Binaural Beats &amp; Procedural Nature Synthesis</span>
        </div>
        <h1 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight text-balance">
          专注声学实验室 · 双耳节拍与自然声景
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
          通过左右耳独立声道合成精准双耳差频（4 Hz – 45 Hz），并与实时生成的立体声自然声景自由混音，为高负荷认知训练、定律精读与心智推演构建低干扰专注声场。
        </p>
      </header>

      {/* Full Studio Workstation Component */}
      <CognitiveFocusAudioPlayer variant="studio" />

      {/* Cognitive Task Acoustic Pairing Guide */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900">
            01. 按认知任务一键配置专注声场
          </h2>
          <span className="text-xs text-stone-500 font-mono">
            Apply Preset &amp; Enter Task
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COGNITIVE_TASK_PAIRINGS.map((pairing) => (
            <div
              key={pairing.title}
              className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-sky-700 font-semibold">
                  {pairing.bandSummary}
                </div>
                <h3 className="text-base font-bold text-stone-900 font-serif-editorial">
                  {pairing.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {pairing.rationale}
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleLaunchPairing(pairing)}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>配置音频并{pairing.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
