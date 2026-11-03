import React, { useState } from 'react';
import {
  ExpenseTransaction,
  ExpenseCategory,
  PaymentMethod,
  UserRole,
} from '../types/finance';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Lock,
  ArrowUpRight,
  FileImage,
  Calendar,
  Eye,
  Camera,
  X,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { CsvImportModal } from './CsvImportModal';

interface ExpenseManagerProps {
  expenses: ExpenseTransaction[];
  onAddExpense: (expense: Omit<ExpenseTransaction, 'id' | 'createdBy'>) => void;
  onBulkAddExpenses?: (expenses: Omit<ExpenseTransaction, 'id' | 'createdBy'>[]) => void;
  onDeleteExpense: (id: string) => void;
  userRole: UserRole;
  userName: string;
}

const CATEGORIES: ExpenseCategory[] = [
  'Operasional & Utilitas (Listrik/Air/Internet)',
  'Pelayanan Ibadah & Musik',
  'Diakonia, Santunan & Beasiswa',
  'Pemeliharaan Gedung & Sarana',
  'Honorarium & Tunjangan Pelayan',
  'Misi & Penginjilan',
  'Pembelian Perlengkapan & Aset',
];

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  expenses,
  onAddExpense,
  onBulkAddExpenses,
  onDeleteExpense,
  userRole,
  userName,
}) => {
  const isAuthorized = userRole === 'admin' || userRole === 'bendahara';
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kategori, setKategori] = useState<ExpenseCategory>(
    'Operasional & Utilitas (Listrik/Air/Internet)'
  );
  const [nominal, setNominal] = useState<number>(0);
  const [nominalInput, setNominalInput] = useState<string>('');
  const [keterangan, setKeterangan] = useState('');
  const [penerima, setPenerima] = useState('');
  const [nomorBukti, setNomorBukti] = useState('');
  const [notaUrl, setNotaUrl] = useState<string>('');
  const [metode, setMetode] = useState<PaymentMethod>('Transfer Bank BCA');
  const [posISAK35, setPosISAK35] = useState<ExpenseTransaction['posISAK35']>(
    'Beban Pendukung & Operasional'
  );

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeReceiptModal, setActiveReceiptModal] = useState<ExpenseTransaction | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleNominalChange = (valStr: string) => {
    const rawNumber = parseInt(valStr.replace(/\D/g, ''), 10) || 0;
    setNominal(rawNumber);
    setNominalInput(rawNumber > 0 ? new Intl.NumberFormat('id-ID').format(rawNumber) : '');
    if (formError) setFormError(null);
  };

  const handleQuickAddNominal = (amount: number) => {
    const newTotal = nominal + amount;
    setNominal(newTotal);
    setNominalInput(new Intl.NumberFormat('id-ID').format(newTotal));
    if (formError) setFormError(null);
  };

  // Map category to default ISAK 35 expense classification
  const handleCategoryChange = (cat: ExpenseCategory) => {
    setKategori(cat);
    if (
      cat === 'Pelayanan Ibadah & Musik' ||
      cat === 'Diakonia, Santunan & Beasiswa' ||
      cat === 'Misi & Penginjilan'
    ) {
      setPosISAK35('Beban Program Pelayanan');
    } else if (cat === 'Pembelian Perlengkapan & Aset') {
      setPosISAK35('Pengeluaran Investasi Aset Tetap');
    } else {
      setPosISAK35('Beban Pendukung & Operasional');
    }
  };

  // Handle Receipt File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNotaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || nominal <= 0) {
      setFormError('Mohon masukkan nominal pengeluaran yang valid.');
      return;
    }

    const generatedVoucher =
      nomorBukti ||
      `VCH-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(
        100 + Math.random() * 900
      )}`;

    onAddExpense({
      tanggal,
      kategori,
      nominal,
      keterangan: keterangan || kategori,
      penerima: penerima || 'Pihak Ketiga',
      nomorBukti: generatedVoucher,
      notaUrl,
      metode,
      posISAK35,
    });

    // Reset form
    setNominal(0);
    setNominalInput('');
    setKeterangan('');
    setPenerima('');
    setNomorBukti('');
    setNotaUrl('');
    setFormError(null);
    setShowAddForm(false);
  };

  // Filter expenses with full-text search & nominal parsing
  const filteredExpenses = expenses.filter((item) => {
    const query = searchTerm.trim().toLowerCase();

    // Check if query matches nominal (either as raw digits or formatted IDR)
    const matchNominal = () => {
      if (!query) return false;
      const rawNominalStr = item.nominal.toString();
      const formattedNominal = formatRupiah(item.nominal).toLowerCase();
      const cleanDigits = query.replace(/[^\d]/g, '');

      if (rawNominalStr.includes(query)) return true;
      if (formattedNominal.includes(query)) return true;
      if (cleanDigits.length >= 2 && rawNominalStr.includes(cleanDigits)) return true;
      return false;
    };

    const matchSearch =
      !query ||
      item.keterangan.toLowerCase().includes(query) ||
      (item.penerima && item.penerima.toLowerCase().includes(query)) ||
      item.kategori.toLowerCase().includes(query) ||
      item.metode.toLowerCase().includes(query) ||
      item.nomorBukti.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      matchNominal();

    const matchCategory =
      filterCategory === 'all' || item.kategori === filterCategory;

    return matchSearch && matchCategory;
  });

  const totalFilteredExpense = filteredExpenses.reduce((sum, e) => sum + e.nominal, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            Pencatatan Pengeluaran & Nota Kuitansi
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasikan belanja operasional, program pelayanan, gaji pastoral, dan bukti kuitansi.
          </p>
        </div>

        {isAuthorized ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowCsvModal(true)}
              className="px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Impor CSV Massal
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showAddForm ? 'Tutup Form' : 'Input Pengeluaran Baru'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            Mode Tinjau (Hanya Admin / Bendahara yang dapat menginput)
          </div>
        )}
      </div>

      {/* Add Form (Collapsible) */}
      {showAddForm && isAuthorized && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border-2 border-rose-500/30 rounded-2xl p-6 shadow-md space-y-5 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-600" />
              Formulir Input Pengeluaran Kas & Bukti Nota
            </h4>
            <span className="text-xs text-slate-400">Petugas: {userName}</span>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
            {/* Tanggal */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Pengeluaran
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500"
              />
            </div>

            {/* Kategori */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Kategori Pengeluaran
              </label>
              <select
                value={kategori}
                onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Pos ISAK 35 */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Pos Beban ISAK 35
              </label>
              <select
                value={posISAK35}
                onChange={(e) => setPosISAK35(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500"
              >
                <option value="Beban Program Pelayanan">Beban Program Pelayanan</option>
                <option value="Beban Pendukung & Operasional">Beban Pendukung & Operasional</option>
                <option value="Pengeluaran Investasi Aset Tetap">
                  Pengeluaran Investasi Aset Tetap
                </option>
              </select>
            </div>

            {/* Nominal */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Nominal Pengeluaran (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  placeholder="0"
                  value={nominalInput}
                  onChange={(e) => handleNominalChange(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-base text-slate-900 dark:text-white focus:outline-indigo-500"
                />
              </div>

              {/* Quick Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[100000, 250000, 500000, 1000000, 2500000, 5000000].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => handleQuickAddNominal(amt)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                  >
                    +{formatRupiah(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Penerima Dana */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Penerima Dana / Toko / Vendor
              </label>
              <input
                type="text"
                placeholder="Contoh: PT PLN, Toko Gloria, Tim Musik"
                value={penerima}
                onChange={(e) => setPenerima(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500"
              />
            </div>

            {/* No. Bukti / Voucher */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                No. Kuitansi / Voucher Kas
              </label>
              <input
                type="text"
                placeholder="Otomatis jika dikosongkan (contoh: KW-1026/01)"
                value={nomorBukti}
                onChange={(e) => setNomorBukti(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500 font-mono text-xs"
              />
            </div>

            {/* Metode Pembayaran */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Metode Pembayaran / Akun Kas
              </label>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500"
              >
                <option value="Tunai (Kas Kecil)">Tunai (Kas Kecil Bendahara)</option>
                <option value="Transfer Bank BCA">Transfer Bank BCA (Operasional)</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri (Pembangunan)</option>
              </select>
            </div>

            {/* Upload Nota / Kuitansi */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Foto Nota / Kuitansi</span>
                {notaUrl && (
                  <button
                    type="button"
                    onClick={() => setNotaUrl('')}
                    className="text-[11px] text-rose-500 hover:underline"
                  >
                    Hapus Foto
                  </button>
                )}
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-400 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all">
                  <Camera className="w-4 h-4 text-rose-500" />
                  <span className="text-xs">
                    {notaUrl ? 'Ganti Foto Nota' : 'Pilih Foto / Dokumen Nota'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {notaUrl && (
                  <img
                    src={notaUrl}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                  />
                )}
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Keterangan Keperluan Belanja
              </label>
              <input
                type="text"
                placeholder="Contoh: Servis 6 unit AC Daikin, Pembelian lilin altar dan bunga"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-sm"
            >
              Simpan Transaksi Pengeluaran
            </button>
          </div>
        </form>
      )}

      {/* Enhanced Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari keterangan, nominal (cth: 500.000 atau 500000), penerima / vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-rose-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                title="Hapus kata kunci"
                className="absolute right-3 top-3 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter & Stats */}
          <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-rose-500 text-xs cursor-pointer"
              >
                <option value="all">Semua Kategori Pengeluaran</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-400">Total Filter:</span>{' '}
              <strong className="text-rose-600 dark:text-rose-400 text-sm">
                {formatRupiah(totalFilteredExpense)}
              </strong>
            </div>
          </div>
        </div>

        {/* Quick Search Chips & Filter Status Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium">Pencarian cepat:</span>
            {['Listrik', 'AC', 'Honor', 'Perjamuan', 'Misi', 'Kas Kecil', 'BCA'].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setSearchTerm(searchTerm === chip ? '' : chip)}
                className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  searchTerm === chip
                    ? 'bg-rose-600 text-white border-rose-600 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            <span>
              Menampilkan <strong>{filteredExpenses.length}</strong> dari {expenses.length} data
            </span>
            {(searchTerm || filterCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('all');
                }}
                className="text-rose-600 dark:text-rose-400 hover:underline font-bold ml-1.5 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
              <tr>
                <th className="py-3 px-4">No. Bukti / Tanggal</th>
                <th className="py-3 px-4">Kategori Pengeluaran</th>
                <th className="py-3 px-4">Keperluan & Penerima</th>
                <th className="py-3 px-4">Nota / Bukti</th>
                <th className="py-3 px-4">Akun Kas / Pos ISAK</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                {isAuthorized && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan transaksi pengeluaran.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {exp.nomorBukti}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatTanggalIndo(exp.tanggal)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {exp.kategori}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {exp.keterangan}
                      </div>
                      <div className="text-xs text-slate-400">Penerima: {exp.penerima}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {exp.notaUrl ? (
                        <button
                          onClick={() => setActiveReceiptModal(exp)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Nota
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveReceiptModal(exp)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                        >
                          <FileImage className="w-3 h-3" />
                          Voucher Kas
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800 dark:text-slate-200 font-medium text-xs">
                        {exp.metode}
                      </div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                        {exp.posISAK35}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">
                      {formatRupiah(exp.nominal)}
                    </td>
                    {isAuthorized && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setDeleteConfirmId(exp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Hapus data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Bukti Pengeluaran & Nota Kas
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  {activeReceiptModal.nomorBukti} • {activeReceiptModal.tanggal}
                </p>
              </div>
              <button
                onClick={() => setActiveReceiptModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block">Kategori</span>
                  <strong className="text-slate-800 dark:text-white">
                    {activeReceiptModal.kategori}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Nominal</span>
                  <strong className="text-rose-600 dark:text-rose-400 text-sm">
                    {formatRupiah(activeReceiptModal.nominal)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Penerima Dana</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {activeReceiptModal.penerima}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Metode Bayar</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {activeReceiptModal.metode}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block">Keperluan</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {activeReceiptModal.keterangan}
                  </span>
                </div>
              </div>

              {/* Receipt image or generated voucher preview */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[220px]">
                {activeReceiptModal.notaUrl ? (
                  <img
                    src={activeReceiptModal.notaUrl}
                    alt="Nota Bukti"
                    className="max-h-72 object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <Receipt className="w-12 h-12 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Voucher Pengeluaran Kas Resmi Gereja
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Transaksi telah diverifikasi oleh Bendahara dengan Nomor Voucher{' '}
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                        {activeReceiptModal.nomorBukti}
                      </span>
                      . Bukti fisik tersimpan di arsip kas bendahara jemaat.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveReceiptModal(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs sm:text-sm font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Konfirmasi Hapus Pengeluaran
            </h4>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus data pengeluaran ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteExpense(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Csv Import Modal */}
      <CsvImportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        defaultType="expense"
        onImportIncomes={() => {}}
        onImportExpenses={(importedExpenses) => {
          if (onBulkAddExpenses) {
            onBulkAddExpenses(importedExpenses);
          } else {
            importedExpenses.forEach(onAddExpense);
          }
        }}
        userName={userName}
      />
    </div>
  );
};
