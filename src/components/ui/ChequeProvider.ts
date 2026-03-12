/**
 * ChequeProvider - printable cheque generator.
 */

export interface ChequeProduct {
  name: string;
  quantity: number;
  unit: string;       // "kg" | "t" | "l" | "pcs" etc.
  price: number;      // price per unit
  total: number;      // quantity * price
}

export interface ChequeData {
  documentType?: string;
  title?: string;
  number: string;
  date: string | Date;
  supplier: string;
  buyer: string;
  buyerLabel?: string;
  buyerRight?: string;
  products: ChequeProduct[];
  totalAmount?: number;
  extraNote?: string;
  signatureLeft?: string;
  signatureRight?: string;
  status?: string;
}

export const DEFAULT_SUPPLIER_HTML =
  "\u041c\u0443\u0445\u0430\u043c\u043c\u0430\u0434\u0436\u043e\u043d, \u0433. \u041c\u043e\u0441\u043a\u0432\u0430, \u0440\u044b\u043d\u043e\u043a \u00ab\u0424\u0443\u0434 \u0421\u0438\u0442\u0438\u00bb \u0422\u043e\u0440\u0433\u043e\u0432\u0430\u044f \u0442\u043e\u0447\u043a\u0430: 2-9-040<br/> \u0422\u0435\u043b: 8-915-016-16-15, 8-916-576-07-07";

const RU = {
  title: "\u041d\u0430\u043a\u043b\u0430\u0434\u043d\u0430\u044f",
  buyer: "\u041f\u043e\u043a\u0443\u043f\u0430\u0442\u0435\u043b\u044c",
  supplier: "\u041f\u043e\u0441\u0442\u0430\u0432\u0449\u0438\u043a",
  qty: "\u041a\u043e\u043b-\u0432\u043e",
  unit: "\u0415\u0434.",
  price: "\u0426\u0435\u043d\u0430",
  sum: "\u0421\u0443\u043c\u043c\u0430",
  total: "\u0418\u0442\u043e\u0433\u043e",
  status: "\u0421\u0442\u0430\u0442\u0443\u0441",
  director: "\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c",
  accountant: "\u0411\u0443\u0445\u0433\u0430\u043b\u0442\u0435\u0440",
  noteVat: "\u0412 \u0442\u043e\u043c \u0447\u0438\u0441\u043b\u0435 \u041d\u0414\u0421:",
  totalItems: "\u0412\u0441\u0435\u0433\u043e \u043d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0439",
  amountFor: "\u043d\u0430 \u0441\u0443\u043c\u043c\u0443",
};

const CHEQUE_SECRET = "SHOPPOS";

