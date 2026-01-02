/* =========================================================
   ADMIN
========================================================= */
export interface Admin {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  isloggedin: boolean;
  work_start: string | null;
  work_end: string | null;
  salary: number;
  sales: number;
  ispaidthismonth: boolean;
  expenses: number;
  bonuses: number;
  permissions: string[];
  img_url: string | null;
  createdat: string;
  updatedat: string;
  shop_id: string | null;
  uuid: string | null;
  refreshtoken: string | null;
  accesstoken: string | null;
  branch:number
}
export interface Report{
  day: number;
    id: number;
    log: string;
    month: number;
    shop_id: string;
    target_id: string;
    year: number,

}
export const exampleReport: Report = {
  day: 1,
  id: 1,
  log: "Sample report log",
  month: 1,
  shop_id: "SHOP001",
  target_id: "TARGET001",
  year: 2024

};
exampleReport

export const exampleAdmin: Admin = {
  id: 1,
  first_name: "John",
  last_name: "Doe",
  phone_number: "998900001122",
  password: "hashedpw",
  isloggedin: false,
  work_start: null,
  work_end: null,
  salary: 0,
  sales: 0,
  ispaidthismonth: false,
  expenses: 0,
  bonuses: 0,
  permissions: [],
  img_url: null,
  createdat: new Date().toISOString(),
  updatedat: new Date().toISOString(),
  shop_id: null,
  uuid: null,
  refreshtoken: null,
  accesstoken: null,
  branch:1
};


/* =========================================================
   BRANCHES
========================================================= */
export interface Branch {
  id: number;
  name: string | null;
  location: string | null;
  employees: number | null;
  shop_id: string | null;
}

export const exampleBranch: Branch = {
  id: 1,
  name: "A",
  location: "B",
  employees: 10,
  shop_id: null
};


/* =========================================================
   BRAND
========================================================= */
export interface Brand {
  id: number;
  brand_name: string;
  provider_name: string;
  provider_last_name: string;
  provider_phone: string;
  provider_card_number: string;
  provider_email: string ;
  product_counts: number;
  createdat: string;
  updatedat: string;
  uuid: string | null;
}

export const exampleBrand: Brand = {
  id: 1,
  brand_name: "CocaCola",
  provider_name: "John",
  provider_last_name: "Smith",
  provider_phone: "998900000000",
  provider_card_number: "123456789",
  provider_email: "",
  product_counts: 0,
  createdat: new Date().toISOString(),
  updatedat: new Date().toISOString(),
  uuid: null
};


/* =========================================================
   CATEGORY
========================================================= */
export interface Category {
  id: number;
  category_name: string;
  products_available: number;
  createdat: string;
  updatedat: string;
  uuid: string | null;
}

export const exampleCategory: Category = {
  id: 1,
  category_name: "Beverages",
  products_available: 0,
  createdat: new Date().toISOString(),
  updatedat: new Date().toISOString(),
  uuid: null
};


/* =========================================================
   PERMISSION
========================================================= */
export interface Permission {
  id: number;
  name: string;
  description: string | null;
  createdat: string;
  updatedat: string;
}

export const examplePermission: Permission = {
  id: 1,
  name: "read",
  description: "Allows reading data",
  createdat: new Date().toISOString(),
  updatedat: new Date().toISOString()
};


/* =========================================================
   PRODUCT
========================================================= */
export interface Product {
  id: string; // uuid
  name: string;
  scale: number;
  img_url: string | null;
  availability: number;
  total: number;
  receival_date: string | null;
  expire_date: string | null;
  is_expired: boolean;
  net_price: number;
  sell_price: number;
  supplier: string | null;
  cost_price: number | null;
  last_restocked: string | null;
  location: string | null;
  description: string | null;
  is_active: boolean;
  createdat: string;
  updatedat: string;
  brand_id: string | null;
  category_id: string | null;
  shop_id: string | null;
  branch:number
}

