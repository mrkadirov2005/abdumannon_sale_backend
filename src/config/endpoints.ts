// export const DEFAULT_ENDPOINT="http://52.206.53.151:3000"
// export const DEFAULT_ENDPOINT="https://shoppos.m-kadirov.uz"
export const DEFAULT_ENDPOINT="http://localhost:3000"




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
        restore:"/backup/restore",
        backuptoGoogleSheets:"/backup/backup-to-sheets",
        restoreFromSheets:"/backup/restore-from-sheets",
    },
    shop:{
        update:"/shop/update_shop"
    }
   
}