/**
 * ChequeProvider — единый генератор накладных (чеков) для печати.
 *
 * Формат соответствует образцу клиента:
 *   Накладная на возврат / купля-продажа
 *   Поставщик / Покупатель
 *   Таблица: №, Товар, Кол-во, Ед., Цена, Сумма
 *   Итого + сумма прописью
 *   Подписи: Руководитель / Бухгалтер
 */

// ─── types ────────────────────────────────────────────────────────────────────
export interface ChequeProduct {
  name: string;
  quantity: number;
  unit: string;       // "kg" | "t" | "l" | "pcs" etc.
  price: number;       // цена за единицу
  total: number;       // сумма (quantity × price)
}

export interface ChequeData {
  /** Тип документа, например "Возврат поставщику (купля-продажа)" */
  documentType?: string;
  /** Заголовок, например "Накладная на возврат" или "Накладная" */
  title?: string;
  /** Номер документа */
  number: string;
  /** Дата документа (строка или Date) */
  date: string | Date;
  /** Информация о поставщике */
  supplier: string;
  /** Информация о покупателе (может быть многострочной) */
  buyer: string;
  /** ??????????: ??????? ????? (?? ????????? "??????????") */
  buyerLabel?: string;
  /** ??????????: ?????? ????? ?????? (???????? "?????? ??????") */
  buyerRight?: string;
  /** Продукты / позиции */
  products: ChequeProduct[];
  /** Итого (если не передано — считается автоматически) */
  totalAmount?: number;
  /** Доп. текст под итого (напр. "В том числе НДС:") */
  extraNote?: string;
  /** Левая подпись (по умолчанию "Руководитель") */
  signatureLeft?: string;
  /** Правая подпись (по умолчанию "Бухгалтер") */
  signatureRight?: string;
  /** Статус (например "Оплачено" / "Ожидается") — необязательно */
  status?: string;
}
export const DEFAULT_SUPPLIER_HTML =
  "\u041c\u0443\u0445\u0430\u043c\u043c\u0430\u0434\u0436\u043e\u043d, \u0433. \u041c\u043e\u0441\u043a\u0432\u0430, \u0440\u044b\u043d\u043e\u043a \u00ab\u0424\u0443\u0434 \u0421\u0438\u0442\u0438\u00bb \u0422\u043e\u0440\u0433\u043e\u0432\u0430\u044f \u0442\u043e\u0447\u043a\u0430: 2-9-040 \u0422\u0435\u043b: 8-915-016-16-15, 8-916-576-07-07";

const CHEQUE_SECRET = "SHOPPOS";

function checksumLetterForCheque(coreDigits: string): string {
  let sum = 0;
  for (const ch of coreDigits) sum += Number(ch);
  for (const ch of CHEQUE_SECRET) sum += ch.charCodeAt(0);
  const letterIndex = sum % 26;
  return String.fromCharCode(65 + letterIndex); // A-Z
}

export function generateChequeNumber(): string {
  const coreDigits = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
  const checksum = checksumLetterForCheque(coreDigits);
  return `${coreDigits}${checksum}`;
}

export function verifyChequeNumber(input: string): { ok: boolean; message: string } {
  const normalized = input.trim().toUpperCase();
  const match = normalized.match(/^(\d{6})([A-Z])$/);
  if (!match) {
    return { ok: false, message: "Format noto'g'ri. Namuna: 123456A" };
  }

  const [, coreDigits, checksum] = match;
  const expectedChecksum = checksumLetterForCheque(coreDigits);
  if (expectedChecksum !== checksum) {
    return { ok: false, message: "Chek bizniki emas" };
  }

  return { ok: true, message: "Chek tasdiqlandi" };
}


// ─── helpers ──────────────────────────────────────────────────────────────────
export function formatUnitLabel(unit: string | undefined | null): string {
  switch ((unit || "pcs").toLowerCase()) {
    case "kg":   return "кг";
    case "t":    return "т";
    case "l":    return "л";
    case "pcs":  return "шт";
    default:     return unit || "шт";
  }
}

function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  const dd = String(date.getDate());
  const mm = String(date.getMonth() + 1);
  const yyyy = String(date.getFullYear());
  return `${dd}.${mm}.${yyyy} г`;
}

