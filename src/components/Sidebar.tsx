import { NavLink } from 'react-router-dom';
import { Compass, ClipboardList, SendHorizontal, PlaneTakeoff, X } from 'lucide-react';

const links = [
  { to: '/', label: 'Hotel Search', icon: Compass, end: true },
  { to: '/bookings', label: 'Booking Records', icon: ClipboardList },
  { to: '/tracking', label: 'Order Tracking', icon: SendHorizontal },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-navy-950/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-navy-900 text-white flex flex-col transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gold-400 flex items-center justify-center">
              <PlaneTakeoff size={18} className="text-navy-900" />
            </div>
            <div>
              <p className="font-display text-lg leading-none text-white">Voyage Ops</p>
              <p className="text-[11px] text-white/50 tracking-wide mt-1">Agency Console</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white" aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-5 border-t border-white/10">
          <p className="text-xs text-white/40 leading-relaxed">
            Internal tool for agency operations. Single-owner access, no external accounts.
          </p>
        </div>
      </aside>
    </>
  );
}
