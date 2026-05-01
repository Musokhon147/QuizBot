import { getTest, saveResult } from "../../_lib/supabase.js";
import { methodGuard, handleError } from "../../_lib/http.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  try {
    const { telegramUserId, answers, durationMs } = req.body || {};
    const test = await getTest(req.query.testId);

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
      req.query.testId,
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
    handleError(res, err);
  }
}
