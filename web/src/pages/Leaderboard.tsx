import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { TgUser } from "../lib/api.ts";

interface Props {
  user: TgUser;
}

const mockLeaderboard = [
  { id: "1", name: "Aziz", score: 2450, attempts: 42, avgPct: 92 },
  { id: "2", name: "Dilnoza", score: 2180, attempts: 38, avgPct: 88 },
  { id: "3", name: "Jasur", score: 1920, attempts: 35, avgPct: 85 },
  { id: "dev-user", name: "Dev", score: 1650, attempts: 28, avgPct: 79 },
  { id: "5", name: "Malika", score: 1480, attempts: 25, avgPct: 76 },
  { id: "6", name: "Sherzod", score: 1200, attempts: 22, avgPct: 71 },
  { id: "7", name: "Nilufar", score: 980, attempts: 18, avgPct: 68 },
];

const medalColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

export default function Leaderboard({ user }: Props) {
  const { t } = useTranslation();

  return (
    <div className="px-5 pt-8 pb-24 max-w-lg mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl font-bold text-foreground">{t("leaderboard.title")}</h1>
      </motion.div>

      {/* Top 3 podium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-end justify-center gap-3 mb-8 px-2"
      >
        {[1, 0, 2].map((idx) => {
          const entry = mockLeaderboard[idx];
          const isCenter = idx === 0;
          return (
            <div
              key={idx}
              className={`flex flex-col items-center ${isCenter ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}
            >
              <span className="text-2xl mb-1">{medals[idx]}</span>
              <div
                className={`rounded-full bg-gradient-to-br from-accent to-mint flex items-center justify-center text-foreground font-bold shadow-glow ${
                  isCenter ? "w-16 h-16 text-xl" : "w-12 h-12 text-sm"
                }`}
              >
                {entry.name.charAt(0)}
              </div>
              <p className="text-xs font-semibold text-foreground mt-1.5 truncate max-w-[80px]">{entry.name}</p>
              <p className="text-[10px] text-muted">{entry.avgPct}%</p>
              <div
                className={`w-full rounded-t-xl mt-1 bg-glass border border-divider flex items-end justify-center ${
                  isCenter ? "h-20" : idx === 1 ? "h-14" : "h-10"
                }`}
              >
                <span className={`text-sm font-bold mb-2 ${medalColors[idx]}`}>{entry.score}</span>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Rest of leaderboard */}
      <div className="space-y-2">
        {mockLeaderboard.slice(3).map((entry, i) => {
          const rank = i + 4;
          const isYou = entry.id === user.id.toString();
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className={`rounded-2xl p-4 flex items-center gap-3 ${
                isYou
                  ? "card gradient-border"
                  : "card"
              }`}
            >
              <span className="w-7 text-sm font-bold text-muted text-center">{rank}</span>
              <div className="w-9 h-9 rounded-full bg-glass flex items-center justify-center text-sm font-semibold text-subtle">
                {entry.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isYou ? "text-accent-light" : "text-foreground"}`}>
                  {entry.name} {isYou && `(${t("leaderboard.you")})`}
                </p>
                <p className="text-xs text-muted">
                  {entry.attempts} {t("leaderboard.attempts").toLowerCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{entry.score}</p>
                <p className="text-xs text-muted">{entry.avgPct}%</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
