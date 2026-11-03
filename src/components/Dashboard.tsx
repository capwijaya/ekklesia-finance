import React from 'react';
import {
  IncomeTransaction,
  ExpenseTransaction,
  BudgetItem,
  ChurchInfo,
  SheetsSyncState,
  UserRole,
} from '../types/finance';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { FinanceCharts } from './FinanceCharts';
import { BudgetBreakdownChart } from './BudgetBreakdownChart';
import { BudgetAlertNotification } from './BudgetAlertNotification';
import { UnsyncedIncomeNotification } from './UnsyncedIncomeNotification';
import { IncomeExpenseTrendChart } from './IncomeExpenseTrendChart';
import { AnnualIncomeExpenseBarChart } from './AnnualIncomeExpenseBarChart';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Building,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  Plus,
  Layers,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface DashboardProps {
  incomes: IncomeTransaction[];
  expenses: ExpenseTransaction[];
  budgets: BudgetItem[];
  churchInfo: ChurchInfo;
  syncState: SheetsSyncState;
  onNavigateTab: (tab: string) => void;
  selectedMonth: string;
  userRole?: UserRole;
  onSyncIncomes?: (incomeIds?: string[]) => void;
  onSimulateUnsyncedIncome?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  incomes,
  expenses,
  budgets,
  churchInfo,
  syncState,
  onNavigateTab,
  selectedMonth,
  userRole = 'bendahara',
  onSyncIncomes,
  onSimulateUnsyncedIncome,
}) => {
  // Aggregate calculations
  const totalIncome = incomes.reduce((sum, i) => sum + i.nominal, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.nominal, 0);
  const netBalance = totalIncome - totalExpense;

  // Month specific totals
  const currentMonthIncomes = incomes.filter((i) => i.tanggal.startsWith(selectedMonth));
  const currentMonthExpenses = expenses.filter((e) => e.tanggal.startsWith(selectedMonth));
  const monthIncomeTotal = currentMonthIncomes.reduce((sum, i) => sum + i.nominal, 0);
  const monthExpenseTotal = currentMonthExpenses.reduce((sum, e) => sum + e.nominal, 0);
  const monthNet = monthIncomeTotal - monthExpenseTotal;

  // ISAK 35 Restricted vs Unrestricted breakdown
  const restrictedIncome = incomes
    .filter((i) => i.tipeAsetNeto === 'dengan_pembatasan')
    .reduce((sum, i) => sum + i.nominal, 0);

  const unrestrictedIncome = incomes
    .filter((i) => i.tipeAsetNeto === 'tanpa_pembatasan')
    .reduce((sum, i) => sum + i.nominal, 0);

  // Bank breakdown
  const kasKecil =
    incomes
      .filter((i) => i.metode === 'Tunai (Kas Kecil)')
      .reduce((s, i) => s + i.nominal, 0) -
    expenses
      .filter((e) => e.metode === 'Tunai (Kas Kecil)')
      .reduce((s, e) => s + e.nominal, 0);

  const bankBCA =
    incomes
      .filter((i) => i.metode === 'Transfer Bank BCA' || i.metode === 'QRIS Gereja')
      .reduce((s, i) => s + i.nominal, 0) -
    expenses
      .filter((e) => e.metode === 'Transfer Bank BCA')
      .reduce((s, e) => s + e.nominal, 0);

  const bankMandiri =
    incomes
      .filter((i) => i.metode === 'Transfer Bank Mandiri')
      .reduce((s, i) => s + i.nominal, 0) -
    expenses
      .filter((e) => e.metode === 'Transfer Bank Mandiri')
      .reduce((s, e) => s + e.nominal, 0);

  // Recent transactions (merge and sort by date)
  const allTransactions = [
    ...incomes.map((i) => ({ ...i, type: 'income' as const })),
    ...expenses.map((e) => ({ ...e, type: 'expense' as const })),
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const recentTransactions = allTransactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Welcome / Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sistem Pembukuan Kas Sesuai Standar ISAK 35
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Dashboard Keuangan Gereja
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl leading-relaxed">
              Selamat datang di sistem manajemen perbendaharaan <strong>{churchInfo.namaGereja}</strong>.
              Pengelolaan dana persembahan jemaat terhubung langsung dengan Google Spreadsheet demi transparansi dan akuntabilitas iman.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('income')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Input Pemasukan
            </button>
            <button
              onClick={() => onNavigateTab('expense')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md transition-all"
            >
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              Input Pengeluaran
            </button>
            <button
              onClick={() => onNavigateTab('print')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md transition-all"
            >
              <Printer className="w-4 h-4 text-indigo-300" />
              Cetak Warta PDF
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Unsynced Incomes (>24h) Reminder Notification for Treasurer */}
      <UnsyncedIncomeNotification
        incomes={incomes}
        userRole={userRole}
        onNavigateTab={onNavigateTab}
        onSyncIncomes={onSyncIncomes}
        onSimulateUnsyncedIncome={onSimulateUnsyncedIncome}
      />

      {/* Budget Over-90% Spending Alert Notification */}
      <BudgetAlertNotification
        budgets={budgets}
        expenses={expenses}
        selectedMonth={selectedMonth}
        onNavigateToExpense={() => onNavigateTab('expense')}
        onScrollToCharts={() => {
          const el = document.getElementById('budget-breakdown-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Saldo Bersih */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Saldo Kas & Bank
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatRupiah(netBalance)}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Likuiditas operasional terjaga
            </p>
          </div>
        </div>

        {/* Card 2: Pemasukan Bulan Ini */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pemasukan (Bulan Berjalan)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatRupiah(monthIncomeTotal)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Total Kumulatif: {formatRupiah(totalIncome)}
            </p>
          </div>
        </div>

        {/* Card 3: Pengeluaran Bulan Ini */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pengeluaran (Bulan Berjalan)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatRupiah(monthExpenseTotal)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Total Kumulatif: {formatRupiah(totalExpense)}
            </p>
          </div>
        </div>

        {/* Card 4: Surplus / Defisit Bulan Ini */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Surplus / (Defisit) Bersih
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                monthNet >= 0
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3
              className={`text-xl sm:text-2xl font-black ${
                monthNet >= 0
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatRupiah(monthNet)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {monthNet >= 0 ? 'Surplus operasional' : 'Defisit bulan ini'}
            </p>
          </div>
        </div>
      </div>

      {/* ISAK 35 Fund Segregation & Cash Location Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sub-Card A: ISAK 35 Net Asset Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Klasifikasi Sumber Daya (ISAK 35)
              </h4>
            </div>
            <button
              onClick={() => onNavigateTab('isak35')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Lihat Laporan Lengkap →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 block">
                Tanpa Pembatasan (Unrestricted)
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {formatRupiah(unrestrictedIncome)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Kolekte umum, persepuluhan & ucapan syukur
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block">
                Dengan Pembatasan (Restricted)
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {formatRupiah(restrictedIncome)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Dana pembangunan gedung & kasih jemaat
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Card B: Rekapitulasi Kas & Bank */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Posisi Rekening Kas & Bank
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Kas Riil Terkini</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Kas Kecil Tunai (Bendahara)
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatRupiah(kasKecil)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Bank BCA (Rekening Operasional & QRIS)
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatRupiah(bankBCA)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Bank Mandiri (Rekening Khusus Pembangunan)
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatRupiah(bankMandiri)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Visual Component: Budget vs Actual Breakdown & Remaining Funds */}
      <BudgetBreakdownChart
        budgets={budgets}
        expenses={expenses}
        selectedMonth={selectedMonth}
      />

      {/* Recharts Visual Component: Annual & Year-to-Date (YTD) Income vs Expense Bar Chart */}
      <AnnualIncomeExpenseBarChart
        incomes={incomes}
        expenses={expenses}
        selectedMonth={selectedMonth}
        onNavigateToReport={() => onNavigateTab('isak35')}
      />

      {/* Recharts Visual Component: 6-Month Income vs Expense Trend Line Chart */}
      <IncomeExpenseTrendChart
        incomes={incomes}
        expenses={expenses}
        selectedMonth={selectedMonth}
      />

      {/* Visual Analytics: Proporsi Sumber Pemasukan & Pengeluaran */}
      <FinanceCharts
        incomes={incomes}
        expenses={expenses}
        budgets={budgets}
        selectedMonth={selectedMonth}
      />

      {/* Recent Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Transaksi Terkini (Kas Masuk & Keluar)
            </h4>
            <p className="text-xs text-slate-500">Mutasi kas real-time perbendaharaan gereja</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('income')}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Lihat Semua Pemasukan
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => onNavigateTab('expense')}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Lihat Semua Pengeluaran
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Tanggal / ID</th>
                <th className="py-2.5 px-3">Tipe</th>
                <th className="py-2.5 px-3">Kategori / Jenis</th>
                <th className="py-2.5 px-3">Uraian / Keterangan</th>
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {'nomorBukti' in trx ? trx.nomorBukti : trx.id}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatTanggalIndo(trx.tanggal)}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        trx.type === 'income'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {trx.type === 'income' ? 'Kas Masuk' : 'Kas Keluar'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                    {'jenisPersembahan' in trx ? trx.jenisPersembahan : trx.kategori}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {trx.keterangan}
                  </td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-xs">
                    {trx.metode}
                  </td>
                  <td
                    className={`py-3 px-3 text-right whitespace-nowrap font-bold ${
                      trx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {trx.type === 'income' ? '+' : '-'} {formatRupiah(trx.nominal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
