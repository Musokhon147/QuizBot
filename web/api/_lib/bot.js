import { Bot, InlineKeyboard } from "grammy";
import { extractText, SUPPORTED_MIME_TYPES } from "./extract.js";
import {
  parseQuestionsFromText,
  extractQuestionTexts,
  guessTitleFromText,
} from "./parser.js";
import { generateOptionsAndAnswers } from "./ai.js";
import { saveTest, upsertUser, getUserRole } from "./supabase.js";


const messages = {
  uz: {
    welcomeUser:
      "TestBot ga xush kelibsiz! Bu yerda barcha mavjud testlarni yechishingiz mumkin.\n\n" +
      "Mini app ni ochish uchun pastdagi tugmani bosing.",
    welcomeAdmin:
      "TestBot — admin paneliga xush kelibsiz!\n\n" +
      "Test yaratish uchun PDF yoki DOCX fayl yuboring.\n\n" +
      "Fayl formati:\n" +
      "• Raqamlangan savollar (1. 2. 3. ...)\n" +
      "• Har bir savol ostida `Javob: ...` qatori, yoki\n" +
      "• A/B/C/D variantlari (to'g'ri javob ✓ belgisi bilan)\n\n" +
      "Test barcha foydalanuvchilarga ko'rinadi.",
    openTests: "Testlarni ochish",
    processing: "PDF qayta ishlanmoqda... Biroz kuting.",
    extracting: "Matn chiqarilmoqda...",
    analyzing: "Savollar tahlil qilinmoqda...",
    testCreated: (title, count) =>
      `Test yaratildi: "${title}"\n${count} ta savol topildi.\n\nBarcha foydalanuvchilar endi ko'ra oladi.`,
    takeTest: "Testni boshlash",
    pdfOnly: "Iltimos, PDF yoki DOCX fayl yuboring.",
    legacyDoc: "Eski .doc formati qo'llab-quvvatlanmaydi. Iltimos, faylni .docx sifatida saqlang va qayta yuboring.",
    tooLarge: "Fayl juda katta. Maksimal o'lcham 10MB.",
    noText: "Fayldan matn chiqarib bo'lmadi. Matn asosli (text-based) faylni yuboring.",
    noQuestions: "Faylda savol topilmadi. Raqamlangan savollar bo'lishi kerak.",
    noAnswers:
      "Faylda javoblar topilmadi. Test yaratish uchun har bir savol ostida `Javob: ...` qatori yoki A/B/C/D variantlari (✓ belgisi bilan to'g'ri javob) bo'lishi kerak.\n\n" +
      "Misol:\n" +
      "1. Savol matni?\n" +
      "Javob: To'g'ri javob.",
    aiGenerating: "AI savollar uchun variantlar va to'g'ri javoblarni yaratmoqda... Bu 1-2 daqiqa olishi mumkin.",
    error: "Faylni qayta ishlashda xatolik yuz berdi. Qayta urinib ko'ring.",
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
      "Чтобы создать тест, отправьте PDF или DOCX файл.\n\n" +
      "Формат файла:\n" +
      "• Пронумерованные вопросы (1. 2. 3. ...)\n" +
      "• Под каждым вопросом строка `Ответ: ...`, или\n" +
      "• Варианты A/B/C/D (правильный отмечен ✓)\n\n" +
      "Тест увидят все пользователи.",
    openTests: "Открыть тесты",
    processing: "Обработка PDF... Подождите.",
    extracting: "Извлечение текста...",
    analyzing: "Анализ вопросов...",
    testCreated: (title, count) =>
      `Тест создан: "${title}"\nНайдено ${count} вопросов.\n\nТеперь его видят все пользователи.`,
    takeTest: "Начать тест",
    pdfOnly: "Пожалуйста, отправьте PDF или DOCX файл.",
    legacyDoc: "Старый формат .doc не поддерживается. Сохраните файл как .docx и отправьте снова.",
    tooLarge: "Файл слишком большой. Максимум 10МБ.",
    noText: "Не удалось извлечь текст из файла. Отправьте текстовый файл.",
    noQuestions: "В файле не найдено вопросов. Должны быть пронумерованные вопросы.",
    noAnswers:
      "В файле не найдено ответов. Чтобы создать тест, под каждым вопросом должна быть строка `Ответ: ...` или варианты A/B/C/D (с ✓ у правильного ответа).\n\n" +
      "Пример:\n" +
      "1. Текст вопроса?\n" +
      "Ответ: Правильный ответ.",
    aiGenerating: "AI генерирует варианты и правильные ответы для вопросов... Это может занять 1-2 минуты.",
    error: "Ошибка обработки файла. Попробуйте снова.",
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
      "To create a test, send a PDF or DOCX file.\n\n" +
      "File format:\n" +
      "• Numbered questions (1. 2. 3. ...)\n" +
      "• Under each question, an `Answer: ...` line, or\n" +
      "• A/B/C/D options (correct one marked with ✓)\n\n" +
      "All users will see the test.",
    openTests: "Open Tests",
    processing: "Processing your PDF...",
    extracting: "Extracting text from PDF...",
    analyzing: "Analyzing questions...",
    testCreated: (title, count) =>
      `Test created: "${title}"\n${count} questions found.\n\nAll users can now see it.`,
    takeTest: "Take Test",
    pdfOnly: "Please send a PDF or DOCX file.",
    legacyDoc: "Legacy .doc format isn't supported. Please save your file as .docx and resend.",
    tooLarge: "File is too large. Maximum size is 10MB.",
    noText: "Could not extract text from this file. Please send a text-based file.",
    noQuestions: "No questions found. The file should contain numbered questions.",
    noAnswers:
      "No answers found in the file. To create a test, each question needs either an `Answer: ...` line under it or A/B/C/D options (with ✓ marking the correct one).\n\n" +
      "Example:\n" +
      "1. Question text?\n" +
      "Answer: The correct answer.",
    aiGenerating: "AI is generating options and correct answers for the questions... This may take 1-2 minutes.",
    error: "Something went wrong while processing your file. Please try again.",
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

function parseIdList(envVar) {
  return (process.env[envVar] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getPublicAdminIds() {
  return parseIdList("ADMIN_TELEGRAM_IDS");
}

function getPrivateAdminIds() {
  return parseIdList("PRIVATE_ADMIN_TELEGRAM_IDS");
}

function isPublicAdminEnv(userId) {
  return getPublicAdminIds().includes(userId.toString());
}

function isPrivateAdminEnv(userId) {
  return getPrivateAdminIds().includes(userId.toString());
}

/**
 * Look up a user's effective role: DB role takes priority, env vars are
 * the bootstrap fallback so a fresh deploy isn't locked out before any
 * super-admin has had a chance to seed itself in the DB.
 */
async function getEffectiveRole(userId) {
  let dbRole = "user";
  try {
    dbRole = await getUserRole(userId.toString());
  } catch (e) {
    console.error("getUserRole failed, falling back to env vars:", e);
  }
  if (dbRole !== "user") return dbRole;
  if (isPrivateAdminEnv(userId)) return "private_admin";
  if (isPublicAdminEnv(userId)) return "admin";
  return "user";
}

async function isAdmin(userId) {
  const role = await getEffectiveRole(userId);
  return role === "admin" || role === "private_admin" || role === "super_admin";
}

async function isPrivateAdmin(userId) {
  const role = await getEffectiveRole(userId);
  return role === "private_admin";
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

    const text = (await isAdmin(userId)) ? msg.welcomeAdmin : msg.welcomeUser;
    await ctx.reply(text, {
      reply_markup: new InlineKeyboard().webApp(msg.openTests, webAppUrl()),
    });
  });

  bot.command("whoami", async (ctx) => {
    const msg = getMsg(ctx.from.id);
    const userId = ctx.from.id.toString();
    const role = await getEffectiveRole(userId);
    await ctx.reply(`${msg.whoami(userId, role !== "user")}\nRole: ${role}`);
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
    const lang = userLangs.get(ctx.from.id) || "uz";

    if (!(await isAdmin(userId))) {
      return ctx.reply(msg.adminOnly);
    }
    const privateUpload = await isPrivateAdmin(userId);

    const doc = ctx.message.document;
    const mime = doc.mime_type || "";

    if (doc.file_size > 10 * 1024 * 1024) return ctx.reply(msg.tooLarge);

    if (mime === "application/msword") {
      return ctx.reply(msg.legacyDoc);
    }
    if (!SUPPORTED_MIME_TYPES.includes(mime)) {
      return ctx.reply(msg.pdfOnly);
    }

    const statusMsg = await ctx.reply(msg.processing);

    try {
      const file = await ctx.api.getFile(doc.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, msg.extracting);
      const text = await extractText(buffer, mime);
      if (!text.trim()) {
        return ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, msg.noText);
      }

      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, msg.analyzing);

      // Try the regular parser first (handles A/B/C/D and Q+A formats)
      let parsed = parseQuestionsFromText(text);

      // If parser didn't find anything, decide whether to fall back to AI.
      if (!parsed.questions.length) {
        const rawQuestions = extractQuestionTexts(text);

        if (rawQuestions.length === 0) {
          // No numbered questions at all
          return ctx.api.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            msg.noQuestions
          );
        }

        // Numbered questions exist but no answers → need AI
        if (!process.env.ANTHROPIC_API_KEY) {
          return ctx.api.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            msg.noAnswers
          );
        }

        await ctx.api.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          msg.aiGenerating
        );

        const aiResults = await generateOptionsAndAnswers(rawQuestions, lang);
        const letters = ["A", "B", "C", "D"];
        const aiQuestions = rawQuestions.map((q, i) => {
          const ai = aiResults[i];
          const opts = ai.options.slice(0, 4);
          while (opts.length < 4) opts.push("—");
          return {
            question: q,
            options: opts.map((opt, j) => `${letters[j]}) ${opt}`),
            correctAnswer: letters[ai.correctIndex] || "A",
            explanation: null,
          };
        });

        parsed = {
          title: guessTitleFromText(text, aiQuestions.length),
          questions: aiQuestions,
        };
      }

      const test = await saveTest(
        userId,
        parsed.title,
        parsed.questions,
        null,
        privateUpload
      );
      const testUrl = `${webAppUrl()}?testId=${test.id}`;

      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        msg.testCreated(parsed.title, parsed.questions.length),
        { reply_markup: new InlineKeyboard().webApp(msg.takeTest, testUrl) }
      );
    } catch (err) {
      console.error("Document processing error:", err);
      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, msg.error);
    }
  });

  return bot;
}
