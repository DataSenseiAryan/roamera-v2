# Sprint 7 — JustSplit, Multi-Currency Splits, and S1-S6 Debt Cleanup

Sprint 7 adds JustSplit — a standalone multi-currency expense splitting tool separate from the per-trip budget tracker (S5). Key differences: JustSplit works with any group of friends, not tied to a trip, and supports weighted splits and standalone settlement tracking.

---

## Pre-existing Assets Reused

- `apps/api/src/lib/exchange.ts` — Frankfurt API exchange rate helper with 1h cache (built S5)
- Greedy debt simplification algorithm from `apps/api/src/routes/budget.ts` — ported to expenses router
- JustSplit schema stubs already in `apps/api/src/db/schema.ts` (lines ~700-737)

---

## Part A: S1-S6 Debt Cleanup

- **AGENTS.md** — Added S5/S6 status rows and as-built notes for all sprints through S7
- **`circles.ts`** — Added `circle:member_joined` and `circle:member_left` WS broadcasts in join, leave, invite, and remove-member handlers

---

## Part B: Schema Migration (`drizzle/0006_blushing_beast.sql`)

Extended existing JustSplit stubs:
- `expense_groups`: added `linked_circle_id` FK to circles table
- `expenses`: added `category` and `notes` columns
- `expense_group_members`: added `uniqueIndex('expense_group_member_uniq')` on (group_id, user_id)
- `expense_splits`: added `uniqueIndex('expense_split_uniq')` on (expense_id, user_id)
- **New table**: `group_settlements` — id, groupId, fromUserId, toUserId, amount, currency, settledAt

---

## Part C: Backend (`apps/api/src/routes/expenses.ts`)

13 endpoints at `/api/v1/expenses/groups`.

### Split Type Logic

- **equal** — `amount / members.length` per member (rounding drift fixed to last member)
- **weighted** — body: `splits: [{userId, weight}]` — normalize weights proportionally
- **exact** — body: `splits: [{userId, amount}]` — validate sum within ±0.01 of total

### Balance Calculation

1. For each member: convert all expenses to group currency via Frankfurt API
2. Net balance = sum(expenses paid by user) - sum(splits assigned to user)
3. Apply settlements: fromUser += amount, toUser -= amount
4. Run greedy simplification on net balances

---

## Part D: Types (`packages/types/src/schemas/expenses.ts`)

- `ExpenseGroupSchema`, `CreateExpenseGroupSchema`, `UpdateExpenseGroupSchema`
- `ExpenseGroupMemberSchema`
- `ExpenseSchema`, `CreateExpenseSchema`, `ExpenseSplitSchema`
- `BalanceSummarySchema`, `BalanceMemberSchema`, `ExpenseGroupSimplifiedDebtSchema`
- `SettleDebtSchema`

Note: SimplifiedDebt renamed to `ExpenseGroupSimplifiedDebtSchema` to avoid name collision with `budget.ts` which exports the same name.

---

## Part E: SDK (`packages/sdk/src/hooks/expenses.ts`)

13 hooks: `useExpenseGroups`, `useExpenseGroup`, `useCreateExpenseGroup`, `useUpdateExpenseGroup`, `useDeleteExpenseGroup`, `useAddGroupMember`, `useRemoveGroupMember`, `useGroupExpenses`, `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`, `useGroupBalances`, `useSettleDebt`.

---

## Part F: Seed Data

Guard: `existingGroups.length === 0` before seeding.

**Group 1: "Goa Trip Expenses"** — arya (owner), marco, ana — linked to Goa circle
- 5 expenses: hotel (equal ₹9000), seafood dinner (exact ₹4500), taxi (equal ₹1200), surfing (weighted ₹3000), groceries (equal ₹1800)
- 1 settlement: ana → arya ₹500

**Group 2: "Rajasthan Crew"** — arya (owner), leo, kenji
- 5 expenses: camel safari (equal ₹3600), rickshaws (exact ₹900), haveli hotel (equal ₹7500), rooftop dinner (equal ₹2700), fort entry (exact ₹1500)
- 1 settlement: kenji → arya ₹1000

---

## Part G: Frontend

- `apps/web/src/app/(app)/justsplit/page.tsx` — groups list with balance cards
- `apps/web/src/app/(app)/justsplit/[groupId]/page.tsx` — group detail with expenses, balances, settle flow
- Receipt icon link added to navbar after Circles

---

## Part H: Verification

See `docs/sprint-verification.md` Sprint 7 section for full smoke tests and 6-scene demo walkthrough.

### Key Smoke Test Results
- GET /expenses/groups: 2 groups, correct myBalance per group
- GET /groups/:id/balances: correct net per member, simplified debts
- POST /groups/:id/settle: balance updates

---

## Part I: Git

All S7 changes committed and pushed to `DataSenseiAryan/roamera-v2` on `main` branch.
