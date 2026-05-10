import { ScrollView, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';

interface Expense {
  id: string;
  name: string;
  totalPrice: number;
  amount?: number;
  category?: string;
  currency: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  accommodation: '#8b5cf6',
  activities: '#10b981',
  shopping: '#f59e0b',
  other: '#64748b',
};

export default function BudgetScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const dark = useColorScheme() === 'dark';
  const token = useAuthStore(s => s.accessToken);

  const { data: budgetData } = useQuery({
    queryKey: ['budget', tripId],
    queryFn: async () => {
      const res = await getApiClient().get(`/api/v1/trips/${tripId}/budget`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data as { items: Expense[]; summary: { grandTotal: number; budget?: number } };
    },
    enabled: !!token && !!tripId,
  });

  const summary = budgetData?.summary;
  const expenses = budgetData?.items;

  const total = summary?.grandTotal ?? expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#0f172a' : '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Total */}
        <View style={{
          backgroundColor: '#0d9488', borderRadius: 16, padding: 20,
          alignItems: 'center', marginBottom: 16,
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Total Spent</Text>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700' }}>
            ₹{total.toLocaleString()}
          </Text>
          {summary?.budget != null && (
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              of ₹{(summary.budget as number).toLocaleString()} budget
            </Text>
          )}
        </View>

        {/* Expense List */}
        <Text style={{ fontSize: 18, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a', marginBottom: 12 }}>
          Expenses
        </Text>
        {(expenses ?? []).map((expense) => (
          <View key={expense.id} style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            padding: 14, marginBottom: 8, borderRadius: 12,
            backgroundColor: dark ? '#1e293b' : '#fff',
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: dark ? '#f8fafc' : '#0f172a' }}>{expense.name}</Text>
              {expense.category && (
                <Text style={{
                  fontSize: 11, color: '#fff', marginTop: 3,
                  backgroundColor: CATEGORY_COLORS[expense.category] ?? '#64748b',
                  alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
                }}>
                  {expense.category}
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0d9488' }}>
              ₹{(expense.totalPrice ?? expense.amount ?? 0).toLocaleString()}
            </Text>
          </View>
        ))}
        {(!expenses || expenses.length === 0) && (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>💰</Text>
            <Text style={{ color: dark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>No expenses yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
