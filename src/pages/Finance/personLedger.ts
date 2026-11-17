import type { Debt, FinanceRecord, Person } from "./types";

// One balance per person for the Қарздорлар and Қарзларим tabs, so every card, folder
// and details page agrees, and a person moves between the two tabs in both directions.
//
// A person is a "lender" when Абдуманнон has taken something from them (a qarzlarim debt).
// For a lender every payment on their page is read the way that page shows it:
// income = Абдуманнон paid them, expense = they gave money back. Untagged payments
// count too (e.g. a "сверка" entered before their first qarzlarim debt).
// For a client (no qarzlarim debts) only client payments count:
// income = the client paid, expense = Абдуманнон paid them back.
//
// balance = what Абдуманнон gave − what the client gave (goods and money):
//   > 0 the person owes Абдуманнон  → Қарздорлар
//   < 0 Абдуманнон owes the person   → Қарзларим
//   = 0 settled: a client stays in Қарздорлар, a lender in Қарзларим

export const MY_DEBTS_ADMIN_ID = "qarzlarim";
export const VALYUTCHIK_ADMIN_ID = "valyutchik";

export type LedgerSide = "debts" | "myDebts";

export const normalizePersonName = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

export const recordPersonKey = (record: FinanceRecord) =>
  normalizePersonName((record.description || "").split(":")[0] || "");

export const getMyDebtRecordScope = (
  description?: string
): "qarzlarim" | "valyutchik" | null => {
  if (!description) return null;
  const lower = description.toLowerCase();
  if (lower.includes("[valyutchik]")) return "valyutchik";
  if (lower.includes("[qarzlarim]")) return "qarzlarim";
  return null;
};

const isValyutchikRecord = (record: FinanceRecord) =>
  record.category === "my_debt" && getMyDebtRecordScope(record.description) === "valyutchik";

// Accepts numbers and strings like "36,000" or "36 000"
export const parseAmount = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "").replace(/[\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const debtAdminId = (debt: Debt) => String(debt.admin_id ?? "").trim().toLowerCase();

// Who handed over the money in a payment, as the person's page reads it
export const paymentIsFromMe = (record: FinanceRecord, isLender: boolean) =>
  isLender ? record.type === "income" : record.type === "expense";

// The record type to save for a payment made by "me" (Абдуманнон) or by the other person
export const paymentTypeFor = (fromMe: boolean, isLender: boolean): "income" | "expense" =>
  fromMe === isLender ? "income" : "expense";

export const buildLedgerPersons = (debts: Debt[], records: FinanceRecord[]): Person[] => {
  const people = new Map<
    string,
    {
      name: string;
      allDebts: Debt[];
      clientDebts: Debt[];
      myDebts: Debt[];
      records: FinanceRecord[];
    }
  >();

  debts.forEach((debt) => {
    const admin = debtAdminId(debt);
    if (admin === VALYUTCHIK_ADMIN_ID) return;
    const key = normalizePersonName(debt.name);
    if (!people.has(key)) {
      people.set(key, {
        name: debt.name.trim(),
        allDebts: [],
        clientDebts: [],
        myDebts: [],
        records: [],
      });
    }
    const person = people.get(key)!;
    person.allDebts.push(debt); // keeps the incoming (date) order
    (admin === MY_DEBTS_ADMIN_ID ? person.myDebts : person.clientDebts).push(debt);
  });

  const isLender = (key: string) => (people.get(key)?.myDebts.length || 0) > 0;

  records.forEach((record) => {
    const key = recordPersonKey(record);
    const person = key ? people.get(key) : undefined;
    if (!person || isValyutchikRecord(record)) return;
    // A client's balance only uses client payments
    if (!isLender(key) && record.category === "my_debt") return;
    person.records.push(record);
  });

  const result: Person[] = [];
  people.forEach((p, key) => {
    const lender = isLender(key);
    const clientDebtsTotal = p.clientDebts.reduce((s, d) => s + parseAmount(d.amount), 0);
    const myDebtsTotal = p.myDebts.reduce((s, d) => s + parseAmount(d.amount), 0);
    // Each payment counts for whoever handed the money over (lender: income = Абдуманнон,
    // client: income = the client), so neither side ever shows a negative amount
    let paidByMe = 0;
    let paidByClient = 0;
    p.records.forEach((r) => {
      if (paymentIsFromMe(r, lender)) paidByMe += parseAmount(r.amount);
      else paidByClient += parseAmount(r.amount);
    });

    const givenByMe = clientDebtsTotal + paidByMe;
    const givenByClient = myDebtsTotal + paidByClient;
    const balance = givenByMe - givenByClient;
    const side: LedgerSide = (lender ? balance > 0 : balance >= 0) ? "debts" : "myDebts";

    result.push({
      name: p.name,
      // Қарздорлар: "Абдуманнон (берган)" / "Клиент (берган)" / owed to me
      // Қарзларим: "Абдуманнон (олган)" / "Тўланган" / I owe
      totalAmount: side === "debts" ? givenByMe : givenByClient,
      paidAmount: side === "debts" ? givenByClient : givenByMe,
      remainingAmount: side === "debts" ? balance : -balance || 0, // no "-0"
      debts: p.allDebts,
      records: p.records,
      isLender: lender,
      balance,
      side,
    });
  });

  return result;
};
