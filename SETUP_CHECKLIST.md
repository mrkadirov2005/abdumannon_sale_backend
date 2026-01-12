# 🚀 Quick Setup Checklist - Finance Module

## ✅ Complete Setup in 5 Minutes

### Phase 1: Google Sheets (1 min)
- [ ] Go to https://sheets.google.com
- [ ] Create new spreadsheet
- [ ] Copy Spreadsheet ID
- [ ] Save it somewhere (you'll need it)

### Phase 2: Google Apps Script (2 min)
- [ ] Open your Google Sheet
- [ ] Extensions → Apps Script
- [ ] Copy code from `GoogleAppsScript.gs`
- [ ] Replace `YOUR_SPREADSHEET_ID` with your ID
- [ ] Click Save
- [ ] Name project "Finance API"

### Phase 3: Deploy (1 min)
- [ ] Click Deploy button (top right)
- [ ] Click "New deployment"
- [ ] Type: Web app
- [ ] Execute as: Your Google account
- [ ] Who has access: Anyone
- [ ] Click Deploy
- [ ] Copy the deployment URL

### Phase 4: Configure App (1 min)
- [ ] Open `src/config/googleSheetsConfig.ts`
- [ ] Paste API_URL from deployment
- [ ] Paste SPREADSHEET_ID
- [ ] Save file
- [ ] Restart React app (`npm run dev`)

### Phase 5: Test (Optional)
- [ ] Click "💰 Moliya" in sidebar
- [ ] Should load without errors
- [ ] Add a test payment
- [ ] Check your Google Sheet
- [ ] Data should appear automatically ✅

## 📋 Your Values (Fill In As You Go)

```
Google Sheet Name: ____________________________

Spreadsheet ID: _________________________________

Deployment URL: __________________________________

Configuration Status:
  API_URL: [ ] Not yet [ ] Configured
  SPREADSHEET_ID: [ ] Not yet [ ] Configured
```

## 🔗 Direct Links (Save These)

```
Google Sheets: https://sheets.google.com

Your Google Sheet: [PASTE HERE AFTER CREATING]

Apps Script Editor: [WILL BE SHOWN AFTER OPENING SHEET]

Google Cloud Console: https://console.cloud.google.com
```

## ⚠️ Common Mistakes to Avoid

❌ Using Sheet name instead of Spreadsheet ID
✅ Use the ID from the URL (format: 1a2b3c4d...)

❌ Deploying without "Anyone" access
✅ Set "Who has access" to "Anyone"

❌ Forgetting to update configuration
✅ Update BOTH API_URL and SPREADSHEET_ID

❌ Not restarting React app after config change
✅ Always run `npm run dev` after editing config

## 🆘 If Something Goes Wrong

1. **"Error: API_URL not configured"**
   → Update googleSheetsConfig.ts with correct URL

2. **"Failed to fetch records"**
   → Check if deployment URL is correct
   → Verify "Who has access" is "Anyone"

3. **"Data not appearing in Google Sheet"**
   → Check Spreadsheet ID matches in Apps Script
   → Make sure sheet name is exactly "Finance"

4. **"CORS Error"**
   → This shouldn't happen
   → Verify API_URL is correct
   → Check browser console for actual error

## 📞 Need Help?

1. Check `GOOGLE_SHEETS_SETUP.md` for detailed steps
2. Check `FINANCE_MODULE_README.md` for features
3. Review browser console for error messages
4. Check Apps Script execution logs

## ✨ After Setup

You're ready to:
- ✅ Track finance for multiple people
- ✅ Record payments in real-time
- ✅ Access data from Google Sheets anytime
- ✅ Share spreadsheet with team
- ✅ View payment history
- ✅ Track remaining balances

Enjoy! 🎉
