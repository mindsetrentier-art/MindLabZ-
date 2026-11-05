import "dotenv/config";
import express from "express";
import { createServer as createHttpServer } from "node:http";
import path from "path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

function getValidGeminiModel(envModel?: string): string {
  if (envModel && (envModel.startsWith("gemini-") || envModel.startsWith("models/gemini-"))) {
    return envModel;
  }
  return "gemini-3.8-flash";
}

const MODEL = getValidGeminiModel(process.env.GEMINI_MODEL);

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
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

      const ai = getAI();
      if (!ai) {
        const fallbackText = `【智心堂 AI 认知教练分析】\n针对您提出的问题：“${message}”：\n\n1. **认知机制解析**：人类大脑为了节省前额叶能量，常依赖“系统1（快速直觉启发式）”而非“系统2（深度理性分析）”。\n2. **定律关联洞察**：${lawContext ? `结合当前聚焦的【${typeof lawContext === "string" ? lawContext : JSON.stringify(lawContext)}】，` : ""}这种现象往往源于大脑对确定性与认知闭合的本能渴求。\n3. **实操行动建议**：在面临关键判断时，刻意暂停 3 秒并列出 2 个反向证据，能显著提升决策质量。`;
        return res.json({ text: fallbackText, answer: fallbackText, isFallback: true });
      }

      const contextStr =
        typeof lawContext === "string" ? lawContext : JSON.stringify(lawContext, null, 2);
      const prompt = `用户问题：${message}\n\n当前定律上下文：${contextStr || "通用心理学与认知科学训练"}\n\n请用结构清晰、富有洞察力且包含1个立即能用的生活实操建议的方式回答：`;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { systemInstruction },
      });

      const text = response.text || "暂时无法生成回答，请稍后再试。";
      return res.json({ text, answer: text, isFallback: false });
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
              model: "gemini-3.8-flash",
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
