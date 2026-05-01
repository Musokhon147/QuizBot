import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function upsertUser(telegramId, name, username, phone) {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        telegram_id: telegramId,
        name,
        username,
        phone,
        last_active: new Date().toISOString(),
      },
      { onConflict: "telegram_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveTest(telegramUserId, title, questions, category = null) {
  await ensureUser(telegramUserId);

  const { data: test, error: testError } = await supabase
    .from("tests")
    .insert({ telegram_user_id: telegramUserId, title, category })
    .select()
    .single();

  if (testError) throw testError;

  const rows = questions.map((q, i) => ({
    test_id: test.id,
    question_number: i + 1,
    question_text: q.question,
    options: q.options,
    correct_answer: q.correctAnswer,
    explanation: q.explanation || null,
    difficulty: q.difficulty || "medium",
  }));

  const { error: qError } = await supabase.from("questions").insert(rows);
  if (qError) throw qError;

  return test;
}

export async function getTest(testId) {
  const { data: test, error } = await supabase
    .from("tests")
    .select("*, questions(*)")
    .eq("id", testId)
    .single();

  if (error) throw error;
  test.questions.sort((a, b) => a.question_number - b.question_number);
  return test;
}

export async function getUserTests(telegramUserId) {
  const { data, error } = await supabase
    .from("tests")
    .select("id, title, category, created_at, questions(count)")
    .eq("telegram_user_id", telegramUserId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function saveResult(testId, telegramUserId, score, totalQuestions, answers, durationMs = 0) {
  await ensureUser(telegramUserId);
  const timePerQ = totalQuestions > 0 ? Math.round(durationMs / totalQuestions) : 0;

  const { data, error } = await supabase
    .from("attempts")
    .insert({
      test_id: testId,
      telegram_user_id: telegramUserId,
      score,
      total_questions: totalQuestions,
      answers,
      duration_ms: durationMs,
      time_per_question: timePerQ,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getResults(telegramUserId) {
  const { data, error } = await supabase
    .from("attempts")
    .select("*, tests(title)")
    .eq("telegram_user_id", telegramUserId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getStreak(telegramUserId) {
  const { data, error } = await supabase.rpc("user_streak", { uid: telegramUserId });
  if (error) throw error;
  return data ?? 0;
}

export async function toggleBookmark(telegramUserId, questionId) {
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("question_id")
    .eq("telegram_user_id", telegramUserId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("bookmarks")
      .delete()
      .eq("telegram_user_id", telegramUserId)
      .eq("question_id", questionId);
    return { bookmarked: false };
  }

  const { error } = await supabase
    .from("bookmarks")
    .insert({ telegram_user_id: telegramUserId, question_id: questionId });

  if (error) throw error;
  return { bookmarked: true };
}

async function ensureUser(telegramId) {
  const { data } = await supabase
    .from("users")
    .select("telegram_id")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (!data) {
    await supabase.from("users").insert({ telegram_id: telegramId });
  }
}

export default supabase;
