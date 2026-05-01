import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { TgUser } from "../lib/api.ts";

interface ServerAttempt {
  id: string;
  test_id: string;
  score: number;
  total_questions: number;
  created_at: string;
  duration_ms: number;
  tests: { title: string } | null;
}

interface UiAttempt {
  id: string;
  testId: string;
  testTitle: string;
  score: number;
  total: number;
  percentage: number;
  date: string;
  durationMs: number;
}

interface Props {
  user: TgUser;
  onStartQuiz: (id: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "/api";

function groupByDate(attempts: UiAttempt[]): Record<string, UiAttempt[]> {
  const groups: Record<string, UiAttempt[]> = {};
  for (const a of attempts) {
    const key = new Date(a.date).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  return groups;
}

function getDateLabel(dateStr: string, t: (k: string) => string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return t("history.today");
  if (date.toDateString() === yesterday.toDateString()) return t("history.yesterday");
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getScoreColor(pct: number): string {
  if (pct >= 80) return "text-mint";
  if (pct >= 60) return "text-accent-light";
  if (pct >= 40) return "text-yellow-400";
  return "text-coral";
}

export default function History({ user, onStartQuiz }: Props) {
  const { t } = useTranslation();
  const [attempts, setAttempts] = useState<UiAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/tests/results/${user.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load history");
        return r.json();
      })
      .then((data: ServerAttempt[]) => {
        const mapped: UiAttempt[] = (data || []).map((a) => ({
          id: a.id,
          testId: a.test_id,
          testTitle: a.tests?.title ?? "Untitled test",
          score: a.score,
          total: a.total_questions,
          percentage:
            a.total_questions > 0
              ? Math.round((a.score / a.total_questions) * 100)
              : 0,
          date: a.created_at,
          durationMs: a.duration_ms ?? 0,
        }));
        setAttempts(mapped);
      })
      .catch((err) => {
        console.error("history fetch failed:", err);
        setAttempts([]);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  const grouped = groupByDate(attempts);
  const dateKeys = Object.keys(grouped);

  return (
    <div className="px-5 pt-8 pb-24 max-w-lg mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl font-bold text-foreground">{t("history.title")}</h1>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-accent/30 border-t-accent animate-spin" />
          <p className="text-muted text-sm">Loading history...</p>
        </div>
      ) : attempts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card rounded-3xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-light">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t("history.noHistory")}</h3>
          <p className="text-muted text-sm">{t("history.noHistoryHint")}</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {dateKeys.map((dateKey, gi) => (
            <motion.div
              key={dateKey}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.08 }}
            >
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">
                {getDateLabel(dateKey, t)}
              </p>
              <div className="space-y-2">
                {grouped[dateKey].map((attempt) => (
                  <button
                    key={attempt.id}
                    onClick={() => onStartQuiz(attempt.testId)}
                    className="w-full text-left card card-hover rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {attempt.testTitle}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted">
                            {attempt.total} {t("history.questionsCount")}
                          </span>
                          {attempt.durationMs > 0 && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-muted" />
                              <span className="text-xs text-muted">
                                {Math.round(attempt.durationMs / 1000)}s
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <span className={`text-lg font-bold ${getScoreColor(attempt.percentage)}`}>
                          {attempt.percentage}%
                        </span>
                        <p className="text-xs text-muted">
                          {attempt.score}/{attempt.total}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
