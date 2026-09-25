import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});
const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const systemInstruction = await readFile("./prompts/system.txt", "utf8");
const generatorPrompt = await readFile("./prompts/generator.txt", "utf8");
const schema = JSON.parse(await readFile("./schemas/law.schema.json", "utf8"));
const manifest = JSON.parse(await readFile("./data/laws.manifest.json", "utf8"));
await mkdir("./data/generated", { recursive: true });

for (const law of manifest.laws) {
  const prompt = `${generatorPrompt}\nLAW:\n${JSON.stringify(law, null, 2)}`;
  console.log(`Generating ${law.id} ${law.title_zh}...`);
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  const parsed = JSON.parse(response.text || "{}");
  await writeFile(`./data/generated/${law.id}.json`, JSON.stringify(parsed, null, 2), "utf8");
  console.log(`Saved ${law.id}`);
}
