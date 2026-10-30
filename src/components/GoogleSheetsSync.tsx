import React, { useState } from 'react';
import {
  IncomeTransaction,
  ExpenseTransaction,
  SheetsSyncState,
  ChurchInfo,
} from '../types/finance';
import {
  googleSignIn,
  logoutGoogle,
  getAccessToken,
} from '../services/googleAuth';
import {
  createChurchSpreadsheet,
  syncAllToGoogleSheets,
  getSpreadsheetDetails,
} from '../services/googleSheets';
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  FolderSync,
} from 'lucide-react';

interface GoogleSheetsSyncProps {
  incomes: IncomeTransaction[];
  expenses: ExpenseTransaction[];
  churchInfo: ChurchInfo;
  syncState: SheetsSyncState;
  onUpdateSyncState: (newState: Partial<SheetsSyncState>) => void;
  userEmail?: string;
}

export const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({
  incomes,
  expenses,
  churchInfo,
  syncState,
  onUpdateSyncState,
  userEmail,
}) => {
  const [existingSheetInput, setExistingSheetInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Sign In with Google
  const handleGoogleConnect = async () => {
    try {
      setStatusMessage({ type: 'info', text: 'Menghubungkan ke Google...' });
      const authResult = await googleSignIn();
      if (authResult) {
        onUpdateSyncState({ isConnected: true });
        setStatusMessage({
          type: 'success',
          text: `Berhasil terhubung sebagai ${authResult.user.email}!`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal login dengan akun Google.',
      });
    }
  };

  // Sign Out
  const handleGoogleDisconnect = async () => {
    await logoutGoogle();
    onUpdateSyncState({ isConnected: false });
    setStatusMessage({ type: 'info', text: 'Koneksi akun Google telah diputus.' });
  };

  // Create New Spreadsheet
  const handleCreateNewSheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Silakan klik "Hubungkan Akun Google" terlebih dahulu.',
      });
      return;
    }

    try {
      onUpdateSyncState({ isSyncing: true, syncError: null });
      setStatusMessage({
        type: 'info',
        text: 'Sedang membuat Google Spreadsheet baru di Drive...',
      });

      const newSheet = await createChurchSpreadsheet(token, churchInfo.namaGereja);

      // Now sync existing data into the newly created sheet
      await syncAllToGoogleSheets(token, newSheet.spreadsheetId, incomes, expenses);

      const now = new Date().toLocaleTimeString('id-ID');
      onUpdateSyncState({
        spreadsheetId: newSheet.spreadsheetId,
        spreadsheetUrl: newSheet.spreadsheetUrl,
        spreadsheetTitle: newSheet.title,
        lastSyncedAt: now,
        isSyncing: false,
      });

      setStatusMessage({
        type: 'success',
        text: `Spreadsheet "${newSheet.title}" berhasil dibuat dan ${incomes.length + expenses.length} transaksi telah disinkronkan!`,
      });
    } catch (err: any) {
      console.error(err);
      onUpdateSyncState({ isSyncing: false, syncError: err.message });
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal membuat Google Spreadsheet.',
      });
    }
  };

  // Link Existing Sheet
  const handleLinkExistingSheet = async () => {
    if (!existingSheetInput.trim()) return;

    let sheetId = existingSheetInput.trim();
    // Check if user entered full URL: e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
    const match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Silakan klik "Hubungkan Akun Google" terlebih dahulu.',
      });
      return;
    }

    try {
      onUpdateSyncState({ isSyncing: true, syncError: null });
      setStatusMessage({ type: 'info', text: 'Memvalidasi Google Spreadsheet...' });

      const details = await getSpreadsheetDetails(token, sheetId);
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

      onUpdateSyncState({
        spreadsheetId: sheetId,
        spreadsheetUrl: sheetUrl,
        spreadsheetTitle: details.title,
        isSyncing: false,
      });

      setStatusMessage({
        type: 'success',
        text: `Berhasil terhubung ke "${details.title}"! Klik 'Sinkronkan Data Sekarang' untuk mengirim data.`,
      });
      setExistingSheetInput('');
    } catch (err: any) {
      console.error(err);
      onUpdateSyncState({ isSyncing: false, syncError: err.message });
      setStatusMessage({
        type: 'error',
        text: err.message || 'Tidak dapat menemukan Spreadsheet tersebut.',
      });
    }
  };

  // Manual Trigger Sync All
  const handleManualSync = async () => {
    if (!syncState.spreadsheetId) {
      setStatusMessage({
        type: 'error',
        text: 'Belum ada Spreadsheet yang dipilih.',
      });
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Silakan hubungkan akun Google terlebih dahulu.',
      });
      return;
    }

    try {
      onUpdateSyncState({ isSyncing: true, syncError: null });
      setStatusMessage({ type: 'info', text: 'Sedang menyinkronkan data ke Google Spreadsheet...' });

      await syncAllToGoogleSheets(token, syncState.spreadsheetId, incomes, expenses);

      const now = new Date().toLocaleTimeString('id-ID');
      onUpdateSyncState({
        lastSyncedAt: now,
        isSyncing: false,
      });

      setStatusMessage({
        type: 'success',
        text: `Sinkronisasi berhasil! ${incomes.length} pemasukan dan ${expenses.length} pengeluaran telah terbarui.`,
      });
    } catch (err: any) {
      console.error(err);
      onUpdateSyncState({ isSyncing: false, syncError: err.message });
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal menyinkronkan data ke Spreadsheet.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Integrasi Google Spreadsheet
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan keuangan otomatis tersimpan aman di Google Drive & Spreadsheet gereja
              </p>
            </div>
          </div>

          <div>
            {!syncState.isConnected ? (
              <button
                onClick={handleGoogleConnect}
                className="gsi-material-button px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all text-slate-700 dark:text-slate-200"
              >
                <LogIn className="w-4 h-4 text-emerald-600" />
                Hubungkan Akun Google
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Terhubung ke Google
                </span>
                <button
                  onClick={handleGoogleDisconnect}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 text-xs flex items-center gap-1 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Putus
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Active Spreadsheet Status Card */}
        {syncState.spreadsheetId ? (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                  Spreadsheet Aktif
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {syncState.spreadsheetTitle || 'Buku Kas Keuangan Gereja'}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {syncState.spreadsheetId}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {syncState.spreadsheetUrl && (
                  <a
                    href={syncState.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    Buka di Google Sheets
                  </a>
                )}

                <button
                  onClick={handleManualSync}
                  disabled={syncState.isSyncing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`}
                  />
                  {syncState.isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span>
                Terakhir disinkronkan: <strong>{syncState.lastSyncedAt || 'Belum pernah'}</strong>
              </span>
              <span>•</span>
              <span>{incomes.length} Pemasukan</span>
              <span>•</span>
              <span>{expenses.length} Pengeluaran</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: Create New */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  Buat Spreadsheet Baru Otomatis
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Sistem akan membuat Google Spreadsheet di Google Drive Anda dengan format tab:
                  <strong> Pemasukan</strong>, <strong> Pengeluaran</strong>, dan
                  <strong> Ringkasan Kas</strong> yang sudah tertata rapi.
                </p>
              </div>

              <button
                onClick={handleCreateNewSheet}
                disabled={syncState.isSyncing}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                {syncState.isSyncing ? 'Sedang Membuat...' : 'Buat Spreadsheet di Drive'}
              </button>
            </div>

            {/* Option B: Connect Existing */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-indigo-600" />
                  Hubungkan Spreadsheet yang Ada
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Masukkan ID atau URL Google Spreadsheet yang sudah Anda miliki untuk dihubungkan.
                </p>

                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/... atau Spreadsheet ID"
                  value={existingSheetInput}
                  onChange={(e) => setExistingSheetInput(e.target.value)}
                  className="mt-3 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-indigo-500"
                />
              </div>

              <button
                onClick={handleLinkExistingSheet}
                disabled={!existingSheetInput.trim() || syncState.isSyncing}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                Hubungkan Spreadsheet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sheet Structure Guide */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <FolderSync className="w-4 h-4 text-indigo-600" />
          Struktur Tabel di Google Spreadsheet
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              1. Tab "Pemasukan"
            </span>
            <p className="text-slate-500">
              ID Transaksi, Tanggal, Jenis Persembahan, Nominal (Rp), Keterangan, Nama Jemaat,
              Ibadah, Metode Bayar, Klasifikasi ISAK 35, Petugas.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-bold text-rose-600 dark:text-rose-400">
              2. Tab "Pengeluaran"
            </span>
            <p className="text-slate-500">
              ID Transaksi, Tanggal, Kategori Pengeluaran, Nominal (Rp), Keperluan, Penerima, No.
              Voucher, Metode Pembayaran, Pos Beban ISAK 35, Petugas.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              3. Tab "Ringkasan_Kas"
            </span>
            <p className="text-slate-500">
              Rekapitulasi total penerimaan kas, total realisasi belanja, posisi surplus/defisit, dan
              saldo kas terkini secara otomatis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
