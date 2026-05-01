import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { haptic, type SubmitResult } from "../lib/api.ts";

interface Props {
  data: SubmitResult;
  onGoHome: () => void;
}

function ScoreRing({ percentage }: { percentage: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (percentage / 100) * circumference);
    }, 400);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  const getColor = () => {
    if (percentage >= 80) return { stroke: "#00cec9", glow: "rgba(0, 206, 201, 0.3)" };
    if (percentage >= 60) return { stroke: "#6c5ce7", glow: "rgba(108, 92, 231, 0.3)" };
    if (percentage >= 40) return { stroke: "#fdcb6e", glow: "rgba(253, 203, 110, 0.3)" };
    return { stroke: "#ff6b6b", glow: "rgba(255, 107, 107, 0.3)" };
  };

  const color = getColor();

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: `drop-shadow(0 0 12px ${color.glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {percentage}%
        </motion.span>
      </div>
    </div>
  );
}

export default function Results({ data, onGoHome }: Props) {
  const { t } = useTranslation();
  const { score, totalQuestions, percentage, details } = data;

  const getGrade = () => {
    if (percentage >= 90) return { label: t("results.excellent") };
    if (percentage >= 70) return { label: t("results.good") };
    if (percentage >= 50) return { label: t("results.average") };
    return { label: t("results.poor") };
  };

  const grade = getGrade();

  return (
    <div className="px-5 pt-6 pb-28 max-w-lg mx-auto min-h-screen">
      {/* Score hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card rounded-3xl p-6 mb-6 text-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: percentage >= 70
              ? "radial-gradient(ellipse at 50% 0%, rgba(0,206,201,0.15), transparent 70%)"
              : "radial-gradient(ellipse at 50% 0%, rgba(108,92,231,0.15), transparent 70%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex justify-center mb-4">
            <ScoreRing percentage={percentage} />
          </div>

          <motion.h2 className="text-xl font-bold text-foreground mb-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            {grade.label}
          </motion.h2>

          <motion.div
            className="flex justify-center gap-6 mt-5 pt-5 border-t border-divider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div>
              <p className="text-lg font-bold text-mint">{score}</p>
              <p className="text-xs text-muted">{t("results.correct")}</p>
            </div>
            <div className="w-px bg-glass-border" />
            <div>
              <p className="text-lg font-bold text-coral">{totalQuestions - score}</p>
              <p className="text-xs text-muted">{t("results.wrong")}</p>
            </div>
            <div className="w-px bg-glass-border" />
            <div>
              <p className="text-lg font-bold text-accent-light">{totalQuestions}</p>
              <p className="text-xs text-muted">{t("common.total")}</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Review */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <h3 className="text-sm font-semibold text-subtle uppercase tracking-wider mb-4">
          {t("results.review")}
        </h3>
        <div className="space-y-3">
          {details.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
              className={`rounded-2xl p-4 border transition-all ${
                item.isCorrect ? "card border-mint/20" : "card border-coral/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                  item.isCorrect ? "bg-mint/20 text-mint" : "bg-coral/20 text-coral"
                }`}>
                  {item.isCorrect ? "✓" : "✗"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-subtle mb-1">
                    {t("quiz.question")} {item.questionNumber}
                  </p>
                  {!item.isCorrect && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-2">
                      <span className="text-coral-light">
                        {t("results.yourAnswer")}: <strong>{item.userAnswer || t("common.skipped")}</strong>
                      </span>
                      <span className="text-mint">
                        {t("results.correctAnswer")}: <strong>{item.correctAnswer}</strong>
                      </span>
                    </div>
                  )}
                  {item.explanation && (
                    <p className="text-xs text-muted leading-relaxed">{item.explanation}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="backdrop-blur-xl bg-bg/70 border-t border-divider">
          <div className="max-w-lg mx-auto p-4">
            <button
              onClick={() => { haptic("light"); onGoHome(); }}
              className="btn-primary w-full"
            >
              {t("results.backToTests")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
