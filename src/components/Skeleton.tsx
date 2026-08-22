export function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden animate-pulse border border-ink-900/5">
      <div className="p-5 flex flex-col md:flex-row gap-5 items-start">
        <div className="w-full md:w-72 lg:w-80 h-48 md:h-44 bg-ink-900/10 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 space-y-3 w-full">
          <div className="h-5 bg-ink-900/10 rounded w-2/5" />
          <div className="h-3 bg-ink-900/10 rounded w-1/3" />
          <div className="h-3 bg-ink-900/10 rounded w-1/2" />
          <div className="flex gap-2 pt-2">
            <div className="h-5 bg-ink-900/10 rounded-md w-20" />
            <div className="h-5 bg-ink-900/10 rounded-md w-24" />
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-ink-900/5">
            <div className="h-6 bg-ink-900/10 rounded w-32" />
            <div className="h-9 bg-ink-900/10 rounded-lg w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3.5 bg-ink-900/10 rounded w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}
