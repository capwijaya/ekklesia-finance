import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { IncomeTransaction, ExpenseTransaction } from '../types/finance';
import { formatRupiah } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Activity,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Percent,
} from 'lucide-react';

interface IncomeExpenseTrendChartProps {
  incomes: IncomeTransaction[];
  expenses: ExpenseTransaction[];
  selectedMonth?: string; // e.g. "2026-10"
}

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const SHORT_MONTH_NAMES_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export const IncomeExpenseTrendChart: React.FC<IncomeExpenseTrendChartProps> = ({
  incomes,
  expenses,
  selectedMonth,
}) => {
  // Chart visual options
  const [viewMode, setViewMode] = useState<'line' | 'composed' | 'surplus'>('line');
  const [showAverageLines, setShowAverageLines] = useState(true);
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null);

  // Generate 6 months ending at selectedMonth or the latest transaction date
  const last6Months = useMemo(() => {
    let targetYear = 2026;
    let targetMonth = 10; // default 1-indexed

    if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) {
      const [y, m] = selectedMonth.split('-').map(Number);
      targetYear = y;
      targetMonth = m;
    } else {
      // Find latest date in data
      const dates = [
        ...incomes.map((i) => i.tanggal),
        ...expenses.map((e) => e.tanggal),
      ].filter(Boolean);

      if (dates.length > 0) {
        const sorted = dates.sort();
        const latest = sorted[sorted.length - 1];
        const [y, m] = latest.split('-').map(Number);
        targetYear = y;
        targetMonth = m;
      }
    }

    const months: { year: number; month: number; key: string; label: string; fullLabel: string }[] = [];

    // Go back 5 months + current month = 6 months
    for (let i = 5; i >= 0; i--) {
      let m = targetMonth - i;
      let y = targetYear;
      while (m <= 0) {
        m += 12;
        y -= 1;
      }
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = `${SHORT_MONTH_NAMES_ID[m - 1]} '${String(y).slice(2)}`;
      const fullLabel = `${MONTH_NAMES_ID[m - 1]} ${y}`;
      months.push({ year: y, month: m, key, label, fullLabel });
    }

    return months;
  }, [selectedMonth, incomes, expenses]);

  // Aggregate income and expense data per month
  const chartData = useMemo(() => {
    return last6Months.map((m, idx, arr) => {
      const monthIncomes = incomes.filter((i) => i.tanggal.startsWith(m.key));
      const monthExpenses = expenses.filter((e) => e.tanggal.startsWith(m.key));

      const totalIncome = monthIncomes.reduce((sum, i) => sum + i.nominal, 0);
      const totalExpense = monthExpenses.reduce((sum, e) => sum + e.nominal, 0);
      const netSurplus = totalIncome - totalExpense;
      const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

      // Comparison with previous month
      let incomeGrowth = 0;
      let expenseGrowth = 0;
      if (idx > 0) {
        const prevKey = arr[idx - 1].key;
        const prevIncome = incomes
          .filter((i) => i.tanggal.startsWith(prevKey))
          .reduce((sum, i) => sum + i.nominal, 0);
        const prevExpense = expenses
          .filter((e) => e.tanggal.startsWith(prevKey))
          .reduce((sum, e) => sum + e.nominal, 0);

        if (prevIncome > 0) {
          incomeGrowth = ((totalIncome - prevIncome) / prevIncome) * 100;
        }
        if (prevExpense > 0) {
          expenseGrowth = ((totalExpense - prevExpense) / prevExpense) * 100;
        }
      }

      return {
        monthKey: m.key,
        label: m.label,
        fullLabel: m.fullLabel,
        pemasukan: totalIncome,
        pengeluaran: totalExpense,
        surplus: netSurplus,
        expenseRatio: Math.round(expenseRatio),
        incomeGrowth: Math.round(incomeGrowth),
        expenseGrowth: Math.round(expenseGrowth),
        countIncome: monthIncomes.length,
        countExpense: monthExpenses.length,
      };
    });
  }, [last6Months, incomes, expenses]);

  // Aggregate statistics across the 6-month period
  const total6MonthIncome = useMemo(
    () => chartData.reduce((sum, d) => sum + d.pemasukan, 0),
    [chartData]
  );
  const total6MonthExpense = useMemo(
    () => chartData.reduce((sum, d) => sum + d.pengeluaran, 0),
    [chartData]
  );
  const total6MonthSurplus = total6MonthIncome - total6MonthExpense;
  const avgMonthlyIncome = chartData.length > 0 ? Math.round(total6MonthIncome / chartData.length) : 0;
  const avgMonthlyExpense = chartData.length > 0 ? Math.round(total6MonthExpense / chartData.length) : 0;
  const overallExpenseRatio =
    total6MonthIncome > 0 ? Math.round((total6MonthExpense / total6MonthIncome) * 100) : 0;

  // Find peak months
  const highestIncomeMonth = useMemo(() => {
    return [...chartData].sort((a, b) => b.pemasukan - a.pemasukan)[0];
  }, [chartData]);

  const highestExpenseMonth = useMemo(() => {
    return [...chartData].sort((a, b) => b.pengeluaran - a.pengeluaran)[0];
  }, [chartData]);

  // Custom Tooltip Component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isSurplusPositive = data.surplus >= 0;

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs space-y-3 min-w-[240px] z-50">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>{data.fullLabel}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            {data.countIncome + data.countExpense} Transaksi
          </span>
        </div>

        <div className="space-y-2">
          {/* Income */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900"></span>
              Total Pemasukan:
            </span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {formatRupiah(data.pemasukan)}
            </strong>
          </div>

          {/* Expense */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-900"></span>
              Total Pengeluaran:
            </span>
            <strong className="text-rose-600 dark:text-rose-400 font-bold">
              {formatRupiah(data.pengeluaran)}
            </strong>
          </div>

          {/* Net Surplus / Deficit */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-semibold">
            <span className="text-slate-700 dark:text-slate-300">
              {isSurplusPositive ? 'Surplus Bersih:' : 'Defisit Bersih:'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                isSurplusPositive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {formatRupiah(data.surplus)}
            </span>
          </div>

          {/* Ratio bar */}
          <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Rasio Beban:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {data.expenseRatio}% dari Pemasukan
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Tren Pendapatan vs Pengeluaran (6 Bulan Terakhir)
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  {last6Months[0]?.label} – {last6Months[last6Months.length - 1]?.label}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualisasi dinamika persembahan jemaat, alokasi beban pelayanan, dan tren surplus kas bulanan
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Toggle Switches */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-auto justify-between lg:justify-end">
          {/* View mode toggle */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs">
            <button
              type="button"
              onClick={() => setViewMode('line')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'line'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Garis Tren
            </button>
            <button
              type="button"
              onClick={() => setViewMode('composed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'composed'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Komposisi Kas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('surplus')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'surplus'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Surplus Bersih
            </button>
          </div>

          {/* Toggle Average Line */}
          <button
            type="button"
            onClick={() => setShowAverageLines(!showAverageLines)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showAverageLines
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            Garis Rata-rata
          </button>
        </div>
      </div>

      {/* 4 Summary Cards (6-Month Performance KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Rata-rata Pemasukan */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              Rata-rata Pemasukan
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100/70 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">
              / Bulan
            </span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            {formatRupiah(avgMonthlyIncome)}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Puncak: <strong>{highestIncomeMonth?.fullLabel}</strong> ({formatRupiah(highestIncomeMonth?.pemasukan || 0)})
          </p>
        </div>

        {/* Card 2: Rata-rata Pengeluaran */}
        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              Rata-rata Beban
            </span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-100/70 dark:bg-rose-900/50 px-1.5 py-0.5 rounded">
              / Bulan
            </span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            {formatRupiah(avgMonthlyExpense)}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Terbesar: <strong>{highestExpenseMonth?.fullLabel}</strong> ({formatRupiah(highestExpenseMonth?.pengeluaran || 0)})
          </p>
        </div>

        {/* Card 3: Akumulasi Surplus 6 Bulan */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
              Total Surplus 6 Bln
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-100/70 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">
              Kas Bersih
            </span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatRupiah(total6MonthSurplus)}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Total Masuk: {formatRupiah(total6MonthIncome)}
          </p>
        </div>

        {/* Card 4: Rasio Beban Kas (Efficiency) */}
        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Rasio Beban Kas
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100/70 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">
              Sehat (&lt;60%)
            </span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            {overallExpenseRatio}%
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Setiap Rp 100 masuk, Rp {overallExpenseRatio} dialokasikan untuk pelayanan
          </p>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            {viewMode === 'line'
              ? 'Grafik Garis Komparasi Pemasukan vs Pengeluaran'
              : viewMode === 'composed'
              ? 'Grafik Kombinasi Area & Garis Arus Kas'
              : 'Grafik Garis Surplus / Defisit Bersih Bulanan'}
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Arahkan kursor pada simpul garis untuk melihat rincian bulan tersebut
          </span>
        </div>

        <div className="w-full h-80 sm:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {viewMode === 'composed' ? (
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" opacity={0.25} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                    return `${val}`;
                  }}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                  formatter={(value) => {
                    if (value === 'pemasukan') return 'Total Pemasukan';
                    if (value === 'pengeluaran') return 'Total Pengeluaran';
                    if (value === 'surplus') return 'Surplus Kas Bersih';
                    return value;
                  }}
                />
                {showAverageLines && (
                  <>
                    <ReferenceLine
                      y={avgMonthlyIncome}
                      stroke="#10B981"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                      label={{
                        value: `Rata-rata Masuk: ${(avgMonthlyIncome / 1000000).toFixed(1)}jt`,
                        fill: '#10B981',
                        fontSize: 10,
                        position: 'insideTopLeft',
                      }}
                    />
                    <ReferenceLine
                      y={avgMonthlyExpense}
                      stroke="#F43F5E"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                      label={{
                        value: `Rata-rata Beban: ${(avgMonthlyExpense / 1000000).toFixed(1)}jt`,
                        fill: '#F43F5E',
                        fontSize: 10,
                        position: 'insideBottomLeft',
                      }}
                    />
                  </>
                )}
                <Area
                  type="monotone"
                  dataKey="pemasukan"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorIncomeGrad)"
                  name="pemasukan"
                />
                <Area
                  type="monotone"
                  dataKey="pengeluaran"
                  stroke="#F43F5E"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorExpenseGrad)"
                  name="pengeluaran"
                />
                <Line
                  type="monotone"
                  dataKey="surplus"
                  stroke="#6366F1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#6366F1' }}
                  name="surplus"
                />
              </ComposedChart>
            ) : viewMode === 'surplus' ? (
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" opacity={0.25} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                    return `${val}`;
                  }}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                  formatter={() => 'Surplus Kas Bersih (Pemasukan - Pengeluaran)'}
                />
                <ReferenceLine y={0} stroke="#64748B" strokeWidth={1.5} />
                <Line
                  type="monotone"
                  dataKey="surplus"
                  stroke="#6366F1"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 8, stroke: '#6366F1', strokeWidth: 2, fill: '#fff' }}
                  name="surplus"
                />
              </LineChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" opacity={0.25} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                    return `${val}`;
                  }}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                  formatter={(value) => {
                    if (value === 'pemasukan') return 'Total Pemasukan';
                    if (value === 'pengeluaran') return 'Total Pengeluaran';
                    return value;
                  }}
                />
                {showAverageLines && (
                  <>
                    <ReferenceLine
                      y={avgMonthlyIncome}
                      stroke="#10B981"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                      label={{
                        value: `Rata-rata Masuk: ${(avgMonthlyIncome / 1000000).toFixed(1)}jt`,
                        fill: '#10B981',
                        fontSize: 10,
                        position: 'insideTopLeft',
                      }}
                    />
                    <ReferenceLine
                      y={avgMonthlyExpense}
                      stroke="#F43F5E"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                      label={{
                        value: `Rata-rata Beban: ${(avgMonthlyExpense / 1000000).toFixed(1)}jt`,
                        fill: '#F43F5E',
                        fontSize: 10,
                        position: 'insideBottomLeft',
                      }}
                    />
                  </>
                )}
                {/* Income Line */}
                <Line
                  type="monotone"
                  dataKey="pemasukan"
                  stroke="#10B981"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2, fill: '#fff' }}
                  name="pemasukan"
                />
                {/* Expense Line */}
                <Line
                  type="monotone"
                  dataKey="pengeluaran"
                  stroke="#F43F5E"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#F43F5E', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 8, stroke: '#F43F5E', strokeWidth: 2, fill: '#fff' }}
                  name="pengeluaran"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Month-by-Month Summary Table */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            Rincian Arus Kas Bulanan (6 Bulan Terakhir)
          </h4>
          <span className="text-[11px] text-slate-400">
            Dihitung otomatis dari mutasi transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-2 px-3">Bulan</th>
                <th className="py-2 px-3 text-right">Total Pemasukan</th>
                <th className="py-2 px-3 text-right">Total Pengeluaran</th>
                <th className="py-2 px-3 text-right">Surplus / Defisit</th>
                <th className="py-2 px-3 text-right">Rasio Beban</th>
                <th className="py-2 px-3 text-center">Status Arus Kas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {chartData.map((row) => {
                const isPositive = row.surplus >= 0;
                const isSelected = row.monthKey === selectedMonth;

                return (
                  <tr
                    key={row.monthKey}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{row.fullLabel}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-600 text-white font-bold">
                          Bulan Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(row.pemasukan)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                      {formatRupiah(row.pengeluaran)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatRupiah(row.surplus)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                      {row.expenseRatio}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isPositive
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {isPositive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Surplus Kas
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                            Defisit Operasional
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
