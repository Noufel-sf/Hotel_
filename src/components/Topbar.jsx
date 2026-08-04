import React from 'react';
import { Menu } from 'lucide-react';

export default function Topbar({ title, subtitle, onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur border-b border-ink-900/5 px-5 lg:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-ink-700 hover:text-navy-900 p-1.5 -ml-1.5"
        >
          <Menu size={22} />
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
