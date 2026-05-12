export type TransactionType = 'income' | 'expense' | 'credit';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  quantity?: string;
  product?: string;
  directCost: number;
  grossProfit: number;
  netProfit: number;
  rawText?: string;
  timestamp: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  categoryBreakdown: Record<string, number>;
}
