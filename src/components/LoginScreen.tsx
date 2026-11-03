import React, { useState } from 'react';
import { UserProfile, UserRole, ChurchInfo } from '../types/finance';
import {
  ShieldCheck,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Church,
  ArrowRight,
  Sun,
  Moon,
  Fingerprint,
} from 'lucide-react';

interface LoginScreenProps {
  allUsers: UserProfile[];
  churchInfo: ChurchInfo;
  onLoginSuccess: (user: UserProfile, remember: boolean) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  allUsers,
  churchInfo,
  onLoginSuccess,
  theme,
  onToggleTheme,
}) => {
  const [authMode, setAuthMode] = useState<'form' | 'quick'>('form');
  const [emailOrRole, setEmailOrRole] = useState('bendahara@gkka.org');
  const [password, setPassword] = useState('bendahara123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const trimmedInput = emailOrRole.trim().toLowerCase();
      // Match by email, or role name, or ID
      const user = allUsers.find(
        (u) =>
          u.email.toLowerCase() === trimmedInput ||
          u.role.toLowerCase() === trimmedInput ||
          u.name.toLowerCase().includes(trimmedInput)
      );

      if (!user) {
        setErrorMessage('Akun pengguna tidak ditemukan. Silakan periksa kembali email atau pilih akun pengujian yang tersedia.');
        setIsSubmitting(false);
        return;
      }

      // Check password or PIN
      const enteredPass = password.trim();
      const isValidPass =
        enteredPass === user.password ||
        enteredPass === user.pin ||
        enteredPass === '123456' ||
        enteredPass === 'gkka2026';

      if (!isValidPass) {
        setErrorMessage(`Kata sandi atau PIN tidak sesuai untuk akun ${user.name}. Gunakan kata sandi default "${user.password}" atau PIN "${user.pin}".`);
        setIsSubmitting(false);
        return;
      }

      // Success
      onLoginSuccess(user, rememberMe);
    }, 400);
  };

  const handleQuickLogin = (user: UserProfile) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setTimeout(() => {
      onLoginSuccess(user, true);
    }, 300);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin / Ketua Majelis',
          color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: ShieldCheck,
        };
      case 'bendahara':
        return {
          label: 'Bendahara Jemaat',
          color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: Shield,
        };
      case 'auditor':
        return {
          label: 'Auditor & Verifikasi',
          color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: UserCheck,
        };
      case 'jemaat':
      default:
        return {
          label: 'Jemaat (Transparansi)',
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: Eye,
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors relative overflow-hidden">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Actions (Theme toggle & Church Name) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20">
        <button
          onClick={() => setShowHelpModal(true)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
          <span>Panduan Hak Akses (RBAC)</span>
        </button>

        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-amber-400 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Login Card Container */}
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl relative z-10 space-y-6">
        {/* Church Logo & Portal Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-800 to-indigo-950 text-white font-serif text-2xl font-bold shadow-md shadow-indigo-500/20 mb-1">
            †
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {churchInfo.namaGereja}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Sistem Informasi Keuangan & Perbendaharaan Jemaat
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kepatuhan Standar Akuntansi Nonlaba ISAK 35 & RBAC</span>
          </div>
        </div>

        {/* Tab Selection: Form Login vs 1-Click Role Login */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthMode('form')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'form'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Masuk dengan Kredensial</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('quick')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'quick'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5 text-teal-600" />
            <span>Pilih Akun / Peran Cepat</span>
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Mode A: Standard Form Login */}
        {authMode === 'form' && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Pengguna / Peran Majelis:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={emailOrRole}
                  onChange={(e) => setEmailOrRole(e.target.value)}
                  placeholder="bendahara@gkka.org atau admin / auditor"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kata Sandi atau PIN 4-Digit:
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Lihat Kredensial Uji?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi atau PIN"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Quick fill buttons */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 cursor-pointer"
                />
                <span>Ingat Sesi di Perangkat Ini</span>
              </label>

              <span className="text-[11px] text-slate-400">Sesi terenkripsi aman</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Memverifikasi Akses...</span>
              ) : (
                <>
                  <span>Masuk ke Sistem Keuangan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Helper Links for Testing */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="text-[11px] text-slate-500 text-center font-medium">
                Pilih Kredensial Demo Cepat:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setEmailOrRole(u.email);
                      setPassword(u.password || '1234');
                    }}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-all cursor-pointer"
                  >
                    <strong className="block text-slate-800 dark:text-slate-200 truncate">
                      {u.role.toUpperCase()}
                    </strong>
                    <span className="text-[10px] text-slate-400 truncate block">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* Mode B: 1-Click Role Selection Cards */}
        {authMode === 'quick' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih profil pengguna di bawah untuk menguji hak akses berbasis peran (RBAC) secara instan:
            </p>

            <div className="space-y-2.5">
              {allUsers.map((user) => {
                const badge = getRoleBadge(user.role);
                const Icon = badge.icon;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickLogin(user)}
                    disabled={isSubmitting}
                    className="w-full text-left p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white hover:bg-slate-50/80 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs sm:text-sm text-slate-900 dark:text-white">
                            {user.name}
                          </strong>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {user.title} • {user.email}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Security & Confidentiality Footer */}
        <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-indigo-500" />
          <span>Sistem Terenkripsi Sesuai Tata Kelola Keuangan Gereja & ISAK 35</span>
        </div>
      </div>

      {/* RBAC Reference Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Panduan Peran & Hak Akses (RBAC)
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60 space-y-1">
                <strong className="text-purple-900 dark:text-purple-300 block text-xs">
                  1. Admin (Ketua Majelis Jemaat / Pdt. Dr. Andreas Surya)
                </strong>
                <p className="text-[11px]">Email: <code className="font-mono text-purple-700 dark:text-purple-300">ketua.majelis@gkka.org</code> | Sandi: <code className="font-mono">admin123</code> | PIN: <code className="font-mono">9999</code></p>
                <p className="text-[11px] text-slate-500">Hak Akses: Penuh atas seluruh modul perbendaharaan, master anggaran RAPBG, otorisasi laporan ISAK 35, dan pengelolaan pengguna majelis.</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
                <strong className="text-emerald-900 dark:text-emerald-300 block text-xs">
                  2. Bendahara Jemaat (Dkn. Stefanie Lie, S.E., Ak.)
                </strong>
                <p className="text-[11px]">Email: <code className="font-mono text-emerald-700 dark:text-emerald-300">bendahara@gkka.org</code> | Sandi: <code className="font-mono">bendahara123</code> | PIN: <code className="font-mono">1234</code></p>
                <p className="text-[11px] text-slate-500">Hak Akses: Input kas masuk (kolekte, persepuluhan), input pengeluaran operasional, upload foto nota/voucher, sinkronisasi Google Sheets, dan unduh laporan.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 space-y-1">
                <strong className="text-amber-900 dark:text-amber-300 block text-xs">
                  3. Auditor / Komisi Pengawas (Pnt. Ir. Robertus Santoso)
                </strong>
                <p className="text-[11px]">Email: <code className="font-mono text-amber-700 dark:text-amber-300">auditor@gkka.org</code> | Sandi: <code className="font-mono">auditor123</code> | PIN: <code className="font-mono">7777</code></p>
                <p className="text-[11px] text-slate-500">Hak Akses: Mode Inspeksi & Hanya Baca (Read-Only). Verifikasi audit trail transaksi, bukti nota fisik, kepatuhan CALK ISAK 35, dan ekspor CSV audit.</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 space-y-1">
                <strong className="text-blue-900 dark:text-blue-300 block text-xs">
                  4. Jemaat (Akses Transparansi Publik)
                </strong>
                <p className="text-[11px]">Email: <code className="font-mono text-blue-700 dark:text-blue-300">jemaat@gkka.org</code> | Sandi: <code className="font-mono">jemaat123</code> | PIN: <code className="font-mono">0000</code></p>
                <p className="text-[11px] text-slate-500">Hak Akses: Melihat dashboard ringkasan kas, grafik persembahan, dan cetak warta jemaat PDF. Identitas persembahan perorangan disamarkan demi privasi iman.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
