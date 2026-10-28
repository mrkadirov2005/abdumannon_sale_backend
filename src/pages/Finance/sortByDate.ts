import type { Debt, Person, Wagon } from "./types";

export type DateOrder = "asc" | "desc" | null;

// Dates become YYYYMMDD numbers so they compare without time zone shifts.
const wagonDateKey = (wagon: Wagon): number => {
  const match = wagon.created_at?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? Number(match[1] + match[2] + match[3]) : 0;
};

const debtDateKey = (debt: Debt): number =>
  Number(debt.year) * 10000 + Number(debt.month) * 100 + Number(debt.day);

// A person is dated by their latest wagon or debt.
const personDateKey = (person: Person): number =>
  Math.max(
    0,
    ...(person.wagons || []).map(wagonDateKey),
    ...(person.debts || []).map(debtDateKey)
  );

const sortByKey = <T,>(items: T[], getKey: (item: T) => number, order: DateOrder): T[] => {
  if (!order) return items;
  const direction = order === "asc" ? 1 : -1;
  return [...items].sort((a, b) => (getKey(a) - getKey(b)) * direction);
};

export const sortWagonsByDate = (wagons: Wagon[], order: DateOrder) =>
  sortByKey(wagons, wagonDateKey, order);

export const sortDebtsByDate = (debts: Debt[], order: DateOrder) =>
  sortByKey(debts, debtDateKey, order);

export const sortPersonsByDate = (persons: Person[], order: DateOrder) =>
  sortByKey(persons, personDateKey, order);
