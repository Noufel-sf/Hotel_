import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import Toggle from '../components/Toggle.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import TrackingDrawer from '../components/TrackingDrawer.jsx';
import WhatsAppConfirmModal from '../components/WhatsAppConfirmModal.jsx';
import { SearchInput, SelectFilter, DateRangeFilter } from '../components/FilterControls.jsx';
import { useOrders } from '../context/OrdersContext.jsx';
import { formatDate } from '../utils/format.js';
import { bookingStatusStyles, voucherStatusStyles, whatsappStatusStyles } from '../utils/statusStyles.js';
import { BOOKING_STATUS, VOUCHER_STATUS } from '../data/orders.js';
import { PackageSearch } from 'lucide-react';

export default function OrderTracking() {
  const { orders, toggleAutoSend, sendWhatsApp } = useOrders();

  const [search, setSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('');
  const [voucherFilter, setVoucherFilter] = useState('');
  const [autoSendFilter, setAutoSendFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [whatsAppTarget, setWhatsAppTarget] = useState(null);

  const filtered = useMemo(() => {
    let list = orders;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const fullName = `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase();
        return (
          fullName.includes(q) ||
          o.customer.passport.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.hotelName.toLowerCase().includes(q)
        );
      });
    }
    if (bookingFilter) list = list.filter((o) => o.bookingStatus === bookingFilter);
    if (voucherFilter) list = list.filter((o) => o.voucherStatus === voucherFilter);
    if (autoSendFilter) list = list.filter((o) => (autoSendFilter === 'Enabled' ? o.autoSendVoucher : !o.autoSendVoucher));
    if (dateFrom) list = list.filter((o) => o.createdAt >= dateFrom);
    if (dateTo) list = list.filter((o) => o.createdAt <= dateTo);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, search, bookingFilter, voucherFilter, autoSendFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleConfirmSend = (orderId) => {
    sendWhatsApp(orderId);
    setWhatsAppTarget(null);
  };

  return (
    <Layout title="Order Tracking & Voucher Management" subtitle="Track supplier confirmations and voucher delivery">
      <div className="bg-white rounded-2xl shadow-soft p-4 lg:p-5 mb-5 flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search order, customer, passport, hotel…" />
        <SelectFilter value={bookingFilter} onChange={resetPage(setBookingFilter)} options={Object.values(BOOKING_STATUS)} label="All booking statuses" />
        <SelectFilter value={voucherFilter} onChange={resetPage(setVoucherFilter)} options={Object.values(VOUCHER_STATUS)} label="All voucher statuses" />
        <SelectFilter value={autoSendFilter} onChange={resetPage(setAutoSendFilter)} options={['Enabled', 'Disabled']} label="Auto-send: all" />
        <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={resetPage(setDateFrom)} onToChange={resetPage(setDateTo)} />
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No orders match these filters"
            description="Try a different status, date range, or search term."
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-900/5 text-left">
                  <Th>Order ID</Th>
                  <Th>Customer</Th>
                  <Th>Hotel</Th>
                  <Th>Destination</Th>
                  <Th>Dates</Th>
                  <Th>Availability</Th>
                  <Th>Booking status</Th>
                  <Th>Voucher</Th>
                  <Th>WhatsApp</Th>
                  <Th>Auto-send</Th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-ink-900/5 last:border-0 hover:bg-navy-900/[0.025] transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(o)}
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-navy-900">{o.id}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-ink-900">{o.customer.firstName} {o.customer.lastName}</p>
                      <p className="text-xs text-ink-500">{o.customer.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">{o.hotelName}</td>
                    <td className="px-4 py-3.5 text-ink-700">{o.destination}</td>
                    <td className="px-4 py-3.5 text-ink-700 whitespace-nowrap">{formatDate(o.checkIn)} → {formatDate(o.checkOut)}</td>
                    <td className="px-4 py-3.5 text-ink-700 whitespace-nowrap">{o.availability}</td>
                    <td className="px-4 py-3.5"><Badge className={bookingStatusStyles[o.bookingStatus]}>{o.bookingStatus}</Badge></td>
                    <td className="px-4 py-3.5"><Badge className={voucherStatusStyles[o.voucherStatus]}>{o.voucherStatus}</Badge></td>
                    <td className="px-4 py-3.5"><Badge className={whatsappStatusStyles[o.whatsappStatus]}>{o.whatsappStatus}</Badge></td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <Toggle checked={o.autoSendVoucher} onChange={(v) => toggleAutoSend(o.id, v)} label={`Auto-send for ${o.id}`} />
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
            totalItems={filtered.length}
          />
        </div>
      </div>

      <TrackingDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onSendWhatsApp={(order) => setWhatsAppTarget(order)}
      />
      <WhatsAppConfirmModal
        order={whatsAppTarget}
        onClose={() => setWhatsAppTarget(null)}
        onConfirm={handleConfirmSend}
      />
    </Layout>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide whitespace-nowrap">{children}</th>;
}
