export function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden animate-pulse">
      <div className="h-44 bg-ink-900/10" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-ink-900/10 rounded w-2/3" />
        <div className="h-3 bg-ink-900/10 rounded w-1/2" />
        <div className="h-3 bg-ink-900/10 rounded w-full" />
        <div className="h-3 bg-ink-900/10 rounded w-4/5" />
        <div className="h-9 bg-ink-900/10 rounded-lg w-full mt-4" />
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
