import React, { useState, useRef } from 'react';
import {
  IncomeTransaction,
  ExpenseTransaction,
  IncomeCategory,
  ExpenseCategory,
  PaymentMethod,
  NetAssetType,
} from '../types/finance';
import { formatRupiah } from '../utils/formatters';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Info,
  Check,
  Filter,
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'income' | 'expense';
  onImportIncomes: (incomes: Omit<IncomeTransaction, 'id' | 'createdBy'>[]) => void;
  onImportExpenses: (expenses: Omit<ExpenseTransaction, 'id' | 'createdBy'>[]) => void;
  userName: string;
}

interface ParsedIncomeRow {
  index: number;
  tanggal: string;
  jenisPersembahan: IncomeCategory;
  nominal: number;
  keterangan: string;
  namaJemaat: string;
  ibadah: IncomeTransaction['ibadah'];
  metode: PaymentMethod;
  tipeAsetNeto: NetAssetType;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  selected: boolean;
}

interface ParsedExpenseRow {
  index: number;
  tanggal: string;
  kategori: ExpenseCategory;
  nominal: number;
  keterangan: string;
  penerima: string;
  nomorBukti: string;
  metode: PaymentMethod;
  posISAK35: ExpenseTransaction['posISAK35'];
  isValid: boolean;
  errors: string[];
  warnings: string[];
  selected: boolean;
}

