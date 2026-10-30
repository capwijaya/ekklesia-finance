import React, { useState } from 'react';
import { IncomeTransaction, ExpenseTransaction, ChurchInfo } from '../types/finance';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import {
  Printer,
  Download,
  Calendar,
  Building,
  CheckCircle,
  FileSpreadsheet,
  Share2,
} from 'lucide-react';

interface MonthlyReportPrintProps {
  incomes: IncomeTransaction[];
  expenses: ExpenseTransaction[];
  churchInfo: ChurchInfo;
  selectedMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
}

export const MonthlyReportPrint: React.FC<MonthlyReportPrintProps> = ({
  incomes,
  expenses,
  churchInfo,
  selectedMonth,
  onMonthChange,
}) => {
  const [reportNote, setReportNote] = useState(
    'Laporan ini diterbitkan secara resmi oleh Majelis Jemaat untuk transparansi & akuntabilitas iman bagi seluruh jemaat dan simpatisan.'
  );

  // Filter by selected month
  const currentMonthIncomes = incomes.filter((i) => i.tanggal.startsWith(selectedMonth));
  const currentMonthExpenses = expenses.filter((e) => e.tanggal.startsWith(selectedMonth));

  // Calculations
  const totalIncome = currentMonthIncomes.reduce((sum, i) => sum + i.nominal, 0);
  const totalExpense = currentMonthExpenses.reduce((sum, e) => sum + e.nominal, 0);
  const surplusDefisit = totalIncome - totalExpense;

  // Breakdown Income by Jenis
  const incomeByType = currentMonthIncomes.reduce((acc, curr) => {
    acc[curr.jenisPersembahan] = (acc[curr.jenisPersembahan] || 0) + curr.nominal;
    return acc;
  }, {} as Record<string, number>);

  // Breakdown Expense by Kategori
  const expenseByCategory = currentMonthExpenses.reduce((acc, curr) => {
    acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.nominal;
    return acc;
  }, {} as Record<string, number>);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvRows: string[] = [];
    csvRows.push(`LAPORAN KEUANGAN BULANAN - ${churchInfo.namaGereja}`);
    csvRows.push(`Periode: ${selectedMonth}`);
    csvRows.push('');
    csvRows.push('1. RINCIAN PEMASUKAN');
    csvRows.push('Tanggal,Jenis Persembahan,Keterangan,Metode,Nominal (Rp)');
    currentMonthIncomes.forEach((i) => {
      csvRows.push(
        `"${i.tanggal}","${i.jenisPersembahan}","${i.keterangan}","${i.metode}",${i.nominal}`
      );
    });
    csvRows.push(`Total Pemasukan,,,,${totalIncome}`);
    csvRows.push('');
    csvRows.push('2. RINCIAN PENGELUARAN');
    csvRows.push('Tanggal,Kategori,Keterangan,Penerima,No. Bukti,Nominal (Rp)');
    currentMonthExpenses.forEach((e) => {
      csvRows.push(
        `"${e.tanggal}","${e.kategori}","${e.keterangan}","${e.penerima}","${e.nomorBukti}",${e.nominal}`
      );
    });
    csvRows.push(`Total Pengeluaran,,,,${totalExpense}`);
    csvRows.push(`Surplus / (Defisit),,,,${surplusDefisit}`);

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Keuangan_Gereja_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format month label
  const monthDate = new Date(`${selectedMonth}-01`);
  const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    monthDate
  );

  return (
    <div className="space-y-6">
      {/* Control Toolbar (Hidden in Print) */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Cetak Warta Keuangan & PDF Jemaat
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan transparansi keuangan bulanan siap cetak format A4 atau simpan sebagai dokumen PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs sm:text-sm">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Bulan:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-transparent border-0 font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* A4 Document Container */}
      <div
        id="church-printable-report"
        className="print-report-container bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto space-y-6"
      >
        {/* Church Official Letterhead / Kop Gereja */}
        <div className="border-b-4 border-double border-slate-800 pb-5 text-center relative">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-full bg-indigo-900 text-white flex items-center justify-center font-serif text-2xl font-bold shadow-xs">
              †
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                {churchInfo.namaGereja}
              </h1>
              <p className="text-xs font-semibold text-slate-700">{churchInfo.sinode}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {churchInfo.alamat} • Telp: {churchInfo.telepon} • Email: {churchInfo.email}
              </p>
              <p className="text-[11px] font-medium text-slate-600">
                Rekening Resmi: {churchInfo.rekeningGereja}
              </p>
            </div>
          </div>
        </div>

        {/* Title of Document */}
        <div className="text-center space-y-1">
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900">
            WARTA KEUANGAN & PERTANGGUNGJAWABAN BULANAN
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-indigo-900">
            PERIODE: {monthName.toUpperCase()}
          </p>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-3 gap-3 border border-slate-300 rounded-lg p-3 bg-slate-50 text-center text-xs">
          <div>
            <span className="text-[11px] text-slate-600 uppercase font-bold">Total Pemasukan</span>
            <p className="text-sm sm:text-base font-extrabold text-emerald-700">
              {formatRupiah(totalIncome)}
            </p>
          </div>
          <div className="border-x border-slate-300 px-2">
            <span className="text-[11px] text-slate-600 uppercase font-bold">Total Pengeluaran</span>
            <p className="text-sm sm:text-base font-extrabold text-rose-700">
              {formatRupiah(totalExpense)}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-600 uppercase font-bold">
              {surplusDefisit >= 0 ? 'Surplus Bulan Berjalan' : 'Defisit Bulan Berjalan'}
            </span>
            <p
              className={`text-sm sm:text-base font-extrabold ${
                surplusDefisit >= 0 ? 'text-indigo-900' : 'text-rose-700'
              }`}
            >
              {formatRupiah(surplusDefisit)}
            </p>
          </div>
        </div>

        {/* Table 1: Pemasukan Kas & Persembahan */}
        <div className="space-y-2">
          <div className="flex justify-between items-center border-b-2 border-slate-700 pb-1">
            <h4 className="text-xs sm:text-sm font-bold uppercase text-slate-900">
              A. PEMASUKAN PERSEMBAHAN & DANA PELAYANAN
            </h4>
            <span className="text-xs font-semibold text-slate-700">
              {currentMonthIncomes.length} Transaksi
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                <th className="py-1.5 px-2">Tgl</th>
                <th className="py-1.5 px-2">Jenis Persembahan</th>
                <th className="py-1.5 px-2">Ibadah / Keterangan</th>
                <th className="py-1.5 px-2">Metode</th>
                <th className="py-1.5 px-2 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentMonthIncomes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    Tidak ada transaksi pemasukan pada bulan ini.
                  </td>
                </tr>
              ) : (
                currentMonthIncomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 font-mono text-[11px] whitespace-nowrap">
                      {inc.tanggal}
                    </td>
                    <td className="py-1.5 px-2 font-semibold text-slate-800">
                      {inc.jenisPersembahan}
                    </td>
                    <td className="py-1.5 px-2 text-slate-600">
                      {inc.keterangan || inc.ibadah}
                    </td>
                    <td className="py-1.5 px-2 text-slate-500 text-[11px]">{inc.metode}</td>
                    <td className="py-1.5 px-2 text-right font-medium text-slate-900">
                      {formatRupiah(inc.nominal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                <td colSpan={4} className="py-2 px-2 uppercase">
                  Jumlah Pemasukan (A)
                </td>
                <td className="py-2 px-2 text-right text-emerald-800 font-extrabold">
                  {formatRupiah(totalIncome)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Table 2: Pengeluaran Kas Pelayanan */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center border-b-2 border-slate-700 pb-1">
            <h4 className="text-xs sm:text-sm font-bold uppercase text-slate-900">
              B. PENGELUARAN BEBAN PROGRAM & OPERASIONAL
            </h4>
            <span className="text-xs font-semibold text-slate-700">
              {currentMonthExpenses.length} Transaksi
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                <th className="py-1.5 px-2">Tgl</th>
                <th className="py-1.5 px-2">Kategori Pengeluaran</th>
                <th className="py-1.5 px-2">Keperluan & Penerima</th>
                <th className="py-1.5 px-2">No. Bukti</th>
                <th className="py-1.5 px-2 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentMonthExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    Tidak ada transaksi pengeluaran pada bulan ini.
                  </td>
                </tr>
              ) : (
                currentMonthExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 font-mono text-[11px] whitespace-nowrap">
                      {exp.tanggal}
                    </td>
                    <td className="py-1.5 px-2 font-semibold text-slate-800">{exp.kategori}</td>
                    <td className="py-1.5 px-2 text-slate-600">
                      {exp.keterangan} ({exp.penerima})
                    </td>
                    <td className="py-1.5 px-2 font-mono text-[11px] text-slate-500">
                      {exp.nomorBukti}
                    </td>
                    <td className="py-1.5 px-2 text-right font-medium text-slate-900">
                      {formatRupiah(exp.nominal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                <td colSpan={4} className="py-2 px-2 uppercase">
                  Jumlah Pengeluaran (B)
                </td>
                <td className="py-2 px-2 text-right text-rose-800 font-extrabold">
                  {formatRupiah(totalExpense)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Note / Catatan Akuntabilitas */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 italic">
          "{reportNote}"
        </div>

        {/* Signatures Block / Lembar Pengesahan Otorisasi */}
        <div className="pt-6 border-t border-slate-300">
          <div className="text-right text-xs text-slate-600 mb-6">
            Jakarta, {formatTanggalIndo(new Date().toISOString().slice(0, 10))}
          </div>

          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-16">
              <span className="font-semibold text-slate-700">Dibuat Oleh,</span>
              <div>
                <p className="font-bold underline text-slate-900">{churchInfo.bendahara}</p>
                <p className="text-[11px] text-slate-500">Bendahara Jemaat</p>
              </div>
            </div>

            <div className="space-y-16">
              <span className="font-semibold text-slate-700">Diverifikasi Oleh,</span>
              <div>
                <p className="font-bold underline text-slate-900">{churchInfo.auditor}</p>
                <p className="text-[11px] text-slate-500">Auditor / Komisi Verifikasi</p>
              </div>
            </div>

            <div className="space-y-16">
              <span className="font-semibold text-slate-700">Mengetahui & Menyetujui,</span>
              <div>
                <p className="font-bold underline text-slate-900">{churchInfo.ketuaMajelis}</p>
                <p className="text-[11px] text-slate-500">Ketua Majelis Jemaat</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
