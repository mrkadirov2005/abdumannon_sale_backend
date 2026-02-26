interface Product{
    cost_price?: number;
    sell_price?: number;
    net_price?: number;
}
export const calculateProfit = (product: Product)=>{
  const sellPrice = Number(product.sell_price ?? 0);
  if (!sellPrice) return 0;
  const costPrice = Number(product.cost_price ?? 0);
  const netPrice = Number(product.net_price ?? 0);
  return sellPrice - (costPrice + netPrice);
}
