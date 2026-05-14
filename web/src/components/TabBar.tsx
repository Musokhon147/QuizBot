import type { ReactElement } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { haptic } from "../lib/api.ts";

type Tab = "home" | "history" | "leaderboard" | "profile" | "admin";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  showAdmin?: boolean;
}

const tabs: { id: Tab; icon: (active: boolean) => ReactElement }[] = [
  {
    id: "home",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "history",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "leaderboard",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    id: "profile",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const adminTab: { id: Tab; icon: (active: boolean) => ReactElement } = {
  id: "admin",
  icon: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

export default function TabBar({ active, onChange, showAdmin = false }: Props) {
  const { t } = useTranslation();
  const visibleTabs = showAdmin ? [...tabs, adminTab] : tabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <div className="backdrop-blur-2xl bg-bg/80 border-t border-divider">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
          {visibleTabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptic("light");
                  onChange(tab.id);
                }}
                className="relative flex flex-col items-center gap-0.5 py-1.5 px-4 transition-colors"
              >
                <div className={`transition-colors ${isActive ? "text-accent-light" : "text-muted"}`}>
                  {tab.icon(isActive)}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-accent-light" : "text-muted"}`}>
                  {t(`nav.${tab.id}`)}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-1.5 w-5 h-0.5 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
