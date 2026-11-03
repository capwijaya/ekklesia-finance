import React, { useState } from 'react';
import { BudgetItem, ExpenseTransaction } from '../types/finance';
import { formatRupiah } from '../utils/formatters';
import {
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  Eye,
  Info,
  SlidersHorizontal,
  X,
  BellRing,
} from 'lucide-react';

export interface AlertBudgetItem {
  budgetId: string;
  kategori: string;
  targetBudget: number;
  actualSpent: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean; // > 100%
  keterangan: string;
}

interface BudgetAlertNotificationProps {
  budgets: BudgetItem[];
  expenses: ExpenseTransaction[];
  selectedMonth: string; // YYYY-MM
  onNavigateToExpense?: (categoryName: string) => void;
  onScrollToCharts?: () => void;
}

export const BudgetAlertNotification: React.FC<BudgetAlertNotificationProps> = ({
  budgets,
  expenses,
  selectedMonth,
  onNavigateToExpense,
  onScrollToCharts,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [periodMode, setPeriodMode] = useState<'monthly' | 'annual'>('monthly');
  const [dismissedCategories, setDismissedCategories] = useState<string[]>([]);

  // Filter expenses for selected period
  const relevantExpenses = expenses.filter((e) => {
    if (periodMode === 'monthly') {
      return e.tanggal.startsWith(selectedMonth);
    }
    const year = selectedMonth.slice(0, 4);
    return e.tanggal.startsWith(year);
  });

  // Calculate items that exceed 90% of budget
  const alertItems: AlertBudgetItem[] = budgets
    .map((b) => {
      const actualSpent = relevantExpenses
        .filter((e) => e.kategori === b.kategori)
        .reduce((sum, e) => sum + e.nominal, 0);

      const targetBudget = periodMode === 'monthly' ? b.anggaranBulanan : b.anggaranTahunan;
      const percentage = targetBudget > 0 ? (actualSpent / targetBudget) * 100 : 0;
      const remaining = targetBudget - actualSpent;

      return {
        budgetId: b.id,
        kategori: b.kategori,
        targetBudget,
        actualSpent,
        percentage: Math.round(percentage * 10) / 10,
        remaining,
        isOverBudget: actualSpent > targetBudget,
        keterangan: b.keterangan,
      };
    })
    .filter((item) => item.percentage >= 90)
    .sort((a, b) => b.percentage - a.percentage); // Sort highest percentage first

  // Visible items (excluding manually dismissed ones in this session)
  const visibleAlerts = alertItems.filter(
    (item) => !dismissedCategories.includes(item.kategori)
  );

  const overBudgetCount = visibleAlerts.filter((i) => i.isOverBudget).length;
  const warningCount = visibleAlerts.filter((i) => !i.isOverBudget).length;

  if (alertItems.length === 0) {
    return null; // All budgets are under 90%
  }

  const handleDismiss = (kategori: string) => {
    setDismissedCategories((prev) => [...prev, kategori]);
  };

  const handleResetDismissed = () => {
    setDismissedCategories([]);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-rose-500/30 dark:border-rose-500/40 bg-gradient-to-br from-rose-50/90 via-amber-50/40 to-white dark:from-rose-950/40 dark:via-amber-950/20 dark:to-slate-900 shadow-sm transition-all">
      {/* Decorative pulse indicator */}
      <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 animate-pulse" />

      {/* Main Bar Header */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/20">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                Peringatan: {visibleAlerts.length} Pos Pengeluaran Menembus &gt;90% Anggaran
              </h4>

              {overBudgetCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-rose-600 text-white shadow-xs">
                  {overBudgetCount} Defisit / Over
                </span>
              )}

              {warningCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-500 text-white shadow-xs">
                  {warningCount} Kritis (90-100%)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Berdasarkan plafon {periodMode === 'monthly' ? 'Bulanan' : 'Tahunan RAPBG'} ({selectedMonth}). Segera evaluasi pengeluaran sebelum dana kas komisi terlampaui.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <div className="bg-white/80 dark:bg-slate-800/80 p-1 rounded-xl flex items-center text-xs border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setPeriodMode('monthly')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                periodMode === 'monthly'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriodMode('annual')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                periodMode === 'annual'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tahunan
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800/60 bg-white/60 dark:bg-slate-800/60 hover:bg-white text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {isExpanded ? (
              <>
                <span>Sembunyikan</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Lihat Detail ({visibleAlerts.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Alert Detail Cards */}
      {isExpanded && (
        <div className="px-4 pb-5 sm:px-5 space-y-3 pt-1 border-t border-rose-200/50 dark:border-rose-800/40">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {visibleAlerts.map((item) => (
              <div
                key={item.budgetId}
                className={`p-4 rounded-2xl border-2 transition-all relative group flex flex-col justify-between ${
                  item.isOverBudget
                    ? 'bg-white dark:bg-slate-900 border-rose-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-amber-400 shadow-xs'
                }`}
              >
                {/* Header of Item */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                        {item.kategori}
                      </span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">
                        {item.keterangan}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                        item.isOverBudget
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {item.isOverBudget ? (
                        <AlertOctagon className="w-3 h-3 text-rose-600" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                      )}
                      {item.percentage}%
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 my-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        item.isOverBudget
                          ? 'bg-rose-600 animate-pulse'
                          : 'bg-gradient-to-r from-amber-400 to-rose-500'
                      }`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>

                  {/* Financial Metrics */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Realisasi Belanja:</span>
                      <strong className="text-rose-600 dark:text-rose-400 font-bold">
                        {formatRupiah(item.actualSpent)}
                      </strong>
                    </div>

                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Plafon {periodMode === 'monthly' ? 'Bulanan' : 'Tahunan'}:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {formatRupiah(item.targetBudget)}
                      </strong>
                    </div>

                    <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 font-bold">
                      <span className="text-slate-600 dark:text-slate-400">
                        {item.isOverBudget ? 'Defisit Melebihi Plafon:' : 'Sisa Dana Terakhir:'}
                      </span>
                      <span
                        className={
                          item.isOverBudget
                            ? 'text-rose-600 dark:text-rose-400 font-black'
                            : 'text-amber-600 dark:text-amber-400 font-black'
                        }
                      >
                        {item.isOverBudget
                          ? `-${formatRupiah(Math.abs(item.remaining))}`
                          : formatRupiah(item.remaining)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  {onNavigateToExpense && (
                    <button
                      onClick={() => onNavigateToExpense(item.kategori)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Lihat Mutasi Kas</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDismiss(item.kategori)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Tandai telah ditinjau"
                  >
                    Ditinjau ✓
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action note & restore dismissed button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>
                <strong>Saran Tindakan Majelis:</strong> Periksa pos pengeluaran terkait, lakukan penundaan belanja non-prioritas, atau agendakan adendum anggaran RAPBG dalam rapat bendahara jemaat.
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onScrollToCharts && (
                <button
                  onClick={onScrollToCharts}
                  className="font-bold text-rose-600 dark:text-rose-400 hover:underline shrink-0"
                >
                  Tinjau di Grafik Recharts →
                </button>
              )}

              {dismissedCategories.length > 0 && (
                <button
                  onClick={handleResetDismissed}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Tampilkan {dismissedCategories.length} pos yang disembunyikan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
