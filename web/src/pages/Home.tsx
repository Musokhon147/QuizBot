import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { fetchAllTests, haptic, type TgUser, type TestListItem } from "../lib/api.ts";
import { useStore } from "../store/index.ts";

interface Props {
  user: TgUser;
  onStartQuiz: (id: string) => void;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const subjectIcons: Record<string, string> = {
  bio: "\u{1F9EC}",
  hist: "\u{1F30D}",
  math: "\u{1F4D0}",
  phys: "\u{269B}\u{FE0F}",
  chem: "\u{1F9EA}",
  eng: "\u{1F4D6}",
  comp: "\u{1F4BB}",
};

function getIcon(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("bio") || lower.includes("cell")) return subjectIcons.bio;
  if (lower.includes("hist") || lower.includes("revolution")) return subjectIcons.hist;
  if (lower.includes("math") || lower.includes("algebra") || lower.includes("calcul")) return subjectIcons.math;
  if (lower.includes("phys") || lower.includes("motion")) return subjectIcons.phys;
  if (lower.includes("chem") || lower.includes("element")) return subjectIcons.chem;
  if (lower.includes("eng") || lower.includes("liter")) return subjectIcons.eng;
  if (lower.includes("comp") || lower.includes("program") || lower.includes("code")) return subjectIcons.comp;
  return "\u{1F4DD}";
}

function getAccent(i: number): string {
  const accents = [
    "from-accent/20 to-accent/5",
    "from-mint/20 to-mint/5",
    "from-purple-500/20 to-indigo-500/5",
    "from-cyan-400/20 to-blue-500/5",
    "from-amber-400/20 to-orange-500/5",
  ];
  return accents[i % accents.length];
}

export default function Home({ user, onStartQuiz }: Props) {
  const { t } = useTranslation();
  const store = useStore();
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const streak = store.getStreak();
  const avgScore = store.getAvgScore();

  useEffect(() => {
    fetchAllTests(100, user.id.toString())
      .then((data) => setTests(data))
      .catch((err) => {
        console.error("Failed to load tests:", err);
        setTests([]);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="px-5 pt-8 pb-6 max-w-lg mx-auto min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-mint flex items-center justify-center text-foreground font-bold text-sm shadow-glow">
            {user.first_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-muted text-sm font-medium">{t("home.welcome")}</p>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {user.first_name}
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="card rounded-3xl p-5 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold gradient-text">{loading ? "-" : tests.length}</p>
            <p className="text-xs text-muted mt-0.5 font-medium">{t("home.tests")}</p>
          </div>
          <div className="w-px h-8 bg-glass-border" />
          <div className="text-center flex-1">
            <p className="text-2xl font-bold gradient-text">{streak > 0 ? `${streak}d` : `${avgScore}%`}</p>
            <p className="text-xs text-muted mt-0.5 font-medium">{streak > 0 ? "Streak" : t("leaderboard.accuracy")}</p>
          </div>
          <div className="w-px h-8 bg-glass-border" />
          <div className="text-center flex-1">
            <p className="text-2xl font-bold gradient-text">
              {loading ? "-" : tests.reduce((s, t) => s + (t.questions?.[0]?.count || 0), 0)}
            </p>
            <p className="text-xs text-muted mt-0.5 font-medium">{t("common.questions")}</p>
          </div>
        </div>
      </motion.div>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-between mb-4"
      >
        <h2 className="text-base font-semibold text-subtle tracking-wide uppercase">
          {t("home.tests")}
        </h2>
        <span className="text-xs text-muted font-medium">
          {!loading && `${tests.length} ${t("home.testsTotal")}`}
        </span>
      </motion.div>

      {/* Test list */}
      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-accent/30 border-t-accent animate-spin" />
          <p className="text-muted text-sm">Loading tests...</p>
        </div>
      ) : tests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card rounded-3xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent/20 to-mint/10 flex items-center justify-center">
            <span className="text-3xl">📄</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t("home.noTests")}</h3>
          <p className="text-muted text-sm leading-relaxed">
            {t("home.noTestsHint")}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {tests.map((test, i) => (
            <motion.button
              key={test.id}
              variants={fadeUp}
              onClick={() => {
                haptic("light");
                onStartQuiz(test.id);
              }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left group"
            >
              <div className="card card-hover rounded-2xl p-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAccent(i)} flex items-center justify-center shrink-0`}>
                    <span className="text-xl">{getIcon(test.title)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-[15px] leading-snug truncate group-hover:text-accent-light transition-colors">
                      {test.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted font-medium">
                        {test.questions?.[0]?.count || "?"} questions
                      </span>
                      <span className="w-1 h-1 rounded-full bg-muted/30" />
                      <span className="text-xs text-muted">
                        {new Date(test.created_at).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {test.users?.name && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-muted/30" />
                          <span className="text-xs text-muted truncate">
                            by {test.users.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 text-muted group-hover:text-accent-light transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
