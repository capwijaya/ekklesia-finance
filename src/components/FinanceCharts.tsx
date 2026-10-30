import React, { useState } from 'react';
import { BudgetItem, ExpenseTransaction, IncomeTransaction } from '../types/finance';
import { formatRupiah } from '../utils/formatters';
import { BarChart3, PieChart as PieIcon, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FinanceChartsProps {
  incomes: IncomeTransaction[];
  expenses: ExpenseTransaction[];
  budgets: BudgetItem[];
  selectedMonth?: string; // YYYY-MM
}

export const FinanceCharts: React.FC<FinanceChartsProps> = ({
  incomes,
  expenses,
  budgets,
  selectedMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'budget' | 'income-pie' | 'expense-pie'>('budget');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter by selected month if provided, otherwise all
  const filteredIncomes = selectedMonth
    ? incomes.filter((i) => i.tanggal.startsWith(selectedMonth))
    : incomes;
  const filteredExpenses = selectedMonth
    ? expenses.filter((e) => e.tanggal.startsWith(selectedMonth))
    : expenses;

  // Calculate actual spending per budget category
  const budgetComparisons = budgets.map((b) => {
    const actualSpent = filteredExpenses
      .filter((e) => e.kategori === b.kategori)
      .reduce((sum, e) => sum + e.nominal, 0);

    const targetBudget = selectedMonth ? b.anggaranBulanan : b.anggaranBulanan;
    const percentage = targetBudget > 0 ? (actualSpent / targetBudget) * 100 : 0;
    const sisa = targetBudget - actualSpent;

    return {
      kategori: b.kategori,
      targetBudget,
      actualSpent,
      percentage: Math.round(percentage),
      sisa,
    };
  });

  const totalBudget = budgetComparisons.reduce((sum, b) => sum + b.targetBudget, 0);
  const totalActual = budgetComparisons.reduce((sum, b) => sum + b.actualSpent, 0);
  const totalPercentage = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

  // Pie chart calculation for Incomes
  const incomeCategoryTotals = filteredIncomes.reduce((acc, curr) => {
    acc[curr.jenisPersembahan] = (acc[curr.jenisPersembahan] || 0) + curr.nominal;
    return acc;
  }, {} as Record<string, number>);

  const totalIncome = Object.values(incomeCategoryTotals).reduce((a, b) => a + b, 0);

  const incomePieData = Object.entries(incomeCategoryTotals)
    .map(([name, value]) => ({
      name,
      value,
      percent: totalIncome > 0 ? Math.round((value / totalIncome) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Pie chart calculation for Expenses
  const expenseCategoryTotals = filteredExpenses.reduce((acc, curr) => {
    acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.nominal;
    return acc;
  }, {} as Record<string, number>);

  const totalExpense = Object.values(expenseCategoryTotals).reduce((a, b) => a + b, 0);

  const expensePieData = Object.entries(expenseCategoryTotals)
    .map(([name, value]) => ({
      name,
      value,
      percent: totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const pieColors = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
    '#14B8A6', // Teal
  ];

  // Helper for generating SVG Donut paths
  const renderDonutChart = (
    data: { name: string; value: number; percent: number }[],
    totalVal: number,
    centerLabel: string
  ) => {
    if (data.length === 0 || totalVal === 0) {
      return (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          Belum ada data untuk periode ini.
        </div>
      );
    }

    let cumulativeAngle = 0;
    const slices = data.map((item, idx) => {
      const sliceAngle = (item.value / totalVal) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle += sliceAngle;

      // Coordinate calculations on 200x200 canvas, center 100, 100, radius 80, inner radius 50
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = 100 + 80 * Math.cos(startRad);
      const y1 = 100 + 80 * Math.sin(startRad);
      const x2 = 100 + 80 * Math.cos(endRad);
      const y2 = 100 + 80 * Math.sin(endRad);

      const ix1 = 100 + 50 * Math.cos(endRad);
      const iy1 = 100 + 50 * Math.sin(endRad);
      const ix2 = 100 + 50 * Math.cos(startRad);
      const iy2 = 100 + 50 * Math.sin(startRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A 50 50 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');

      const color = pieColors[idx % pieColors.length];
      const isHovered = hoveredIndex === idx;

      return (
        <path
          key={item.name}
          d={pathData}
          fill={color}
          opacity={isHovered ? 1 : 0.9}
          className="transition-all duration-200 cursor-pointer hover:opacity-100 hover:scale-102 transform origin-center"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        />
      );
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Donut */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <svg viewBox="0 0 200 200" className="w-56 h-56 drop-shadow-sm">
            {slices}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {centerLabel}
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-white px-2">
              {formatRupiah(totalVal)}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="md:col-span-7 space-y-2">
          {data.map((item, idx) => {
            const color = pieColors[idx % pieColors.length];
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={item.name}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-2 rounded-lg transition-all border text-xs sm:text-sm flex items-center justify-between ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatRupiah(item.value)}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-11 text-right">
                    {item.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 sm:p-6 transition-all">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Analisis Anggaran & Proporsi Keuangan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Perbandingan Rencana Anggaran Pendapatan & Belanja Gereja (RAPBG) vs Realisasi
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'budget'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Anggaran vs Realisasi
          </button>
          <button
            onClick={() => setActiveTab('income-pie')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'income-pie'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 text-emerald-500" />
            Proporsi Pemasukan
          </button>
          <button
            onClick={() => setActiveTab('expense-pie')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'expense-pie'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 text-rose-500" />
            Proporsi Pengeluaran
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-6">
        {activeTab === 'budget' && (
          <div className="space-y-6">
            {/* Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Total Plafon Anggaran
                </span>
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {formatRupiah(totalBudget)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Total Realisasi Belanja
                </span>
                <p className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400">
                  {formatRupiah(totalActual)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Tingkat Penyerapan Anggaran
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-base sm:text-lg font-bold ${
                      totalPercentage > 100
                        ? 'text-rose-600 dark:text-rose-400'
                        : totalPercentage > 85
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {totalPercentage}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    (Sisa: {formatRupiah(totalBudget - totalActual)})
                  </span>
                </div>
              </div>
            </div>

            {/* Bar Chart Rows */}
            <div className="space-y-4">
              {budgetComparisons.map((b) => {
                const isOverBudget = b.actualSpent > b.targetBudget;
                const isWarning = b.percentage >= 80 && !isOverBudget;

                return (
                  <div
                    key={b.kategori}
                    className="p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all bg-white dark:bg-slate-900"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        {isOverBudget ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {b.kategori}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                        <span>
                          Realisasi:{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {formatRupiah(b.actualSpent)}
                          </strong>
                        </span>
                        <span>/</span>
                        <span>
                          Anggaran:{' '}
                          <strong className="text-slate-600 dark:text-slate-300">
                            {formatRupiah(b.targetBudget)}
                          </strong>
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            isOverBudget
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : isWarning
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {b.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverBudget
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-indigo-600 dark:bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-400">
                      <span>
                        {isOverBudget
                          ? `Defisit anggaran: ${formatRupiah(Math.abs(b.sisa))}`
                          : `Sisa pagu anggaran: ${formatRupiah(b.sisa)}`}
                      </span>
                      <span>
                        Status:{' '}
                        {isOverBudget
                          ? 'Melebihi Anggaran'
                          : isWarning
                          ? 'Mendekati Batas'
                          : 'Terkendali Aman'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'income-pie' &&
          renderDonutChart(incomePieData, totalIncome, 'Total Kolekte')}

        {activeTab === 'expense-pie' &&
          renderDonutChart(expensePieData, totalExpense, 'Total Beban')}
      </div>
    </div>
  );
};
