import React from 'react';
import { SearchX } from 'lucide-react';

export default function EmptyState({ icon: Icon = SearchX, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-navy-900/5 flex items-center justify-center mb-4">
        <Icon size={26} className="text-navy-900/40" />
      </div>
      <p className="font-semibold text-ink-900">{title}</p>
      {description && <p className="text-sm text-ink-500 mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
