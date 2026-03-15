// export const DEFAULT_ENDPOINT="http://52.206.53.151:3000"
// export const DEFAULT_ENDPOINT="https://shoppos.m-kadirov.uz"
export const DEFAULT_ENDPOINT="https://unipos.m-kadirov.uz"

// const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

// const resolveDefaultEndpoint = (): string => {
//     const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

//     if (configuredBaseUrl) {
//         return trimTrailingSlash(configuredBaseUrl);
//     }

//     if (typeof window !== "undefined") {
//         return trimTrailingSlash(window.location.origin);
//     }

//     return "http://localhost:3000";
// };

// export const DEFAULT_ENDPOINT = resolveDefaultEndpoint();





export const ENDPOINTS={
    auth:{
        generate:{
            superuser:"/auth/generate/superuser",
            admin:"/auth/generate/admin"
        },
        login:{
            superuser:"/auth/login/superuser",
            admin:"/auth/login/admin"
        }
    },
    product:{
        get_shop_products:"/product/shop-products",
        update:"/product",
        restock:"/product/restock",
        delete_product:"/product",
        create:"/product"
    },
    categories:{
        getAllCategories:"/category",
        createCategory:"/category/create",
        updateCategory:"/category",
        deleteCategory:"/category"
    },
    brands:{
        getAllBrands:"/brand",
        createBrand:"/brand/create",
        updateBrand:"/brand",
        deleteBrand:"/brand"
    },
    statistics:{
        financeMain:"/statistics/finance/main",
        graphWeekly:"/statistics/graph-weekly",
        dayStats:"/statistics/day-stats",
        highStock:"/statistics/high-stock",
        lowStock:"/statistics/low-stock"
    },
    sales: {
        getSales:"/sales/all",
        createSale:"/sales/",
        getAdminSales:"/sales/admin/sales",
        updateSale:"/sales/update-sale",
        deleteSale:"/sales/delete",
        getSaleById:"/sales/get-sale"

    },
    admins:{
        get_all:"/admin/admins",
        update:"/admin",
        delete:"/admin",
        add:"/admin"
    },
    permissions:{
        all:"/permission/permissions"
    },
    reports:{
        get_all_reports:"/report/shop"
    },
    branches:{
        getShops:"/shop",
        getShopBranches:"/shop/branches",
        getById:"/shop/getbranch",
        create:"/shop/branch",
        update:"/shop/branch",
        delete:"/shop/branch"
    },
    logout:"/auth/logout",
    debts:{
        all:"/debts/all",
        byId:"/debts/by-id",
        byBranch:"/debts/by-branch",
        byCustomer:"/debts/by-customer",
        unreturned:"/debts/unreturned",
        create:"/debts/create",
        update:"/debts/update",
        mark_returned:"/debts/mark-returned",
        delete:"/debts/delete",
        statistics:"/debts/statistics"
    },
    backup:{
        backup:"/backup/backup",
        backupSql:"/backup/backup-sql",
        restore:"/backup/restore",
        restoreSql:"/backup/restore-sql",
        backuptoGoogleSheets:"/backup/backup-to-sheets",
        restoreFromSheets:"/backup/restore-from-sheets",
        manualBackupDrive:"/backup/manual-backup-drive",
    },
    shop:{
        update:"/shop/update_shop"
    },
    wagons:{
        getAll:"/wagons/all",
        getById:"/wagons/get-by-id",
        getByNumber:"/wagons/get-by-number",
        getByIndicator:"/wagons/by-indicator",
        getByShop:"/wagons/by-shop",
        create:"/wagons/create",
        update:"/wagons/update",
        delete:"/wagons/delete"
    }
   
}

