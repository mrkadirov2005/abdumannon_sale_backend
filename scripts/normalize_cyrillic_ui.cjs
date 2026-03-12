const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const APOSTROPHE_REGEX = /[’ʻʼ`]/g;

const MULTI_MAP = [
  { from: /o'/gi, lower: "ў", upper: "Ў" },
  { from: /g'/gi, lower: "ғ", upper: "Ғ" },
  { from: /sh/gi, lower: "ш", upper: "Ш" },
  { from: /ch/gi, lower: "ч", upper: "Ч" },
  { from: /ng/gi, lower: "нг", upper: "НГ" },
  { from: /yo/gi, lower: "ё", upper: "Ё" },
  { from: /yu/gi, lower: "ю", upper: "Ю" },
  { from: /ya/gi, lower: "я", upper: "Я" },
  { from: /ye/gi, lower: "е", upper: "Е" },
  { from: /ts/gi, lower: "ц", upper: "Ц" },
];

const SINGLE_MAP = [
  { from: /a/gi, lower: "а", upper: "А" },
  { from: /b/gi, lower: "б", upper: "Б" },
  { from: /d/gi, lower: "д", upper: "Д" },
  { from: /e/gi, lower: "е", upper: "Е" },
  { from: /f/gi, lower: "ф", upper: "Ф" },
  { from: /g/gi, lower: "г", upper: "Г" },
  { from: /h/gi, lower: "ҳ", upper: "Ҳ" },
  { from: /i/gi, lower: "и", upper: "И" },
  { from: /j/gi, lower: "ж", upper: "Ж" },
  { from: /k/gi, lower: "к", upper: "К" },
  { from: /l/gi, lower: "л", upper: "Л" },
  { from: /m/gi, lower: "м", upper: "М" },
  { from: /n/gi, lower: "н", upper: "Н" },
  { from: /o/gi, lower: "о", upper: "О" },
  { from: /p/gi, lower: "п", upper: "П" },
  { from: /q/gi, lower: "қ", upper: "Қ" },
  { from: /r/gi, lower: "р", upper: "Р" },
  { from: /s/gi, lower: "с", upper: "С" },
  { from: /t/gi, lower: "т", upper: "Т" },
  { from: /u/gi, lower: "у", upper: "У" },
  { from: /v/gi, lower: "в", upper: "В" },
  { from: /x/gi, lower: "х", upper: "Х" },
  { from: /y/gi, lower: "й", upper: "Й" },
  { from: /z/gi, lower: "з", upper: "З" },
  { from: /c/gi, lower: "ц", upper: "Ц" },
  { from: /w/gi, lower: "в", upper: "В" },
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

const REVERSE_MULTI = [
  { from: /НГ/g, to: "NG" },
  { from: /нг/g, to: "ng" },
  { from: /Нг/g, to: "Ng" },
  { from: /нГ/g, to: "nG" },
];

const REVERSE_SINGLE = new Map([
  ["а", "a"], ["А", "A"],
  ["б", "b"], ["Б", "B"],
  ["в", "v"], ["В", "V"],
  ["г", "g"], ["Г", "G"],
  ["д", "d"], ["Д", "D"],
  ["е", "e"], ["Е", "E"],
  ["ё", "yo"], ["Ё", "Yo"],
  ["ж", "j"], ["Ж", "J"],
  ["з", "z"], ["З", "Z"],
  ["и", "i"], ["И", "I"],
  ["й", "y"], ["Й", "Y"],
  ["к", "k"], ["К", "K"],
  ["л", "l"], ["Л", "L"],
  ["м", "m"], ["М", "M"],
  ["н", "n"], ["Н", "N"],
  ["о", "o"], ["О", "O"],
  ["п", "p"], ["П", "P"],
  ["р", "r"], ["Р", "R"],
  ["с", "s"], ["С", "S"],
  ["т", "t"], ["Т", "T"],
  ["у", "u"], ["У", "U"],
  ["ф", "f"], ["Ф", "F"],
  ["х", "x"], ["Х", "X"],
  ["ц", "ts"], ["Ц", "Ts"],
  ["ч", "ch"], ["Ч", "Ch"],
  ["ш", "sh"], ["Ш", "Sh"],
  ["щ", "shch"], ["Щ", "Shch"],
  ["ъ", ""], ["Ъ", ""],
  ["ь", ""], ["Ь", ""],
  ["ю", "yu"], ["Ю", "Yu"],
  ["я", "ya"], ["Я", "Ya"],
  ["ў", "o'"], ["Ў", "O'"],
  ["ғ", "g'"], ["Ғ", "G'"],
  ["қ", "q"], ["Қ", "Q"],
  ["ҳ", "h"], ["Ҳ", "H"],
]);

function reverseTransliterateAll(input) {
  if (!input) return input;
  let output = input;
  for (const { from, to } of REVERSE_MULTI) {
    output = output.replace(from, to);
  }
  output = output.replace(/[А-Яа-яЎўҚқҒғҲҳЁё]/g, (ch) => {
    return REVERSE_SINGLE.get(ch) ?? ch;
  });
  return output;
}

function shouldConvert(text) {
  return /[A-Za-z]/.test(text);
}

const ATTRS = new Set([
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
]);

function addReplacement(replacements, start, end, text) {
  replacements.push({ start, end, text });
}

function isToastCall(node) {
  return ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'toast';
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const restored = reverseTransliterateAll(original);

  const source = ts.createSourceFile(filePath, restored, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const replacements = [];

  function visit(node) {
    if (ts.isJsxText(node)) {
      const text = node.getText(source);
      if (text.trim() && shouldConvert(text)) {
        const converted = transliterateUzToCyr(text);
        addReplacement(replacements, node.getStart(source), node.getEnd(), converted);
      }
    }

    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(source);
      if (ATTRS.has(name) && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          const literal = node.initializer;
          if (shouldConvert(literal.text)) {
            const quote = literal.getText(source)[0];
            const converted = transliterateUzToCyr(literal.text);
            addReplacement(replacements, literal.getStart(source), literal.getEnd(), `${quote}${converted}${quote}`);
          }
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression && ts.isStringLiteral(node.initializer.expression)) {
          const literal = node.initializer.expression;
          if (shouldConvert(literal.text)) {
            const quote = literal.getText(source)[0];
            const converted = transliterateUzToCyr(literal.text);
            addReplacement(replacements, literal.getStart(source), literal.getEnd(), `${quote}${converted}${quote}`);
          }
        }
      }
    }

    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isAlert = ts.isIdentifier(callee) && (callee.text === 'alert' || callee.text === 'confirm');
      const isToast = isToastCall(callee);
      if ((isAlert || isToast) && node.arguments.length > 0) {
        const arg = node.arguments[0];
        if (ts.isStringLiteral(arg) && shouldConvert(arg.text)) {
          const quote = arg.getText(source)[0];
          const converted = transliterateUzToCyr(arg.text);
          addReplacement(replacements, arg.getStart(source), arg.getEnd(), `${quote}${converted}${quote}`);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);

  if (replacements.length === 0 && restored === original) return;

  replacements.sort((a, b) => b.start - a.start);
  let output = restored;
  for (const r of replacements) {
    output = output.slice(0, r.start) + r.text + output.slice(r.end);
  }

  if (output !== original) {
    fs.writeFileSync(filePath, output, 'utf8');
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
  console.error('Usage: node normalize_cyrillic_ui.cjs <dir>');
  process.exit(1);
}
walk(root);
