# Google Sheets Finance Integration - Setup Guide

## 📋 Step-by-Step Setup

### Step 1: Create a Google Sheet

1. Go to https://sheets.google.com
2. Click "Create" → "Blank spreadsheet"
3. Name it "Finance Management" (or any name you prefer)
4. Copy the Spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
   - Copy the ID between `/d/` and `/edit`

### Step 2: Set Up Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. A new tab will open with the Apps Script editor
3. Delete any existing code
4. Copy all the code from `GoogleAppsScript.gs` file in this project
5. Replace `YOUR_SPREADSHEET_ID` with your actual Spreadsheet ID (from Step 1)
6. Click **Save** and name the project "Finance API"

### Step 3: Deploy as Web App

1. In Apps Script, click **Deploy** button (top right)
2. Click **New deployment** (if you see this option)
3. Select **Type** → **Web app**
4. Fill in:
   - **Execute as**: Your Google Account
   - **Who has access**: "Anyone"
5. Click **Deploy**
6. You'll see a "New deployment created" message
7. **Copy the deployment URL** - it looks like:
   ```
   https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/userweb
   ```

### Step 4: Configure React App

1. Open `src/config/googleSheetsConfig.ts`
2. Replace `YOUR_DEPLOYMENT_ID` with your actual deployment URL from Step 3
3. Replace `YOUR_SPREADSHEET_ID` with your Sheet ID from Step 1

Example:
```typescript
export const GOOGLE_SHEETS_CONFIG = {
  API_URL: "https://script.google.com/macros/d/1A2B3C4D5E6F7G8H9/userweb",
  SPREADSHEET_ID: "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
  SHEET_NAME: "Finance",
};
```

## ✅ Verification

1. Open your React app and navigate to the Finance page
2. Add a person's finance record
3. Go back to your Google Sheet
4. You should see the data appear in the sheet automatically!

## 📝 Sheet Structure

The Google Sheet will have these columns:
- **person_name** - Name of the person
- **total_amount** - Total amount owed
- **paid_amount** - Total amount already paid
- **remaining_amount** - Amount still owed
- **payments** - JSON array of payment history
- **wagons** - JSON array of wagon data
- **indicator** - Type (debt_taken, debt_given, none)
- **created_at** - When record was created
- **updated_at** - When record was last updated

## 🔄 How It Works

1. **Fetch Data**: When you open Finance page, it first tries to load from Google Sheets
2. **Fallback**: If no data in sheets, it fetches from wagons API and saves to sheets
3. **Auto-Save**: Every time you add a payment, it automatically saves to Google Sheets
4. **Real-time Sync**: Data is always in sync between the app and Google Sheets

## 🚨 Troubleshooting

### "API URL not configured" error
- Make sure you've updated `googleSheetsConfig.ts` with the correct URLs

### "Failed to fetch records" error
- Check that your Apps Script deployment URL is correct
- Make sure "Who has access" is set to "Anyone"
- Check browser console for more details

### Data not appearing in Google Sheet
- Verify the Spreadsheet ID in the Apps Script is correct
- Make sure the sheet name is "Finance" (case-sensitive)
- Check that the deployment is working (test in a web browser)

### CORS Error
- This shouldn't happen as Google Apps Script handles CORS
- If you see this, verify the API_URL is correct

## 📊 Google Sheets Structure Example

```
| person_name | total_amount | paid_amount | remaining_amount | payments | wagons | indicator | created_at | updated_at |
|-------------|-------------|-----------|------------------|----------|--------|-----------|-----------|-----------|
| Ali Valiyev | 500000 | 200000 | 300000 | [...] | [...] | debt_taken | 2024-01-12T10:00:00Z | 2024-01-12T10:05:00Z |
```

## 🔐 Security Note

- The Apps Script is deployed as "Anyone", which means anyone with the URL can access it
- For production, consider implementing authentication
- You can add validation in the Apps Script to prevent unauthorized access

## 💡 Advanced Options

If you want to use Google Sheets API instead:
1. Create OAuth credentials in Google Cloud Console
2. Use the `@react-oauth/google` library
3. This gives you more control but requires more setup

For now, the Apps Script method is simpler and recommended!
