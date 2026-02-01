# Google Sheets Integration Setup Guide

## Step 1: Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "Property Leads" or any name you prefer
4. The script will automatically create a "Leads" sheet with headers

## Step 2: Open Apps Script Editor

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code in the editor
3. Copy the entire content from `google-apps-script/Code.gs`
4. Paste it into the Apps Script editor
5. Click the **Save** icon (💾) and name your project (e.g., "Property Leads API")

## Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Fill in the deployment settings:
   - **Description**: Property Leads API
   - **Execute as**: Me (your email)
   - **Who has access**: **Anyone** (Important!)
5. Click **Deploy**
6. **Authorize access**:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Your Project Name] (unsafe)**
   - Click **Allow**
7. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

## Step 4: Update Backend Configuration

1. Open your `.env` file
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with your copied URL:
   ```env
   GOOGLE_SHEETS_URL=https://script.google.com/macros/s/AKfycby.../exec
   ```
3. Save the file

## Step 5: Restart Your Server

```bash
npm start
```

## Step 6: Test the Integration

Submit a test lead:

```bash
curl -X POST http://localhost:5000/api/leads/submit \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "contactNumber": "1234567890",
    "propertyType": "Villa",
    "location": "Mumbai"
  }'
```

Check your Google Sheet - you should see the data appear automatically!

## Available Endpoints

- **POST** `/api/leads/submit` - Submit a new lead (saves to Google Sheets)
- **GET** `/api/leads` - Get all leads from Google Sheets

## Important Notes

- Data is saved directly to Google Sheets (no MongoDB)
- The "Leads" sheet will be created automatically on first submission
- Access your Google Sheet anytime to view/edit/download data
- All timestamps are in US format with AM/PM
- Headers are automatically formatted (bold, blue background)

## Troubleshooting

**If you get errors:**
1. Make sure the Web App is deployed with "Anyone" access
2. Verify the URL in `.env` is correct and ends with `/exec`
3. Check that you authorized the script to access your Google account
4. Check the Apps Script execution logs: **Executions** tab in Apps Script editor

**To redeploy after changes:**
1. Make changes to the Apps Script code
2. Click **Deploy** → **Manage deployments**
3. Click the pencil icon (edit)
4. Change version to "New version"
5. Click **Deploy**
