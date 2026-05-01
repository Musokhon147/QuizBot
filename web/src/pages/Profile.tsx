import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { setLanguage } from "../i18n/index.ts";
import {
  fetchStreak,
  fetchLeaderboard,
  haptic,
  type TgUser,
} from "../lib/api.ts";
import { useStore } from "../store/index.ts";

interface Props {
  user: TgUser;
}

const languages = [
  { code: "uz", label: "O'zbek", flag: "\u{1F1FA}\u{1F1FF}" },
  { code: "ru", label: "Русский", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "en", label: "English", flag: "\u{1F1FA}\u{1F1F8}" },
];

export default function Profile({ user }: Props) {
  const { t, i18n } = useTranslation();
  const store = useStore();

  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({
    avgPct: 0,
    totalCorrect: 0,
    attempts: 0,
  });

  useEffect(() => {
    const userId = user.id.toString();
    fetchStreak(userId)
      .then((d) => setStreak(d.streak))
      .catch((err) => console.error("streak fetch failed:", err));

    fetchLeaderboard(50)
      .then((board) => {
        const me = board.find((e) => e.telegram_id === userId);
        if (me) {
          setStats({
            avgPct: me.avg_pct ?? 0,
            totalCorrect: me.total_correct ?? 0,
            attempts: me.attempts ?? 0,
          });
        }
      })
      .catch((err) => console.error("leaderboard fetch failed:", err));
  }, [user.id]);

  return (
    <div className="px-5 pt-8 pb-24 max-w-lg mx-auto min-h-screen">
      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card rounded-3xl p-6 mb-6 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-accent to-mint flex items-center justify-center text-white text-2xl font-bold shadow-glow">
          {user.first_name.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-lg font-bold text-foreground">{user.first_name}</h2>
        <p className="text-muted text-sm">ID: {user.id}</p>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        {[
          { label: "Streak", value: `${streak}d`, icon: "\u{1F525}" },
          { label: t("leaderboard.accuracy"), value: `${stats.avgPct}%`, icon: "\u{1F3AF}" },
          { label: t("common.correct"), value: stats.totalCorrect.toString(), icon: "✅" },
          { label: t("leaderboard.attempts"), value: stats.attempts.toString(), icon: "\u{1F4CA}" },
        ].map((stat, i) => (
          <div key={i} className="card rounded-2xl p-4 text-center">
            <span className="text-xl block mb-1">{stat.icon}</span>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Language selector */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card rounded-2xl p-5 mb-4"
      >
        <h3 className="text-sm font-semibold text-subtle uppercase tracking-wider mb-3">
          {t("profile.language")}
        </h3>
        <div className="flex gap-2">
          {languages.map((lang) => {
            const isActive = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  haptic("light");
                  setLanguage(lang.code);
                  store.setLanguage(lang.code);
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-accent text-white shadow-glow"
                    : "bg-glass text-muted border border-glass-border"
                }`}
              >
                <span className="block text-base mb-0.5">{lang.flag}</span>
                {lang.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Theme toggle */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card rounded-2xl p-5 mb-4"
      >
        <h3 className="text-sm font-semibold text-subtle uppercase tracking-wider mb-3">
          {t("profile.theme")}
        </h3>
        <div className="flex gap-2">
          {[
            { id: "light" as const, label: t("profile.themeLight"), icon: "☀️" },
            { id: "dark" as const, label: t("profile.themeDark"), icon: "\u{1F319}" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                haptic("light");
                store.setTheme(opt.id);
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                store.theme === opt.id
                  ? "bg-accent text-white shadow-glow"
                  : "bg-glass text-muted border border-glass-border"
              }`}
            >
              <span className="block text-base mb-0.5">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card rounded-2xl p-5"
      >
        <h3 className="text-sm font-semibold text-subtle uppercase tracking-wider mb-3">
          {t("profile.about")}
        </h3>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted">{t("profile.version")}</span>
          <span className="text-sm text-subtle font-medium">1.0.0</span>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-divider">
          <span className="text-sm text-muted">PDF Parser</span>
          <span className="text-sm text-subtle font-medium">Auto</span>
        </div>
      </motion.div>
    </div>
  );
}
