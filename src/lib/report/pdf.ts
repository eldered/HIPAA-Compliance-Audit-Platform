/**
 * Minimal, dependency-free PDF generator.
 *
 * Produces a valid single-font (Helvetica) multi-page PDF from a list of text
 * blocks. This keeps the MVP free of native/binary dependencies; for richer
 * output (logos, tables, charts) swap in @react-pdf/renderer or a headless
 * browser behind `generateReportPdf`.
 */

export type Block =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "spacer" };

const PAGE_WIDTH = 612; // US Letter @ 72dpi
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const LINE_HEIGHT = 16;
const MAX_CHARS_PER_LINE = 92; // approx for 11pt Helvetica within margins

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(text: string, max = MAX_CHARS_PER_LINE): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > max) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

interface RenderedLine {
  text: string;
  size: number;
}

function blocksToLines(blocks: Block[]): RenderedLine[] {
  const out: RenderedLine[] = [];
  for (const block of blocks) {
    switch (block.kind) {
      case "h1":
        out.push({ text: block.text, size: 20 });
        out.push({ text: "", size: 6 });
        break;
      case "h2":
        out.push({ text: "", size: 4 });
        out.push({ text: block.text, size: 14 });
        break;
      case "p":
        for (const line of wrap(block.text)) out.push({ text: line, size: 11 });
        break;
      case "spacer":
        out.push({ text: "", size: 8 });
        break;
    }
  }
  return out;
}

/** Build a PDF Buffer from text blocks. */
export function buildPdf(blocks: Block[]): Buffer {
  const lines = blocksToLines(blocks);

  // Paginate.
  const pages: RenderedLine[][] = [];
  let page: RenderedLine[] = [];
  let y = PAGE_HEIGHT - MARGIN;
  for (const line of lines) {
    const advance = Math.max(LINE_HEIGHT, line.size + 4);
    if (y - advance < MARGIN) {
      pages.push(page);
      page = [];
      y = PAGE_HEIGHT - MARGIN;
    }
    page.push(line);
    y -= advance;
  }
  if (page.length) pages.push(page);
  if (pages.length === 0) pages.push([]);

  // Build content streams per page.
  const objects: string[] = [];

  // 1: Catalog, 2: Pages, 3: Font. Page + content objects follow.
  const fontObjNum = 3;
  const firstPageObj = 4;
  const pageObjNums: number[] = [];
  const contentObjNums: number[] = [];

  pages.forEach((_, i) => {
    pageObjNums.push(firstPageObj + i * 2);
    contentObjNums.push(firstPageObj + i * 2 + 1);
  });

  // Catalog
  objects[1] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  // Pages tree
  objects[2] =
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums
      .map((n) => `${n} 0 R`)
      .join(" ")}] /Count ${pages.length} >>\nendobj\n`;
  // Font
  objects[fontObjNum] = `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  pages.forEach((pageLines, i) => {
    const pageNum = pageObjNums[i]!;
    const contentNum = contentObjNums[i]!;

    let stream = "BT\n";
    let cursorY = PAGE_HEIGHT - MARGIN;
    for (const line of pageLines) {
      const advance = Math.max(LINE_HEIGHT, line.size + 4);
      stream += `/F1 ${line.size} Tf\n`;
      stream += `1 0 0 1 ${MARGIN} ${cursorY} Tm\n`;
      stream += `(${escapePdfText(line.text)}) Tj\n`;
      cursorY -= advance;
    }
    stream += "ET";

    objects[pageNum] =
      `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNum} 0 R >>\nendobj\n`;
    objects[contentNum] =
      `${contentNum} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`;
  });

  // Assemble with xref.
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  const totalObjects = contentObjNums[contentObjNums.length - 1] ?? fontObjNum;

  for (let n = 1; n <= totalObjects; n += 1) {
    offsets[n] = Buffer.byteLength(pdf, "latin1");
    pdf += objects[n] ?? "";
  }

  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${totalObjects + 1}\n`;
  pdf += `0000000000 65535 f \n`;
  for (let n = 1; n <= totalObjects; n += 1) {
    pdf += `${String(offsets[n] ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}
