export const formatRupiah = (nominal: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(nominal || 0);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num || 0);
};

export const formatTanggalIndo = (tanggalStr: string): string => {
  if (!tanggalStr) return '-';
  try {
    const date = new Date(tanggalStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return tanggalStr;
  }
};

export const formatBulanTahun = (tanggalStr: string): string => {
  if (!tanggalStr) return '-';
  try {
    const date = new Date(tanggalStr);
    return new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return tanggalStr;
  }
};
