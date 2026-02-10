
# Plan: USSD Quick-Pay Buttons and Plan Limits Management

## Overview
Two changes: (1) Add "Pay Now" buttons in the deposit dialog that launch USSD dial codes with the merchant code pre-filled, and (2) add `max_jobs` and `max_products` columns to subscription plans so the superadmin can control how many jobs/products each plan tier allows.

---

## Part 1: USSD Quick-Pay Buttons

Since this is a web app, we cannot directly launch USSD sessions. However, on mobile devices, we can use `tel:` links to dial USSD codes. The browser will open the phone dialer with the code pre-filled.

### Changes to `src/components/CompanyWallet.tsx`:
- Add two buttons below the submit button: **"Pay via MTN MoMo"** and **"Pay via Airtel Money"**
- Each button uses an anchor tag with `href="tel:..."` format:
  - MTN: `tel:*165*3*664588*{amount}#` (dials USSD with merchant code and amount pre-filled)
  - Airtel: `tel:*185*9*664588*{amount}#`
- The buttons will be disabled until the user enters a valid amount
- Styled with yellow/red brand colors for MTN and Airtel respectively
- On desktop browsers, a note will explain this works best on mobile

### Same pattern applied to subscription payment in `src/pages/Dashboard.tsx`:
- When a company selects a plan, add the same quick-pay buttons so they can dial directly to pay for their subscription

---

## Part 2: Plan Limits (max_jobs, max_products)

### Database Migration:
Add two new columns to `subscription_plans`:
```sql
ALTER TABLE public.subscription_plans
ADD COLUMN max_jobs integer NOT NULL DEFAULT 5,
ADD COLUMN max_products integer NOT NULL DEFAULT 10;

-- Update existing plans with appropriate limits
UPDATE public.subscription_plans SET max_jobs = 5, max_products = 10 WHERE name = 'Basic';
UPDATE public.subscription_plans SET max_jobs = 15, max_products = 30 WHERE name = 'Standard';
UPDATE public.subscription_plans SET max_jobs = 50, max_products = 100 WHERE name = 'Premium';
```

### Superadmin UI (`src/components/admin/CompaniesTab.tsx`):
- Add a new "Manage Plans" section or dialog where the superadmin can edit each plan's `max_jobs`, `max_products`, `price`, `duration_days`, and `features`
- Display the limits in the plan selection dropdown

### Company Dashboard (`src/pages/Dashboard.tsx`):
- Show the current plan's job and product limits alongside the subscription status
- Display usage (e.g., "3 / 15 jobs used")

### Enforcement:
- When a company tries to post a new job or product, check their plan's limits against their current count
- If they've reached the limit, show a message telling them to upgrade their plan

---

## Technical Details

### Files to create/modify:
1. **Database migration** -- add `max_jobs` and `max_products` to `subscription_plans`, update existing rows
2. **`src/components/CompanyWallet.tsx`** -- add USSD dial buttons with `tel:` links
3. **`src/pages/Dashboard.tsx`** -- add USSD buttons to subscription payment, show plan limits and usage
4. **`src/components/admin/CompaniesTab.tsx`** -- add plan management UI with editable limits fields
5. **`src/pages/Jobs.tsx`** or relevant job/product creation components -- add limit checks before allowing new posts
