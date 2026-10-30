import React from 'react';
import { UserProfile, ChurchInfo, SheetsSyncState } from '../types/finance';
import {
  Church,
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Printer,
  FileSpreadsheet,
  Lock,
  User,
  RefreshCw,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: UserProfile;
  churchInfo: ChurchInfo;
  onOpenRoleModal: () => void;
  syncState: SheetsSyncState;
  onOpenSyncModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  churchInfo,
  onOpenRoleModal,
  syncState,
  onOpenSyncModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Kas', icon: LayoutDashboard },
    { id: 'income', label: 'Pemasukan', icon: ArrowDownLeft, badge: 'Kolekte' },
    { id: 'expense', label: 'Pengeluaran', icon: ArrowUpRight, badge: 'Nota' },
    { id: 'isak35', label: 'Laporan ISAK 35', icon: ShieldCheck },
    { id: 'print', label: 'Cetak Warta PDF', icon: Printer },
    { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet },
  ];

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'bendahara':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'auditor':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Church Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-900 text-white flex items-center justify-center font-serif text-xl font-bold shadow-xs">
              †
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {churchInfo.namaGereja}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  ISAK 35
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                Sistem Keuangan & Transparansi Jemaat
              </p>
            </div>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Google Sheets Sync Indicator button */}
            <button
              onClick={onOpenSyncModal}
              title="Status Google Spreadsheet"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                syncState.spreadsheetId
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{syncState.spreadsheetId ? 'Sheet Aktif' : 'Sambungkan Sheet'}</span>
              {syncState.isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />}
            </button>

            {/* Role Button */}
            <button
              onClick={onOpenRoleModal}
              className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500">{currentUser.title}</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(
                  currentUser.role
                )}`}
              >
                {currentUser.role}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
