/**
 * Name Processing & Sanitization Utility
 * Provides intelligent splitting of a Full Name into First Name and Last Name
 * with security sanitization to prevent XSS, script injection, and data corruption.
 */

export interface ParsedName {
  fullName: string;
  firstName: string;
  lastName: string;
}

// Known honorifics/titles in academic institutions
const KNOWN_HONORIFICS = new Set([
  'dr', 'dr.', 'prof', 'prof.', 'professor', 'mr', 'mr.', 'ms', 'ms.', 'mrs', 'mrs.',
  'er', 'er.', 'md', 'md.', 'shri', 'smt', 'kumar', 'kumari', 'rev', 'rev.'
]);

// Common double-barrel prefixes / particles (e.g. van, von, de, da, al, bin)
const PARTICLES = new Set(['van', 'von', 'de', 'da', 'del', 'della', 'di', 'du', 'la', 'le', 'al', 'el', 'bin', 'ibn']);

/**
 * Clean & sanitize raw user string:
 * - Strips script tags & contents
 * - Strips all other HTML tags
 * - Removes harmful injection characters (<, >, ", ', ;, --, \)
 * - Replaces multiple whitespace with a single space
 * - Trims edges
 */
export function sanitizeNameInput(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script blocks completely
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style blocks completely
    .replace(/<[^>]*>?/gm, '') // Remove any remaining HTML tags
    .replace(/[<>"';\\`~|=[\]{}*^%$#@!]/g, '') // Remove dangerous injection characters, keep alphanumeric, spaces, hyphens, periods
    .replace(/\s+/g, ' ') // Collapse multiple whitespace
    .trim();
}

/**
 * Formats a word into standard Title Case while preserving special cases
 */
function toTitleCase(word: string): string {
  if (!word) return '';
  const lower = word.toLowerCase();
  if (PARTICLES.has(lower)) return lower; // Keep particles lowercase (e.g., 'van', 'de')
  
  // If honorific with period like Dr. or Prof.
  if (lower === 'dr.' || lower === 'dr') return 'Dr.';
  if (lower === 'prof.' || lower === 'prof') return 'Prof.';
  if (lower === 'mr.' || lower === 'mr') return 'Mr.';
  if (lower === 'ms.' || lower === 'ms') return 'Ms.';
  if (lower === 'mrs.' || lower === 'mrs') return 'Mrs.';
  if (lower === 'er.' || lower === 'er') return 'Er.';

  // Handle hyphenated names (e.g., Jean-Luc)
  if (word.includes('-')) {
    return word
      .split('-')
      .map(part => toTitleCase(part))
      .join('-');
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Algorithm: Automatically splits a single Full Name input into First Name & Last Name
 * 
 * Rules:
 * 1. Single word (e.g. "Shivangini") -> First: "Shivangini", Last: ""
 * 2. Two words (e.g. "Virat Kohli") -> First: "Virat", Last: "Kohli"
 * 3. Title + Name (e.g. "Dr. Rajesh Varma") -> First: "Dr. Rajesh", Last: "Varma"
 * 4. Multi-word (e.g. "Mohammad Salman Khan") -> First: "Mohammad Salman", Last: "Khan"
 * 5. Title + Multi-word (e.g. "Prof. Dr. Anand Kumar Sharma") -> First: "Prof. Dr. Anand Kumar", Last: "Sharma"
 */
export function splitFullName(input: string): ParsedName {
  const sanitized = sanitizeNameInput(input);
  if (!sanitized) {
    return { fullName: '', firstName: '', lastName: '' };
  }

  const parts = sanitized.split(' ').filter(Boolean).map(toTitleCase);

  if (parts.length === 0) {
    return { fullName: '', firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    const single = parts[0];
    return {
      fullName: single,
      firstName: single,
      lastName: '',
    };
  }

  if (parts.length === 2) {
    const first = parts[0];
    const last = parts[1];
    return {
      fullName: `${first} ${last}`,
      firstName: first,
      lastName: last,
    };
  }

  // 3 or more parts:
  // Check if first part(s) are honorifics/titles
  let titlePrefixCount = 0;
  while (
    titlePrefixCount < parts.length - 1 &&
    KNOWN_HONORIFICS.has(parts[titlePrefixCount].toLowerCase().replace(/\.$/, ''))
  ) {
    titlePrefixCount++;
  }

  // Last word is usually the family name / surname, unless preceded by a particle (e.g. 'van Beethoven')
  let lastNameStartIndex = parts.length - 1;
  if (parts.length > 2 && PARTICLES.has(parts[parts.length - 2].toLowerCase())) {
    lastNameStartIndex = parts.length - 2;
  }

  // Ensure first name gets at least the title + 1 word
  const splitIndex = Math.max(titlePrefixCount + 1, lastNameStartIndex);

  const firstName = parts.slice(0, splitIndex).join(' ');
  const lastName = parts.slice(splitIndex).join(' ');

  return {
    fullName: parts.join(' '),
    firstName,
    lastName,
  };
}
