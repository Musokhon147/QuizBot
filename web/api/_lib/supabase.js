import { createClient } from "@supabase/supabase-js";

let _client = null;
function getClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set");
  }
  _client = createClient(url, key);
  return _client;
}

const supabase = new Proxy(
  {},
  {
    get(_t, prop) {
      const client = getClient();
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
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

export async function saveTest(telegramUserId, title, questions, category = null, isPrivate = false) {
  await ensureUser(telegramUserId);

  const { data: test, error: testError } = await supabase
    .from("tests")
    .insert({ telegram_user_id: telegramUserId, title, category, private: isPrivate })
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

export async function getAllTests(limit = 100, viewerTelegramId = null) {
  // Visibility rule: public tests visible to everyone. Private tests visible
  // only to the uploader. If no viewer is provided, only public tests show.
  let query = supabase
    .from("tests")
    .select("id, title, category, created_at, private, telegram_user_id, questions(count), users(name, username)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (viewerTelegramId) {
    query = query.or(`private.eq.false,telegram_user_id.eq.${viewerTelegramId}`);
  } else {
    query = query.eq("private", false);
  }

  const { data, error } = await query;
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

/**
 * Look up a user's role. Returns 'user' if not found.
 */
export async function getUserRole(telegramUserId) {
  if (!telegramUserId) return "user";
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("telegram_id", telegramUserId)
    .maybeSingle();
  if (error) throw error;
  return data?.role || "user";
}

/**
 * List every user with their role, name, and quick stats. For the
 * super-admin user management page.
 */
export async function listAllUsersWithStats(limit = 500) {
  const { data, error } = await supabase
    .from("users")
    .select("telegram_id, name, username, role, joined_at, last_active")
    .order("joined_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

const VALID_ROLES = ["user", "admin", "private_admin", "super_admin"];

/**
 * Change a user's role. Caller must be a super-admin; this function
 * does not enforce that — the API endpoint guard does.
 */
export async function setUserRole(telegramUserId, newRole) {
  if (!VALID_ROLES.includes(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }
  // Make sure the user exists before we update
  await ensureUser(telegramUserId);
  const { data, error } = await supabase
    .from("users")
    .update({ role: newRole })
    .eq("telegram_id", telegramUserId)
    .select()
    .single();
  if (error) throw error;
  return data;
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
