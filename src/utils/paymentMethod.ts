export const PAYMENT_METHOD_VALUES = ["cash", "debt", "card", "mobile", "other"] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHOD_VALUES)[number];

const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
  cash: "наличные",
  debt: "Долг",
  card: "карта",
  mobile: "Мобильный",
  other: "Другое",
};

const PAYMENT_METHOD_ALIASES: Record<string, PaymentMethodValue> = {
  cash: "cash",
  naqt: "cash",
  naqd: "cash",
  "наличные": "cash",
  нақд: "cash",

  debt: "debt",
  nasiya: "debt",
  nasia: "debt",
  "насия": "debt",
  долг: "debt",

  card: "card",
  karta: "card",
  "карта": "card",

  mobile: "mobile",
  mobil: "mobile",
  "mobile pay": "mobile",
  "мобильный": "mobile",
  "мобильная": "mobile",

  boshqa: "other",
  "бошқа": "other",
  other: "other",
  "другое": "other",
};

export function normalizePaymentMethod(method: string | null | undefined): string {
  if (!method) return "";

  const trimmed = method.trim();
  if (!trimmed) return "";

  const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");
  return PAYMENT_METHOD_ALIASES[normalized] ?? trimmed;
}

export function isStandardPaymentMethod(method: string | null | undefined): method is PaymentMethodValue {
  return PAYMENT_METHOD_VALUES.includes(normalizePaymentMethod(method) as PaymentMethodValue);
}

export function getPaymentMethodLabel(method: string | null | undefined): string {
  const normalized = normalizePaymentMethod(method);

  if (isStandardPaymentMethod(normalized)) {
    return PAYMENT_METHOD_LABELS[normalized];
  }

  return normalized || "—";
}

export function paymentMethodMatchesFilter(
  method: string | null | undefined,
  filter: string
): boolean {
  if (filter === "all") return true;

  const normalized = normalizePaymentMethod(method);
  if (filter === "other") {
    return normalized === "other" || !PAYMENT_METHOD_VALUES.includes(normalized as PaymentMethodValue);
  }

  return normalized === filter;
}

export const PAYMENT_METHOD_OPTIONS = PAYMENT_METHOD_VALUES.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));
