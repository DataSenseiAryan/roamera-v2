import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePackingBag, CreatePackingCategory, CreatePackingItem, PackingBag, PackingCategory, PackingItem, PackingList, PackingTemplate, UpdatePackingItem } from '@roamera/types';
import { getApiClient } from '../client';

export const packingKeys = {
  all: ['packing'] as const,
  list: (tripId: string) => [...packingKeys.all, 'list', tripId] as const,
  categories: (tripId: string) => [...packingKeys.all, 'categories', tripId] as const,
  bags: (tripId: string) => [...packingKeys.all, 'bags', tripId] as const,
  templates: () => [...packingKeys.all, 'templates'] as const,
};

export function usePackingList(tripId: string) {
  return useQuery({
    queryKey: packingKeys.list(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<PackingList>(`/api/v1/trips/${tripId}/packing`);
      return res.data;
    },
    enabled: !!tripId,
  });
}

export function useCreatePackingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: CreatePackingItem }) => {
      const res = await getApiClient().post<{ item: PackingItem }>(`/api/v1/trips/${tripId}/packing/items`, data);
      return res.data.item;
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: packingKeys.list(tripId) }); },
  });
}

export function useUpdatePackingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, itemId, data }: { tripId: string; itemId: string; data: UpdatePackingItem }) => {
      const res = await getApiClient().patch<{ item: PackingItem }>(`/api/v1/trips/${tripId}/packing/items/${itemId}`, data);
      return res.data.item;
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: packingKeys.list(tripId) }); },
  });
}

export function useDeletePackingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, itemId }: { tripId: string; itemId: string }) => {
      await getApiClient().delete(`/api/v1/trips/${tripId}/packing/items/${itemId}`);
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: packingKeys.list(tripId) }); },
  });
}

export function useTogglePacked() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, itemId, isPacked }: { tripId: string; itemId: string; isPacked: boolean }) => {
      await getApiClient().patch(`/api/v1/trips/${tripId}/packing/items/${itemId}`, { isPacked });
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: packingKeys.list(tripId) }); },
  });
}

export function usePackingCategories(tripId: string) {
  return useQuery({
    queryKey: packingKeys.categories(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<{ categories: PackingCategory[] }>(`/api/v1/trips/${tripId}/packing/categories`);
      return res.data.categories;
    },
    enabled: !!tripId,
  });
}

export function useCreatePackingCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: CreatePackingCategory }) => {
      const res = await getApiClient().post<{ category: PackingCategory }>(`/api/v1/trips/${tripId}/packing/categories`, data);
      return res.data.category;
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: packingKeys.list(tripId) }); },
  });
}

export function useUpdatePackingCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, categoryId, data }: { tripId: string; categoryId: string; data: Partial<CreatePackingCategory> }) => {
      const res = await getApiClient().patch<{ category: PackingCategory }>(`/api/v1/trips/${tripId}/packing/categories/${categoryId}`, data);
      return res.data.category;
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: packingKeys.list(tripId) }); },
  });
}

export function usePackingBags(tripId: string) {
  return useQuery({
    queryKey: packingKeys.bags(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<{ bags: PackingBag[] }>(`/api/v1/trips/${tripId}/packing/bags`);
      return res.data.bags;
    },
    enabled: !!tripId,
  });
}

export function useCreatePackingBag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: CreatePackingBag }) => {
      const res = await getApiClient().post<{ bag: PackingBag }>(`/api/v1/trips/${tripId}/packing/bags`, data);
      return res.data.bag;
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: packingKeys.list(tripId) }); },
  });
}

export function useAssignItemToBag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, bagId, itemId }: { tripId: string; bagId: string; itemId: string }) => {
      await getApiClient().post(`/api/v1/trips/${tripId}/packing/bags/${bagId}/items`, { itemId });
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: packingKeys.list(tripId) }); },
  });
}

export function useRemoveItemFromBag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, bagId, itemId }: { tripId: string; bagId: string; itemId: string }) => {
      await getApiClient().delete(`/api/v1/trips/${tripId}/packing/bags/${bagId}/items/${itemId}`);
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: packingKeys.list(tripId) }); },
  });
}

export function usePackingTemplates() {
  return useQuery({
    queryKey: packingKeys.templates(),
    queryFn: async () => {
      const res = await getApiClient().get<{ templates: PackingTemplate[] }>('/api/v1/packing-templates');
      return res.data.templates;
    },
  });
}

export function useApplyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, templateId }: { tripId: string; templateId: string }) => {
      await getApiClient().post(`/api/v1/trips/${tripId}/packing/templates/apply`, { templateId });
    },
    onSuccess: (_, { tripId }) => { qc.invalidateQueries({ queryKey: packingKeys.list(tripId) }); },
  });
}

export function useSaveAsTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, name, description }: { tripId: string; name: string; description?: string }) => {
      const res = await getApiClient().post<{ template: PackingTemplate }>(`/api/v1/trips/${tripId}/packing/templates/save`, { name, description });
      return res.data.template;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: packingKeys.templates() }); },
  });
}
