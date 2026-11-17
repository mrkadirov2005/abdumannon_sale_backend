import { describe, expect, it } from "vitest";
import { buildLedgerPersons, paymentIsFromMe, paymentTypeFor } from "./personLedger";
import type { Debt, FinanceRecord } from "./types";

let nextId = 1;
const debt = (name: string, amount: number, admin_id: string): Debt => ({
  id: String(nextId++),
  name,
  amount,
  admin_id,
  product_names: "",
  day: 1,
  month: 10,
  year: 2026,
  isreturned: false,
});
const pay = (
  description: string,
  amount: number,
  type: "income" | "expense" = "income",
  category = "sales"
): FinanceRecord => ({
  id: nextId++,
  amount: String(amount),
  description,
  type,
  category,
  date: "2026-10-01",
});

const find = (debts: Debt[], records: FinanceRecord[], name: string) =>
  buildLedgerPersons(debts, records).find((p) => p.name === name)!;

describe("Шухрат ака питр (pasted sheet)", () => {
  const name = "Шухрат ака питр";
  const myDebts = [
    580000, 358140, 62076, 103950, 740410, 333980, 392200, 132600, 45000, 1741600, 196300,
    244320, 199240, 240136, 132600, 252420,
  ].map((a) => debt(name, a, "qarzlarim"));
  const untagged = [pay(`${name}: кам чикган юк`, 900), pay(`${name}: Хисоб килдик сверка`, 2194388)];
  // the 84 "[qarzlarim]" payments add up to 4,259,879
  const tagged = [pay(`${name}: [qarzlarim] абду`, 4259879, "income", "my_debt")];

  it("is overpaid by Абдуманнон and listed in Қарздорлар as owing 700,195", () => {
    const p = find(myDebts, [...untagged, ...tagged], name);
    expect(p.side).toBe("debts");
    expect(p.totalAmount).toBe(6455167); // Абдуманнон (берган)
    expect(p.paidAmount).toBe(5754972); // Клиент (берган)
    expect(p.remainingAmount).toBe(700195);
    expect(p.debts).toHaveLength(16);
    expect(p.records).toHaveLength(3);
  });

  it("goes back to Қарзларим once he returns the 700,195", () => {
    const back = pay(`${name}: [qarzlarim] қайтарди`, 700195, paymentTypeFor(false, true), "my_debt");
    expect(back.type).toBe("expense");
    const p = find(myDebts, [...untagged, ...tagged, back], name);
    expect(p.side).toBe("myDebts");
    expect(p.remainingAmount).toBe(0);
  });

  it("goes back to Қарзларим when Абдуманнон takes more goods than the overpayment", () => {
    const p = find([...myDebts, debt(name, 1000000, "qarzlarim")], [...untagged, ...tagged], name);
    expect(p.side).toBe("myDebts");
    expect(p.remainingAmount).toBe(299805); // shown as "-299,805 ₽": Абдуманнон owes
  });
});

describe("client who overpays", () => {
  const name = "Ali";
  const debts = [debt(name, 1000, "qarzdorlar")];

  it("stays in Қарздорлар while he owes or is even", () => {
    expect(find(debts, [pay(`${name}: x`, 400)], name)).toMatchObject({
      side: "debts",
      totalAmount: 1000,
      paidAmount: 400,
      remainingAmount: 600,
    });
    expect(find(debts, [pay(`${name}: x`, 1000)], name).side).toBe("debts");
  });

  it("moves to Қарзларим when he overpays, showing what Абдуманнон owes", () => {
    expect(find(debts, [pay(`${name}: x`, 1500)], name)).toMatchObject({
      side: "myDebts",
      totalAmount: 1500,
      paidAmount: 1000,
      remainingAmount: 500,
    });
  });

  it("comes back when Абдуманнон repays him (default type on Қарзларим is 'Абдуманнон берди')", () => {
    const repayType = paymentTypeFor(true, false);
    expect(repayType).toBe("expense");
    const p = find(debts, [pay(`${name}: x`, 1500), pay(`${name}: back`, 500, repayType)], name);
    expect(p.side).toBe("debts");
    expect(p.remainingAmount).toBe(0);
  });

  it("comes back when he takes new goods (client debt)", () => {
    const p = find([...debts, debt(name, 800, "qarzdorlar")], [pay(`${name}: x`, 1500)], name);
    expect(p.side).toBe("debts");
    expect(p.remainingAmount).toBe(300);
  });
});

describe("other rules", () => {
  it("a lender who is owed money stays in Қарзларим like before", () => {
    const p = find(
      [debt("Bank", 1000, "qarzlarim")],
      [pay("Bank: [qarzlarim] x", 300, "income", "my_debt")],
      "Bank"
    );
    expect(p).toMatchObject({ side: "myDebts", totalAmount: 1000, paidAmount: 300, remainingAmount: 700 });
  });

  it("ignores valyutchik debts and payments", () => {
    const people = buildLedgerPersons(
      [debt("V", 100, "valyutchik")],
      [pay("V: [valyutchik] x", 50, "income", "my_debt")]
    );
    expect(people).toHaveLength(0);
  });

  it("matches names ignoring case and spaces", () => {
    const p = find([debt("Ali  Vali", 1000, "")], [pay("ali vali: x", 200)], "Ali  Vali");
    expect(p.remainingAmount).toBe(800);
  });

  it("reads who paid from the person's kind", () => {
    const income = pay("x: y", 1);
    expect(paymentIsFromMe(income, true)).toBe(true);
    expect(paymentIsFromMe(income, false)).toBe(false);
  });
});
