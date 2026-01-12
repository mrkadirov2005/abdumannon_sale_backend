# 🚀 Finance Module - Quick Reference Card

## 📋 Setup Checklist (Copy & Paste URLs)

```
Step 1: Google Sheet URL
https://sheets.google.com

Step 2: Apps Script (from Sheet Extensions menu)
Extensions → Apps Script → [Paste GoogleAppsScript.gs]

Step 3: Your Spreadsheet ID
From URL: https://docs.google.com/spreadsheets/d/[THIS_ID]/edit

Step 4: Deployment URL
From Apps Script Deploy → [New Deployment] → Copy URL

Step 5: Update Configuration
File: src/config/googleSheetsConfig.ts
```

## 📝 Files to Copy/Paste

### 1. Google Apps Script Code
**From:** `GoogleAppsScript.gs` or `GoogleAppsScript_DOCUMENTED.gs`
**To:** Google Apps Script Editor
**Action:** Copy entire file, paste, replace SPREADSHEET_ID

### 2. Configuration Values
**From:** Google Sheet & Apps Script
**To:** `src/config/googleSheetsConfig.ts`
**Values needed:**
- SPREADSHEET_ID (from sheet URL)
- API_URL (from Apps Script deployment)

## 🔄 Data Flow

```
User Action → Finance.tsx → googleSheetsService.ts 
  ↓
  → Google Apps Script (doPost/doGet)
  ↓
  → Google Sheets (read/write)
  ↓
  → Response back to React
  ↓
  → UI updates + Auto-save
```

## 💾 What Gets Saved

When you add a payment:
```javascript
{
  person_name: "Ali Valiyev",
  total_amount: 500000,
  paid_amount: 200000,     // Updated after payment
  remaining_amount: 300000, // Auto-calculated
  payments: [              // Payment history
    {
      id: "1234567890",
      amount: 50000,
      description: "First payment",
      paid_at: "2024-01-12T10:00:00Z"
    }
  ],
  wagons: [...],           // Wagon data
  indicator: "debt_taken", // Type of debt
  created_at: "2024-01-12T09:00:00Z",
  updated_at: "2024-01-12T10:05:00Z"
}
```

## 🔑 Required Values

### Spreadsheet ID
- **Where to find:** Google Sheet URL
- **Format:** `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`
- **Example URL:** `https://docs.google.com/spreadsheets/d/1a2b3c.../edit`

### Deployment URL
- **Where to find:** Apps Script Deploy button
- **Format:** `https://script.google.com/macros/d/ABC123/userweb`
- **Get it:** Click Deploy → New deployment → Copy link

## ⚡ Quick Commands

### Start App
```bash
cd my-react-app
npm run dev
```

### View in Browser
```
http://localhost:5173/finance
```

### Access Google Sheet
- Open your Google Sheet in another tab
- Data will update in real-time

## 🧪 Quick Test

1. Open Finance page (http://localhost:5173/finance)
2. Find a person in the list
3. Click "➕ To'lov" button
4. Enter amount (e.g., 50000)
5. Click "Qo'shish"
6. Open your Google Sheet
7. Check if payment appears ✅

## 📱 Navigation

**In Your App:**
- Sidebar → "💰 Moliya" → Finance Page

**Menu Options:**
- View Details: Click "👁️ Ko'rish"
- Add Payment: Click "➕ To'lov"
- Search: Use search box at top
- Refresh: Click "🔄 Yangilash"

## 📊 Google Sheet Structure

```
A              | B            | C           | D                | E         | F      | G         | H          | I
person_name    | total_amount | paid_amount | remaining_amount | payments  | wagons | indicator | created_at | updated_at
Ali Valiyev    | 500000       | 200000      | 300000           | [JSON]    | [JSON] | debt_taken| 2024-01-12 | 2024-01-12
Vali Aliyev    | 750000       | 0           | 750000           | []        | [JSON] | debt_given| 2024-01-12 | 2024-01-12
```

## 🔐 Keep Secure

- ⚠️ Don't share deployment URL publicly
- ⚠️ Don't commit config to public repo
- ✅ Use environment variables in production
- ✅ Implement authentication for sensitive data

## 🐛 Common Issues

| Issue | Quick Fix |
|-------|-----------|
| "Yuklanmoqda" forever | Check API_URL format |
| Data not saving | Verify Spreadsheet ID matches Apps Script |
| Page won't load | Check browser console for errors |
| 404 error | Redeploy Google Apps Script |
| Can't find data | Open Google Sheet to verify |

## 📞 Error Messages & Solutions

**"API_URL not configured"**
→ Update `src/config/googleSheetsConfig.ts`

**"Failed to fetch records"**
→ Check API_URL is correct and deployment is active

**"Sheet not found"**
→ Verify Spreadsheet ID matches between config and Apps Script

**"Invalid action"**
→ Check you're sending correct action parameter in API call

## 💡 Pro Tips

1. **Backup:** Google Sheets acts as automatic backup
2. **Share:** Share Google Sheet with team members
3. **Access:** Access from phone using Google Sheets app
4. **Export:** Export to Excel anytime from Google Sheets
5. **History:** All payments stay in history for reference

## 🎯 What Works Now

✅ View all people with debt
✅ See total, paid, and remaining amounts
✅ Add payments with descriptions
✅ View complete payment history
✅ Search by person name
✅ Progress visualization
✅ Real-time Google Sheets sync
✅ Cloud backup
✅ Mobile access via Google Sheets

## 🚀 Getting Started Now

1. **Create Sheet** → 1 min
2. **Deploy Apps Script** → 2 min
3. **Update Config** → 1 min
4. **Restart App** → 1 min
5. **Start Using** → Now! 🎉

**Total Time: ~5 minutes**

---

**Questions?** Check these files:
- `SETUP_CHECKLIST.md` - Step by step
- `GOOGLE_SHEETS_SETUP.md` - Detailed guide
- `FINANCE_MODULE_README.md` - Features
- `IMPLEMENTATION_SUMMARY.md` - Technical details
