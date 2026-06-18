import { normalizeTable, parseMarkdownTables, type NormalizedTable } from "./tableParser";

export type RichMarkdownSegment =
  | { type: "heading"; level: number; text: string; id: string }
  | { type: "paragraph"; text: string; id: string }
  | { type: "list"; items: string[]; id: string }
  | { type: "table"; table: NormalizedTable; id: string }
  | { type: "block"; blockType: string; content: string; id: string };

function makeId(prefix: string, index: number) {
  return `${prefix}-${index}`;
}

function collectTableRaws(content: string) {
  return new Set(parseMarkdownTables(content).map((table) => table.raw.trim()));
}

export function parseRichMarkdown(content: string): RichMarkdownSegment[] {
  const tables = parseMarkdownTables(content).map(normalizeTable);
  const tableRaws = collectTableRaws(content);
  const segments: RichMarkdownSegment[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let buffer: string[] = [];
  let tableIndex = 0;

  function flushParagraph() {
    const text = buffer.join(" ").trim();
    if (text) segments.push({ type: "paragraph", text, id: makeId("p", segments.length) });
    buffer = [];
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (/^(?:tableau|table)\s*(?:[:\-–]\s*)?.+/i.test(trimmed)) {
      const nextLine = lines[index + 1]?.trim() ?? "";
      if (nextLine.includes("|") || /(\t|\s{2,})/.test(nextLine)) {
        flushParagraph();
        continue;
      }
    }

    const remaining = lines.slice(index).join("\n");
    const matchingRaw = Array.from(tableRaws).find((raw) => remaining.startsWith(raw));
    if (matchingRaw) {
      flushParagraph();
      const table = tables[tableIndex];
      if (table) segments.push({ type: "table", table, id: table.id });
      tableIndex += 1;
      index += matchingRaw.split("\n").length - 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      segments.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
        id: makeId("h", segments.length),
      });
      continue;
    }

    if (/^:::\s*bcvb-[a-z0-9_-]+/i.test(trimmed)) {
      flushParagraph();
      const blockLines = [trimmed];
      while (index + 1 < lines.length) {
        index += 1;
        blockLines.push(lines[index]);
        if (lines[index].trim() === ":::") break;
      }
      const blockType = trimmed.replace(/^:::\s*/, "").trim();
      segments.push({
        type: "block",
        blockType,
        content: blockLines.join("\n"),
        id: makeId("block", segments.length),
      });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      const items = [trimmed.replace(/^[-*]\s+/, "")];
      while (index + 1 < lines.length && /^[-*]\s+/.test(lines[index + 1].trim())) {
        index += 1;
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
      }
      segments.push({ type: "list", items, id: makeId("list", segments.length) });
      continue;
    }

    buffer.push(trimmed);
  }

  flushParagraph();
  return segments;
}
