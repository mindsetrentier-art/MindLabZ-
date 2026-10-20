import React, { useState } from 'react';
import {
  X,
  Layers,
  Sparkles,
  Sliders,
  RotateCcw,
  Users,
  Brain,
  Heart,
  BookOpen,
  Check,
  Play,
} from 'lucide-react';
import {
  OverlappingStack,
  OverlappingItem,
  OverlappingStackSize,
  OverlappingStackLayout,
  OverlappingCardStack,
  OverlappingScenario,
  COURSE_CATEGORIES,
  FAVORITES_COLLECTION,
  VOCABULARY_SET,
  PROFILE_ACHIEVEMENTS,
} from './OverlappingStack';

// Presets for the component showcase
export const THINKER_ITEMS: OverlappingItem[] = [
  {
    id: 'kahneman',
    name: '丹尼尔·卡尼曼',
    subname: '《思考，快与慢》',
    color: 'bg-gradient-to-tr from-amber-600 to-amber-800 text-white',
    badge: '诺奖得主',
    description: '前景理论与认知双系统先驱',
  },
  {
    id: 'tversky',
    name: '阿摩司·特沃斯基',
    subname: '行为决策科学',
    color: 'bg-gradient-to-tr from-blue-600 to-indigo-800 text-white',
    badge: '先驱学者',
    description: '启发式与认知偏差之父',
  },
  {
    id: 'thaler',
    name: '理查德·塞勒',
    subname: '《助推》',
    color: 'bg-gradient-to-tr from-emerald-600 to-teal-800 text-white',
    badge: '行为经济',
    description: '心理账户与禀赋效应提出者',
  },
  {
    id: 'simon',
    name: '赫伯特·西蒙',
    subname: '有限理性理论',
    color: 'bg-gradient-to-tr from-purple-600 to-violet-800 text-white',
    badge: '图灵/诺奖',
    description: '认知心理学与人工智能鼻祖',
  },
  {
    id: 'munger',
    name: '查理·芒格',
    subname: '多元思维模型',
    color: 'bg-gradient-to-tr from-rose-600 to-red-800 text-white',
    badge: '心智格栅',
    description: '心理学与决策智慧集大成者',
  },
  {
    id: 'jung',
    name: '卡尔·荣格',
    subname: '原型心理学',
    color: 'bg-gradient-to-tr from-cyan-600 to-blue-800 text-white',
    badge: '分析学派',
    description: '集体潜意识与共时性理论',
  },
  {
    id: 'frankl',
    name: '维克多·弗兰克尔',
    subname: '《活出意义来》',
    color: 'bg-gradient-to-tr from-stone-600 to-stone-800 text-white',
    badge: '意义疗法',
    description: '极端境遇下的终极心智自由',
  },
  {
    id: 'taleb',
    name: '纳西姆·塔勒布',
    subname: '《反脆弱》',
    color: 'bg-gradient-to-tr from-orange-600 to-amber-800 text-white',
    badge: '不确定性',
    description: '黑天鹅事件与肥尾分布哲学',
  },
];

export const MENTAL_MODEL_ITEMS: OverlappingItem[] = [
  {
    id: 'bias-1',
    name: '确认偏误',
    subname: 'Confirmation Bias',
    color: 'bg-gradient-to-br from-indigo-500 to-blue-700 text-white',
    badge: '高频陷阱',
  },
  {
    id: 'bias-2',
    name: '锚定效应',
    subname: 'Anchoring Effect',
    color: 'bg-gradient-to-br from-violet-500 to-purple-700 text-white',
    badge: '决策偏差',
  },
  {
    id: 'bias-3',
    name: '损失厌恶',
    subname: 'Loss Aversion',
    color: 'bg-gradient-to-br from-rose-500 to-pink-700 text-white',
    badge: '情绪直觉',
  },
  {
    id: 'bias-4',
    name: '峰终定律',
    subname: 'Peak-End Rule',
    color: 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white',
    badge: '记忆规律',
  },
  {
    id: 'bias-5',
    name: '可得性启发',
    subname: 'Availability Bias',
    color: 'bg-gradient-to-br from-teal-500 to-emerald-700 text-white',
    badge: '认知启发',
  },
  {
    id: 'bias-6',
    name: '沉没成本',
    subname: 'Sunk Cost Fallacy',
    color: 'bg-gradient-to-br from-red-500 to-rose-700 text-white',
    badge: '非理性执念',
  },
  {
    id: 'bias-7',
    name: '邓宁-克鲁格',
    subname: 'Dunning-Kruger',
    color: 'bg-gradient-to-br from-cyan-500 to-sky-700 text-white',
    badge: '认知盲区',
  },
];

