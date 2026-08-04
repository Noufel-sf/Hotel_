import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import OrderDetailDrawer from '../components/OrderDetailDrawer.jsx';
import { SearchInput, SelectFilter, DateRangeFilter } from '../components/FilterControls.jsx';
import { useOrders } from '../context/OrdersContext.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';
import { paymentStatusStyles } from '../utils/statusStyles.js';
import { PAYMENT_STATUS } from '../data/orders.js';
import { ClipboardX, ArrowUpDown } from 'lucide-react';

const destinations = (orders) => [...new Set(orders.map((o) => o.destination))].sort();

export default function BookingRecords() {
  const { orders } = useOrders();

  const [search, setSearch] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filtered = useMemo(() => {
    let list = orders;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const fullName = `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase();
        return (
          fullName.includes(q) ||
          o.customer.firstName.toLowerCase().includes(q) ||
          o.customer.lastName.toLowerCase().includes(q) ||
          o.customer.passport.toLowerCase().includes(q) ||
          o.customer.phone.toLowerCase().includes(q)
        );
      });
    }
    if (destinationFilter) list = list.filter((o) => o.destination === destinationFilter);
    if (paymentFilter) list = list.filter((o) => o.paymentStatus === paymentFilter);
    if (dateFrom) list = list.filter((o) => o.createdAt >= dateFrom);
    if (dateTo) list = list.filter((o) => o.createdAt <= dateTo);

    list = [...list].sort((a, b) => {
      const getValue = (o) => {
        if (sortField === 'customer') return `${o.customer.firstName} ${o.customer.lastName}`;
        return o[sortField];
      };
      const av = getValue(a);
      const bv = getValue(b);
      if (sortField === 'totalPrice') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return list;
  }, [orders, search, destinationFilter, paymentFilter, dateFrom, dateTo, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <Layout title="Booking Records" subtitle="Search and review every trip booked for your customers">
      <div className="bg-white rounded-2xl shadow-soft p-4 lg:p-5 mb-5 flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search name, passport, or phone…" />
        <SelectFilter value={destinationFilter} onChange={resetPage(setDestinationFilter)} options={destinations(orders)} label="All destinations" />
        <SelectFilter value={paymentFilter} onChange={resetPage(setPaymentFilter)} options={Object.values(PAYMENT_STATUS)} label="All payment statuses" />
        <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={resetPage(setDateFrom)} onToChange={resetPage(setDateTo)} />
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState
            icon={ClipboardX}
            title="No bookings found"
            description="Adjust your search or filters to find the trip you're looking for."
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-900/5 text-left">
                  <Th>Order ID</Th>
                  <SortableTh label="Customer" field="customer" active={sortField === 'customer'} dir={sortDir} onClick={() => toggleSort('customer')} />
                  <Th>Passport</Th>
                  <Th>Phone</Th>
                  <Th>Hotel</Th>
                  <Th>Destination</Th>
                  <Th>Dates</Th>
                  <Th>Rooms</Th>
                  <SortableTh label="Total" field="totalPrice" active={sortField === 'totalPrice'} dir={sortDir} onClick={() => toggleSort('totalPrice')} />
                  <SortableTh label="Created" field="createdAt" active={sortField === 'createdAt'} dir={sortDir} onClick={() => toggleSort('createdAt')} />
                  <Th>Payment</Th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="border-b border-ink-900/5 last:border-0 hover:bg-navy-900/[0.025] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-navy-900">{o.id}</td>
                    <td className="px-4 py-3.5 font-medium text-ink-900">{o.customer.firstName} {o.customer.lastName}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-ink-700">{o.customer.passport}</td>
                    <td className="px-4 py-3.5 text-ink-700 whitespace-nowrap">{o.customer.phone}</td>
                    <td className="px-4 py-3.5 text-ink-700">{o.hotelName}</td>
                    <td className="px-4 py-3.5 text-ink-700">{o.destination}</td>
                    <td className="px-4 py-3.5 text-ink-700 whitespace-nowrap">{formatDate(o.checkIn)} → {formatDate(o.checkOut)}</td>
                    <td className="px-4 py-3.5 text-ink-700">{o.roomCount}</td>
                    <td className="px-4 py-3.5 font-semibold text-navy-900 whitespace-nowrap">{formatCurrency(o.totalPrice, o.currency)}</td>
                    <td className="px-4 py-3.5 text-ink-700 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <Badge className={paymentStatusStyles[o.paymentStatus]}>{o.paymentStatus}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
            totalItems={filtered.length}
          />
        </div>
      </div>

      <OrderDetailDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </Layout>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide whitespace-nowrap">{children}</th>;
}

function SortableTh({ label, field, active, dir, onClick }) {
  return (
    <th className="px-4 py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide whitespace-nowrap">
      <button onClick={onClick} className={`flex items-center gap-1 hover:text-navy-900 transition-colors ${active ? 'text-navy-900' : ''}`}>
        {label} <ArrowUpDown size={12} className={active ? 'text-gold-500' : ''} />
      </button>
    </th>
  );
}