const INCOME_CATEGORIES: IncomeCategory[] = [
  'Persembahan Umum / Kantong Kolekte',
  'Persepuluhan (Tithe)',
  'Persembahan Syukur (Thanksgiving)',
  'Dana Pembangunan & Renovasi',
  'Diakonia & Kasih Bencana',
  'Persembahan Sekolah Minggu / Remaja',
  'Sumbangan Donatur Khusus',
  'Pendapatan Lain-lain (Bunga/Hasil Usaha)',
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Operasional & Utilitas (Listrik/Air/Internet)',
  'Pelayanan Ibadah & Musik',
  'Diakonia, Santunan & Beasiswa',
  'Pemeliharaan Gedung & Sarana',
  'Honorarium & Tunjangan Pelayan',
  'Misi & Penginjilan',
  'Pembelian Perlengkapan & Aset',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Tunai (Kas Kecil)',
  'Transfer Bank BCA',
  'Transfer Bank Mandiri',
  'QRIS Gereja',
];

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'income',
  onImportIncomes,
  onImportExpenses,
  userName,
}) => {
  const [activeType, setActiveType] = useState<'income' | 'expense'>(defaultType);
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const [parsedIncomes, setParsedIncomes] = useState<ParsedIncomeRow[]>([]);
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpenseRow[]>([]);
  const [filterPreview, setFilterPreview] = useState<'all' | 'valid' | 'invalid'>('all');
  const [isSuccessMessage, setIsSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to parse CSV line considering quoted fields with commas/semicolons
  const parseCsvLine = (line: string, delimiter: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  // Detect delimiter: comma, semicolon, or tab
  const detectDelimiter = (headerLine: string): string => {
    const semicolons = (headerLine.match(/;/g) || []).length;
    const commas = (headerLine.match(/,/g) || []).length;
    const tabs = (headerLine.match(/\t/g) || []).length;

    if (semicolons > commas && semicolons > tabs) return ';';
    if (tabs > commas && tabs > semicolons) return '\t';
    return ',';
  };

  // Helper to clean nominal (e.g., "Rp 1.500.000", "1500000", "1,500,000.00")
  const parseNominal = (valStr: string): number => {
    if (!valStr) return 0;
    // Remove "Rp", whitespace, and non-digit/dot/comma chars
    let clean = valStr.replace(/[^\d.,]/g, '').trim();
    if (!clean) return 0;

    // Handle Indonesian format "1.500.000" or English "1,500,000"
    if (clean.includes('.') && !clean.includes(',')) {
      // Could be "1.500.000" (Indonesian thousand separators) or "1500.50"
      const parts = clean.split('.');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        clean = parts.join('');
      }
    } else if (clean.includes(',') && !clean.includes('.')) {
      const parts = clean.split(',');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        clean = parts.join('');
      } else if (parts.length === 2 && parts[1].length <= 2) {
        clean = parts[0];
      }
    } else if (clean.includes('.') && clean.includes(',')) {
      // Example: 1.500.000,00 -> Indonesian
      if (clean.indexOf('.') < clean.indexOf(',')) {
        clean = clean.split(',')[0].replace(/\./g, '');
      } else {
        // Example: 1,500,000.00 -> US format
        clean = clean.split('.')[0].replace(/,/g, '');
      }
    }

    const num = parseInt(clean.replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  // Helper to parse and standardize date (YYYY-MM-DD)
  const parseDate = (valStr: string): { date: string; valid: boolean } => {
    if (!valStr) {
      return { date: new Date().toISOString().slice(0, 10), valid: false };
    }
    const clean = valStr.trim();

    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return { date: clean, valid: true };
    }

    // Check DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return { date: `${year}-${month}-${day}`, valid: true };
    }

    // Fallback: today
    return { date: new Date().toISOString().slice(0, 10), valid: false };
  };

  // Match closest Income Category
  const matchIncomeCategory = (valStr: string): IncomeCategory => {
    if (!valStr) return 'Persembahan Umum / Kantong Kolekte';
    const lower = valStr.toLowerCase();

    if (lower.includes('sepuluh') || lower.includes('tithe')) return 'Persepuluhan (Tithe)';
    if (lower.includes('syukur') || lower.includes('thanks')) return 'Persembahan Syukur (Thanksgiving)';
    if (lower.includes('bangun') || lower.includes('renov')) return 'Dana Pembangunan & Renovasi';
    if (lower.includes('diakoni') || lower.includes('santun') || lower.includes('bencana'))
      return 'Diakonia & Kasih Bencana';
    if (lower.includes('minggu') || lower.includes('anak') || lower.includes('remaja'))
      return 'Persembahan Sekolah Minggu / Remaja';
    if (lower.includes('donatur') || lower.includes('khusus') || lower.includes('sumbang'))
      return 'Sumbangan Donatur Khusus';
    if (lower.includes('bunga') || lower.includes('usaha') || lower.includes('lain'))
      return 'Pendapatan Lain-lain (Bunga/Hasil Usaha)';

    return 'Persembahan Umum / Kantong Kolekte';
  };

  // Match closest Expense Category
  const matchExpenseCategory = (valStr: string): ExpenseCategory => {
    if (!valStr) return 'Operasional & Utilitas (Listrik/Air/Internet)';
    const lower = valStr.toLowerCase();

    if (lower.includes('listrik') || lower.includes('pln') || lower.includes('air') || lower.includes('internet') || lower.includes('operasional'))
      return 'Operasional & Utilitas (Listrik/Air/Internet)';
    if (lower.includes('ibadah') || lower.includes('musik') || lower.includes('bunga') || lower.includes('perjamuan') || lower.includes('altar'))
      return 'Pelayanan Ibadah & Musik';
    if (lower.includes('diakoni') || lower.includes('santun') || lower.includes('beasiswa') || lower.includes('sakit') || lower.includes('duka'))
      return 'Diakonia, Santunan & Beasiswa';
    if (lower.includes('gedung') || lower.includes('sarana') || lower.includes('servis') || lower.includes('cat') || lower.includes('ac'))
      return 'Pemeliharaan Gedung & Sarana';
    if (lower.includes('honor') || lower.includes('gaji') || lower.includes('pastor') || lower.includes('tunjangan') || lower.includes('koster'))
      return 'Honorarium & Tunjangan Pelayan';
    if (lower.includes('misi') || lower.includes('penginjil') || lower.includes('pi') || lower.includes('pedalaman'))
      return 'Misi & Penginjilan';
    if (lower.includes('aset') || lower.includes('beli') || lower.includes('alat') || lower.includes('perlengkapan'))
      return 'Pembelian Perlengkapan & Aset';

    return 'Operasional & Utilitas (Listrik/Air/Internet)';
  };

  // Match Payment Method
  const matchPaymentMethod = (valStr: string): PaymentMethod => {
    if (!valStr) return 'Tunai (Kas Kecil)';
    const lower = valStr.toLowerCase();
    if (lower.includes('qris')) return 'QRIS Gereja';
    if (lower.includes('mandiri')) return 'Transfer Bank Mandiri';
    if (lower.includes('bca') || lower.includes('transfer') || lower.includes('bank')) return 'Transfer Bank BCA';
    return 'Tunai (Kas Kecil)';
  };

  // Process Raw CSV Content
  const processCsvContent = (content: string) => {
    setIsSuccessMessage(null);
    const rawLines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (rawLines.length === 0) return;

    const delimiter = detectDelimiter(rawLines[0]);
    const headers = parseCsvLine(rawLines[0], delimiter).map((h) =>
      h.toLowerCase().replace(/[\s_]/g, '')
    );

    // Map column indices flexibly
    const colIndex = {
      tanggal: headers.findIndex((h) => h.includes('tanggal') || h.includes('date') || h.includes('tgl')),
      nominal: headers.findIndex((h) => h.includes('nominal') || h.includes('jumlah') || h.includes('amount') || h.includes('nilai')),
      keterangan: headers.findIndex((h) => h.includes('keterangan') || h.includes('deskripsi') || h.includes('memo') || h.includes('ket') || h.includes('uraian')),
      kategori: headers.findIndex((h) => h.includes('kategori') || h.includes('jenis') || h.includes('persembahan') || h.includes('pos')),
      jemaatPenerima: headers.findIndex((h) => h.includes('jemaat') || h.includes('nama') || h.includes('donatur') || h.includes('penerima') || h.includes('vendor')),
      metode: headers.findIndex((h) => h.includes('metode') || h.includes('pembayaran') || h.includes('bayar') || h.includes('rekening')),
      ibadah: headers.findIndex((h) => h.includes('ibadah') || h.includes('kebaktian') || h.includes('sesi')),
      nomorBukti: headers.findIndex((h) => h.includes('bukti') || h.includes('voucher') || h.includes('kuitansi') || h.includes('nota') || h.includes('nobukti')),
      tipeISAK: headers.findIndex((h) => h.includes('isak') || h.includes('pembatasan') || h.includes('asetneto')),
    };

    const dataLines = rawLines.slice(1);

    if (activeType === 'income') {
      const rows: ParsedIncomeRow[] = [];

      dataLines.forEach((line, idx) => {
        const values = parseCsvLine(line, delimiter);
        if (values.every((v) => !v)) return; // skip fully empty lines

        const errors: string[] = [];
        const warnings: string[] = [];

        // Tanggal
        const rawDate = colIndex.tanggal >= 0 ? values[colIndex.tanggal] : values[0] || '';
        const { date, valid: dateValid } = parseDate(rawDate);
        if (!dateValid && rawDate) {
          warnings.push(`Format tanggal disesuaikan: ${date}`);
        } else if (!rawDate) {
          warnings.push(`Tanggal kosong, menggunakan tanggal hari ini: ${date}`);
        }

        // Nominal
        const rawNominal = colIndex.nominal >= 0 ? values[colIndex.nominal] : values[2] || '';
        const nominal = parseNominal(rawNominal);
        if (nominal <= 0) {
          errors.push('Nominal harus lebih dari 0.');
        }

        // Keterangan
        const rawKet = colIndex.keterangan >= 0 ? values[colIndex.keterangan] : values[3] || '';
        const rawKat = colIndex.kategori >= 0 ? values[colIndex.kategori] : values[1] || '';
        const jenisPersembahan = matchIncomeCategory(rawKat);
        const keterangan = rawKet.trim() || jenisPersembahan;

        // Nama Jemaat
        const rawJemaat = colIndex.jemaatPenerima >= 0 ? values[colIndex.jemaatPenerima] : values[4] || '';
        const namaJemaat = rawJemaat.trim() || 'Anonim / Jemaat';

        // Ibadah
        const rawIbadah = colIndex.ibadah >= 0 ? values[colIndex.ibadah] : values[5] || '';
        let ibadah: IncomeTransaction['ibadah'] = 'Ibadah Raya 1';
        const lowerIbadah = rawIbadah.toLowerCase();
        if (lowerIbadah.includes('raya 2') || lowerIbadah.includes('kedua')) ibadah = 'Ibadah Raya 2';
        else if (lowerIbadah.includes('doa')) ibadah = 'Ibadah Doa';
        else if (lowerIbadah.includes('remaja') || lowerIbadah.includes('pemuda')) ibadah = 'Persekutuan Remaja';
        else if (lowerIbadah.includes('transfer') || lowerIbadah.includes('online')) ibadah = 'Transfer/Online';

        // Metode
        const rawMetode = colIndex.metode >= 0 ? values[colIndex.metode] : values[6] || '';
        const metode = matchPaymentMethod(rawMetode);

        // ISAK 35 Net Asset Restriction
        const rawIsak = colIndex.tipeISAK >= 0 ? values[colIndex.tipeISAK] : values[7] || '';
        let tipeAsetNeto: NetAssetType = 'tanpa_pembatasan';
        if (
          rawIsak.toLowerCase().includes('dengan') ||
          rawIsak.toLowerCase().includes('terikat') ||
          jenisPersembahan === 'Dana Pembangunan & Renovasi' ||
          jenisPersembahan === 'Diakonia & Kasih Bencana'
        ) {
          tipeAsetNeto = 'dengan_pembatasan';
        }

        const isValid = errors.length === 0;

        rows.push({
          index: idx + 1,
          tanggal: date,
          jenisPersembahan,
          nominal,
          keterangan,
          namaJemaat,
          ibadah,
          metode,
          tipeAsetNeto,
          isValid,
          errors,
          warnings,
          selected: isValid,
        });
      });

      setParsedIncomes(rows);
    } else {
      // Expense parser
      const rows: ParsedExpenseRow[] = [];

      dataLines.forEach((line, idx) => {
        const values = parseCsvLine(line, delimiter);
        if (values.every((v) => !v)) return;

        const errors: string[] = [];
        const warnings: string[] = [];

        // Tanggal
        const rawDate = colIndex.tanggal >= 0 ? values[colIndex.tanggal] : values[0] || '';
        const { date, valid: dateValid } = parseDate(rawDate);
        if (!dateValid && rawDate) {
          warnings.push(`Format tanggal disesuaikan: ${date}`);
        } else if (!rawDate) {
          warnings.push(`Tanggal kosong, otomatis tanggal hari ini: ${date}`);
        }

        // Nominal
        const rawNominal = colIndex.nominal >= 0 ? values[colIndex.nominal] : values[2] || '';
        const nominal = parseNominal(rawNominal);
        if (nominal <= 0) {
          errors.push('Nominal pengeluaran harus lebih besar dari 0.');
        }

        // Kategori
        const rawKat = colIndex.kategori >= 0 ? values[colIndex.kategori] : values[1] || '';
        const kategori = matchExpenseCategory(rawKat);

        // Keterangan
        const rawKet = colIndex.keterangan >= 0 ? values[colIndex.keterangan] : values[3] || '';
        const keterangan = rawKet.trim() || kategori;

        // Penerima / Vendor
        const rawPenerima = colIndex.jemaatPenerima >= 0 ? values[colIndex.jemaatPenerima] : values[4] || '';
        const penerima = rawPenerima.trim() || 'Pihak Ketiga';

        // Nomor Bukti
        const rawBukti = colIndex.nomorBukti >= 0 ? values[colIndex.nomorBukti] : values[5] || '';
        const nomorBukti =
          rawBukti.trim() ||
          `VCH-${date.replace(/-/g, '').slice(0, 6)}/${Math.floor(100 + Math.random() * 900)}`;

        // Metode
        const rawMetode = colIndex.metode >= 0 ? values[colIndex.metode] : values[6] || '';
        const metode = matchPaymentMethod(rawMetode);

        // ISAK 35 Expense classification
        let posISAK35: ExpenseTransaction['posISAK35'] = 'Beban Pendukung & Operasional';
        if (
          kategori === 'Pelayanan Ibadah & Musik' ||
          kategori === 'Diakonia, Santunan & Beasiswa' ||
          kategori === 'Misi & Penginjilan'
        ) {
          posISAK35 = 'Beban Program Pelayanan';
        } else if (kategori === 'Pembelian Perlengkapan & Aset') {
          posISAK35 = 'Pengeluaran Investasi Aset Tetap';
        }

        const isValid = errors.length === 0;

        rows.push({
          index: idx + 1,
          tanggal: date,
          kategori,
          nominal,
          keterangan,
          penerima,
          nomorBukti,
          metode,
          posISAK35,
          isValid,
          errors,
          warnings,
          selected: isValid,
        });
      });

      setParsedExpenses(rows);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processCsvContent(text || '');
      };
      reader.readAsText(file);
    }
  };

  // Handle direct text paste process
  const handlePasteProcess = () => {
    if (pasteText.trim()) {
      processCsvContent(pasteText);
    }
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = (type: 'income' | 'expense') => {
    let csvHeader = '';
    let csvSample = '';
    let dlFileName = '';

    if (type === 'income') {
      dlFileName = 'template_pemasukan_gereja.csv';
      csvHeader = 'tanggal,jenis_persembahan,nominal,keterangan,nama_jemaat,ibadah,metode,tipe_aset_neto';
      csvSample = [
        '2026-11-01,Persembahan Umum / Kantong Kolekte,14500000,Kolekte Ibadah Raya 1,Jemaat GKKA,Ibadah Raya 1,Tunai (Kas Kecil),tanpa_pembatasan',
        '2026-11-01,Persepuluhan (Tithe),8500000,Persepuluhan berkah usaha November,Keluarga Tanuwidjaja,Transfer/Online,Transfer Bank BCA,tanpa_pembatasan',
        '2026-11-03,Persembahan Syukur (Thanksgiving),3000000,Ucapan syukur kelulusan putra,Kel. Hendra Wijaya,Ibadah Raya 2,QRIS Gereja,tanpa_pembatasan',
        '2026-11-05,Dana Pembangunan & Renovasi,25000000,Komitmen renovasi ruang ibadah anak,Hamba Allah,Transfer/Online,Transfer Bank Mandiri,dengan_pembatasan',
        '2026-11-08,Diakonia & Kasih Bencana,4500000,Tali kasih bantuan musibah jemaat,Komisi Kaum Pria,Ibadah Doa,Tunai (Kas Kecil),dengan_pembatasan',
      ].join('\r\n');
    } else {
      dlFileName = 'template_pengeluaran_gereja.csv';
      csvHeader = 'tanggal,kategori,nominal,keterangan,penerima,nomor_bukti,metode,pos_isak35';
      csvSample = [
        '2026-11-02,Operasional & Utilitas (Listrik/Air/Internet),3450000,Pembayaran Token Listrik PLN Gedung Utama,PT PLN (Persero),BKT-PLN-1126/01,Transfer Bank BCA,Beban Pendukung & Operasional',
        '2026-11-04,Pelayanan Ibadah & Musik,1850000,Roti perjamuan kudus & bunga altar 2 minggu,Gloria Florist,KW-GLR-1102,Tunai (Kas Kecil),Beban Program Pelayanan',
        '2026-11-06,Diakonia, Santunan & Beasiswa,3500000,Santunan biaya pengobatan jemaat lansia,Kel. Bpk. Yohanes,VCH-DIAK-1106,Transfer Bank BCA,Beban Program Pelayanan',
        '2026-11-10,Pemeliharaan Gedung & Sarana,2400000,Servis berkala & cuci 6 unit AC inverter,Mitra Teknik Servis,KW-MTS-992,Tunai (Kas Kecil),Beban Pendukung & Operasional',
        '2026-11-15,Honorarium & Tunjangan Pelayan,14000000,Honorarium bulanan pastoral & koster,Tim Pastoral & Sekretariat,VCH-HNR-1115,Transfer Bank BCA,Beban Program Pelayanan',
      ].join('\r\n');
    }

    const csvContent = '\uFEFF' + csvHeader + '\r\n' + csvSample;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', dlFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Perform Final Bulk Import
  const handleCommitImport = () => {
    if (activeType === 'income') {
      const selected = parsedIncomes.filter((r) => r.selected && r.isValid);
      if (selected.length === 0) return;

      const prepared = selected.map((r) => ({
        tanggal: r.tanggal,
        jenisPersembahan: r.jenisPersembahan,
        nominal: r.nominal,
        keterangan: r.keterangan,
        namaJemaat: r.namaJemaat,
        ibadah: r.ibadah,
        metode: r.metode,
        tipeAsetNeto: r.tipeAsetNeto,
      }));

      onImportIncomes(prepared);
      setIsSuccessMessage(`Berhasil mengimpor ${prepared.length} transaksi pemasukan!`);
      setTimeout(() => {
        onClose();
        setIsSuccessMessage(null);
        setParsedIncomes([]);
        setFileName(null);
      }, 1400);
    } else {
      const selected = parsedExpenses.filter((r) => r.selected && r.isValid);
      if (selected.length === 0) return;

      const prepared = selected.map((r) => ({
        tanggal: r.tanggal,
        kategori: r.kategori,
        nominal: r.nominal,
        keterangan: r.keterangan,
        penerima: r.penerima,
        nomorBukti: r.nomorBukti,
        metode: r.metode,
        posISAK35: r.posISAK35,
      }));

      onImportExpenses(prepared);
      setIsSuccessMessage(`Berhasil mengimpor ${prepared.length} transaksi pengeluaran!`);
      setTimeout(() => {
        onClose();
        setIsSuccessMessage(null);
        setParsedExpenses([]);
        setFileName(null);
      }, 1400);
    }
  };

  // Toggle selection for all visible or valid rows
  const handleToggleSelectAll = (checked: boolean) => {
    if (activeType === 'income') {
      setParsedIncomes((prev) =>
        prev.map((r) => (r.isValid ? { ...r, selected: checked } : r))
      );
    } else {
      setParsedExpenses((prev) =>
        prev.map((r) => (r.isValid ? { ...r, selected: checked } : r))
      );
    }
  };

  const currentRows = activeType === 'income' ? parsedIncomes : parsedExpenses;
  const validRows = currentRows.filter((r) => r.isValid);
  const invalidRows = currentRows.filter((r) => !r.isValid);
  const selectedRows = currentRows.filter((r) => r.selected && r.isValid);
  const totalNominalToImport = selectedRows.reduce((sum, r) => sum + r.nominal, 0);

  const displayedRows = currentRows.filter((r) => {
    if (filterPreview === 'valid') return r.isValid;
    if (filterPreview === 'invalid') return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Impor Data Transaksi Massal (CSV / Excel)
              </h3>
              <p className="text-xs text-slate-500">
                Unggah data buku kas atau warta secara sekaligus untuk efisiensi perbendaharaan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner if committed */}
        {isSuccessMessage && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 text-sm font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{isSuccessMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Type Selection & Template Download */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            {/* Type Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-900/60 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveType('income');
                  setParsedIncomes([]);
                  setParsedExpenses([]);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeType === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Impor Pemasukan (Kolekte)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveType('expense');
                  setParsedIncomes([]);
                  setParsedExpenses([]);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeType === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Impor Pengeluaran (Belanja)
              </button>
            </div>

            {/* Template Download Button */}
            <button
              type="button"
              onClick={() => handleDownloadTemplate(activeType)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Unduh Template CSV {activeType === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
            </button>
          </div>

          {/* Step 2: Choose Upload Method (File or Paste) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-indigo-500" />
                Metode Input Data
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    inputMode === 'file'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Unggah Berkas .CSV
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    inputMode === 'paste'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Salin-Tempel (Paste Teks)
                </button>
              </div>
            </div>

            {inputMode === 'file' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {fileName ? (
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      Berkas terpilih: {fileName}
                    </span>
                  ) : (
                    'Klik untuk memilih berkas CSV atau seret ke area ini'
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Mendukung format .csv, .txt, atau .tsv dengan pemisah koma (,) atau titik-koma (;)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Tempel baris teks CSV di sini (misal dari Excel/Google Sheets)...\nContoh:\ntanggal,kategori,nominal,keterangan\n2026-11-01,Persepuluhan,5000000,Keluarga Bpk. S`}
                  rows={5}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-indigo-500 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasteProcess}
                    disabled={!pasteText.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Proses Teks CSV
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Parsed Data Preview & Validation Table */}
          {currentRows.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Summary Stats Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Total Baris</span>
                  <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {currentRows.length} Baris
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-700 dark:text-emerald-300 block text-[10px]">
                    Siap Diimpor (Valid)
                  </span>
                  <strong className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {validRows.length} Baris
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                  <span className="text-rose-700 dark:text-rose-300 block text-[10px]">
                    Bermasalah
                  </span>
                  <strong className="text-sm font-bold text-rose-700 dark:text-rose-300">
                    {invalidRows.length} Baris
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-indigo-700 dark:text-indigo-300 block text-[10px]">
                    Total Nominal Terpilih
                  </span>
                  <strong className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                    {formatRupiah(totalNominalToImport)}
                  </strong>
                </div>
              </div>

              {/* Table Toolbar: Filter status & select all */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={validRows.length > 0 && selectedRows.length === validRows.length}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Pilih Semua yang Valid ({validRows.length})</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={filterPreview}
                    onChange={(e) => setFilterPreview(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="all">Tampilkan Semua Baris ({currentRows.length})</option>
                    <option value="valid">Hanya Valid ({validRows.length})</option>
                    <option value="invalid">Hanya Bermasalah ({invalidRows.length})</option>
                  </select>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3 w-8">Pilih</th>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">
                        {activeType === 'income' ? 'Jenis Persembahan' : 'Kategori Belanja'}
                      </th>
                      <th className="py-2 px-3 text-right">Nominal</th>
                      <th className="py-2 px-3">Keterangan</th>
                      <th className="py-2 px-3">
                        {activeType === 'income' ? 'Jemaat' : 'Penerima'}
                      </th>
                      <th className="py-2 px-3">Metode</th>
                      <th className="py-2 px-3">Status Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedRows.map((row: any) => {
                      const isRowSelected = row.selected && row.isValid;

                      return (
                        <tr
                          key={row.index}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                            !row.isValid
                              ? 'bg-rose-50/40 dark:bg-rose-950/20'
                              : isRowSelected
                              ? 'bg-indigo-50/30 dark:bg-indigo-950/20'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              disabled={!row.isValid}
                              checked={row.selected}
                              onChange={(e) => {
                                if (activeType === 'income') {
                                  setParsedIncomes((prev) =>
                                    prev.map((r) =>
                                      r.index === row.index ? { ...r, selected: e.target.checked } : r
                                    )
                                  );
                                } else {
                                  setParsedExpenses((prev) =>
                                    prev.map((r) =>
                                      r.index === row.index ? { ...r, selected: e.target.checked } : r
                                    )
                                  );
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono">{row.tanggal}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {activeType === 'income' ? row.jenisPersembahan : row.kategori}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                            {formatRupiah(row.nominal)}
                          </td>
                          <td className="py-2 px-3 max-w-[150px] truncate" title={row.keterangan}>
                            {row.keterangan}
                          </td>
                          <td className="py-2 px-3">
                            {activeType === 'income' ? row.namaJemaat : row.penerima}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{row.metode}</td>
                          <td className="py-2 px-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Siap Impor
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold"
                                title={row.errors.join(', ')}
                              >
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                {row.errors[0] || 'Tidak valid'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {selectedRows.length > 0 ? (
              <span>
                <strong>{selectedRows.length} data</strong> dipilih ({formatRupiah(totalNominalToImport)})
              </span>
            ) : (
              <span>Pilih berkas CSV untuk memproses data transaksi massal</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={selectedRows.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                selectedRows.length === 0
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                  : activeType === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Impor {selectedRows.length} Transaksi Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
