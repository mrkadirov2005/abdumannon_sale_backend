# 💰 Finance Module with Google Sheets Integration

## Overview

The Finance module provides complete finance tracking with **automatic Google Sheets synchronization**. All your finance data is:
- ✅ Automatically saved to Google Sheets
- ✅ Synced in real-time
- ✅ Always backed up in the cloud
- ✅ Easily shareable with team members

## Features

### 📊 Dashboard
- **Total Debt**: Combined debt from all people
- **Total Paid**: Total payments received
- **Remaining Debt**: Outstanding amounts

### 👥 Person Finance Tracking
Each person shows:
1. **Total Amount** - Sum of all wagons
2. **Paid Amount** - Money already received
3. **Remaining Amount** - Still outstanding
4. **Progress Bar** - Visual payment status
5. **Recent Payments** - Last 3 transactions
6. **Wagons List** - All wagons given to this person

### 💳 Payment Management
- Add payments with optional descriptions
- View complete payment history
- Automatic remaining amount calculation
- Real-time Google Sheets sync

### 🔍 Search & Filter
- Search by person name
- Auto-sorted by remaining debt
- Filter by debt status

## Setup Instructions

### 1️⃣ Create Google Sheet
```
1. Go to https://sheets.google.com
2. Create new spreadsheet
3. Copy Spreadsheet ID from URL
4. Keep it handy for next step
```

### 2️⃣ Set Up Apps Script
```
1. Extensions > Apps Script
2. Copy GoogleAppsScript.gs code
3. Paste into Apps Script editor
4. Replace YOUR_SPREADSHEET_ID
5. Save project as "Finance API"
```

### 3️⃣ Deploy Web App
```
1. Click Deploy > New deployment
2. Type: Web app
3. Execute as: Your account
4. Who has access: Anyone
5. Copy deployment URL
```

### 4️⃣ Update Configuration
```
Edit: src/config/googleSheetsConfig.ts

GOOGLE_SHEETS_CONFIG = {
  API_URL: "paste_your_deployment_url_here",
  SPREADSHEET_ID: "paste_your_spreadsheet_id_here",
  SHEET_NAME: "Finance",
}
```

### 5️⃣ Restart App
```
npm run dev
```

## File Structure

```
src/
├── pages/
│   └── Finance/
│       └── Finance.tsx          # Main finance component
├── services/
│   └── googleSheetsService.ts   # Google Sheets API calls
├── config/
│   └── googleSheetsConfig.ts    # Configuration
└── components/
    └── layout/
        └── Sidebar.tsx          # Updated with Finance link

GoogleAppsScript.gs              # Apps Script code (deploy separately)
GOOGLE_SHEETS_SETUP.md          # Detailed setup guide
```

## API Functions

### Google Apps Script

```javascript
// Get all records
getFinanceRecords()

// Save/update record
saveFinanceRecord(record)

// Add payment
addPayment(personName, payment)

// Delete record
deleteFinanceRecord(personName)
```

### React Service

```typescript
// Fetch all records
googleSheetsService.getFinanceRecords()

// Save record
googleSheetsService.saveFinanceRecord(record)

// Add payment
googleSheetsService.addPayment(personName, payment)

// Delete record
googleSheetsService.deleteFinanceRecord(personName)
```

## Data Structure

### Finance Record
```typescript
{
  person_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payments: PaymentRecord[];
  wagons: Wagon[];
  indicator: "debt_taken" | "debt_given" | "none";
  created_at: string;
  updated_at: string;
}
```

### Payment Record
```typescript
{
  id: string;
  amount: number;
  description: string;
  paid_at: string;
}
```

## Google Sheet Columns

| Column | Description |
|--------|-------------|
| person_name | Name of the person |
| total_amount | Total debt amount |
| paid_amount | Total paid amount |
| remaining_amount | Outstanding amount |
| payments | JSON array of payments |
| wagons | JSON array of wagons |
| indicator | Debt type |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

## Usage Guide

### View Finance Dashboard
1. Click "💰 Moliya" in sidebar
2. See total debt and payments summary
3. Browse list of people by remaining debt

### Add Payment
1. Find person in list
2. Click "➕ To'lov" button
3. Enter payment amount
4. Add optional description
5. Click "Qo'shish"
6. ✅ Automatically saved to Google Sheets!

### View Details
1. Click "👁️ Ko'rish" button
2. See all wagons given to person
3. View complete payment history
4. Add additional payments

### Search
1. Use search box at top
2. Type person's name
3. Results filter in real-time

## Troubleshooting

### Data Not Saving
✓ Check API_URL in googleSheetsConfig.ts
✓ Verify Spreadsheet ID is correct
✓ Check browser console for errors
✓ Make sure Apps Script is deployed as "Anyone"

### Always Shows "Yuklanmoqda"
✓ Check that token is loaded
✓ Verify Google Sheets config
✓ Check network tab for failed requests

### Can't Find Google Sheet
✓ Apps Script Spreadsheet ID must match config
✓ Sheet name must be exactly "Finance"
✓ Check Apps Script error logs

### Permission Denied Error
✓ Make sure deployment is set to "Who has access: Anyone"
✓ Try redeploying the Apps Script
✓ Clear browser cache

## Best Practices

1. **Regular Backups**: Google Sheets acts as backup
2. **Descriptive Payments**: Add descriptions for tracking
3. **Regular Reconciliation**: Match sheets with actual records
4. **Share with Team**: You can share Google Sheet with team members
5. **Mobile Access**: Access from any device via Google Sheets

## Security Notes

- Apps Script is accessible to "Anyone" with the URL
- For production, add authentication to Apps Script
- Never share deployment URL publicly
- Google Sheets is encrypted in transit and at rest

## Future Enhancements

- [ ] Email notifications for payments
- [ ] Automatic reminders for outstanding debts
- [ ] PDF export functionality
- [ ] Advanced analytics and reports
- [ ] Multi-user access with permissions
- [ ] Webhook integration

## Support

For issues:
1. Check browser console for errors
2. Review Google Apps Script logs
3. Verify all configuration values
4. Check network requests in DevTools

## Additional Resources

- [Google Sheets API](https://developers.google.com/sheets)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Google Sheets Best Practices](https://support.google.com/docs/answer/10059342)