export const ACTIVE_LEARNER_ITEMS: OverlappingItem[] = [
  {
    id: 'u1',
    name: '林若虚',
    subname: 'Lv.7 认知哲思者',
    color: 'bg-[#6C4CF1] text-white',
    badge: '连续30天',
  },
  {
    id: 'u2',
    name: '苏怀瑾',
    subname: 'Lv.6 系统洞察家',
    color: 'bg-[#059669] text-white',
    badge: '今日已研习',
  },
  {
    id: 'u3',
    name: '陈默之',
    subname: 'Lv.5 批判思辨者',
    color: 'bg-[#D97706] text-white',
    badge: '掌握42定律',
  },
  {
    id: 'u4',
    name: '沈云舟',
    subname: 'Lv.5 心智炼金士',
    color: 'bg-[#DC2626] text-white',
    badge: '手记达人',
  },
  {
    id: 'u5',
    name: '叶知秋',
    subname: 'Lv.4 敏锐观察员',
    color: 'bg-[#0891B2] text-white',
    badge: '新进觉察',
  },
  {
    id: 'u6',
    name: '顾清涟',
    subname: 'Lv.4 觉知行者',
    color: 'bg-[#7C3AED] text-white',
    badge: '今日在线',
  },
];

export const EMOTION_ITEMS: OverlappingItem[] = [
  {
    id: 'e1',
    name: '深度心流',
    subname: 'Deep Flow',
    color: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
    badge: '高能量',
  },
  {
    id: 'e2',
    name: '澄澈平静',
    subname: 'Serenity',
    color: 'bg-gradient-to-r from-teal-400 to-cyan-600 text-white',
    badge: '接纳',
  },
  {
    id: 'e3',
    name: '豁然开朗',
    subname: 'Eureka',
    color: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-900',
    badge: '灵感',
  },
  {
    id: 'e4',
    name: '去中心觉察',
    subname: 'Decentered',
    color: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
    badge: '超然',
  },
  {
    id: 'e5',
    name: '感恩自悯',
    subname: 'Compassion',
    color: 'bg-gradient-to-r from-rose-400 to-red-500 text-white',
    badge: '温柔',
  },
];

