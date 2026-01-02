import type { Brand, Category } from "../../types/types";

export const convertIdToCategoryName=(id:string | null | number,categories:Category[])=>{
    for(let category in categories){
        if(categories[category].uuid==id || categories[category].id==id){
            return categories[category].category_name
        }
    }
}

export const convertIdToBrandName=(id:string | null | number,brands:Brand[])=>{
    console.log(id,brands)
    for(let brand in brands){
        if(brands[brand].uuid==id || brands[brand].id==id || brands[brand].uuid==String(id) ){
            return brands[brand].brand_name
        }
    }
}