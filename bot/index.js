import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";
import { extractTextFromPDF } from "../server/services/pdf.js";
import { parseQuestionsFromText } from "../server/services/parser.js";
import { saveTest } from "../server/services/supabase.js";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

const messages = {
  uz: {
    welcome: "TestBot ga xush kelibsiz! Menga PDF yuboring va men sizga test yarataman.\n\n" +
      "Qanday ishlaydi:\n" +
      "1. Savollar va javoblar bilan PDF yuboring\n" +
      "2. Bot savollarni tahlil qiladi\n" +
      "3. Mini app da testni yeching",
    openTests: "Testlarimni ochish",
    processing: "PDF qayta ishlanmoqda... Biroz kuting.",
    extracting: "Matn chiqarilmoqda...",
    analyzing: "Savollar tahlil qilinmoqda...",
    testCreated: (title, count) => `Test yaratildi: "${title}"\n${count} ta savol topildi.\n\nBoshlash uchun tugmani bosing!`,
    takeTest: "Testni boshlash",
    pdfOnly: "Iltimos, PDF fayl yuboring.",
    tooLarge: "Fayl juda katta. Maksimal o'lcham 10MB.",
    noText: "Bu PDF dan matn chiqarib bo'lmadi. Text-based PDF yuboring.",
    error: "PDF ni qayta ishlashda xatolik yuz berdi. Qayta urinib ko'ring.",
    help: "Mavjud buyruqlar:\n/start — Botni boshlash\n/mytests — Testlarimni ko'rish\n/score — Statistikani ko'rish\n/lang — Tilni o'zgartirish\n/help — Yordam",
    langChanged: "Til o'zbekchaga o'zgartirildi!",
    score: (tests, streak) => `📊 Sizning statistikangiz:\n\nTestlar: ${tests}\nStreak: ${streak} kun`,
    chooseLang: "Tilni tanlang:",
  },
  ru: {
    welcome: "Добро пожаловать в TestBot! Отправьте мне PDF и я создам тест.\n\n" +
      "Как это работает:\n" +
      "1. Отправьте PDF с вопросами и ответами\n" +
      "2. Бот проанализирует вопросы\n" +
      "3. Пройдите тест в мини-приложении",
    openTests: "Мои тесты",
    processing: "Обработка PDF... Подождите.",
    extracting: "Извлечение текста...",
    analyzing: "Анализ вопросов...",
    testCreated: (title, count) => `Тест создан: "${title}"\nНайдено ${count} вопросов.\n\nНажмите кнопку чтобы начать!`,
    takeTest: "Начать тест",
    pdfOnly: "Пожалуйста, отправьте PDF файл.",
    tooLarge: "Файл слишком большой. Максимум 10МБ.",
    noText: "Не удалось извлечь текст из PDF. Отправьте текстовый PDF.",
    error: "Ошибка обработки PDF. Попробуйте снова.",
    help: "Доступные команды:\n/start — Запуск бота\n/mytests — Мои тесты\n/score — Статистика\n/lang — Сменить язык\n/help — Помощь",
    langChanged: "Язык изменён на русский!",
    score: (tests, streak) => `📊 Ваша статистика:\n\nТесты: ${tests}\nStreak: ${streak} дней`,
    chooseLang: "Выберите язык:",
  },
  en: {
    welcome: "Welcome to TestBot! Send me a PDF with test questions and I'll create an interactive quiz.\n\n" +
      "How it works:\n" +
      "1. Send a PDF with questions and answers\n" +
      "2. The bot parses and organizes them\n" +
      "3. Take the test in the mini app",
    openTests: "Open My Tests",
    processing: "Processing your PDF... This may take a moment.",
    extracting: "Extracting text from PDF...",
    analyzing: "Analyzing questions...",
    testCreated: (title, count) => `Test created: "${title}"\n${count} questions found.\n\nTap the button below to start!`,
    takeTest: "Take Test",
    pdfOnly: "Please send a PDF file.",
    tooLarge: "File is too large. Maximum size is 10MB.",
    noText: "Could not extract text from this PDF. Please send a text-based PDF.",
    error: "Something went wrong while processing your PDF. Please try again.",
    help: "Available commands:\n/start — Start the bot\n/mytests — View my tests\n/score — View statistics\n/lang — Change language\n/help — Help",
    langChanged: "Language changed to English!",
    score: (tests, streak) => `📊 Your statistics:\n\nTests: ${tests}\nStreak: ${streak} days`,
    chooseLang: "Choose language:",
  },
};

const userLangs = new Map();

function getMsg(userId) {
  const lang = userLangs.get(userId) || "uz";
  return messages[lang];
}

bot.command("start", async (ctx) => {
  const msg = getMsg(ctx.from.id);
  await ctx.reply(msg.welcome, {
    reply_markup: new InlineKeyboard().webApp(msg.openTests, process.env.WEB_APP_URL),
  });
});

bot.command("mytests", async (ctx) => {
  const msg = getMsg(ctx.from.id);
  await ctx.reply(msg.openTests + ":", {
    reply_markup: new InlineKeyboard().webApp(msg.openTests, process.env.WEB_APP_URL),
  });
});

bot.command("score", async (ctx) => {
  const msg = getMsg(ctx.from.id);
  await ctx.reply(msg.score(0, 0));
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
  const msg = getMsg(ctx.from.id);
  await ctx.reply(msg.help);
});

bot.on("message:document", async (ctx) => {
  const doc = ctx.message.document;
  const msg = getMsg(ctx.from.id);

  if (doc.mime_type !== "application/pdf") {
    return ctx.reply(msg.pdfOnly);
  }

  if (doc.file_size > 10 * 1024 * 1024) {
    return ctx.reply(msg.tooLarge);
  }

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
    const test = await saveTest(ctx.from.id.toString(), parsed.title, parsed.questions);

    const testUrl = `${process.env.WEB_APP_URL}?testId=${test.id}`;

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

bot.start();
console.log("Bot is running...");
