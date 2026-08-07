import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Topbar({ title, subtitle, sidebarOpen, onToggleSidebar }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 container  bg-paper/90 backdrop-blur border-b border-ink-900/5 px-5 lg:px-8 mx-auto  py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-ink-700 hover:text-navy-900 hover:bg-ink-900/5 rounded-lg p-2 transition-colors flex items-center gap-2 text-sm font-medium"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          <span className="hidden md:inline text-xs text-ink-500 font-normal">
            {sidebarOpen ? 'Hide Menu' : 'Show Menu'}
          </span>
        </button>
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-navy-900">{title}</h1>
          {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2.5 pl-4">
        <div className="w-9 h-9 rounded-full bg-navy-900 text-gold-300 flex items-center justify-center font-display text-sm">
          A
        </div>
        <div className="text-sm">
          <p className="font-medium text-ink-900 leading-none">Agency Owner</p>
          <p className="text-ink-500 text-xs mt-0.5">Full access</p>
        </div>
      </div>
    </header>
  );
}
