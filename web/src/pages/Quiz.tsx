import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { fetchTest, submitTest, haptic, type TgUser, type Test, type SubmitResult } from "../lib/api.ts";
import { useStore } from "../store/index.ts";
import TimerRing from "../components/TimerRing.tsx";

interface Props {
  testId: string;
  user: TgUser;
  onFinish: (data: SubmitResult) => void;
  timePerQuestion: number;
}

const optionColors = [
  { bg: "from-accent/15 to-accent/5", border: "border-accent/40", ring: "ring-accent/30" },
  { bg: "from-mint/15 to-mint/5", border: "border-mint/40", ring: "ring-mint/30" },
  { bg: "from-amber-400/15 to-amber-400/5", border: "border-amber-400/40", ring: "ring-amber-400/30" },
  { bg: "from-rose-400/15 to-rose-400/5", border: "border-rose-400/40", ring: "ring-rose-400/30" },
];

function extractLetter(option: string): string {
  const match = option.match(/^([A-F])[).:\s]/i);
  return match ? match[1].toUpperCase() : option.charAt(0).toUpperCase();
}

function extractText(option: string): string {
  return option.replace(/^[A-F][).:\s]+/i, "").trim();
}

export default function Quiz({ testId, user, onFinish, timePerQuestion }: Props) {
  const { t } = useTranslation();
  const { addAttempt } = useStore();
  const [test, setTest] = useState<Test | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);
  const [timerKey, setTimerKey] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    fetchTest(testId)
      .then(setTest)
      .catch(() => toast.error(t("common.error")))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-[3px] border-accent/20 border-t-accent animate-spin" />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-transparent border-b-mint/40 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
        <p className="text-muted text-sm font-medium">{t("quiz.preparing")}</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="card rounded-3xl p-8 text-center max-w-sm">
          <span className="text-4xl block mb-4">{"\u{1F50D}"}</span>
          <h2 className="text-lg font-semibold text-foreground mb-2">{t("quiz.notFound")}</h2>
          <p className="text-muted text-sm">{t("quiz.notFoundHint")}</p>
        </div>
      </div>
    );
  }

  const questions = test.questions;
  const question = questions[current];
  const totalQuestions = questions.length;
  const progress = ((current + 1) / totalQuestions) * 100;
  const answeredCount = Object.keys(answers).length;

  const selectAnswer = (letter: string) => {
    haptic("light");
    setAnswers((prev) => ({ ...prev, [current]: letter }));
  };

  const navigate = (dir: number) => {
    const next = current + dir;
    if (next < 0 || next >= totalQuestions) return;
    haptic("light");
    setDirection(dir);
    setCurrent(next);
    setTimerKey((k) => k + 1);
  };

  const handleTimeout = () => {
    haptic("medium");
    toast(t("common.time") + "!", { icon: "\u{23F0}" });
    if (current < totalQuestions - 1) {
      navigate(1);
    }
  };

  const handleSubmit = async () => {
    haptic("medium");
    setSubmitting(true);
    try {
      const orderedAnswers = questions.map((_, i) => answers[i] || null);
      const result = await submitTest(testId, user.id.toString(), orderedAnswers);
      const durationMs = Date.now() - startTime.current;

      addAttempt({
        id: result.resultId,
        testId,
        testTitle: test.title,
        score: result.score,
        total: result.totalQuestions,
        percentage: result.percentage,
        date: new Date().toISOString(),
        durationMs,
      });

      haptic("heavy");
      onFinish(result);
    } catch {
      toast.error(t("common.error"));
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="px-5 pt-6 pb-28 max-w-lg mx-auto min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted font-medium uppercase tracking-wider truncate">
              {test.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {timePerQuestion > 0 && (
              <TimerRing
                key={timerKey}
                seconds={timePerQuestion}
                onTimeout={handleTimeout}
              />
            )}
            <div className="card rounded-full px-3 py-1.5">
              <span className="text-xs font-semibold text-accent-light">
                {answeredCount}/{totalQuestions}
              </span>
            </div>
          </div>
        </div>

        <div className="relative h-1.5 rounded-full bg-glass overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(90deg, #6c5ce7, #00cec9)" }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted">
            {t("quiz.question")} {current + 1} {t("common.of")} {totalQuestions}
          </span>
          <span className="text-xs text-muted">
            {answeredCount} {t("quiz.answered")}
          </span>
        </div>
      </motion.div>

      {/* Question */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="card rounded-3xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-xs font-bold text-accent-light">
                {current + 1}
              </span>
            </div>
            <h2 className="text-[16px] font-semibold text-foreground leading-relaxed">
              {question.question_text}
            </h2>
          </div>

          <div className="space-y-2.5">
            {question.options.map((option, i) => {
              const letter = extractLetter(option);
              const text = extractText(option);
              const isSelected = answers[current] === letter;
              const color = optionColors[i % optionColors.length];

              return (
                <motion.button
                  key={`${current}-${i}`}
                  onClick={() => selectAnswer(letter)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left rounded-2xl p-4 transition-all duration-200 border ${
                    isSelected
                      ? `bg-gradient-to-r ${color.bg} ${color.border} ring-2 ${color.ring}`
                      : "card border-divider hover:border-glass-hover"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                      isSelected ? "bg-accent text-foreground shadow-glow" : "bg-glass-light text-subtle"
                    }`}>
                      {letter}
                    </span>
                    <span className={`text-[14px] leading-relaxed pt-1 ${isSelected ? "text-foreground font-medium" : "text-subtle"}`}>
                      {text || option}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Question dots */}
      <div className="flex flex-wrap gap-1.5 justify-center mt-6 px-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              haptic("light");
              setDirection(i > current ? 1 : -1);
              setCurrent(i);
              setTimerKey((k) => k + 1);
            }}
            className={`w-7 h-7 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
              i === current
                ? "bg-accent text-foreground shadow-glow scale-110"
                : answers[i] !== undefined
                  ? "bg-mint/20 text-mint border border-mint/30"
                  : "bg-glass text-muted border border-divider"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="backdrop-blur-xl bg-bg/70 border-t border-divider">
          <div className="max-w-lg mx-auto flex gap-3 p-4">
            <button onClick={() => navigate(-1)} disabled={current === 0} className="btn-ghost flex-1">
              {t("common.previous")}
            </button>
            {current === totalQuestions - 1 ? (
              <button onClick={handleSubmit} disabled={submitting || answeredCount === 0} className="btn-primary flex-1">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("quiz.submitting")}
                  </span>
                ) : (
                  t("common.submit")
                )}
              </button>
            ) : (
              <button onClick={() => navigate(1)} className="btn-primary flex-1">
                {t("common.next")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
