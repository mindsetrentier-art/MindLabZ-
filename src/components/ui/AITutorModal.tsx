import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, Lightbulb, BookOpen, Brain, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AITutorSkeleton } from './Skeleton';

export const AITutorModal: React.FC = () => {
  const { aiTutorOpen, setAiTutorOpen, activeContextLaw } = useApp();
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: '你好！我是智心堂的 AI 认知科学与心理学导师。无论是关于心理学定律、日常生活决策中的认知偏差，还是如何利用神经科学提升学习与记忆力，都可以随时问我！'
    }
  ]);

  if (!aiTutorOpen) return null;

  const handleAsk = async (questionText?: string) => {
    const query = questionText || inputQuestion.trim();
    if (!query || loading) return;

    setInputQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          context: activeContextLaw ? {
            lawName: activeContextLaw.nameZh,
            lawEn: activeContextLaw.nameEn,
            category: activeContextLaw.categoryZh,
            shortExplanation: activeContextLaw.shortExplanation
          } : null
        })
      });

      const data = await res.json();
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: data.answer || '抱歉，导师思考受阻，请稍后再试。' }
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '【智心 AI 导师分析】：认知科学研究表明，大脑在面对复杂情境时常依赖“快速启发式”（Heuristics）。保持元认知觉察（Metacognition）能助你在关键时刻摆脱偏见，做出更清晰的判断。'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = activeContextLaw ? [
    `请用生活中的真实故事通俗解释【${activeContextLaw.nameZh}】？`,
    `如何在日常工作或学习中利用【${activeContextLaw.nameZh}】提高效率？`,
    `如何防止自己掉入【${activeContextLaw.nameZh}】的思维陷阱？`
  ] : [
    '为什么我们总是在最后一刻才开始赶工（拖延与蔡格尼克）？',
    '如何利用“双系统理论”在冲动消费前按下暂停键？',
    '为什么第一印象（首因效应）如此顽固，该如何扭转？'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E6E2F5] overflow-hidden flex flex-col max-h-[85vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#6C4CF1] to-[#532CD8] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight">智心 AI 心理导师</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">Gemini 3.7 Flash</span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                {activeContextLaw ? `当前聚焦：${activeContextLaw.nameZh}` : '随时提问心理学与认知科学'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiTutorOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors btn-press"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF9FF] text-sm">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] text-[#6C4CF1] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Brain className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl max-w-[82%] leading-relaxed text-xs font-medium ${
                  msg.role === 'user'
                    ? 'bg-[#6C4CF1] text-white rounded-tr-none shadow-xs'
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
                <span className="animate-pulse">AI 导师正在检索认知神经科学知识库...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2.5 bg-white border-t border-[#F5F3FF] flex gap-2 overflow-x-auto no-scrollbar">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleAsk(q)}
              className="text-xs shrink-0 px-3 py-1.5 rounded-full bg-[#FAF9FF] text-[#6C4CF1] hover:bg-[#EDE9FE] transition-colors border border-[#E6E2F5] flex items-center gap-1.5 btn-press"
            >
              <Lightbulb className="w-3 h-3 text-[#F59E0B]" />
              <span className="truncate max-w-[220px] font-medium">{q}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#E6E2F5] flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder={activeContextLaw ? `咨询关于 ${activeContextLaw.nameZh} 的问题...` : "向 AI 导师提问任何心理学知识..."}
            className="flex-1 px-4 py-2.5 text-xs font-medium bg-[#FAF9FF] border border-[#E6E2F5] text-[#18181B] placeholder-[#94A3B8] rounded-2xl focus:outline-none focus:border-[#6C4CF1] focus:ring-1 focus:ring-[#6C4CF1]/20 shadow-xs"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !inputQuestion.trim()}
            className="w-10 h-10 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-xs shrink-0 btn-press"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
