export interface Product {
    id: number;
    name: string;
    price: number;
    sku?: string;
    tags?: string[];
    stock?: number;
    reorderLevel?: number;
    brand?: string;
    supplier?: string;
}

export const products: Product[] = [
    { id: 1, name: "Chocolate", price: 29.99, sku: "CHOC-001", stock: 12, reorderLevel: 5, brand: "SweetCo", tags: ["sweet", "snack"] },
    { id: 2, name: "Pasta", price: 49.99, sku: "PAST-001", stock: 30, reorderLevel: 10, brand: "PastaHouse", tags: ["grocery"] },
    { id: 3, name: "Coffee", price: 19.99, sku: "COF-001", stock: 20, reorderLevel: 8, brand: "BrewCorp", tags: ["beverage"] },
];