function checksumLetterForCheque(coreDigits: string): string {
  let sum = 0;
  for (const ch of coreDigits) sum += Number(ch);
  for (const ch of CHEQUE_SECRET) sum += ch.charCodeAt(0);
  const letterIndex = sum % 26;
  return String.fromCharCode(65 + letterIndex);
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

export function formatUnitLabel(unit: string | undefined | null): string {
  switch ((unit || "pcs").toLowerCase()) {
    case "kg":   return "\u043a\u0433";
    case "t":    return "\u0442";
    case "l":    return "\u043b";
    case "pcs":  return "\u0448\u0442";
    default:      return unit || "\u0448\u0442";
  }
}

function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

function numberToWordsRu(n: number): string {
  const units = ["", "\u043e\u0434\u0438\u043d", "\u0434\u0432\u0430", "\u0442\u0440\u0438", "\u0447\u0435\u0442\u044b\u0440\u0435", "\u043f\u044f\u0442\u044c", "\u0448\u0435\u0441\u0442\u044c", "\u0441\u0435\u043c\u044c", "\u0432\u043e\u0441\u0435\u043c\u044c", "\u0434\u0435\u0432\u044f\u0442\u044c"];
  const teens = ["\u0434\u0435\u0441\u044f\u0442\u044c", "\u043e\u0434\u0438\u043d\u043d\u0430\u0434\u0446\u0430\u0442\u044c", "\u0434\u0432\u0435\u043d\u0430\u0434\u0446\u0430\u0442\u044c", "\u0442\u0440\u0438\u043d\u0430\u0434\u0446\u0430\u0442\u044c", "\u0447\u0435\u0442\u044b\u0440\u043d\u0430\u0434\u0446\u0430\u0442\u044c", "\u043f\u044f\u0442\u043d\u0430\u0434\u0446\u0430\u0442\u044c", "\u0448\u0435\u0441\u0442\u043d\u0430\u0434\u0446\u0430\u0442\u044c", "\u0441\u0435\u043c\u043d\u0430\u0434\u0446\u0430\u0442\u044c", "\u0432\u043e\u0441\u0435\u043c\u043d\u0430\u0434\u0446\u0430\u0442\u044c", "\u0434\u0435\u0432\u044f\u0442\u043d\u0430\u0434\u0446\u0430\u0442\u044c"];
  const tens  = ["", "", "\u0434\u0432\u0430\u0434\u0446\u0430\u0442\u044c", "\u0442\u0440\u0438\u0434\u0446\u0430\u0442\u044c", "\u0441\u043e\u0440\u043e\u043a", "\u043f\u044f\u0442\u044c\u0434\u0435\u0441\u044f\u0442", "\u0448\u0435\u0441\u0442\u044c\u0434\u0435\u0441\u044f\u0442", "\u0441\u0435\u043c\u044c\u0434\u0435\u0441\u044f\u0442", "\u0432\u043e\u0441\u0435\u043c\u044c\u0434\u0435\u0441\u044f\u0442", "\u0434\u0435\u0432\u044f\u043d\u043e\u0441\u0442\u043e"];
  const hundreds = ["", "\u0441\u0442\u043e", "\u0434\u0432\u0435\u0441\u0442\u0438", "\u0442\u0440\u0438\u0441\u0442\u0430", "\u0447\u0435\u0442\u044b\u0440\u0435\u0441\u0442\u0430", "\u043f\u044f\u0442\u044c\u0441\u043e\u0442", "\u0448\u0435\u0441\u0442\u044c\u0441\u043e\u0442", "\u0441\u0435\u043c\u044c\u0441\u043e\u0442", "\u0432\u043e\u0441\u0435\u043c\u044c\u0441\u043e\u0442", "\u0434\u0435\u0432\u044f\u0442\u044c\u0441\u043e\u0442"];

  if (n === 0) return "\u043d\u043e\u043b\u044c";

  const integer = Math.floor(Math.abs(n));
  const parts: string[] = [];

  const millions = Math.floor(integer / 1_000_000);
  if (millions > 0) {
    parts.push(threeDigits(millions, false));
    if (millions % 10 === 1 && millions % 100 !== 11) parts.push("\u043c\u0438\u043b\u043b\u0438\u043e\u043d");
    else if ([2, 3, 4].includes(millions % 10) && ![12, 13, 14].includes(millions % 100)) parts.push("\u043c\u0438\u043b\u043b\u0438\u043e\u043d\u0430");
    else parts.push("\u043c\u0438\u043b\u043b\u0438\u043e\u043d\u043e\u0432");
  }

  const thousands = Math.floor((integer % 1_000_000) / 1000);
  if (thousands > 0) {
    parts.push(threeDigits(thousands, true));
    if (thousands % 10 === 1 && thousands % 100 !== 11) parts.push("\u0442\u044b\u0441\u044f\u0447\u0430");
    else if ([2, 3, 4].includes(thousands % 10) && ![12, 13, 14].includes(thousands % 100)) parts.push("\u0442\u044b\u0441\u044f\u0447\u0438");
    else parts.push("\u0442\u044b\u0441\u044f\u0447");
  }

  const remainder = integer % 1000;
  if (remainder > 0 || parts.length === 0) {
    parts.push(threeDigits(remainder, false));
  }

  const kopecks = Math.round((Math.abs(n) - integer) * 100);
  const kopStr = String(kopecks).padStart(2, "0");

  const result = parts.join(" ").replace(/\s+/g, " ").trim();
  return capitalize(result) + ` \u0440\u0443\u0431. ${kopStr} \u043a\u043e\u043f.`;

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
        if (feminine && u === 1) r.push("\u043e\u0434\u043d\u0430");
        else if (feminine && u === 2) r.push("\u0434\u0432\u0435");
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
  <title>${data.title || RU.title} № ${data.number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body { font-family: "Times New Roman", Times, serif; padding: 12mm 10mm; margin: 0; font-size: 13px; color: #000; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 0; }
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
    @page { size: A4 portrait; margin: 0; }
    @media print {
      html, body { width: 210mm; height: 297mm; }
      body { padding: 12mm 10mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { width: 100%; min-height: auto; }
      .print-btn { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
  ${data.documentType ? `<div class="doc-type">\ud83d\udccb <span>${data.documentType}</span></div>` : ""}
  <h1>${data.title || RU.title} № ${data.number} от ${formatDate(data.date)}</h1>

  <div class="info-block" style={"display:flex; width:100%; justify-content:space-between;"}>
    <span class="label">${RU.supplier}:</span>
    <span class="value">${data.supplier || DEFAULT_SUPPLIER_HTML}</span>
  </div>

  <div class="info-block${data.buyerRight ? " info-row" : ""}">
    ${data.buyerRight
      ? `<span class="left"><span class="label">${data.buyerLabel || RU.buyer}:</span><span class="value">${data.buyer}</span></span><span class="right">${data.buyerRight}</span>`
      : `<span class="label">${RU.buyer}:</span><span class="value">${data.buyer}</span>`}
  </div>

  <table class="products">
    <thead>
      <tr>
        <th style="width:5%">№</th>
        <th style="width:38%">\u0422\u043e\u0432\u0430\u0440</th>
        <th style="width:12%">${RU.qty}</th>
        <th style="width:8%">${RU.unit}</th>
        <th style="width:17%">${RU.price}</th>
        <th style="width:20%">${RU.sum}</th>
      </tr>
    </thead>
    <tbody>
      ${productRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="grand">${RU.total}: &nbsp; ${formatNumber(total)}</div>
    ${data.extraNote ? `<div class="note">${data.extraNote}</div>` : `<div class="note">${RU.noteVat}</div>`}
  </div>

  <div class="amount-words">
    ${RU.totalItems} ${data.products.length}, ${RU.amountFor} ${formatNumber(total)} \u0440\u0443\u0431.<br/>
    ${numberToWordsRu(total)}
  </div>

  ${data.status ? `<div class="status-line"><b>${RU.status}:</b> ${data.status}</div>` : ""}

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-label">${data.signatureLeft || RU.director}</div>
      <div class="sig-line">\u041e</div>
    </div>
    <div class="sig-block">
      <div class="sig-label">${data.signatureRight || RU.accountant}</div>
      <div class="sig-line">\u041e</div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">\u041f\u0435\u0447\u0430\u0442\u044c</button>
  </div>
</body>
</html>`;
}

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



