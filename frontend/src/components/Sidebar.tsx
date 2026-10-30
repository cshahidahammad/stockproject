import React from 'react';
import {
  LayoutDashboard,
  TableProperties,
  TrendingUp,
  LineChart,
  UploadCloud,
  Info,
  Layers,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'analysis'
  | 'prediction'
  | 'charts'
  | 'upload'
  | 'about';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analysis' as PageId, label: 'Stock Analysis', icon: TableProperties },
  { id: 'prediction' as PageId, label: 'Trend Prediction', icon: TrendingUp },
  { id: 'charts' as PageId, label: 'Charts Explorer', icon: LineChart },
  { id: 'upload' as PageId, label: 'Data Upload', icon: UploadCloud },
  { id: 'about' as PageId, label: 'About Project', icon: Info },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Terminal Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-terminal-accent/10 border border-terminal-accent/30 text-terminal-accent">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white font-mono">
                TREND.TERMINAL
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                ML PREDICTION SUITE
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Workspace Views
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectPage(item.id);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800/90 text-terminal-accent border border-slate-700/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-terminal-accent' : 'text-slate-400'
                  }`}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-terminal-accent animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* System Status info badge */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>FastAPI ML Engine: Active</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Logistic Regression • 80/20 Holdout
          </div>
        </div>
      </aside>
    </>
  );
};
