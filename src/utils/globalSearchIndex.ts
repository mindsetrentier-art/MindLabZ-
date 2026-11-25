import lunr from 'lunr';
import { GameDefinition, PsychologyLaw } from '../types';
import { INITIAL_PSYCHOLOGY_LAWS } from '../data/laws';
import { PSYCHOLOGY_GAMES } from '../data/games';
import { LOVE_DOMAINS } from '../data/lovePsychologyTypes';
import { REVERSE_SCENARIOS, REVERSE_CATEGORIES } from '../data/reversePsychologyLaws';
import { CRIMINAL_CONTEXTS, CRIMINAL_CATEGORIES } from '../data/criminalPsychologyLaws';
import {
  SEXUAL_PILLARS,
  SEXUAL_CONTEXTS,
  SEXUAL_CATEGORIES,
} from '../data/sexualPsychologyLaws';
import {
  LOVE100_PILLARS,
  LOVE100_CONTEXTS,
  LOVE100_CATEGORIES,
} from '../data/love100PsychologyLaws';
import {
  INTIMATE_PILLARS,
  INTIMATE_CONTEXTS,
  INTIMATE_CATEGORIES,
} from '../data/intimateRelationshipsLaws';

export type SearchResultKind = 'law' | 'arena';

export interface GlobalSearchResult {
  docId: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  codeId: string;
  category: string;
  snippet: string;
  route: string;
  score: number;
  accentColor?: string;
  law?: PsychologyLaw;
  game?: GameDefinition;
}

interface IndexedDocument extends GlobalSearchResult {
  tags: string;
  summary: string;
  details: string;
  searchBlob: string;
}

interface ExtractedQueryToken {
  term: string;
  boost: number;
  isAscii: boolean;
}

const ASCII_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that',
  'the', 'to', 'was', 'were', 'will', 'with',
]);

const SEGMENT_REGEX = /[a-z0-9_]+|[\u4e00-\u9fff]+/g;

function tokenizeBilingualText(
  input?: string | object | object[] | null,
  metadata?: Record<string, unknown>
): lunr.Token[] {
  if (input === null || input === undefined) return [];
  if (Array.isArray(input)) {
    const out: lunr.Token[] = [];
    for (const item of input) {
      out.push(...tokenizeBilingualText(item, metadata));
    }
    return out;
  }

  const text = String(input).toLowerCase().trim();
  if (!text) return [];

  const tokens: lunr.Token[] = [];
  let match: RegExpExecArray | null;
  SEGMENT_REGEX.lastIndex = 0;

  while ((match = SEGMENT_REGEX.exec(text)) !== null) {
    const seg = match[0];
    const baseMeta = {
      ...(metadata || {}),
      position: [match.index, seg.length],
    };

    if (seg.charCodeAt(0) < 128) {
      if (!ASCII_STOP_WORDS.has(seg)) {
        tokens.push(new lunr.Token(seg, baseMeta));
      }
    } else {
      // CJK contiguous phrase: emit full segment (up to 10 chars), overlapping bigrams, and unigrams
      if (seg.length >= 2 && seg.length <= 10) {
        tokens.push(new lunr.Token(seg, baseMeta));
      }
      if (seg.length >= 2) {
        for (let i = 0; i < seg.length - 1; i++) {
          tokens.push(new lunr.Token(seg.slice(i, i + 2), baseMeta));
        }
      }
      for (let i = 0; i < seg.length; i++) {
        tokens.push(new lunr.Token(seg[i], baseMeta));
      }
    }
  }

  return tokens;
}

const BILINGUAL_PIPELINE_FN_NAME = 'mindlabzBilingualAsciiStemmer';

function registerBilingualPipeline(): lunr.PipelineFunction {
  const existing = (
    lunr.Pipeline as unknown as {
      registeredFunctions?: Record<string, lunr.PipelineFunction>;
    }
  ).registeredFunctions?.[BILINGUAL_PIPELINE_FN_NAME];

  if (existing) {
    return existing;
  }

  const fn: lunr.PipelineFunction = (token) => {
    const str = token.toString();
    // Leave CJK tokens and alphanumeric code IDs untouched; stem pure ASCII words via lunr.stemmer
    if (/^[a-z]{4,}$/.test(str)) {
      return lunr.stemmer(token);
    }
    return token;
  };

  lunr.Pipeline.registerFunction(fn, BILINGUAL_PIPELINE_FN_NAME);
  return fn;
}

