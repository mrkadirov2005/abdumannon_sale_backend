import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import Finance from "./Finance";

// Renders the real Moliya page against a fake API and clicks through the tabs.

vi.mock("react-redux", () => ({ useSelector: () => 1 }));
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("react-toastify", () => ({ toast: toastMock }));

type Row = Record<string, unknown>;
let debts: Row[] = [];
let records: Row[] = [];
let posts: { url: string; body: Row }[] = [];
let id = 100;

const debt = (name: string, amount: number, admin_id: string) => ({
  id: String(id++),
  name,
  amount,
  admin_id,
  product_names: "",
  day: 1,
  month: 10,
  year: 2026,
  isreturned: false,
});
const rec = (description: string, amount: number, type: string, category: string) => ({
  id: id++,
  amount: String(amount),
  description,
  type,
  category,
  date: "2026-10-05",
});

const json = (data: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });

beforeEach(() => {
  posts = [];
  Object.values(toastMock).forEach((fn) => fn.mockClear());
  debts = [
    // Lender overpaid by Абдуманнон: took 1000, paid 300 (untagged) + 900 → he owes 200
    debt("Шухрат", 600, "qarzlarim"),
    debt("Шухрат", 400, "qarzlarim"),
    // Client who overpaid: took 1000, paid 1500 → Абдуманнон owes 500
    debt("Ali", 1000, ""),
    // Normal lender: Абдуманнон owes 700
    debt("Bank", 1000, "qarzlarim"),
    // Normal client: owes 400
    debt("Vali", 500, ""),
  ];
  records = [
    rec("Шухрат: сверка", 300, "income", "sales"),
    rec("Шухрат: [qarzlarim] абду", 900, "income", "my_debt"),
    rec("Ali: нахт", 1500, "income", "sales"),
    rec("Bank: [qarzlarim] x", 300, "income", "my_debt"),
    rec("Vali: x", 100, "income", "sales"),
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: { method?: string; body?: string }) => {
      const body = init?.body ? JSON.parse(init.body) : {};
      if (url.endsWith("/wagons/all")) return json({ data: [] });
      if (url.endsWith("/debts/all")) return json({ data: debts });
      if (url.endsWith("/finance") && init?.method === "POST") {
        posts.push({ url, body });
        records.push({ ...rec(body.description, body.amount, body.type, body.category), date: body.date });
        return json({ data: {} });
      }
      if (url.endsWith("/finance")) return json({ data: records });
      if (url.endsWith("/debts/create")) {
        posts.push({ url, body });
        debts.push({ ...debt(body.name, body.amount, body.admin_id) });
        return json({ data: { id: 1 } });
      }
      return json({ data: [] });
    })
  );
});

const openTab = async (label: string) => {
  await screen.findByText("Вагонлар");
  fireEvent.click(screen.getByRole("button", { name: label }));
};
const folder = (name: string) => screen.queryByRole("heading", { level: 3, name });
const card = (label: string) => screen.getAllByText(label)[0].parentElement!.parentElement!;

