export interface Highlight {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  color: string;
  note?: string | null;
}

const COLOR_MAP: Record<string, string> = {
  yellow: 'rgba(255, 213, 0, 0.35)',
  green:  'rgba(72, 199, 142, 0.35)',
  pink:   'rgba(255, 99, 132, 0.35)',
  blue:   'rgba(99, 179, 255, 0.35)',
};

export function injectHighlights(html: string, highlights: Highlight[]): string {
  if (!highlights.length) return html;

  // Sort by startOffset descending so we inject from end to start
  // This prevents offset shifts when inserting marks
  const sorted = [...highlights].sort((a, b) => b.startOffset - a.startOffset);

  // We work on the plain text version to find positions
  // but inject into the HTML string carefully
  let result = html;

  for (const h of sorted) {
    const color = COLOR_MAP[h.color] ?? COLOR_MAP.yellow;
    const mark = `<mark data-highlight-id="${h.id}" style="background:${color};border-radius:2px;padding:0 1px;cursor:pointer;">${h.text}</mark>`;

    // Find the text in the HTML and replace it
    // We search from startOffset context to be more precise
    const idx = result.indexOf(h.text);
    if (idx !== -1) {
      result = result.slice(0, idx) + mark + result.slice(idx + h.text.length);
    }
  }

  return result;
}

export function getSelectionOffsets(
  container: HTMLElement
): { text: string; startOffset: number; endOffset: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();
  if (!text || text.length < 2) return null;

  // Check selection is inside our container
  if (!container.contains(range.commonAncestorContainer)) return null;

  // Get text content of container up to selection start
  const preRange = document.createRange();
  preRange.selectNodeContents(container);
  preRange.setEnd(range.startContainer, range.startOffset);
  const startOffset = preRange.toString().length;
  const endOffset = startOffset + text.length;

  return { text, startOffset, endOffset };
}
