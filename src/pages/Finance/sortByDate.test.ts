import { describe, expect, it } from "vitest";
import { sortDebtsByDate, sortPersonsByDate, sortRecordsByDate, sortWagonsByDate } from "./sortByDate";
import type { Debt, FinanceRecord, Person, Wagon } from "./types";

const debt = (id: string, day: number, month = 10): Debt => ({
  id, name: "x", amount: 1, admin_id: "", product_names: "", day, month, year: 2026, isreturned: false,
});
const rec = (id: number, date: string): FinanceRecord => ({ id, amount: "1", type: "income", category: "sales", date });
const ids = (list: { id: string | number }[]) => list.map((x) => x.id).join(",");

describe("Сана sorting", () => {
  // Lists arrive oldest first; a, b are both on 05.10 (a entered first)
  const debts = [debt("old", 1), debt("a", 5), debt("b", 5), debt("new", 2, 11)];

  it("off (desc) = newest first, same-day entries latest first", () => {
    expect(ids(sortDebtsByDate(debts, "desc"))).toBe("new,b,a,old");
  });

  it("on (asc) = oldest first, same-day entries in entry order", () => {
    expect(ids(sortDebtsByDate(debts, "asc"))).toBe("old,a,b,new");
  });

  it("does not change the input list", () => {
    sortDebtsByDate(debts, "desc");
    expect(ids(debts)).toBe("old,a,b,new");
  });

  it("sorts payments by their date, ignoring the time part", () => {
    const records = [rec(1, "2026-10-03T00:00:00.000Z"), rec(2, "2026-11-12"), rec(3, "2026-10-16T19:00:00.000Z")];
    expect(ids(sortRecordsByDate(records, "desc"))).toBe("2,3,1");
    expect(ids(sortRecordsByDate(records, "asc"))).toBe("1,3,2");
  });

  it("sorts wagons by created_at day", () => {
    const w = (id: string, created_at: string) => ({ id, created_at }) as Wagon;
    expect(ids(sortWagonsByDate([w("a", "2026-09-01"), w("b", "2026-10-01")], "desc"))).toBe("b,a");
  });

  it("dates a person (folder) by their latest debt", () => {
    const p = (name: string, list: Debt[]) => ({ name, debts: list }) as Person;
    const people = [p("Ali", [debt("1", 1), debt("2", 20)]), p("Vali", [debt("3", 10)])];
    expect(sortPersonsByDate(people, "desc").map((x) => x.name)).toEqual(["Ali", "Vali"]);
    expect(sortPersonsByDate(people, "asc").map((x) => x.name)).toEqual(["Vali", "Ali"]);
  });
});
