import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BudgetItem, BudgetSummary, CreateBudgetItem, CreateSettlement, Settlement, UpdateBudgetItem } from '@roamera/types';
import { getApiClient } from '../client';

export const budgetKeys = {
  all: ['budget'] as const,
  summary: (tripId: string) => [...budgetKeys.all, 'summary', tripId] as const,
  settlements: (tripId: string) => [...budgetKeys.all, 'settlements', tripId] as const,
};

export function useBudgetSummary(tripId: string) {
  return useQuery({
    queryKey: budgetKeys.summary(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<BudgetSummary>(`/api/v1/trips/${tripId}/budget`);
      return res.data;
    },
    enabled: !!tripId,
  });
}

export function useCreateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: CreateBudgetItem }) => {
      const res = await getApiClient().post<{ item: BudgetItem }>(`/api/v1/trips/${tripId}/budget/items`, data);
      return res.data.item;
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: budgetKeys.summary(tripId) }); },
  });
}

export function useUpdateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, itemId, data }: { tripId: string; itemId: string; data: UpdateBudgetItem }) => {
      const res = await getApiClient().patch<{ item: BudgetItem }>(`/api/v1/trips/${tripId}/budget/items/${itemId}`, data);
      return res.data.item;
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: budgetKeys.summary(tripId) }); },
  });
}

export function useDeleteBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, itemId }: { tripId: string; itemId: string }) => {
      await getApiClient().delete(`/api/v1/trips/${tripId}/budget/items/${itemId}`);
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: budgetKeys.summary(tripId) }); },
  });
}

export function useSetBudgetSplits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, itemId, splits }: { tripId: string; itemId: string; splits: { userId: string; amount: string }[] }) => {
      await getApiClient().post(`/api/v1/trips/${tripId}/budget/items/${itemId}/splits`, { splits });
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: budgetKeys.summary(tripId) }); },
  });
}

export function useTogglePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, itemId, userId }: { tripId: string; itemId: string; userId: string }) => {
      await getApiClient().patch(`/api/v1/trips/${tripId}/budget/items/${itemId}/splits/${userId}`);
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: budgetKeys.summary(tripId) }); },
  });
}

export function useCreateSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: CreateSettlement }) => {
      const res = await getApiClient().post<{ settlement: Settlement }>(`/api/v1/trips/${tripId}/budget/settle`, data);
      return res.data.settlement;
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: budgetKeys.summary(tripId) }); },
  });
}

export function useSettlements(tripId: string) {
  return useQuery({
    queryKey: budgetKeys.settlements(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<{ settlements: Settlement[] }>(`/api/v1/trips/${tripId}/budget/settlements`);
      return res.data.settlements;
    },
    enabled: !!tripId,
  });
}
