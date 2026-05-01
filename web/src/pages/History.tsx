import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useStore, type AttemptRecord } from "../store/index.ts";

interface Props {
  onStartQuiz: (id: string) => void;
}

function groupByDate(attempts: AttemptRecord[]): Record<string, AttemptRecord[]> {
  const groups: Record<string, AttemptRecord[]> = {};
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

export default function History({ onStartQuiz }: Props) {
  const { t } = useTranslation();
  const { attempts } = useStore();
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

      {attempts.length === 0 ? (
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
                {grouped[dateKey].map((attempt, i) => (
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
