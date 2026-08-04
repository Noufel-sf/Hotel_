import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
  pageSizeOptions = [5, 10, 20, 50],
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3 text-sm">
      <div className="flex items-center gap-2 text-ink-500">
        <span>
          Showing <span className="font-medium text-ink-900">{start}–{end}</span> of{' '}
          <span className="font-medium text-ink-900">{totalItems}</span>
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="ml-2 border border-ink-900/10 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-2 rounded-lg border border-ink-900/10 text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-900/5 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-3 text-ink-700 font-medium">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="p-2 rounded-lg border border-ink-900/10 text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-900/5 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
