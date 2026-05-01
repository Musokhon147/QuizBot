/**
 * Parses test questions from PDF text. Supports two formats:
 *
 * 1. Multiple-choice with A/B/C/D options:
 *    1. Question text?
 *    A) option
 *    B) option ✓
 *
 * 2. Q+A flashcard format (e.g. "Javob:" / "Ответ:" / "Answer:"):
 *    1. Question text?
 *    Javob: Answer text.
 *
 *    For format 2, this builds multiple-choice questions automatically by
 *    using other answers in the same document as distractors.
 */
export function parseQuestionsFromText(text) {
  const lines = text.split("\n").map((l) => l.trim());
  const pairs = [];
  let current = null;
  let mode = "scan";

  const questionStart = /^(\d{1,3})\s*[.)]\s*(.+)/;
  const answerStart = /^(javob|ja[wv]ob|ответ|otvet|answer|j\s*\.)\s*[:.—–-]?\s*(.*)$/i;
  const optionStart = /^([A-Ea-e])\s*[.)]\s*(.+)/;
  const correctMarker = /[✓✔*+★●]|\b(correct|to'g'ri|to`g`ri|правильн)\b/i;

  for (const rawLine of lines) {
    const line = rawLine;
    if (!line) continue;

    const ansMatch = line.match(answerStart);
    const qMatch = line.match(questionStart);
    const optMatch = line.match(optionStart);

    // Answer line wins over question/option matches because "Javob:" can start with "J"
    if (ansMatch && current) {
      current.answer = ansMatch[2].trim();
      current.type = "flashcard";
      mode = "answer";
      continue;
    }

    if (qMatch && !optMatch) {
      if (current) pairs.push(current);
      current = {
        question: qMatch[2].trim(),
        options: [],
        answer: null,
        type: null,
      };
      mode = "question";
      continue;
    }

    if (!current) continue;

    if (optMatch) {
      const letter = optMatch[1].toUpperCase();
      const optText = optMatch[2].trim();
      current.options.push(`${letter}) ${optText}`);
      if (correctMarker.test(line)) current.answer = letter;
      current.type = "multiple_choice";
      mode = "options";
      continue;
    }

    // Continuation lines wrap question or answer text
    if (mode === "question") {
      current.question += " " + line;
    } else if (mode === "answer" && current.answer !== null) {
      current.answer += " " + line;
    }
  }
  if (current) pairs.push(current);

  // Keep only questions with usable content
  const valid = pairs.filter((p) => {
    if (p.options.length >= 2) return true;
    if (p.answer && p.answer.trim().length > 0) return true;
    return false;
  });

  if (valid.length === 0) return parseFallback(text);

  // Pool of all flashcard answers — used as distractors for other flashcards
  const answerPool = valid
    .filter((p) => p.options.length === 0 && p.answer)
    .map((p) => p.answer.trim());

  const questions = valid.map((p) => {
    if (p.options.length >= 2) {
      const correctAnswer = p.answer || p.options[0].charAt(0);
      return {
        question: p.question,
        options: p.options,
        correctAnswer,
        explanation: null,
      };
    }

    // Flashcard → synthesize multiple-choice
    const correct = p.answer.trim();
    const distractors = pickDistractors(correct, answerPool, 3);
    const allOpts = shuffle([correct, ...distractors]);
    const letters = ["A", "B", "C", "D"];
    const options = allOpts.map((opt, i) => `${letters[i]}) ${opt}`);
    const correctIdx = allOpts.indexOf(correct);
    return {
      question: p.question,
      options,
      correctAnswer: letters[correctIdx],
      explanation: null,
    };
  });

  return { title: guessTitle(text, questions.length), questions };
}

function pickDistractors(correct, pool, n) {
  const candidates = pool.filter((a) => a && a !== correct);
  const used = new Set([correct]);
  const result = [];
  const shuffled = shuffle(candidates);

  for (const c of shuffled) {
    if (result.length >= n) break;
    if (used.has(c)) continue;
    result.push(c);
    used.add(c);
  }

  while (result.length < n) {
    result.push(`—`);
  }
  return result;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function parseFallback(text) {
  const questions = [];
  const qaSplit = text.split(/(?:^|\n)(?=\d{1,3}\s*[.)]\s)/);

  for (const block of qaSplit) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const qLine = lines[0].replace(/^\d{1,3}\s*[.)]\s*/, "").trim();
    const options = [];
    let correctAnswer = null;

    for (let i = 1; i < lines.length; i++) {
      const m = lines[i].match(/^([A-Ea-e])\s*[.)]\s*(.+)/);
      if (m) {
        const letter = m[1].toUpperCase();
        options.push(`${letter}) ${m[2].trim()}`);
        if (/[✓✔*+]/.test(lines[i])) correctAnswer = letter;
      }
    }

    if (options.length >= 2) {
      questions.push({
        question: qLine,
        options,
        correctAnswer: correctAnswer || options[0].charAt(0),
        explanation: null,
      });
    }
  }

  return { title: guessTitle(text, questions.length), questions };
}

function guessTitle(text, qCount) {
  const firstLine = text
    .split("\n")
    .find((l) => l.trim().length > 3 && !/^\d/.test(l.trim()) && !/^javob/i.test(l.trim()));
  if (firstLine && firstLine.trim().length < 100) return firstLine.trim();
  return `Test (${qCount} questions)`;
}
