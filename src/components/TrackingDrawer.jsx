import React from 'react';
import Drawer from './Drawer.jsx';
import Badge from './Badge.jsx';
import Toggle from './Toggle.jsx';
import { formatDate, formatDateTime, formatCurrency } from '../utils/format.js';
import { bookingStatusStyles, voucherStatusStyles, whatsappStatusStyles, availabilityStyles } from '../utils/statusStyles.js';
import { BOOKING_STATUS } from '../data/orders.js';
import { useOrders } from '../context/OrdersContext.jsx';
import { MessageCircle, IdCard, Phone } from 'lucide-react';

export default function TrackingDrawer({ order, onClose, onSendWhatsApp }) {
  const { updateBookingStatus, toggleAutoSend } = useOrders();
  if (!order) return null;

  return (
    <Drawer open={!!order} onClose={onClose} title={`Tracking ${order.id}`}>
      <div className="space-y-6">
        <div className="ticket-stub text-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest">{order.destination}</p>
              <h3 className="font-display text-xl mt-1">{order.hotelName}</h3>
            </div>
            <Badge className={availabilityStyles[order.availability] + ' border-white/20 !bg-white/10 !text-white'}>
              {order.availability}
            </Badge>
          </div>
          <div className="ticket-perforation my-4" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/50 text-xs">Booking dates</p>
              <p className="font-medium">{formatDate(order.checkIn)} → {formatDate(order.checkOut)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Created</p>
              <p className="font-medium">{formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>

        <section>
          <h4 className="text-sm font-semibold text-navy-900 mb-2.5">Customer</h4>
          <div className="bg-navy-900/[0.03] rounded-xl p-4 space-y-2 text-sm">
            <p className="font-semibold text-ink-900">{order.customer.firstName} {order.customer.lastName}</p>
            <p className="flex items-center gap-2 text-ink-700"><IdCard size={14} className="text-ink-400" /> {order.customer.passport}</p>
            <p className="flex items-center gap-2 text-ink-700"><Phone size={14} className="text-ink-400" /> {order.customer.phone}</p>
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-navy-900 mb-2.5">Booking status</h4>
          <select
            value={order.bookingStatus}
            onChange={(e) => updateBookingStatus(order.id, e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            {Object.values(BOOKING_STATUS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <p className="text-xs text-ink-500 mt-2">
            Setting status to "Voucher Received" issues the voucher automatically, and — if auto-send is enabled — sends it via WhatsApp right away.
          </p>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-navy-900 mb-2.5">Voucher</h4>
          <div className="flex items-center justify-between bg-navy-900/[0.03] rounded-xl px-4 py-3">
            <span className="text-sm text-ink-700">Voucher status</span>
            <Badge className={voucherStatusStyles[order.voucherStatus]}>{order.voucherStatus}</Badge>
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-navy-900 mb-2.5">Auto-send voucher</h4>
          <div className="flex items-center justify-between bg-navy-900/[0.03] rounded-xl px-4 py-3">
            <span className="text-sm text-ink-700">
              Automatically send via WhatsApp once the voucher is received
            </span>
            <Toggle
              checked={order.autoSendVoucher}
              onChange={(v) => toggleAutoSend(order.id, v)}
              label="Auto-send voucher"
            />
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-navy-900 mb-2.5">WhatsApp delivery</h4>
          <div className="bg-navy-900/[0.03] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-700">Delivery status</span>
              <Badge className={whatsappStatusStyles[order.whatsappStatus]}>{order.whatsappStatus}</Badge>
            </div>
            {order.whatsappSentAt && (
              <p className="text-xs text-ink-500">Sent {formatDateTime(order.whatsappSentAt)}</p>
            )}
            <button
              onClick={() => onSendWhatsApp(order)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle size={16} /> Send via WhatsApp
            </button>
          </div>
        </section>
      </div>
    </Drawer>
  );
}
