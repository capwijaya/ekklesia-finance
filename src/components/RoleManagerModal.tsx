import React from 'react';
import { UserRole, UserProfile } from '../types/finance';
import {
  ShieldCheck,
  Shield,
  UserCheck,
  Eye,
  Check,
  X,
  Lock,
} from 'lucide-react';

interface RoleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
}

export const RoleManagerModal: React.FC<RoleManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onSelectUser,
}) => {
  if (!isOpen) return null;

  const roleDefinitions: {
    role: UserRole;
    title: string;
    description: string;
    icon: any;
    color: string;
    permissions: string[];
  }[] = [
    {
      role: 'admin',
      title: 'Admin (Ketua Majelis / IT)',
      description: 'Otoritas tertinggi pengelolaan sistem, pembagian hak akses, dan pengaturan RAPBG gereja.',
      icon: ShieldCheck,
      color: 'indigo',
      permissions: [
        'Input & Hapus Pemasukan & Pengeluaran',
        'Kelola Pengaturan Rencana Anggaran (RAPBG)',
        'Sinkronisasi Google Spreadsheet & Drive',
        'Cetak & Otorisasi Laporan ISAK 35',
        'Manajemen Hak Akses Pengguna',
      ],
    },
    {
      role: 'bendahara',
      title: 'Bendahara Jemaat',
      description: 'Pengelola kas harian gereja, pencatat kantong kolekte, pembayaran operasional, dan pengarsip nota.',
      icon: Shield,
      color: 'emerald',
      permissions: [
        'Input & Catat Pemasukan (Kolekte, Tithe, Syukur)',
        'Input & Catat Pengeluaran serta Upload Nota',
        'Sinkronisasi Google Spreadsheet Real-Time',
        'Cetak Warta Keuangan Bulanan',
        'Lihat Laporan Lengkap ISAK 35',
      ],
    },
    {
      role: 'auditor',
      title: 'Auditor / Komisi Verifikasi',
      description: 'Tim pemeriksa independen yang memverifikasi kepatuhan transaksi, bukti fisik, dan kewajaran anggaran.',
      icon: UserCheck,
      color: 'amber',
      permissions: [
        'Inspeksi Seluruh Bukti Nota & Kuitansi',
        'Evaluasi Kepatuhan Standar ISAK 35',
        'Review Penyerapan Anggaran vs Realisasi',
        'Ekspor Data CSV & Spreadsheet',
        'Hanya Baca (Read-Only) untuk Menjaga Integritas Data',
      ],
    },
    {
      role: 'jemaat',
      title: 'Jemaat (Transparansi Publik)',
      description: 'Hak akses untuk seluruh jemaat dan simpatisan melihat ringkasan kas warta jemaat demi akuntabilitas iman.',
      icon: Eye,
      color: 'blue',
      permissions: [
        'Lihat Ringkasan Kas & Grafik Persembahan',
        'Unduh / Cetak Warta Keuangan Bulanan',
        'Privasi Nama Donatur Dilindungi (Anonim)',
        'Tanpa Hak Edit / Hapus Data Kas',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Keamanan & Akses Berbasis Peran (RBAC)
              </h3>
              <p className="text-xs text-slate-500">
                Pilih profil pengguna untuk beralih peran dan menguji izin hak akses.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Pill */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs text-slate-400">Pengguna Aktif:</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {currentUser.name}{' '}
                <span className="text-xs font-normal text-slate-500">({currentUser.email})</span>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            {currentUser.role}
          </span>
        </div>

        {/* Role Selection Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pilih Peran untuk Simulasi:
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {allUsers.map((user) => {
              const roleDef = roleDefinitions.find((r) => r.role === user.role);
              const isSelected = currentUser.id === user.id;

              return (
                <div
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {user.name}
                      </span>
                      <span className="text-xs text-slate-400">• {user.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 max-w-lg">
                      {roleDef?.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Peran: {user.role}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Matrix of Privileges */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 block">
            Matriks Hak Akses & Privilese:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
            <div>
              <strong>• Admin & Bendahara:</strong> Izin Penuh (Input, Edit, Hapus, Sync Sheet)
            </div>
            <div>
              <strong>• Auditor:</strong> Izin Tinjau & Verifikasi Nota (Read-Only Audit)
            </div>
            <div>
              <strong>• Jemaat:</strong> Izin Transparansi Warta (Grafik & Laporan Publik)
            </div>
            <div>
              <strong>• Google Sheets:</strong> Sinkronisasi aman menggunakan enkripsi OAuth 2.0
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
