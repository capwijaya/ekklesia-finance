import React, { useState } from 'react';
import {
  IncomeTransaction,
  IncomeCategory,
  NetAssetType,
  PaymentMethod,
  UserRole,
} from '../types/finance';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Lock,
  ArrowDownLeft,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface IncomeManagerProps {
  incomes: IncomeTransaction[];
  onAddIncome: (income: Omit<IncomeTransaction, 'id' | 'createdBy'>) => void;
  onDeleteIncome: (id: string) => void;
  userRole: UserRole;
  userName: string;
}

const CATEGORIES: IncomeCategory[] = [
  'Persembahan Umum / Kantong Kolekte',
  'Persepuluhan (Tithe)',
  'Persembahan Syukur (Thanksgiving)',
  'Dana Pembangunan & Renovasi',
  'Diakonia & Kasih Bencana',
  'Persembahan Sekolah Minggu / Remaja',
  'Sumbangan Donatur Khusus',
  'Pendapatan Lain-lain (Bunga/Hasil Usaha)',
];

export const IncomeManager: React.FC<IncomeManagerProps> = ({
  incomes,
  onAddIncome,
  onDeleteIncome,
  userRole,
  userName,
}) => {
  const isAuthorized = userRole === 'admin' || userRole === 'bendahara';

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jenisPersembahan, setJenisPersembahan] = useState<IncomeCategory>(
    'Persembahan Umum / Kantong Kolekte'
  );
  const [nominal, setNominal] = useState<number>(0);
  const [nominalInput, setNominalInput] = useState<string>('');
  const [keterangan, setKeterangan] = useState('');
  const [namaJemaat, setNamaJemaat] = useState('');
  const [isAnonim, setIsAnonim] = useState(false);
  const [ibadah, setIbadah] = useState<IncomeTransaction['ibadah']>('Ibadah Raya 1');
  const [metode, setMetode] = useState<PaymentMethod>('Tunai (Kas Kecil)');
  const [tipeAsetNeto, setTipeAsetNeto] = useState<NetAssetType>('tanpa_pembatasan');

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleNominalChange = (valStr: string) => {
    const rawNumber = parseInt(valStr.replace(/\D/g, ''), 10) || 0;
    setNominal(rawNumber);
    setNominalInput(rawNumber > 0 ? new Intl.NumberFormat('id-ID').format(rawNumber) : '');
  };

  const handleQuickAddNominal = (amount: number) => {
    const newTotal = nominal + amount;
    setNominal(newTotal);
    setNominalInput(new Intl.NumberFormat('id-ID').format(newTotal));
  };

  // Automatically adjust ISAK 35 asset restriction based on chosen category
  const handleCategorySelect = (cat: IncomeCategory) => {
    setJenisPersembahan(cat);
    if (cat === 'Dana Pembangunan & Renovasi' || cat === 'Diakonia & Kasih Bencana') {
      setTipeAsetNeto('dengan_pembatasan');
    } else {
      setTipeAsetNeto('tanpa_pembatasan');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || nominal <= 0) {
      alert('Mohon masukkan nominal persembahan yang valid.');
      return;
    }

    onAddIncome({
      tanggal,
      jenisPersembahan,
      nominal,
      keterangan: keterangan || jenisPersembahan,
      namaJemaat: isAnonim ? 'Hamba Allah (Anonim / NN)' : namaJemaat || 'Kolekte Jemaat',
      ibadah,
      metode,
      tipeAsetNeto,
    });

    // Reset form
    setNominal(0);
    setNominalInput('');
    setKeterangan('');
    setNamaJemaat('');
    setIsAnonim(false);
    setShowAddForm(false);
  };

  // Filter incomes
  const filteredIncomes = incomes.filter((item) => {
    const matchSearch =
      item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jenisPersembahan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.namaJemaat && item.namaJemaat.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory =
      filterCategory === 'all' || item.jenisPersembahan === filterCategory;

    return matchSearch && matchCategory;
  });

  const totalFilteredIncome = filteredIncomes.reduce((sum, i) => sum + i.nominal, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Pencatatan Pemasukan & Persembahan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data kantong kolekte, persepuluhan, ucapan syukur, dan dana terikat jemaat.
          </p>
        </div>

        {isAuthorized ? (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Tutup Form' : 'Input Pemasukan Baru'}
          </button>
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
          className="bg-white dark:bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-6 shadow-md space-y-5 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Formulir Input Pemasukan Kas Gereja
            </h4>
            <span className="text-xs text-slate-400">Petugas: {userName}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
            {/* Tanggal */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Penerimaan
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500"
              />
            </div>

            {/* Jenis Persembahan */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Jenis Persembahan
              </label>
              <select
                value={jenisPersembahan}
                onChange={(e) => handleCategorySelect(e.target.value as IncomeCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Klasifikasi ISAK 35 */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Klasifikasi Aset Neto (ISAK 35)
              </label>
              <select
                value={tipeAsetNeto}
                onChange={(e) => setTipeAsetNeto(e.target.value as NetAssetType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500"
              >
                <option value="tanpa_pembatasan">Tanpa Pembatasan (Unrestricted)</option>
                <option value="dengan_pembatasan">Dengan Pembatasan (Restricted / Terikat)</option>
              </select>
            </div>

            {/* Nominal */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Nominal Persembahan (Rp)
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

              {/* Quick Nominal Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[100000, 250000, 500000, 1000000, 5000000, 10000000].map((amt) => (
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

            {/* Ibadah / Layanan */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Ibadah / Kebaktian
              </label>
              <select
                value={ibadah}
                onChange={(e) => setIbadah(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500"
              >
                <option value="Ibadah Raya 1">Ibadah Raya 1 (Pagi)</option>
                <option value="Ibadah Raya 2">Ibadah Raya 2 (Siang)</option>
                <option value="Ibadah Doa">Ibadah Doa Tengah Minggu</option>
                <option value="Persekutuan Remaja">Persekutuan Remaja / Pemuda</option>
                <option value="Transfer/Online">Transfer Online / Rekening</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Metode Pembayaran */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Metode Pembayaran
              </label>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500"
              >
                <option value="Tunai (Kas Kecil)">Tunai (Kas Kecil)</option>
                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                <option value="QRIS Gereja">QRIS Gereja</option>
              </select>
            </div>

            {/* Nama Jemaat & Anonim */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Nama Jemaat / Donatur
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonim}
                    onChange={(e) => setIsAnonim(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Anonim (NN)</span>
                </label>
              </div>
              <input
                type="text"
                placeholder={isAnonim ? 'Tercatat sebagai Anonim / NN' : 'Contoh: Kel. Bpk. Hendra'}
                disabled={isAnonim}
                value={isAnonim ? '' : namaJemaat}
                onChange={(e) => setNamaJemaat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 focus:outline-indigo-500"
              />
            </div>

            {/* Keterangan Tambahan */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Keterangan / Intensi Doa (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Ucapan syukur kelulusan putra, komitmen pembangunan ke-3"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm"
            >
              Simpan Transaksi Pemasukan
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi, jemaat, atau nomor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-indigo-500 text-xs"
            >
              <option value="all">Semua Jenis Persembahan</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400">Total Filter:</span>{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
              {formatRupiah(totalFilteredIncome)}
            </strong>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
              <tr>
                <th className="py-3 px-4">ID / Tanggal</th>
                <th className="py-3 px-4">Jenis Persembahan</th>
                <th className="py-3 px-4">Jemaat / Keterangan</th>
                <th className="py-3 px-4">Klasifikasi ISAK 35</th>
                <th className="py-3 px-4">Metode & Ibadah</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                {isAuthorized && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan transaksi pemasukan.
                  </td>
                </tr>
              ) : (
                filteredIncomes.map((inc) => (
                  <tr
                    key={inc.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {inc.id}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatTanggalIndo(inc.tanggal)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inc.jenisPersembahan}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {inc.namaJemaat || 'Anonim'}
                      </div>
                      <div className="text-xs text-slate-400">{inc.keterangan}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          inc.tipeAsetNeto === 'tanpa_pembatasan'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        {inc.tipeAsetNeto === 'tanpa_pembatasan'
                          ? 'Tanpa Pembatasan'
                          : 'Dengan Pembatasan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {inc.metode}
                      </div>
                      <div className="text-[11px] text-slate-400">{inc.ibadah}</div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(inc.nominal)}
                    </td>
                    {isAuthorized && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Hapus transaksi ${inc.id} (${formatRupiah(inc.nominal)})?`
                              )
                            ) {
                              onDeleteIncome(inc.id);
                            }
                          }}
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
    </div>
  );
};
