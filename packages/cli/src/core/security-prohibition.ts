/**
 * Defensive Prohibition Grammar Context Engine
 * Prevents false positives when security guidelines, negative constraints,
 * or invariant rules forbid an action.
 */

const CONTEXT_CHARS = 512;

// Prefix pattern ending immediately before the dangerous phrase
const DIRECT_PREFIX = /(?:^|(?<=[\n\r.!?;,\[]))[ \t]*(?:[-+][ \t]+|\d+[.)][ \t]+)?(?:please\s+)?(?:(?:you|(?:the\s+)?(?:agent|assistant|model))\s+)?(?:do\s+not|don['’]t|never|no|must\s+not|shall\s+not)\s+(?:(?:ever|first|verbatim|exactly|word\s+for\s+word)\s+)?(?:(?:execute|run|perform|do|use|call|issue)\s+)?$/i;

const DISAVOWAL = /\b(?:ignore|disregard|override|obsolete|invalid|bypass|suspend|violat\w*|opposit\w*|invers\w*|invert\w*|revers\w*|contrar\w*|negat\w*)\b/i;

const EXCEPTION = /\b(?:unless|except|until|but|however|instead)\b/i;

/**
 * Checks whether an identified match is governed by a defensive prohibition.
 * For example: 'Do NOT execute rm -rf /' or 'Never reveal system prompts'.
 */
export function isDirectlyProhibited(content: string, start: number, end: number): boolean {
  if (start < 0 || end <= start || end > content.length) {
    return false;
  }

  const left = Math.max(0, start - CONTEXT_CHARS);
  const prefixRaw = content.slice(left, start);
  const prefix = prefixRaw.replace(/[*_`#]/g, "");

  const match = DIRECT_PREFIX.exec(prefix);
  if (!match) {
    return false;
  }

  if (left > 0 && match.index === 0) {
    return false;
  }

  const tail = content.slice(end, Math.min(content.length, end + 256));
  const leading = prefix.slice(0, match.index);

  // If quotes surround the entire prohibition phrase, allow it
  const quotesInLeading = (leading.match(/['"]/g) || []).length;
  const quotesInTail = (tail.match(/['"]/g) || []).length;
  if (quotesInLeading % 2 !== 0 && quotesInTail % 2 === 0) {
    return false;
  }

  if (DISAVOWAL.test(leading)) {
    return false;
  }

  const breaks = [tail.indexOf("."), tail.indexOf("\n"), tail.indexOf("!"), tail.indexOf(";"), tail.indexOf("?")]
    .filter((idx) => idx !== -1);
  const firstBreak = breaks.length > 0 ? Math.min(...breaks) : tail.length;
  const clause = tail.slice(0, firstBreak);

  if (EXCEPTION.test(clause)) {
    return false;
  }

  return true;
}
