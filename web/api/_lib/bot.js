import { Bot, InlineKeyboard } from "grammy";
import { extractTextFromPDF } from "./pdf.js";
import { parseQuestionsFromText } from "./parser.js";
import { saveTest, upsertUser } from "./supabase.js";

const messages = {
  uz: {
    welcomeUser:
      "TestBot ga xush kelibsiz! Bu yerda barcha mavjud testlarni yechishingiz mumkin.\n\n" +
      "Mini app ni ochish uchun pastdagi tugmani bosing.",
    welcomeAdmin:
      "TestBot — admin paneliga xush kelibsiz!\n\n" +
      "Test yaratish uchun:\n" +
      "1. Savollar va javoblar bilan PDF yuboring\n" +
      "2. Bot avtomatik test yaratadi\n" +
      "3. Test barcha foydalanuvchilarga ko'rinadi\n\n" +
      "PDF formati: raqamlangan savollar va har birining ostida `Javob:` qatori.",
    openTests: "Testlarni ochish",
    processing: "PDF qayta ishlanmoqda... Biroz kuting.",
    extracting: "Matn chiqarilmoqda...",
    analyzing: "Savollar tahlil qilinmoqda...",
    testCreated: (title, count) =>
      `Test yaratildi: "${title}"\n${count} ta savol topildi.\n\nBarcha foydalanuvchilar endi ko'ra oladi.`,
    takeTest: "Testni boshlash",
    pdfOnly: "Iltimos, PDF fayl yuboring.",
    tooLarge: "Fayl juda katta. Maksimal o'lcham 10MB.",
    noText: "Bu PDF dan matn chiqarib bo'lmadi. Text-based PDF yuboring.",
    noQuestions: "PDF da savol topilmadi. Raqamlangan savollar va `Javob:` qatorlari bo'lishi kerak.",
    error: "PDF ni qayta ishlashda xatolik yuz berdi. Qayta urinib ko'ring.",
    adminOnly:
      "Faqat administratorlar test yuklay oladi.\n\n" +
      "Mavjud testlarni yechish uchun /start buyrug'idan foydalaning.",
    help:
      "Mavjud buyruqlar:\n/start — Botni boshlash\n/lang — Tilni o'zgartirish\n/whoami — Mening Telegram ID raqamim\n/help — Yordam",
    langChanged: "Til o'zbekchaga o'zgartirildi!",
    chooseLang: "Tilni tanlang:",
    whoami: (id, isAdmin) =>
      `Sizning Telegram ID: ${id}\nStatus: ${isAdmin ? "Administrator" : "Foydalanuvchi"}`,
  },
  ru: {
    welcomeUser:
      "Добро пожаловать в TestBot! Здесь вы можете решать все доступные тесты.\n\n" +
      "Нажмите кнопку ниже чтобы открыть мини-приложение.",
    welcomeAdmin:
      "TestBot — добро пожаловать в админ-панель!\n\n" +
      "Чтобы создать тест:\n" +
      "1. Отправьте PDF с вопросами и ответами\n" +
      "2. Бот автоматически создаст тест\n" +
      "3. Тест увидят все пользователи\n\n" +
      "Формат PDF: пронумерованные вопросы и строка `Ответ:` под каждым.",
    openTests: "Открыть тесты",
    processing: "Обработка PDF... Подождите.",
    extracting: "Извлечение текста...",
    analyzing: "Анализ вопросов...",
    testCreated: (title, count) =>
      `Тест создан: "${title}"\nНайдено ${count} вопросов.\n\nТеперь его видят все пользователи.`,
    takeTest: "Начать тест",
    pdfOnly: "Пожалуйста, отправьте PDF файл.",
    tooLarge: "Файл слишком большой. Максимум 10МБ.",
    noText: "Не удалось извлечь текст из PDF. Отправьте текстовый PDF.",
    noQuestions: "В PDF не найдено вопросов. Используйте формат с пронумерованными вопросами и строкой `Ответ:`.",
    error: "Ошибка обработки PDF. Попробуйте снова.",
    adminOnly:
      "Только администраторы могут загружать тесты.\n\n" +
      "Чтобы решать тесты, используйте команду /start.",
    help:
      "Доступные команды:\n/start — Запуск бота\n/lang — Сменить язык\n/whoami — Мой Telegram ID\n/help — Помощь",
    langChanged: "Язык изменён на русский!",
    chooseLang: "Выберите язык:",
    whoami: (id, isAdmin) =>
      `Ваш Telegram ID: ${id}\nСтатус: ${isAdmin ? "Администратор" : "Пользователь"}`,
  },
  en: {
    welcomeUser:
      "Welcome to TestBot! Here you can take all available tests.\n\n" +
      "Tap the button below to open the mini app.",
    welcomeAdmin:
      "TestBot — welcome to the admin panel!\n\n" +
      "To create a test:\n" +
      "1. Send a PDF with questions and answers\n" +
      "2. The bot will create the test automatically\n" +
      "3. All users will see the test\n\n" +
      "PDF format: numbered questions with an `Answer:` line under each.",
    openTests: "Open Tests",
    processing: "Processing your PDF...",
    extracting: "Extracting text from PDF...",
    analyzing: "Analyzing questions...",
    testCreated: (title, count) =>
      `Test created: "${title}"\n${count} questions found.\n\nAll users can now see it.`,
    takeTest: "Take Test",
    pdfOnly: "Please send a PDF file.",
    tooLarge: "File is too large. Maximum size is 10MB.",
    noText: "Could not extract text from this PDF. Please send a text-based PDF.",
    noQuestions: "No questions found. Use a PDF with numbered questions and `Answer:` lines.",
    error: "Something went wrong while processing your PDF. Please try again.",
    adminOnly:
      "Only administrators can upload tests.\n\n" +
      "To take tests, use the /start command.",
    help:
      "Available commands:\n/start — Start the bot\n/lang — Change language\n/whoami — My Telegram ID\n/help — Help",
    langChanged: "Language changed to English!",
    chooseLang: "Choose language:",
    whoami: (id, isAdmin) =>
      `Your Telegram ID: ${id}\nStatus: ${isAdmin ? "Administrator" : "User"}`,
  },
};

