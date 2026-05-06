import { z } from 'zod';

export const CreateExpenseGroupSchema = z.object({
  name: z.string().min(1).max(100),
  currency: z.string().length(3).default('INR'),
  linkedCircleId: z.string().optional(),
});
export type CreateExpenseGroup = z.infer<typeof CreateExpenseGroupSchema>;

export const UpdateExpenseGroupSchema = CreateExpenseGroupSchema.partial();
export type UpdateExpenseGroup = z.infer<typeof UpdateExpenseGroupSchema>;

export const ExpenseGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  linkedCircleId: z.string().nullable(),
  memberCount: z.number().optional(),
  myRole: z.enum(['owner', 'member']).nullable().optional(),
  myBalance: z.number().optional(),
  createdAt: z.string(),
});
export type ExpenseGroup = z.infer<typeof ExpenseGroupSchema>;

export const ExpenseGroupMemberSchema = z.object({
  userId: z.string(),
  username: z.string(),
  displayName: z.string().nullable(),
  joinedAt: z.string(),
});
export type ExpenseGroupMember = z.infer<typeof ExpenseGroupMemberSchema>;

export const ExpenseSplitSchema = z.object({
  userId: z.string(),
  username: z.string().optional(),
  amount: z.string(),
  isSettled: z.boolean(),
  settledAt: z.string().nullable().optional(),
});
export type ExpenseSplit = z.infer<typeof ExpenseSplitSchema>;

export const ExpenseSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  paidBy: z.string(),
  paidByUsername: z.string().optional(),
  description: z.string(),
  amount: z.string(),
  currency: z.string(),
  category: z.string().nullable(),
  notes: z.string().nullable(),
  date: z.string().nullable(),
  splitType: z.enum(['equal', 'weighted', 'exact']),
  splits: z.array(ExpenseSplitSchema).optional(),
  createdAt: z.string(),
});
export type Expense = z.infer<typeof ExpenseSchema>;

const SplitInputSchema = z.union([
  z.object({ userId: z.string(), weight: z.number().positive() }),
  z.object({ userId: z.string(), amount: z.string() }),
]);

export const CreateExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.string(),
  currency: z.string().length(3).default('INR'),
  paidBy: z.string(),
  splitType: z.enum(['equal', 'weighted', 'exact']).default('equal'),
  splits: z.array(SplitInputSchema).optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().datetime().optional(),
});
export type CreateExpense = z.infer<typeof CreateExpenseSchema>;

export const ExpenseGroupSimplifiedDebtSchema = z.object({
  from: z.string(),
  fromUsername: z.string().optional(),
  to: z.string(),
  toUsername: z.string().optional(),
  amount: z.number(),
  currency: z.string(),
});
export type ExpenseGroupSimplifiedDebt = z.infer<typeof ExpenseGroupSimplifiedDebtSchema>;

export const BalanceMemberSchema = z.object({
  userId: z.string(),
  username: z.string(),
  netBalance: z.number(),
  currency: z.string(),
});
export type BalanceMember = z.infer<typeof BalanceMemberSchema>;

export const BalanceSummarySchema = z.object({
  members: z.array(BalanceMemberSchema),
  simplifiedDebts: z.array(ExpenseGroupSimplifiedDebtSchema),
  groupCurrency: z.string(),
});
export type BalanceSummary = z.infer<typeof BalanceSummarySchema>;

export const SettleDebtSchema = z.object({
  toUserId: z.string(),
  amount: z.string(),
  currency: z.string().length(3).optional(),
});
export type SettleDebt = z.infer<typeof SettleDebtSchema>;
