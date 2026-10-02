export interface ProductEntry {
  id: string;
  name: string;
  quantity: number;
  price: number;
  totalPaid: number;
  unit: string;
}


export const UNIT_OPTIONS = [
  { value: "pcs", label: "Dona" },
  { value: "kg", label: "Kg" },
  { value: "t", label: "Tonna" },
  { value: "l", label: "Litr" },
];

export const formatUnitLabel = (unit: string | undefined | null) => {
  const normalized = unit || "pcs";
  const found = UNIT_OPTIONS.find((opt) => opt.value === normalized);
  return found ? found.label : normalized;
};

export const normalizeProductNames = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string" && v.trim() !== "");
  }
  if (typeof value === "string") {
    if (value.trim() === "") return [];
    return value
      .split("|")
      .map((v) => v.trim())
      .filter((v) => v !== "");
  }
  return [];
};

const parseTrailingQuantity = (rawName: string) => {
  const match = rawName.match(/^(.*?)(?:\s+)(\d+(?:[.,]\d+)?)$/);
  if (!match) return null;
  const baseName = match[1].trim();
  const quantity = parseFloat(match[2].replace(",", "."));
  if (!baseName || !Number.isFinite(quantity)) return null;
  return { baseName, quantity };
};

export const parseProductsFromString = (productString: string | string[] | undefined | null): ProductEntry[] => {
  if (!productString) return [];

  try {
    const items = normalizeProductNames(productString);
    if (items.length === 0) return [];

    return items.map((item, index) => {
      const parts = item.split("*");
      let name = parts[0] || "";
      let quantity = parseFloat(parts[1] || "") || 1;
      let price = parseFloat(parts[2] || "") || 0;
      let totalPaid = parseFloat(parts[3] || "") || 0;
      let unit = parts[4] || "pcs";

      if (parts.length === 2) {
        const priceFromPart = parseFloat(parts[1] || "") || 0;
        const fromName = parseTrailingQuantity(name);
        if (fromName) {
          name = fromName.baseName;
          quantity = fromName.quantity;
          price = priceFromPart;
        } else {
          quantity = parseFloat(parts[1] || "") || 1;
          price = 0;
        }
        totalPaid = 0;
      }

      if (parts.length === 3) {
        const fromName = parseTrailingQuantity(name);
        const maybePrice = parseFloat(parts[1] || "") || 0;
        const maybeTotal = parseFloat(parts[2] || "") || 0;
        if (
          fromName &&
          Number.isFinite(maybePrice) &&
          Number.isFinite(maybeTotal) &&
          Math.abs(fromName.quantity * maybePrice - maybeTotal) < 0.01
        ) {
          name = fromName.baseName;
          quantity = fromName.quantity;
          price = maybePrice;
          totalPaid = maybeTotal;
        }
      }

      return {
        id: `${index}-${Date.now()}`,
        name,
        quantity,
        price,
        totalPaid,
        unit,
      };
    });
  } catch (error) {
    console.error("Error parsing products:", error);
    return [];
  }
};
