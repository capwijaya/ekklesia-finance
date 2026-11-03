import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IncomeTransaction, ExpenseTransaction, ChurchInfo } from '../types/finance';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';

export function generateChurchMonthlyPDF(
  incomes: IncomeTransaction[],
  expenses: ExpenseTransaction[],
  churchInfo: ChurchInfo,
  selectedMonth: string
): { doc: jsPDF; filename: string; blobUrl: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const monthDate = new Date(`${selectedMonth}-01`);
  const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    monthDate
  );

  const totalIncome = incomes.reduce((sum, i) => sum + i.nominal, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.nominal, 0);
  const netSurplus = totalIncome - totalExpense;

  const primaryColor: [number, number, number] = [30, 41, 59]; // slate-800
  const accentColor: [number, number, number] = [79, 70, 229]; // indigo-600
  const emeraldColor: [number, number, number] = [16, 185, 129];
  const roseColor: [number, number, number] = [225, 29, 72];

  // 1. Header / Kop Surat Gereja
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text(churchInfo.namaGereja.toUpperCase(), 105, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(churchInfo.sinode, 105, 23, { align: 'center' });

  doc.setFontSize(8);
  doc.text(`${churchInfo.alamat} | Telp: ${churchInfo.telepon}`, 105, 27, { align: 'center' });
  doc.text(`Email: ${churchInfo.email} | Rekening Resmi: ${churchInfo.rekeningGereja}`, 105, 31, {
    align: 'center',
  });

  // Double horizontal rule
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(14, 34, 196, 34);
  doc.setLineWidth(0.2);
  doc.line(14, 35.2, 196, 35.2);

  // 2. Title of Document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('WARTA KEUANGAN & PERTANGGUNGJAWABAN BULANAN', 105, 42, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(...accentColor);
  doc.text(`PERIODE: ${monthName.toUpperCase()}`, 105, 47, { align: 'center' });

  // 3. Executive Summary KPI Boxes
  const boxY = 52;
  const boxHeight = 16;
  const boxWidth = 58;

  // Box 1: Pemasukan
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL PEMASUKAN', 14 + boxWidth / 2, boxY + 5, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(totalIncome), 14 + boxWidth / 2, boxY + 12, { align: 'center' });

  // Box 2: Pengeluaran
  doc.setFillColor(255, 241, 242); // rose-50
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(76, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(159, 18, 57);
  doc.text('TOTAL PENGELUARAN', 76 + boxWidth / 2, boxY + 5, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(totalExpense), 76 + boxWidth / 2, boxY + 12, { align: 'center' });

  // Box 3: Surplus / Defisit
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(138, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(49, 46, 129);
  doc.text(
    netSurplus >= 0 ? 'SURPLUS BULAN BERJALAN' : 'DEFISIT BULAN BERJALAN',
    138 + boxWidth / 2,
    boxY + 5,
    { align: 'center' }
  );
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(netSurplus), 138 + boxWidth / 2, boxY + 12, { align: 'center' });

  // 4. Table 1: Pemasukan Kas & Persembahan
  let currentY = 74;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('A. RINCIAN PEMASUKAN PERSEMBAHAN & DANA PELAYANAN', 14, currentY);

  const incomeRows =
    incomes.length > 0
      ? incomes.map((inc, idx) => [
          `${idx + 1}`,
          inc.tanggal,
          inc.jenisPersembahan,
          inc.keterangan || inc.ibadah,
          inc.metode,
          formatRupiah(inc.nominal),
        ])
      : [['-', '-', 'Belum ada data pemasukan pada bulan ini', '-', '-', 'Rp 0']];

  autoTable(doc, {
    startY: currentY + 2,
    head: [['No', 'Tgl', 'Jenis Persembahan', 'Keterangan / Ibadah', 'Metode', 'Nominal (Rp)']],
    body: incomeRows,
    foot: [['', '', 'TOTAL PEMASUKAN', '', '', formatRupiah(totalIncome)]],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 50, fontStyle: 'bold' },
      3: { cellWidth: 50 },
      4: { cellWidth: 26 },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // Get Y position after income table
  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 5. Table 2: Pengeluaran Kas
  if (currentY > 230) {
    doc.addPage();
    currentY = 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('B. RINCIAN PENGELUARAN BEBAN PROGRAM & OPERASIONAL', 14, currentY);

  const expenseRows =
    expenses.length > 0
      ? expenses.map((exp, idx) => [
          `${idx + 1}`,
          exp.tanggal,
          exp.kategori,
          `${exp.keterangan} (${exp.penerima})`,
          exp.nomorBukti,
          formatRupiah(exp.nominal),
        ])
      : [['-', '-', 'Belum ada data pengeluaran pada bulan ini', '-', '-', 'Rp 0']];

  autoTable(doc, {
    startY: currentY + 2,
    head: [['No', 'Tgl', 'Kategori Pengeluaran', 'Keperluan & Penerima', 'No. Bukti', 'Nominal (Rp)']],
    body: expenseRows,
    foot: [['', '', 'TOTAL PENGELUARAN', '', '', formatRupiah(totalExpense)]],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 50, fontStyle: 'bold' },
      3: { cellWidth: 50 },
      4: { cellWidth: 26 },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check if signatures fit on current page
  if (currentY > 225) {
    doc.addPage();
    currentY = 20;
  }

  // 6. Accountability Note
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 10, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    '"Laporan diterbitkan secara resmi oleh Majelis Jemaat GKKA untuk transparansi & akuntabilitas iman bagi seluruh jemaat."',
    105,
    currentY + 6,
    { align: 'center' }
  );

  currentY += 16;

  // 7. Signatures / Lembar Otorisasi
  const todayStr = formatTanggalIndo(new Date().toISOString().slice(0, 10));
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Jakarta, ${todayStr}`, 196, currentY, { align: 'right' });

  currentY += 5;

  const col1 = 40;
  const col2 = 105;
  const col3 = 170;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Dibuat Oleh,', col1, currentY, { align: 'center' });
  doc.text('Diverifikasi Oleh,', col2, currentY, { align: 'center' });
  doc.text('Mengetahui & Menyetujui,', col3, currentY, { align: 'center' });

  currentY += 18;

  doc.setFont('helvetica', 'bold');
  doc.text(churchInfo.bendahara, col1, currentY, { align: 'center' });
  doc.text(churchInfo.auditor, col2, currentY, { align: 'center' });
  doc.text(churchInfo.ketuaMajelis, col3, currentY, { align: 'center' });

  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Bendahara Jemaat', col1, currentY, { align: 'center' });
  doc.text('Komisi Pengawas / Auditor', col2, currentY, { align: 'center' });
  doc.text('Ketua Majelis Jemaat', col3, currentY, { align: 'center' });

  const filename = `Warta_Keuangan_Gereja_${selectedMonth}.pdf`;
  const blobUrl = doc.output('bloburl').toString();

  return { doc, filename, blobUrl };
}

export function generateChurchISAK35PDF(
  incomes: IncomeTransaction[],
  expenses: ExpenseTransaction[],
  churchInfo: ChurchInfo,
  selectedYear: number,
  reportScope: 'all' | 'posisi' | 'aktivitas' | 'aruskas' | 'calk' = 'all'
): { doc: jsPDF; filename: string; blobUrl: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [30, 41, 59]; // slate-800
  const accentColor: [number, number, number] = [79, 70, 229]; // indigo-600

  // Filter transactions for the selected year
  const yearIncomes = incomes.filter((i) => new Date(i.tanggal).getFullYear() === selectedYear);
  const yearExpenses = expenses.filter((e) => new Date(e.tanggal).getFullYear() === selectedYear);

  // ISAK 35 Calculations
  const incomeTanpaPembatasan = yearIncomes
    .filter((i) => i.tipeAsetNeto === 'tanpa_pembatasan')
    .reduce((sum, i) => sum + i.nominal, 0);

  const incomeDenganPembatasan = yearIncomes
    .filter((i) => i.tipeAsetNeto === 'dengan_pembatasan')
    .reduce((sum, i) => sum + i.nominal, 0);

  const totalPendapatan = incomeTanpaPembatasan + incomeDenganPembatasan;

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

  // Kas & Bank
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

  const saldoAwalKas = 45000000;
  const saldoAwalBankBCA = 120000000;
  const saldoAwalBankMandiri = 85000000;
  const totalKasDanSetaraKas =
    saldoAwalKas + kasKecil + saldoAwalBankBCA + bankBCA + saldoAwalBankMandiri + bankMandiri;

  const nilaiTanahGedung = 3500000000;
  const nilaiPeralatanIbadah = 180000000 + bebanInvestasiAset;
  const akumulasiPenyusutan = -45000000;
  const totalAsetTetap = nilaiTanahGedung + nilaiPeralatanIbadah + akumulasiPenyusutan;
  const totalAset = totalKasDanSetaraKas + totalAsetTetap;

  const utangTitipanMisi = 12500000;
  const utangBebanOperasional = 4800000;
  const totalLiabilitas = utangTitipanMisi + utangBebanOperasional;

  const asetNetoDenganPembatasan = incomeDenganPembatasan + 95000000;
  const asetNetoTanpaPembatasan = totalAset - totalLiabilitas - asetNetoDenganPembatasan;
  const totalAsetNeto = asetNetoTanpaPembatasan + asetNetoDenganPembatasan;

  // Helper: Draw Church Letterhead
  const drawLetterhead = (pageTitle: string, pageSubtitle: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...primaryColor);
    doc.text(churchInfo.namaGereja.toUpperCase(), 105, 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(churchInfo.sinode, 105, 21, { align: 'center' });

    doc.setFontSize(7.5);
    doc.text(`${churchInfo.alamat} | Telp: ${churchInfo.telepon}`, 105, 25, { align: 'center' });
    doc.text(`Email: ${churchInfo.email} | Rekening Resmi: ${churchInfo.rekeningGereja}`, 105, 29, {
      align: 'center',
    });

    // Double rule
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.8);
    doc.line(14, 32, 196, 32);
    doc.setLineWidth(0.2);
    doc.line(14, 33.2, 196, 33.2);

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text(pageTitle, 105, 39, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(...accentColor);
    doc.text(pageSubtitle, 105, 44, { align: 'center' });
  };

  // Helper: Draw Signatures
  const drawSignatures = (startY: number) => {
    let sigY = startY;
    if (sigY > 240) {
      doc.addPage();
      sigY = 25;
    }

    const todayStr = formatTanggalIndo(new Date().toISOString().slice(0, 10));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Jakarta, ${todayStr}`, 196, sigY, { align: 'right' });

    sigY += 5;
    const col1 = 40;
    const col2 = 105;
    const col3 = 170;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Dibuat Oleh,', col1, sigY, { align: 'center' });
    doc.text('Diverifikasi Oleh,', col2, sigY, { align: 'center' });
    doc.text('Mengetahui & Menyetujui,', col3, sigY, { align: 'center' });

    sigY += 18;
    doc.setFont('helvetica', 'bold');
    doc.text(churchInfo.bendahara, col1, sigY, { align: 'center' });
    doc.text(churchInfo.auditor, col2, sigY, { align: 'center' });
    doc.text(churchInfo.ketuaMajelis, col3, sigY, { align: 'center' });

    sigY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Bendahara Jemaat', col1, sigY, { align: 'center' });
    doc.text('Komisi Pengawas / Auditor', col2, sigY, { align: 'center' });
    doc.text('Ketua Majelis Jemaat', col3, sigY, { align: 'center' });
  };

  // ==================== PAGE 1: POSISI KEUANGAN (NERACA) ====================
  if (reportScope === 'all' || reportScope === 'posisi') {
    drawLetterhead('LAPORAN POSISI KEUANGAN (ISAK 35)', `PER 31 DESEMBER ${selectedYear}`);

    autoTable(doc, {
      startY: 48,
      head: [['URAIAN AKUN POSISI KEUANGAN', 'REF / KET', 'JUMLAH (RP)']],
      body: [
        ['1. ASET', '', ''],
        ['   A. Aset Lancar', '', ''],
        ['      - Kas Kecil Tunai (Bendahara)', 'Kas Operasional', formatRupiah(saldoAwalKas + kasKecil)],
        ['      - Bank BCA (Rekening Operasional & QRIS)', 'Operasional & Kolekte', formatRupiah(saldoAwalBankBCA + bankBCA)],
        ['      - Bank Mandiri (Rekening Khusus Pembangunan)', 'Dana Terikat Pembangunan', formatRupiah(saldoAwalBankMandiri + bankMandiri)],
        ['      TOTAL KAS DAN SETARA KAS', 'Likuid', formatRupiah(totalKasDanSetaraKas)],
        ['   B. Aset Tidak Lancar', '', ''],
        ['      - Tanah & Gedung Gereja / Pastori', 'Nilai Perolehan Historis', formatRupiah(nilaiTanahGedung)],
        ['      - Peralatan Ibadah, Sound System & Multimedia', 'Perolehan + Investasi', formatRupiah(nilaiPeralatanIbadah)],
        ['      - Akumulasi Penyusutan Aset Tetap', 'Metode Garis Lurus', formatRupiah(akumulasiPenyusutan)],
        ['      TOTAL ASET TETAP BERSIH', 'Aset Tetap', formatRupiah(totalAsetTetap)],
        ['TOTAL ASET GEREJA', 'Aset Lancar + Tetap', formatRupiah(totalAset)],
        ['', '', ''],
        ['2. LIABILITAS (KEWAJIBAN)', '', ''],
        ['   - Utang Titipan Misi & Diakonia Khusus', 'Jangka Pendek', formatRupiah(utangTitipanMisi)],
        ['   - Utang Beban Operasional / Akrual', 'Jangka Pendek', formatRupiah(utangBebanOperasional)],
        ['TOTAL LIABILITAS', 'Kewajiban', formatRupiah(totalLiabilitas)],
        ['', '', ''],
        ['3. ASET NETO (EKUITAS NONLABA)', '', ''],
        ['   - Aset Neto Tanpa Pembatasan (Unrestricted)', 'Dana Operasional Umum', formatRupiah(asetNetoTanpaPembatasan)],
        ['   - Aset Neto Dengan Pembatasan (Restricted)', 'Dana Pembangunan & Kasih', formatRupiah(asetNetoDenganPembatasan)],
        ['TOTAL ASET NETO GEREJA', 'Cadangan & Terikat', formatRupiah(totalAsetNeto)],
        ['TOTAL LIABILITAS DAN ASET NETO', 'Keseimbangan Neraca (Balance)', formatRupiah(totalLiabilitas + totalAsetNeto)],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 105 },
        1: { cellWidth: 42, halign: 'center' },
        2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        const text = String(data.cell.raw);
        if (
          text.startsWith('1. ASET') ||
          text.startsWith('2. LIABILITAS') ||
          text.startsWith('3. ASET NETO') ||
          text.startsWith('TOTAL ASET GEREJA') ||
          text.startsWith('TOTAL LIABILITAS DAN ASET NETO')
        ) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
    });

    if (reportScope === 'posisi') {
      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      drawSignatures(finalY + 8);
    }
  }

  // ==================== PAGE 2: PENGHASILAN KOMPREHENSIF (AKTIVITAS) ====================
  if (reportScope === 'all' || reportScope === 'aktivitas') {
    if (reportScope === 'all') doc.addPage();
    drawLetterhead('LAPORAN PENGHASILAN KOMPREHENSIF / AKTIVITAS (ISAK 35)', `PERIODE TAHUN ${selectedYear}`);

    autoTable(doc, {
      startY: 48,
      head: [['URAIAN PENDAPATAN & BEBAN', 'KLASIFIKASI ISAK 35', 'JUMLAH (RP)']],
      body: [
        ['1. PENDAPATAN KOMPREHENSIF', '', ''],
        ['   A. Pendapatan Tanpa Pembatasan (Unrestricted)', '', ''],
        ['      - Persembahan Umum / Kantong Kolekte Ibadah', 'Tanpa Pembatasan', formatRupiah(yearIncomes.filter(i => i.jenisPersembahan === 'Persembahan Umum / Kantong Kolekte').reduce((s, i) => s + i.nominal, 0))],
        ['      - Persepuluhan (Tithe)', 'Tanpa Pembatasan', formatRupiah(yearIncomes.filter(i => i.jenisPersembahan === 'Persepuluhan (Tithe)').reduce((s, i) => s + i.nominal, 0))],
        ['      - Persembahan Syukur (Thanksgiving)', 'Tanpa Pembatasan', formatRupiah(yearIncomes.filter(i => i.jenisPersembahan === 'Persembahan Syukur (Thanksgiving)').reduce((s, i) => s + i.nominal, 0))],
        ['      - Persembahan Sekolah Minggu / Remaja', 'Tanpa Pembatasan', formatRupiah(yearIncomes.filter(i => i.jenisPersembahan === 'Persembahan Sekolah Minggu / Remaja').reduce((s, i) => s + i.nominal, 0))],
        ['      TOTAL PENDAPATAN TANPA PEMBATASAN', 'Unrestricted', formatRupiah(incomeTanpaPembatasan)],
        ['   B. Pendapatan Dengan Pembatasan (Restricted)', '', ''],
        ['      - Komitmen Dana Pembangunan & Renovasi', 'Terikat Gedung', formatRupiah(yearIncomes.filter(i => i.jenisPersembahan === 'Dana Pembangunan & Renovasi').reduce((s, i) => s + i.nominal, 0))],
        ['      - Diakonia Kasih & Bantuan Bencana', 'Terikat Kemanusiaan', formatRupiah(yearIncomes.filter(i => i.jenisPersembahan === 'Diakonia & Kasih Bencana').reduce((s, i) => s + i.nominal, 0))],
        ['      TOTAL PENDAPATAN DENGAN PEMBATASAN', 'Restricted', formatRupiah(incomeDenganPembatasan)],
        ['TOTAL PENDAPATAN ENTITAS GEREJA', 'Semua Sumber Daya', formatRupiah(totalPendapatan)],
        ['', '', ''],
        ['2. BEBAN PELAYANAN & OPERASIONAL', '', ''],
        ['   A. Beban Program Pelayanan', '', ''],
        ['      - Pelayanan Ibadah, Musik, Perjamuan & Dekorasi Altar', 'Program Pelayanan', formatRupiah(yearExpenses.filter(e => e.kategori === 'Pelayanan Ibadah & Musik').reduce((s, e) => s + e.nominal, 0))],
        ['      - Diakonia, Santunan Kesehatan & Beasiswa Jemaat', 'Program Pelayanan', formatRupiah(yearExpenses.filter(e => e.kategori === 'Diakonia, Santunan & Beasiswa').reduce((s, e) => s + e.nominal, 0))],
        ['      - Misi, Penginjilan & Dukungan Pos PI Pedalaman', 'Program Pelayanan', formatRupiah(yearExpenses.filter(e => e.kategori === 'Misi & Penginjilan').reduce((s, e) => s + e.nominal, 0))],
        ['      TOTAL BEBAN PROGRAM PELAYANAN', 'Sub-Total Program', formatRupiah(bebanProgram)],
        ['   B. Beban Pendukung Operasional & Sekretariat', '', ''],
        ['      - Operasional & Utilitas (Listrik PLN, Air, Internet)', 'Beban Operasional', formatRupiah(yearExpenses.filter(e => e.kategori === 'Operasional & Utilitas (Listrik/Air/Internet)').reduce((s, e) => s + e.nominal, 0))],
        ['      - Pemeliharaan Gedung, AC & Sarana Prasarana', 'Beban Pendukung', formatRupiah(yearExpenses.filter(e => e.kategori === 'Pemeliharaan Gedung & Sarana').reduce((s, e) => s + e.nominal, 0))],
        ['      - Honorarium & Tunjangan Pelayan / Staf TU', 'Beban Personalia', formatRupiah(yearExpenses.filter(e => e.kategori === 'Honorarium & Tunjangan Pelayan').reduce((s, e) => s + e.nominal, 0))],
        ['      TOTAL BEBAN PENDUKUNG OPERASIONAL', 'Sub-Total Pendukung', formatRupiah(bebanPendukung)],
        ['TOTAL BEBAN PELAYANAN DAN OPERASI', 'Program + Pendukung', formatRupiah(totalBebanOperasi)],
        ['KENAIKAN (PENURUNAN) ASET NETO BERSIH TAHUN BERJALAN', 'Surplus Bersih', formatRupiah(kenaikanAsetNetoBersih)],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 105 },
        1: { cellWidth: 42, halign: 'center' },
        2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        const text = String(data.cell.raw);
        if (
          text.startsWith('1. PENDAPATAN') ||
          text.startsWith('2. BEBAN') ||
          text.startsWith('TOTAL PENDAPATAN') ||
          text.startsWith('TOTAL BEBAN') ||
          text.startsWith('KENAIKAN')
        ) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
    });

    if (reportScope === 'aktivitas') {
      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      drawSignatures(finalY + 8);
    }
  }

  // ==================== PAGE 3: LAPORAN ARUS KAS & CALK ====================
  if (reportScope === 'all' || reportScope === 'aruskas' || reportScope === 'calk') {
    if (reportScope === 'all') doc.addPage();
    drawLetterhead(
      'LAPORAN ARUS KAS & CATATAN ATAS LAPORAN KEUANGAN (CALK)',
      `PERIODE TAHUN ${selectedYear}`
    );

    // Arus Kas Table
    autoTable(doc, {
      startY: 48,
      head: [['LAPORAN ARUS KAS (METODE LANGSUNG)', 'KATEGORI ARUS KAS', 'JUMLAH (RP)']],
      body: [
        ['1. ARUS KAS DARI AKTIVITAS OPERASI', '', ''],
        ['   - Penerimaan Kolekte, Persepuluhan & Ucapan Syukur', 'Arus Masuk', formatRupiah(incomeTanpaPembatasan)],
        ['   - Pembayaran Beban Pelayanan Ibadah & Musik', 'Arus Keluar', `(${formatRupiah(yearExpenses.filter(e => e.kategori === 'Pelayanan Ibadah & Musik').reduce((s, e) => s + e.nominal, 0))})`],
        ['   - Pembayaran Utilitas (Listrik, Air & Internet)', 'Arus Keluar', `(${formatRupiah(yearExpenses.filter(e => e.kategori === 'Operasional & Utilitas (Listrik/Air/Internet)').reduce((s, e) => s + e.nominal, 0))})`],
        ['   - Pembayaran Honorarium Pastoral & Tunjangan TU', 'Arus Keluar', `(${formatRupiah(yearExpenses.filter(e => e.kategori === 'Honorarium & Tunjangan Pelayan').reduce((s, e) => s + e.nominal, 0))})`],
        ['   - Penyaluran Diakonia & Kasih Warga Jemaat', 'Arus Keluar', `(${formatRupiah(yearExpenses.filter(e => e.kategori === 'Diakonia, Santunan & Beasiswa').reduce((s, e) => s + e.nominal, 0))})`],
        ['   ARUS KAS BERSIH DARI AKTIVITAS OPERASI', 'Kas Operasi', formatRupiah(incomeTanpaPembatasan - totalBebanOperasi)],
        ['2. ARUS KAS DARI AKTIVITAS INVESTASI', '', ''],
        ['   - Pembelian Perlengkapan Aset Tetap Sound & Altar', 'Investasi Aset', `(${formatRupiah(bebanInvestasiAset)})`],
        ['   ARUS KAS BERSIH UNTUK AKTIVITAS INVESTASI', 'Kas Investasi', `(${formatRupiah(bebanInvestasiAset)})`],
        ['3. ARUS KAS DARI AKTIVITAS PENDANAAN', '', ''],
        ['   - Penerimaan Donasi Terikat Pembangunan & Renovasi', 'Pendanaan Terikat', formatRupiah(incomeDenganPembatasan)],
        ['   ARUS KAS BERSIH DARI AKTIVITAS PENDANAAN', 'Kas Pendanaan', formatRupiah(incomeDenganPembatasan)],
        ['KENAIKAN (PENURUNAN) BERSIH KAS & SETARA KAS', 'Net Arus Kas', formatRupiah(totalPendapatan - totalBebanOperasi - bebanInvestasiAset)],
        ['KAS DAN SETARA KAS AWAL TAHUN (1 JANUARI)', 'Saldo Awal', formatRupiah(saldoAwalKas + saldoAwalBankBCA + saldoAwalBankMandiri)],
        ['KAS DAN SETARA KAS AKHIR TAHUN (31 DESEMBER)', 'Saldo Akhir Kas', formatRupiah(totalKasDanSetaraKas)],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.6,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 105 },
        1: { cellWidth: 42, halign: 'center' },
        2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        const text = String(data.cell.raw);
        if (
          text.startsWith('1. ARUS') ||
          text.startsWith('2. ARUS') ||
          text.startsWith('3. ARUS') ||
          text.startsWith('KENAIKAN') ||
          text.startsWith('KAS DAN SETARA KAS AKHIR')
        ) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 165;

    // CALK Summary Note Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, finalY + 4, 182, 34, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('CATATAN ATAS LAPORAN KEUANGAN (CALK) & KEBIJAKAN AKUNTANSI:', 18, finalY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      '1. Entitas Gereja menyajikan laporan keuangan sesuai Interpretasi Standar Akuntansi Keuangan 35 (ISAK 35) Entitas Nonlaba.',
      18,
      finalY + 16
    );
    doc.text(
      '2. Kas dengan pembatasan hanya dialokasikan secara spesifik untuk pembangunan fisik gedung ibadah dan tali kasih kemanusiaan.',
      18,
      finalY + 21
    );
    doc.text(
      '3. Aset tetap dicatat pada biaya perolehan dan disusutkan menggunakan metode garis lurus sesuai taksiran masa manfaat ekonomis.',
      18,
      finalY + 26
    );
    doc.text(
      '4. Seluruh mutasi perbendaharaan telah diverifikasi oleh Komisi Pengawas / Tim Audit Majelis Jemaat.',
      18,
      finalY + 31
    );

    // Signatures
    drawSignatures(finalY + 44);
  }

  // Footer page numbers on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen Resmi ISAK 35 • ${churchInfo.namaGereja} • Halaman ${i} dari ${totalPages}`,
      105,
      288,
      { align: 'center' }
    );
  }

  const filename = `Laporan_Keuangan_ISAK35_${selectedYear}_${churchInfo.namaGereja.replace(/\s+/g, '_')}.pdf`;
  const blobUrl = doc.output('bloburl').toString();

  return { doc, filename, blobUrl };
}

