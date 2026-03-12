const fs = require('fs');
const path = require('path');

const APOSTROPHE_REGEX = /[’?'`]/g;

const MULTI_MAP = [
  { from: /o'/gi, lower: "?", upper: "?" },
  { from: /g'/gi, lower: "?", upper: "?" },
  { from: /sh/gi, lower: "?", upper: "?" },
  { from: /ch/gi, lower: "?", upper: "?" },
  { from: /ng/gi, lower: "??", upper: "??" },
  { from: /yo/gi, lower: "?", upper: "?" },
  { from: /yu/gi, lower: "?", upper: "?" },
  { from: /ya/gi, lower: "?", upper: "?" },
  { from: /ye/gi, lower: "?", upper: "?" },
  { from: /ts/gi, lower: "?", upper: "?" },
];

const SINGLE_MAP = [
  { from: /a/gi, lower: "?", upper: "?" },
  { from: /b/gi, lower: "?", upper: "?" },
  { from: /d/gi, lower: "?", upper: "?" },
  { from: /e/gi, lower: "?", upper: "?" },
  { from: /f/gi, lower: "?", upper: "?" },
  { from: /g/gi, lower: "?", upper: "?" },
  { from: /h/gi, lower: "?", upper: "?" },
  { from: /i/gi, lower: "?", upper: "?" },
  { from: /j/gi, lower: "?", upper: "?" },
  { from: /k/gi, lower: "?", upper: "?" },
  { from: /l/gi, lower: "?", upper: "?" },
  { from: /m/gi, lower: "?", upper: "?" },
  { from: /n/gi, lower: "?", upper: "?" },
  { from: /o/gi, lower: "?", upper: "?" },
  { from: /p/gi, lower: "?", upper: "?" },
  { from: /q/gi, lower: "?", upper: "?" },
  { from: /r/gi, lower: "?", upper: "?" },
  { from: /s/gi, lower: "?", upper: "?" },
  { from: /t/gi, lower: "?", upper: "?" },
  { from: /u/gi, lower: "?", upper: "?" },
  { from: /v/gi, lower: "?", upper: "?" },
  { from: /x/gi, lower: "?", upper: "?" },
  { from: /y/gi, lower: "?", upper: "?" },
  { from: /z/gi, lower: "?", upper: "?" },
  { from: /c/gi, lower: "?", upper: "?" },
  { from: /w/gi, lower: "?", upper: "?" },
];

function applyCase(match, lower, upper) {
  const isAllUpper = match === match.toUpperCase();
  const isAllLower = match === match.toLowerCase();
  if (isAllUpper) return upper;
  if (isAllLower) return lower;
  return upper[0] + lower.slice(1);
}

function transliterateUzToCyr(input) {
  if (!input) return input;
  let output = input.replace(APOSTROPHE_REGEX, "'");
  for (const { from, lower, upper } of MULTI_MAP) {
    output = output.replace(from, (match) => applyCase(match, lower, upper));
  }
  for (const { from, lower, upper } of SINGLE_MAP) {
    output = output.replace(from, (match) => applyCase(match, lower, upper));
  }
  return output;
}

function shouldConvert(text) {
  return /[A-Za-z]/.test(text);
}

const ATTRS = [
  'placeholder',
  'title',
  'label',
  'helperText',
  'aria-label',
  'noOptionsText',
  'loadingText',
  'emptyText',
  'confirmText',
  'cancelText',
  'okText',
  'alt',
];

function replaceAttrStrings(content) {
  for (const attr of ATTRS) {
    const re1 = new RegExp(`\\b${attr}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'g');
    content = content.replace(re1, (m, full, d1, d2) => {
      const text = d1 ?? d2 ?? '';
      if (!shouldConvert(text)) return m;
      const converted = transliterateUzToCyr(text);
      return m.startsWith(attr)
        ? `${attr}=${full[0]}${converted}${full[0]}`
        : m;
    });

    const re2 = new RegExp(`\\b${attr}\\s*=\\s*\\{\\s*("([^"]*)"|'([^']*)')\\s*\\}`, 'g');
    content = content.replace(re2, (m, full, d1, d2) => {
      const text = d1 ?? d2 ?? '';
      if (!shouldConvert(text)) return m;
      const converted = transliterateUzToCyr(text);
      const quote = full[0];
      return `${attr}={${quote}${converted}${quote}}`;
    });
  }
  return content;
}

function replaceJsxText(content) {
  const re = />([^<>{}][^<]*)</g;
  return content.replace(re, (m, text) => {
    if (!text || !text.trim()) return m;
    if (!shouldConvert(text)) return m;
    const converted = transliterateUzToCyr(text);
    return `>${converted}<`;
  });
}

function replaceToastAlert(content) {
  const re = /\b(toast\.[a-zA-Z]+|alert|confirm)\(\s*"([^"]*)"\s*\)/g;
  return content.replace(re, (m, fn, text) => {
    if (!shouldConvert(text)) return m;
    const converted = transliterateUzToCyr(text);
    return `${fn}("${converted}")`;
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  content = replaceAttrStrings(content);
  content = replaceJsxText(content);
  content = replaceToastAlert(content);
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && full.endsWith('.tsx')) {
      processFile(full);
    }
  }
}

const root = process.argv[2];
if (!root) {
  console.error('Usage: node convert_uz_to_cyrillic.js <dir>');
  process.exit(1);
}
walk(root);