describe("Moliya page", () => {
  it("lists each person on the tab their balance puts them, with matching cards", async () => {
    render(<Finance />);
    await openTab("Қарздорлар");
    expect(folder("Шухрат")).toBeInTheDocument();
    expect(folder("Vali")).toBeInTheDocument();
    expect(folder("Ali")).toBeNull();
    expect(folder("Bank")).toBeNull();
    // Абдуманнон gave: 1200 (Шухрат payments) + 500 (Vali goods); client gave: 1000 + 100
    expect(within(card("Абдуманнон (берган)")).getByText("1,700 ₽")).toBeInTheDocument();
    expect(within(card("Клиент (берган)")).getByText("1,100 ₽")).toBeInTheDocument();
    expect(within(card("Қолдиқ")).getByText("+600 ₽")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Қарзларим" }));
    expect(folder("Ali")).toBeInTheDocument();
    expect(folder("Bank")).toBeInTheDocument();
    expect(folder("Шухрат")).toBeNull();
    // Абдуманнон took: 1500 (Ali's money) + 1000 (Bank); paid: 1000 (Ali goods) + 300
    expect(within(card("Абдуманнон (олган)")).getByText("2,500 ₽")).toBeInTheDocument();
    expect(within(card("Тўланган")).getByText("1,300 ₽")).toBeInTheDocument();
    expect(within(card("Қолдиқ")).getByText("-1,200 ₽")).toBeInTheDocument();
  });

  it("Шухрат in Қарздорлар: shows like a normal debtor; his repayment moves him back", async () => {
    render(<Finance />);
    await openTab("Қарздорлар");
    fireEvent.click(folder("Шухрат")!);

    expect(await screen.findByText("Абдуманнон (дал):")).toBeInTheDocument();
    expect(screen.getAllByText("+200 ₽").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Добавить платёж/ }));
    const type = screen.getByRole("combobox") as HTMLSelectElement;
    expect(type.selectedOptions[0].textContent).toBe("Клиент берди");
    fireEvent.change(screen.getByPlaceholderText("0"), { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: "Қўшиш" }));

    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].body).toMatchObject({
      amount: 200,
      type: "expense",
      category: "my_debt",
      description: "Шухрат: [qarzlarim]",
    });
    await waitFor(() =>
      expect(toastMock.info).toHaveBeenCalledWith("Шухрат → Қарзларим бўлимига ўтди")
    );
    fireEvent.click(screen.getByRole("button", { name: "Қарзларим" }));
    expect(folder("Шухрат")).toBeInTheDocument();
  });

  it("Шухрат: adding a debt lets you pick took / gave", async () => {
    render(<Finance />);
    await openTab("Қарздорлар");
    fireEvent.click(folder("Шухрат")!);
    fireEvent.click(await screen.findByRole("button", { name: /Добавить долг/ }));
    const kind = screen.getByRole("combobox") as HTMLSelectElement;
    expect(kind.value).toBe("gave");
    fireEvent.change(kind, { target: { value: "took" } });
    fireEvent.change(screen.getByPlaceholderText("0"), { target: { value: "300" } });
    fireEvent.click(screen.getByRole("button", { name: "Қўшиш" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].body).toMatchObject({ name: "Шухрат", amount: 300, admin_id: "qarzlarim" });
  });

  it("overpaid client Ali: repayment defaults to 'Абдуманнон берди' and brings him back", async () => {
    render(<Finance />);
    await openTab("Қарзларим");
    fireEvent.click(folder("Ali")!);
    expect(await screen.findByText("Абдуманнон (взял):")).toBeInTheDocument();
    expect(screen.getAllByText("-500 ₽").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Добавить платёж/ }));
    const type = screen.getByRole("combobox") as HTMLSelectElement;
    expect(type.selectedOptions[0].textContent).toBe("Абдуманнон берди");
    fireEvent.change(screen.getByPlaceholderText("0"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Қўшиш" }));

    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].body).toMatchObject({ amount: 500, type: "expense", category: "sales", description: "Ali:" });
    await waitFor(() =>
      expect(toastMock.info).toHaveBeenCalledWith("Ali → Қарздорлар бўлимига ўтди")
    );
  });

  it("overpaid client Ali: a new debt is a client debt", async () => {
    render(<Finance />);
    await openTab("Қарзларим");
    fireEvent.click(folder("Ali")!);
    fireEvent.click(await screen.findByRole("button", { name: /Добавить долг/ }));
    expect(screen.queryByRole("combobox")).toBeNull(); // no took/gave choice for a client
    fireEvent.change(screen.getByPlaceholderText("0"), { target: { value: "800" } });
    fireEvent.click(screen.getByRole("button", { name: "Қўшиш" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].body).toMatchObject({ name: "Ali", amount: 800, admin_id: "qarzdorlar" });
  });

  it("header + Қарз refuses to turn a paying client into a lender, allows a new name", async () => {
    render(<Finance />);
    await openTab("Қарзларим");
    fireEvent.click(screen.getByRole("button", { name: "+ Қарз" }));
    fireEvent.change(screen.getByPlaceholderText("Исм ёки ташкилот"), { target: { value: " ali " } });
    fireEvent.change(screen.getByPlaceholderText("0"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Қўшиш" }));
    expect(toastMock.error).toHaveBeenCalled();
    expect(posts).toHaveLength(0);

    fireEvent.change(screen.getByPlaceholderText("Исм ёки ташкилот"), { target: { value: "Yangi" } });
    fireEvent.click(screen.getByRole("button", { name: "Қўшиш" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].body).toMatchObject({ name: "Yangi", admin_id: "qarzlarim" });
  });

  it("normal lender Bank: payment from Абдуманнон is my_debt income, like before", async () => {
    render(<Finance />);
    await openTab("Қарзларим");
    fireEvent.click(folder("Bank")!);
    fireEvent.click(await screen.findByRole("button", { name: /Добавить платёж/ }));
    fireEvent.change(screen.getByPlaceholderText("0"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Қўшиш" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].body).toMatchObject({ type: "income", category: "my_debt", description: "Bank: [qarzlarim]" });
  });
});
