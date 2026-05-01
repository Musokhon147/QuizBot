import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getTelegramWebApp, haptic } from "../lib/api.ts";

interface Props {
  onAuthenticated: (phone: string) => void;
}

export default function PhoneGate({ onAuthenticated }: Props) {
  const { t } = useTranslation();
  const [requesting, setRequesting] = useState(false);

  const requestPhone = () => {
    haptic("medium");
    setRequesting(true);

    const tg = getTelegramWebApp();

    if (tg && "requestContact" in tg) {
      (tg as any).requestContact((sent: boolean, event?: any) => {
        if (sent && event?.responseUnsafe?.contact?.phone_number) {
          onAuthenticated(event.responseUnsafe.contact.phone_number);
        } else {
          setRequesting(false);
        }
      });
    } else {
      onAuthenticated("+998901234567");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      {/* Background */}
      <div className="fixed inset-0 bg-bg" />
      <div
        className="fixed inset-0"
        style={{
          background: `radial-gradient(at 30% 70%, var(--mesh-1) 0%, transparent 50%),
                       radial-gradient(at 70% 30%, var(--mesh-2) 0%, transparent 50%)`,
        }}
      />

      <motion.div
        className="relative z-10 text-center max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-accent to-mint flex items-center justify-center shadow-glow">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">TestBot</h1>
        <p className="text-muted text-sm mb-8 leading-relaxed">
          {t("auth.description")}
        </p>

        <button
          onClick={requestPhone}
          disabled={requesting}
          className="btn-primary w-full text-base flex items-center justify-center gap-2"
        >
          {requesting ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              {t("auth.sharePhone")}
            </>
          )}
        </button>

        <p className="text-muted text-xs mt-4">
          {t("auth.hint")}
        </p>
      </motion.div>
    </div>
  );
}