function getLawDisplayCategory(law: PsychologyLaw): string {
  if (law.isIntimateRelationship) {
    return `亲密关系100 · ${law.intimateCategory || law.intimatePillar || law.categoryZh}`;
  }
  if (law.isLove100Psychology) {
    return `恋爱心理100 · ${law.love100Category || law.love100Pillar || law.categoryZh}`;
  }
  if (law.isSexualPsychology) {
    return `性心理学 · ${law.sexualCategory || law.sexualPillar || law.categoryZh}`;
  }
  if (law.isCriminalPsychology) {
    return `犯罪心理学 · ${law.criminalCategory || law.categoryZh}`;
  }
  if (law.isReversePsychology) {
    return `逆向心理学 · ${law.reverseCategory || law.categoryZh}`;
  }
  if (law.isMicroexpression) {
    return `微表情 · ${law.actionUnitCode || law.categoryZh}`;
  }
  if (law.isLoveCodex) {
    return `爱情心理学 · ${law.loveDomainTitle || law.subTag || law.categoryZh}`;
  }
  return `${law.categoryZh}定律`;
}

function buildSearchCorpus(): IndexedDocument[] {
  const docs: IndexedDocument[] = [];

  // 1. Index all Psychology Laws (~1,148 entries across Classic, Love 696, Microexpressions 10, Reverse 100, Criminal 100, Sexual 100)
  for (const law of INITIAL_PSYCHOLOGY_LAWS) {
    const codeId = (law.codeId || law.id).toUpperCase();
    const categoryLabel = getLawDisplayCategory(law);
    const tags = [
      law.categoryZh,
      law.category,
      law.chapter,
      law.subTag,
      law.actionUnitCode,
      law.researcher,
      law.assignedCityZh,
      law.loveDomainTitle,
      law.microDomainTitle,
      law.reverseCategory,
      law.reverseScenario,
      law.criminalCategory,
      law.criminalContext,
      law.criminalTheoryName,
      law.sexualPillar,
      law.sexualCategory,
      law.sexualContext,
      law.sexualTopicName,
      law.love100Pillar,
      law.love100Category,
      law.love100Context,
      law.love100TopicName,
      law.intimatePillar,
      law.intimateCategory,
      law.intimateContext,
      law.intimateTopicName,
      law.isIntimateRelationship ? '亲密关系 100律 安全基地 共同调节 情绪验证 温和开场 冲突修复 归因方式' : '',
      law.isLove100Psychology ? '恋爱心理学 100律 依恋 亲密关系 非暴力沟通 冲突修复' : '',
      law.isSexualPsychology ? '性心理学 100律 亲密健康 知情同意' : '',
      law.isCriminalPsychology ? '犯罪心理学 100律 风险预防' : '',
      law.isReversePsychology ? '逆向心理学 100律 心理抗拒' : '',
      law.isMicroexpression ? '微表情 FACS 动作单元' : '',
      law.isLoveCodex ? '爱情心理学 696律' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const summary = [
      law.shortExplanation,
      law.keyTakeaway,
      law.criminalCoreTheory,
      law.sexualCoreConcept,
      law.love100CoreConcept,
      law.intimateCoreConcept,
      law.reversePrinciple,
    ]
      .filter(Boolean)
      .join(' ');

    const details = [
      law.detailedExplanation,
      law.realLifeExample,
      law.whyItHappens,
      law.storyScenario?.title,
      law.storyScenario?.narrative,
      ...(law.observableSigns || []),
      law.criminalAppliedAngle,
      law.sexualAppliedAngle,
      law.love100AppliedAngle,
      law.intimateAppliedAngle,
    ]
      .filter(Boolean)
      .join(' ');

    const searchBlob = `${codeId} ${law.nameZh} ${law.nameEn} ${tags} ${summary}`.toLowerCase();

    docs.push({
      docId: `law::${law.id}`,
      kind: 'law',
      title: law.nameZh,
      subtitle: law.nameEn,
      codeId,
      category: categoryLabel,
      snippet: law.shortExplanation || law.keyTakeaway,
      route: `/law/${law.id}`,
      score: 0,
      law,
      tags,
      summary,
      details,
      searchBlob,
    });
  }

  // 2. Index all Arena Games
  for (const game of PSYCHOLOGY_GAMES) {
    const codeId = game.numberPrefix ? `#${game.numberPrefix}` : 'ARENA';
    const categoryLabel = `竞技场 · ${game.category}`;
    const tags = [
      '竞技场',
      '游戏',
      '实战',
      'arena',
      game.category,
      game.conceptLearned,
      game.difficulty,
      game.estimatedTime,
      game.id,
    ]
      .filter(Boolean)
      .join(' ');

    const summary = `${game.description} ${game.conceptLearned}`;
    const details = `${game.name} ${game.nameEn || ''} ${game.nameZh} ${game.conceptLearned}`;
    const searchBlob = `${codeId} ${game.nameZh} ${game.nameEn || game.name} ${tags} ${summary}`.toLowerCase();

    docs.push({
      docId: `arena::game::${game.id}`,
      kind: 'arena',
      title: game.nameZh,
      subtitle: game.nameEn || game.name,
      codeId,
      category: categoryLabel,
      snippet: game.description,
      route: `/game/${game.id}`,
      score: 0,
      accentColor: game.accentColor,
      game,
      tags,
      summary,
      details,
      searchBlob,
    });
  }

  // 3. Index Structured Sub-Arena Practice Modes (Sexual, Criminal, Reverse, Love)
  for (const pillar of SEXUAL_PILLARS) {
    const title = `性心理板块 · ${pillar.label}`;
    docs.push({
      docId: `arena::sexual-pillar::${pillar.id}`,
      kind: 'arena',
      title,
      subtitle: pillar.enLabel,
      codeId: `SEX · ${pillar.count}律`,
      category: '竞技场 · 性心理专场',
      snippet: pillar.description,
      route: `/game/sexual-aleatoric-arena?pillar=${encodeURIComponent(pillar.id)}`,
      score: 0,
      accentColor: pillar.color,
      tags: `性心理学 性心理 竞技场 板块 CSPRNG ${pillar.label} ${pillar.categories.join(' ')}`,
      summary: pillar.description,
      details: `${pillar.label} ${pillar.enLabel} ${pillar.categories.join(' ')}`,
      searchBlob: `${title} ${pillar.enLabel} ${pillar.description} ${pillar.categories.join(' ')}`.toLowerCase(),
    });
  }

  for (const ctx of SEXUAL_CONTEXTS) {
    const title = `性心理场景实战 · ${ctx.label}`;
    docs.push({
      docId: `arena::sexual-ctx::${ctx.id}`,
      kind: 'arena',
      title,
      subtitle: ctx.enLabel,
      codeId: `SCENE · ${ctx.count}律`,
      category: '竞技场 · 性心理场景',
      snippet: ctx.description,
      route: `/game/sexual-aleatoric-arena?context=${encodeURIComponent(ctx.id)}`,
      score: 0,
      accentColor: ctx.color,
      tags: `性心理学 性心理 场景 竞技场 ${ctx.label} ${ctx.shortLabel}`,
      summary: ctx.description,
      details: `${ctx.label} ${ctx.enLabel}`,
      searchBlob: `${title} ${ctx.enLabel} ${ctx.description}`.toLowerCase(),
    });
  }

  for (const cat of SEXUAL_CATEGORIES) {
    const title = `性心理专题 · ${cat.label}`;
    docs.push({
      docId: `arena::sexual-cat::${cat.id}`,
      kind: 'arena',
      title,
      subtitle: `Sexual Psychology Arena · ${cat.pillarId}`,
      codeId: `TOPIC · ${cat.count}律`,
      category: '竞技场 · 性心理专题',
      snippet: cat.description,
      route: `/game/sexual-aleatoric-arena?pillar=${encodeURIComponent(cat.pillarId)}&category=${encodeURIComponent(cat.id)}`,
      score: 0,
      accentColor: cat.color,
      tags: `性心理学 性心理 专题 竞技场 ${cat.label} ${cat.pillarId}`,
      summary: cat.description,
      details: `${cat.label} ${cat.pillarId}`,
      searchBlob: `${title} ${cat.pillarId} ${cat.description}`.toLowerCase(),
    });
  }

  for (const pillar of LOVE100_PILLARS) {
    const title = `恋爱心理板块 · ${pillar.label}`;
    docs.push({
      docId: `arena::love100-pillar::${pillar.id}`,
      kind: 'arena',
      title,
      subtitle: pillar.enLabel,
      codeId: `LOVEPSY · ${pillar.count}卡`,
      category: '竞技场 · 恋爱心理100专场',
      snippet: pillar.description,
      route: `/game/love100-aleatoric-arena?pillar=${encodeURIComponent(pillar.id)}`,
      score: 0,
      accentColor: pillar.color,
      tags: `恋爱心理学 恋爱心理100 亲密关系 竞技场 板块 CSPRNG ${pillar.label} ${pillar.categories.join(' ')}`,
      summary: pillar.description,
      details: `${pillar.label} ${pillar.enLabel} ${pillar.categories.join(' ')}`,
      searchBlob: `${title} ${pillar.enLabel} ${pillar.description} ${pillar.categories.join(' ')}`.toLowerCase(),
    });
  }

  for (const ctx of LOVE100_CONTEXTS) {
    const title = `恋爱心理情境实战 · ${ctx.label}`;
    docs.push({
      docId: `arena::love100-ctx::${ctx.id}`,
      kind: 'arena',
      title,
      subtitle: ctx.enLabel,
      codeId: `CONTEXT · ${ctx.count}卡`,
      category: '竞技场 · 恋爱心理情境',
      snippet: ctx.description,
      route: `/game/love100-aleatoric-arena?context=${encodeURIComponent(ctx.id)}`,
      score: 0,
      accentColor: ctx.color,
      tags: `恋爱心理学 恋爱心理100 亲密关系 情境 竞技场 ${ctx.label} ${ctx.shortLabel}`,
      summary: ctx.description,
      details: `${ctx.label} ${ctx.enLabel}`,
      searchBlob: `${title} ${ctx.enLabel} ${ctx.description}`.toLowerCase(),
    });
  }

  for (const cat of LOVE100_CATEGORIES) {
    const title = `恋爱心理类别 · ${cat.label}`;
    docs.push({
      docId: `arena::love100-cat::${cat.id}`,
      kind: 'arena',
      title,
      subtitle: `Love Psychology 100 · ${cat.pillarId}`,
      codeId: `TOPIC · ${cat.count}卡`,
      category: '竞技场 · 恋爱心理类别',
      snippet: cat.description,
      route: `/game/love100-aleatoric-arena?pillar=${encodeURIComponent(cat.pillarId)}&category=${encodeURIComponent(cat.id)}`,
      score: 0,
      accentColor: cat.color,
      tags: `恋爱心理学 恋爱心理100 亲密关系 类别 竞技场 ${cat.label} ${cat.pillarId}`,
      summary: cat.description,
      details: `${cat.label} ${cat.pillarId}`,
      searchBlob: `${title} ${cat.pillarId} ${cat.description}`.toLowerCase(),
    });
  }

  for (const pillar of INTIMATE_PILLARS) {
    const title = `亲密关系板块 · ${pillar.label}`;
    docs.push({
      docId: `arena::intimate-pillar::${pillar.id}`,
      kind: 'arena',
      title,
      subtitle: pillar.enLabel,
      codeId: `INT · ${pillar.count}卡`,
      category: '竞技场 · 亲密关系100专场',
      snippet: pillar.description,
      route: `/game/intimate-aleatoric-arena?pillar=${encodeURIComponent(pillar.id)}`,
      score: 0,
      accentColor: pillar.color,
      tags: `亲密关系 亲密关系心理学 依恋 共同调节 冲突修复 竞技场 板块 CSPRNG ${pillar.label} ${pillar.categories.join(' ')}`,
      summary: pillar.description,
      details: `${pillar.label} ${pillar.enLabel} ${pillar.categories.join(' ')}`,
      searchBlob: `${title} ${pillar.enLabel} ${pillar.description} ${pillar.categories.join(' ')}`.toLowerCase(),
    });
  }

  for (const ctx of INTIMATE_CONTEXTS) {
    const title = `亲密关系情境实战 · ${ctx.label}`;
    docs.push({
      docId: `arena::intimate-ctx::${ctx.id}`,
      kind: 'arena',
      title,
      subtitle: ctx.enLabel,
      codeId: `CONTEXT · ${ctx.count}卡`,
      category: '竞技场 · 亲密关系情境',
      snippet: ctx.description,
      route: `/game/intimate-aleatoric-arena?context=${encodeURIComponent(ctx.id)}`,
      score: 0,
      accentColor: ctx.color,
      tags: `亲密关系 亲密关系心理学 情境 竞技场 ${ctx.label} ${ctx.shortLabel}`,
      summary: ctx.description,
      details: `${ctx.label} ${ctx.enLabel}`,
      searchBlob: `${title} ${ctx.enLabel} ${ctx.description}`.toLowerCase(),
    });
  }

  for (const cat of INTIMATE_CATEGORIES) {
    const title = `亲密关系类别 · ${cat.label}`;
    docs.push({
      docId: `arena::intimate-cat::${cat.id}`,
      kind: 'arena',
      title,
      subtitle: `Intimate Relationships 100 · ${cat.pillarId}`,
      codeId: `TOPIC · ${cat.count}卡`,
      category: '竞技场 · 亲密关系类别',
      snippet: cat.description,
      route: `/game/intimate-aleatoric-arena?pillar=${encodeURIComponent(cat.pillarId)}&category=${encodeURIComponent(cat.id)}`,
      score: 0,
      accentColor: cat.color,
      tags: `亲密关系 亲密关系心理学 类别 竞技场 ${cat.label} ${cat.pillarId}`,
      summary: cat.description,
      details: `${cat.label} ${cat.pillarId}`,
      searchBlob: `${title} ${cat.pillarId} ${cat.description}`.toLowerCase(),
    });
  }

  for (const ctx of CRIMINAL_CONTEXTS) {
    const title = `犯罪心理观察场景 · ${ctx.label}`;
    docs.push({
      docId: `arena::crim-ctx::${ctx.id}`,
      kind: 'arena',
      title,
      subtitle: 'Criminal Psychology Observation Context',
      codeId: `CRIM · ${ctx.count}律`,
      category: '竞技场 · 犯罪心理专场',
      snippet: ctx.description,
      route: `/game/criminal-aleatoric-arena?context=${encodeURIComponent(ctx.id)}`,
      score: 0,
      accentColor: ctx.color,
      tags: `犯罪心理学 犯罪心理 风险预防 场景 竞技场 ${ctx.label}`,
      summary: ctx.description,
      details: ctx.label,
      searchBlob: `${title} ${ctx.description}`.toLowerCase(),
    });
  }

  for (const cat of CRIMINAL_CATEGORIES) {
    const title = `犯罪心理领域 · ${cat.label}`;
    docs.push({
      docId: `arena::crim-cat::${cat.id}`,
      kind: 'arena',
      title,
      subtitle: 'Criminal Psychology Domain Arena',
      codeId: `CRIM · ${cat.count}律`,
      category: '竞技场 · 犯罪心理领域',
      snippet: cat.description,
      route: `/game/criminal-aleatoric-arena?category=${encodeURIComponent(cat.id)}`,
      score: 0,
      accentColor: cat.color,
      tags: `犯罪心理学 犯罪心理 领域 竞技场 ${cat.label}`,
      summary: cat.description,
      details: cat.label,
      searchBlob: `${title} ${cat.description}`.toLowerCase(),
    });
  }

  for (const sc of REVERSE_SCENARIOS) {
    const title = `逆向心理场景 · ${sc.label}`;
    docs.push({
      docId: `arena::rev-sc::${sc.id}`,
      kind: 'arena',
      title,
      subtitle: 'Reverse Psychology & Reactance Arena',
      codeId: `REV · ${sc.count}律`,
      category: '竞技场 · 逆向心理专场',
      snippet: sc.description,
      route: `/game/reverse-aleatoric-arena?scenario=${encodeURIComponent(sc.id)}`,
      score: 0,
      accentColor: sc.color,
      tags: `逆向心理学 心理抗拒 禁果效应 沟通场景 竞技场 ${sc.label}`,
      summary: sc.description,
      details: sc.label,
      searchBlob: `${title} ${sc.description}`.toLowerCase(),
    });
  }

  for (const cat of REVERSE_CATEGORIES) {
    const title = `逆向心理机制 · ${cat.label}`;
    docs.push({
      docId: `arena::rev-cat::${cat.id}`,
      kind: 'arena',
      title,
      subtitle: 'Reverse Psychology Mechanism Arena',
      codeId: `REV · ${cat.count}律`,
      category: '竞技场 · 逆向心理机制',
      snippet: cat.description,
      route: `/game/reverse-aleatoric-arena?category=${encodeURIComponent(cat.id)}`,
      score: 0,
      accentColor: cat.color,
      tags: `逆向心理学 心理抗拒 机制 竞技场 ${cat.label}`,
      summary: cat.description,
      details: cat.label,
      searchBlob: `${title} ${cat.description}`.toLowerCase(),
    });
  }

  for (const domain of LOVE_DOMAINS) {
    const title = `爱情心理域 · ${domain.titleZh}`;
    docs.push({
      docId: `arena::love-dom::${domain.id}`,
      kind: 'arena',
      title,
      subtitle: domain.enTitle,
      codeId: 'LOVE · 696域',
      category: '竞技场 · 爱情心理专场',
      snippet: domain.description,
      route: `/game/love-aleatoric-arena?domain=${encodeURIComponent(domain.id)}`,
      score: 0,
      accentColor: domain.color,
      tags: `爱情心理学 爱情 依恋 亲密 竞技场 ${domain.titleZh} ${domain.shortTitle} ${domain.rawTags.join(' ')}`,
      summary: domain.description,
      details: `${domain.titleZh} ${domain.enTitle} ${domain.rawTags.join(' ')}`,
      searchBlob: `${title} ${domain.enTitle} ${domain.description} ${domain.rawTags.join(' ')}`.toLowerCase(),
    });
  }

  return docs;
}

interface GlobalSearchRuntime {
  index: lunr.Index;
  docMap: Map<string, IndexedDocument>;
  lawCount: number;
  arenaCount: number;
}

let cachedRuntime: GlobalSearchRuntime | null = null;

function getRuntime(): GlobalSearchRuntime {
  if (cachedRuntime) return cachedRuntime;

  const docs = buildSearchCorpus();
  const docMap = new Map<string, IndexedDocument>();
  let lawCount = 0;
  let arenaCount = 0;

  for (const d of docs) {
    docMap.set(d.docId, d);
    if (d.kind === 'law') lawCount += 1;
    else arenaCount += 1;
  }

  const bilingualStemmer = registerBilingualPipeline();

  const index = lunr(function () {
    this.ref('docId');
    this.tokenizer = tokenizeBilingualText as unknown as typeof lunr.tokenizer;

    this.pipeline.reset();
    this.pipeline.add(bilingualStemmer);
    this.searchPipeline.reset();
    this.searchPipeline.add(bilingualStemmer);

    this.field('codeId', { boost: 14 });
    this.field('title', { boost: 12 });
    this.field('subtitle', { boost: 8 });
    this.field('tags', { boost: 7 });
    this.field('summary', { boost: 4 });
    this.field('details', { boost: 2 });

    for (const d of docs) {
      this.add({
        docId: d.docId,
        codeId: d.codeId,
        title: d.title,
        subtitle: d.subtitle,
        tags: d.tags,
        summary: d.summary,
        details: d.details,
      });
    }
  });

  cachedRuntime = { index, docMap, lawCount, arenaCount };
  return cachedRuntime;
}

function extractQueryTokens(rawQuery: string, includeCjkUnigrams: boolean): ExtractedQueryToken[] {
  const clean = rawQuery.trim().toLowerCase();
  if (!clean) return [];

  const tokens: ExtractedQueryToken[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  SEGMENT_REGEX.lastIndex = 0;

  while ((match = SEGMENT_REGEX.exec(clean)) !== null) {
    const seg = match[0];
    if (seg.charCodeAt(0) < 128) {
      if (!ASCII_STOP_WORDS.has(seg) && !seen.has(seg)) {
        seen.add(seg);
        tokens.push({ term: seg, boost: 8, isAscii: true });
      }
    } else {
      if (seg.length === 1) {
        if (!seen.has(seg)) {
          seen.add(seg);
          tokens.push({ term: seg, boost: 5, isAscii: false });
        }
      } else {
        if (seg.length <= 10 && !seen.has(seg)) {
          seen.add(seg);
          tokens.push({ term: seg, boost: 10, isAscii: false });
        }
        for (let i = 0; i < seg.length - 1; i++) {
          const bg = seg.slice(i, i + 2);
          if (!seen.has(bg)) {
            seen.add(bg);
            tokens.push({ term: bg, boost: 6, isAscii: false });
          }
        }
        if (includeCjkUnigrams) {
          for (let i = 0; i < seg.length; i++) {
            const ug = seg[i];
            if (!seen.has(ug)) {
              seen.add(ug);
              tokens.push({ term: ug, boost: 1.5, isAscii: false });
            }
          }
        }
      }
    }
  }

  return tokens.slice(0, 18);
}

function runLunrQuery(runtime: GlobalSearchRuntime, rawQuery: string): Map<string, number> {
  const normalized = rawQuery.trim().toLowerCase();
  if (!normalized) return new Map();

  const execute = (tokens: ExtractedQueryToken[]) => {
    if (tokens.length === 0) return [];
    return runtime.index.query((q) => {
      for (const t of tokens) {
        q.term(t.term, {
          boost: t.boost,
          presence: lunr.Query.presence.OPTIONAL,
        });
        if (t.isAscii && t.term.length >= 2) {
          q.term(t.term, {
            wildcard: lunr.Query.wildcard.TRAILING,
            boost: Math.max(2, t.boost * 0.5),
            presence: lunr.Query.presence.OPTIONAL,
          });
        }
      }
    });
  };

  let hits = execute(extractQueryTokens(normalized, false));
  if (hits.length === 0) {
    hits = execute(extractQueryTokens(normalized, true));
  }

  const scoreMap = new Map<string, number>();
  for (const hit of hits) {
    const doc = runtime.docMap.get(hit.ref);
    if (!doc) continue;

    let finalScore = hit.score;
    const titleLower = doc.title.toLowerCase();
    const codeLower = doc.codeId.toLowerCase();
    const subtitleLower = doc.subtitle.toLowerCase();

    if (codeLower === normalized || codeLower.includes(normalized)) {
      finalScore += 60;
    }
    if (titleLower === normalized) {
      finalScore += 55;
    } else if (titleLower.includes(normalized)) {
      finalScore += 32;
    } else if (subtitleLower.includes(normalized)) {
      finalScore += 20;
    } else if (doc.searchBlob.includes(normalized)) {
      finalScore += 10;
    }

    scoreMap.set(hit.ref, finalScore);
  }

  return scoreMap;
}

export function getGlobalIndexStats(): {
  totalIndexed: number;
  lawCount: number;
  arenaCount: number;
} {
  const runtime = getRuntime();
  return {
    totalIndexed: runtime.docMap.size,
    lawCount: runtime.lawCount,
    arenaCount: runtime.arenaCount,
  };
}

export function searchGlobalIndex(
  query: string,
  options?: { scope?: 'all' | SearchResultKind; limit?: number }
): GlobalSearchResult[] {
  const scope = options?.scope ?? 'all';
  const limit = options?.limit ?? 40;
  const trimmed = query.trim();

  if (!trimmed) return [];

  const runtime = getRuntime();
  const scoreMap = runLunrQuery(runtime, trimmed);

  const results: GlobalSearchResult[] = [];
  for (const [docId, score] of scoreMap.entries()) {
    const doc = runtime.docMap.get(docId);
    if (!doc) continue;
    if (scope !== 'all' && doc.kind !== scope) continue;

    results.push({
      docId: doc.docId,
      kind: doc.kind,
      title: doc.title,
      subtitle: doc.subtitle,
      codeId: doc.codeId,
      category: doc.category,
      snippet: doc.snippet,
      route: doc.route,
      score,
      accentColor: doc.accentColor,
      law: doc.law,
      game: doc.game,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export function searchLawsWithLunr(
  lawsSubset: PsychologyLaw[],
  query: string
): PsychologyLaw[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return lawsSubset;

  const runtime = getRuntime();
  const scoreMap = runLunrQuery(runtime, trimmed);

  const scored: Array<{ law: PsychologyLaw; score: number; originalIndex: number }> = [];

  for (let i = 0; i < lawsSubset.length; i++) {
    const law = lawsSubset[i];
    const docId = `law::${law.id}`;
    const lunrScore = scoreMap.get(docId) ?? 0;

    // Exact substring safety check ensures no exact field match is missed
    const hasExactSubstring =
      (law.codeId && law.codeId.toLowerCase().includes(trimmed)) ||
      law.nameZh.toLowerCase().includes(trimmed) ||
      law.nameEn.toLowerCase().includes(trimmed) ||
      law.shortExplanation.toLowerCase().includes(trimmed) ||
      (law.sexualPillar && law.sexualPillar.toLowerCase().includes(trimmed)) ||
      (law.sexualCategory && law.sexualCategory.toLowerCase().includes(trimmed)) ||
      (law.sexualContext && law.sexualContext.toLowerCase().includes(trimmed)) ||
      (law.sexualTopicName && law.sexualTopicName.toLowerCase().includes(trimmed)) ||
      (law.love100Pillar && law.love100Pillar.toLowerCase().includes(trimmed)) ||
      (law.love100Category && law.love100Category.toLowerCase().includes(trimmed)) ||
      (law.love100Context && law.love100Context.toLowerCase().includes(trimmed)) ||
      (law.love100TopicName && law.love100TopicName.toLowerCase().includes(trimmed)) ||
      (law.intimatePillar && law.intimatePillar.toLowerCase().includes(trimmed)) ||
      (law.intimateCategory && law.intimateCategory.toLowerCase().includes(trimmed)) ||
      (law.intimateContext && law.intimateContext.toLowerCase().includes(trimmed)) ||
      (law.intimateTopicName && law.intimateTopicName.toLowerCase().includes(trimmed)) ||
      (law.criminalCategory && law.criminalCategory.toLowerCase().includes(trimmed)) ||
      (law.criminalContext && law.criminalContext.toLowerCase().includes(trimmed)) ||
      (law.criminalTheoryName && law.criminalTheoryName.toLowerCase().includes(trimmed)) ||
      (law.reverseCategory && law.reverseCategory.toLowerCase().includes(trimmed)) ||
      (law.reverseScenario && law.reverseScenario.toLowerCase().includes(trimmed)) ||
      (law.actionUnitCode && law.actionUnitCode.toLowerCase().includes(trimmed)) ||
      (law.researcher && law.researcher.toLowerCase().includes(trimmed)) ||
      (law.subTag && law.subTag.toLowerCase().includes(trimmed)) ||
      (law.assignedCityZh && law.assignedCityZh.toLowerCase().includes(trimmed));

    if (lunrScore > 0 || hasExactSubstring) {
      scored.push({
        law,
        score: lunrScore + (hasExactSubstring ? 5 : 0),
        originalIndex: i,
      });
    }
  }

  scored.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.001) {
      return b.score - a.score;
    }
    return a.originalIndex - b.originalIndex;
  });

  return scored.map((entry) => entry.law);
}

export function searchArenaWithLunr(
  query: string,
  limit = 20
): GlobalSearchResult[] {
  return searchGlobalIndex(query, { scope: 'arena', limit });
}
