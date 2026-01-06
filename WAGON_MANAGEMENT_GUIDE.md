# 🚛 Vagonlar Boshqaruvi - Wagon Management System

## 📋 Overview
A complete, responsive wagon management UI built with React, TypeScript, and Tailwind CSS. Fully integrated with your backend API for CRUD operations on wagons and their products.

---

## ✨ Features

### 🎯 Core Functionality
- ✅ **Create Wagons** - Add new wagons with multiple products
- ✅ **View Wagons** - List all wagons with detailed information
- ✅ **Update Wagons** - Edit wagon details and products
- ✅ **Delete Wagons** - Remove wagons with confirmation
- ✅ **Search & Filter** - Find wagons by number and indicator type
- ✅ **Sort Data** - Sort by date, wagon number, or total amount
- ✅ **Print Functionality** - Generate printable wagon receipts

### 📊 Statistics Dashboard
- **Total Wagons** - Count and total amount of all wagons
- **Debt Taken** (Olingan Qarz) - Wagons with received debt
- **Debt Given** (Berilgan Qarz) - Wagons with given debt
- **No Debt** (Qarzisiz) - Regular wagons without debt indicators

### 📱 Responsive Design
- **Mobile First** - Optimized card layout for phones (< 768px)
- **iPad Ready** - Enhanced tablet experience (768px - 1024px)
- **Desktop** - Full table view with all features (> 1280px)

### 🎨 UI/UX Features
- Gradient color schemes for visual appeal
- Toast notifications for user feedback
- Modal dialogs for create/edit/view operations
- Loading states and error handling
- Smooth transitions and hover effects
- Icon-based navigation (Lucide React)

---

## 🗂️ File Structure

```
src/
├── pages/
│   └── wagons/
│       └── wagon.tsx          # Main wagon management component
└── config/
    └── endpoints.ts           # Updated with wagon endpoints
```

---

## 🔌 API Endpoints

### Base Configuration
Update `DEFAULT_ENDPOINT` in `src/config/endpoints.ts`:
```typescript
export const DEFAULT_ENDPOINT = "http://localhost:3000"
```

### Available Endpoints
```typescript
wagons: {
  getAll: "/wagons",                          // GET all wagons
  getById: "/wagons/by-id",                   // POST get by ID
  getByNumber: "/wagons/by-number",           // POST get by number
  getByIndicator: "/wagons/by-indicator",     // POST filter by indicator
  getByShop: "/wagons/by-shop",               // POST filter by shop
  create: "/wagons/create",                   // POST create wagon
  update: "/wagons/update",                   // PUT update wagon
  delete: "/wagons/delete"                    // DELETE remove wagon
}
```

---

## 🚀 Usage Guide

### 1. Navigation
Add to your routing configuration:
```typescript
import WagonsPage from './pages/wagons/wagon';

// In your routes
<Route path="/wagons" element={<WagonsPage />} />
```

### 2. Creating a Wagon

**Steps:**
1. Click **"Yangi Vagon"** (New Wagon) button
2. Fill in wagon details:
   - **Vagon Raqami** (Wagon Number) - Required, e.g., "VGN-12345"
   - **Indikator** (Indicator) - Choose: Yo'q, Olingan Qarz, or Berilgan Qarz
3. Add products:
   - Product ID
   - Product Name
   - Amount (quantity)
   - Price
4. Click **"Mahsulot Qo'shish"** to add more products
5. Click **"Yaratish"** to save

**Form Validation:**
- Wagon number is required
- At least one complete product row is required
- Each product must have ID, name, amount, and price
- Total is calculated automatically

### 3. Viewing Wagons

**Table View (Desktop):**
- Shows: Date, Wagon Number, Indicator, Products Count, Total Amount, Actions
- Sortable columns (click headers)
- Hover effects for better UX

**Card View (Mobile/Tablet):**
- Compact card layout
- All essential information visible
- Touch-optimized action buttons

### 4. Filtering & Search

**Search:**
- Type wagon number in search box
- Real-time filtering

**Indicator Filter:**
- All indicators
- Olingan Qarz (debt_taken)
- Berilgan Qarz (debt_given)
- Yo'q (none)

**Clear Filters:**
- Click "Tozalash" button to reset

### 5. Editing a Wagon

**Steps:**
1. Click edit icon (✏️) on any wagon
2. Modal opens with current data pre-filled
3. Modify fields as needed
4. Add/remove product rows
5. Click **"Saqlash"** to update

### 6. Deleting a Wagon

**Steps:**
1. Click delete icon (🗑️) on any wagon
2. Confirm deletion in popup
3. Wagon is permanently removed

### 7. Viewing Details

**Steps:**
1. Click eye icon (👁️) on any wagon
2. Modal shows:
   - Basic information cards
   - Complete products table
   - Action buttons (Print, Edit, Close)

