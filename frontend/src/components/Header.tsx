import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  RefreshCw,
  Database,
  Undo2,
  LogOut,
  User as UserIcon,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
}) => {
  const {
    activeFilename,
    isDefault,
    summary,
    isLoadingSummary,
    refreshSummary,
    resetToDefault,
  } = useDataset();

  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await logout();
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-800/80 bg-[#0a0f1d]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Title & mobile menu toggle */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-bold text-white font-mono tracking-tight flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Dataset status, actions & User profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Active Dataset Pill */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
          <Database className="w-3.5 h-3.5 text-terminal-accent" />
          <span className="text-slate-400">Dataset:</span>
          <span className="font-semibold text-slate-200 truncate max-w-[120px] md:max-w-[180px]">
            {activeFilename}
          </span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
              isDefault
                ? 'bg-blue-950/60 text-blue-400 border border-blue-800/50'
                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
            }`}
          >
            {isDefault ? 'Default' : 'Uploaded'}
          </span>
          {summary && (
            <span className="text-[11px] text-slate-500 hidden xl:inline">
              ({summary.total_valid_observations} obs)
            </span>
          )}
        </div>

        {/* Reset to Default Button (only shown if not default) */}
        {!isDefault && (
          <button
            onClick={resetToDefault}
            title="Return to default dataset"
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5 text-terminal-accent" />
            <span className="hidden md:inline">Use Default</span>
          </button>
        )}

        {/* Refresh button */}
        <button
          onClick={refreshSummary}
          disabled={isLoadingSummary}
          title="Refresh metrics from backend"
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-terminal-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoadingSummary ? 'animate-spin text-terminal-accent' : ''}`}
          />
        </button>

        {/* User Profile & Sign Out Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            aria-label="User profile menu"
            aria-expanded={profileOpen}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-xs font-bold font-mono text-white shadow-sm shadow-cyan-500/20">
              {userInitial}
            </div>
            {user && (
              <span className="text-xs font-mono font-medium text-slate-200 hidden md:inline truncate max-w-[110px]">
                {user.name}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                profileOpen ? 'rotate-180 text-cyan-400' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn backdrop-blur-xl">
              {/* User details */}
              <div className="px-4 py-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-sm font-bold font-mono text-white">
                    {userInitial}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate font-mono">
                      {user?.name || 'Authenticated User'}
                    </p>
                    <p className="text-xs text-slate-400 truncate font-mono">
                      {user?.email || 'user@terminal.local'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Authenticated Terminal Session</span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-2 pt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-mono text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out of Terminal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
