import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import type { Product } from "../../../types/types";
import {
  accessTokenFromStore,
  getAuthFromStore,
  getBrandsFromStore,
  getCategoriesFromStore,
  getSingleProductFromStore,
  getBranchesFromStore,
} from "../../redux/selectors";
import type { AppDispatch } from "../../redux/store";
import { closeSingleProduct } from "../../redux/slices/products/productsreducer";
import { UpdateProductThunk } from "../../redux/slices/products/thunks/updateProductThunk";
import { createSingleProductThunk } from "../../redux/slices/products/thunks/createProduct";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Tooltip,
  Chip,
  Alert,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import { Close,Save } from "@mui/icons-material";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { Copy } from "lucide-react";

interface Props {
  type: "add" | "edit" | "idle";
}

interface FormErrors {
  [key: string]: string;
}

export default function UpdateProductForm({ type }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const product = useSelector(getSingleProductFromStore);
  const token = useSelector(accessTokenFromStore);
  const authData = useSelector(getAuthFromStore);
  const categories = useSelector(getCategoriesFromStore);
  const brands = useSelector(getBrandsFromStore);
  const branches = useSelector(getBranchesFromStore).branches;

  const [form, setForm] = useState<Product | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [originalForm, setOriginalForm] = useState<Product | null>(null);

  // =========================
  // INIT FORM
  // =========================
  useEffect(() => {
    if (type === "edit" && product) {
      const editForm = {
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
        shop_id: authData.user?.shop_id ?? "",
        is_active: product.is_active ?? false,
        branch: product.branch ?? (branches.length > 0 ? branches[0].id : ""),
      };
      setForm(editForm);
      setOriginalForm(JSON.parse(JSON.stringify(editForm)));
    }

    if (type === "add") {
      const addForm = {
        id: "",
        name: "",
        scale: 0,
        img_url: "",
        availability: 0,
        total: 0,
        receival_date: new Date().toISOString().slice(0, 16),
        expire_date: "",
        net_price: 0,
        sell_price: 0,
        supplier: "",
        cost_price: 0,
        last_restocked: new Date().toISOString().slice(0, 16),
        location: "",
        description: "",
        brand_id: "",
        category_id: "",
        shop_id: authData.user?.shop_id ?? "",
        is_active: true,
        is_expired: false,
        createdat: "",
        updatedat: "",
        branch: branches.length > 0 ? branches[0].id : 0,
      };
      setForm(addForm);
      setOriginalForm(null);
    }

    if (type === "idle") {
      setForm(null);
    }
  }, [type, product, authData.user?.shop_id, branches]);

  if (!form) return null;

  // =========================
  // VALIDATION
  // =========================
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name?.trim()) {
      newErrors.name = "Mahsulot nomi majburiy";
    }
    if (!form.category_id) {
      newErrors.category_id = "Kategoriya majburiy";
    }
    if (!form.brand_id) {
      newErrors.brand_id = "Brand majburiy";
    }
    if (form.sell_price <= 0) {
      newErrors.sell_price = "Sotish narxi 0 dan katta bo'lishi kerak";
    }
    if (form.net_price < 0) {
      newErrors.net_price = "Tozalangan narx manfiy bo'lishi mumkin emas";
    }
    if (form.net_price >= form.sell_price) {
      newErrors.net_price = "Tozalangan narx sotish narxidan kichik bo'lishi kerak";
    }
    if (form.availability < 0) {
      newErrors.availability = "Mavjudlik manfiy bo'lishi mumkin emas";
    }
    if (form.total < 0) {
      newErrors.total = "Jami manfiy bo'lishi mumkin emas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =========================
  // HANDLERS
  // =========================
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev!,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev!,
      [name]: value === "" ? null : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckbox = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev!,
      is_active: e.target.checked,
    }));
  };

  // =========================
  // AUTO CALCULATE PROFIT
  // =========================
  const profit = form.sell_price - form.net_price;
  const profitMargin =
    form.sell_price > 0
      ? ((profit / form.sell_price) * 100).toFixed(1)
      : 0;

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const payload: Product = {
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
      shop_id: form.shop_id || null,
      branch: form.branch,
    };

    try {
      if (type === "edit") {
        await dispatch(UpdateProductThunk({ product: payload, token })).unwrap();
      }

      if (type === "add") {
        await dispatch(createSingleProductThunk({ product: payload, token })).unwrap();
      }

      dispatch(closeSingleProduct());
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // DUPLICATE PRODUCT
  // =========================
  const handleDuplicate = () => {
    setForm((prev) => ({
      ...prev!,
      id: "",
      name: `${prev!.name} (Copy)`,
      createdat: "",
      updatedat: "",
    }));
  };

  // =========================
  // RESET FORM
  // =========================
  const handleReset = () => {
    if (originalForm) {
      setForm(JSON.parse(JSON.stringify(originalForm)));
    }
    setErrors({});
  };

  // =========================
  // DETECT CHANGES
  // =========================
  const hasChanges = originalForm
    ? JSON.stringify(form) !== JSON.stringify(originalForm)
    : true;

  // =========================
  // RENDER
  // =========================
  return (
    <Dialog
      open={type !== "idle"}
      onClose={() => dispatch(closeSingleProduct())}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      {isLoading && <LinearProgress />}

      {/* HEADER */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            type === "add"
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "white",
          fontWeight: "bold",
          fontSize: "1.5rem",
        }}
      >
        <div className="flex items-center gap-2">
          <Box
            sx={{
              background: "rgba(255,255,255,0.2)",
              padding: "8px",
              borderRadius: "8px",
            }}
          >
            {type === "add" ? "✨" : "✏️"}
          </Box>
          {type === "add" ? "Yangi mahsulot qo'shish" : "Mahsulotni tahrirlash"}
        </div>
        <button
          onClick={() => dispatch(closeSingleProduct())}
          className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
        >
          <Close />
        </button>
      </DialogTitle>

      {/* TABS */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          background: "#f9fafb",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, value) => setTabValue(value)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
            },
          }}
        >
          <Tab label="Asosiy ma'lumot" />
          <Tab label="Narxlar" />
          <Tab label="Ombor & Sanalar" />
          <Tab label="Qo'shimcha" />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        {/* ALERTS */}
        {type === "edit" && !form.is_active && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            icon={<FiAlertCircle />}
          >
            Bu mahsulot faol emas deb belgilangan
          </Alert>
        )}

        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Iltimos {Object.keys(errors).length} ta xatolarni tuzatib aring
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* TAB 0: BASIC INFO */}
          {tabValue === 0 && (
            <div className="space-y-4">
              <FormField
                label="Mahsulot nomi"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
                required
              />

              <FormField
                label="O'lchami/Birlik"
                name="scale"
                type="number"
                value={form.scale}
                onChange={handleChange}
              />

              <FormField
                label="Rasm URL"
                name="img_url"
                value={form.img_url as string}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />

              {form.img_url && (
                <div className="mt-2">
                  <img
                    src={form.img_url}
                    alt="Ko'rin"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}

              <SelectField
                label="Kategoriya"
                name="category_id"
                value={form.category_id ?? ""}
                onChange={handleSelectChange}
                options={categories.map((c) => ({
                  id: c.id,
                  name: c.category_name,
                }))}
                error={errors.category_id}
                required
              />

              <SelectField
                label="Brand"
                name="brand_id"
                value={form.brand_id ?? ""}
                onChange={handleSelectChange}
                options={brands.map((b) => ({
                  id: b.id,
                  name: b.brand_name,
                }))}
                error={errors.brand_id}
                required
              />
            </div>
          )}

          {/* TAB 1: PRICING */}
          {tabValue === 1 && (
            <div className="space-y-4">
              <FormField
                label="Xarajat narxi"
                name="cost_price"
                type="number"
                step="0.01"
                value={form.cost_price as unknown as number}
                onChange={handleChange}
              />

              <FormField
                label="Tozalangan narx (Optom)"
                name="net_price"
                type="number"
                step="0.01"
                value={form.net_price}
                onChange={handleChange}
                error={errors.net_price}
                required
              />

              <FormField
                label="Sotish narxi (Chakana)"
                name="sell_price"
                type="number"
                step="0.01"
                value={form.sell_price}
                onChange={handleChange}
                error={errors.sell_price}
                required
              />

              {/* PROFIT CALCULATOR */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-green-900 flex items-center gap-2">
                  <FiCheckCircle /> Foyda xisoboti
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-green-700 font-medium">
                      Birlik foydasi
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {profit.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-medium">
                      Foyda foizi
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {profitMargin}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STOCK & DATES */}
          {tabValue === 2 && (
            <div className="space-y-4">
              <FormField
                label="Hozirgi ombor"
                name="availability"
                type="number"
                value={form.availability}
                onChange={handleChange}
                error={errors.availability}
              />

              <FormField
                label="Jami miqdori"
                name="total"
                type="number"
                value={form.total}
                onChange={handleChange}
                error={errors.total}
              />

              {form.availability !== null && form.total !== null && (
                <Chip
                  label={`Ombor holati: ${form.availability}/${form.total} birlik`}
                  variant="outlined"
                  color={form.availability > 0 ? "success" : "error"}
                  sx={{ width: "100%", py: 3 }}
                />
              )}

              <FormField
                label="Qabul qilish sanasi"
                name="receival_date"
                type="datetime-local"
                value={form.receival_date as string}
                onChange={handleChange}
              />

              <FormField
                label="Muddati tugash sanasi"
                name="expire_date"
                type="datetime-local"
                value={form.expire_date as string}
                onChange={handleChange}
              />

              <FormField
                label="Oxirgi to'ldirish"
                name="last_restocked"
                type="datetime-local"
                value={form.last_restocked as string}
                onChange={handleChange}
              />
            </div>
          )}

          {/* TAB 3: ADDITIONAL */}
          {tabValue === 3 && (
            <div className="space-y-4">
              <FormField
                label="Taklif qiluvchi"
                name="supplier"
                value={form.supplier ?? ""}
                onChange={handleChange}
              />

              <FormField
                label="Joylashuvi/Sklad"
                name="location"
                value={form.location ?? ""}
                onChange={handleChange}
              />

              <SelectField
                label="Fili"
                name="branch"
                value={form.branch ?? ""}
                onChange={handleSelectChange}
                options={branches.map((b) => ({
                  id: b.id,
                  name: `${b.name} — ${b.location}`,
                }))}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ta'rif
                </label>
                <textarea
                  name="description"
                  value={form.description ?? ""}
                  onChange={handleChange}
                  placeholder="Mahsulot tafsilotlari, xususiyatlari, foydalanish ko'rsatmalari..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={handleCheckbox}
                  className="w-4 h-4 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-blue-900"
                >
                  Mahsulot faol
                </label>
              </div>

              {type === "edit" && (
                <div className="space-y-2 text-xs text-gray-500 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <p>
                    <strong>Yaratilgan:</strong>{" "}
                    {form.createdat
                      ? new Date(form.createdat).toLocaleString()
                      : "Yo'q"}
                  </p>
                  <p>
                    <strong>Yangilangan:</strong>{" "}
                    {form.updatedat
                      ? new Date(form.updatedat).toLocaleString()
                      : "Yo'q"}
                  </p>
                  <p>
                    <strong>ID:</strong> {form.id}
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      </DialogContent>

      {/* ACTIONS */}
      <DialogActions
        sx={{
          p: 2,
          background: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <div className="w-full flex items-center justify-between">
          <div className="flex gap-2">
            {type === "edit" && (
              <Tooltip title="Bu mahsulotni takrorlash">
                <Button
                  onClick={handleDuplicate}
                  startIcon={<Copy />}
                  variant="outlined"
                  size="small"
                >
                  Takrorlash
                </Button>
              </Tooltip>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              disabled={!hasChanges}
              variant="outlined"
              size="small"
            >
              Tozalash
            </Button>

            <Button
              onClick={() => dispatch(closeSingleProduct())}
              variant="outlined"
              size="small"
            >
              Bekor qilish
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !hasChanges}
              variant="contained"
              startIcon={<Save />}
              size="small"
            >
              {isLoading
                ? "Saqlanmoqda..."
                : type === "add"
                ? "Mahsulot yaratish"
                : "Mahsulotni yangilash"}
            </Button>
          </div>
        </div>
      </DialogActions>
    </Dialog>
  );
}

// =========================
// FORM FIELD COMPONENT
// =========================
interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormField = ({ label, error, ...props }: FormFieldProps) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {props.required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...props}
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
        error
          ? "border-red-300 focus:ring-red-500 bg-red-50"
          : "border-gray-300 focus:ring-blue-500"
      }`}
    />
    {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
  </div>
);

// =========================
// SELECT FIELD COMPONENT
// =========================
interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ id: string | number; name: string }>;
  error?: string;
}

const SelectField = ({ label, options, error, ...props }: SelectFieldProps) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {props.required && <span className="text-red-500">*</span>}
    </label>
    <select
      {...props}
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
        error
          ? "border-red-300 focus:ring-red-500 bg-red-50"
          : "border-gray-300 focus:ring-blue-500"
      }`}
    >
      <option value="">Tanlang {label.toLowerCase()}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
  </div>
);
