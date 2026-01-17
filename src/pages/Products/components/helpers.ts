interface Product{
    cost_price?: number;
    sell_price?: number;
    net_price?: number;
}
export const calculateProfit = (product: Product)=>{
  if (!product.cost_price || !product.sell_price || !product.net_price) {
    return 0;
  }
  return Number(product.sell_price) - (Number(product.cost_price) + Number(product.net_price));
//   return 0;

}
