import type { Debt, FinanceRecord, Person, Wagon } from "./types";

// "Сана" button: on = oldest first (asc), off = newest first (desc, the default)
export type DateOrder = "asc" | "desc";

// Dates become YYYYMMDD numbers so they compare without time zone shifts.
const dayKey = (value?: string): number => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? Number(match[1] + match[2] + match[3]) : 0;
};

const wagonDateKey = (wagon: Wagon): number => dayKey(wagon.created_at);

const debtDateKey = (debt: Debt): number =>
  Number(debt.year) * 10000 + Number(debt.month) * 100 + Number(debt.day);

const recordDateKey = (record: FinanceRecord): number => dayKey(String(record.date ?? ""));

// A person is dated by their latest wagon or debt.
const personDateKey = (person: Person): number =>
  Math.max(
    0,
    ...(person.wagons || []).map(wagonDateKey),
    ...(person.debts || []).map(debtDateKey)
  );

// The lists arrive oldest first, so for items on the same day the incoming position
// is their time order: keep it for "asc", reverse it for "desc" (latest entry on top).
const sortByKey = <T,>(items: T[], getKey: (item: T) => number, order: DateOrder): T[] => {
  const direction = order === "asc" ? 1 : -1;
  return items
    .map((item, index) => ({ item, index, key: getKey(item) }))
    .sort((a, b) => (a.key - b.key || a.index - b.index) * direction)
    .map(({ item }) => item);
};

export const sortWagonsByDate = (wagons: Wagon[], order: DateOrder) =>
  sortByKey(wagons, wagonDateKey, order);

export const sortDebtsByDate = (debts: Debt[], order: DateOrder) =>
  sortByKey(debts, debtDateKey, order);

export const sortRecordsByDate = (records: FinanceRecord[], order: DateOrder) =>
  sortByKey(records, recordDateKey, order);

export const sortPersonsByDate = (persons: Person[], order: DateOrder) =>
  sortByKey(persons, personDateKey, order);
