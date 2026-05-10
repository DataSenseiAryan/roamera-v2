/**
 * @deprecated S12: JustSplit standalone expense groups are merged into trip budget.
 * Use budget hooks from './budget' for trip-scoped expense tracking.
 * This file is kept for reference but the /api/v1/expenses router is unmounted.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ExpenseGroup, CreateExpenseGroup, UpdateExpenseGroup,
  Expense, CreateExpense, BalanceSummary, SettleDebt,
  ExpenseGroupMember,
} from '@roamera/types';
import { getApiClient } from '../client';

export const expenseKeys = {
  all: ['expenses'] as const,
  groups: () => [...expenseKeys.all, 'groups'] as const,
  group: (id: string) => [...expenseKeys.all, 'group', id] as const,
  expenses: (groupId: string) => [...expenseKeys.all, 'list', groupId] as const,
  balances: (groupId: string) => [...expenseKeys.all, 'balances', groupId] as const,
};

export function useExpenseGroups() {
  return useQuery({
    queryKey: expenseKeys.groups(),
    queryFn: async () => {
      const r = await getApiClient().get<{ groups: ExpenseGroup[] }>('/api/v1/expenses/groups');
      return r.data.groups;
    },
  });
}

export function useExpenseGroup(groupId: string) {
  return useQuery({
    queryKey: expenseKeys.group(groupId),
    queryFn: async () => {
      const r = await getApiClient().get<{ group: ExpenseGroup; members: ExpenseGroupMember[] }>(`/api/v1/expenses/groups/${groupId}`);
      return r.data;
    },
    enabled: !!groupId,
  });
}

export function useCreateExpenseGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExpenseGroup) => {
      const r = await getApiClient().post<{ group: ExpenseGroup }>('/api/v1/expenses/groups', data);
      return r.data.group;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: expenseKeys.groups() }); },
  });
}

export function useUpdateExpenseGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: UpdateExpenseGroup }) => {
      const r = await getApiClient().patch<{ group: ExpenseGroup }>(`/api/v1/expenses/groups/${groupId}`, data);
      return r.data.group;
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: expenseKeys.group(groupId) });
      qc.invalidateQueries({ queryKey: expenseKeys.groups() });
    },
  });
}

export function useDeleteExpenseGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      await getApiClient().delete(`/api/v1/expenses/groups/${groupId}`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: expenseKeys.groups() }); },
  });
}

export function useAddGroupMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, username }: { groupId: string; username: string }) => {
      const r = await getApiClient().post<{ member: ExpenseGroupMember }>(`/api/v1/expenses/groups/${groupId}/members`, { username });
      return r.data.member;
    },
    onSuccess: (_, { groupId }) => { qc.invalidateQueries({ queryKey: expenseKeys.group(groupId) }); },
  });
}

export function useRemoveGroupMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      await getApiClient().delete(`/api/v1/expenses/groups/${groupId}/members/${userId}`);
    },
    onSuccess: (_, { groupId }) => { qc.invalidateQueries({ queryKey: expenseKeys.group(groupId) }); },
  });
}

export function useGroupExpenses(groupId: string) {
  return useQuery({
    queryKey: expenseKeys.expenses(groupId),
    queryFn: async () => {
      const r = await getApiClient().get<{ expenses: Expense[] }>(`/api/v1/expenses/groups/${groupId}/expenses`);
      return r.data.expenses;
    },
    enabled: !!groupId,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: CreateExpense }) => {
      const r = await getApiClient().post<{ expense: Expense }>(`/api/v1/expenses/groups/${groupId}/expenses`, data);
      return r.data.expense;
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: expenseKeys.expenses(groupId) });
      qc.invalidateQueries({ queryKey: expenseKeys.balances(groupId) });
      qc.invalidateQueries({ queryKey: expenseKeys.groups() });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, expenseId, data }: { groupId: string; expenseId: string; data: Partial<CreateExpense> }) => {
      const r = await getApiClient().patch<{ expense: Expense }>(`/api/v1/expenses/groups/${groupId}/expenses/${expenseId}`, data);
      return r.data.expense;
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: expenseKeys.expenses(groupId) });
      qc.invalidateQueries({ queryKey: expenseKeys.balances(groupId) });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, expenseId }: { groupId: string; expenseId: string }) => {
      await getApiClient().delete(`/api/v1/expenses/groups/${groupId}/expenses/${expenseId}`);
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: expenseKeys.expenses(groupId) });
      qc.invalidateQueries({ queryKey: expenseKeys.balances(groupId) });
      qc.invalidateQueries({ queryKey: expenseKeys.groups() });
    },
  });
}

export function useGroupBalances(groupId: string) {
  return useQuery({
    queryKey: expenseKeys.balances(groupId),
    queryFn: async () => {
      const r = await getApiClient().get<BalanceSummary>(`/api/v1/expenses/groups/${groupId}/balances`);
      return r.data;
    },
    enabled: !!groupId,
  });
}

export function useSettleDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: SettleDebt }) => {
      const r = await getApiClient().post(`/api/v1/expenses/groups/${groupId}/settle`, data);
      return r.data;
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: expenseKeys.balances(groupId) });
      qc.invalidateQueries({ queryKey: expenseKeys.groups() });
    },
  });
}
