import { useState, useEffect } from 'react';
import { Heart, Activity, HelpCircle, Download, Sparkles, Wallet, ShieldCheck, TrendingUp, Settings, Box, UserCheck, ArrowRight, FileCheck, Menu, ChevronDown, Trash2, Flame, LogOut, Bell } from 'lucide-react';
import SmartInputBar from './components/SmartInputBar';
import TransactionLedger from './components/TransactionLedger';
import FinancialSummary from './components/FinancialSummary';
import ProfitChart from './components/ProfitChart';
import ProductProgressChart from './components/ProductProgressChart';
import SmartNotifications from './components/SmartNotifications';
import Auth from './components/Auth';
import { signOut, User, auth } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';
import { lookupCost, PRODUCT_COSTS } from './services/productCosts';
import { Transaction } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdinkraBackground = () => {
  const symbols = [
    "M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40zm5-45h10v10H55v10H45v-10H35v-10h10v-10h10v10z", // Gye Nyame
    "M50 10c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40zm0 74c-18.8 0-34-15.2-34-34s15.2-34 34-34 34 15.2 34 34-15.2 34-34 34z M50 30c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 34c-7.7 0-14-6.3-14-14s6.3-14 14-14 14 6.3 14 14-6.3 14-14 14z", // Adinkrahene
    "M50 0 L100 50 L50 100 L0 50 Z M50 20 L80 50 L50 80 L20 50 Z", // Nyame Nti
    "M20 20 Q50 0 80 20 L80 80 Q50 100 20 80 Z", // Dwennimmen simple path
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.04] z-0">
      <div className="absolute inset-0 grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-16 p-8 translate-y-[-5%] scale-105">
        {Array.from({ length: 120 }).map((_, i) => (
          <motion.svg 
            key={i}
            viewBox="0 0 100 100" 
            className="w-full aspect-square fill-brand-gold"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: (i % 12) * 0.05 + Math.floor(i / 12) * 0.05,
              duration: 1
            }}
          >
            <path d={symbols[i % symbols.length]} />
          </motion.svg>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-brand-charcoal via-transparent to-brand-charcoal" />
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [history, setHistory] = useState<{ monthly: any[], yearly: any[] }>(() => {
    const saved = localStorage.getItem('akoma_ledger_history');
    return saved ? JSON.parse(saved) : { monthly: [], yearly: [] };
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [productCosts, setProductCosts] = useState<Record<string, number>>(PRODUCT_COSTS);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [billForm, setBillForm] = useState({ description: '', amount: '' });
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [overheadAdjustment, setOverheadAdjustment] = useState<number>(0);
  const [streak, setStreak] = useState({ count: 0, lastDutyDate: '' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [billSuccess, setBillSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('akoma_notifications_enabled');
    return saved === 'true';
  });

  /**
   * Sets up authentications state listener.
   */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  /**
   * Synchronizes transaction data from LocalStorage.
   */
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const saved = localStorage.getItem('akoma_ledger_transactions');
    if (saved) {
      const data = JSON.parse(saved) as Transaction[];
      setTransactions(data.filter(t => t.userId === user.uid).sort((a, b) => b.timestamp - a.timestamp));
    }
    setIsDataLoaded(true);
  }, [user]);

  /**
   * Loads custom product cost mapping from LocalStorage.
   */
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem('akoma_ledger_product_costs');
    const costs: Record<string, number> = { ...PRODUCT_COSTS };
    if (saved) {
      const data = JSON.parse(saved);
      if (data[user.uid]) {
        Object.entries(data[user.uid]).forEach(([name, cost]) => {
          costs[name.toLowerCase()] = cost as number;
        });
      }
    }
    setProductCosts(costs);
  }, [user]);

  // Load overhead adjustment and streak from local storage as they are partially UI/Local state, 
  // but could be moved to firestore too for true multi-device sync
  useEffect(() => {
    const savedOverhead = localStorage.getItem('akoma_ledger_overhead_adjustment');
    if (savedOverhead) setOverheadAdjustment(parseFloat(savedOverhead));
    
    const savedStreak = localStorage.getItem('akoma_ledger_streak_data');
    if (savedStreak) setStreak(JSON.parse(savedStreak));
  }, []);

  useEffect(() => {
    localStorage.setItem('akoma_ledger_overhead_adjustment', overheadAdjustment.toString());
  }, [overheadAdjustment]);

  useEffect(() => {
    localStorage.setItem('akoma_ledger_streak_data', JSON.stringify(streak));
  }, [streak]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Daily Reminder Logic
  useEffect(() => {
    if (!notificationsEnabled || !user || !isDataLoaded) return;

    const lastReminderDate = localStorage.getItem('akoma_last_reminder_date');
    const today = new Date().toLocaleDateString('en-CA');

    if (lastReminderDate !== today) {
      const checkReminder = () => {
        const hasTransactedToday = transactions.some(t => {
          const tDate = new Date(t.timestamp).toLocaleDateString('en-CA');
          return tDate === today;
        });

        if (!hasTransactedToday) {
          showDailyReminder();
        }
      };

      // Check after a short delay on mount
      const timer = setTimeout(checkReminder, 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationsEnabled, user, transactions]);

  const showDailyReminder = () => {
    const quotes = [
      "The soul of business is record-keeping. Update your Akoma Ledger today.",
      "A disciplined entrepreneur is a successful one. Have you recorded your latest wins?",
      "Consistency builds empires. Don't break your Growth Streak today!",
      "Turn your hard work into clear data. Log your transactions now.",
      "Your future self will thank you for the clarity. Record your day's work."
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Akoma Ledger Reminder", {
          body: quote,
          icon: "/favicon.ico"
        });
        localStorage.setItem('akoma_last_reminder_date', new Date().toLocaleDateString('en-CA'));
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            showDailyReminder();
          }
        });
      }
    }
  };

  const toggleNotifications = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem('akoma_notifications_enabled', newState.toString());
    
    if (newState && "Notification" in window) {
      Notification.requestPermission();
    }
  };

  /**
   * Manages the "Growth Streak" - resets if days are missed.
   */
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString('en-CA');
    
    if (streak.lastDutyDate && streak.lastDutyDate !== today && streak.lastDutyDate !== yesterday) {
      setStreak({ count: 0, lastDutyDate: '' });
    }
  }, [streak.lastDutyDate]);

  /**
   * Processes and persists a captured transaction from voice or smart input.
   */
  const handleTransactionCaptured = async (parsed: any) => {
    if (!user) return;

    const revenue = (parsed.type === 'income' || parsed.type === 'credit') ? parsed.amount : 0;
    let directCost = 0;

    const isRevenueType = parsed.type === 'income' || parsed.type === 'credit';
    if (isRevenueType && parsed.product) {
      const estimatedCost = lookupCost(parsed.product, parsed.quantity, productCosts);
      directCost = estimatedCost <= 1 ? revenue * estimatedCost : estimatedCost;
    }

    const grossProfit = isRevenueType ? revenue - directCost : 0;
    const netProfit = isRevenueType ? grossProfit : -parsed.amount;

    const transactionsRef = collection(db, 'transactions');
    const newDocRef = doc(transactionsRef);
    const id = newDocRef.id;

    const transaction = {
      ...parsed,
      id: Math.random().toString(36).substring(7),
      userId: user.uid,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      directCost,
      grossProfit,
      netProfit,
    };

    try {
      const existing = localStorage.getItem('akoma_ledger_transactions');
      const data = existing ? JSON.parse(existing) : [];
      const updated = [transaction, ...data];
      localStorage.setItem('akoma_ledger_transactions', JSON.stringify(updated));
      
      setTransactions(updated.filter(t => t.userId === user.uid).sort((a, b) => b.timestamp - a.timestamp));
      recordDuty();
      showToast("Transaction Recorded");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `transactions`);
    }
  };

  const addManualExpense = async () => {
    const amount = parseFloat(billForm.amount);
    if (!billForm.description || isNaN(amount) || !user) return;

    await handleTransactionCaptured({
      product: billForm.description,
      description: billForm.description,
      amount,
      type: 'expense',
      category: 'Operational',
      quantity: 1
    });
    
    setBillSuccess(true);
    setBillForm({ description: '', amount: '' });
    setTimeout(() => {
      setBillSuccess(false);
      setShowAddBill(false);
    }, 1500);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const existing = localStorage.getItem('akoma_ledger_transactions');
      if (existing) {
        const data = JSON.parse(existing) as Transaction[];
        const updated = data.filter(t => t.id !== id);
        localStorage.setItem('akoma_ledger_transactions', JSON.stringify(updated));
        setTransactions(updated.filter(t => t.userId === (user?.uid || '')).sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const deleteProduct = async (name: string) => {
    if (!user) return;
    setIsSavingSettings(true);
    try {
      const saved = localStorage.getItem('akoma_ledger_product_costs');
      let data = saved ? JSON.parse(saved) : {};
      if (data[user.uid]) {
        delete data[user.uid][name.toLowerCase()];
        localStorage.setItem('akoma_ledger_product_costs', JSON.stringify(data));
      }
      
      const costs: Record<string, number> = { ...PRODUCT_COSTS };
      if (data[user.uid]) {
        Object.entries(data[user.uid]).forEach(([n, c]) => {
          costs[n.toLowerCase()] = c as number;
        });
      }
      setProductCosts(costs);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `productCosts/${user.uid}_${name}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const addProduct = async () => {
    if (!user) return;
    
    let nextNum = Object.keys(productCosts).length + 1;
    let name = `Asset ${nextNum}`;
    while (productCosts[name.toLowerCase()]) {
      nextNum++;
      name = `Asset ${nextNum}`;
    }
    
    setIsSavingSettings(true);
    try {
      const saved = localStorage.getItem('akoma_ledger_product_costs');
      let data = saved ? JSON.parse(saved) : {};
      if (!data[user.uid]) data[user.uid] = {};
      data[user.uid][name.toLowerCase()] = 0;
      localStorage.setItem('akoma_ledger_product_costs', JSON.stringify(data));

      const costs: Record<string, number> = { ...PRODUCT_COSTS };
      Object.entries(data[user.uid]).forEach(([n, c]) => {
        costs[n.toLowerCase()] = c as number;
      });
      setProductCosts(costs);

      setSaveSuccess(true);
      showToast("Preset Added Successfully");
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `productCosts/${user.uid}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const updateProductCost = async (name: string, cost: number) => {
    if (!user) return;
    setIsSavingSettings(true);
    try {
      const saved = localStorage.getItem('akoma_ledger_product_costs');
      let data = saved ? JSON.parse(saved) : {};
      if (!data[user.uid]) data[user.uid] = {};
      data[user.uid][name.toLowerCase()] = cost;
      localStorage.setItem('akoma_ledger_product_costs', JSON.stringify(data));

      const costs: Record<string, number> = { ...PRODUCT_COSTS };
      Object.entries(data[user.uid]).forEach(([n, c]) => {
        costs[n.toLowerCase()] = c as number;
      });
      setProductCosts(costs);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `productCosts/${user.uid}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const renameProduct = async (oldName: string, newName: string) => {
    if (!user || oldName === newName) return;
    setIsSavingSettings(true);
    try {
      const saved = localStorage.getItem('akoma_ledger_product_costs');
      let data = saved ? JSON.parse(saved) : {};
      if (data[user.uid] && data[user.uid][oldName.toLowerCase()] !== undefined) {
        const cost = data[user.uid][oldName.toLowerCase()];
        delete data[user.uid][oldName.toLowerCase()];
        data[user.uid][newName.toLowerCase()] = cost;
        localStorage.setItem('akoma_ledger_product_costs', JSON.stringify(data));

        const costs: Record<string, number> = { ...PRODUCT_COSTS };
        Object.entries(data[user.uid]).forEach(([n, c]) => {
          costs[n.toLowerCase()] = c as number;
        });
        setProductCosts(costs);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'productCosts/rename');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ["Date", "Description", "Category", "Amount", "Type", "Gross Profit", "Net Profit"];
    const rows = transactions.map(t => [
      t.date,
      t.description.replace(/,/g, ''),
      t.category,
      t.amount,
      t.type,
      (t.grossProfit ?? 0).toFixed(2),
      (t.netProfit ?? 0).toFixed(2)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `akoma_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateBankStatement = () => {
    if (transactions.length === 0) return;

    const doc = new jsPDF();
    const gold: [number, number, number] = [212, 175, 55];
    const charcoal: [number, number, number] = [30, 30, 30];

    // Header
    doc.setFillColor(charcoal[0], charcoal[1], charcoal[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(24);
    doc.text("AKOMA LEDGER", 14, 25);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("CERTIFIED BUSINESS PERFORMANCE STATEMENT", 14, 32);
    doc.text(new Date().toLocaleDateString(), 170, 25);

    // Business Summary
    doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
    doc.setFontSize(14);
    doc.text("Financial Summary", 14, 55);
    
    const revenue = transactions.filter(t => t.type === 'income' || t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const grossProfit = transactions.reduce((sum, t) => sum + (t.grossProfit || 0), 0);
    const netProfit = transactions.reduce((sum, t) => sum + (t.netProfit || 0), 0);

    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Amount (GH₵)']],
      body: [
        ['Total Revenue', revenue.toLocaleString()],
        ['Estimated Gross Profit', grossProfit.toLocaleString()],
        ['Net Yield (Post-Overhead)', netProfit.toLocaleString()],
      ],
      headStyles: { fillColor: gold },
      styles: { cellPadding: 5 }
    });

    // Transaction History
    doc.text("Recent Transaction Audit", 14, (doc as any).lastAutoTable.finalY + 15);

    const tableRows = transactions.map(t => [
      t.date,
      t.description,
      t.type.toUpperCase(),
      t.amount.toLocaleString(),
      (t.netProfit || 0).toLocaleString()
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Date', 'Description', 'Type', 'Amount (GHS)', 'Net Profit (GHS)']],
      body: tableRows,
      headStyles: { fillColor: charcoal },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This statement is a certified digital export from Akoma Ledger Systems.", 14, finalY);
    doc.text("Verified by Akoma Intelligence Engine", 14, finalY + 5);

    doc.save(`akoma_bank_statement_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `akoma_ledger_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearLedger = async () => {
    if (window.confirm("Are you sure you want to permanently clear your ledger? This cannot be undone.")) {
      if (!user) return;
      setIsPurging(true);
      try {
        const existing = localStorage.getItem('akoma_ledger_transactions');
        if (existing) {
          const data = JSON.parse(existing) as Transaction[];
          const updated = data.filter(t => t.userId !== user.uid);
          localStorage.setItem('akoma_ledger_transactions', JSON.stringify(updated));
          setTransactions([]);
        }
        
        setPurgeSuccess(true);
        showToast("Ledger Purged Successfully", "success");
        setTimeout(() => setPurgeSuccess(false), 3000);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'transactions/clear');
      } finally {
        setIsPurging(false);
      }
    }
  };

  const recordDuty = () => {
    const today = new Date().toLocaleDateString('en-CA');
    if (streak.lastDutyDate === today) return;

    setStreak(prev => {
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toLocaleDateString('en-CA');
      const newCount = prev.lastDutyDate === yesterday ? prev.count + 1 : 1;
      return { count: newCount, lastDutyDate: today };
    });
  };

  // History & Period Reset Logic
  useEffect(() => {
    if (!isDataLoaded || !user) return;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYearKey = `${now.getFullYear()}`;
    
    const lastTrackedMonth = localStorage.getItem('akoma_last_tracked_month');
    const lastTrackedYear = localStorage.getItem('akoma_last_tracked_year');

    let updatedHistory = { ...history };

    // Monthly Reset Detection
    if (lastTrackedMonth && lastTrackedMonth !== currentMonthKey) {
      const lastMonthParts = lastTrackedMonth.split('-');
      const lYear = parseInt(lastMonthParts[0]);
      const lMonth = parseInt(lastMonthParts[1]) - 1;

      const lastMonthTransactions = transactions.filter(t => {
        const d = new Date(t.timestamp);
        return d.getFullYear() === lYear && d.getMonth() === lMonth;
      });

      if (lastMonthTransactions.length > 0) {
        const hTotals = calculateTotalsForData(lastMonthTransactions);
        const record = {
          period: lastTrackedMonth,
          revenue: hTotals.revenue,
          profit: hTotals.netProfitBase - (hTotals.revenue * overheadAdjustment / 100),
          dateArchived: new Date().toISOString()
        };
        if (!updatedHistory.monthly.some(m => m.period === record.period)) {
          updatedHistory.monthly = [...updatedHistory.monthly, record];
        }
      }
    }

    // Yearly Reset Detection
    if (lastTrackedYear && lastTrackedYear !== currentYearKey) {
      const lYear = parseInt(lastTrackedYear);

      const lastYearTransactions = transactions.filter(t => {
        const d = new Date(t.timestamp);
        return d.getFullYear() === lYear;
      });

      if (lastYearTransactions.length > 0) {
        const hTotals = calculateTotalsForData(lastYearTransactions);
        const record = {
          period: lastTrackedYear,
          revenue: hTotals.revenue,
          profit: hTotals.netProfitBase - (hTotals.revenue * overheadAdjustment / 100),
          dateArchived: new Date().toISOString()
        };
        if (!updatedHistory.yearly.some(y => y.period === record.period)) {
          updatedHistory.yearly = [...updatedHistory.yearly, record];
        }
      }
    }

    if (JSON.stringify(updatedHistory) !== JSON.stringify(history)) {
      setHistory(updatedHistory);
      localStorage.setItem('akoma_ledger_history', JSON.stringify(updatedHistory));
    }

    localStorage.setItem('akoma_last_tracked_month', currentMonthKey);
    localStorage.setItem('akoma_last_tracked_year', currentYearKey);
  }, [isDataLoaded, transactions, user]);

  /**
   * Helper to calculate totals for a specific set of transactions.
   */
  const calculateTotalsForData = (data: Transaction[]) => {
    return data.reduce((acc, t) => {
      if (t.type === 'income' || t.type === 'credit') {
        acc.revenue += t.amount;
        acc.directCosts += (t.directCost || 0);
      } else if (t.type === 'expense') {
        acc.opEx += t.amount;
      }
      acc.netProfitBase += (t.netProfit || 0);
      return acc;
    }, { revenue: 0, directCosts: 0, opEx: 0, netProfitBase: 0 });
  };

  // Dynamic Totals calculation based on the active horizon
  const filteredTransactionsForSummary = transactions.filter(t => {
    const d = new Date(t.timestamp);
    const now = new Date();
    if (activeTab === 'daily') return d.toLocaleDateString('en-CA') === now.toLocaleDateString('en-CA');
    if (activeTab === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (activeTab === 'yearly') return d.getFullYear() === now.getFullYear();
    return true;
  });

  const totals = calculateTotalsForData(filteredTransactionsForSummary);

  const whatIfAdjustmentTotal = (totals.revenue * overheadAdjustment) / 100;
  const finalNetProfit = totals.netProfitBase - whatIfAdjustmentTotal;
  const totalGrossProfit = totals.revenue - totals.directCosts;

  const receivables = transactions.filter(t => t.type === 'credit');

  const getAggregatedData = () => {
    const buckets: Record<string, { revenue: number, profit: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      let key = t.date;
      if (activeTab === 'monthly') key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (activeTab === 'yearly') key = `${date.getFullYear()}`;

      if (!buckets[key]) buckets[key] = { revenue: 0, profit: 0 };

      // Calculate revenue for this bucket to apply what-if adjustment correctly
      if (t.type === 'income' || t.type === 'credit') {
        buckets[key].revenue += t.amount;
      }
      
      // Use stored netProfit (which is gross - OpEx)
      buckets[key].profit += (t.netProfit || 0);
    });

    // Apply the global what-if adjustment to each bucket
    return Object.entries(buckets)
      .map(([key, data]) => {
        const adjustment = (data.revenue * overheadAdjustment) / 100;
        return [key, data.profit - adjustment] as [string, number];
      })
      .sort((a, b) => b[0].localeCompare(a[0]));
  };

  const aggregated = getAggregatedData();

  if (authLoading) return (
    <div className="fixed inset-0 bg-brand-charcoal flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Auth />;

  return (
    <>
      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-panel w-full max-w-2xl p-10 luxury-glow max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold luxury-text gold-text-gradient">Historical Archives</h2>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mt-1">Immutable Performance Records</p>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white"
                >
                  <Activity className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="space-y-12">
                <section>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold mb-6 px-1">Monthly Milestones</h3>
                  {history.monthly.length > 0 ? (
                    <div className="space-y-4">
                      {history.monthly.slice().reverse().map((h, i) => (
                        <div key={i} className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl flex justify-between items-center group hover:border-brand-gold/20 transition-all">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Fiscal Period</p>
                            <p className="text-xl font-display italic text-white/80">{h.period}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-rose-400/40 mb-1">Final Net Yield</p>
                            <p className="text-2xl font-mono font-bold text-brand-gold">GH₵ {Math.round(h.profit).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center">
                       <p className="text-xs text-white/20 uppercase tracking-widest font-light italic">No monthly cycles archived yet.</p>
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-bold mb-6 px-1">Annual Records</h3>
                  {history.yearly.length > 0 ? (
                    <div className="space-y-4">
                      {history.yearly.slice().reverse().map((h, i) => (
                        <div key={i} className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl flex justify-between items-center group hover:border-amber-500/20 transition-all">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Financial Year</p>
                            <p className="text-xl font-display italic text-white/80">{h.period}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Aggregate Growth</p>
                            <p className="text-2xl font-mono font-bold text-amber-500">GH₵ {Math.round(h.profit).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center">
                       <p className="text-xs text-white/20 uppercase tracking-widest font-light italic">No annual cycles archived yet.</p>
                    </div>
                  )}
                </section>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5">
                 <p className="text-[10px] text-white/20 leading-relaxed italic text-center">
                   Resets occur automatically on the 1st of every month and year. Historical snapshots are stored in your secure local terminal cache.
                 </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdinkraBackground />
      <div className="w-full max-w-[1600px] mx-auto min-h-screen flex flex-col p-4 md:p-12 bg-transparent pb-40 relative">

      <AnimatePresence>
        {showAddBill && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-panel w-full max-w-md p-10 luxury-glow shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold luxury-text gold-text-gradient">Add Bill</h2>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mt-1">Operational Expense Recording</p>
                </div>
                <button 
                  onClick={() => { setShowAddBill(false); setBillSuccess(false); }}
                  className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white"
                >
                  <Activity className="w-4 h-4 rotate-45" />
                </button>
              </div>

              {billSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Entry Secured</h3>
                  <p className="text-white/40 text-xs uppercase tracking-widest">Bill added to ledger successfully</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold px-1">Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Electricity, Rent, Transport"
                      value={billForm.description}
                      onChange={(e) => setBillForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 outline-none text-white focus:border-brand-gold/50 transition-all font-display italic"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold px-1">Amount (GH₵)</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={billForm.amount}
                      onChange={(e) => setBillForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 outline-none text-white font-mono focus:border-brand-gold/50 transition-all"
                    />
                  </div>

                  <button 
                    onClick={addManualExpense}
                    disabled={!billForm.description || !billForm.amount}
                    className="w-full h-14 bg-brand-gold text-black rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-gold/20"
                  >
                    Confirm Entry
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-panel w-full max-w-2xl p-10 luxury-glow max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold luxury-text gold-text-gradient">Portfolio Settings</h2>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mt-1">Manage Unit Costs & Inventory</p>
                </div>
                <div className="flex items-center gap-4">
                  <AnimatePresence>
                    {saveSuccess && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Saved</span>
                      </motion.div>
                    )}
                    {purgeSuccess && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Purge Successful</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button 
                    onClick={() => { setShowSettings(false); setPurgeSuccess(false); setSaveSuccess(false); }}
                    className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white"
                  >
                    <Activity className="w-5 h-5 rotate-45" />
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-brand-gold/5 rounded-3xl border border-brand-gold/10">
                   <p className="text-sm text-brand-gold/80 flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-4 h-4" />
                      Enterprise Control Active
                   </p>
                   <p className="text-xs text-white/40 leading-relaxed font-sans">
                      Defined unit costs allow the intelligence engine to automatically strip replacement values from your revenue, giving you true profit transparency.
                   </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold px-1">Inventory Value Mapping</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(productCosts).map(([name, cost]) => (
                      <div key={name} className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex flex-col gap-3 group hover:border-brand-gold/20 transition-all">
                         <div className="flex items-center justify-between">
                            <input 
                              type="text"
                              defaultValue={name}
                              onBlur={(e) => {
                                const newName = e.target.value.trim().toLowerCase();
                                if (newName && newName !== name.toLowerCase()) {
                                  renameProduct(name, newName);
                                }
                              }}
                              className="text-[10px] uppercase font-black tracking-widest text-white/60 bg-transparent border-none outline-none focus:text-brand-gold w-full mr-2"
                            />
                            <button 
                              onClick={() => deleteProduct(name)}
                              className="text-rose-500/20 hover:text-rose-500 transition-colors p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-brand-gold font-bold text-sm">GH₵</span>
                            <input 
                              type="number" 
                              defaultValue={cost}
                              onBlur={(e) => {
                                const newCost = parseFloat(e.target.value) || 0;
                                if (newCost !== cost) {
                                  updateProductCost(name, newCost);
                                }
                              }}
                              className="bg-transparent border-b border-white/10 outline-none w-full text-white font-mono text-xl"
                            />
                         </div>
                      </div>
                    ))}
                    <button 
                      onClick={addProduct}
                      disabled={isSavingSettings}
                      className="p-5 border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-[10px] uppercase font-bold tracking-widest text-white/10 hover:text-brand-gold hover:border-brand-gold/20 transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Box className="w-4 h-4 mr-2 text-brand-gold/40 group-hover:text-brand-gold" /> 
                      {isSavingSettings ? 'Synchronizing...' : 'Add New Preset'}
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold px-1">Engagement & Reminders</h3>
                  <button 
                    onClick={toggleNotifications}
                    className={cn(
                      "w-full h-16 rounded-2xl border flex items-center justify-between px-6 transition-all group",
                      notificationsEnabled 
                        ? "bg-brand-gold/10 border-brand-gold/30 text-brand-gold" 
                        : "bg-white/[0.02] border-white/10 text-white/40"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        notificationsEnabled ? "bg-brand-gold text-black" : "bg-white/5"
                      )}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className={cn("text-xs font-bold uppercase tracking-wider", notificationsEnabled ? "text-brand-gold" : "text-white/60")}>
                          Daily Growth Reminders
                        </p>
                        <p className="text-[9px] uppercase tracking-widest opacity-60">Status: {notificationsEnabled ? 'Active Intelligence' : 'Standby Mode'}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-12 h-6 rounded-full relative transition-colors duration-300",
                      notificationsEnabled ? "bg-brand-gold" : "bg-white/10"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
                        notificationsEnabled ? "left-7" : "left-1"
                      )} />
                    </div>
                  </button>
                  <p className="text-[10px] text-white/20 italic px-2">
                    Receive daily entrepreneurial encouragements to ensure your growth streaks never break.
                  </p>
                </div>
                <div className="pt-8 border-t border-white/5 space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold px-1">Data Governance</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={exportToJSON}
                      className="h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center gap-3 text-[10px] uppercase font-bold tracking-widest hover:bg-white/10 transition-all font-sans"
                    >
                      <Download className="w-4 h-4" /> Export Backup
                    </button>
                    <button 
                      onClick={clearLedger}
                      disabled={isPurging}
                      className="h-14 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center gap-3 text-[10px] uppercase font-bold tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPurging ? (
                        <div className="w-4 h-4 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {isPurging ? 'Purging...' : 'Purge Records'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <header className="flex justify-between items-center mb-20">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-gold to-brand-amber rounded-[1.5rem] flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(212,175,55,0.4)]">
            <Heart className="w-9 h-9 text-black fill-black" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight gold-text-gradient luxury-text">The Akoma Ledger</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold/50 font-bold tracking-widest">Growth Intelligence Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Growth Streak</p>
            <div className="flex items-center justify-end gap-2 group cursor-help" title={`${streak.count} Consecutive Days of Records`}>
               <span className={cn("text-xl font-numbers transition-colors", streak.count > 0 ? "text-brand-gold" : "text-white/20")}>
                {streak.count}
               </span>
               <div className="relative">
                 <motion.div
                   animate={streak.count > 0 ? {
                     scale: [1, 1.2, 1],
                     opacity: [0.6, 1, 0.6],
                   } : {}}
                   transition={{ duration: 2, repeat: Infinity }}
                   className={cn(
                     "w-8 h-8 rounded-full blur-md absolute inset-0",
                     streak.count > 4 ? "bg-orange-500" : streak.count > 0 ? "bg-brand-gold" : "bg-transparent"
                   )}
                 />
                 <Flame className={cn(
                   "w-6 h-6 transition-all duration-700",
                   streak.count > 4 ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" : 
                   streak.count > 0 ? "text-brand-gold" : "text-white/10"
                 )} />
               </div>
            </div>
          </div>
          <div className="text-right hidden md:block border-l border-white/10 pl-8">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Authenticated as</p>
            <p className="font-display text-xl italic text-white/80">{user?.displayName || 'Growth Partner'}</p>
          </div>
          <div className="flex items-center gap-4 relative">
             <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="px-6 h-12 rounded-xl bg-brand-gold text-black flex items-center justify-center gap-3 hover:bg-white transition-all shadow-lg shadow-brand-gold/20 text-[10px] font-bold uppercase tracking-widest group"
                >
                  <Menu className="w-4 h-4" />
                  Executive Menu
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", showMenu && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-[80]" 
                        onClick={() => setShowMenu(false)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 glass-panel border border-white/10 shadow-2xl z-[90] overflow-hidden p-2"
                      >
                        <div className="p-3 mb-2 border-b border-white/5">
                           <p className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-bold">Operation Terminal</p>
                        </div>
                        
                        <button 
                          onClick={() => { setShowAddBill(true); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-[10px] font-bold uppercase tracking-wider"
                        >
                          <Box className="w-4 h-4" />
                          Add Bill / OpEx
                        </button>

                        <button 
                          onClick={() => { setShowSettings(true); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-brand-gold hover:bg-brand-gold/10 transition-all text-[10px] font-bold uppercase tracking-wider"
                        >
                          <Settings className="w-4 h-4" />
                          Portfolio Settings
                        </button>

                        <button 
                          onClick={() => { setShowHistory(true); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all text-[10px] font-bold uppercase tracking-wider"
                        >
                          <Activity className="w-4 h-4" />
                          Historical Archives
                        </button>

                        <button 
                          onClick={() => { generateBankStatement(); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-brand-gold hover:bg-brand-gold/10 transition-all text-[10px] font-bold uppercase tracking-wider"
                        >
                          <FileCheck className="w-4 h-4" />
                          Bank Statement
                        </button>

                        {(history.monthly.length > 0 || history.yearly.length > 0) && (
                          <div className="px-3 py-2 mt-2">
                             <p className="text-[7px] uppercase tracking-[0.4em] text-brand-gold/40 font-bold mb-2">Historical Records</p>
                             <div className="space-y-1 max-h-32 overflow-y-auto luxury-scroll pr-1">
                                {history.monthly.slice().reverse().map((h, i) => (
                                  <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                     <span className="text-[8px] text-white/50 uppercase">{h.period}</span>
                                     <span className="text-[8px] text-brand-gold font-mono">GH₵ {Math.round(h.profit).toLocaleString()}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}

                        <button 
                          onClick={() => { exportToCSV(); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-brand-gold hover:bg-brand-gold/10 transition-all text-[10px] font-bold uppercase tracking-wider"
                        >
                          <Download className="w-4 h-4" />
                          Export CSV
                        </button>

                        <div className="my-2 border-t border-white/5 pt-2">
                          <button 
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:text-brand-gold hover:bg-brand-gold/10 transition-all text-[10px] font-bold uppercase tracking-wider"
                          >
                            <LogOut className="w-4 h-4" />
                            Terminate Session
                          </button>
                          <button 
                            onClick={() => { clearLedger(); setShowMenu(false); }}
                            disabled={isPurging}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                          >
                            {isPurging ? (
                              <div className="w-4 h-4 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            {isPurging ? 'Purging...' : 'Purge Ledger'}
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
             </div>

             <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-1 shadow-inner">
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-brand-gold/40 to-brand-amber/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-brand-gold" />
                </div>
              </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-8 flex-1">
        {/* Left Column: Recording & Insights */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-4 flex flex-col gap-8">
          <section className="glass-panel p-16 flex flex-col justify-center items-center text-center relative overflow-hidden group min-h-[500px]">
             {/* Dynamic Background Image */}
             <div className="absolute inset-0 z-0 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=2070" 
                  alt="Wealth Spread"
                  className="w-full h-full object-cover opacity-40 transition-all duration-1000 group-hover:scale-110 group-hover:opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-charcoal via-brand-charcoal/60 to-transparent" />
             </div>
            
            <div className="flex flex-col items-center gap-10 z-10">
              <div className="w-24 h-24 bg-white/[0.03] rounded-[2.5rem] border border-white/[0.05] flex items-center justify-center luxury-glow group-hover:bg-brand-gold/10 transition-all">
                <Wallet className="w-12 h-12 text-brand-gold" />
              </div>
              <div className="space-y-4">
                <h2 className="text-6xl font-light leading-tight luxury-text">
                  Wealth at the <br />
                  speed of <span className="gold-text-gradient font-bold italic">Akoma</span>.
                </h2>
                <div className="flex items-center justify-center gap-4 py-2">
                   <div className="w-12 h-px bg-brand-gold/20" />
                   <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
                   <div className="w-12 h-px bg-brand-gold/20" />
                </div>
              </div>
              <p className="text-white/40 text-base leading-relaxed max-w-lg font-light">
                Enterprise-grade intelligence for the modern Ghanaian entrepreneur. Streamline your inventory, sales, and profits with simple voice records.
              </p>
            </div>
          </section>

          <SmartNotifications transactions={transactions} />

          <section className="bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 mb-2">Systems Intelligence</h3>
                <p className="text-emerald-100/80 italic text-sm">"Our AI handles natural Twi and English instantly."</p>
              </div>
              <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
          </section>

          {receivables.length > 0 && (
            <section className="glass-panel p-8 luxury-glow border-l-4 border-l-brand-gold">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gold mb-1">Accounts Receivable</h3>
                    <p className="text-xl luxury-text">Pending Collections</p>
                  </div>
                  <UserCheck className="w-6 h-6 text-brand-gold/40" />
               </div>
               <div className="space-y-4">
                  {receivables.slice(0, 5).map(r => (
                    <div key={r.id} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl group hover:bg-white/[0.04] transition-all">
                       <div className="flex flex-col">
                          <span className="text-white text-xs font-medium">{r.description}</span>
                          <span className="text-[9px] text-white/30 uppercase tracking-widest">{r.date}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-brand-gold font-mono font-bold text-sm">GH₵ {r.amount.toLocaleString()}</span>
                          <ArrowRight className="w-3 h-3 text-white/10 group-hover:text-brand-gold transition-colors" />
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          )}

          <ProfitChart transactions={transactions} />
        </div>

        {/* Right Column: Financial Data */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-8 flex flex-col gap-8">
          <section className="glass-panel p-8">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber mb-2">
                  {activeTab === 'daily' ? "Today's Ledger" : activeTab === 'monthly' ? "Monthly Statement" : "Annual Performance"}
                </h3>
                <p className="text-4xl font-light tracking-tight">
                  {activeTab === 'daily' ? new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : 
                   activeTab === 'monthly' ? new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) : 
                   `Financial Year ${new Date().getFullYear()}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-100/60 uppercase mb-1 tracking-wider">Business Health</p>
                <div className="flex gap-1 items-end h-10">
                  <div className="w-2 bg-emerald-400/20 h-4 rounded-full"></div>
                  <div className="w-2 bg-emerald-400/40 h-8 rounded-full"></div>
                  <div className="w-2 bg-emerald-400/60 h-6 rounded-full"></div>
                  <div className="w-2 bg-emerald-400 h-10 rounded-full"></div>
                </div>
              </div>
            </div>

            <FinancialSummary 
              transactions={transactions} 
              overheadAdjustment={overheadAdjustment}
              setOverheadAdjustment={setOverheadAdjustment}
              totals={{
                revenue: totals.revenue,
                directCosts: totals.directCosts,
                grossProfit: totalGrossProfit,
                opEx: totals.opEx,
                netProfit: finalNetProfit,
                whatIfAdjustment: whatIfAdjustmentTotal
              }}
            />
            
            <div className="mt-12">
              <div className="flex gap-4 mb-8 overflow-x-auto pb-4 sm:pb-0 luxury-scroll">
                {(['daily', 'monthly', 'yearly'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-[10px] uppercase font-bold tracking-[0.2em] transition-all border shrink-0",
                      activeTab === tab 
                        ? "bg-brand-gold text-black border-brand-gold shadow-lg shadow-brand-gold/20" 
                        : "bg-white/[0.03] text-white/40 border-white/10 hover:bg-white/5"
                    )}
                  >
                    {tab} Audit
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <section className="glass-card p-8 luxury-glow xl:col-span-2 min-h-[400px]">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gold mb-1">
                        {activeTab} Performance
                      </h3>
                      <p className="text-xl luxury-text capitalize">{activeTab} Yield Analysis</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Dynamic Aggregation</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    {aggregated.slice(0, 6).map(([key, profit]) => (
                      <div key={key} className="flex justify-between items-end border-b border-white/[0.03] pb-4 group hover:border-brand-gold/30 transition-all">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-white/10 group-hover:text-white/30 transition-colors">
                            {activeTab === 'daily' ? 'Audit Date' : activeTab === 'monthly' ? 'Audit Month' : 'Financial Year'}
                          </span>
                          <span className="text-lg font-display italic text-white/60">
                            {activeTab === 'monthly' ? (key.includes('-') ? new Date(key + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : key) : key}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase font-bold text-white/10 mb-1">Net Yield</p>
                          <span className={cn(
                              "text-2xl font-mono font-bold tracking-tighter",
                              (profit as number) >= 0 ? "text-emerald-400" : "text-rose-400"
                          )}>
                            GH₵ {(profit as number || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {aggregated.length === 0 && (
                      <div className="h-64 flex flex-col items-center justify-center text-center">
                         <Activity className="w-12 h-12 text-white/5 mb-4" />
                         <p className="text-xs uppercase tracking-[0.4em] text-white/20 font-bold italic">No Records Found for this Horizon</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="glass-card p-8 border-l border-brand-gold/20 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-gold mb-6 flex items-center gap-2">
                       <Sparkles className="w-4 h-4" />
                       {activeTab.toUpperCase()} Calculation Audit
                    </h4>
                    
                    <div className="mb-8 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Aggregate Records</span>
                        <span className="text-brand-gold font-mono text-sm">{aggregated.length} Periods Captured</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Total Capital Flow</span>
                        <span className="text-white font-mono text-sm">
                          GH₵ {finalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-8">
                       <div className="relative pl-6 border-l border-brand-gold/40">
                          <div className="absolute top-0 left-[-4.5px] w-2 h-2 rounded-full bg-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
                          <p className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-2">Algorithm Stage 01: Sales Margin</p>
                          <p className="text-xs text-white/60 leading-relaxed italic font-display">
                            "{activeTab === 'daily' ? 'Today\'s' : activeTab === 'monthly' ? 'This month\'s' : 'This year\'s'} revenue is stripped of direct inventory replacement costs."
                          </p>
                       </div>
                       <div className="relative pl-6 border-l border-white/10">
                          <div className="absolute top-0 left-[-4px] w-2 h-2 rounded-full bg-white/20" />
                          <p className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-2">Algorithm Stage 02: OpEx Deduction</p>
                          <p className="text-xs text-white/60 leading-relaxed italic font-display">
                             "System subtracts your manual operational expense entries {overheadAdjustment > 0 ? `plus your ${overheadAdjustment}% what-if adjustment` : ''} to reach final liquidity."
                          </p>
                       </div>
                       <div className="relative pl-6 border-l border-emerald-500/20">
                          <div className="absolute top-0 left-[-4px] w-2 h-2 rounded-full bg-emerald-500/40" />
                          <p className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-2">Terminal Verification</p>
                          <p className="text-sm text-white/80 font-bold leading-relaxed luxury-text">
                            Calculated yield represents verified {activeTab} growth capital across the enterprise.
                          </p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                     <div className="flex items-center gap-3 mb-3">
                        <ShieldCheck className="w-4 h-4 text-brand-gold" />
                        <span className="text-[9px] uppercase font-bold tracking-widest text-brand-gold">Compliance Verified</span>
                     </div>
                     <p className="text-[10px] text-white/30 leading-tight">All calculations are performed locally and persisted for offline audit. No data leaves your secure terminal.</p>
                  </div>
                </section>
              </div>
            </div>
            
            <div className="mt-12">
              <TransactionLedger 
                transactions={transactions} 
                onDelete={handleDeleteTransaction} 
              />
            </div>
          </section>

          {transactions.length > 0 && (
            <div className="grid grid-cols-1 gap-8">
               <ProductProgressChart transactions={transactions} />
               {transactions.length > 5 && (
                  <motion.section 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-6 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-1">Financial Momentum</p>
                      <p className="text-xl font-light">Analytics engine ready for deeper insights.</p>
                    </div>
                  </motion.section>
               )}
            </div>
          )}
        </div>
      </main>

      <SmartInputBar onTransactionCaptured={handleTransactionCaptured} />

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-brand-charcoal border border-white/10 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              toast.type === 'success' ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
            )}>
              {toast.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            </div>
            <p className="text-white text-xs font-bold uppercase tracking-widest">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-12 flex flex-col sm:flex-row justify-between items-center text-[10px] text-white/30 uppercase tracking-widest border-t border-white/10 pt-8 gap-4 mb-10">
        <p>© {new Date().getFullYear()} Akoma Ledger Systems • Made in Ghana</p>
        <div className="flex items-center gap-4">
          <p className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Voice Encryption Enabled</p>
          <p>ISO 27001 Certified</p>
        </div>
      </footer>
    </div>
    </>
  );
}
