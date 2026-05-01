/**
 * AI fallback for question banks that have no answer markers.
 *
 * Sends a batch of question texts to Claude and gets back, for each one,
 * 4 plausible multiple-choice options and the index of the correct one.
 *
 * Single-turn structured-output requests; no prompt caching (each batch is
 * unique). Calls are made in chunks of 25 questions to keep individual API
 * calls well under Vercel's 30s function-timeout budget.
 */
import Anthropic from "@anthropic-ai/sdk";

const CHUNK_SIZE = 25;

let _client = null;
function getClient() {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY environment variable must be set");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          options: {
            type: "array",
            items: { type: "string" },
          },
          correctIndex: { type: "integer", enum: [0, 1, 2, 3] },
        },
        required: ["options", "correctIndex"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

const LANG_NAMES = {
  uz: "Uzbek",
  ru: "Russian",
  en: "English",
};

function buildPrompt(questionTexts, language) {
  const langName = LANG_NAMES[language] || "Uzbek";
  return `You are generating multiple-choice quiz questions. For each numbered question below, generate exactly 4 plausible answer options and identify which is correct.

Language: ${langName} — write all options in this language.
Rules:
- 4 options per question, none longer than 200 characters
- Each option must be plausible (a real possible answer for the topic, not absurd)
- Distractor options should be related but factually wrong
- correctIndex: 0 = first option, 1 = second, 2 = third, 3 = fourth
- For history/factual questions, use real-world facts; do not invent dates or names

Questions:
${questionTexts.map((q, i) => `${i + 1}. ${q}`).join("\n\n")}`;
}

async function callClaudeForChunk(chunk, language) {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    output_config: {
      format: { type: "json_schema", schema: RESPONSE_SCHEMA },
    },
    messages: [{ role: "user", content: buildPrompt(chunk, language) }],
  });

  // Extract structured text output
  let text = "";
  for (const block of response.content) {
    if (block.type === "text") text += block.text;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Claude returned invalid JSON: ${text.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed.questions)) {
    throw new Error("Claude response missing 'questions' array");
  }

  return parsed.questions;
}

/**
 * Generate options + correct answers for a batch of question texts.
 *
 * @param {string[]} questionTexts - The questions to enrich.
 * @param {"uz"|"ru"|"en"} language - Language for the generated options.
 * @returns {Promise<Array<{options: string[], correctIndex: number}>>}
 */
export async function generateOptionsAndAnswers(questionTexts, language = "uz") {
  if (!questionTexts.length) return [];

  // Split into chunks to fit Vercel's function timeout budget
  const chunks = [];
  for (let i = 0; i < questionTexts.length; i += CHUNK_SIZE) {
    chunks.push(questionTexts.slice(i, i + CHUNK_SIZE));
  }

  // Process chunks sequentially to avoid rate-limit spikes
  const results = [];
  for (const chunk of chunks) {
    const chunkResults = await callClaudeForChunk(chunk, language);
    if (chunkResults.length !== chunk.length) {
      throw new Error(
        `Claude returned ${chunkResults.length} answers for ${chunk.length} questions (mismatch)`
      );
    }
    results.push(...chunkResults);
  }

  return results;
}