export const exampleProduct: Product = {
  id: "uuid-sample",
  name: "Pepsi",
  scale: 1,
  img_url: null,
  availability: 10,
  total: 10,
  receival_date: null,
  expire_date: null,
  is_expired: false,
  net_price: 5000,
  sell_price: 7000,
  supplier: null,
  cost_price: null,
  last_restocked: null,
  location: null,
  description: null,
  is_active: true,
  createdat: new Date().toISOString(),
  updatedat: new Date().toISOString(),
  brand_id: null,
  category_id: null,
  shop_id: null,
  branch:0
};


/* =========================================================
   SALES
========================================================= */
export interface Sale {
  id: number;
  sale_id: string;
  admin_number: string;
  admin_name: string;
  total_price: number;
  total_net_price: number;
  profit: number;
  sale_time: string | null;
  sale_day: number | null;
  sales_month: number | null;
  sales_year: number | null;
  createdat: string;
  updatedat: string;
  branch: number | null;
  shop_id: string | null;
  payment_method?: string;
}

export const exampleSale: Sale = {
  id: 1,
  sale_id: "SALE001",
  admin_number: "AD01",
  admin_name: "John Doe",
  total_price: 100000,
  total_net_price: 80000,
  profit: 20000,
  sale_time: null,
  sale_day: null,
  sales_month: null,
  sales_year: null,
  createdat: new Date().toISOString(),
  updatedat: new Date().toISOString(),
  branch: null,
  shop_id: null
};


/* =========================================================
   SHOP NAME
========================================================= */
export interface ShopName {
  id: string;
  name: string | null;
  superadmin: string | null;
  location: string | null;
}

export const exampleShopName: ShopName = {
  id: "SHOP001",
  name: "Main Shop",
  superadmin: "John",
  location: "City Center"
};


/* =========================================================
   SOLD PRODUCT
========================================================= */
export interface SoldProduct {
  id: number;
  product_name: string;
  amount: number;
  net_price: number;
  sell_price: number;
  shop_id: string | null;
  productid: string | null;
  salesid: string | null;
}

export const exampleSoldProduct: SoldProduct = {
  id: 1,
  product_name: "Pepsi",
  amount: 2,
  net_price: 5000,
  sell_price: 7000,
  shop_id: null,
  productid: null,
  salesid: null
};


/* =========================================================
   SUPERUSER
========================================================= */
export interface SuperUser {
  id: number;
  uuid: string;
  name: string;
  lastname: string;
  email: string;
  phonenumber: string;
  isloggedin: boolean;
  password: string;
  refreshtoken: string | null;
  accesstoken: string | null;
  shopname: string | null;
  img_url: string | null;
  createdat: string;
  updatedat: string;
  shop_id: string | null;
}

export const exampleSuperUser: SuperUser = {
  id: 1,
  uuid: "uuid-sample",
  name: "Admin",
  lastname: "Super",
  email: "admin@example.com",
  phonenumber: "998900000001",
  isloggedin: false,
  password: "hashedpw",
  refreshtoken: null,
  accesstoken: null,
  shopname: null,
  img_url: null,
  createdat: new Date().toISOString(),
  updatedat: new Date().toISOString(),
  shop_id: null
};


/* =========================================================
   WEEKSTATS
========================================================= */
export interface WeekStats {
  id: number;
  month: string;
  net_sales: number;
  net_profit: number;
  createdat: string;
  updatedat: string;
  week_end: number | null;
  week_start: number | null;
}

export const exampleWeekStats: WeekStats = {
  id: 1,
  month: "January",
  net_sales: 0,
  net_profit: 0,
  createdat: new Date().toISOString(),
  updatedat: new Date().toISOString(),
  week_end: null,
  week_start: null
};

// BRANCH TYPES

interface BRANCHES{
  location:string,
  employees:number,
  shop_id:string,
  id:number,
  name:string
}
const exampleBranchData:BRANCHES={
  location:"Main Street",
  employees:15,
  shop_id:"shop-uuid",
  id:1,
  name:"Branch A"
} 
exampleBranchData
