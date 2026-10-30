import { IncomeTransaction, ExpenseTransaction } from '../types/finance';

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

interface CreateSpreadsheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
  properties: {
    title: string;
  };
}

/**
 * Creates a structured Google Spreadsheet for the church financial system
 */
export async function createChurchSpreadsheet(
  accessToken: string,
  churchName: string = 'Gereja'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  const currentYear = new Date().getFullYear();
  const title = `Keuangan ${churchName} - Pembukuan Kas & ISAK 35 (${currentYear})`;

  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Pemasukan',
          gridProperties: { rowCount: 1000, columnCount: 10, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Pengeluaran',
          gridProperties: { rowCount: 1000, columnCount: 10, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Ringkasan_Kas',
          gridProperties: { rowCount: 100, columnCount: 6, frozenRowCount: 1 },
        },
      },
    ],
  };

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const data: CreateSpreadsheetResponse = await response.json();

  // Populate headers
  await updateSheetRange(accessToken, data.spreadsheetId, 'Pemasukan!A1:J1', [
    [
      'ID Transaksi',
      'Tanggal',
      'Jenis Persembahan',
      'Nominal (Rp)',
      'Keterangan',
      'Nama Jemaat / Donatur',
      'Ibadah / Kebaktian',
      'Metode Pembayaran',
      'Klasifikasi ISAK 35',
      'Petugas Pencatat',
    ],
  ]);

  await updateSheetRange(accessToken, data.spreadsheetId, 'Pengeluaran!A1:J1', [
    [
      'ID Transaksi',
      'Tanggal',
      'Kategori Pengeluaran',
      'Nominal (Rp)',
      'Keterangan / Keperluan',
      'Penerima Dana',
      'Nomor Bukti / Kuitansi',
      'Metode Pembayaran',
      'Pos Beban ISAK 35',
      'Petugas Pencatat',
    ],
  ]);

  await updateSheetRange(accessToken, data.spreadsheetId, 'Ringkasan_Kas!A1:D1', [
    ['Indikator Keuangan', 'Nilai (Rp)', 'Tanggal Diperbarui', 'Keterangan'],
  ]);

  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    title,
  };
}

/**
 * Updates a specific cell range with values
 */
export async function updateSheetRange(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number)[][]
): Promise<any> {
  const url = `${BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal memperbarui sel ${range}.`);
  }

  return response.json();
}

/**
 * Append a row to a sheet
 */
export async function appendRowToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  rowValues: (string | number)[]
): Promise<any> {
  const url = `${BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(
    `${sheetName}!A:A`
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal menambahkan baris ke ${sheetName}.`);
  }

  return response.json();
}

/**
 * Synchronize full state from app to Google Sheets
 */
export async function syncAllToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  incomes: IncomeTransaction[],
  expenses: ExpenseTransaction[]
): Promise<void> {
  // Format income rows
  const incomeHeaders = [
    'ID Transaksi',
    'Tanggal',
    'Jenis Persembahan',
    'Nominal (Rp)',
    'Keterangan',
    'Nama Jemaat / Donatur',
    'Ibadah / Kebaktian',
    'Metode Pembayaran',
    'Klasifikasi ISAK 35',
    'Petugas Pencatat',
  ];

  const incomeRows = incomes.map((inc) => [
    inc.id,
    inc.tanggal,
    inc.jenisPersembahan,
    inc.nominal,
    inc.keterangan || '-',
    inc.namaJemaat || 'Anonim / NN',
    inc.ibadah,
    inc.metode,
    inc.tipeAsetNeto === 'tanpa_pembatasan'
      ? 'Aset Neto Tanpa Pembatasan'
      : 'Aset Neto Dengan Pembatasan',
    inc.createdBy,
  ]);

  // Format expense rows
  const expenseHeaders = [
    'ID Transaksi',
    'Tanggal',
    'Kategori Pengeluaran',
    'Nominal (Rp)',
    'Keterangan / Keperluan',
    'Penerima Dana',
    'Nomor Bukti / Kuitansi',
    'Metode Pembayaran',
    'Pos Beban ISAK 35',
    'Petugas Pencatat',
  ];

  const expenseRows = expenses.map((exp) => [
    exp.id,
    exp.tanggal,
    exp.kategori,
    exp.nominal,
    exp.keterangan || '-',
    exp.penerima,
    exp.nomorBukti,
    exp.metode,
    exp.posISAK35,
    exp.createdBy,
  ]);

  // Total calculations
  const totalIncome = incomes.reduce((sum, item) => sum + item.nominal, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.nominal, 0);
  const netSurplus = totalIncome - totalExpense;
  const nowStr = new Date().toLocaleString('id-ID');

  const summaryRows = [
    ['Total Pemasukan Kas', totalIncome, nowStr, `${incomes.length} transaksi persembahan`],
    ['Total Pengeluaran Kas', totalExpense, nowStr, `${expenses.length} transaksi beban`],
    ['Saldo Kas & Setara Kas Bersih', netSurplus, nowStr, 'Posisi Likuiditas Gereja'],
  ];

  // Batch clear and update
  await updateSheetRange(accessToken, spreadsheetId, 'Pemasukan!A1:J1000', [
    incomeHeaders,
    ...incomeRows,
  ]);

  await updateSheetRange(accessToken, spreadsheetId, 'Pengeluaran!A1:J1000', [
    expenseHeaders,
    ...expenseRows,
  ]);

  await updateSheetRange(accessToken, spreadsheetId, 'Ringkasan_Kas!A1:D10', [
    ['Indikator Keuangan', 'Nilai (Rp)', 'Tanggal Sinkronisasi', 'Keterangan'],
    ...summaryRows,
  ]);
}

/**
 * Fetch spreadsheet metadata to check access and sheet titles
 */
export async function getSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: string[] }> {
  const url = `${BASE_URL}/${spreadsheetId}?fields=properties.title,sheets.properties.title`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Gagal mengakses Google Spreadsheet yang diberikan.');
  }

  const data = await response.json();
  const sheets = (data.sheets || []).map((s: any) => s.properties.title);
  return {
    title: data.properties?.title || 'Google Spreadsheet',
    sheets,
  };
}
