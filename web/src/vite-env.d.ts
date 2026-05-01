/// <reference types="vite/client" />

interface TelegramWebAppUser {
  id: number | string;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  initDataUnsafe: {
    user?: TelegramWebAppUser;
  };
  colorScheme: "light" | "dark";
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
