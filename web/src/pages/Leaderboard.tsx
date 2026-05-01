import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { fetchLeaderboard, type LeaderboardEntry, type TgUser } from "../lib/api.ts";

interface Props {
  user: TgUser;
}

const medalColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

export default function Leaderboard({ user }: Props) {
  const { t } = useTranslation();
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard(50)
      .then((data) => setBoard(data))
      .catch((err) => {
        console.error("Failed to load leaderboard:", err);
        setBoard([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const top3 = board.slice(0, 3);
  const rest = board.slice(3);
  const userId = user.id.toString();

  return (
    <div className="px-5 pt-8 pb-24 max-w-lg mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl font-bold text-foreground">{t("leaderboard.title")}</h1>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-accent/30 border-t-accent animate-spin" />
          <p className="text-muted text-sm">Loading leaderboard...</p>
        </div>
      ) : board.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card rounded-3xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
            <span className="text-3xl">{"\u{1F3C6}"}</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No rankings yet</h3>
          <p className="text-muted text-sm">Take a quiz to be the first on the leaderboard!</p>
        </motion.div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-end justify-center gap-3 mb-8 px-2"
            >
              {[1, 0, 2].map((idx) => {
                const entry = top3[idx];
                if (!entry) return null;
                const isCenter = idx === 0;
                const displayName = entry.name || entry.username || "?";
                return (
                  <div
                    key={entry.telegram_id || idx}
                    className={`flex flex-col items-center ${
                      isCenter ? "order-2" : idx === 1 ? "order-1" : "order-3"
                    }`}
                  >
                    <span className="text-2xl mb-1">{medals[idx]}</span>
                    <div
                      className={`rounded-full bg-gradient-to-br from-accent to-mint flex items-center justify-center text-foreground font-bold shadow-glow ${
                        isCenter ? "w-16 h-16 text-xl" : "w-12 h-12 text-sm"
                      }`}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-semibold text-foreground mt-1.5 truncate max-w-[80px]">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-muted">{entry.avg_pct ?? 0}%</p>
                    <div
                      className={`w-full rounded-t-xl mt-1 bg-glass border border-divider flex items-end justify-center ${
                        isCenter ? "h-20" : idx === 1 ? "h-14" : "h-10"
                      }`}
                    >
                      <span className={`text-sm font-bold mb-2 ${medalColors[idx]}`}>
                        {entry.score_index ?? 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Rest of leaderboard */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((entry, i) => {
                const rank = i + 4;
                const isYou = entry.telegram_id === userId;
                const displayName = entry.name || entry.username || "?";
                return (
                  <motion.div
                    key={entry.telegram_id || i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className={`rounded-2xl p-4 flex items-center gap-3 ${
                      isYou ? "card gradient-border" : "card"
                    }`}
                  >
                    <span className="w-7 text-sm font-bold text-muted text-center">{rank}</span>
                    <div className="w-9 h-9 rounded-full bg-glass flex items-center justify-center text-sm font-semibold text-subtle">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isYou ? "text-accent-light" : "text-foreground"}`}>
                        {displayName} {isYou && `(${t("leaderboard.you")})`}
                      </p>
                      <p className="text-xs text-muted">
                        {entry.attempts ?? 0} {t("leaderboard.attempts").toLowerCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{entry.score_index ?? 0}</p>
                      <p className="text-xs text-muted">{entry.avg_pct ?? 0}%</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
