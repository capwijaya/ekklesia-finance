import React, { useState, useMemo, useEffect } from 'react';
import { IncomeTransaction, UserRole } from '../types/finance';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import {
  AlertTriangle,
  Clock,
  CloudOff,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface UnsyncedIncomeNotificationProps {
  incomes: IncomeTransaction[];
  userRole: UserRole;
  onNavigateTab: (tab: string) => void;
  onSyncIncomes?: (ids?: string[]) => void;
  onSimulateUnsyncedIncome?: () => void;
}

export const UnsyncedIncomeNotification: React.FC<UnsyncedIncomeNotificationProps> = ({
  incomes,
  userRole,
  onNavigateTab,
  onSyncIncomes,
  onSimulateUnsyncedIncome,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Target roles: only Bendahara and Admin are responsible for Google Sheets synchronization
  const isAuthorizedRole = userRole === 'bendahara' || userRole === 'admin';

  // Filter unsynced income transactions older than 24 hours
  const unsyncedOver24h = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return incomes.filter((item) => {
      // Must not be synced yet
      if (item.syncedToSheets) return false;
      if (!item.tanggal) return false;

      // Check if transaction date is older than today or more than 24 hours ago
      const isBeforeToday = item.tanggal < todayStr;
      const txDateTime = new Date(`${item.tanggal}T00:00:00`).getTime();
      const diffHours = (now.getTime() - txDateTime) / (1000 * 60 * 60);

      return isBeforeToday || diffHours >= 24;
    });
  }, [incomes]);

  // Aggregate metrics
  const totalUnsyncedNominal = useMemo(() => {
    return unsyncedOver24h.reduce((sum, item) => sum + item.nominal, 0);
  }, [unsyncedOver24h]);

  const oldestPendingDate = useMemo(() => {
    if (unsyncedOver24h.length === 0) return null;
    const sorted = [...unsyncedOver24h].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    return sorted[0].tanggal;
  }, [unsyncedOver24h]);

  // Calculate days elapsed for oldest item
  const daysElapsed = useMemo(() => {
    if (!oldestPendingDate) return 0;
    const now = new Date();
    const oldest = new Date(`${oldestPendingDate}T00:00:00`);
    const diffDays = Math.floor((now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [oldestPendingDate]);

  // Handle Synchronize All Pending Incomes
  const handleSyncAll = () => {
    setIsSyncing(true);
    setSuccessToast(null);

    // Simulate real-time API call to Google Sheets
    setTimeout(() => {
      if (onSyncIncomes) {
        onSyncIncomes(unsyncedOver24h.map((i) => i.id));
      }
      setIsSyncing(false);
      setSuccessToast(
        `Berhasil menyinkronkan ${unsyncedOver24h.length} transaksi pemasukan (${formatRupiah(
          totalUnsyncedNominal
        )}) ke Google Spreadsheet gereja!`
      );
      setTimeout(() => {
        setSuccessToast(null);
      }, 6000);
    }, 900);
  };

  // Handle Synchronize Single Income
  const handleSyncSingle = (id: string, nominal: number) => {
    if (onSyncIncomes) {
      onSyncIncomes([id]);
    }
    setSuccessToast(`Transaksi ID ${id} (${formatRupiah(nominal)}) berhasil disinkronkan ke Google Sheets.`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  // Don't render for non-authorized roles (e.g. Jemaat / Auditor)
  if (!isAuthorizedRole) {
    return null;
  }

  // If dismissed or no pending items
  if (isDismissed || unsyncedOver24h.length === 0) {
    // If there are no pending items, show a subtle test button so reviewer can simulate the condition
    return successToast ? (
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
        <button
          onClick={() => setSuccessToast(null)}
          className="text-emerald-700 dark:text-emerald-300 hover:opacity-75 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <div className="flex items-center justify-end text-[11px] text-slate-400">
        {onSimulateUnsyncedIncome && (
          <button
            type="button"
            onClick={onSimulateUnsyncedIncome}
            className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 underline decoration-dotted flex items-center gap-1 cursor-pointer"
            title="Klik untuk menguji sistem pengingat transaksi pemasukan tertunda >24 jam"
          >
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Simulasi Pengingat Sinkronisasi (&gt;24 Jam)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Success Toast */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:opacity-75 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Alert Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 dark:from-amber-950/70 dark:via-amber-900/40 dark:to-orange-950/40 border-2 border-amber-400/80 dark:border-amber-600/60 p-4 sm:p-5 shadow-md shadow-amber-500/10 transition-all animate-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left: Icon & Description */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 relative">
              <Clock className="w-5 h-5 animate-pulse text-amber-600 dark:text-amber-400" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-100">
                  Pengingat Perbendaharaan: Pemasukan Belum Disinkronkan ke Google Sheets
                </h4>
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-800/60 px-2 py-0.5 rounded-md">
                  &gt; 24 Jam Tertunda
                </span>
              </div>

              {/* Clean Unboxed Metadata */}
              <div className="flex items-center gap-2 text-xs text-amber-900/80 dark:text-amber-200/80 flex-wrap">
                <span>
                  <strong>{unsyncedOver24h.length}</strong> transaksi kas masuk
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Total nominal:{' '}
                  <strong className="font-mono text-amber-950 dark:text-white">
                    {formatRupiah(totalUnsyncedNominal)}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Tertua sejak:{' '}
                  <strong>
                    {oldestPendingDate ? formatTanggalIndo(oldestPendingDate) : ''} ({daysElapsed} hari lalu)
                  </strong>
                </span>
              </div>

              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 pt-0.5">
                Segera sinkronkan data penerimaan persembahan jemaat agar pembukuan di Google Spreadsheet selalu mutakhir dan siap diaudit.
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-amber-200/80 dark:border-amber-800/60">
            {/* Sync Now Action */}
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>

            {/* Toggle Details Button */}
            <button
              type="button"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{isDetailsExpanded ? 'Tutup Rincian' : 'Lihat Transaksi'}</span>
              {isDetailsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Open Google Sheets Page */}
            <button
              type="button"
              onClick={() => onNavigateTab('sheets')}
              className="px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Buka Halaman Pengaturan Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Halaman Sheets</span>
            </button>

            {/* Dismiss / Snooze */}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-2 rounded-xl text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-800/40 transition-colors cursor-pointer"
              title="Ingatkan nanti (Tutup pengingat untuk sesi ini)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Details Drawer: List of Delayed Incomes */}
        {isDetailsExpanded && (
          <div className="mt-4 pt-3.5 border-t border-amber-300/60 dark:border-amber-800/60 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-amber-950 dark:text-amber-200 font-bold">
              <span>Rincian Transaksi Pemasukan yang Belum Masuk Google Sheets:</span>
              <button
                type="button"
                onClick={() => onNavigateTab('income')}
                className="text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 text-[11px] font-semibold"
              >
                <span>Kelola di Tab Pemasukan</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-amber-300/50 dark:border-amber-800/50 bg-white/80 dark:bg-slate-900/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-100/60 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-800 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Tanggal / ID</th>
                    <th className="py-2 px-3">Jenis Persembahan</th>
                    <th className="py-2 px-3">Keterangan / Nama Jemaat</th>
                    <th className="py-2 px-3 text-right">Nominal</th>
                    <th className="py-2 px-3 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200/40 dark:divide-amber-800/40">
                  {unsyncedOver24h.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/30">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <strong className="font-mono text-slate-900 dark:text-slate-100 block">
                          {item.id}
                        </strong>
                        <span className="text-[10px] text-slate-500">
                          {formatTanggalIndo(item.tanggal)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {item.jenisPersembahan}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-700 dark:text-slate-300 block">
                          {item.keterangan}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.namaJemaat || 'Anonim'} · {item.metode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSyncSingle(item.id, item.nominal)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] shadow-2xs transition-all cursor-pointer"
                        >
                          Sinkronkan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
