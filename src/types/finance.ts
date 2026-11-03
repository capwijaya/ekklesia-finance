export type UserRole = 'admin' | 'bendahara' | 'auditor' | 'jemaat';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title?: string;
  password?: string;
  pin?: string;
  lastLogin?: string;
}

// ISAK 35 Net Asset Restriction Classification
export type NetAssetType = 'tanpa_pembatasan' | 'dengan_pembatasan';

export type IncomeCategory =
  | 'Persembahan Umum / Kantong Kolekte'
  | 'Persepuluhan (Tithe)'
  | 'Persembahan Syukur (Thanksgiving)'
  | 'Dana Pembangunan & Renovasi'
  | 'Diakonia & Kasih Bencana'
  | 'Persembahan Sekolah Minggu / Remaja'
  | 'Sumbangan Donatur Khusus'
  | 'Pendapatan Lain-lain (Bunga/Hasil Usaha)';

export type ExpenseCategory =
  | 'Operasional & Utilitas (Listrik/Air/Internet)'
  | 'Pelayanan Ibadah & Musik'
  | 'Diakonia, Santunan & Beasiswa'
  | 'Pemeliharaan Gedung & Sarana'
  | 'Honorarium & Tunjangan Pelayan'
  | 'Misi & Penginjilan'
  | 'Pembelian Perlengkapan & Aset';

export type PaymentMethod = 'Tunai (Kas Kecil)' | 'Transfer Bank BCA' | 'Transfer Bank Mandiri' | 'QRIS Gereja';

export interface IncomeTransaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jenisPersembahan: IncomeCategory;
  nominal: number;
  keterangan: string;
  namaJemaat?: string; // Optional/Anonim
  ibadah: 'Ibadah Raya 1' | 'Ibadah Raya 2' | 'Ibadah Doa' | 'Persekutuan Remaja' | 'Transfer/Online' | 'Lainnya';
  metode: PaymentMethod;
  tipeAsetNeto: NetAssetType; // ISAK 35
  createdBy: string;
  syncedToSheets?: boolean;
}

export interface ExpenseTransaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kategori: ExpenseCategory;
  nominal: number;
  keterangan: string;
  penerima: string;
  nomorBukti: string; // No. Kuitansi / Voucher
  notaUrl?: string; // Base64 data URL or external URL
  metode: PaymentMethod;
  posISAK35: 'Beban Program Pelayanan' | 'Beban Pendukung & Operasional' | 'Pengeluaran Investasi Aset Tetap';
  createdBy: string;
  syncedToSheets?: boolean;
}

export interface BudgetItem {
  id: string;
  kategori: ExpenseCategory;
  anggaranTahunan: number;
  anggaranBulanan: number;
  keterangan: string;
}

export interface ChurchInfo {
  namaGereja: string;
  sinode: string;
  alamat: string;
  telepon: string;
  email: string;
  rekeningGereja: string;
  ketuaMajelis: string;
  bendahara: string;
  auditor: string;
}

export interface SheetsSyncState {
  isConnected: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  syncError: string | null;
}
