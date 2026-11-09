// The guardrail is plain code, not AI: predictable and testable.

const PII_RULES = [
  { label: 'email', pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { label: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { label: 'card number', pattern: /\b(?:\d[ -]?){13,16}\b/g },
  { label: 'phone', pattern: /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
];

const TOPIC_RULES = [
  { flag: 'crisis', pattern: /\b(suicid\w*|kill (myself|me)|end my life|hurt (myself|me)|self[- ]?harm|overdos\w*|in danger|being abused)\b/i },
  { flag: 'medical', pattern: /\b(medicine|medication|dose|dosage|symptom\w*|diagnos\w*|prescription|pregnan\w*|doctor|sick)\b/i },
  { flag: 'legal', pattern: /\b(evict\w*|lawyer|lawsuit|court|custody|immigration|legal|sue|arrest\w*)\b/i },
];

export function run({ message }) {
  let redacted = message;
  const removed = [];
  for (const rule of PII_RULES) {
    redacted = redacted.replace(rule.pattern, () => {
      removed.push(rule.label);
      return `[${rule.label} removed]`;
    });
  }
  const flags = TOPIC_RULES.filter((rule) => rule.pattern.test(message)).map((rule) => rule.flag);
  if (removed.length) flags.push('pii-removed');
  return { redacted, flags, removed };
}

export const CRISIS_REPLY =
  "I'm really glad you reached out, and I want you to get help from a person right now. " +
  'If you are in immediate danger, call 911. ' +
  'You can call or text 988 (the Suicide & Crisis Lifeline) any time, day or night. ' +
  "I'm an AI and can't help with this safely, but they can.";
