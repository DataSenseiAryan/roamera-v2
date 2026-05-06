import { z } from 'zod';

export const CreateBudgetItemSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  totalPrice: z.string().or(z.number()).transform(String),
  currency: z.string().default('INR'),
  persons: z.number().int().min(1).default(1),
  days: z.number().int().min(1).default(1),
  sortOrder: z.number().int().optional(),
});
export type CreateBudgetItem = z.infer<typeof CreateBudgetItemSchema>;

export const UpdateBudgetItemSchema = CreateBudgetItemSchema.partial();
export type UpdateBudgetItem = z.infer<typeof UpdateBudgetItemSchema>;

export const BudgetItemSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  category: z.string(),
  name: z.string(),
  totalPrice: z.string(),
  currency: z.string(),
  persons: z.number(),
  days: z.number(),
  sortOrder: z.number(),
});
export type BudgetItem = z.infer<typeof BudgetItemSchema>;

export const BudgetSplitSchema = z.object({
  budgetItemId: z.string(),
  userId: z.string(),
  username: z.string().optional(),
  amount: z.string(),
  isPaid: z.boolean(),
});
export type BudgetSplit = z.infer<typeof BudgetSplitSchema>;

export const SetSplitsSchema = z.object({
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.string().or(z.number()).transform(String),
  })),
});
export type SetSplits = z.infer<typeof SetSplitsSchema>;

export const CreateSettlementSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.string().or(z.number()).transform(String),
  currency: z.string().default('INR'),
});
export type CreateSettlement = z.infer<typeof CreateSettlementSchema>;

export const SettlementSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  fromUserId: z.string(),
  fromUsername: z.string().optional(),
  toUserId: z.string(),
  toUsername: z.string().optional(),
  amount: z.string(),
  currency: z.string(),
  settledAt: z.string(),
  createdAt: z.string(),
});
export type Settlement = z.infer<typeof SettlementSchema>;

export const SimplifiedDebtSchema = z.object({
  from: z.string(),
  fromUsername: z.string().optional(),
  to: z.string(),
  toUsername: z.string().optional(),
  amount: z.number(),
});
export type SimplifiedDebt = z.infer<typeof SimplifiedDebtSchema>;

export const BudgetCategoryGroupSchema = z.object({
  name: z.string(),
  total: z.number(),
  items: z.array(BudgetItemSchema),
});

export const BudgetSummarySchema = z.object({
  items: z.array(BudgetItemSchema),
  categories: z.array(BudgetCategoryGroupSchema),
  grandTotal: z.number(),
  currency: z.string(),
  balances: z.array(z.object({
    userId: z.string(),
    username: z.string().optional(),
    balance: z.number(),
  })),
  simplifiedDebts: z.array(SimplifiedDebtSchema),
  settlements: z.array(SettlementSchema),
});
export type BudgetSummary = z.infer<typeof BudgetSummarySchema>;
