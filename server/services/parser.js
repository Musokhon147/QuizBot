export function parseQuestionsFromText(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const questions = [];
  let current = null;

  for (const line of lines) {
    const qMatch = line.match(
      /^(\d{1,3})\s*[.)]\s*(.+)/
    );

    const optMatch = line.match(
      /^([A-Ea-e])\s*[.)]\s*(.+)/
    );

    const correctMarkers = /[✓✔*+★●]|correct|to'g'ri|правильн/i;
    const isMarkedCorrect = correctMarkers.test(line);

    if (qMatch && !optMatch) {
      if (current && current.options.length >= 2) {
        questions.push(finalize(current));
      }
      current = {
        question: qMatch[2].trim(),
        options: [],
        correctAnswer: null,
      };
    } else if (optMatch && current) {
      const letter = optMatch[1].toUpperCase();
      const text = optMatch[2].trim();
      current.options.push(`${letter}) ${text}`);
      if (isMarkedCorrect) {
        current.correctAnswer = letter;
      }
    } else if (current && current.options.length === 0 && line.length > 10) {
      current.question += " " + line;
    }
  }

  if (current && current.options.length >= 2) {
    questions.push(finalize(current));
  }

  if (questions.length === 0) {
    return parseFallback(text);
  }

  const title = guessTitle(text, questions.length);
  return { title, questions };
}

function finalize(q) {
  if (!q.correctAnswer && q.options.length > 0) {
    q.correctAnswer = q.options[0].charAt(0);
  }

  return {
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: null,
  };
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

        if (/[✓✔*+]/.test(lines[i])) {
          correctAnswer = letter;
        }
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

  return {
    title: guessTitle(text, questions.length),
    questions,
  };
}

function guessTitle(text, qCount) {
  const firstLine = text.split("\n").find((l) => l.trim().length > 3 && !/^\d/.test(l.trim()));
  if (firstLine && firstLine.trim().length < 100) {
    return firstLine.trim();
  }
  return `Test (${qCount} questions)`;
}
