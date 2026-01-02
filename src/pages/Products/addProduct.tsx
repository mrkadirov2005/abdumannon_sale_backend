import React, { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { type Product } from "../../../types/types";
import { useDispatch, useSelector } from "react-redux";
import { 
  accessTokenFromStore, 
  getAuthFromStore, 
  getBranchesFromStore, 
  // getBrandsFromStore, 
  // getCategoriesFromStore, 
  getSingleProductFromStore 
} from "../../redux/selectors";
import { type AppDispatch } from "../../redux/store";
import { closeSingleProduct } from "../../redux/slices/products/productsreducer";
import { UpdateProductThunk } from "../../redux/slices/products/thunks/updateProductThunk";
import { createSingleProductThunk } from "../../redux/slices/products/thunks/createProduct";

export default function UpdateProductForm() {
  const dispatch = useDispatch<AppDispatch>();
  const product = useSelector(getSingleProductFromStore);
  const authData = useSelector(getAuthFromStore);
  const branches = useSelector(getBranchesFromStore).branches;  // Moved here for clarity
  const token = useSelector(accessTokenFromStore);

  // Form state (nullable Product)
  const [form, setForm] = useState<Product | null>(null);

  useEffect(() => {
    if (product) {
      setForm({
        ...product,
        img_url: product.img_url ?? "",
        receival_date: product.receival_date ?? "",
        expire_date: product.expire_date ?? "",
        supplier: product.supplier ?? "",
        cost_price: product.cost_price ?? 0,
        last_restocked: product.last_restocked ?? "",
        location: product.location ?? "",
        description: product.description ?? "",
        brand_id: product.brand_id ?? "",
        category_id: product.category_id ?? "",
        shop_id: authData.user?.shop_id ?? null,
        branch: product.branch ?? (branches.length > 0 ? branches[0].id : 0),  // Default branch if missing
      });
    }
  }, [product, authData.user?.shop_id, branches]);

  if (!form) return <div>Yuklanmoqda...</div>;

  // Handle input changes (including number fields)
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev!,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  // Checkbox for is_active
  const handleCheckbox = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev!, is_active: e.target.checked }));
  };

  // Submit handler
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!form) return;

    const updated: Product = {
      ...form,
      img_url: form.img_url || null,
      supplier: form.supplier || null,
      description: form.description || null,
      location: form.location || null,
      receival_date: form.receival_date || null,
      expire_date: form.expire_date || null,
      last_restocked: form.last_restocked || null,
      brand_id: form.brand_id || null,
      category_id: form.category_id || null,
      shop_id: authData.user?.shop_id || null,
      branch: form.branch ?? 0,  // Make sure branch is set
    };

    if (product) {
      dispatch(UpdateProductThunk({ product: updated, token }));
    } else {
      dispatch(createSingleProductThunk({ product: updated, token }));
    }

    dispatch(closeSingleProduct());
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <Input label="Nomi" name="name" value={form.name} onChange={handleChange} />

      <Input
        label="O'lchami"
        type="number"
        name="scale"
        value={form.scale}
        onChange={handleChange}
      />
      <Input
        label="Rasm URL"
        name="img_url"
        value={form.img_url ?? ""}
        onChange={handleChange}
      />

      <Input
        label="Mavjudlik"
        type="number"
        name="availability"
        value={form.availability}
        onChange={handleChange}
      />
      <Input label="Jami" type="number" name="total" value={form.total} onChange={handleChange} />

      <Input
        label="Qabul qilish sanasi"
        type="datetime-local"
        name="receival_date"
        value={form.receival_date ?? ""}
        onChange={handleChange}
      />
      <Input
        label="Muddati tugash sanasi"
        type="datetime-local"
        name="expire_date"
        value={form.expire_date ?? ""}
        onChange={handleChange}
      />

      <Input
        label="Tozalangan narx"
        type="number"
        step="0.01"
        name="net_price"
        value={form.net_price}
        onChange={handleChange}
      />
      <Input
        label="Sotish narxi"
        type="number"
        step="0.01"
        name="sell_price"
        value={form.sell_price}
        onChange={handleChange}
      />

      <Input label="Taklif qiluvchi" name="supplier" value={form.supplier ?? ""} onChange={handleChange} />
      <Input
        label="Xarajat narxi"
        type="number"
        step="0.01"
        name="cost_price"
        value={form.cost_price ?? 0}
        onChange={handleChange}
      />

      <Input
        label="Oxirgi to'ldirish"
        type="datetime-local"
        name="last_restocked"
        value={form.last_restocked ?? ""}
        onChange={handleChange}
      />

      <Input label="Joylashuvi" name="location" value={form.location ?? ""} onChange={handleChange} />
      <Input label="Brand ID" name="brand_id" value={form.brand_id ?? ""} onChange={handleChange} />
      <Input
        label="Kategoriya ID"
        name="category_id"
        value={form.category_id ?? ""}
        onChange={handleChange}
      />

      {/* Corrected branch selector */}
      <div style={styles.field}>
        <label>Fili</label>
        <select
          name="branch"
          value={form.branch ?? ""}
          onChange={handleChange}
          style={styles.input}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {`${branch.id} ${branch.name}  ${branch.location}`}
            </option>
          ))}
        </select>
      </div>

      {/* DESCRIPTION */}
      <div style={styles.field}>
        <label>Ta'rif</label>
        <textarea
          name="description"
          value={form.description ?? ""}
          onChange={handleChange}
          style={styles.textarea}
        />
      </div>

      {/* ACTIVE CHECKBOX */}
      <div style={styles.checkbox}>
        <label>Faol</label>
        <input type="checkbox" checked={form.is_active} onChange={handleCheckbox} />
      </div>

      <button type="submit" style={styles.button}>
        {product ? "Mahsulotni yangilash" : "Mahsulot yaratish"}
      </button>
    </form>
  );
}

// Reusable input component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input = ({ label, ...props }: InputProps) => (
  <div style={styles.field}>
    <label>{label}</label>
    <input {...props} style={styles.input} />
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  form: {
    maxWidth: "650px",
    margin: "20px auto",
    padding: "20px",
    background: "#fafafa",
    borderRadius: "10px",
  },
  field: {
    marginBottom: "15px",
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  textarea: {
    padding: "10px",
    height: "80px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  checkbox: {
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  button: {
    padding: "12px 20px",
    background: "black",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
