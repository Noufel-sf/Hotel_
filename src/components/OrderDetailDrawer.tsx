import Drawer from './Drawer';
import Badge from './Badge';
import { formatCurrency, formatDate, nightsBetween, totalGuests } from '../utils/format';
import { bookingStatusStyles, availabilityStyles } from '../utils/statusStyles';
import { PAYMENT_STATUS } from '../data/orders';
import { useOrdersStore } from '../store/useOrdersStore';
import { Mail, Phone, Globe2, IdCard } from 'lucide-react';
import { Order, PaymentStatus } from '../types';

interface OrderDetailDrawerProps {
  order: Order | null;
  onClose: () => void;
}

export default function OrderDetailDrawer({ order, onClose }: OrderDetailDrawerProps) {
  const updatePaymentStatus = useOrdersStore((state) => state.updatePaymentStatus);
  if (!order) return null;

  const nights = nightsBetween(order.checkIn, order.checkOut);
  const guests = totalGuests(order.rooms || []);

  return (
    <Drawer open={!!order} onClose={onClose} title={`Booking ${order.id}`}>
      <div className="space-y-6">
        <div className="ticket-stub text-white p-5">
          <p className="text-white/60 text-xs uppercase tracking-widest">{order.destination}</p>
          <h3 className="font-display text-xl mt-1">{order.hotelName}</h3>
          <div className="ticket-perforation my-4" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/50 text-xs">Check-in</p>
              <p className="font-medium">{formatDate(order.checkIn)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Check-out</p>
              <p className="font-medium">{formatDate(order.checkOut)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Rooms / Guests</p>
              <p className="font-medium">{order.roomCount} rooms · {guests} guests · {nights} nights</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Total price</p>
              <p className="font-display text-lg text-gold-300">{formatCurrency(order.totalPrice, order.currency)}</p>
            </div>
          </div>
        </div>

        <section>
          <h4 className="text-sm font-semibold text-navy-900 mb-2.5">Customer</h4>
          <div className="bg-navy-900/[0.03] rounded-xl p-4 space-y-2 text-sm">
            <p className="font-semibold text-ink-900">{order.customer.firstName} {order.customer.lastName}</p>
            <p className="flex items-center gap-2 text-ink-700"><IdCard size={14} className="text-ink-400" /> {order.customer.passport}</p>
            <p className="flex items-center gap-2 text-ink-700"><Phone size={14} className="text-ink-400" /> {order.customer.phone}</p>
            <p className="flex items-center gap-2 text-ink-700"><Mail size={14} className="text-ink-400" /> {order.customer.email}</p>
            <p className="flex items-center gap-2 text-ink-700"><Globe2 size={14} className="text-ink-400" /> {order.customer.nationality}</p>
            {order.travelInfo && <p className="text-ink-500 pt-1 border-t border-ink-900/5 mt-2">{order.travelInfo}</p>}
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-navy-900 mb-2.5">Offer conditions</h4>
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            <InfoTile label="Availability" value={order.availability} />
            <InfoTile label="Meal plan" value={order.mealPlan} />
            <InfoTile label="Shared pool" value={order.sharedPool ? 'Included' : 'Not included'} />
            <InfoTile label="Minimum stay" value={`${order.minStay} nights`} />
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-navy-900 mb-2.5">Status</h4>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className={bookingStatusStyles[order.bookingStatus]}>{order.bookingStatus}</Badge>
            <Badge className={availabilityStyles[order.availability]}>{order.availability}</Badge>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-ink-700 mb-1.5 block">Payment status</span>
            <select
              value={order.paymentStatus}
              onChange={(e) => updatePaymentStatus(order.id, e.target.value as PaymentStatus)}
              className="w-full px-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              {Object.values(PAYMENT_STATUS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </section>

        <p className="text-xs text-ink-400 pt-2 border-t border-ink-900/5">
          Order created {formatDate(order.createdAt)}
        </p>
      </div>
    </Drawer>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-navy-900/[0.03] rounded-lg px-3 py-2.5">
      <p className="text-[11px] text-ink-500">{label}</p>
      <p className="font-medium text-ink-900 mt-0.5">{value}</p>
    </div>
  );
}