const userLangs = new Map();

function getMsg(userId) {
  return messages[userLangs.get(userId) || "uz"];
}

function webAppUrl() {
  return process.env.WEB_APP_URL || "https://example.vercel.app";
}

function getAdminIds() {
  return (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAdmin(userId) {
  return getAdminIds().includes(userId.toString());
}

export function createBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");

  const bot = new Bot(token);

  bot.command("start", async (ctx) => {
    const msg = getMsg(ctx.from.id);
    const userId = ctx.from.id.toString();
    try {
      await upsertUser(
        userId,
        [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" "),
        ctx.from.username,
        null
      );
    } catch (e) {
      console.error("upsertUser error:", e);
    }

    const text = isAdmin(userId) ? msg.welcomeAdmin : msg.welcomeUser;
    await ctx.reply(text, {
      reply_markup: new InlineKeyboard().webApp(msg.openTests, webAppUrl()),
    });
  });

  bot.command("whoami", async (ctx) => {
    const msg = getMsg(ctx.from.id);
    const userId = ctx.from.id.toString();
    await ctx.reply(msg.whoami(userId, isAdmin(userId)));
  });

  bot.command("lang", async (ctx) => {
    const msg = getMsg(ctx.from.id);
    await ctx.reply(msg.chooseLang, {
      reply_markup: new InlineKeyboard()
        .text("🇺🇿 O'zbek", "lang_uz")
        .text("🇷🇺 Русский", "lang_ru")
        .text("🇺🇸 English", "lang_en"),
    });
  });

  bot.callbackQuery(/^lang_(.+)$/, async (ctx) => {
    const lang = ctx.match[1];
    userLangs.set(ctx.from.id, lang);
    const msg = messages[lang];
    await ctx.answerCallbackQuery(msg.langChanged);
    await ctx.editMessageText(msg.langChanged);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(getMsg(ctx.from.id).help);
  });

  bot.on("message:document", async (ctx) => {
    const userId = ctx.from.id.toString();
    const msg = getMsg(ctx.from.id);

    if (!isAdmin(userId)) {
      return ctx.reply(msg.adminOnly);
    }

    const doc = ctx.message.document;
    if (doc.mime_type !== "application/pdf") return ctx.reply(msg.pdfOnly);
    if (doc.file_size > 10 * 1024 * 1024) return ctx.reply(msg.tooLarge);

    const statusMsg = await ctx.reply(msg.processing);

    try {
      const file = await ctx.api.getFile(doc.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, msg.extracting);
      const pdfText = await extractTextFromPDF(buffer);
      if (!pdfText.trim()) {
        return ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, msg.noText);
      }

      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, msg.analyzing);
      const parsed = parseQuestionsFromText(pdfText);
      if (!parsed.questions.length) {
        return ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, msg.noQuestions);
      }

      const test = await saveTest(userId, parsed.title, parsed.questions);
      const testUrl = `${webAppUrl()}?testId=${test.id}`;

      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        msg.testCreated(parsed.title, parsed.questions.length),
        { reply_markup: new InlineKeyboard().webApp(msg.takeTest, testUrl) }
      );
    } catch (err) {
      console.error("PDF processing error:", err);
      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, msg.error);
    }
  });

  return bot;
}
