/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  IncomeTransaction,
  ExpenseTransaction,
  BudgetItem,
  ChurchInfo,
  UserProfile,
  SheetsSyncState,
} from './types/finance';
import {
  INITIAL_CHURCH_INFO,
  INITIAL_USERS,
  INITIAL_BUDGET,
  INITIAL_INCOMES,
  INITIAL_EXPENSES,
} from './data/initialData';
import { initAuth, getAccessToken } from './services/googleAuth';
import { appendRowToSheet } from './services/googleSheets';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { IncomeManager } from './components/IncomeManager';
import { ExpenseManager } from './components/ExpenseManager';
import { ISAK35Report } from './components/ISAK35Report';
import { MonthlyReportPrint } from './components/MonthlyReportPrint';
import { GoogleSheetsSync } from './components/GoogleSheetsSync';
import { RoleManagerModal } from './components/RoleManagerModal';
import { LoginScreen } from './components/LoginScreen';
import { ShieldAlert, X } from 'lucide-react';

export default function App() {
  // Authentication & Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedSession = sessionStorage.getItem('ekklesia_auth_user');
    const savedLocal = localStorage.getItem('ekklesia_auth_user');
    return !!(savedSession || savedLocal);
  });

  // State for Transactions & Data with local storage fallback
  const [incomes, setIncomes] = useState<IncomeTransaction[]>(() => {
    const saved = localStorage.getItem('ekklesia_incomes');
    if (!saved) return INITIAL_INCOMES;
    try {
      const parsed: IncomeTransaction[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((i) => i.id));
      const missing = INITIAL_INCOMES.filter((i) => !existingIds.has(i.id));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_INCOMES;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseTransaction[]>(() => {
    const saved = localStorage.getItem('ekklesia_expenses');
    if (!saved) return INITIAL_EXPENSES;
    try {
      const parsed: ExpenseTransaction[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((e) => e.id));
      const missing = INITIAL_EXPENSES.filter((e) => !existingIds.has(e.id));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [budgets] = useState<BudgetItem[]>(INITIAL_BUDGET);
  const [churchInfo] = useState<ChurchInfo>(INITIAL_CHURCH_INFO);

  // User & RBAC
  const [allUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = sessionStorage.getItem('ekklesia_auth_user') || localStorage.getItem('ekklesia_auth_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = INITIAL_USERS.find((u) => u.id === parsed.id || u.email === parsed.email);
        return match || parsed;
      } catch {
        return INITIAL_USERS[0];
      }
    }
    return INITIAL_USERS[0]; // Default: Bendahara
  });
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [rbacNotification, setRbacNotification] = useState<string | null>(null);

  // Active view tab & period
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Dark / Light Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ekklesia_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('ekklesia_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Google Sheets sync state
  const [syncState, setSyncState] = useState<SheetsSyncState>(() => {
    const saved = localStorage.getItem('ekklesia_sync_state');
    return saved
      ? JSON.parse(saved)
      : {
          isConnected: false,
          spreadsheetId: null,
          spreadsheetUrl: null,
          spreadsheetTitle: null,
          lastSyncedAt: null,
          isSyncing: false,
          syncError: null,
        };
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ekklesia_incomes', JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem('ekklesia_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('ekklesia_sync_state', JSON.stringify(syncState));
  }, [syncState]);

  // Initialize Firebase Auth listener for Google account status
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setSyncState((prev) => ({
          ...prev,
          isConnected: true,
        }));
      },
      () => {
        // Not logged in or logged out
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Handler: Add Income
  const handleAddIncome = async (newIncomeData: Omit<IncomeTransaction, 'id' | 'createdBy'>) => {
    const nextId = `INC-${newIncomeData.tanggal.replace(/-/g, '').slice(0, 6)}-${String(
      incomes.length + 1
    ).padStart(3, '0')}`;

    const newIncome: IncomeTransaction = {
      ...newIncomeData,
      id: nextId,
      createdBy: `${currentUser.name} (${currentUser.role})`,
      syncedToSheets: false,
    };

    setIncomes((prev) => [newIncome, ...prev]);

    // Background append to Google Sheet if connected and sheet is configured
    if (syncState.spreadsheetId) {
      try {
        const token = await getAccessToken();
        if (token) {
          await appendRowToSheet(token, syncState.spreadsheetId, 'Pemasukan', [
            newIncome.id,
            newIncome.tanggal,
            newIncome.jenisPersembahan,
            newIncome.nominal,
            newIncome.keterangan,
            newIncome.namaJemaat || 'Anonim',
            newIncome.ibadah,
            newIncome.metode,
            newIncome.tipeAsetNeto === 'tanpa_pembatasan'
              ? 'Tanpa Pembatasan'
              : 'Dengan Pembatasan',
            newIncome.createdBy,
          ]);

          setIncomes((prev) =>
            prev.map((i) => (i.id === newIncome.id ? { ...i, syncedToSheets: true } : i))
          );
        }
      } catch (err) {
        console.warn('Auto-append to Google Sheets failed:', err);
      }
    }
  };

  // Handler: Delete Income
  const handleDeleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  };

  // Handler: Mark specific or all unsynced incomes as synced to Google Sheets
  const handleSyncIncomes = (incomeIds?: string[]) => {
    const targetSet = incomeIds ? new Set(incomeIds) : null;
    setIncomes((prev) => {
      const updated = prev.map((item) => {
        if (!item.syncedToSheets && (!targetSet || targetSet.has(item.id))) {
          return { ...item, syncedToSheets: true };
        }
        return item;
      });
      localStorage.setItem('ekklesia_incomes', JSON.stringify(updated));
      return updated;
    });

    setSyncState((prev) => {
      const updated: SheetsSyncState = {
        ...prev,
        lastSyncedAt:
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      };
      localStorage.setItem('ekklesia_sync_state', JSON.stringify(updated));
      return updated;
    });
  };

  // Handler: Add a simulated unsynced income dated 2 days ago (>24h) for easy demo testing
  const handleSimulateUnsyncedIncome = () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString().slice(0, 10);
    const mockUnsynced: IncomeTransaction = {
      id: `INC-${twoDaysAgo.replace(/-/g, '').slice(0, 6)}-${String(incomes.length + 1).padStart(3, '0')}`,
      tanggal: twoDaysAgo,
      jenisPersembahan: 'Persembahan Umum / Kantong Kolekte',
      nominal: 8500000,
      keterangan: 'Kolekte Ibadah Raya belum disinkronkan (>24 Jam)',
      namaJemaat: 'Kantong Kolekte Bersama',
      ibadah: 'Ibadah Raya 1',
      metode: 'Tunai (Kas Kecil)',
      tipeAsetNeto: 'tanpa_pembatasan',
      createdBy: `${currentUser.name} (${currentUser.role})`,
      syncedToSheets: false,
    };
    setIncomes((prev) => {
      const updated = [mockUnsynced, ...prev];
      localStorage.setItem('ekklesia_incomes', JSON.stringify(updated));
      return updated;
    });
  };

  // Handler: Bulk Add Incomes
  const handleBulkAddIncomes = async (
    newIncomesData: Omit<IncomeTransaction, 'id' | 'createdBy'>[]
  ) => {
    const currentCount = incomes.length;
    const newItems: IncomeTransaction[] = newIncomesData.map((item, idx) => {
      const nextId = `INC-${item.tanggal.replace(/-/g, '').slice(0, 6)}-${String(
        currentCount + idx + 1
      ).padStart(3, '0')}`;
      return {
        ...item,
        id: nextId,
        createdBy: `${currentUser.name} (${currentUser.role})`,
        syncedToSheets: false,
      };
    });

    setIncomes((prev) => [...newItems, ...prev]);

    // Background append to Google Sheet if connected
    if (syncState.spreadsheetId) {
      try {
        const token = await getAccessToken();
        if (token) {
          for (const item of newItems) {
            await appendRowToSheet(token, syncState.spreadsheetId, 'Pemasukan', [
              item.id,
              item.tanggal,
              item.jenisPersembahan,
              item.nominal,
              item.keterangan,
              item.namaJemaat || 'Anonim',
              item.ibadah,
              item.metode,
              item.tipeAsetNeto === 'tanpa_pembatasan'
                ? 'Tanpa Pembatasan'
                : 'Dengan Pembatasan',
              item.createdBy,
            ]);
          }
          setIncomes((prev) =>
            prev.map((i) =>
              newItems.some((n) => n.id === i.id) ? { ...i, syncedToSheets: true } : i
            )
          );
        }
      } catch (err) {
        console.warn('Auto-append bulk incomes to Google Sheets failed:', err);
      }
    }
  };

  // Handler: Add Expense
  const handleAddExpense = async (
    newExpenseData: Omit<ExpenseTransaction, 'id' | 'createdBy'>
  ) => {
    const nextId = `EXP-${newExpenseData.tanggal.replace(/-/g, '').slice(0, 6)}-${String(
      expenses.length + 1
    ).padStart(3, '0')}`;

    const newExpense: ExpenseTransaction = {
      ...newExpenseData,
      id: nextId,
      createdBy: `${currentUser.name} (${currentUser.role})`,
      syncedToSheets: false,
    };

    setExpenses((prev) => [newExpense, ...prev]);

    // Background append to Google Sheet if connected
    if (syncState.spreadsheetId) {
      try {
        const token = await getAccessToken();
        if (token) {
          await appendRowToSheet(token, syncState.spreadsheetId, 'Pengeluaran', [
            newExpense.id,
            newExpense.tanggal,
            newExpense.kategori,
            newExpense.nominal,
            newExpense.keterangan,
            newExpense.penerima,
            newExpense.nomorBukti,
            newExpense.metode,
            newExpense.posISAK35,
            newExpense.createdBy,
          ]);

          setExpenses((prev) =>
            prev.map((e) => (e.id === newExpense.id ? { ...e, syncedToSheets: true } : e))
          );
        }
      } catch (err) {
        console.warn('Auto-append to Google Sheets failed:', err);
      }
    }
  };

  // Handler: Bulk Add Expenses
  const handleBulkAddExpenses = async (
    newExpensesData: Omit<ExpenseTransaction, 'id' | 'createdBy'>[]
  ) => {
    const currentCount = expenses.length;
    const newItems: ExpenseTransaction[] = newExpensesData.map((item, idx) => {
      const nextId = `EXP-${item.tanggal.replace(/-/g, '').slice(0, 6)}-${String(
        currentCount + idx + 1
      ).padStart(3, '0')}`;
      return {
        ...item,
        id: nextId,
        createdBy: `${currentUser.name} (${currentUser.role})`,
        syncedToSheets: false,
      };
    });

    setExpenses((prev) => [...newItems, ...prev]);

    // Background append to Google Sheet if connected
    if (syncState.spreadsheetId) {
      try {
        const token = await getAccessToken();
        if (token) {
          for (const item of newItems) {
            await appendRowToSheet(token, syncState.spreadsheetId, 'Pengeluaran', [
              item.id,
              item.tanggal,
              item.kategori,
              item.nominal,
              item.keterangan,
              item.penerima,
              item.nomorBukti,
              item.metode,
              item.posISAK35,
              item.createdBy,
            ]);
          }
          setExpenses((prev) =>
            prev.map((e) =>
              newItems.some((n) => n.id === e.id) ? { ...e, syncedToSheets: true } : e
            )
          );
        }
      } catch (err) {
        console.warn('Auto-append bulk expenses to Google Sheets failed:', err);
      }
    }
  };

  // Handler: Delete Expense
  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateSyncState = (newState: Partial<SheetsSyncState>) => {
    setSyncState((prev) => ({ ...prev, ...newState }));
  };

  // Handler: Login Success
  const handleLoginSuccess = (user: UserProfile, remember: boolean) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (remember) {
      localStorage.setItem('ekklesia_auth_user', JSON.stringify(user));
    } else {
      sessionStorage.setItem('ekklesia_auth_user', JSON.stringify(user));
    }
    if (user.role === 'jemaat' && (activeTab === 'income' || activeTab === 'expense' || activeTab === 'sheets')) {
      setActiveTab('dashboard');
    }
  };

  // Handler: Logout
  const handleLogout = () => {
    localStorage.removeItem('ekklesia_auth_user');
    sessionStorage.removeItem('ekklesia_auth_user');
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setRbacNotification(null);
  };

  // Handler: Role-Based Tab Navigation
  const handleTabChange = (tab: string) => {
    if (currentUser.role === 'jemaat' && (tab === 'income' || tab === 'expense' || tab === 'sheets')) {
      const tabLabels: Record<string, string> = {
        income: 'Pencatatan Pemasukan',
        expense: 'Pencatatan Pengeluaran',
        sheets: 'Sinkronisasi Google Sheets',
      };
      setRbacNotification(
        `Akses Dibatasi (RBAC): Modul "${tabLabels[tab]}" hanya diperuntukkan bagi Bendahara atau Admin Majelis Jemaat demi perlindungan integritas kas gereja.`
      );
      setTimeout(() => setRbacNotification(null), 6000);
      return;
    }
    setRbacNotification(null);
    setActiveTab(tab);
  };

  // Calculate how many budget items exceed 90% in the selected month
  const alertCount = budgets.filter((b) => {
    const spent = expenses
      .filter((e) => e.tanggal.startsWith(selectedMonth))
      .reduce((sum, e) => (e.kategori === b.kategori ? sum + e.nominal : sum), 0);
    return b.anggaranBulanan > 0 && spent / b.anggaranBulanan >= 0.9;
  }).length;

  // Count unsynced income transactions older than 24 hours
  const unsyncedIncomeCount = incomes.filter((item) => {
    if (item.syncedToSheets) return false;
    if (!item.tanggal) return false;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const isBeforeToday = item.tanggal < todayStr;
    const txDateTime = new Date(`${item.tanggal}T00:00:00`).getTime();
    const diffHours = (now.getTime() - txDateTime) / (1000 * 60 * 60);
    return isBeforeToday || diffHours >= 24;
  }).length;

  // If user is not authenticated, display login portal
  if (!isAuthenticated) {
    return (
      <LoginScreen
        allUsers={allUsers}
        churchInfo={churchInfo}
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentUser={currentUser}
        churchInfo={churchInfo}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        syncState={syncState}
        onOpenSyncModal={() => handleTabChange('sheets')}
        alertCount={alertCount}
        unsyncedIncomeCount={unsyncedIncomeCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* RBAC Restriction Alert Toast */}
        {rbacNotification && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{rbacNotification}</span>
            </div>
            <button
              onClick={() => setRbacNotification(null)}
              className="text-amber-700 dark:text-amber-300 hover:opacity-75 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            incomes={incomes}
            expenses={expenses}
            budgets={budgets}
            churchInfo={churchInfo}
            syncState={syncState}
            onNavigateTab={handleTabChange}
            selectedMonth={selectedMonth}
            userRole={currentUser.role}
            onSyncIncomes={handleSyncIncomes}
            onSimulateUnsyncedIncome={handleSimulateUnsyncedIncome}
          />
        )}

        {activeTab === 'income' && (
          <IncomeManager
            incomes={incomes}
            onAddIncome={handleAddIncome}
            onBulkAddIncomes={handleBulkAddIncomes}
            onDeleteIncome={handleDeleteIncome}
            userRole={currentUser.role}
            userName={currentUser.name}
          />
        )}

        {activeTab === 'expense' && (
          <ExpenseManager
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onBulkAddExpenses={handleBulkAddExpenses}
            onDeleteExpense={handleDeleteExpense}
            userRole={currentUser.role}
            userName={currentUser.name}
          />
        )}

        {activeTab === 'isak35' && (
          <ISAK35Report
            incomes={incomes}
            expenses={expenses}
            churchInfo={churchInfo}
            selectedYear={parseInt(selectedMonth.slice(0, 4), 10) || 2026}
          />
        )}

        {activeTab === 'print' && (
          <MonthlyReportPrint
            incomes={incomes}
            expenses={expenses}
            churchInfo={churchInfo}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsSync
            incomes={incomes}
            expenses={expenses}
            churchInfo={churchInfo}
            syncState={syncState}
            onUpdateSyncState={handleUpdateSyncState}
            userEmail={currentUser.email}
          />
        )}
      </main>

      {/* Role Manager Modal */}
      <RoleManagerModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={(u) => {
          setCurrentUser(u);
          localStorage.setItem('ekklesia_auth_user', JSON.stringify(u));
          setIsRoleModalOpen(false);
          if (u.role === 'jemaat' && (activeTab === 'income' || activeTab === 'expense' || activeTab === 'sheets')) {
            setActiveTab('dashboard');
          }
        }}
      />

      {/* Footer (Hidden when printing PDF) */}
      <footer className="no-print mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {churchInfo.namaGereja}
            </span>
            <span>•</span>
            <span>Kepatuhan Standar Akuntansi Nonlaba ISAK 35</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Google Spreadsheet API v4</span>
            <span>•</span>
            <span>Format Warta Cetak A4 / PDF</span>
            <span>•</span>
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
