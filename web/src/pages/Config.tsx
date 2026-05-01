import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { haptic, type Test } from "../lib/api.ts";
import { useStore } from "../store/index.ts";

interface Props {
  test: Test;
  onStart: (config: { timePerQuestion: number }) => void;
}

const timeOptions = [0, 15, 30, 45, 60];

export default function Config({ test, onStart }: Props) {
  const { t } = useTranslation();
  const { quizConfig, setQuizConfig } = useStore();
  const [selectedTime, setSelectedTime] = useState(quizConfig.timePerQuestion);

  const totalQ = test.questions.length;

  return (
    <div className="px-5 pt-8 pb-28 max-w-lg mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Title */}
        <h1 className="text-xl font-bold text-foreground mb-1">{t("config.title")}</h1>
        <p className="text-muted text-sm mb-8">{test.title}</p>

        {/* Question count */}
        <div className="card rounded-2xl p-5 mb-4">
          <h3 className="text-sm font-semibold text-subtle uppercase tracking-wider mb-3">
            {t("config.questionCount")}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-accent-light">{totalQ}</span>
            </div>
            <span className="text-muted text-sm">{t("common.questions")}</span>
          </div>
        </div>

        {/* Time per question */}
        <div className="card rounded-2xl p-5 mb-4">
          <h3 className="text-sm font-semibold text-subtle uppercase tracking-wider mb-4">
            {t("config.timePerQuestion")}
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {timeOptions.map((sec) => {
              const isActive = selectedTime === sec;
              return (
                <button
                  key={sec}
                  onClick={() => {
                    haptic("light");
                    setSelectedTime(sec);
                    setQuizConfig({ timePerQuestion: sec });
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-accent text-foreground shadow-glow"
                      : "bg-glass text-muted border border-divider hover:border-glass-hover"
                  }`}
                >
                  {sec === 0 ? t("config.noLimit") : `${sec} ${t("config.seconds")}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary card */}
        <motion.div
          className="card gradient-border rounded-2xl p-5 mb-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted text-sm">{t("common.questions")}</span>
            <span className="text-foreground font-semibold">{totalQ}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted text-sm">{t("common.time")}</span>
            <span className="text-foreground font-semibold">
              {selectedTime === 0
                ? t("config.noLimit")
                : `${selectedTime} ${t("config.seconds")}/${t("common.question")}`}
            </span>
          </div>
          {selectedTime > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted text-sm">{t("common.total")}</span>
              <span className="text-foreground font-semibold">
                {Math.floor((totalQ * selectedTime) / 60)} min
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Start button */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="backdrop-blur-xl bg-bg/70 border-t border-divider">
          <div className="max-w-lg mx-auto p-4">
            <button
              onClick={() => {
                haptic("medium");
                onStart({ timePerQuestion: selectedTime });
              }}
              className="btn-primary w-full text-base"
            >
              {t("config.startTest")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
