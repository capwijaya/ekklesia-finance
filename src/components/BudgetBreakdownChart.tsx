import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { BudgetItem, ExpenseTransaction } from '../types/finance';
import { formatRupiah } from '../utils/formatters';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PieChart,
  Calendar,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Info,
} from 'lucide-react';

interface BudgetBreakdownChartProps {
  budgets: BudgetItem[];
  expenses: ExpenseTransaction[];
  selectedMonth?: string; // YYYY-MM
}

// Category short names for cleaner X-Axis labels on smaller screens
const CATEGORY_SHORT_NAMES: Record<string, string> = {
  'Operasional & Utilitas (Listrik/Air/Internet)': 'Operasional & Listrik',
  'Pelayanan Ibadah & Musik': 'Ibadah & Musik',
  'Diakonia, Santunan & Beasiswa': 'Diakonia & Kasih',
  'Pemeliharaan Gedung & Sarana': 'Gedung & Sarana',
  'Honorarium & Tunjangan Pelayan': 'Honor Pastoral',
  'Misi & Penginjilan': 'Misi & PI',
  'Pembelian Perlengkapan & Aset': 'Aset & Inventaris',
};

export const BudgetBreakdownChart: React.FC<BudgetBreakdownChartProps> = ({
  budgets,
  expenses,
  selectedMonth,
}) => {
  const [periodMode, setPeriodMode] = useState<'monthly' | 'annual'>('monthly');
  const [filterStatus, setFilterStatus] = useState<'all' | 'safe' | 'warning' | 'over' | 'exceed90'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter expenses according to month if monthly view, otherwise whole year
  const relevantExpenses = useMemo(() => {
    if (periodMode === 'monthly' && selectedMonth) {
      return expenses.filter((e) => e.tanggal.startsWith(selectedMonth));
    }
    if (selectedMonth) {
      const year = selectedMonth.slice(0, 4);
      return expenses.filter((e) => e.tanggal.startsWith(year));
    }
    return expenses;
  }, [expenses, selectedMonth, periodMode]);

  // Aggregate data for Recharts
  const chartData = useMemo(() => {
    return budgets.map((b) => {
      const actualSpent = relevantExpenses
        .filter((e) => e.kategori === b.kategori)
        .reduce((sum, e) => sum + e.nominal, 0);

      const targetBudget = periodMode === 'monthly' ? b.anggaranBulanan : b.anggaranTahunan;
      const remaining = targetBudget - actualSpent;
      const percentage = targetBudget > 0 ? (actualSpent / targetBudget) * 100 : 0;

      let status: 'safe' | 'warning' | 'over' = 'safe';
      if (percentage > 100) {
        status = 'over';
      } else if (percentage >= 80) {
        status = 'warning';
      }

      const isExceeding90 = percentage >= 90;

      return {
        id: b.id,
        kategori: b.kategori,
        shortName: CATEGORY_SHORT_NAMES[b.kategori] || b.kategori,
        anggaran: targetBudget,
        realisasi: actualSpent,
        sisa: Math.max(0, remaining),
        defisit: remaining < 0 ? Math.abs(remaining) : 0,
        netRemaining: remaining,
        percentage: Math.round(percentage * 10) / 10,
        status,
        isExceeding90,
        keterangan: b.keterangan,
      };
    });
  }, [budgets, relevantExpenses, periodMode]);

  // Filtered list for category cards
  const filteredData = useMemo(() => {
    if (filterStatus === 'all') return chartData;
    if (filterStatus === 'exceed90') return chartData.filter((item) => item.isExceeding90);
    return chartData.filter((item) => item.status === filterStatus);
  }, [chartData, filterStatus]);

  // Overall totals for KPI headers
  const totalBudget = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.anggaran, 0),
    [chartData]
  );
  const totalSpent = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.realisasi, 0),
    [chartData]
  );
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isOver = data.status === 'over';
    const isWarning = data.status === 'warning';

    return (
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-700 max-w-xs text-xs space-y-2">
        <div className="border-b border-slate-800 pb-1.5">
          <p className="font-bold text-sm text-slate-100">{data.kategori}</p>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
              isOver
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : isWarning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isOver ? '⚠️ Defisit / Melebihi Anggaran' : isWarning ? '⚡ Waspada (≥ 80%)' : '✓ Aman Terkendali'}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Plafon Anggaran:</span>
            <span className="font-bold text-slate-200">{formatRupiah(data.anggaran)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Realisasi Belanja:</span>
            <span className="font-bold text-rose-300">{formatRupiah(data.realisasi)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-800 pt-1">
            <span className="text-slate-400">
              {data.netRemaining >= 0 ? 'Sisa Dana Kas:' : 'Defisit Anggaran:'}
            </span>
            <span
              className={`font-black ${
                data.netRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {data.netRemaining >= 0
                ? formatRupiah(data.netRemaining)
                : `-${formatRupiah(Math.abs(data.netRemaining))}`}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Tingkat Penyerapan:</span>
            <span className="font-bold text-indigo-300">{data.percentage}%</span>
          </div>
        </div>

        {data.keterangan && (
          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80">
            "{data.keterangan}"
          </p>
        )}
      </div>
    );
  };

  return (
    <div id="budget-breakdown-section" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Monitoring Anggaran vs Realisasi Belanja
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualisasi sisa dana per komisi pelayanan untuk evaluasi rapat majelis & bendahara
              </p>
            </div>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Toggle */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setPeriodMode('monthly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                periodMode === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Plafon Bulanan
            </button>
            <button
              onClick={() => setPeriodMode('annual')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                periodMode === 'annual'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Tahunan (RAPBG)
            </button>
          </div>

          {/* Filter Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent border-0 font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="exceed90">🚨 Melebihi 90% Plafon (Kritis)</option>
              <option value="safe">✓ Terkendali Aman (&lt;80%)</option>
              <option value="warning">⚡ Waspada (80-100%)</option>
              <option value="over">⚠️ Melebihi Anggaran (&gt;100%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Header Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-800/60 dark:via-indigo-950/20 dark:to-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Plafon {periodMode === 'monthly' ? 'Bulan Ini' : 'Tahun Berjalan'}
          </span>
          <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
            {formatRupiah(totalBudget)}
          </p>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Realisasi Pengeluaran
          </span>
          <p className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
            {formatRupiah(totalSpent)}
          </p>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Sisa Dana Kas Tersedia
          </span>
          <p
            className={`text-sm sm:text-base font-extrabold mt-0.5 ${
              totalRemaining >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatRupiah(totalRemaining)}
          </p>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Tingkat Penyerapan
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-sm sm:text-base font-extrabold ${
                overallPercentage > 100
                  ? 'text-rose-600'
                  : overallPercentage >= 80
                  ? 'text-amber-600'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {overallPercentage}%
            </span>
            <span className="text-[11px] text-slate-400">
              ({chartData.filter((d) => d.status === 'over').length} pos kritis)
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts BarChart Component */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="flex items-center gap-1.5 font-medium">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            Grafik Batang Perbandingan Anggaran vs Realisasi vs Sisa Dana
          </span>
          <span className="text-[11px] text-slate-400">
            Arahkan kursor pada batang grafik untuk rincian detail
          </span>
        </div>

        <div className="w-full h-80 sm:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: '#64748B' }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={55}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                  return `${val}`;
                }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                formatter={(value) => {
                  switch (value) {
                    case 'anggaran':
                      return 'Plafon Anggaran';
                    case 'realisasi':
                      return 'Realisasi Belanja';
                    case 'sisa':
                      return 'Sisa Dana Kas';
                    default:
                      return value;
                  }
                }}
              />
              <Bar dataKey="anggaran" name="anggaran" fill="#6366F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realisasi" name="realisasi" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sisa" name="sisa" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Monitoring Cards (Remaining Funds Breakdown) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" />
            Rincian Sisa Pagu Anggaran per Komisi / Kategori ({filteredData.length} Pos)
          </h4>
          <span className="text-[11px] text-slate-400">
            {periodMode === 'monthly' ? 'Plafon Per Bulan' : 'Plafon Tahunan'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredData.map((item) => {
            const isOver = item.status === 'over';
            const isWarning = item.status === 'warning';

            return (
              <div
                key={item.id}
                onClick={() =>
                  setSelectedCategory(selectedCategory === item.kategori ? null : item.kategori)
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  selectedCategory === item.kategori
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xs'
                    : item.isExceeding90
                    ? 'border-rose-500/80 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {item.isExceeding90 && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-rose-600 text-white shadow-xs">
                    {isOver ? '⚠️ Defisit' : '⚡ &gt;90% Plafon'}
                  </span>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block">
                      {item.kategori}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {item.keterangan}
                    </span>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      isOver
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : isWarning
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {isOver ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : isWarning ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {item.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 my-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>

                {/* Financial Figures */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Realisasi / Plafon</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatRupiah(item.realisasi)}
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      dari {formatRupiah(item.anggaran)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">
                      {item.netRemaining >= 0 ? 'Sisa Dana Kas' : 'Defisit Anggaran'}
                    </span>
                    <span
                      className={`font-black text-xs ${
                        item.netRemaining >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.netRemaining >= 0
                        ? formatRupiah(item.netRemaining)
                        : `-${formatRupiah(Math.abs(item.netRemaining))}`}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {item.netRemaining >= 0 ? 'Dapat dibelanjakan' : 'Perlu evaluasi komisi'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
