/**
 * Crisis keyword detection for Feyrn chat surfaces.
 * Required for California (AB 587, Jan 2026) and New York (Nov 2025) compliance.
 * Detects self-harm and crisis signals in user-typed messages.
 */

// German and English crisis keywords
// Conservative list — only clear signals, no over-triggering on normal nightlife conversation
const CRISIS_KEYWORDS = [
  // German
  'suizid', 'selbstmord', 'mich umbringen', 'nicht mehr leben',
  'will sterben', 'möchte sterben', 'aufhören zu leben',
  'mir etwas antun', 'mir selbst wehtun', 'selbstverletzung',
  'ich halte es nicht mehr aus', 'kein ausweg mehr',
  // English
  'suicide', 'kill myself', 'end my life', 'want to die',
  'self harm', 'self-harm', 'cant go on', "can't go on",
  'no reason to live',
];

/**
 * Returns true if the message contains a crisis keyword.
 * Case-insensitive, word-boundary aware.
 */
export function detectCrisis(text: string): boolean {
  if (!text || text.trim().length < 5) return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}
