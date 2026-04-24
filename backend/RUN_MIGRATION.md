# Fix Payment Proof URLs Migration

## Problem
Existing payment proof screenshots in the database have incorrect URLs (`/uploads/proof-xxx.png`) that don't match where the files are actually stored (`/uploads/proofs/proof-xxx.png`).

## Solution
Run the migration script to update all existing database records.

## Steps

1. Make sure your backend server is stopped (to avoid conflicts)

2. Navigate to the backend directory:
```bash
cd backend
```

3. Run the migration script:
```bash
node fix-payment-proof-urls.js
```

4. The script will:
   - Connect to your MongoDB database
   - Find all Payment records with incorrect proof URLs
   - Find all Enrollment records with incorrect proof URLs
   - Update them to use the correct `/uploads/proofs/` path
   - Show you how many records were updated

5. Start your backend server again:
```bash
npm run dev
```

## What was fixed

- **Backend**: Updated `paymentController.ts` to save new uploads with the correct path
- **Frontend**: Updated `Approvals.tsx` to handle both old and new URL formats (with automatic fallback)
- **Migration**: Created script to fix existing database records

## After running the migration

All payment proof screenshots should now display correctly in the admin dashboard!
