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

export default function App() {
  // State for Transactions & Data with local storage fallback
  const [incomes, setIncomes] = useState<IncomeTransaction[]>(() => {
    const saved = localStorage.getItem('ekklesia_incomes');
    return saved ? JSON.parse(saved) : INITIAL_INCOMES;
  });

  const [expenses, setExpenses] = useState<ExpenseTransaction[]>(() => {
    const saved = localStorage.getItem('ekklesia_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [budgets] = useState<BudgetItem[]>(INITIAL_BUDGET);
  const [churchInfo] = useState<ChurchInfo>(INITIAL_CHURCH_INFO);

  // User & RBAC
  const [allUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]); // Default: Bendahara
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Active view tab & period
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

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

  // Handler: Delete Expense
  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateSyncState = (newState: Partial<SheetsSyncState>) => {
    setSyncState((prev) => ({ ...prev, ...newState }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        churchInfo={churchInfo}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        syncState={syncState}
        onOpenSyncModal={() => setActiveTab('sheets')}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            incomes={incomes}
            expenses={expenses}
            budgets={budgets}
            churchInfo={churchInfo}
            syncState={syncState}
            onNavigateTab={setActiveTab}
            selectedMonth={selectedMonth}
          />
        )}

        {activeTab === 'income' && (
          <IncomeManager
            incomes={incomes}
            onAddIncome={handleAddIncome}
            onDeleteIncome={handleDeleteIncome}
            userRole={currentUser.role}
            userName={currentUser.name}
          />
        )}

        {activeTab === 'expense' && (
          <ExpenseManager
            expenses={expenses}
            onAddExpense={handleAddExpense}
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
          setIsRoleModalOpen(false);
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
