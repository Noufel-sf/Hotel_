import { Search, ChevronDown } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-gold-400 transition-shadow"
      />
    </div>
  );
}

interface SelectFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}

export function SelectFilter({ value, onChange, options, label }: SelectFilterProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-gold-400 cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
    </div>
  );
}

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
}

export function DateRangeFilter({ from, to, onFromChange, onToChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="py-2.5 px-2.5 rounded-lg border border-ink-900/10 bg-white text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-gold-400"
        aria-label="From date"
      />
      <span className="text-ink-300 text-sm">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="py-2.5 px-2.5 rounded-lg border border-ink-900/10 bg-white text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-gold-400"
        aria-label="To date"
      />
    </div>
  );
}

interface SortButtonProps {
  label: string;
  active: boolean;
  direction?: 'asc' | 'desc';
  onClick: () => void;
}

export function SortButton({ label, active, direction, onClick }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
        active
          ? 'border-navy-900 bg-navy-900 text-white'
          : 'border-ink-900/10 bg-white text-ink-700 hover:bg-ink-900/5'
      }`}
    >
      {label} {active && (direction === 'asc' ? '↑' : '↓')}
    </button>
  );
}
