import { decodeHTMLStrict } from "entities/decode";

export function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Common words that tell English from the other languages written in Latin letters. Words both share
// ("a", "in", "an", "on") are in neither list.
const ENGLISH_WORDS = new Set(["the", "and", "of", "to", "is", "are", "was", "for", "with", "that", "this", "from", "by", "it", "its", "as", "at", "be", "has", "have", "will", "or", "not", "we", "you", "our", "new"]);
const OTHER_LATIN_WORDS = new Set([
  "le", "la", "les", "des", "du", "et", "est", "une", "pour", "dans", "qui", "sur", "avec", // French
  "der", "die", "das", "und", "ist", "nicht", "mit", "ein", "eine", "für", "von", "zu", "auf", "den", // German
  "el", "los", "las", "y", "por", "para", "con", "una", "del", "es", "que", "de", // Spanish, and shared Romance words
  "il", "di", "che", "per", "della", "het", "een", "van", "och", "att", "não", "uma", "com", "também", // Italian, Dutch, Swedish, Portuguese
]);

/**
 * A declared language wins; otherwise text is English when nearly all its letters are basic Latin and
 * its common words are no more often another Latin-script language's than English ones.
 */
export function isEnglishText(text: string, language?: string | null): boolean {
  const declared = language?.toLowerCase().split(/[-_]/)[0];
  if (declared === "en") return true;
  if (declared && !["und", "unknown", "other", "zxx"].includes(declared)) return false;
  const letters = text.match(/\p{L}/gu) ?? [];
  if (!letters.length) return false;
  if (letters.filter((c) => /[a-z]/i.test(c)).length < letters.length * 0.9) return false;
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  const english = words.filter((w) => ENGLISH_WORDS.has(w)).length;
  return english >= words.filter((w) => OTHER_LATIN_WORDS.has(w)).length;
}

export function truncate(s: string, max: number, ellipsis = "…"): string {
  const chars = [...s];
  if (chars.length <= max) return s;
  return chars.slice(0, Math.max(0, max - ellipsis.length)).join("").trimEnd() + ellipsis;
}

/**
 * Removes element markup while keeping `>` inside quoted attribute values: a link
 * title such as `title="Platforms > Xbox"` must not end the tag there and leak the
 * rest of it into the text.
 * This follows the small part of the HTML tokenizer needed here: an equals sign
 * starts a quoted value only after an attribute name. Comments, doctypes and
 * `< a>` keep the old first-`>` behavior because they are not element tags here.
 */
export function stripTagMarkup(html: string, replacement = " "): string {
  let out = "";
  let at = 0;
  while (at < html.length) {
    const start = html.indexOf("<", at);
    if (start < 0) return out + html.slice(at);
    out += html.slice(at, start);

    const firstEnd = html.indexOf(">", start + 1);
    if (firstEnd < 0) return out + html.slice(start);
    let end = firstEnd;
    // Only element attributes need quote handling; other markup keeps its existing behavior.
    if (/^<\/?[a-z]/i.test(html.slice(start, start + 3))) {
      let quote = "";
      let tagName = true;
      let attributeName = false;
      let value: "none" | "start" | "unquoted" = "none";
      let i = start + 1;
      for (; i < html.length; i += 1) {
        const char = html[i]!;
        if (quote) {
          if (char === quote) quote = "";
        } else if (char === ">") {
          end = i;
          break;
        } else if (value === "unquoted") {
          if (/[\t\n\f\r ]/.test(char)) value = "none";
        } else if (value === "start") {
          if (/[\t\n\f\r ]/.test(char)) continue;
          value = "none";
          if (char === '"' || char === "'") quote = char;
          else value = "unquoted";
        } else if (tagName) {
          if (/[\t\n\f\r ]/.test(char)) tagName = false;
          else if (char === "/") continue;
          else if (char === "=") {
            tagName = false;
            attributeName = true;
          }
        } else if (char === "=") {
          if (attributeName) {
            attributeName = false;
            value = "start";
          } else {
            // A bare `=` is an attribute name in malformed HTML, not a value prefix.
            attributeName = true;
          }
        } else if (!/[\t\n\f\r ]/.test(char)) {
          attributeName = true;
        }
      }
      // An unfinished quoted tag consumes the rest of the document in the browser tokenizer.
      if (i === html.length) return out + replacement;
    }
    // Preserve the old result for the empty `<>` construct, which the old regex did not match.
    out += end === start + 1 ? "<>" : replacement;
    at = end + 1;
  }
  return out;
}

/**
 * Character references, numeric and named, as browsers read them in text; only those ending in a semicolon,
 * so an address keeps its "&copy=". Feeds escape text twice ("AI&amp;#8217;s", code shown as "&amp;lt;"),
 * and the text they mean is what readers expect, so "&amp;" goes first.
 */
export function decodeEntities(s: string): string {
  return decodeHTMLStrict(s.replace(/&amp;/g, "&"));
}

/** The text of HTML: without scripts and styles, every tag a word boundary, references decoded, whitespace collapsed. */
export function stripTags(html: string): string {
  return collapseWhitespace(decodeEntities(stripTagMarkup(html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " "))));
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // XML 1.0 forbids most control characters.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}
