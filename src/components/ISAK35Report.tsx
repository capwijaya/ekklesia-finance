import React, { useState } from 'react';
import { IncomeTransaction, ExpenseTransaction, ChurchInfo } from '../types/finance';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import {
  FileText,
  Building2,
  TrendingUp,
  Coins,
  ShieldCheck,
  Download,
  Info,
  Calendar,
} from 'lucide-react';

interface ISAK35ReportProps {
  incomes: IncomeTransaction[];
  expenses: ExpenseTransaction[];
  churchInfo: ChurchInfo;
  selectedYear: number;
}

export const ISAK35Report: React.FC<ISAK35ReportProps> = ({
  incomes,
  expenses,
  churchInfo,
  selectedYear,
}) => {
  const [activeReport, setActiveReport] = useState<'posisi' | 'aktivitas' | 'aruskas' | 'calk'>(
    'posisi'
  );

  // Filter transactions for this year
  const yearIncomes = incomes.filter((i) => new Date(i.tanggal).getFullYear() === selectedYear);
  const yearExpenses = expenses.filter((e) => new Date(e.tanggal).getFullYear() === selectedYear);

  // Totals for Incomes based on ISAK 35 classification
  const incomeTanpaPembatasan = yearIncomes
    .filter((i) => i.tipeAsetNeto === 'tanpa_pembatasan')
    .reduce((sum, i) => sum + i.nominal, 0);

  const incomeDenganPembatasan = yearIncomes
    .filter((i) => i.tipeAsetNeto === 'dengan_pembatasan')
    .reduce((sum, i) => sum + i.nominal, 0);

  const totalPendapatan = incomeTanpaPembatasan + incomeDenganPembatasan;

  // Totals for Expenses based on ISAK 35 classification
  const bebanProgram = yearExpenses
    .filter((e) => e.posISAK35 === 'Beban Program Pelayanan')
    .reduce((sum, e) => sum + e.nominal, 0);

  const bebanPendukung = yearExpenses
    .filter((e) => e.posISAK35 === 'Beban Pendukung & Operasional')
    .reduce((sum, e) => sum + e.nominal, 0);

  const bebanInvestasiAset = yearExpenses
    .filter((e) => e.posISAK35 === 'Pengeluaran Investasi Aset Tetap')
    .reduce((sum, e) => sum + e.nominal, 0);

  const totalBebanOperasi = bebanProgram + bebanPendukung;
  const kenaikanAsetNetoBersih = totalPendapatan - totalBebanOperasi - bebanInvestasiAset;

  // Breakdown of Cash & Bank
  const kasKecil =
    yearIncomes
      .filter((i) => i.metode === 'Tunai (Kas Kecil)')
      .reduce((sum, i) => sum + i.nominal, 0) -
    yearExpenses
      .filter((e) => e.metode === 'Tunai (Kas Kecil)')
      .reduce((sum, e) => sum + e.nominal, 0);

  const bankBCA =
    yearIncomes
      .filter((i) => i.metode === 'Transfer Bank BCA' || i.metode === 'QRIS Gereja')
      .reduce((sum, i) => sum + i.nominal, 0) -
    yearExpenses
      .filter((e) => e.metode === 'Transfer Bank BCA')
      .reduce((sum, e) => sum + e.nominal, 0);

  const bankMandiri =
    yearIncomes
      .filter((i) => i.metode === 'Transfer Bank Mandiri')
      .reduce((sum, i) => sum + i.nominal, 0) -
    yearExpenses
      .filter((e) => e.metode === 'Transfer Bank Mandiri')
      .reduce((sum, e) => sum + e.nominal, 0);

  // Baseline beginning balances (Saldo Awal Per 1 Jan 2026)
  const saldoAwalKas = 45000000;
  const saldoAwalBankBCA = 120000000;
  const saldoAwalBankMandiri = 85000000;

  const totalKasDanSetaraKas =
    saldoAwalKas + kasKecil + saldoAwalBankBCA + bankBCA + saldoAwalBankMandiri + bankMandiri;

  // Fixed Assets (Aset Tetap Gereja)
  const nilaiTanahGedung = 3500000000; // Rp 3.5 Miliar
  const nilaiPeralatanIbadah = 180000000 + bebanInvestasiAset;
  const akumulasiPenyusutan = -45000000;
  const totalAsetTetap = nilaiTanahGedung + nilaiPeralatanIbadah + akumulasiPenyusutan;

  const totalAset = totalKasDanSetaraKas + totalAsetTetap;

  // Liabilities
  const utangTitipanMisi = 12500000;
  const utangBebanOperasional = 4800000;
  const totalLiabilitas = utangTitipanMisi + utangBebanOperasional;

  // Net Assets
  const asetNetoDenganPembatasan = incomeDenganPembatasan + 95000000; // Sisa saldo pembatasan masa lalu
  const asetNetoTanpaPembatasan = totalAset - totalLiabilitas - asetNetoDenganPembatasan;
  const totalAsetNeto = asetNetoTanpaPembatasan + asetNetoDenganPembatasan;

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-indigo-900/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Kepatuhan Standar Akuntansi Keuangan
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Laporan Keuangan Entitas Gereja (ISAK 35)
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1">
              {churchInfo.namaGereja} • Periode Pelaporan Tahun {selectedYear}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-xs">
            <Calendar className="w-4 h-4 text-indigo-300" />
            <span>Tahun Buku: <strong>{selectedYear}</strong></span>
          </div>
        </div>

        {/* ISAK 35 Sub-navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveReport('posisi')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeReport === 'posisi'
                ? 'bg-white text-indigo-950 shadow-md font-bold'
                : 'text-indigo-100/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Posisi Keuangan (Neraca)
          </button>
          <button
            onClick={() => setActiveReport('aktivitas')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeReport === 'aktivitas'
                ? 'bg-white text-indigo-950 shadow-md font-bold'
                : 'text-indigo-100/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Penghasilan Komprehensif (Aktivitas)
          </button>
          <button
            onClick={() => setActiveReport('aruskas')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeReport === 'aruskas'
                ? 'bg-white text-indigo-950 shadow-md font-bold'
                : 'text-indigo-100/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            Arus Kas
          </button>
          <button
            onClick={() => setActiveReport('calk')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeReport === 'calk'
                ? 'bg-white text-indigo-950 shadow-md font-bold'
                : 'text-indigo-100/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Catatan Keuangan (CALK)
          </button>
        </div>
      </div>

      {/* Report 1: Laporan Posisi Keuangan (Neraca) */}
      {activeReport === 'posisi' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {churchInfo.namaGereja}
            </h3>
            <h4 className="text-base font-semibold text-indigo-600 dark:text-indigo-400">
              LAPORAN POSISI KEUANGAN (ISAK 35)
            </h4>
            <p className="text-xs text-slate-500">Per 31 Desember {selectedYear}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ASET */}
            <div className="space-y-4">
              <h5 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b-2 border-indigo-600 dark:border-indigo-400">
                ASET
              </h5>

              {/* Aset Lancar */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Aset Lancar:
                </span>
                <div className="pl-3 space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Kas di Bendahara (Tunai)</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatRupiah(saldoAwalKas + kasKecil)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Bank BCA (Operasional & QRIS)</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatRupiah(saldoAwalBankBCA + bankBCA)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Bank Mandiri (Pembangunan & Khusus)</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatRupiah(saldoAwalBankMandiri + bankMandiri)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 px-2 rounded-lg">
                    <span>Jumlah Aset Lancar</span>
                    <span>{formatRupiah(totalKasDanSetaraKas)}</span>
                  </div>
                </div>
              </div>

              {/* Aset Tidak Lancar / Tetap */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Aset Tidak Lancar (Aset Tetap):
                </span>
                <div className="pl-3 space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Tanah & Gedung Gereja</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatRupiah(nilaiTanahGedung)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Peralatan Ibadah, Musik & Sound</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatRupiah(nilaiPeralatanIbadah)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Akumulasi Penyusutan</span>
                    <span className="font-medium text-rose-500">
                      ({formatRupiah(Math.abs(akumulasiPenyusutan))})
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 px-2 rounded-lg">
                    <span>Jumlah Aset Tetap Bersih</span>
                    <span>{formatRupiah(totalAsetTetap)}</span>
                  </div>
                </div>
              </div>

              {/* TOTAL ASET */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex justify-between items-center text-sm font-bold text-indigo-900 dark:text-indigo-200">
                <span>JUMLAH ASET</span>
                <span className="text-base">{formatRupiah(totalAset)}</span>
              </div>
            </div>

            {/* LIABILITAS & ASET NETO */}
            <div className="space-y-4">
              <h5 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b-2 border-indigo-600 dark:border-indigo-400">
                LIABILITAS & ASET NETO
              </h5>

              {/* Liabilitas */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Liabilitas Jangka Pendek:
                </span>
                <div className="pl-3 space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Titipan Persembahan Misi Pedalaman</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatRupiah(utangTitipanMisi)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Utang Beban Utilitas & Operasional</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatRupiah(utangBebanOperasional)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 px-2 rounded-lg">
                    <span>Jumlah Liabilitas</span>
                    <span>{formatRupiah(totalLiabilitas)}</span>
                  </div>
                </div>
              </div>

              {/* ASET NETO (ISAK 35 CORE) */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Aset Neto (Sesuai Ketentuan ISAK 35):
                </span>
                <div className="pl-3 space-y-2 text-xs sm:text-sm">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-slate-700 dark:text-slate-200">
                        1. Tanpa Pembatasan dari Pemberi Sumber Daya
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatRupiah(asetNetoTanpaPembatasan)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Saldo dari persembahan kolekte umum, persepuluhan & ucapan syukur yang bebas dialokasikan untuk kegiatan gereja.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl space-y-1 border border-amber-200/50 dark:border-amber-800/40">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-amber-900 dark:text-amber-200">
                        2. Dengan Pembatasan dari Pemberi Sumber Daya
                      </span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        {formatRupiah(asetNetoDenganPembatasan)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Dana terikat pembangunan gedung ibadah, renovasi fisik, dan santunan kasih bencana yang wajib dialokasikan sesuai tujuan donatur.
                    </p>
                  </div>

                  <div className="flex justify-between py-1.5 font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 px-2 rounded-lg">
                    <span>Jumlah Aset Neto</span>
                    <span>{formatRupiah(totalAsetNeto)}</span>
                  </div>
                </div>
              </div>

              {/* TOTAL LIABILITAS & ASET NETO */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex justify-between items-center text-sm font-bold text-indigo-900 dark:text-indigo-200">
                <span>JUMLAH LIABILITAS & ASET NETO</span>
                <span className="text-base">{formatRupiah(totalLiabilitas + totalAsetNeto)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Laporan Penghasilan Komprehensif (Laporan Aktivitas) */}
      {activeReport === 'aktivitas' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {churchInfo.namaGereja}
            </h3>
            <h4 className="text-base font-semibold text-indigo-600 dark:text-indigo-400">
              LAPORAN PENGHASILAN KOMPREHENSIF / AKTIVITAS (ISAK 35)
            </h4>
            <p className="text-xs text-slate-500">Tahun Buku {selectedYear}</p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm">
            {/* Bagian 1: Pendapatan */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                I. PENDAPATAN PERSEMBAHAN & SUMBANGAN JEMAAT
              </h5>
              <div className="pl-4 space-y-1">
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">
                    Persembahan Tanpa Pembatasan (Kolekte Umum, Persepuluhan, Syukur)
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatRupiah(incomeTanpaPembatasan)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">
                    Persembahan Dengan Pembatasan (Dana Pembangunan, Diakonia Khusus)
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatRupiah(incomeDenganPembatasan)}
                  </span>
                </div>
                <div className="flex justify-between py-2 font-bold text-emerald-600 dark:text-emerald-400">
                  <span>TOTAL PENDAPATAN</span>
                  <span>{formatRupiah(totalPendapatan)}</span>
                </div>
              </div>
            </div>

            {/* Bagian 2: Beban-Beban */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                II. BEBAN-BEBAN PELAYANAN & OPERASIONAL
              </h5>
              <div className="pl-4 space-y-2">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    A. Beban Program Pelayanan:
                  </span>
                  <div className="pl-4 space-y-1 mt-1 text-slate-600 dark:text-slate-400">
                    {yearExpenses
                      .filter((e) => e.posISAK35 === 'Beban Program Pelayanan')
                      .map((exp) => (
                        <div key={exp.id} className="flex justify-between py-0.5">
                          <span>{exp.keterangan}</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {formatRupiah(exp.nominal)}
                          </span>
                        </div>
                      ))}
                    <div className="flex justify-between py-1 font-semibold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700">
                      <span>Subtotal Beban Program</span>
                      <span>{formatRupiah(bebanProgram)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    B. Beban Pendukung & Operasional Gereja:
                  </span>
                  <div className="pl-4 space-y-1 mt-1 text-slate-600 dark:text-slate-400">
                    {yearExpenses
                      .filter((e) => e.posISAK35 === 'Beban Pendukung & Operasional')
                      .map((exp) => (
                        <div key={exp.id} className="flex justify-between py-0.5">
                          <span>{exp.keterangan}</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {formatRupiah(exp.nominal)}
                          </span>
                        </div>
                      ))}
                    <div className="flex justify-between py-1 font-semibold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700">
                      <span>Subtotal Beban Pendukung</span>
                      <span>{formatRupiah(bebanPendukung)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between py-2 font-bold text-rose-600 dark:text-rose-400 border-t-2 border-slate-200 dark:border-slate-700">
                  <span>TOTAL BEBAN</span>
                  <span>{formatRupiah(totalBebanOperasi)}</span>
                </div>
              </div>
            </div>

            {/* Bagian 3: Kenaikan Aset Neto */}
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex justify-between items-center text-sm font-bold text-indigo-950 dark:text-indigo-200">
              <div>
                <span>KENAIKAN (PENURUNAN) BERSIH ASET NETO</span>
                <p className="text-xs font-normal text-slate-500 mt-0.5">
                  Surplus keuangan tahun berjalan yang menambah ekuitas pelayanan gereja
                </p>
              </div>
              <span className="text-base text-emerald-600 dark:text-emerald-400">
                {formatRupiah(kenaikanAsetNetoBersih)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Report 3: Laporan Arus Kas */}
      {activeReport === 'aruskas' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {churchInfo.namaGereja}
            </h3>
            <h4 className="text-base font-semibold text-indigo-600 dark:text-indigo-400">
              LAPORAN ARUS KAS (ISAK 35)
            </h4>
            <p className="text-xs text-slate-500">Metode Langsung • Tahun {selectedYear}</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* Aktivitas Operasi */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                1. ARUS KAS DARI AKTIVITAS OPERASI
              </h5>
              <div className="pl-4 space-y-1">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Penerimaan dari Persembahan Jemaat</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatRupiah(totalPendapatan)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Pembayaran Beban Program Pelayanan</span>
                  <span className="font-medium text-rose-500">({formatRupiah(bebanProgram)})</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Pembayaran Beban Operasional & Utilitas</span>
                  <span className="font-medium text-rose-500">({formatRupiah(bebanPendukung)})</span>
                </div>
                <div className="flex justify-between py-1.5 font-semibold text-indigo-600 dark:text-indigo-400 border-t border-slate-200 dark:border-slate-700">
                  <span>Arus Kas Bersih dari Aktivitas Operasi</span>
                  <span>{formatRupiah(totalPendapatan - totalBebanOperasi)}</span>
                </div>
              </div>
            </div>

            {/* Aktivitas Investasi */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                2. ARUS KAS DARI AKTIVITAS INVESTASI
              </h5>
              <div className="pl-4 space-y-1">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">
                    Pengadaan Peralatan Multimedia & Sound System
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {bebanInvestasiAset > 0 ? `(${formatRupiah(bebanInvestasiAset)})` : 'Rp 0'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 font-semibold text-indigo-600 dark:text-indigo-400 border-t border-slate-200 dark:border-slate-700">
                  <span>Arus Kas Bersih dari Aktivitas Investasi</span>
                  <span>{bebanInvestasiAset > 0 ? `(${formatRupiah(bebanInvestasiAset)})` : 'Rp 0'}</span>
                </div>
              </div>
            </div>

            {/* Rekonsiliasi Kas */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-slate-600 dark:text-slate-300">Kenaikan Bersih Kas & Setara Kas</span>
                <span className="text-emerald-600 font-bold">
                  {formatRupiah(totalPendapatan - totalBebanOperasi - bebanInvestasiAset)}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-600 dark:text-slate-300">Saldo Kas & Setara Kas pada Awal Periode</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  {formatRupiah(saldoAwalKas + saldoAwalBankBCA + saldoAwalBankMandiri)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>SALDO KAS & SETARA KAS PADA AKHIR PERIODE</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {formatRupiah(totalKasDanSetaraKas)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 4: Catatan atas Laporan Keuangan (CALK) */}
      {activeReport === 'calk' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Catatan atas Laporan Keuangan (CALK) & Kebijakan Akuntansi
            </h4>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                1. Dasar Penyusunan & Kepatuhan ISAK 35
              </h5>
              <p>
                Laporan Keuangan disajikan sesuai dengan <strong>Interpretasi Standar Akuntansi Keuangan 35 (ISAK 35)</strong> tentang <em>Penyajian Laporan Keuangan Entitas Berorientasi Nonlaba</em> yang diterbitkan oleh Dewan Standar Akuntansi Keuangan Ikatan Akuntan Indonesia (DSAK IAI).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                2. Klasifikasi Aset Neto
              </h5>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Aset Neto Tanpa Pembatasan:</strong> Sumber daya yang penggunaannya tidak dibatasi oleh donor/pemberi sumber daya, melainkan dikelola oleh Majelis Jemaat untuk seluruh kegiatan umum gereja.
                </li>
                <li>
                  <strong>Aset Neto Dengan Pembatasan:</strong> Sumber daya yang penggunaannya dibatasi oleh donor untuk peruntukan tertentu (seperti donasi komitmen Pembangunan Gedung Gereja dan Kasih Bencana).
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                3. Akun Kas & Rekening Bank Resmi
              </h5>
              <p>
                Seluruh dana penerimaan jemaat disetorkan ke rekening resmi atas nama gereja:
                <br />
                • Kas Kecil Bendahara: Dikelola dengan sistem dana tetap (imprest fund) untuk keperluan operasional harian.
                <br />
                • Rekening Operasional: {churchInfo.rekeningGereja}
                <br />
                • Rekening Pembangunan: Mandiri 122-00-1123445-9 (a.n. GKKA Pembangunan)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
