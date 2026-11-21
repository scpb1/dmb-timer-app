const BLOCKQUOTE = /<blockquote>[\s\S]*?<\/blockquote>/gi;
const TRAILING_DECORATION =
  /(?:<\/[a-zA-Z][^>]*>|[ \t\uFE0F\u200D]|\p{Extended_Pictographic})+$/u;
const ABBREVIATION = /(?:\p{L}\.){2,}$/u;

/** Убирает точку в конце абзаца. Между предложениями одного абзаца точка остаётся. */
export function stripParagraphEndPeriods(text: string): string {
  const quotes: string[] = [];
  const masked = text.replace(BLOCKQUOTE, (block) => {
    const token = `\uE000${quotes.length}\uE001`;
    quotes.push(block);
    return token;
  });

  const parts = masked.split(/(\n[ \t]*\n+)/);
  const cleaned = parts
    .map((part, index) => (index % 2 === 1 ? part : stripParagraph(part)))
    .join('');

  return cleaned.replace(/\uE000(\d+)\uE001/g, (_token, index: string) => quotes[Number(index)] ?? '');
}

function stripParagraph(paragraph: string): string {
  const match = /^([\s\S]*?)(\n*)$/.exec(paragraph);
  if (!match) {
    return paragraph;
  }

  const body = match[1];
  const lineBreak = match[2];
  const tail = TRAILING_DECORATION.exec(body)?.[0] ?? '';
  const core = tail ? body.slice(0, -tail.length) : body;
  if (!core.endsWith('.') || core.endsWith('..') || ABBREVIATION.test(core)) {
    return paragraph;
  }

  return `${core.slice(0, -1)}${tail}${lineBreak}`;
}
