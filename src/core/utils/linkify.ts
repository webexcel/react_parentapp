/**
 * Linkify
 *
 * Finds URLs, email addresses and phone numbers inside plain message text so
 * they can be rendered as tappable links. Circulars, homework notes and teacher
 * messages arrive as free text with no markup, so detection is the only way a
 * link inside them becomes usable.
 *
 * Detection is deliberately conservative. Only URLs carrying a scheme or a
 * `www.` prefix are matched, never bare domains - school text is full of things
 * that read as domains but are not ("Rs.500", "8.30 a.m.", "Std.10.B"). Phone
 * numbers are opt-in for the same reason: dates, amounts and roll numbers are
 * all just digit runs.
 */

/** Kinds of link this module can find. */
export type LinkKind = 'url' | 'email' | 'phone';

export interface TextChunk {
  kind: 'text';
  value: string;
}

export interface LinkChunk {
  kind: LinkKind;
  /** The text exactly as it appears in the message */
  value: string;
  /** The URL to hand to Linking.openURL */
  href: string;
}

export type LinkifyChunk = TextChunk | LinkChunk;

/**
 * What we look for unless a caller asks for more. Phone numbers are left out
 * because the false-positive rate on school text is high.
 */
export const DEFAULT_LINK_KINDS: LinkKind[] = ['url', 'email'];

// Kept as literals rather than strings so the escaping stays readable - they are
// combined through their .source in buildPattern.
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"'`]+/;
const EMAIL_PATTERN =
  /(?:mailto:)?[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+/;
// Loose on shape (spaces, dashes and a country code are all allowed), strict on
// the digit count, which is checked separately in isPhoneNumber.
const PHONE_PATTERN = /\+?\d[\d\s-]{8,15}\d/;

const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 15;

/** Characters that end a sentence rather than a link. */
const TRAILING_PUNCTUATION = '.,;:!?\'"’”»';

const CLOSING_PAIRS: Record<string, string> = {
  ')': '(',
  ']': '[',
  '}': '{',
};

const countOccurrences = (value: string, character: string): number =>
  value.split(character).length - 1;

/**
 * Drop punctuation that belongs to the sentence, not to the link:
 * "see https://x.com/a." -> "https://x.com/a"
 *
 * A closing bracket is kept when the link opened one itself, so Wikipedia-style
 * URLs such as "https://x.com/a_(b)" survive.
 */
const trimTrailingPunctuation = (value: string): string => {
  let result = value;

  while (result.length > 0) {
    const last = result[result.length - 1];

    if (TRAILING_PUNCTUATION.includes(last)) {
      result = result.slice(0, -1);
      continue;
    }

    const opening = CLOSING_PAIRS[last];
    if (
      opening &&
      countOccurrences(result, last) > countOccurrences(result, opening)
    ) {
      result = result.slice(0, -1);
      continue;
    }

    break;
  }

  return result;
};

/** Digits only, keeping a leading "+" so international numbers still dial. */
const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return value.trim().startsWith('+') ? `+${digits}` : digits;
};

const isPhoneNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, '').length;
  return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
};

/**
 * Build the link a tap should open.
 */
const buildHref = (kind: LinkKind, value: string): string => {
  switch (kind) {
    case 'url':
      return /^https?:\/\//i.test(value) ? value : `https://${value}`;
    case 'email':
      return `mailto:${value.replace(/^mailto:/i, '')}`;
    case 'phone':
      return `tel:${normalizePhone(value)}`;
  }
};

const classify = (match: string): LinkKind => {
  if (/^(?:https?:\/\/|www\.)/i.test(match)) {
    return 'url';
  }
  return match.includes('@') ? 'email' : 'phone';
};

/**
 * Build the scanning regex for the requested kinds. Order matters: the URL
 * alternative has to come first so that the "@" inside a path (or the digits
 * inside a phone-looking URL) never wins over the whole link.
 */
const buildPattern = (kinds: LinkKind[]): RegExp | null => {
  const sources: string[] = [];

  if (kinds.includes('url')) {
    sources.push(URL_PATTERN.source);
  }
  if (kinds.includes('email')) {
    sources.push(EMAIL_PATTERN.source);
  }
  if (kinds.includes('phone')) {
    sources.push(PHONE_PATTERN.source);
  }

  return sources.length > 0 ? new RegExp(sources.join('|'), 'gi') : null;
};

/**
 * Split message text into plain and link chunks, in order. Text with no links
 * comes back as a single text chunk, so callers can render the result the same
 * way whether or not anything was found.
 */
export const parseLinks = (
  text: string | null | undefined,
  kinds: LinkKind[] = DEFAULT_LINK_KINDS,
): LinkifyChunk[] => {
  if (!text) {
    return [];
  }

  const pattern = buildPattern(kinds);
  if (!pattern) {
    return [{ kind: 'text', value: text }];
  }

  const chunks: LinkifyChunk[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const raw = trimTrailingPunctuation(match[0]);
    const kind = classify(raw);

    // A digit run that is really a date or an amount - skip it and keep looking
    // from just after where it started, so a real number right behind it still
    // gets found.
    if (!raw || (kind === 'phone' && !isPhoneNumber(raw))) {
      pattern.lastIndex = match.index + 1;
      continue;
    }

    if (match.index > lastIndex) {
      chunks.push({ kind: 'text', value: text.slice(lastIndex, match.index) });
    }

    chunks.push({ kind, value: raw, href: buildHref(kind, raw) });

    lastIndex = match.index + raw.length;
    pattern.lastIndex = lastIndex;
  }

  if (lastIndex < text.length) {
    chunks.push({ kind: 'text', value: text.slice(lastIndex) });
  }

  return chunks;
};
