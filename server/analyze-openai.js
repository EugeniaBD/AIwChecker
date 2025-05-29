import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

// ✅ Explicitly load the .env file from a known absolute path
dotenv.config({ path: path.resolve("D:/AiWriteCheck/server/.env") }); // <- Pointing directly to the .env file

// 🔢 Calculate sentence complexity (average words per sentence)
function calculateSentenceComplexity(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const words = text.trim().split(/\s+/);
  const complexity = sentences.length > 0 ? words.length / sentences.length : 0;
  return parseFloat(complexity.toFixed(1));
}

export async function analyzeWithGPT(text) {
  const apiKey = process.env.OPENAI_API_KEY;

  // ✅ Validate API Key early
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY is missing from environment variables.");
    throw new Error("API key not found. Check your .env configuration.");
  }

  // ✅ Delay creation until this function is actually called
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  console.log("🔑 API Key being used:", apiKey.slice(0, 8) + "...");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a strict and detailed text evaluator.

Your task is to analyze a user's written text and return a well-structured JSON object with the following fields:

- aiInfluence (integer from 0 to 100)
- score (float from 0.00 to 10.00)
- readabilityScore (float from 0.0 to 100.0)
- readabilityLevel (string): "Basic", "Intermediate", or "Advanced"
- suggestions (array of strings)
- strengths (array of strings)
- warnings (array of strings, optional)
- aiIndicators (array of strings)

❗ Return only raw JSON. Do NOT use code blocks (like \`\`\`). Do NOT add any explanation.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    let message = completion.choices[0].message.content.trim();

    console.log("🧠 Raw GPT output:\n", message);

    if (message.startsWith("```json") || message.startsWith("```")) {
      message = message.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch (jsonErr) {
      console.error("❌ JSON parsing failed:", jsonErr.message);
      console.error("⚠️ Raw GPT message that failed to parse:\n", message);
      throw new Error("GPT did not return valid JSON.");
    }

    const requiredFields = [
      "aiInfluence",
      "score",
      "readabilityScore",
      "readabilityLevel",
      "suggestions",
      "strengths",
      "aiIndicators",
    ];

    const hasRequiredFields = requiredFields.every((key) => key in parsed);

    if (
      hasRequiredFields &&
      typeof parsed.aiInfluence === "number" &&
      typeof parsed.score === "number" &&
      typeof parsed.readabilityScore === "number" &&
      typeof parsed.readabilityLevel === "string" &&
      Array.isArray(parsed.suggestions) &&
      Array.isArray(parsed.strengths) &&
      Array.isArray(parsed.aiIndicators)
    ) {
      parsed.sentenceComplexity = calculateSentenceComplexity(text);
      return parsed;
    } else {
      throw new Error("Invalid or incomplete structure from OpenAI response.");
    }
  } catch (error) {
    console.error("❌ OpenAI analysis failed:", error.message);
    throw new Error("Failed to analyze text with OpenAI.");
  }
}