interface OverlappingStackLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OverlappingStackLabModal: React.FC<OverlappingStackLabModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [componentMode, setComponentMode] = useState<'card' | 'avatar'>('card');
  const [scenario, setScenario] = useState<OverlappingScenario>('courses');
  const [selectedPreset, setSelectedPreset] = useState<'thinkers' | 'biases' | 'learners' | 'emotions'>('thinkers');
  const [size, setSize] = useState<OverlappingStackSize>('md');
  const [cardSize, setCardSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [overlapRatio, setOverlapRatio] = useState<number>(1 / 3); // 1/3 as strictly required
  const [maxVisible, setMaxVisible] = useState<number>(3); // 3 as strictly required: "收起时显示前三张和 +N 剩余数量"
  const [layout, setLayout] = useState<OverlappingStackLayout>('row');
  const [staggerMs, setStaggerMs] = useState<number>(45);

  if (!isOpen) return null;

  const getItems = () => {
    switch (selectedPreset) {
      case 'thinkers':
        return THINKER_ITEMS;
      case 'biases':
        return MENTAL_MODEL_ITEMS;
      case 'learners':
        return ACTIVE_LEARNER_ITEMS;
      case 'emotions':
        return EMOTION_ITEMS;
    }
  };

  const currentItems = getItems();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#FAF8F5] rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-800 shadow-2xs shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-stone-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif-editorial text-sm sm:text-base md:text-lg font-bold text-stone-900 leading-tight truncate">
                重叠式卡片组件交互调试工坊
              </h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">
                1/3 叠放 · 收起显示前 3 张 + 尾部余量 · 点击展开显示名称 · 再次点击平滑收回
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Component Mode Switcher: Card Stack vs Avatar Stack */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2 sm:p-2.5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-xs font-semibold text-stone-700 pl-1 sm:pl-2">
              组件呈现形态：
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setComponentMode('card')}
                className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center truncate ${
                  componentMode === 'card'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🗂️ 卡片组件 (Card)
              </button>
              <button
                type="button"
                onClick={() => setComponentMode('avatar')}
                className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center truncate ${
                  componentMode === 'avatar'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                👤 头像模式 (Avatar)
              </button>
            </div>
          </div>

          {/* 1. Live Interactive Demonstration */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                <span>实时交互画布（点击任意卡片展开 / 再次点击平滑收回）</span>
              </span>
              <span className="text-[11px] text-stone-500 font-numeric">
                1/3 覆盖 · 折叠收起显示前 3 张 + 余量徽标
              </span>
            </div>

            {/* Overlapping Component Render */}
            <div className="py-2">
              {componentMode === 'card' ? (
                <OverlappingCardStack
                  scenario={scenario}
                  maxVisible={maxVisible}
                  overlapRatio={overlapRatio}
                  size={cardSize}
                  layout={layout}
                  showScenarioTabs={true}
                />
              ) : (
                <OverlappingStack
                  items={currentItems}
                  maxVisible={maxVisible}
                  overlapRatio={overlapRatio}
                  size={size}
                  layout={layout}
                  staggerMs={staggerMs}
                  showToggleHint={true}
                />
              )}
            </div>

            <div className="text-[11px] text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200/80 leading-relaxed">
              💡 <strong>核心规则实现验证：</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 text-stone-600">
                <li>
                  <strong>1/3 重叠：</strong>卡片之间相互覆盖约三分之一（负外边距为卡片宽度的 1/3）。
                </li>
                <li>
                  <strong>收起前三张 + 剩余：</strong>收起时仅显示前三张，末尾显示 <strong>+N 剩余数量</strong> 卡片。
                </li>
                <li>
                  <strong>依次展开显示名称：</strong>点击后卡片以毫秒阶梯依次滑开，显露完整<strong>名称、副标与详情</strong>。
                </li>
                <li>
                  <strong>平滑收回：</strong>再次点击任意卡片或收回按钮，卡片平滑滑回叠放状态。
                </li>
                <li>
                  <strong>四大核心应用场景：</strong>可用于<strong>课程分类、学习收藏、词汇集和个人资料</strong>。
                </li>
              </ul>
            </div>
          </div>

          {/* 2. Controls & Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Presets or Scenarios */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2.5">
              <label className="text-xs font-semibold text-stone-800 block">
                {componentMode === 'card' ? '选择卡片应用场景 (四大多元场景)' : '选择示范数据预设'}
              </label>

              {componentMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'courses', label: '课程分类 (Courses)', count: COURSE_CATEGORIES.length },
                    { key: 'favorites', label: '学习收藏 (Bookmarks)', count: FAVORITES_COLLECTION.length },
                    { key: 'vocabulary', label: '词汇集 (Vocabulary)', count: VOCABULARY_SET.length },
                    { key: 'profile', label: '个人资料 (Profile)', count: PROFILE_ACHIEVEMENTS.length },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setScenario(item.key as any)}
                      className={`py-2 px-2.5 rounded-lg text-left transition-all cursor-pointer font-medium active:scale-95 touch-manipulation ${
                        scenario === item.key
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200/80'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="truncate">{item.label}</span>
                        <span className="text-[10px] opacity-70">({item.count})</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'thinkers', label: '心理学家巨擘', count: THINKER_ITEMS.length },
                    { key: 'biases', label: '核心心智模型', count: MENTAL_MODEL_ITEMS.length },
                    { key: 'learners', label: '今日研习学者', count: ACTIVE_LEARNER_ITEMS.length },
                    { key: 'emotions', label: '觉察情绪光谱', count: EMOTION_ITEMS.length },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSelectedPreset(item.key as any)}
                      className={`py-2 px-2.5 rounded-lg text-left transition-all cursor-pointer font-medium active:scale-95 touch-manipulation ${
                        selectedPreset === item.key
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200/80'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{item.label}</span>
                        <span className="text-[10px] opacity-70">({item.count})</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Size & Layout Controls */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-800">
                    {componentMode === 'card' ? '卡片尺寸规格' : '头像尺寸规格'}
                  </span>
                  <span className="text-stone-400 font-mono text-[11px]">
                    {componentMode === 'card' ? cardSize.toUpperCase() : size.toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {componentMode === 'card'
                    ? (['sm', 'md', 'lg'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setCardSize(s)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            cardSize === s
                              ? 'bg-stone-900 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {s.toUpperCase()}
                        </button>
                      ))
                    : (['sm', 'md', 'lg', 'xl'] as OverlappingStackSize[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSize(s)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            size === s
                              ? 'bg-stone-900 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {s.toUpperCase()}
                        </button>
                      ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-800">散开布局形式</span>
                  <span className="text-stone-400 text-[11px]">{layout === 'row' ? '单行横滑' : '多行折行'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLayout('row')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      layout === 'row'
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    单行滑动 (Row)
                  </button>
                  <button
                    onClick={() => setLayout('wrap')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      layout === 'wrap'
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    自适应折行 (Wrap)
                  </button>
                </div>
              </div>
            </div>

            {/* Max Visible Slider */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-stone-800">折叠时最大展示数量 (maxVisible)</span>
                <span className="font-mono font-bold text-stone-900">{maxVisible} 项</span>
              </div>
              <input
                type="range"
                min="2"
                max="6"
                step="1"
                value={maxVisible}
                onChange={(e) => setMaxVisible(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <p className="text-[10px] text-stone-400">
                超出数量将在末尾聚合成 +{Math.max(0, currentItems.length - maxVisible)} 徽标
              </p>
            </div>

            {/* Stagger Delay Slider */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-stone-800">依次散开间隔延迟 (staggerMs)</span>
                <span className="font-mono font-bold text-stone-900">{staggerMs} 毫秒</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={staggerMs}
                onChange={(e) => setStaggerMs(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <p className="text-[10px] text-stone-400">
                控制各元素依次如扇形优雅散开的阶梯节奏感
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-100 border-t border-stone-200 flex justify-between items-center text-xs">
          <span className="text-stone-500">
            支持无障碍键盘操作 (空格 / 回车展开与收回)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            完成体验
          </button>
        </div>
      </div>
    </div>
  );
};
