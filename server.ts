import "dotenv/config";
import express from "express";
import { createServer as createHttpServer } from "node:http";
import path from "path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomInt } from "node:crypto";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import {
  MICROEXPRESSION_CATALOG,
  type MicroexpressionCatalogEntry,
} from "./src/data/microexpressionCatalog";
import {
  getSkillsInventory,
  getSkillDetailFromDisk,
  setSkillEnabledState,
  loadAgentSkillContext,
} from "./server/skillsEngine";

function getValidGeminiModel(envModel?: string): string {
  if (envModel && (envModel.startsWith("gemini-") || envModel.startsWith("models/gemini-"))) {
    return envModel;
  }
  return "gemini-4-hydrogen";
}

const MODEL = getValidGeminiModel(process.env.GEMINI_MODEL);

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: "v1beta",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

interface ManifestLawItem {
  id: string;
  title_zh: string;
  title_en: string;
  category: string;
  chapter: string;
  difficulty: string;
  xp: number;
  summary: string;
}

function buildStructuredFallbackLaw(item: ManifestLawItem) {
  return {
    law: {
      id: item.id,
      title_zh: item.title_zh,
      title_en: item.title_en,
      category: item.category,
      chapter: item.chapter,
      definition: item.summary,
      mechanism: `在认知神经科学视角下，【${item.title_zh}（${item.title_en}）】源于大脑“系统1（直觉启发式系统）”对信息加工效率的本能追求。为了减少前额叶皮层的工作记忆能耗，大脑利用过往图式快速做出判断，从而在复杂情境中产生系统性认知偏移。`,
      real_life_case: `在日常生活中，当人们面临时间压力或信息过载时，【${item.title_zh}】会悄然介入。例如在浏览资讯或日常消费时，人们往往顺应第一直觉而忽略客观统计概率。`,
      workplace_case: `在职场协作、绩效评估与跨部门沟通中，管理者或团队成员若未察觉【${item.title_zh}】，容易在项目排期、责任归因或方案评审中做出带有主观滤镜的决策。`,
      relationship_case: `在人际交往与亲密关系里，【${item.title_zh}】常导致双方只捕捉符合自身情绪预期的沟通细节，从而放大误解或产生不必要的情绪内耗。`,
      business_case: `在商业定价与品牌营销中，企业常利用【${item.title_zh}】设计产品陈列、会员阶梯与促销话术，显著提升用户的转化率与主观价值感。`,
      recognition_signals: [
        `在做决定时感到“无需多想，直觉告诉我一定是这样”，缺乏反面数据核查`,
        `面对与预期不符的客观事实时，本能地寻找借口维持原有判断`,
        `在群体或情绪唤醒情境下，判断标准发生明显偏移而不自知`,
      ],
      anti_manipulation: [
        `启动“3秒元认知暂停”：在关键决策前问自己是否正受到【${item.title_zh}】影响`,
        `引入外部基准线（Outside View）与客观清单，替代纯粹的主观直觉估算`,
        `主动寻找至少2条能够证伪当前假设的反例或独立第三方意见`,
      ],
      quiz: [
        {
          question: `关于【${item.title_zh}（${item.title_en}）】的核心特征，以下哪项描述最准确？`,
          options: [
            item.summary,
            "大脑在任何情况下都能做到百分之百的完全理性计算",
            "只有特定人群才会出现该现象，经过训练的人绝不会受影响",
            "该效应仅在实验室极端条件下存在，与现实生活无关",
          ],
          answer_index: 0,
          explanation: `【${item.title_zh}】的本质正是：${item.summary}`,
        },
        {
          question: `大脑之所以会频繁出现【${item.title_zh}】，其底层认知科学原因主要是：`,
          options: [
            "系统1（直觉启发式加工）为了节省前额叶认知能量而采取的思维捷径",
            "视觉神经信号传输完全中断",
            "长期记忆容量无限膨胀导致的随机错误",
            "故意违背逻辑以博取他人关注",
          ],
          answer_index: 0,
          explanation: "人类大脑遵循认知经济学原则，倾向于用低能耗的启发式捷径替代高能耗的深度分析。",
        },
        {
          question: `在日常决策中，想要有效防范或克服【${item.title_zh}】的干扰，最科学的做法是：`,
          options: [
            "完全凭第一感觉行事，越快越好",
            "启动元认知觉察，主动引入反向证据与客观基准数据进行交叉核验",
            "只听取与自己立场一致的朋友建议",
            "回避一切需要做决定的场合",
          ],
          answer_index: 1,
          explanation: "通过元认知监控与反向证伪检验，能有效唤醒系统2理性审视，打破思维捷径陷阱。",
        },
      ],
      game: {
        title: `${item.title_zh} · 认知决策实验室`,
        type: "scenario_choice",
        scenario: `在一个高压决策场景中，你发现团队正因为【${item.title_zh}】而倾向于一个看似稳妥但缺乏客观数据支撑的方案。此时你会如何行动？`,
        option_a: "顺应直觉与大多数人的第一反应，迅速拍板以节省讨论时间",
        option_b: "暂停拍板，列出核心假设并要求补充客观反例数据后再做决断",
        rational_choice: "B",
        insight: `面对【${item.title_zh}】，刻意放慢决策节奏、引入证伪机制（选择B）能将决策失误率降低 60% 以上。`,
      },
      difficulty: item.difficulty || "Medium",
      xp: item.xp || 25,
      evidence_level: "A",
    },
  };
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "15mb" }));

  const rootDir = process.cwd();
  const systemInstruction = await readFile(path.join(rootDir, "prompts/system.txt"), "utf8");
  const generatorPrompt = await readFile(path.join(rootDir, "prompts/generator.txt"), "utf8");
  const schema = JSON.parse(await readFile(path.join(rootDir, "schemas/law.schema.json"), "utf8"));
  const manifest = JSON.parse(await readFile(path.join(rootDir, "data/laws.manifest.json"), "utf8"));
  const sampleLaw001 = JSON.parse(await readFile(path.join(rootDir, "data/sample.LAW001.json"), "utf8"));

  // 1. Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, status: "ok", app: "MindLabZ", model: MODEL });
  });

  // 2. Get 100 Psychology Laws manifest (LAW001 - LAW100)
  app.get("/api/laws", (_req, res) => {
    res.json(manifest);
  });

  // 3. Generate or retrieve structured JSON for a specific law (LAW001 - LAW100)
  app.post("/api/laws/generate", async (req, res) => {
    try {
      const { law_id, force_refresh = false } = req.body || {};
      if (!law_id) {
        return res.status(400).json({ error: "Missing law_id" });
      }

      // Match by ID (e.g. LAW001), Chinese title, or English title
      const normalizedQuery = String(law_id).trim().toLowerCase();
      const lawItem: ManifestLawItem | undefined = manifest.laws.find(
        (x: ManifestLawItem) =>
          x.id.toLowerCase() === normalizedQuery ||
          x.title_zh.toLowerCase() === normalizedQuery ||
          x.title_en.toLowerCase() === normalizedQuery ||
          x.title_en.toLowerCase().replace(/\s+/g, "-") === normalizedQuery
      );

      if (!lawItem) {
        return res.status(400).json({ error: `Unknown law_id: ${law_id}` });
      }

      // Check cached generated file first unless force_refresh is requested
      const generatedDir = path.join(rootDir, "data/generated");
      const cachedFilePath = path.join(generatedDir, `${lawItem.id}.json`);

      if (!force_refresh) {
        if (existsSync(cachedFilePath)) {
          const cached = JSON.parse(await readFile(cachedFilePath, "utf8"));
          return res.json(cached);
        }
        if (lawItem.id === "LAW001") {
          return res.json(sampleLaw001);
        }
      }

      const ai = getAI();
      if (!ai) {
        return res.json(buildStructuredFallbackLaw(lawItem));
      }

      const prompt = `${generatorPrompt}\n\nLAW:\n${JSON.stringify(lawItem, null, 2)}`;

      let parsed;
      try {
        const response = await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });
        parsed = JSON.parse(response.text || "{}");
      } catch (genErr: any) {
        console.warn("Law AI generation returned error, using high-fidelity structured fallback:", genErr?.message || genErr);
        return res.json(buildStructuredFallbackLaw(lawItem));
      }

      try {
        await mkdir(generatedDir, { recursive: true });
        await writeFile(cachedFilePath, JSON.stringify(parsed, null, 2), "utf8");
      } catch (_writeErr) {
        // Non-fatal if filesystem is read-only
      }

      return res.json(parsed);
    } catch (err: any) {
      console.error("Law generation error:", err);
      const { law_id } = req.body || {};
      const normalizedQuery = String(law_id || "LAW001").trim().toLowerCase();
      const lawItem: ManifestLawItem | undefined = manifest.laws.find(
        (x: ManifestLawItem) =>
          x.id.toLowerCase() === normalizedQuery ||
          x.title_zh.toLowerCase() === normalizedQuery ||
          x.title_en.toLowerCase().replace(/\s+/g, "-") === normalizedQuery
      );
      if (lawItem) {
        return res.json(buildStructuredFallbackLaw(lawItem));
      }
      return res.status(500).json({ error: "Generation failed", detail: String(err?.message || err) });
    }
  });

  // 4. Unified AI Coach Chat endpoints (/api/chat and /api/ai/ask)
  const handleAIChat = async (req: express.Request, res: express.Response) => {
    try {
      const message = req.body?.message || req.body?.question;
      const lawContext = req.body?.law_context || req.body?.context || "";

      if (!message) {
        return res.status(400).json({ error: "Message or question is required" });
      }

      // Select relevant ENABLED Master Skills and genuinely read their SKILL.md files from disk
      const skillContext = await loadAgentSkillContext(rootDir, String(message), {
        maxSkills: 3,
      });

      const appliedSkillsMeta = skillContext.loadedSkills.map((s) => ({
        id: s.id,
        name: s.name,
        categoryLabel: s.categoryLabel,
        path: s.path,
        loadedFromDisk: s.loadedFromDisk,
        bytesLoaded: s.bytesLoaded,
        sha256Prefix: s.sha256Prefix,
      }));

      const ai = getAI();
      if (!ai) {
        const fallbackText = `【智心堂 AI 认知教练分析】\n针对您提出的问题：“${message}”：\n\n1. **认知机制解析**：人类大脑为了节省前额叶能量，常依赖“系统1（快速直觉启发式）”而非“系统2（深度理性分析）”。\n2. **定律关联洞察**：${lawContext ? `结合当前聚焦的【${typeof lawContext === "string" ? lawContext : JSON.stringify(lawContext)}】，` : ""}这种现象往往源于大脑对确定性与认知闭合的本能渴求。\n3. **实操行动建议**：在面临关键判断时，刻意暂停 3 秒并列出 2 个反向证据，能显著提升决策质量。`;
        return res.json({
          text: fallbackText,
          answer: fallbackText,
          isFallback: true,
          appliedSkills: appliedSkillsMeta,
          skillsHonestyNotice: skillContext.honestyNotice,
        });
      }

      const contextStr =
        typeof lawContext === "string" ? lawContext : JSON.stringify(lawContext, null, 2);
      const prompt = `用户问题：${message}\n\n当前定律上下文：${contextStr || "通用心理学与认知科学训练"}\n\n请用结构清晰、富有洞察力且包含1个立即能用的生活实操建议的方式回答：`;

      const effectiveSystemInstruction = skillContext.hasVerifiedLoadedContext
        ? `${systemInstruction}\n\n${skillContext.agentSystemPromptBlock}`
        : systemInstruction;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { systemInstruction: effectiveSystemInstruction },
      });

      const text = response.text || "暂时无法生成回答，请稍后再试。";
      return res.json({
        text,
        answer: text,
        isFallback: false,
        appliedSkills: appliedSkillsMeta,
        skillsHonestyNotice: skillContext.honestyNotice,
      });
    } catch (err: any) {
      console.error("Chat error:", err);
      const fallbackText =
        "AI 认知导师暂时繁忙，请稍后重试。认知科学小贴士：保持元认知觉察（思考你的思考）是跨越思维偏误的第一步！";
      return res.status(500).json({
        text: fallbackText,
        answer: fallbackText,
        error: "Chat failed",
        detail: String(err?.message || err),
      });
    }
  };

  app.post("/api/chat", handleAIChat);
  app.post("/api/ai/ask", handleAIChat);

  // 4.0 AI Studio Master Skills Registry, Selection & Genuine Context Loader API
  app.get("/api/skills", async (_req, res) => {
    try {
      const inventory = await getSkillsInventory(rootDir);
      return res.json(inventory);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to load skills registry", detail: String(err?.message || err) });
    }
  });

  app.get("/api/skills/:id", async (req, res) => {
    try {
      const skillId = String(req.params.id || "").trim();
      const detail = await getSkillDetailFromDisk(rootDir, skillId);
      return res.json(detail);
    } catch (err: any) {
      const msg = String(err?.message || err);
      const status = msg.startsWith("Unknown skill") || msg.startsWith("Invalid skill") ? 404 : 500;
      return res.status(status).json({ error: msg });
    }
  });

  app.patch("/api/skills/:id/toggle", async (req, res) => {
    try {
      const skillId = String(req.params.id || "").trim();
      const enabled = req.body?.enabled;
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "Body field 'enabled' must be a strict boolean" });
      }
      const updatedInventory = await setSkillEnabledState(rootDir, skillId, enabled);
      return res.json(updatedInventory);
    } catch (err: any) {
      const msg = String(err?.message || err);
      const status = msg.startsWith("Unknown skill") || msg.startsWith("Invalid skill") ? 400 : 500;
      return res.status(status).json({ error: msg });
    }
  });

  app.post("/api/skills/select-and-load", async (req, res) => {
    try {
      const task = typeof req.body?.task === "string" ? req.body.task.trim() : "";
      const maxSkills = req.body?.maxSkills !== undefined ? Number(req.body.maxSkills) : 3;
      const explicitSkillIds = Array.isArray(req.body?.explicitSkillIds)
        ? req.body.explicitSkillIds.filter((x: unknown): x is string => typeof x === "string")
        : undefined;

      if (!task && (!explicitSkillIds || explicitSkillIds.length === 0)) {
        return res.status(400).json({ error: "Provide a non-empty 'task' string or 'explicitSkillIds' array" });
      }

      const result = await loadAgentSkillContext(rootDir, task || "Chargement explicite", {
        maxSkills: Number.isFinite(maxSkills) ? maxSkills : 3,
        explicitSkillIds,
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to select and load skill context", detail: String(err?.message || err) });
    }
  });

  // 4.1 AI-Powered Deep Emotional Analysis & Daily Psychological Insight
  app.post("/api/journal/analyze", async (req, res) => {
    try {
      const { entry } = req.body || {};
      if (!entry || !entry.title) {
        return res.status(400).json({ error: "Missing journal entry payload" });
      }

      const structuredSummary = Object.entries(entry.structuredData || {})
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n");

      const prompt = `你是一位世界顶级的临床心理学家与认知神经科学专家（智心堂心理导师）。请对用户刚刚记录的心智健康手记进行深度情感分析与心理机制解构，并生成一份温厚、深刻且极具指导性的“每日心理洞察摘要”。

【用户手记详情】
- 标题: ${entry.title}
- 日期: ${entry.date} ${entry.time || ""}
- 手记模板: ${entry.templateType}
- 用户标注情绪: 主情绪【${entry.emotion?.primary || "平静"}】 (强度 ${entry.emotion?.intensity || 5}/10, 效价: ${entry.emotion?.valence || "neutral"}, 能量状态: ${entry.emotion?.energyLevel || 3}/5)
${entry.emotion?.secondary ? `- 次级情绪: ${entry.emotion.secondary}` : ""}
- 用户标签: ${(entry.tags || []).join(", ")}
${entry.relatedLawName ? `- 关联心理学定律: ${entry.relatedLawName}` : ""}
- 问答内容与心智复盘:
${structuredSummary || "（自由觉察内容）"}

请严格以 JSON 格式输出，不要包含 Markdown 代码块标记（不要写 \`\`\`json），直接输出合法的 JSON 对象，格式如下：
{
  "emotionalValence": "简洁提炼当前情绪转化趋势（例如：由焦虑内耗向理性重构迈进、深度心流与平静觉察）",
  "emotionalDimensions": {
    "primaryEmotion": "提炼的核心情绪名称",
    "intensityScore": 1到10的整数情绪唤醒度,
    "stressLevel": 1到10的心理压力值估测,
    "metacognitiveAwareness": 1到10的元认知觉察深度（思考自己思考的能力）,
    "resilienceScore": 1到10的心理韧性复原力指数
  },
  "cognitiveDistortionsIdentified": ["识别出的潜在思维偏误，如：全或无思维、灾难化推演、读心谬误、确认偏误、情绪推理、应该句式（若无则列出1-2项值得留意的认知盲区）"],
  "psychologicalMechanism": "从神经心理学与认知科学原理（如杏仁核警报、前额叶理性刹车、负面偏差、系统1直觉启发式等）分析为何会产生这种情绪与心理反应（100-150字）",
  "dailyInsightSummary": "为用户量身定制的每日深度心理洞察摘要：肯定其自我觉察勇气，温和指出思维图式中的突破点，给予沉淀内省的心智复盘（150-200字）",
  "actionableMicroAdvice": [
    "微行动建议1（15字内，具体可行）",
    "微行动建议2（15字内，具体可行）",
    "微行动建议3（15字内，具体可行）"
  ],
  "recommendedLawId": "推荐对照研习的心理学定律ID，如 LAW001、LAW003、LAW010、LAW017 等",
  "recommendedLawName": "推荐定律名称，如 首因效应、情绪ABC理论、峰终定律、认知失调 等",
  "analyzedAt": "${new Date().toISOString()}"
}`;

      const ai = getAI();
      if (!ai) {
        // High-fidelity psychological fallback
        const isPositive = entry.emotion?.valence === "positive";
        const isChallenging = entry.emotion?.valence === "challenging";
        const primary = entry.emotion?.primary || "沉思";

        const fallbackInsight = {
          emotionalValence: isPositive
            ? "心流平静 · 正向理性构建"
            : isChallenging
            ? "情绪觉察 · 正在启动理性重构"
            : "中和平衡 · 客观心智觉知",
          emotionalDimensions: {
            primaryEmotion: primary,
            intensityScore: Math.min(10, Math.max(1, entry.emotion?.intensity || 6)),
            stressLevel: isChallenging ? 7 : isPositive ? 2 : 4,
            metacognitiveAwareness: 8,
            resilienceScore: isPositive ? 8 : 7,
          },
          cognitiveDistortionsIdentified: isChallenging
            ? ["负面滤镜偏误", "情绪推理（以感受代替客观证据）"]
            : ["过早认知闭合倾向"],
          psychologicalMechanism:
            "人类神经系统在遭遇不确定性或压力唤醒时，边缘系统（尤其是杏仁核）会快速抢占认知资源，诱导大脑采用节能的直觉启发式图式。通过此刻的手记书写，您成功激活了背外侧前额叶（dlPFC），将混沌的内部体感转化为具象语言符号，实现了生理层面的情绪降温。",
          dailyInsightSummary: `在这篇手记中，您对【${entry.title}】展现出了高度宝贵的自我觉察。当情绪被命名并被审视时，它就失去了暗中操纵决策的神秘力量。您记录的感受并非“事实本身”，而是大脑根据过往经验快速生成的推论假设。今天的记录证明您已经具备了跳出第一直觉、开启元认知俯瞰的优秀心智素养。`,
          actionableMicroAdvice: [
            "深呼吸4次，感受脚底与地面的触碰，完成3秒身体着陆",
            "问自己：如果最好的朋友处于相同境遇，我会怎样对他说？",
            "今晚睡前列出今日3件即便微小但也真实发生的好事",
          ],
          recommendedLawId: isChallenging ? "LAW017" : "LAW005",
          recommendedLawName: isChallenging ? "情绪ABC理论" : "峰终定律",
          analyzedAt: new Date().toISOString(),
        };

        return res.json({ analysis: fallbackInsight, isFallback: true });
      }

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            "你是一个兼具深厚学术造诣与人文关怀的心理学专家。你只返回合法的 JSON 对象，不加任何解释性文字或 Markdown 标记。",
        },
      });

      let rawText = (response.text || "").trim();
      if (rawText.startsWith("```json")) {
        rawText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
      } else if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```\s*/i, "").replace(/\s*```$/, "");
      }

      let analysisJson;
      try {
        analysisJson = JSON.parse(rawText);
      } catch (parseErr) {
        console.warn("AI response JSON parse error, using fallback parser:", parseErr);
        // attempt regex extraction
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          analysisJson = JSON.parse(match[0]);
        } else {
          throw new Error("Unable to parse AI response into JSON");
        }
      }

      return res.json({ analysis: analysisJson, isFallback: false });
    } catch (err: any) {
      console.error("Journal analysis error:", err);
      // Return safe structured fallback
      const fallback = {
        emotionalValence: "情绪觉察与心智复盘",
        emotionalDimensions: {
          primaryEmotion: req.body?.entry?.emotion?.primary || "觉察",
          intensityScore: 6,
          stressLevel: 4,
          metacognitiveAwareness: 8,
          resilienceScore: 7,
        },
        cognitiveDistortionsIdentified: ["过度概括倾向", "应该句式"],
        psychologicalMechanism:
          "手记书写促进了前额叶皮层对情绪中枢杏仁核的下行抑制。通过客观复盘，思维盲区逐渐显性化，大脑建立了新的神经反射通路。",
        dailyInsightSummary:
          "每一次坦诚直面内心思绪的手记书写，都是在为心智肌肉做一次深度力量训练。保持这种客观觉察，您正在逐步建立不易受环境摆布的理性韧性体系。",
        actionableMicroAdvice: [
          "记录后给自己泡一杯温水，静坐5分钟享受思维沉淀",
          "在关键决定前刻意暂停3秒，启动元认知双重校验",
        ],
        recommendedLawId: "LAW001",
        recommendedLawName: "首因效应与认知锚定",
        analyzedAt: new Date().toISOString(),
      };
      return res.json({ analysis: fallback, isFallback: true });
    }
  });

  // 4.2 AI-Powered Daily Emotional Weather Map & Cognitive Science Feedback
  app.post("/api/journal/weather-analysis", async (req, res) => {
    try {
      const { entries = [], targetDate = new Date().toISOString().split("T")[0] } = req.body || {};
      const safeEntries = Array.isArray(entries) ? entries : [];

      // Extract texts and psychological markers
      const summaryTextParts: string[] = [];
      safeEntries.forEach((e: any, idx: number) => {
        const title = e.title || `手记 #${idx + 1}`;
        const primary = e.emotion?.primary || "平静";
        const intensity = e.emotion?.intensity ?? 5;
        const valence = e.emotion?.valence || "neutral";
        const structured = Object.entries(e.structuredData || {})
          .map(([k, v]) => `  - ${k}: ${v}`)
          .join("\n");
        summaryTextParts.push(
          `【手记 ${idx + 1}】标题: ${title} | 模版: ${e.templateType || "常规"} | 情绪: ${primary} (强度 ${intensity}/10, 极性: ${valence}) | 关联定律: ${e.relatedLawName || "未指定"}\n${structured || "（自由反思内容）"}`
        );
      });

      const combinedText =
        summaryTextParts.length > 0
          ? summaryTextParts.join("\n\n")
          : "用户今日暂无详细手记，进行了常规的正念与心智状态反思。";

      const ai = getAI();
      if (!ai) {
        // High-fidelity Cognitive Science Fallback
        const hasChallenging = safeEntries.some((e: any) => e.emotion?.valence === "challenging");
        const hasPositive = safeEntries.some((e: any) => e.emotion?.valence === "positive");
        const avgIntensity =
          safeEntries.length > 0
            ? Math.round(safeEntries.reduce((acc: number, c: any) => acc + (c.emotion?.intensity || 5), 0) / safeEntries.length)
            : 5;

        let condition: string = "partly-cloudy";
        let conditionTitle = "多云晴好 · 微风沉思";
        let conditionPoeticDesc = "内心气象云淡风轻，理性前额叶自如监控思维流动，情绪如微漾清波，整体处于自我调和的舒适区间。";

        if (hasChallenging && hasPositive) {
          condition = "rainbow";
          conditionTitle = "破云晴虹 · 认知重构明朗";
          conditionPoeticDesc = "虽经历思维阴霾或情绪张力，但通过及时的自我察觉与元认知重塑，内心正迎来雨后初霁的壮丽彩虹。";
        } else if (hasChallenging) {
          condition = "stormy";
          conditionTitle = "雷暴微歇 · 情绪蓄能释压";
          conditionPoeticDesc = "边缘系统受到偶发压力刺激，内在气压略有走低；此刻正是启动前额叶理性刹车、进行深呼吸着陆的关键窗口。";
        } else if (hasPositive) {
          condition = "sunny";
          conditionTitle = "澄澈暖阳 · 高阶心流朗照";
          conditionPoeticDesc = "大脑奖励回路多巴胺充盈，心理防御低而好奇心高，思绪通透敏锐，适宜展开深度创作与高难度决策。";
        }

        const fallbackReport = {
          date: targetDate,
          condition,
          conditionTitle,
          conditionPoeticDesc,
          metrics: {
            barometerHpa: hasChallenging ? 1002 : hasPositive ? 1024 : 1014,
            visibilityKm: hasChallenging ? 68 : hasPositive ? 96 : 85,
            humidityPercent: Math.min(95, Math.max(25, avgIntensity * 9)),
            windSpeedKmh: Math.min(55, Math.max(8, avgIntensity * 5)),
            temperatureC: hasPositive ? 25.5 : hasChallenging ? 28.5 : 22.0,
          },
          radarDimensions: [
            { dimension: "认知清晰度", value: hasChallenging ? 65 : 88, benchmark: 70 },
            { dimension: "元认知觉察", value: 85, benchmark: 75 },
            { dimension: "情绪复原力", value: hasPositive ? 86 : 74, benchmark: 70 },
            { dimension: "内心平稳度", value: hasChallenging ? 60 : 82, benchmark: 65 },
            { dimension: "正向动能感", value: hasPositive ? 88 : 70, benchmark: 70 },
          ],
          primaryEmotions: safeEntries.length > 0
            ? [
                { name: safeEntries[0]?.emotion?.primary || "觉察", percentage: 55, color: "#10B981" },
                { name: safeEntries[1]?.emotion?.primary || "沉思", percentage: 30, color: "#6366F1" },
                { name: "平静", percentage: 15, color: "#F59E0B" },
              ]
            : [
                { name: "平静觉察", percentage: 60, color: "#10B981" },
                { name: "理性内省", percentage: 40, color: "#6366F1" },
              ],
          cognitiveMechanism:
            "基于认知神经科学，当您主动书写心情手记时，背外侧前额叶皮层（dlPFC）迅速介入并下调了杏仁核（Amygdala）的剧烈警报放电。将混沌的主观体感通过文字具象命名，直接削减了默认模式网络（DMN）的情绪反刍循环，促成生理层面的心智回稳。",
          identifiedBiases: hasChallenging
            ? ["情绪推理偏误（误将主观感受等同于客观现实）", "全或无二元思维"]
            : ["过早认知闭合倾向"],
          cognitiveFeedback:
            "今日您的心智探索展现出了卓越的元认知韧性。不论外界天气如何瞬息万变，情绪从来不是需要被消灭的敌人，而是神经系统为您发来的加密信使。通过今日的客观书写，您已成功夺回了大脑系统二的决策方向盘。",
          actionablePrescriptions: [
            {
              id: "act-1",
              title: "3秒神经着陆",
              desc: "深呼吸4拍并感受双脚触地，唤醒副交感神经",
              technique: "躯体感官 5-4-3-2-1 着陆法",
              estimatedMinutes: 2,
            },
            {
              id: "act-2",
              title: "苏格拉底质疑",
              desc: "问自己：如果最信赖的导师在此，他会指出我的哪处盲点？",
              technique: "认知解离与第三人称旁观视角",
              estimatedMinutes: 3,
            },
            {
              id: "act-3",
              title: "睡前突触巩固",
              desc: "今晚就寝前回想今日1件顺利完成的微小行动",
              technique: "神经可塑性正向强化记忆法",
              estimatedMinutes: 3,
            },
          ],
          recommendedLaw: {
            id: hasChallenging ? "LAW017" : "LAW005",
            nameZh: hasChallenging ? "情绪ABC理论" : "峰终定律",
            reason: hasChallenging
              ? "厘清触发事件（A）与内心信念（B）的差异，瓦解自动消极情绪（C）"
              : "用一个充满仪式感的积极收尾，为今日的心智体验画上圆满句号",
          },
          analyzedEntriesCount: safeEntries.length,
          generatedAt: new Date().toISOString(),
          isFallback: true,
        };

        return res.json({ report: fallbackReport, isFallback: true });
      }

      // Gemini AI Prompt
      const prompt = `你是一位世界顶级的认知神经科学家与临床心理学家（智心堂心理实验室特聘专家）。
请深入阅读并分析用户【${targetDate}】当天的心理手记文本与情绪数据，将其投射为专业、浪漫且具备严谨认知科学解释的“今日情绪气象图（Emotional Weather Map）”，并给出切实可行的每日认知科学反馈建议。

【用户当日心情手记文本汇总】
${combinedText}

请严格按以下 JSON 结构输出，绝对不要包含任何 Markdown 代码块标记（绝对不要写 \`\`\`json 或 \`\`\`），直接输出纯合法的 JSON 字符串：
{
  "condition": "sunny" | "partly-cloudy" | "overcast" | "foggy" | "rainy" | "stormy" | "rainbow",
  "conditionTitle": "4到12字诗意气象标题（如：破云见阳 · 认知重构明朗照耀、微风静好 · 澄明心流、雷暴微歇 · 情绪蓄能释压）",
  "conditionPoeticDesc": "40到80字的情绪气象文学化诗意评述，描绘今天内心气象的生动意象与心境氛围",
  "metrics": {
    "barometerHpa": 990到1035之间的气压数值（标准1013，高压代表心理稳定沉着，低压代表受压或情绪气旋）,
    "visibilityKm": 20到100之间的整数（认知能见度与思维清晰度，越高代表越通透敏锐）,
    "humidityPercent": 20到95之间的整数（心理湿度与感性敏感度，50%左右最舒适）,
    "windSpeedKmh": 5到55之间的整数（内在思维活跃速度与思潮涌动强度）,
    "temperatureC": 18到32之间的数值（心灵感知温度，24℃舒适）
  },
  "radarDimensions": [
    { "dimension": "认知清晰度", "value": 20到100的数值, "benchmark": 70 },
    { "dimension": "元认知觉察", "value": 20到100的数值, "benchmark": 75 },
    { "dimension": "情绪复原力", "value": 20到100的数值, "benchmark": 70 },
    { "dimension": "内心平稳度", "value": 20到100的数值, "benchmark": 65 },
    { "dimension": "正向动能感", "value": 20到100的数值, "benchmark": 70 }
  ],
  "primaryEmotions": [
    { "name": "核心情绪1", "percentage": 占比数字, "color": "#10B981" },
    { "name": "核心情绪2", "percentage": 占比数字, "color": "#6366F1" },
    { "name": "核心情绪3", "percentage": 占比数字, "color": "#F59E0B" }
  ],
  "cognitiveMechanism": "基于认知神经科学原理（如背外侧前额叶dlPFC对杏仁核的调控、默认模式网络DMN、多巴胺奖赏回路与神经递质动态），用120到180字通俗而专业地解析今日情绪气象的底层脑科学机制",
  "identifiedBiases": [
    "识别出的潜在思维偏误1（如：灾难化推演、情绪推理、应该句式、确认偏误、双极思维，若无则列出值得保持的防偏策略）",
    "识别出的潜在思维偏误2"
  ],
  "cognitiveFeedback": "150到220字基于认知科学的每日反馈建议：先肯定其自我觉察勇气，随后从认知重塑视角点明今日思维模式的闪光点与突破口，给予温暖而有力量的心智支持",
  "actionablePrescriptions": [
    {
      "id": "act-1",
      "title": "具体建议标题（8字内）",
      "desc": "实操步骤说明（30字内）",
      "technique": "对应科学技术（如：身体着陆 5-4-3-2-1 / 苏格拉底式解离提问 / 箱式呼吸法 / 睡前突触强化）",
      "estimatedMinutes": 3
    },
    {
      "id": "act-2",
      "title": "具体建议标题（8字内）",
      "desc": "实操步骤说明（30字内）",
      "technique": "对应科学技术",
      "estimatedMinutes": 5
    },
    {
      "id": "act-3",
      "title": "具体建议标题（8字内）",
      "desc": "实操步骤说明（30字内）",
      "technique": "对应科学技术",
      "estimatedMinutes": 2
    }
  ],
  "recommendedLaw": {
    "id": "LAW017 或 LAW005 等",
    "nameZh": "推荐研习的定律名称（如 情绪ABC理论、峰终定律、确认偏误）",
    "reason": "为何今天特别适合研习该定律的科学原因（35字内）"
  }
}`;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            "你是一个兼具深厚神经科学造诣与诗性人文关怀的心理学专家。你只返回合法的 JSON 对象，不加任何解释性文字或 Markdown 标记。",
        },
      });

      let rawText = (response.text || "").trim();
      if (rawText.startsWith("```json")) {
        rawText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
      } else if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```\s*/i, "").replace(/\s*```$/, "");
      }

      let parsedReport;
      try {
        parsedReport = JSON.parse(rawText);
      } catch (parseErr) {
        console.warn("AI Weather response parse error, trying regex:", parseErr);
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          parsedReport = JSON.parse(match[0]);
        } else {
          throw new Error("Unable to parse AI weather response");
        }
      }

      parsedReport.date = targetDate;
      parsedReport.analyzedEntriesCount = safeEntries.length;
      parsedReport.generatedAt = new Date().toISOString();
      parsedReport.isFallback = false;

      return res.json({ report: parsedReport, isFallback: false });
    } catch (err: any) {
      console.error("Journal weather analysis error:", err);
      return res.status(500).json({
        error: "Weather analysis failed",
        detail: String(err?.message || err),
      });
    }
  });

  // 4.3 AI-Generated Interactive Microexpression Diagnostic Scenario (ML001-ML010)
  const microexpressionScenarioSchema = {
    type: Type.OBJECT,
    properties: {
      narrativeTitle: {
        type: Type.STRING,
        description: "富有画面感与情感张力的中文场景标题（10到22字，不要剧透AU编号或定律名称）。",
      },
      setting: {
        type: Type.STRING,
        description: "具体时空、场所与交流环境（如：深夜急诊分诊台 · 强顶灯光线与紧张家属对话）。",
      },
      conflictActors: {
        type: Type.STRING,
        description: "冲突双方角色与核心情感冲突张力摘要（例如：项目主设计师 vs. 临时推翻方案的投资人 — 尊严防卫与信任裂痕冲突）。",
      },
      actorAction: {
        type: Type.STRING,
        description:
          "130到210字的角色情感冲突互动剧情描述。必须包含双方语言交锋或心理立场矛盾，并在关键瞬间精细描绘目标角色在面部的客观肌肉位移与场景外因。绝对禁止在文本中直接写出 AU1/AU2/AU4/AU5/AU6/AU12/AU15 等编码代号或直接点出定律中文全称。",
      },
      observableFacialCues: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "2到4条客观可见的面部动作位移与现场冲突情境线索（按难度指令要求数量输出，不泄露AU编号或定律名）。",
      },
      questionPrompt: {
        type: Type.STRING,
        description:
          "要求用户在上述情感冲突诊断场景中，精准识别关键人物表现出的特定面部动作单元（AU）或其背后的科学心理原则与限定边界的单选题题干。",
      },
      correctOption: {
        type: Type.STRING,
        description:
          "唯一正确答案：必须明确点出该定律对应的 AU 编号（或心理原则名称），同时清晰交代其在当前情感冲突场景中的科学解释与限制边界（45到85字）。",
      },
      distractors: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "按提示词要求的干扰项数量（2到5个），生成具有高度迷惑性的错误干扰选项，例如张冠李戴相邻 AU 编号、把皱眉/微笑直接等价于绝对欺骗/怒火/快乐，或违背科学循证边界（每个45到85字，彼此互不重复）。",
      },
      explanation: {
        type: Type.STRING,
        description: "90到160字解析，紧扣角色情感冲突与原著学者实证研究解释为何选该项。",
      },
      scientificLimitation: {
        type: Type.STRING,
        description: "35到75字明确指出该动作单元或心理学原则在情感冲突观察中的科学局限边界。",
      },
      socraticQuestion: {
        type: Type.STRING,
        description: "1句苏格拉底式启发追问（禁止出现 AU 编号或定律名称）。",
      },
      socraticClue: {
        type: Type.STRING,
        description: "1句引导定位肌肉位置或排除伪科学读心选项的推理线索（禁止出现 AU 编号或定律名称）。",
      },
    },
    required: [
      "narrativeTitle",
      "setting",
      "conflictActors",
      "actorAction",
      "observableFacialCues",
      "questionPrompt",
      "correctOption",
      "distractors",
      "explanation",
      "scientificLimitation",
      "socraticQuestion",
      "socraticClue",
    ],
  };

  app.post("/api/microexpressions/generate-scenario", async (req, res) => {
    try {
      const {
        lawId,
        codeId,
        excludeLawIds = [],
        cityContext = "",
        difficultyCoefficient: rawDifficultyCoeff,
        recentAccuracy: rawRecentAccuracy,
        scenarioComplexity: rawScenarioComplexity,
        distractorCount: rawDistractorCount,
      } = req.body || {};

      const recentAccuracy = Number.isFinite(Number(rawRecentAccuracy))
        ? Math.max(0, Math.min(100, Math.round(Number(rawRecentAccuracy))))
        : 72;

      const difficultyCoefficient = Number.isFinite(Number(rawDifficultyCoeff))
        ? Math.max(0.4, Math.min(1.0, Number(Number(rawDifficultyCoeff).toFixed(2))))
        : Number(
            (recentAccuracy < 60
              ? 0.4 + (recentAccuracy / 60) * 0.18
              : recentAccuracy < 82
              ? 0.6 + ((recentAccuracy - 60) / 22) * 0.19
              : 0.8 + ((recentAccuracy - 82) / 18) * 0.2
            ).toFixed(2)
          );

      const scenarioComplexity: "basic" | "intermediate" | "advanced" =
        rawScenarioComplexity === "basic" ||
        rawScenarioComplexity === "intermediate" ||
        rawScenarioComplexity === "advanced"
          ? rawScenarioComplexity
          : difficultyCoefficient < 0.6
          ? "basic"
          : difficultyCoefficient < 0.8
          ? "intermediate"
          : "advanced";

      const targetDistractorCount = Number.isFinite(Number(rawDistractorCount))
        ? Math.max(2, Math.min(5, Math.round(Number(rawDistractorCount))))
        : difficultyCoefficient < 0.6
        ? 2
        : difficultyCoefficient < 0.8
        ? 3
        : difficultyCoefficient < 0.92
        ? 4
        : 5;

      const targetCueCount =
        scenarioComplexity === "basic" ? 2 : scenarioComplexity === "advanced" ? 4 : 3;

      const ai = getAI();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY_MISSING",
          message:
            "未检测到 Gemini API 密钥。请在 AI Studio 的 Settings > Secrets 面板配置 GEMINI_API_KEY 后，再启用 AI 互动微表情诊断场景生成。",
        });
      }

      // Select requested law or randomly sample 1 law from ML001-ML010 avoiding recent exclusions
      let selectedLaw: MicroexpressionCatalogEntry | undefined;
      if (lawId || codeId) {
        const q = String(lawId || codeId).trim().toLowerCase();
        selectedLaw = MICROEXPRESSION_CATALOG.find(
          (entry) =>
            entry.lawId.toLowerCase() === q || entry.codeId.toLowerCase() === q
        );
      }

      if (!selectedLaw) {
        const excludeSet = new Set(
          Array.isArray(excludeLawIds)
            ? excludeLawIds.map((item: unknown) => String(item).toLowerCase())
            : []
        );
        let filtered = MICROEXPRESSION_CATALOG.filter(
          (entry) =>
            !excludeSet.has(entry.lawId.toLowerCase()) &&
            !excludeSet.has(entry.codeId.toLowerCase())
        );
        if (filtered.length === 0) {
          filtered = MICROEXPRESSION_CATALOG;
        }
        // Bias pool gently toward the user's adaptive complexity tier when no specific law is requested
        if (scenarioComplexity === "basic") {
          const easyPool = filtered.filter((e) => e.difficulty === "Easy");
          if (easyPool.length > 0) filtered = easyPool;
        } else if (scenarioComplexity === "advanced") {
          const complexPool = filtered.filter((e) => e.difficulty !== "Easy");
          if (complexPool.length > 0) filtered = complexPool;
        }
        selectedLaw = filtered[randomInt(0, filtered.length)];
      }

      const conflictThemes = [
        "职场绩效面谈与晋升失落的心理拉扯",
        "亲密伴侣因旧事重提引发的克制与委屈交锋",
        "医疗或心理支持场景下当事人隐忍痛感与防备",
        "跨代家庭聚餐中关于人生选择的期望冲突",
        "学术答辩或商业谈判桌上的质疑与自证压力",
        "多年挚友在合作拆伙边缘的体面掩饰与心结",
      ];
      const chosenConflictTheme =
        conflictThemes[randomInt(0, conflictThemes.length)];

      const complexityGuideline =
        scenarioComplexity === "basic"
          ? `【自适应难度系数 ${difficultyCoefficient.toFixed(2)} · 基础单线索模式（用户近况正确率 ${recentAccuracy}%）】
- 场景复杂度：保持结构清晰聚焦，刻画 1 处核心情绪误解冲突与 1 个直白可见的物理/生理外因（如强光、看字、咬牙痛），避免堆砌多重伪装诱饵。
- 线索数量：observableFacialCues 恰好输出 ${targetCueCount} 条清晰动作描述。
- AU 干扰项数量：distractors 必须恰好输出 **${targetDistractorCount} 个** 互相独立且明确的错误干扰项（与 correctOption 构成 3 选 1），重点对比正确 AU 与明显错配 AU 或“绝对读心”误区。`
          : scenarioComplexity === "intermediate"
          ? `【自适应难度系数 ${difficultyCoefficient.toFixed(2)} · 标准双线索模式（用户近况正确率 ${recentAccuracy}%）】
- 场景复杂度：刻画张力饱满的双角色情感冲突，融入 1–2 个现实情境/生理混淆因子，使观察者在共情与归因间权衡。
- 线索数量：observableFacialCues 恰好输出 ${targetCueCount} 条客观动作与情境线索。
- AU 干扰项数量：distractors 必须恰好输出 **${targetDistractorCount} 个** 高辨析度错误干扰项（与 correctOption 构成 4 选 1），涵盖错配 AU 编号与过度情绪化推论。`
          : `【自适应难度系数 ${difficultyCoefficient.toFixed(2)} · 高阶复合伪装模式（用户近况正确率 ${recentAccuracy}%）】
- 场景复杂度：构建高难度、多层次情感冲突与表情伪装场景——关键角色表面维持职业礼貌或克制姿态，同时叠加次级混淆动作线索（如社交微笑掩饰眼周/眉心张力、强光/疲惫/口型、旁人从众暗示等多重归因诱饵），极大考验观察者剥离伪装与守住科学边界的能力！
- 线索数量：observableFacialCues 恰好输出 ${targetCueCount} 条细腻而易混的客观线索（含次级混淆诱饵线索）。
- AU 干扰项数量：distractors 必须恰好输出 **${targetDistractorCount} 个** 彼此完全不重复的高相似深度干扰项（与 correctOption 构成 ${1 + targetDistractorCount} 选 1）：必须混合相邻或易混淆 AU 编号（例如 AU1 vs AU2 vs AU4 vs AU5 vs AU6 vs AU12 vs AU15）、半真半假但夸大因果推断的选项，以及符合直觉却违背循证边界的陷阱！`;

      const prompt = `请你作为认知神经科学与微表情观察专家，针对以下随机抽中的微表情心理学定律，全新创作一道高质量「互动微表情诊断场景选择题」。

【本次随机抽中的目标定律】
- 定律编号：${selectedLaw.codeId}（内部 ID：${selectedLaw.lawId}）
- 对应动作单元/心理原则：${selectedLaw.actionUnitCode}
- 中文标题：${selectedLaw.titleZh}（${selectedLaw.titleEn}）
- 所属分类：${selectedLaw.category}分类（排行 #${selectedLaw.categoryRank}） · 建议难度：${selectedLaw.difficulty}
- 核心研究学者与年份：${selectedLaw.researcher} (${selectedLaw.year})
- 可观察体征：${selectedLaw.observableSigns.join("、")}
- 科学核心原理：${selectedLaw.corePrinciple}
- 严谨科学边界：${selectedLaw.limitations}
- 参考冲突底色灵感：${chosenConflictTheme}${
        cityContext ? `；可自然融入「${String(cityContext)}」的人文交流氛围` : ""
      }

${complexityGuideline}

【严格命题规范】
1. **必须体现角色情感冲突**：在 actorAction 中刻画两位角色之间有温度、有张力的情感冲突或信任误解（如委屈、防备、克制、失望、强颜体面或压力争执），并让一方产生过度臆测情绪标签的冲动。
2. **禁止题干/剧情提前剧透答案**：在 narrativeTitle、actorAction、observableFacialCues、socraticQuestion、socraticClue 中，**绝对不要**直接出现「${selectedLaw.actionUnitCode}」或「${selectedLaw.codeId}」或完整定律标题，也不要写“这触发了 AU4”——请只描写眼睛可见的解剖学肌肉部位变化（如眉内侧靠鼻梁端上移、外侧眉梢上挑、两眉向中线下压聚拢挤出竖纹、上眼睑骤升、脸颊上提并收紧眼外角、嘴角向耳后上方拉起、嘴角向下垂拉等）及环境/生理干扰因素！
3. **精准考察识别 AU 或心理原则**：questionPrompt 须引导作答者识别关键角色的特定面部动作单元（AU）或背后核心心理原则，且唯一正确答案 correctOption 必须明确标出「${selectedLaw.actionUnitCode}」及「${selectedLaw.titleZh}」并坚守科学限定边界；distractors 数量务必不少于 ${targetDistractorCount} 个。
4. **严格遵守循证心理学**：始终坚持“动作单元描述 ≠ 直接读心或绝对测谎”，引用或呼应 ${selectedLaw.researcher} (${selectedLaw.year}) 的严谨边界。`;

      let responseText = "";
      let generated: any = null;
      let distractors: string[] = [];
      let lastErr: any = null;
      const maxAttempts = 3;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: prompt,
            config: {
              systemInstruction:
                `你是智心堂（MindLabZ）微表情与情绪科学出题专家。严格按 JSON Schema 与难度系数（${difficultyCoefficient.toFixed(
                  2
                )}，需 ${targetDistractorCount} 个独立干扰项）输出高质量教学诊断题，既富有文学化的情感冲突张力，又严守 Paul Ekman FACS 解剖编码及 Barrett (2019)、Coles (2019) 等现代心理学科学边界。`,
              responseMimeType: "application/json",
              responseSchema: microexpressionScenarioSchema,
            },
          });
          responseText = (response.text || "").trim();
          if (!responseText) continue;

          let cleanText = responseText;
          if (cleanText.startsWith("```json")) {
            cleanText = cleanText.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
          } else if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```\s*/i, "").replace(/\s*```$/, "");
          }

          const parsed = JSON.parse(cleanText);
          const cleanCorrect = String(parsed.correctOption || "").trim();
          const parsedDistractors = Array.isArray(parsed.distractors)
            ? Array.from(
                new Set<string>(
                  parsed.distractors
                    .map((d: unknown) => String(d).trim())
                    .filter((d: string) => d.length > 0 && d !== cleanCorrect)
                )
              )
            : [];

          generated = parsed;
          distractors = parsedDistractors.slice(0, targetDistractorCount);

          if (
            generated.narrativeTitle &&
            generated.actorAction &&
            generated.questionPrompt &&
            cleanCorrect &&
            distractors.length >= targetDistractorCount
          ) {
            break;
          }
          // Retry if AI returned fewer distractors than targetDistractorCount
          if (attempt < maxAttempts - 1) {
            continue;
          }
        } catch (err: any) {
          lastErr = err;
          const status = err?.status || err?.code;
          const isRetryable = status === 429 || status === 503 || status === 500;
          if (isRetryable && attempt < maxAttempts - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, 600 * Math.pow(2, attempt))
            );
            continue;
          }
          throw err;
        }
      }

      if (!generated) {
        throw lastErr || new Error("Gemini returned an empty scenario payload");
      }

      if (
        !generated.narrativeTitle ||
        !generated.actorAction ||
        !generated.questionPrompt ||
        !generated.correctOption ||
        distractors.length < Math.min(2, targetDistractorCount)
      ) {
        return res.status(502).json({
          error: "INVALID_AI_PAYLOAD",
          message: "AI 返回的诊断场景结构或干扰项数量不完整，请点击重试重新生成。",
        });
      }

      // Server-side CSPRNG option shuffle
      const tagged = [
        { text: String(generated.correctOption).trim(), isCorrect: true },
        ...distractors.map((text: string) => ({ text, isCorrect: false })),
      ];
      for (let i = tagged.length - 1; i > 0; i--) {
        const j = randomInt(0, i + 1);
        const tmp = tagged[i];
        tagged[i] = tagged[j];
        tagged[j] = tmp;
      }
      const correctAnswer = Math.max(
        0,
        tagged.findIndex((item) => item.isCorrect)
      );

      return res.json({
        law: selectedLaw,
        model: "gemini-4-hydrogen",
        adaptiveDifficulty: {
          difficultyCoefficient,
          recentAccuracy,
          scenarioComplexity,
          distractorCount: distractors.length,
          cueCount: targetCueCount,
        },
        scenario: {
          narrativeTitle: String(generated.narrativeTitle).trim(),
          setting: String(generated.setting || "社会互动现场").trim(),
          conflictActors: String(generated.conflictActors || "").trim(),
          actorAction: String(generated.actorAction).trim(),
          observableFacialCues: Array.isArray(generated.observableFacialCues)
            ? generated.observableFacialCues
                .map((c: unknown) => String(c).trim())
                .filter(Boolean)
                .slice(0, targetCueCount)
            : selectedLaw.observableSigns.slice(0, targetCueCount),
          questionPrompt: String(generated.questionPrompt).trim(),
          options: tagged.map((item) => item.text),
          correctAnswer,
          explanation: String(generated.explanation || selectedLaw.corePrinciple).trim(),
          scientificLimitation: String(
            generated.scientificLimitation || selectedLaw.limitations
          ).trim(),
          socraticQuestion: String(generated.socraticQuestion || "").trim(),
          socraticClue: String(generated.socraticClue || "").trim(),
        },
      });
    } catch (err: any) {
      console.error("Microexpression AI scenario generation error:", err);
      const status = Number(err?.status || err?.httpStatusCode) || 500;
      const rawMessage = String(err?.message || err);

      if (status === 400 || status === 403 || rawMessage.includes("API_KEY")) {
        return res.status(status === 403 ? 403 : 400).json({
          error: "GEMINI_AUTH_ERROR",
          message:
            "Gemini API 密钥无效或无权限，请在 Settings > Secrets 面板核查密钥配置后重试。",
        });
      }
      if (status === 429) {
        return res.status(429).json({
          error: "GEMINI_RATE_LIMITED",
          message: "Gemini API 请求配额暂时达到上限，请稍等几秒后重试。",
        });
      }
      return res.status(500).json({
        error: "AI_GENERATION_FAILED",
        message: `AI 生成互动微表情诊断场景失败：${rawMessage}`,
      });
    }
  });

  // 4.4 AI Diagnostic Summary & Mistake-Distribution Law Recommendations (ML001-ML010)
  const COMPLEMENTARY_CLASSIC_LAWS: Array<{
    lawId: string;
    codeId: string;
    titleZh: string;
    category: string;
    whyRelevant: string;
  }> = [
    {
      lawId: "confirmation-bias",
      codeId: "LAW002",
      titleZh: "确认偏误",
      category: "认知",
      whyRelevant: "看到他人皱眉或微笑时，只搜寻印证自己预设立场的面部细节而忽视客观外因。",
    },
    {
      lawId: "halo-effect",
      codeId: "LAW008",
      titleZh: "光环效应",
      category: "社会",
      whyRelevant: "被对方得体的微笑（AU12）或良好第一印象光环影响，高估其真诚度或专业度。",
    },
    {
      lawId: "primacy-effect",
      codeId: "LAW012",
      titleZh: "首因效应",
      category: "认知",
      whyRelevant: "最初半秒观察到的挑眉或抿唇瞬间主导整场互动判断，难以在后续更新认知。",
    },
    {
      lawId: "anchoring-effect",
      codeId: "LAW003",
      titleZh: "锚定效应",
      category: "决策",
      whyRelevant: "将静态基线嘴型或单次微动作锚定为整场谈判或沟通的情绪基调。",
    },
    {
      lawId: "bandwagon-effect",
      codeId: "LAW009",
      titleZh: "从众效应",
      category: "社会",
      whyRelevant: "跟随团队多数人“看脸定性”的草率共识，忽视 Barrett (2019) 多对多映射科学边界。",
    },
    {
      lawId: "availability-heuristic",
      codeId: "LAW010",
      titleZh: "可得性启发式",
      category: "认知",
      whyRelevant: "受影视剧“微表情读心术”鲜活案例影响，高估单一动作单元直接测谎的可靠性。",
    },
    {
      lawId: "bystander-effect",
      codeId: "LAW014",
      titleZh: "旁观者效应",
      category: "社会",
      whyRelevant: "在公共场合捕捉到警觉睁眼（AU5）或求助表情线索后，易因周围人沉默而延迟行动。",
    },
    {
      lawId: "peak-end-rule",
      codeId: "LAW006",
      titleZh: "峰终定律",
      category: "决策",
      whyRelevant: "结尾瞬间的杜乡微笑（AU6+AU12）常左右整段服务或沟通记忆评价。",
    },
  ];

  const diagnosticSummarySchema = {
    type: Type.OBJECT,
    properties: {
      overallLevelLabel: {
        type: Type.STRING,
        description: "简短诊断评级（8到18字，如：解剖观察稳健 · 边界区分待巩固）。",
      },
      performanceHeadline: {
        type: Type.STRING,
        description: "一句精准概括本轮作答表现与错题特征的标题总结（18到38字）。",
      },
      diagnosticAnalysis: {
        type: Type.STRING,
        description:
          "120到210字深度 AI 诊断分析，结合用户在 ML001-ML010 上的实际错题分布、误选干扰项倾向（如混淆眉部内侧/外侧、或将肌肉位移直接等同于读心/愤怒/悲伤）与正确率进行客观剖析。",
      },
      categoryStrengths: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "2到3条用户在本轮中展现出的观察与认知优势。",
      },
      errorPatternInsights: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "2到3条基于错题分布提炼的错误归因或动作混淆规律（若本轮零错误，则指出最易在高压力社交中复发的潜在边界盲区）。",
      },
      recommendedLaws: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            lawId: {
              type: Type.STRING,
              description: "必须严格选用给定清单中的 lawId（如 ml-004、ml-010、confirmation-bias）。",
            },
            codeId: {
              type: Type.STRING,
              description: "对应编号（如 ML004、ML010、LAW002）。",
            },
            titleZh: {
              type: Type.STRING,
              description: "定律中文名称。",
            },
            priority: {
              type: Type.STRING,
              description: "必须为 'high'、'medium' 或 'consolidation' 之一。",
            },
            reason: {
              type: Type.STRING,
              description: "40到85字：结合本次错题分布或提示使用情况，解释为何重点推荐复习该定律。",
            },
            reviewAction: {
              type: Type.STRING,
              description: "20到45字：给出1条可立即执行的复习或对比辨析微动作。",
            },
          },
          required: ["lawId", "codeId", "titleZh", "priority", "reason", "reviewAction"],
        },
        description: "恰好2到4条根据错题分布自动推荐的重点复习心理学定律。",
      },
      nextStepAdvice: {
        type: Type.STRING,
        description: "45到85字下一轮针对性练习建议。",
      },
    },
    required: [
      "overallLevelLabel",
      "performanceHeadline",
      "diagnosticAnalysis",
      "categoryStrengths",
      "errorPatternInsights",
      "recommendedLaws",
      "nextStepAdvice",
    ],
  };

  app.post("/api/microexpressions/diagnostic-summary", async (req, res) => {
    try {
      const { attempts = [], metrics = {}, userMasteryMap = {} } = req.body || {};

      const ai = getAI();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY_MISSING",
          message:
            "未检测到 Gemini API 密钥。请在 AI Studio 的 Settings > Secrets 面板配置 GEMINI_API_KEY 后，再生成 AI 诊断总结。",
        });
      }

      const rawAttempts = Array.isArray(attempts) ? attempts : [];
      if (rawAttempts.length === 0) {
        return res.status(400).json({
          error: "NO_ATTEMPTS_PROVIDED",
          message: "缺少可分析的作答记录，请先完成至少一道 ML001–ML010 题目。",
        });
      }

      // Compute deterministic per-law error distribution across tested ML001-ML010 laws
      const distMap = new Map<
        string,
        {
          lawId: string;
          codeId: string;
          actionUnitCode: string;
          category: string;
          titleZh: string;
          attemptsCount: number;
          firstTryCorrectCount: number;
          totalWrongAttempts: number;
          usedHintCount: number;
          wrongOptionsSample: string[];
        }
      >();

      for (const item of rawAttempts) {
        const lawId = String(item?.lawId || "").trim();
        const catalogMatch = MICROEXPRESSION_CATALOG.find(
          (c) =>
            c.lawId.toLowerCase() === lawId.toLowerCase() ||
            c.codeId.toLowerCase() === String(item?.codeId || "").trim().toLowerCase()
        );
        if (!catalogMatch && !lawId.startsWith("ml-")) continue;

        const resolvedId = catalogMatch?.lawId || lawId;
        const prev = distMap.get(resolvedId) || {
          lawId: resolvedId,
          codeId: catalogMatch?.codeId || String(item?.codeId || resolvedId.toUpperCase()),
          actionUnitCode: catalogMatch?.actionUnitCode || String(item?.actionUnitCode || ""),
          category: catalogMatch?.category || String(item?.category || "认知"),
          titleZh: catalogMatch?.titleZh || String(item?.titleZh || resolvedId),
          attemptsCount: 0,
          firstTryCorrectCount: 0,
          totalWrongAttempts: 0,
          usedHintCount: 0,
          wrongOptionsSample: [],
        };

        prev.attemptsCount += 1;
        if (item?.firstTryCorrect) prev.firstTryCorrectCount += 1;
        prev.totalWrongAttempts += Math.max(0, Number(item?.wrongAttemptsCount) || 0);
        if (item?.usedCognitiveHint) prev.usedHintCount += 1;
        if (Array.isArray(item?.wrongOptionTexts)) {
          for (const w of item.wrongOptionTexts) {
            const text = String(w || "").trim();
            if (text && !prev.wrongOptionsSample.includes(text)) {
              prev.wrongOptionsSample.push(text);
            }
          }
        }
        distMap.set(resolvedId, prev);
      }

      const errorDistribution = Array.from(distMap.values()).sort((a, b) => {
        if (b.totalWrongAttempts !== a.totalWrongAttempts) {
          return b.totalWrongAttempts - a.totalWrongAttempts;
        }
        if (b.usedHintCount !== a.usedHintCount) {
          return b.usedHintCount - a.usedHintCount;
        }
        return a.codeId.localeCompare(b.codeId);
      });

      const testedSummaryLines = errorDistribution.map(
        (d) =>
          `- ${d.codeId} (${d.lawId}) | ${d.titleZh} [${d.actionUnitCode} · ${d.category}分类]: 作答 ${d.attemptsCount} 题, 首答命中 ${d.firstTryCorrectCount} 次, 误选干扰项 ${d.totalWrongAttempts} 次, 使用提示 ${d.usedHintCount} 次${
            d.wrongOptionsSample.length > 0
              ? ` | 曾误选内容：「${d.wrongOptionsSample.slice(0, 2).join("」；「")}」`
              : ""
          }`
      );

      const mlCatalogText = MICROEXPRESSION_CATALOG.map(
        (c) =>
          `${c.lawId} (${c.codeId}): ${c.titleZh} [${c.actionUnitCode}, ${c.category}分类 #${c.categoryRank}] — ${c.limitations}`
      ).join("\n");

      const classicCatalogText = COMPLEMENTARY_CLASSIC_LAWS.map(
        (c) => `${c.lawId} (${c.codeId}): ${c.titleZh} [${c.category}] — ${c.whyRelevant}`
      ).join("\n");

      const prompt = `请你作为认知神经科学与微表情教学督导专家，分析以下用户在 ML001–ML010 微表情测验中的真实作答与错题分布，生成一份精准、有温度且具科学循证价值的「诊断总结」。

【本轮测验总体数据】
- 测验模式：${String(metrics?.quizMode || "microexpressions")}
- 测验总题数：${Number(metrics?.totalQuestions || rawAttempts.length)} 题（其中 ML001–ML010 共覆盖 ${errorDistribution.length} 条定律）
- 首答准确率：${Number(metrics?.accuracyPercent ?? 100)}%（首答命中 ${Number(metrics?.firstTryCorrectCount ?? 0)} 题，累计误点 ${Number(metrics?.totalWrongClicks ?? 0)} 次）
- 最高连击：x${Number(metrics?.maxCombo ?? 0)}，用时：${Number(metrics?.elapsedSeconds ?? 0)} 秒

【ML001–ML010 逐定律错题分布（已按错题数降序排列）】
${testedSummaryLines.length > 0 ? testedSummaryLines.join("\n") : "暂未包含逐题明细，请结合整体指标给出巩固建议。"}

【用户历史掌握度快照（参考）】
${JSON.stringify(userMasteryMap)}

【允许推荐的定律清单（recommendedLaws 中的 lawId 必须严格从此清单选取）】
1) 微表情与面部动作十定律：
${mlCatalogText}

2) 关联认知与社会偏误延伸定律（如发现用户易在情感冲突中落入偏误可搭配推荐 1 条）：
${classicCatalogText}

【诊断总结严格要求】
1. **基于真实错题分布**：若某定律误选次数 > 0 或使用了提示，必须点名分析其具体混淆点（特别是如果给出了“曾误选内容”，请精准指出他为何被该干扰项吸引，例如混淆了 AU1 眉内侧与 AU2 眉外侧/AU4 下压，或误信了绝对测谎/杜乡微笑不可伪装等）。
2. **若全部首答命中（零错题）**：肯定其敏锐度，同时检查是否依赖了提示，并重点分析哪几条高阶边界定律（如 ML009 138 项元分析效应量边界、ML010 Barrett 2019 非一一对应原则）及延伸防偏误定律值得定期巩固防遗忘。
3. **recommendedLaws 数量为 2 到 4 条**：优先排序错题最多的 ML 定律（priority 标为 'high'），其次为使用过提示或易混淆相邻动作单元的定律（'medium'），最后可配 1 条巩固或关联认知偏误定律（'consolidation'）。`;

      let responseText = "";
      let lastErr: any = null;
      const maxAttempts = 3;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: prompt,
            config: {
              systemInstruction:
                "你是智心堂（MindLabZ）微表情与认知科学学习督导 AI。请严格基于传入的错题分布输出合法 JSON 诊断总结，严禁编造清单之外的 lawId。",
              responseMimeType: "application/json",
              responseSchema: diagnosticSummarySchema,
            },
          });
          responseText = (response.text || "").trim();
          if (responseText) break;
        } catch (err: any) {
          lastErr = err;
          const status = err?.status || err?.code;
          const isRetryable = status === 429 || status === 503 || status === 500;
          if (isRetryable && attempt < maxAttempts - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, 600 * Math.pow(2, attempt))
            );
            continue;
          }
          throw err;
        }
      }

      if (!responseText) {
        throw lastErr || new Error("Gemini returned an empty diagnostic summary");
      }

      let cleanText = responseText;
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\s*/i, "").replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(cleanText);

      // Normalize recommended law IDs against known ML + complementary catalog so links never 404
      const allKnownEntries = [
        ...MICROEXPRESSION_CATALOG.map((c) => ({
          lawId: c.lawId,
          codeId: c.codeId,
          titleZh: c.titleZh,
        })),
        ...COMPLEMENTARY_CLASSIC_LAWS.map((c) => ({
          lawId: c.lawId,
          codeId: c.codeId,
          titleZh: c.titleZh,
        })),
      ];

      const normalizedRecs = (Array.isArray(parsed.recommendedLaws) ? parsed.recommendedLaws : [])
        .map((rec: any) => {
          const rawId = String(rec?.lawId || "").trim().toLowerCase();
          const rawCode = String(rec?.codeId || "").trim().toLowerCase();
          const matched =
            allKnownEntries.find(
              (k) =>
                k.lawId.toLowerCase() === rawId ||
                k.codeId.toLowerCase() === rawId ||
                k.codeId.toLowerCase() === rawCode ||
                k.titleZh === String(rec?.titleZh || "").trim()
            ) || MICROEXPRESSION_CATALOG[0];
          const rawPriority = String(rec?.priority || "medium").toLowerCase();
          const priority =
            rawPriority === "high" || rawPriority === "consolidation"
              ? rawPriority
              : "medium";
          return {
            lawId: matched.lawId,
            codeId: matched.codeId,
            titleZh: matched.titleZh,
            priority,
            reason: String(rec?.reason || "").trim(),
            reviewAction: String(rec?.reviewAction || "").trim(),
          };
        })
        .filter((r: any) => r.reason)
        .slice(0, 4);

      return res.json({
        model: "gemini-4-hydrogen",
        generatedAt: new Date().toISOString(),
        errorDistribution,
        summary: {
          overallLevelLabel: String(parsed.overallLevelLabel || "微表情解码表现分析").trim(),
          performanceHeadline: String(parsed.performanceHeadline || "").trim(),
          diagnosticAnalysis: String(parsed.diagnosticAnalysis || "").trim(),
          categoryStrengths: Array.isArray(parsed.categoryStrengths)
            ? parsed.categoryStrengths.map((s: unknown) => String(s).trim()).filter(Boolean)
            : [],
          errorPatternInsights: Array.isArray(parsed.errorPatternInsights)
            ? parsed.errorPatternInsights.map((s: unknown) => String(s).trim()).filter(Boolean)
            : [],
          recommendedLaws: normalizedRecs,
          nextStepAdvice: String(parsed.nextStepAdvice || "").trim(),
        },
      });
    } catch (err: any) {
      console.error("Microexpression diagnostic summary error:", err);
      const status = Number(err?.status || err?.httpStatusCode) || 500;
      const rawMessage = String(err?.message || err);

      if (status === 400 || status === 403 || rawMessage.includes("API_KEY")) {
        return res.status(status === 403 ? 403 : 400).json({
          error: "GEMINI_AUTH_ERROR",
          message:
            "Gemini API 密钥无效或无权限，请在 Settings > Secrets 面板核查密钥配置后重试。",
        });
      }
      if (status === 429) {
        return res.status(429).json({
          error: "GEMINI_RATE_LIMITED",
          message: "Gemini API 请求配额暂时达到上限，请稍等几秒后重试。",
        });
      }
      return res.status(500).json({
        error: "AI_DIAGNOSTIC_FAILED",
        message: `AI 生成诊断总结失败：${rawMessage}`,
      });
    }
  });

  // 5. Real-time GPS Location Reverse Geocoding, Weather & Google Maps Grounding
  app.post("/api/location-telemetry", async (req, res) => {
    try {
      const { latitude, longitude, includeMapsGrounding = false } = req.body || {};
      const lat = Number(latitude);
      const lon = Number(longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ error: "Valid latitude and longitude are required" });
      }

      // Parallel fetch: Open-Meteo 7-day weather + Air Quality/Pollution/Pollen + Reverse Geocoding
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_probability_max,uv_index_max&timezone=auto`;
      const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide,alder_pollen,birch_pollen,grass_pollen,olive_pollen,ragweed_pollen,mugwort_pollen&timezone=auto`;
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`;

      const [weatherResp, airResp, geoResp] = await Promise.allSettled([
        fetch(weatherUrl).then((r) => (r.ok ? r.json() : null)),
        fetch(airQualityUrl).then((r) => (r.ok ? r.json() : null)),
        fetch(geoUrl).then((r) => (r.ok ? r.json() : null)),
      ]);

      const weatherData = weatherResp.status === "fulfilled" ? weatherResp.value : null;
      const airData = airResp.status === "fulfilled" ? airResp.value : null;
      const geoData = geoResp.status === "fulfilled" ? geoResp.value : null;

      let mapsSummary: string | null = null;
      const mapsLinks: Array<{ title: string; uri: string; snippet?: string }> = [];

      if (includeMapsGrounding) {
        const ai = getAI();
        if (ai) {
          try {
            const mapsResp = await ai.models.generateContent({
              model: "gemini-4-hydrogen",
              contents: `Identifie précisément le quartier, la rue ou le point d'intérêt le plus proche aux coordonnées GPS (${lat.toFixed(5)}, ${lon.toFixed(5)}) en une phrase concise (en français et chinois).`,
              config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                  retrievalConfig: {
                    latLng: {
                      latitude: lat,
                      longitude: lon,
                    },
                  },
                },
              },
            });

            mapsSummary = mapsResp.text || null;
            const chunks = mapsResp.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            for (const chunk of chunks as any[]) {
              if (chunk?.maps?.uri) {
                const snippet =
                  chunk?.maps?.placeAnswerSources?.reviewSnippets?.[0]?.content ||
                  chunk?.maps?.placeAnswerSources?.reviewSnippets?.[0]?.text ||
                  undefined;
                mapsLinks.push({
                  title: chunk.maps.title || "Voir sur Google Maps",
                  uri: chunk.maps.uri,
                  snippet,
                });
              }
            }
          } catch (_mapsErr) {
            // Graceful fallback if Gemini API quota is reached or network unavailable
            if (!mapsSummary && geoData) {
              const locality = geoData.locality || geoData.city;
              const country = geoData.countryName;
              if (locality) {
                mapsSummary = `Coordonnées GPS synchronisées à ${locality}${country ? `, ${country}` : ''}.`;
              }
            }
          }
        }
      }

      if (mapsLinks.length === 0) {
        mapsLinks.push({
          title: "Explorer la position sur Google Maps",
          uri: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
        });
      }

      return res.json({
        weather: weatherData?.current || null,
        daily: weatherData?.daily || null,
        airQuality: airData?.current || null,
        timezone: weatherData?.timezone || null,
        geo: geoData || null,
        mapsSummary,
        mapsLinks,
      });
    } catch (err: any) {
      console.error("Location telemetry error:", err);
      return res.status(500).json({ error: "Telemetry failed", detail: String(err?.message || err) });
    }
  });

  // 6. Audio Transcription endpoint using gemini-3.5-transcribe
  app.post("/api/audio/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType = "audio/webm" } = req.body || {};
      if (!audioBase64 || typeof audioBase64 !== "string") {
        return res.status(400).json({ error: "Missing audioBase64 payload" });
      }

      const ai = getAI();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY non configurée",
          text: "",
        });
      }

      const cleanBase64 = audioBase64.includes(",")
        ? audioBase64.split(",")[1]
        : audioBase64;

      const audioPart = {
        inlineData: {
          mimeType: mimeType.split(";")[0] || "audio/webm",
          data: cleanBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            audioPart,
            {
              text: "Transcribe this audio accurately in its spoken language (French, Chinese, or English). Return only the transcribed text.",
            },
          ],
        },
      });

      const transcript = (response.text || "").trim();
      return res.json({ text: transcript, model: "gemini-3.5-transcribe" });
    } catch (err: any) {
      console.error("Audio transcription error:", err);
      return res.status(500).json({
        error: "Audio transcription failed",
        detail: String(err?.message || err),
      });
    }
  });

  // 6b. Natural Human Neural TTS endpoint using gemini-3.8-flash-lite-tts
  const TTS_VOICE_MAP: Record<string, { voiceName: string; style: string }> = {
    gentle_female: {
      voiceName: "Kore",
      style:
        "Warm, empathetic, natural human Mandarin Chinese narrator speaking smoothly with gentle emotional nuance and conversational breathing pauses, never robotic",
    },
    wise_male: {
      voiceName: "Puck",
      style:
        "Articulate, insightful, calm human Mandarin Chinese mentor speaking naturally with crisp diction, subtle warmth, and thoughtful cadence",
    },
    calm_bass: {
      voiceName: "Fenrir",
      style:
        "Deep, grounded, serene human Mandarin Chinese narrator with rich resonant timbre and unhurried meditative rhythm",
    },
    system_default: {
      voiceName: "Zephyr",
      style:
        "Balanced, clear, natural human Mandarin Chinese speaker with fluid everyday intonation and organic phrasing",
    },
  };

  const ttsMemoryCache = new Map<string, { audioBase64: string; mimeType: string; voiceName: string }>();
  const TTS_CACHE_LIMIT = 120;

  function sanitizeTextForNaturalSpeech(raw: string): string {
    return raw
      .replace(/([\u4e00-\u9fff])\s*\/\s*([\u4e00-\u9fff])/g, "$1与$2")
      .replace(/\s*\/\s*/g, "，")
      .replace(/[·•・]/g, "，")
      .replace(/[【】「」『』《》〈〉\[\]]/g, " ")
      .replace(/\s*&\s*/g, " 和 ")
      .replace(/\s*\+\s*/g, " 加 ")
      .replace(/[ \t\r]+/g, " ")
      .replace(/[，,]{2,}/g, "，")
      .replace(/[。]{2,}/g, "。")
      .trim();
  }

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, preset = "gentle_female" } = req.body || {};
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Missing text payload" });
      }

      const ai = getAI();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY not configured",
        });
      }

      const cleanText = sanitizeTextForNaturalSpeech(text).slice(0, 1800);
      if (!cleanText) {
        return res.status(400).json({ error: "No speakable text after normalization" });
      }

      const voiceMeta = TTS_VOICE_MAP[preset] || TTS_VOICE_MAP.gentle_female;
      const cacheKey = `${voiceMeta.voiceName}::${preset}::${cleanText}`;
      const cached = ttsMemoryCache.get(cacheKey);
      if (cached) {
        // Refresh LRU order
        ttsMemoryCache.delete(cacheKey);
        ttsMemoryCache.set(cacheKey, cached);
        return res.json({
          audioBase64: cached.audioBase64,
          mimeType: cached.mimeType,
          voiceName: cached.voiceName,
          model: "gemini-3.8-flash-lite-tts",
          cached: true,
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: voiceMeta.style,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceMeta.voiceName },
            },
          },
        },
      });

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;
      const mimeType = inlineData?.mimeType || "audio/wav";

      if (!base64Audio) {
        return res.status(502).json({ error: "Empty TTS audio response from model" });
      }

      if (ttsMemoryCache.size >= TTS_CACHE_LIMIT) {
        const oldestKey = ttsMemoryCache.keys().next().value;
        if (oldestKey) ttsMemoryCache.delete(oldestKey);
      }
      ttsMemoryCache.set(cacheKey, {
        audioBase64: base64Audio,
        mimeType,
        voiceName: voiceMeta.voiceName,
      });

      return res.json({
        audioBase64: base64Audio,
        mimeType,
        voiceName: voiceMeta.voiceName,
        model: "gemini-3.8-flash-lite-tts",
      });
    } catch (err: any) {
      console.error("Neural TTS generation error:", err);
      const upstreamStatus = Number(err?.status || err?.httpStatusCode);
      const statusCode = upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 500;
      return res.status(statusCode).json({
        error: "Neural TTS generation failed",
        detail: String(err?.message || err),
      });
    }
  });

  // 7. Real-Time Voice Conversation WebSocket Bridge using gemini-3.8-live (Live API)
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    if (req.url?.startsWith("/live")) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
  });

  wss.on("connection", async (clientWs) => {
    const ai = getAI();
    if (!ai) {
      clientWs.send(
        JSON.stringify({
          error: "Clé API Gemini non configurée sur le serveur.",
        })
      );
      clientWs.close();
      return;
    }

    let liveSession: any = null;

    try {
      const sessionPromise = ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `${systemInstruction}\nTu es le coach vocal temps réel MindLabZ (智心堂). Réponds de manière chaleureuse, claire et concise dans la langue de l'utilisateur (français, chinois ou anglais).`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ status: "connected", model: "gemini-3.8-live" }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== clientWs.OPEN) return;

            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }

            const outTranscript = (message.serverContent as any)?.outputTranscription?.text;
            if (outTranscript) {
              clientWs.send(JSON.stringify({ outputTranscript: outTranscript }));
            }

            const inTranscript = (message.serverContent as any)?.inputTranscription?.text;
            if (inTranscript) {
              clientWs.send(JSON.stringify({ inputTranscript: inTranscript }));
            }

            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }

            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ turnComplete: true }));
            }
          },
          onerror: (err: any) => {
            console.error("Gemini Live session error:", err);
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(
                JSON.stringify({ error: String(err?.message || "Erreur Live API") })
              );
            }
          },
          onclose: () => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.close();
            }
          },
        },
      });

      liveSession = await sessionPromise;

      clientWs.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.audio) {
            sessionPromise.then((s) =>
              s.sendRealtimeInput({
                audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
              })
            );
          } else if (msg.text) {
            sessionPromise.then((s) =>
              s.sendRealtimeInput({
                text: msg.text,
              })
            );
          }
        } catch (parseErr) {
          console.error("Failed to process client Live message:", parseErr);
        }
      });

      clientWs.on("close", () => {
        if (liveSession) {
          try {
            liveSession.close();
          } catch {
            // Ignore close errors
          }
        }
      });
    } catch (err: any) {
      console.error("Failed to initialize Gemini Live session:", err);
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(
          JSON.stringify({
            error: `Impossible de démarrer Gemini 3.8 Live: ${String(err?.message || err)}`,
          })
        );
        clientWs.close();
      }
    }
  });

  // Serve public static assets (PWA icons, manifest, service worker)
  app.use(express.static(path.join(process.cwd(), "public")));

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: rootDir,
      configFile: path.join(rootDir, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Guaranteed SPA fallback for all subroute navigation requests in development
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api") || url.startsWith("/live")) {
        return next();
      }
      try {
        const rawIndex = await readFile(path.join(rootDir, "index.html"), "utf8");
        const transformedHtml = await vite.transformIndexHtml(url, rawIndex);
        res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`MindLabZ API, Live Voice & App running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
