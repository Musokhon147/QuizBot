import { Bot, InlineKeyboard } from "grammy";
import { extractTextFromPDF } from "./pdf.js";
import { parseQuestionsFromText } from "./parser.js";
import { saveTest, upsertUser } from "./supabase.js";

const messages = {
  uz: {
    welcome:
      "TestBot ga xush kelibsiz! Menga PDF yuboring va men sizga test yarataman.\n\n" +
      "Qanday ishlaydi:\n" +
      "1. Savollar va javoblar bilan PDF yuboring\n" +
      "2. Bot savollarni tahlil qiladi\n" +
      "3. Mini app da testni yeching",
    openTests: "Testlarimni ochish",
    processing: "PDF qayta ishlanmoqda... Biroz kuting.",
    extracting: "Matn chiqarilmoqda...",
    analyzing: "Savollar tahlil qilinmoqda...",
    testCreated: (title, count) =>
      `Test yaratildi: "${title}"\n${count} ta savol topildi.\n\nBoshlash uchun tugmani bosing!`,
    takeTest: "Testni boshlash",
    pdfOnly: "Iltimos, PDF fayl yuboring.",
    tooLarge: "Fayl juda katta. Maksimal o'lcham 10MB.",
    noText: "Bu PDF dan matn chiqarib bo'lmadi. Text-based PDF yuboring.",
    noQuestions: "PDF da savol topilmadi. Raqamlangan savollar va A/B/C/D variantlari bo'lishi kerak.",
    error: "PDF ni qayta ishlashda xatolik yuz berdi. Qayta urinib ko'ring.",
    help:
      "Mavjud buyruqlar:\n/start — Botni boshlash\n/mytests — Testlarimni ko'rish\n/lang — Tilni o'zgartirish\n/help — Yordam",
    langChanged: "Til o'zbekchaga o'zgartirildi!",
    chooseLang: "Tilni tanlang:",
  },
  ru: {
    welcome:
      "Добро пожаловать в TestBot! Отправьте мне PDF и я создам тест.\n\n" +
      "Как это работает:\n" +
      "1. Отправьте PDF с вопросами и ответами\n" +
      "2. Бот проанализирует вопросы\n" +
      "3. Пройдите тест в мини-приложении",
    openTests: "Мои тесты",
    processing: "Обработка PDF... Подождите.",
    extracting: "Извлечение текста...",
    analyzing: "Анализ вопросов...",
    testCreated: (title, count) =>
      `Тест создан: "${title}"\nНайдено ${count} вопросов.\n\nНажмите кнопку чтобы начать!`,
    takeTest: "Начать тест",
    pdfOnly: "Пожалуйста, отправьте PDF файл.",
    tooLarge: "Файл слишком большой. Максимум 10МБ.",
    noText: "Не удалось извлечь текст из PDF. Отправьте текстовый PDF.",
    noQuestions: "В PDF не найдено вопросов. Используйте формат с нумерованными вопросами и вариантами A/B/C/D.",
    error: "Ошибка обработки PDF. Попробуйте снова.",
    help:
      "Доступные команды:\n/start — Запуск бота\n/mytests — Мои тесты\n/lang — Сменить язык\n/help — Помощь",
    langChanged: "Язык изменён на русский!",
    chooseLang: "Выберите язык:",
  },
  en: {
    welcome:
      "Welcome to TestBot! Send me a PDF with test questions and I'll create an interactive quiz.\n\n" +
      "How it works:\n" +
      "1. Send a PDF with questions and answers\n" +
      "2. The bot parses and organizes them\n" +
      "3. Take the test in the mini app",
    openTests: "Open My Tests",
    processing: "Processing your PDF...",
    extracting: "Extracting text from PDF...",
    analyzing: "Analyzing questions...",
    testCreated: (title, count) =>
      `Test created: "${title}"\n${count} questions found.\n\nTap the button below to start!`,
    takeTest: "Take Test",
    pdfOnly: "Please send a PDF file.",
    tooLarge: "File is too large. Maximum size is 10MB.",
    noText: "Could not extract text from this PDF. Please send a text-based PDF.",
    noQuestions: "No questions found. Use a PDF with numbered questions and A/B/C/D options.",
    error: "Something went wrong while processing your PDF. Please try again.",
    help:
      "Available commands:\n/start — Start the bot\n/mytests — View my tests\n/lang — Change language\n/help — Help",
    langChanged: "Language changed to English!",
    chooseLang: "Choose language:",
  },
};

const userLangs = new Map();

function getMsg(userId) {
  return messages[userLangs.get(userId) || "uz"];
}

function webAppUrl() {
  return process.env.WEB_APP_URL || "https://example.vercel.app";
}

export function createBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");

  const bot = new Bot(token);

  bot.command("start", async (ctx) => {
    const msg = getMsg(ctx.from.id);
    try {
      await upsertUser(
        ctx.from.id.toString(),
        [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" "),
        ctx.from.username,
        null
      );
    } catch (e) {
      console.error("upsertUser error:", e);
    }
    await ctx.reply(msg.welcome, {
      reply_markup: new InlineKeyboard().webApp(msg.openTests, webAppUrl()),
    });
  });

  bot.command("mytests", async (ctx) => {
    const msg = getMsg(ctx.from.id);
    await ctx.reply(msg.openTests + ":", {
      reply_markup: new InlineKeyboard().webApp(msg.openTests, webAppUrl()),
    });
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
    const doc = ctx.message.document;
    const msg = getMsg(ctx.from.id);

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

      const test = await saveTest(ctx.from.id.toString(), parsed.title, parsed.questions);
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
