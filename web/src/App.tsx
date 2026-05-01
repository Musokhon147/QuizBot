import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { getTelegramUser, getTelegramWebApp, fetchTest, type TgUser, type SubmitResult, type Test } from "./lib/api.ts";
import { useStore } from "./store/index.ts";
import "./i18n/index.ts";

import PhoneGate from "./components/PhoneGate.tsx";
import TabBar from "./components/TabBar.tsx";
import Home from "./pages/Home.tsx";
import Config from "./pages/Config.tsx";
import Quiz from "./pages/Quiz.tsx";
import Results from "./pages/Results.tsx";
import History from "./pages/History.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Profile from "./pages/Profile.tsx";

type Page = "home" | "config" | "quiz" | "results" | "history" | "leaderboard" | "profile";
type Tab = "home" | "history" | "leaderboard" | "profile";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [testId, setTestId] = useState<string | null>(null);
  const [testData, setTestData] = useState<Test | null>(null);
  const [resultData, setResultData] = useState<SubmitResult | null>(null);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [authenticated, setAuthenticated] = useState(false);
  const user: TgUser = getTelegramUser();
  const store = useStore();

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", store.theme);
  }, [store.theme]);

  // Check if already authenticated
  useEffect(() => {
    const saved = localStorage.getItem("phone-verified");
    if (saved) setAuthenticated(true);
  }, []);

  useEffect(() => {
    store.setUser(user.id.toString(), user.first_name);
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("testId");
    if (id) {
      setTestId(id);
      fetchTest(id).then((t) => {
        setTestData(t);
        setPage("config");
      }).catch(() => setPage("home"));
    }

    const tg = getTelegramWebApp();
    if (tg) {
      tg.BackButton.onClick(() => {
        if (page === "quiz" || page === "results" || page === "config") {
          setPage("home");
          setActiveTab("home");
          setTestId(null);
          setTestData(null);
          setResultData(null);
          tg.BackButton.hide();
        }
      });
    }
  }, [authenticated]);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      const showBack = page === "quiz" || page === "results" || page === "config";
      if (showBack) tg.BackButton.show();
      else tg.BackButton.hide();
    }
  }, [page]);

  const handlePhoneAuth = (phone: string) => {
    localStorage.setItem("phone-verified", phone);
    setAuthenticated(true);
  };

  if (!authenticated) {
    return <PhoneGate onAuthenticated={handlePhoneAuth} />;
  }

  const showTabBar = ["home", "history", "leaderboard", "profile"].includes(page);

  const openTest = async (id: string) => {
    setTestId(id);
    try {
      const t = await fetchTest(id);
      setTestData(t);
      setPage("config");
    } catch {
      setPage("home");
    }
  };

  const startQuiz = (config: { timePerQuestion: number }) => {
    setTimePerQuestion(config.timePerQuestion);
    setPage("quiz");
  };

  const showResults = (data: SubmitResult) => {
    setResultData(data);
    setPage("results");
  };

  const goHome = () => {
    setPage("home");
    setActiveTab("home");
    setTestId(null);
    setTestData(null);
    setResultData(null);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(tab);
  };

  const pageTransition = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  };

  const isDark = store.theme === "dark";

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-bg" />
      <div
        className="fixed inset-0"
        style={{
          background: `radial-gradient(at 20% 80%, var(--mesh-1) 0%, transparent 50%),
                       radial-gradient(at 80% 20%, var(--mesh-2) 0%, transparent 50%),
                       radial-gradient(at 50% 50%, var(--mesh-3) 0%, transparent 70%)`,
        }}
      />

      {isDark && (
        <>
          <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/[0.07] blur-[100px] animate-pulse-soft pointer-events-none" />
          <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-mint/[0.05] blur-[100px] animate-pulse-soft pointer-events-none" style={{ animationDelay: "1.5s" }} />
        </>
      )}

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {page === "home" && (
            <motion.div key="home" {...pageTransition}>
              <Home user={user} onStartQuiz={openTest} />
            </motion.div>
          )}
          {page === "config" && testData && (
            <motion.div key="config" {...pageTransition}>
              <Config test={testData} onStart={startQuiz} />
            </motion.div>
          )}
          {page === "quiz" && testId && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Quiz testId={testId} user={user} onFinish={showResults} timePerQuestion={timePerQuestion} />
            </motion.div>
          )}
          {page === "results" && resultData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Results data={resultData} onGoHome={goHome} />
            </motion.div>
          )}
          {page === "history" && (
            <motion.div key="history" {...pageTransition}>
              <History user={user} onStartQuiz={openTest} />
            </motion.div>
          )}
          {page === "leaderboard" && (
            <motion.div key="leaderboard" {...pageTransition}>
              <Leaderboard user={user} />
            </motion.div>
          )}
          {page === "profile" && (
            <motion.div key="profile" {...pageTransition}>
              <Profile user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showTabBar && <TabBar active={activeTab} onChange={handleTabChange} />}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDark ? "rgba(30, 35, 55, 0.95)" : "rgba(255, 255, 255, 0.95)",
            color: isDark ? "#e2e8f0" : "#1a1d2e",
            backdropFilter: "blur(20px)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            borderRadius: "16px",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.08)",
          },
        }}
      />
    </div>
  );
}
