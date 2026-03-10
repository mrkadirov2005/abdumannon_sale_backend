const APOSTROPHE_REGEX = /[’ʻʼ`]/g;

const MULTI_MAP: Array<{ from: RegExp; lower: string; upper: string }> = [
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

const SINGLE_MAP: Array<{ from: RegExp; lower: string; upper: string }> = [
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

const applyCase = (match: string, lower: string, upper: string) => {
  const isAllUpper = match === match.toUpperCase();
  const isAllLower = match === match.toLowerCase();

  if (isAllUpper) return upper;
  if (isAllLower) return lower;

  return upper[0] + lower.slice(1);
};

export const transliterateUzToRu = (input: string) => {
  if (!input) return input;

  let output = input.replace(APOSTROPHE_REGEX, "'");

  for (const { from, lower, upper } of MULTI_MAP) {
    output = output.replace(from, (match) => applyCase(match, lower, upper));
  }

  for (const { from, lower, upper } of SINGLE_MAP) {
    output = output.replace(from, (match) => applyCase(match, lower, upper));
  }

  return output;
};
