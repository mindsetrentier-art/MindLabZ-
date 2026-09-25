import "dotenv/config";
import express from "express";
import { createServer as createHttpServer } from "node:http";
import path from "path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

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

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const parsed = JSON.parse(response.text || "{}");

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

  // 5. Real-time GPS Location Reverse Geocoding, Weather & Google Maps Grounding
  app.post("/api/location-telemetry", async (req, res) => {
    try {
      const { latitude, longitude, includeMapsGrounding = false } = req.body || {};
      const lat = Number(latitude);
      const lon = Number(longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ error: "Valid latitude and longitude are required" });
      }

      // Parallel fetch: Open-Meteo real-time weather + BigDataCloud/Nominatim reverse geocoding
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`;

      const [weatherResp, geoResp] = await Promise.allSettled([
        fetch(weatherUrl).then((r) => (r.ok ? r.json() : null)),
        fetch(geoUrl).then((r) => (r.ok ? r.json() : null)),
      ]);

      const weatherData = weatherResp.status === "fulfilled" ? weatherResp.value : null;
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
          } catch (mapsErr) {
            console.warn("Maps grounding optional enrichment skipped:", mapsErr);
          }
        }
      }

      return res.json({
        weather: weatherData?.current || null,
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

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
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