### 8. Printing

**Methods:**
1. From table/cards - Click print icon (🖨️)
2. From detail modal - Click "Chop Etish" button

**Print Format:**
- Wagon number and date
- Indicator type
- Complete products table
- Grand total
- Print button in preview

---

## 🎨 Design System

### Color Palette
- **Blue** - Primary actions, wagon count
- **Red** - Debt taken, delete actions
- **Green** - Debt given, success states
- **Purple** - No debt, print actions
- **Orange** - Edit actions
- **Gray** - Neutral elements

### Responsive Breakpoints
```css
sm:  640px   /* Small devices */
md:  768px   /* Tablets */
lg:  1024px  /* Small laptops */
xl:  1280px  /* Desktop */
```

### Component Sizes
- **Mobile**: Full width cards, stacked elements
- **Tablet**: 2-column grids, larger touch targets
- **Desktop**: Multi-column tables, compact layouts

---

## 📦 Data Structure

### Wagon Object
```typescript
interface Wagon {
  id: string;                    // UUID
  wagon_number: string;          // Unique wagon identifier
  products: Product[];           // Array of products
  total: number;                 // Calculated total amount
  indicator: "debt_taken" | "debt_given" | "none";
  shop_id: string | null;        // Optional shop reference
  branch: number | null;         // Optional branch number
  created_by: string | null;     // User UUID
  created_at: string;            // ISO date string
}
```

### Product Object
```typescript
interface Product {
  product_id: string;            // Product identifier
  product_name: string;          // Product name
  amount: number;                // Quantity
  price: number;                 // Unit price
  subtotal: number;              // Calculated (amount * price)
}
```

### Statistics Object
```typescript
interface Statistics {
  total_wagons: number;          // Total count
  debt_taken_count: number;      // Count with debt_taken
  debt_given_count: number;      // Count with debt_given
  none_count: number;            // Count with no debt
  total_amount: number;          // Sum of all totals
  debt_taken_amount: number;     // Sum of debt_taken totals
  debt_given_amount: number;     // Sum of debt_given totals
}
```

---

## 🔐 Authentication

### Required Headers
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,    // From localStorage
  'uuid': user_uuid                      // From localStorage
}
```

### Token Storage
```typescript
// Get token
const token = localStorage.getItem('token');
const uuid = localStorage.getItem('uuid');

// Set token (usually in login)
localStorage.setItem('token', 'your-jwt-token');
localStorage.setItem('uuid', 'user-uuid');
```

---

## 🛠️ Customization

### Change Endpoint
```typescript
// In wagon.tsx, update all fetch calls:
const response = await fetch(`${DEFAULT_ENDPOINT}/wagons`, {
  // ...
});
```

### Modify Colors
Update Tailwind classes in component:
```typescript
// Example: Change primary color from blue to indigo
className="bg-blue-600" → className="bg-indigo-600"
```

### Add Fields
1. Update `Wagon` interface
2. Add form field in create/edit modals
3. Update formData state
4. Include in API request body

### Change Language
Replace all Uzbek text:
```typescript
// Example:
"Yangi Vagon" → "New Wagon"
"Vagon Raqami" → "Wagon Number"
```

---

## 🐛 Troubleshooting

### Wagons Not Loading
**Check:**
1. Network tab in browser DevTools
2. Console for errors
3. Backend server is running
4. Correct endpoint URL
5. Valid authentication token

### Create/Update Failing
**Verify:**
1. All required fields filled
2. At least one product added
3. Product fields not empty
4. Token not expired
5. Backend validation rules

### Print Not Working
**Solutions:**
1. Allow popups in browser
2. Check print permissions
3. Try different browser
4. Verify popup blocker settings

### Responsive Issues
**Fix:**
1. Clear browser cache
2. Check Tailwind CSS loaded
3. Verify breakpoint classes
4. Test in incognito mode

---

## 📈 Performance Tips

1. **Pagination** - Add for large datasets (100+ wagons)
2. **Lazy Loading** - Load products on demand
3. **Debounce Search** - Delay search by 300ms
4. **Memoization** - Use React.memo for card components
5. **Virtual Scrolling** - For extremely long lists

---

## 🔜 Future Enhancements

- [ ] Export to Excel/CSV
- [ ] Advanced filters (date range, amount range)
- [ ] Bulk operations (delete, update indicator)
- [ ] Product autocomplete from inventory
- [ ] QR code generation for wagons
- [ ] Photo attachment support
- [ ] Activity history/audit log
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Offline support with sync

---

## 📞 Support

For issues or questions:
1. Check console logs for errors
2. Verify backend API responses
3. Review network requests
4. Check authentication status
5. Validate data formats

---

## 📄 License

This component is part of your POS system project.

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Author:** AI Assistant  
**Framework:** React 18+ with TypeScript
