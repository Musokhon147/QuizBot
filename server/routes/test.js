import { Router } from "express";
import multer from "multer";
import { extractTextFromPDF } from "../services/pdf.js";
import { parseQuestionsFromText } from "../services/parser.js";
import {
  saveTest,
  getTest,
  getUserTests,
  saveResult,
  getResults,
  upsertUser,
  getLeaderboard,
  getStreak,
  toggleBookmark,
} from "../services/supabase.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/auth", async (req, res) => {
  try {
    const { telegramUserId, name, username, phone } = req.body;
    if (!telegramUserId) {
      return res.status(400).json({ error: "telegramUserId required" });
    }
    const user = await upsertUser(telegramUserId, name, username, phone);
    res.json(user);
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Failed to authenticate user" });
  }
});

router.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const { telegramUserId } = req.body;
    if (!req.file || !telegramUserId) {
      return res.status(400).json({ error: "PDF file and telegramUserId required" });
    }

    const pdfText = await extractTextFromPDF(req.file.buffer);
    if (!pdfText.trim()) {
      return res.status(400).json({ error: "Could not extract text from PDF. It may be scanned/image-based." });
    }

    const parsed = parseQuestionsFromText(pdfText);
    if (!parsed.questions.length) {
      return res.status(400).json({ error: "No questions detected. Use a PDF with numbered questions and lettered options." });
    }

    const test = await saveTest(telegramUserId, parsed.title, parsed.questions);

    res.json({ testId: test.id, title: parsed.title, questionCount: parsed.questions.length });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await getLeaderboard(limit);
    res.json(data);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.get("/streak/:telegramUserId", async (req, res) => {
  try {
    const streak = await getStreak(req.params.telegramUserId);
    res.json({ streak });
  } catch (err) {
    console.error("Streak error:", err);
    res.status(500).json({ error: "Failed to fetch streak" });
  }
});

router.post("/bookmark", async (req, res) => {
  try {
    const { telegramUserId, questionId } = req.body;
    const result = await toggleBookmark(telegramUserId, questionId);
    res.json(result);
  } catch (err) {
    console.error("Bookmark error:", err);
    res.status(500).json({ error: "Failed to toggle bookmark" });
  }
});

router.get("/:testId", async (req, res) => {
  try {
    const test = await getTest(req.params.testId);
    res.json(test);
  } catch (err) {
    console.error("Get test error:", err);
    res.status(404).json({ error: "Test not found" });
  }
});

router.get("/user/:telegramUserId", async (req, res) => {
  try {
    const tests = await getUserTests(req.params.telegramUserId);
    res.json(tests);
  } catch (err) {
    console.error("Get user tests error:", err);
    res.status(500).json({ error: "Failed to fetch tests" });
  }
});

router.post("/:testId/submit", async (req, res) => {
  try {
    const { telegramUserId, answers, durationMs } = req.body;
    const test = await getTest(req.params.testId);

    let score = 0;
    const results = test.questions.map((q, i) => {
      const userAnswer = answers[i] || null;
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) score++;
      return {
        questionNumber: q.question_number,
        userAnswer,
        correctAnswer: q.correct_answer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const saved = await saveResult(
      req.params.testId,
      telegramUserId,
      score,
      test.questions.length,
      results,
      durationMs || 0
    );

    res.json({
      resultId: saved.id,
      score,
      totalQuestions: test.questions.length,
      percentage: Math.round((score / test.questions.length) * 100),
      details: results,
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: "Failed to submit test" });
  }
});

router.get("/results/:telegramUserId", async (req, res) => {
  try {
    const results = await getResults(req.params.telegramUserId);
    res.json(results);
  } catch (err) {
    console.error("Get results error:", err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

export default router;
