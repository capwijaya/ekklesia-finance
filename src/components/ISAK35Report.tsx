import React, { useState } from 'react';
import { IncomeTransaction, ExpenseTransaction, ChurchInfo } from '../types/finance';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { generateChurchISAK35PDF } from '../services/pdfGenerator';
import {
  FileText,
  Building2,
  TrendingUp,
  Coins,
  ShieldCheck,
  Download,
  Info,
  Calendar,
  Printer,
  Eye,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Layers,
  FileSpreadsheet,
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

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [reportScope, setReportScope] = useState<'all' | 'posisi' | 'aktivitas' | 'aruskas' | 'calk'>('all');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string | null>(null);

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

  // PDF Download Handler
  const handleDownloadPDF = (scope: 'all' | 'posisi' | 'aktivitas' | 'aruskas' | 'calk' = reportScope) => {
    try {
      setIsGeneratingPDF(true);
      setPdfStatusMessage('Menyusun berkas PDF resmi ISAK 35...');

      const { doc, filename } = generateChurchISAK35PDF(
        incomes,
        expenses,
        churchInfo,
        selectedYear,
        scope
      );

      doc.save(filename);
      setPdfStatusMessage(`Dokumen "${filename}" berhasil diunduh ke perangkat Anda!`);
      setTimeout(() => setPdfStatusMessage(null), 6000);
    } catch (err: any) {
      console.error('Gagal membuat PDF ISAK 35:', err);
      setPdfStatusMessage('Gagal membuat berkas PDF. Silakan coba kembali.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Pencetakan browser terblokir, mengunduh PDF:', err);
      handleDownloadPDF();
    }
  };

  const handleOpenPreview = (scope: 'all' | 'posisi' | 'aktivitas' | 'aruskas' | 'calk' = activeReport) => {
    setReportScope(scope);
    setIsPreviewModalOpen(true);
  };

  // Export to CSV Handler for 3rd-Party Auditing
  const handleExportCSV = () => {
    const csvLines: string[] = [];

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    // Header Kop Surat
    csvLines.push(escapeCsv(churchInfo.namaGereja.toUpperCase()));
    csvLines.push(escapeCsv(churchInfo.sinode));
    csvLines.push(escapeCsv(`${churchInfo.alamat} | Telp: ${churchInfo.telepon}`));
    csvLines.push(escapeCsv(`Email: ${churchInfo.email} | Rekening Kas: ${churchInfo.rekeningGereja}`));
    csvLines.push('""');
    csvLines.push(escapeCsv('LAPORAN KEUANGAN ENTITAS GEREJA (STANDAR AKUNTANSI KEUANGAN ISAK 35)'));
    csvLines.push(escapeCsv(`PERIODE TAHUN BUKU: 1 JANUARI ${selectedYear} s/d 31 DESEMBER ${selectedYear}`));
    csvLines.push(escapeCsv(`Tanggal Ekspor Audit: ${formatTanggalIndo(new Date().toISOString().slice(0, 10))}`));
    csvLines.push('""');

    // Section 1: Laporan Posisi Keuangan (Neraca)
    csvLines.push(escapeCsv('=== 1. LAPORAN POSISI KEUANGAN (NERACA PER 31 DESEMBER ' + selectedYear + ') ==='));
    csvLines.push(['"Kelompok"', '"Akun / Pos Neraca"', '"Klasifikasi / Keterangan"', '"Nilai (Rp)"'].join(','));
    csvLines.push(['"Aset Lancar"', '"Kas Kecil Tunai (Bendahara)"', '"Kas Operasional"', saldoAwalKas + kasKecil].join(','));
    csvLines.push(['"Aset Lancar"', '"Bank BCA (Rekening Operasional & QRIS)"', '"Operasional & Kolekte"', saldoAwalBankBCA + bankBCA].join(','));
    csvLines.push(['"Aset Lancar"', '"Bank Mandiri (Rekening Khusus Pembangunan)"', '"Dana Terikat Pembangunan"', saldoAwalBankMandiri + bankMandiri].join(','));
    csvLines.push(['"Aset Lancar"', '"SUBTOTAL KAS DAN SETARA KAS"', '"Likuid"', totalKasDanSetaraKas].join(','));
    csvLines.push(['"Aset Tidak Lancar"', '"Tanah & Gedung Gereja / Pastori"', '"Biaya Perolehan Historis"', nilaiTanahGedung].join(','));
    csvLines.push(['"Aset Tidak Lancar"', '"Peralatan Ibadah, Sound System & Multimedia"', '"Perolehan + Penambahan"', nilaiPeralatanIbadah].join(','));
    csvLines.push(['"Aset Tidak Lancar"', '"Akumulasi Penyusutan Aset Tetap"', '"Metode Garis Lurus"', akumulasiPenyusutan].join(','));
    csvLines.push(['"Aset Tidak Lancar"', '"SUBTOTAL ASET TETAP BERSIH"', '"Aset Tetap"', totalAsetTetap].join(','));
    csvLines.push(['"TOTAL ASET"', '"JUMLAH ASET ENTITAS GEREJA"', '"Aset Lancar + Aset Tetap"', totalAset].join(','));
    csvLines.push('""');
    csvLines.push(['"Liabilitas"', '"Utang Titipan Misi & Diakonia Khusus"', '"Jangka Pendek"', utangTitipanMisi].join(','));
    csvLines.push(['"Liabilitas"', '"Utang Beban Operasional / Akrual"', '"Jangka Pendek"', utangBebanOperasional].join(','));
    csvLines.push(['"TOTAL LIABILITAS"', '"JUMLAH KEWAJIBAN JANGKA PENDEK"', '"Liabilitas Lancar"', totalLiabilitas].join(','));
    csvLines.push('""');
    csvLines.push(['"Aset Neto"', '"Aset Neto Tanpa Pembatasan (Unrestricted)"', '"Dana Operasional Bebas"', asetNetoTanpaPembatasan].join(','));
    csvLines.push(['"Aset Neto"', '"Aset Neto Dengan Pembatasan (Restricted)"', '"Dana Terikat Pembangunan & Kasih"', asetNetoDenganPembatasan].join(','));
    csvLines.push(['"TOTAL ASET NETO"', '"JUMLAH EKUITAS NONLABA"', '"Cadangan & Terikat"', totalAsetNeto].join(','));
    csvLines.push(['"TOTAL KESEIMBANGAN"', '"JUMLAH LIABILITAS DAN ASET NETO"', '"Neraca Seimbang"', totalLiabilitas + totalAsetNeto].join(','));
    csvLines.push('""');

    // Section 2: Laporan Aktivitas / Penghasilan Komprehensif
    csvLines.push(escapeCsv('=== 2. LAPORAN PENGHASILAN KOMPREHENSIF / AKTIVITAS TAHUN ' + selectedYear + ' ==='));
    csvLines.push(['"Kelompok"', '"Uraian Pendapatan & Beban"', '"Klasifikasi ISAK 35"', '"Nilai (Rp)"'].join(','));
    csvLines.push(['"Pendapatan"', '"Persembahan Umum / Kantong Kolekte Ibadah"', '"Tanpa Pembatasan"', yearIncomes.filter(i => i.jenisPersembahan === 'Persembahan Umum / Kantong Kolekte').reduce((s, i) => s + i.nominal, 0)].join(','));
    csvLines.push(['"Pendapatan"', '"Persepuluhan (Tithe)"', '"Tanpa Pembatasan"', yearIncomes.filter(i => i.jenisPersembahan === 'Persepuluhan (Tithe)').reduce((s, i) => s + i.nominal, 0)].join(','));
    csvLines.push(['"Pendapatan"', '"Persembahan Syukur (Thanksgiving)"', '"Tanpa Pembatasan"', yearIncomes.filter(i => i.jenisPersembahan === 'Persembahan Syukur (Thanksgiving)').reduce((s, i) => s + i.nominal, 0)].join(','));
    csvLines.push(['"Pendapatan"', '"Persembahan Sekolah Minggu / Remaja"', '"Tanpa Pembatasan"', yearIncomes.filter(i => i.jenisPersembahan === 'Persembahan Sekolah Minggu / Remaja').reduce((s, i) => s + i.nominal, 0)].join(','));
    csvLines.push(['"Pendapatan"', '"SUBTOTAL PENDAPATAN TANPA PEMBATASAN"', '"Unrestricted"', incomeTanpaPembatasan].join(','));
    csvLines.push(['"Pendapatan Terikat"', '"Komitmen Dana Pembangunan & Renovasi"', '"Dengan Pembatasan (Gedung)"', yearIncomes.filter(i => i.jenisPersembahan === 'Dana Pembangunan & Renovasi').reduce((s, i) => s + i.nominal, 0)].join(','));
    csvLines.push(['"Pendapatan Terikat"', '"Diakonia Kasih & Bantuan Bencana"', '"Dengan Pembatasan (Sosial)"', yearIncomes.filter(i => i.jenisPersembahan === 'Diakonia & Kasih Bencana').reduce((s, i) => s + i.nominal, 0)].join(','));
    csvLines.push(['"Pendapatan Terikat"', '"SUBTOTAL PENDAPATAN DENGAN PEMBATASAN"', '"Restricted"', incomeDenganPembatasan].join(','));
    csvLines.push(['"TOTAL PENDAPATAN"', '"JUMLAH PENDAPATAN ENTITAS GEREJA"', '"Semua Sumber Daya"', totalPendapatan].join(','));
    csvLines.push('""');
    csvLines.push(['"Beban Program"', '"Pelayanan Ibadah, Musik, Perjamuan & Altar"', '"Beban Program Pelayanan"', yearExpenses.filter(e => e.kategori === 'Pelayanan Ibadah & Musik').reduce((s, e) => s + e.nominal, 0)].join(','));
    csvLines.push(['"Beban Program"', '"Diakonia, Santunan Kesehatan & Beasiswa"', '"Beban Program Pelayanan"', yearExpenses.filter(e => e.kategori === 'Diakonia, Santunan & Beasiswa').reduce((s, e) => s + e.nominal, 0)].join(','));
    csvLines.push(['"Beban Program"', '"Misi, Penginjilan & Pos PI Pedalaman"', '"Beban Program Pelayanan"', yearExpenses.filter(e => e.kategori === 'Misi & Penginjilan').reduce((s, e) => s + e.nominal, 0)].join(','));
    csvLines.push(['"Beban Program"', '"SUBTOTAL BEBAN PROGRAM PELAYANAN"', '"Beban Pelayanan"', bebanProgram].join(','));
    csvLines.push(['"Beban Pendukung"', '"Operasional & Utilitas (Listrik, Air, Internet)"', '"Beban Operasional"', yearExpenses.filter(e => e.kategori === 'Operasional & Utilitas (Listrik/Air/Internet)').reduce((s, e) => s + e.nominal, 0)].join(','));
    csvLines.push(['"Beban Pendukung"', '"Pemeliharaan Gedung, AC & Sarana Prasarana"', '"Beban Pendukung"', yearExpenses.filter(e => e.kategori === 'Pemeliharaan Gedung & Sarana').reduce((s, e) => s + e.nominal, 0)].join(','));
    csvLines.push(['"Beban Pendukung"', '"Honorarium & Tunjangan Pelayan / Staf TU"', '"Beban Personalia"', yearExpenses.filter(e => e.kategori === 'Honorarium & Tunjangan Pelayan').reduce((s, e) => s + e.nominal, 0)].join(','));
    csvLines.push(['"Beban Pendukung"', '"SUBTOTAL BEBAN PENDUKUNG OPERASIONAL"', '"Beban Pendukung"', bebanPendukung].join(','));
    csvLines.push(['"TOTAL BEBAN"', '"JUMLAH BEBAN OPERASIONAL & PELAYANAN"', '"Program + Pendukung"', totalBebanOperasi].join(','));
    csvLines.push(['"SURPLUS / DEFISIT"', '"KENAIKAN (PENURUNAN) BERSIH ASET NETO"', '"Surplus Tahun Berjalan"', kenaikanAsetNetoBersih].join(','));
    csvLines.push('""');

    // Section 3: Laporan Arus Kas
    csvLines.push(escapeCsv('=== 3. LAPORAN ARUS KAS (METODE LANGSUNG TAHUN ' + selectedYear + ') ==='));
    csvLines.push(['"Aktivitas"', '"Komponen Arus Kas"', '"Klasifikasi Arus Kas"', '"Nilai (Rp)"'].join(','));
    csvLines.push(['"Operasi"', '"Penerimaan dari Persembahan & Kolekte Jemaat"', '"Arus Kas Masuk Operasi"', incomeTanpaPembatasan].join(','));
    csvLines.push(['"Operasi"', '"Pembayaran Beban Program Pelayanan & Operasional"', '"Arus Kas Keluar Operasi"', -totalBebanOperasi].join(','));
    csvLines.push(['"Operasi"', '"ARUS KAS BERSIH DARI AKTIVITAS OPERASI"', '"Net Kas Operasi"', incomeTanpaPembatasan - totalBebanOperasi].join(','));
    csvLines.push(['"Investasi"', '"Pembelian Peralatan Ibadah & Investasi Aset"', '"Arus Kas Keluar Investasi"', -bebanInvestasiAset].join(','));
    csvLines.push(['"Investasi"', '"ARUS KAS BERSIH DARI AKTIVITAS INVESTASI"', '"Net Kas Investasi"', -bebanInvestasiAset].join(','));
    csvLines.push(['"Pendanaan"', '"Penerimaan Donasi Terikat Pembangunan"', '"Arus Kas Masuk Terikat"', incomeDenganPembatasan].join(','));
    csvLines.push(['"Pendanaan"', '"ARUS KAS BERSIH DARI AKTIVITAS PENDANAAN"', '"Net Kas Pendanaan"', incomeDenganPembatasan].join(','));
    csvLines.push(['"Net Kas"', '"KENAIKAN (PENURUNAN) BERSIH KAS & SETARA KAS"', '"Surplus Kas Bersih"', totalPendapatan - totalBebanOperasi - bebanInvestasiAset].join(','));
    csvLines.push(['"Saldo"', '"SALDO KAS & SETARA KAS AWAL TAHUN (1 JANUARI)"', '"Saldo Awal"', saldoAwalKas + saldoAwalBankBCA + saldoAwalBankMandiri].join(','));
    csvLines.push(['"Saldo"', '"SALDO KAS & SETARA KAS AKHIR TAHUN (31 DESEMBER)"', '"Saldo Akhir"', totalKasDanSetaraKas].join(','));
    csvLines.push('""');

    // Section 4: Audit Trail - Rincian Pemasukan
    csvLines.push(escapeCsv('=== 4. RINCIAN DATA TRANSAKSI PEMASUKAN TAHUN ' + selectedYear + ' (AUDIT TRAIL) ==='));
    csvLines.push(['"ID Transaksi"', '"Tanggal"', '"Jenis Persembahan"', '"Nominal (Rp)"', '"Keterangan / Intensi"', '"Nama Jemaat / Donatur"', '"Metode Bayar"', '"Tipe Aset Neto"', '"Petugas Input"'].join(','));
    yearIncomes.forEach((inc) => {
      csvLines.push([
        escapeCsv(inc.id),
        escapeCsv(inc.tanggal),
        escapeCsv(inc.jenisPersembahan),
        inc.nominal,
        escapeCsv(inc.keterangan),
        escapeCsv(inc.namaJemaat || 'Anonim'),
        escapeCsv(inc.metode),
        escapeCsv(inc.tipeAsetNeto),
        escapeCsv(inc.createdBy),
      ].join(','));
    });
    csvLines.push('""');

    // Section 5: Audit Trail - Rincian Pengeluaran
    csvLines.push(escapeCsv('=== 5. RINCIAN DATA TRANSAKSI PENGELUARAN TAHUN ' + selectedYear + ' (AUDIT TRAIL) ==='));
    csvLines.push(['"ID Transaksi"', '"Tanggal"', '"Kategori Belanja"', '"Nominal (Rp)"', '"Keterangan Keperluan"', '"Penerima / Vendor"', '"Nomor Bukti / Voucher"', '"Metode Bayar"', '"Pos ISAK 35"', '"Petugas Input"'].join(','));
    yearExpenses.forEach((exp) => {
      csvLines.push([
        escapeCsv(exp.id),
        escapeCsv(exp.tanggal),
        escapeCsv(exp.kategori),
        exp.nominal,
        escapeCsv(exp.keterangan),
        escapeCsv(exp.penerima),
        escapeCsv(exp.nomorBukti),
        escapeCsv(exp.metode),
        escapeCsv(exp.posISAK35),
        escapeCsv(exp.createdBy),
      ].join(','));
    });
    csvLines.push('""');

    // Section 6: Otorisasi Majelis
    csvLines.push(escapeCsv('=== 6. LEMBAR PENGESAHAN OTORISASI MAJELIS JEMAAT ==='));
    csvLines.push([
      escapeCsv('Bendahara Umum Jemaat: ' + churchInfo.bendahara),
      escapeCsv('Komisi Pengawas / Auditor: ' + churchInfo.auditor),
      escapeCsv('Ketua Majelis Jemaat: ' + churchInfo.ketuaMajelis),
    ].join(','));

    // UTF-8 BOM for Excel
    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `Laporan_Keuangan_ISAK35_${selectedYear}_${churchInfo.namaGereja.replace(/\s+/g, '_')}_AUDIT.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setPdfStatusMessage(`Dokumen audit "${fileName}" berhasil diekspor ke format CSV!`);
    setTimeout(() => setPdfStatusMessage(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Download Status Notification Toast */}
      {pdfStatusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{pdfStatusMessage}</span>
          </div>
          <button
            onClick={() => setPdfStatusMessage(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:opacity-75 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-indigo-900/40">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Kepatuhan Standar Akuntansi Keuangan (ISAK 35)
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Laporan Keuangan Entitas Gereja (ISAK 35)
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80">
              {churchInfo.namaGereja} • Periode Pelaporan Tahun Buku {selectedYear}
            </p>
          </div>

          {/* Action buttons: Preview, Save PDF, Print */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-xs">
              <Calendar className="w-4 h-4 text-indigo-300" />
              <span>Tahun: <strong>{selectedYear}</strong></span>
            </div>

            <button
              onClick={() => handleOpenPreview('all')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer shadow-xs"
            >
              <Eye className="w-4 h-4 text-indigo-300" />
              Pratinjau Dokumen
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-teal-600/90 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              title="Unduh seluruh laporan keuangan ISAK 35 dan audit trail transaksi dalam format CSV untuk auditor pihak ketiga"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-200" />
              <span>Export to CSV</span>
            </button>

            <button
              onClick={() => handleDownloadPDF('all')}
              disabled={isGeneratingPDF}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPDF ? 'Menyusun...' : 'Simpan PDF Resmi'}
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen
            </button>
          </div>
        </div>

        {/* ISAK 35 Sub-navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveReport('posisi')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
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
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
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
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
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
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
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
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {churchInfo.namaGereja}
              </h3>
              <h4 className="text-base font-semibold text-indigo-600 dark:text-indigo-400">
                LAPORAN POSISI KEUANGAN (ISAK 35)
              </h4>
              <p className="text-xs text-slate-500">Per 31 Desember {selectedYear}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPreview('posisi')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                Pratinjau
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF('posisi')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Simpan PDF
              </button>
            </div>
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
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {churchInfo.namaGereja}
              </h3>
              <h4 className="text-base font-semibold text-indigo-600 dark:text-indigo-400">
                LAPORAN PENGHASILAN KOMPREHENSIF / AKTIVITAS (ISAK 35)
              </h4>
              <p className="text-xs text-slate-500">Tahun Buku {selectedYear}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPreview('aktivitas')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                Pratinjau
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF('aktivitas')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Simpan PDF
              </button>
            </div>
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
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {churchInfo.namaGereja}
              </h3>
              <h4 className="text-base font-semibold text-indigo-600 dark:text-indigo-400">
                LAPORAN ARUS KAS (ISAK 35)
              </h4>
              <p className="text-xs text-slate-500">Metode Langsung • Tahun {selectedYear}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPreview('aruskas')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                Pratinjau
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF('aruskas')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Simpan PDF
              </button>
            </div>
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
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Catatan atas Laporan Keuangan (CALK) & Kebijakan Akuntansi
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPreview('calk')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                Pratinjau
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF('calk')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Simpan PDF
              </button>
            </div>
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

      {/* ==================== NATIVE A4 DOCUMENT SHEET MODAL FOR PREVIEW ==================== */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header Toolbar */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Pratinjau Resmi Laporan Keuangan ISAK 35
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Standar Akuntansi Keuangan Entitas Nonlaba • Format Lembar A4 Cetak
                  </p>
                </div>
              </div>

              {/* Scope Switcher, Zoom Controls, Actions */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Scope selector */}
                <select
                  value={reportScope}
                  onChange={(e) => setReportScope(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 focus:outline-indigo-500 cursor-pointer"
                >
                  <option value="all">Semua Laporan (Lengkap)</option>
                  <option value="posisi">Posisi Keuangan (Neraca)</option>
                  <option value="aktivitas">Aktivitas (Penghasilan Komprehensif)</option>
                  <option value="aruskas">Arus Kas</option>
                  <option value="calk">Catatan Keuangan (CALK)</option>
                </select>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                    title="Perkecil Tampilan"
                    className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] min-w-[36px] text-center font-bold text-slate-700 dark:text-slate-300">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                    title="Perbesar Tampilan"
                    className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    title="Reset Ukuran (100%)"
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                {/* Export CSV button in modal */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-850 bg-teal-50 dark:bg-teal-950/60 text-teal-750 dark:text-teal-300 font-semibold flex items-center gap-1.5 shadow-xs hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-all cursor-pointer text-xs"
                  title="Unduh seluruh laporan keuangan ISAK 35 ke format CSV untuk audit"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Export CSV</span>
                </button>

                {/* Print button */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>

                {/* Save PDF button */}
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(reportScope)}
                  disabled={isGeneratingPDF}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isGeneratingPDF ? 'Menyusun...' : 'Simpan PDF'}</span>
                </button>

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: A4 Sheet Preview Canvas */}
            <div className="p-4 sm:p-8 overflow-y-auto bg-slate-200/60 dark:bg-slate-950/60 flex-1 flex justify-center">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-2xl border border-slate-300 max-w-[850px] w-full space-y-7 shrink-0 min-h-[1120px]"
              >
                {/* Official Church Letterhead / Kop Surat */}
                <div className="border-b-4 border-double border-slate-900 pb-4 text-center relative">
                  <div className="flex items-center justify-center gap-3 mb-1.5">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-serif text-xl font-bold shadow-xs shrink-0">
                      ✝
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-serif">
                        {churchInfo.namaGereja}
                      </h2>
                      <p className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                        {churchInfo.sinode}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {churchInfo.alamat} • Telepon: {churchInfo.telepon}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Email: {churchInfo.email} • Rekening Kas: {churchInfo.rekeningGereja}
                  </p>
                </div>

                {/* Document Main Heading */}
                <div className="text-center space-y-1">
                  <h3 className="text-base sm:text-lg font-black tracking-wide text-slate-950 uppercase">
                    LAPORAN KEUANGAN ENTITAS GEREJA
                  </h3>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-900 font-bold text-xs border border-indigo-200">
                    STANDAR AKUNTANSI KEUANGAN ISAK 35 (ENTITAS NONLABA)
                  </div>
                  <p className="text-xs font-bold text-slate-700 pt-1">
                    PERIODE TAHUN BUKU: 1 JANUARI {selectedYear} s/d 31 DESEMBER {selectedYear}
                  </p>
                </div>

                {/* Section 1: Posisi Keuangan (Neraca) */}
                {(reportScope === 'all' || reportScope === 'posisi') && (
                  <div className="space-y-3 pt-2">
                    <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        I. LAPORAN POSISI KEUANGAN (NERACA PER 31 DESEMBER {selectedYear})
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">Dinyatakan dalam Rupiah (Rp)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Aset Side */}
                      <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/40">
                        <span className="font-bold text-slate-900 text-xs block border-b border-slate-200 pb-1">
                          ASET
                        </span>

                        <div className="space-y-1">
                          <span className="font-semibold text-slate-700 block text-[11px]">
                            Aset Lancar:
                          </span>
                          <div className="flex justify-between pl-2 text-slate-600 text-[11px]">
                            <span>Kas Kecil Tunai</span>
                            <span className="font-mono">{formatRupiah(saldoAwalKas + kasKecil)}</span>
                          </div>
                          <div className="flex justify-between pl-2 text-slate-600 text-[11px]">
                            <span>Bank BCA (Operasional & QRIS)</span>
                            <span className="font-mono">{formatRupiah(saldoAwalBankBCA + bankBCA)}</span>
                          </div>
                          <div className="flex justify-between pl-2 text-slate-600 text-[11px]">
                            <span>Bank Mandiri (Pembangunan)</span>
                            <span className="font-mono">{formatRupiah(saldoAwalBankMandiri + bankMandiri)}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-800 text-[11px]">
                            <span>Total Kas & Setara Kas</span>
                            <span className="font-mono">{formatRupiah(totalKasDanSetaraKas)}</span>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1.5 border-t border-slate-200">
                          <span className="font-semibold text-slate-700 block text-[11px]">
                            Aset Tidak Lancar:
                          </span>
                          <div className="flex justify-between pl-2 text-slate-600 text-[11px]">
                            <span>Tanah & Gedung Gereja</span>
                            <span className="font-mono">{formatRupiah(nilaiTanahGedung)}</span>
                          </div>
                          <div className="flex justify-between pl-2 text-slate-600 text-[11px]">
                            <span>Peralatan Ibadah & Musik</span>
                            <span className="font-mono">{formatRupiah(nilaiPeralatanIbadah)}</span>
                          </div>
                          <div className="flex justify-between pl-2 text-slate-600 text-[11px]">
                            <span>Akumulasi Penyusutan</span>
                            <span className="font-mono">({formatRupiah(Math.abs(akumulasiPenyusutan))})</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-800 text-[11px]">
                            <span>Total Aset Tetap Bersih</span>
                            <span className="font-mono">{formatRupiah(totalAsetTetap)}</span>
                          </div>
                        </div>

                        <div className="flex justify-between pt-2 border-t-2 border-slate-800 font-black text-slate-900 text-xs">
                          <span>JUMLAH ASET</span>
                          <span className="font-mono">{formatRupiah(totalAset)}</span>
                        </div>
                      </div>

                      {/* Liabilitas & Aset Neto Side */}
                      <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/40">
                        <span className="font-bold text-slate-900 text-xs block border-b border-slate-200 pb-1">
                          LIABILITAS & ASET NETO
                        </span>

                        <div className="space-y-1">
                          <span className="font-semibold text-slate-700 block text-[11px]">
                            Liabilitas Jangka Pendek:
                          </span>
                          <div className="flex justify-between pl-2 text-slate-600 text-[11px]">
                            <span>Utang Titipan Misi / Pos PI</span>
                            <span className="font-mono">{formatRupiah(utangTitipanMisi)}</span>
                          </div>
                          <div className="flex justify-between pl-2 text-slate-600 text-[11px]">
                            <span>Utang Beban Akrual</span>
                            <span className="font-mono">{formatRupiah(utangBebanOperasional)}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-800 text-[11px]">
                            <span>Total Liabilitas</span>
                            <span className="font-mono">{formatRupiah(totalLiabilitas)}</span>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1.5 border-t border-slate-200">
                          <span className="font-semibold text-slate-700 block text-[11px]">
                            Aset Neto (Ekuitas):
                          </span>
                          <div className="flex justify-between pl-2 text-slate-600 text-[11px]">
                            <span>Tanpa Pembatasan (Unrestricted)</span>
                            <span className="font-mono">{formatRupiah(asetNetoTanpaPembatasan)}</span>
                          </div>
                          <div className="flex justify-between pl-2 text-slate-600 text-[11px]">
                            <span>Dengan Pembatasan (Restricted)</span>
                            <span className="font-mono">{formatRupiah(asetNetoDenganPembatasan)}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-800 text-[11px]">
                            <span>Total Aset Neto</span>
                            <span className="font-mono">{formatRupiah(totalAsetNeto)}</span>
                          </div>
                        </div>

                        <div className="flex justify-between pt-2 border-t-2 border-slate-800 font-black text-slate-900 text-xs">
                          <span>JUMLAH LIABILITAS & ASET NETO</span>
                          <span className="font-mono">{formatRupiah(totalLiabilitas + totalAsetNeto)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 2: Aktivitas / Penghasilan Komprehensif */}
                {(reportScope === 'all' || reportScope === 'aktivitas') && (
                  <div className="space-y-3 pt-2">
                    <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        II. LAPORAN PENGHASILAN KOMPREHENSIF (AKTIVITAS TAHUN {selectedYear})
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">Arus Masuk vs Beban Layanan</span>
                    </div>

                    <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Uraian Akun Pendapatan & Beban</th>
                          <th className="py-2 px-3 text-center">Klasifikasi ISAK 35</th>
                          <th className="py-2 px-3 text-right">Jumlah (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="font-semibold bg-slate-50">
                          <td className="py-1.5 px-3">1. PENDAPATAN OPERASIONAL & PERSEMBAHAN</td>
                          <td className="py-1.5 px-3 text-center text-[11px]"></td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold">{formatRupiah(totalPendapatan)}</td>
                        </tr>
                        <tr className="text-slate-600 text-[11px]">
                          <td className="py-1 px-5">- Persembahan Tanpa Pembatasan (Kolekte, Tithe, Syukur)</td>
                          <td className="py-1 px-3 text-center">Tanpa Pembatasan</td>
                          <td className="py-1 px-3 text-right font-mono">{formatRupiah(incomeTanpaPembatasan)}</td>
                        </tr>
                        <tr className="text-slate-600 text-[11px]">
                          <td className="py-1 px-5">- Persembahan Dengan Pembatasan (Pembangunan & Diakonia)</td>
                          <td className="py-1 px-3 text-center">Dengan Pembatasan</td>
                          <td className="py-1 px-3 text-right font-mono">{formatRupiah(incomeDenganPembatasan)}</td>
                        </tr>
                        <tr className="font-semibold bg-slate-50">
                          <td className="py-1.5 px-3">2. BEBAN OPERASI DAN PELAYANAN GEREJA</td>
                          <td className="py-1.5 px-3 text-center text-[11px]"></td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold">{formatRupiah(totalBebanOperasi)}</td>
                        </tr>
                        <tr className="text-slate-600 text-[11px]">
                          <td className="py-1 px-5">- Beban Program Pelayanan (Ibadah, Diakonia, Misi)</td>
                          <td className="py-1 px-3 text-center">Beban Program</td>
                          <td className="py-1 px-3 text-right font-mono">{formatRupiah(bebanProgram)}</td>
                        </tr>
                        <tr className="text-slate-600 text-[11px]">
                          <td className="py-1 px-5">- Beban Pendukung & Operasional (Listrik, Gedung, Honor TU)</td>
                          <td className="py-1 px-3 text-center">Beban Pendukung</td>
                          <td className="py-1 px-3 text-right font-mono">{formatRupiah(bebanPendukung)}</td>
                        </tr>
                        {bebanInvestasiAset > 0 && (
                          <tr className="text-slate-600 text-[11px]">
                            <td className="py-1 px-5">- Pengeluaran Investasi Aset Tetap Sound/Multimedia</td>
                            <td className="py-1 px-3 text-center">Investasi Aset</td>
                            <td className="py-1 px-3 text-right font-mono">{formatRupiah(bebanInvestasiAset)}</td>
                          </tr>
                        )}
                        <tr className="font-black bg-indigo-50/70 text-indigo-950 border-t-2 border-slate-800">
                          <td className="py-2 px-3">KENAIKAN ASET NETO BERSIH TAHUN {selectedYear}</td>
                          <td className="py-2 px-3 text-center text-[11px]">Surplus Bersih Kas</td>
                          <td className="py-2 px-3 text-right font-mono font-black">{formatRupiah(kenaikanAsetNetoBersih)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Section 3: Arus Kas */}
                {(reportScope === 'all' || reportScope === 'aruskas') && (
                  <div className="space-y-3 pt-2">
                    <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        III. LAPORAN ARUS KAS (METODE LANGSUNG TAHUN {selectedYear})
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">Ringkasan Mutasi Kas</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span>Arus Kas Bersih dari Aktivitas Operasi</span>
                        <span className="font-mono font-bold">{formatRupiah(incomeTanpaPembatasan - totalBebanOperasi)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Arus Kas Bersih untuk Aktivitas Investasi Aset</span>
                        <span className="font-mono font-bold">({formatRupiah(bebanInvestasiAset)})</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Arus Kas Bersih dari Aktivitas Pendanaan (Donasi Terikat)</span>
                        <span className="font-mono font-bold">{formatRupiah(incomeDenganPembatasan)}</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-300 font-bold text-slate-900">
                        <span>Kenaikan Bersih Kas & Setara Kas</span>
                        <span className="font-mono">{formatRupiah(totalPendapatan - totalBebanOperasi - bebanInvestasiAset)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Saldo Awal Kas & Setara Kas (1 Januari {selectedYear})</span>
                        <span className="font-mono">{formatRupiah(saldoAwalKas + saldoAwalBankBCA + saldoAwalBankMandiri)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t-2 border-slate-800 font-black text-slate-900">
                        <span>SALDO AKHIR KAS & SETARA KAS (31 DESEMBER {selectedYear})</span>
                        <span className="font-mono text-indigo-700">{formatRupiah(totalKasDanSetaraKas)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 4: CALK Notes */}
                {(reportScope === 'all' || reportScope === 'calk') && (
                  <div className="space-y-2 pt-2">
                    <div className="border-b-2 border-slate-900 pb-1">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        IV. CATATAN ATAS LAPORAN KEUANGAN (CALK) & KEBIJAKAN AKUNTANSI
                      </h4>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1 leading-relaxed">
                      <p>
                        1. <strong>Kepatuhan Standar:</strong> Laporan disajikan berlandaskan Interpretasi Standar Akuntansi Keuangan 35 (ISAK 35) tentang Penyajian Laporan Keuangan Entitas Nonlaba.
                      </p>
                      <p>
                        2. <strong>Aset Neto Terikat:</strong> Dana pembangunan dialokasikan khusus pada rekening terpisah (Bank Mandiri) dan tidak digunakan untuk beban operasional umum.
                      </p>
                      <p>
                        3. <strong>Otorisasi Majelis:</strong> Seluruh pencairan di atas Rp 5.000.000 wajib mendapat persetujuan ganda dari Bendahara dan Ketua Majelis Jemaat.
                      </p>
                    </div>
                  </div>
                )}

                {/* Lembar Otorisasi & Tanda Tangan Resmi */}
                <div className="pt-6 border-t border-slate-300 space-y-4">
                  <div className="flex justify-end text-xs text-slate-600 font-medium">
                    Jakarta, {formatTanggalIndo(new Date().toISOString().slice(0, 10))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Dibuat Oleh,</span>
                      <div className="h-14"></div>
                      <strong className="block text-slate-900 border-t border-slate-300 pt-1 font-bold">
                        {churchInfo.bendahara}
                      </strong>
                      <span className="text-[10px] text-slate-500">Bendahara Umum Jemaat</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Diverifikasi Oleh,</span>
                      <div className="h-14"></div>
                      <strong className="block text-slate-900 border-t border-slate-300 pt-1 font-bold">
                        {churchInfo.auditor}
                      </strong>
                      <span className="text-[10px] text-slate-500">Komisi Pengawas / Auditor</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Mengetahui & Menyetujui,</span>
                      <div className="h-14"></div>
                      <strong className="block text-slate-900 border-t border-slate-300 pt-1 font-bold">
                        {churchInfo.ketuaMajelis}
                      </strong>
                      <span className="text-[10px] text-slate-500">Ketua Majelis Jemaat</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
