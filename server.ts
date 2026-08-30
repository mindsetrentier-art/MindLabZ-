import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "MindLabZ" });
  });

  // AI Psychology Tutor endpoint
  app.post("/api/ai/ask", async (req, res) => {
    try {
      const { question, context } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const ai = getAI();
      if (!ai) {
        // High quality fallback responses if API key is not yet configured
        return res.json({
          answer: `【智心 AI 导师分析】\n针对您提出的问题：“${question}”：\n\n1. **认知机制解析**：人类大脑为了节省能量，常依赖“双系统思维”（System 1 启发式直觉 vs System 2 理性推导）。\n2. **心理学规律映射**：这通常与相关的情境偏误（如可得性启发、框架效应或蔡格尼克效应）密切相关。\n3. **日常应用建议**：在面临重要决策时，刻意慢下来 3 秒钟，启动元认知（思考你的思考），能够大幅减少认知盲区。\n\n（提示：配置 GEMINI_API_KEY 后可启用深度实时 AI 导师互动与实验推演）`,
          isFallback: true
        });
      }

      const prompt = `你是由“智心堂 (MindLabZ)”打造的顶级心理学与认知科学AI导师。
你的风格：专业、生动通俗、充满洞察力、富有启发性，严谨遵循现代认知科学与实验心理学，绝不给出医疗诊断或枯燥长文。

当前学习上下文：${context ? JSON.stringify(context) : "综合心理学与大脑认知训练"}
用户提问：${question}

请用结构清晰、段落简洁且启发性强的方式回答（包括：核心原理解释、生活生动场景类比、以及1个立即可以在生活中验证的实操微建议）：`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      const text = response.text || "无法生成解答，请稍后再试。";
      res.json({ answer: text, isFallback: false });
    } catch (error: any) {
      console.error("AI Ask error:", error);
      res.status(500).json({
        answer: "AI 导师暂时连接受阻，请稍后重试。心理学小贴士：保持专注与好奇心是大脑神经元突触重塑的最佳催化剂！",
        error: error.message
      });
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindLabZ Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