function numberToWordsRu(n: number): string {
  // Simplified Russian number-to-words for typical invoice amounts
  const units = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
  const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
  const tens  = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
  const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

  if (n === 0) return "ноль";

  const integer = Math.floor(Math.abs(n));
  const parts: string[] = [];

  // миллионы
  const millions = Math.floor(integer / 1_000_000);
  if (millions > 0) {
    parts.push(threeDigits(millions, false));
    if (millions % 10 === 1 && millions % 100 !== 11) parts.push("миллион");
    else if ([2, 3, 4].includes(millions % 10) && ![12, 13, 14].includes(millions % 100)) parts.push("миллиона");
    else parts.push("миллионов");
  }

  // тысячи
  const thousands = Math.floor((integer % 1_000_000) / 1000);
  if (thousands > 0) {
    parts.push(threeDigits(thousands, true));
    if (thousands % 10 === 1 && thousands % 100 !== 11) parts.push("тысяча");
    else if ([2, 3, 4].includes(thousands % 10) && ![12, 13, 14].includes(thousands % 100)) parts.push("тысячи");
    else parts.push("тысяч");
  }

  // единицы
  const remainder = integer % 1000;
  if (remainder > 0 || parts.length === 0) {
    parts.push(threeDigits(remainder, false));
  }

  // копейки
  const kopecks = Math.round((Math.abs(n) - integer) * 100);
  const kopStr = String(kopecks).padStart(2, "0");

  const result = parts.join(" ").replace(/\s+/g, " ").trim();
  return capitalize(result) + ` руб. ${kopStr} коп.`;

  function threeDigits(num: number, feminine: boolean): string {
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;
    const r: string[] = [];
    if (h > 0) r.push(hundreds[h]);
    if (t === 1) {
      r.push(teens[u]);
    } else {
      if (t > 1) r.push(tens[t]);
      if (u > 0) {
        if (feminine && u === 1) r.push("одна");
        else if (feminine && u === 2) r.push("две");
        else r.push(units[u]);
      }
    }
    return r.join(" ");
  }

  function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

function formatNumber(n: number | string): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

// ─── main HTML generator ─────────────────────────────────────────────────────
export function generateChequeHTML(data: ChequeData): string {
  const total = data.totalAmount ?? data.products.reduce((s, p) => s + p.total, 0);

  const productRows = data.products
    .map(
      (p, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td>${p.name}</td>
        <td class="c">${formatNumber(p.quantity).replace('.00', '')}</td>
        <td class="c">${formatUnitLabel(p.unit)}</td>
        <td class="r">${formatNumber(p.price)}</td>
        <td class="r">${formatNumber(p.total)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${data.title || "Накладная"} № ${data.number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Times New Roman", Times, serif; padding: 30px 40px; max-width: 900px; margin: 0 auto; font-size: 13px; color: #000; }
    .page { border: 1px solid #000; padding: 20px 24px; }
    .doc-type { font-size: 11px; margin-bottom: 4px; }
    .doc-type span { font-size: 13px; }
    h1 { font-size: 18px; font-weight: bold; margin-bottom: 16px; }
    .info-block { margin-bottom: 10px; line-height: 1.7; }
    .info-block .label { font-weight: bold; }
    .info-block .value { margin-left: 8px; }
    .info-block.info-row { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
    .info-block.info-row .left { display: flex; align-items: baseline; gap: 8px; }
    .info-block.info-row .right { white-space: nowrap; }
    
    table.products { width: 100%; border-collapse: collapse; margin: 16px 0 8px 0; }
    table.products th,
    table.products td { border: 1px solid #000; padding: 5px 8px; font-size: 12px; }
    table.products th { text-align: center; font-weight: bold; background: #fff; }
    table.products td.c { text-align: center; }
    table.products td.r { text-align: right; }
    
    .totals { text-align: right; margin: 8px 0 6px 0; font-size: 13px; }
    .totals .grand { font-weight: bold; font-size: 15px; }
    .totals .note { font-size: 12px; margin-top: 2px; }
    
    .amount-words { margin: 12px 0; font-size: 12px; line-height: 1.5; }

    .status-line { margin: 8px 0; font-size: 12px; }
    
    .signatures { margin-top: 36px; display: flex; justify-content: space-between; font-size: 12px; }
    .sig-block { width: 45%; }
    .sig-block .sig-label { font-weight: bold; margin-bottom: 4px; }
    .sig-block .sig-line { border-bottom: 1px solid #000; height: 24px; margin-bottom: 2px; display: flex; align-items: flex-end; justify-content: flex-end; padding-right: 8px; font-size: 11px; }
    
    .print-btn { margin-top: 30px; padding: 10px 24px; background: #4F46E5; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 13px; }
    @media print { .print-btn { display: none !important; } }
  </style>
</head>
<body>
  <div class="page">
  ${data.documentType ? `<div class="doc-type">📋 <span>${data.documentType}</span></div>` : ""}
  <h1>${data.title || "Накладная"} № ${data.number} от ${formatDate(data.date)}</h1>
  
  <div class="info-block" style={"display:flex; width:100%; justify-content:space-between;"}>
    <span class="label">Поставщик:</span>
    <span class="value">${data.supplier || DEFAULT_SUPPLIER_HTML}</span>
  </div>
  
  <div class="info-block${data.buyerRight ? " info-row" : ""}">
    ${data.buyerRight
      ? `<span class="left"><span class="label">${data.buyerLabel || "Покупатель"}:</span><span class="value">${data.buyer}</span></span><span class="right">${data.buyerRight}</span>`
      : `<span class="label">Покупатель:</span><span class="value">${data.buyer}</span>`}
  </div>
  
  <table class="products">
    <thead>
      <tr>
        <th style="width:5%">№</th>
        <th style="width:38%">Товар</th>
        <th style="width:12%">Кол-во</th>
        <th style="width:8%">Ед.</th>
        <th style="width:17%">Цена</th>
        <th style="width:20%">Сумма</th>
      </tr>
    </thead>
    <tbody>
      ${productRows}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="grand">Итого: &nbsp; ${formatNumber(total)}</div>
    ${data.extraNote ? `<div class="note">${data.extraNote}</div>` : `<div class="note">В том числе НДС:</div>`}
  </div>
  
  <div class="amount-words">
    Всего наименований ${data.products.length}, на сумму ${formatNumber(total)} руб.<br/>
    ${numberToWordsRu(total)}
  </div>

  ${data.status ? `<div class="status-line"><b>Статус:</b> ${data.status}</div>` : ""}
  
  <div class="signatures">
    <div class="sig-block">
      <div class="sig-label">${data.signatureLeft || "Руководитель"}</div>
      <div class="sig-line">О</div>
    </div>
    <div class="sig-block">
      <div class="sig-label">${data.signatureRight || "Бухгалтер"}</div>
      <div class="sig-line">О</div>
    </div>
  </div>
  
  <button class="print-btn" onclick="window.print()">Печать</button>
  </div>
</body>
</html>`;
}

// ─── convenience: open & print in new window ─────────────────────────────────
export function printCheque(data: ChequeData): void {
  const html = generateChequeHTML(data);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup bloklangan. Iltimos, brauzeringizda popup'ga ruxsat bering.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}
