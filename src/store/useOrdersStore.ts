import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initialOrders, BOOKING_STATUS, VOUCHER_STATUS, WHATSAPP_STATUS } from '../data/orders';
import { useToastStore } from './useToastStore';
import { Order, BookingStatus, PaymentStatus } from '../types';

let orderCounter = 2000;

interface OrdersState {
  orders: Order[];
  createOrder: (payload: Partial<Order>) => Order;
  updatePaymentStatus: (orderId: string, paymentStatus: PaymentStatus) => void;
  updateBookingStatus: (orderId: string, bookingStatus: BookingStatus) => void;
  toggleAutoSend: (orderId: string, value: boolean) => void;
  sendWhatsApp: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
}

const nowStamp = () => new Date().toISOString().slice(0, 10);

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: initialOrders,

      createOrder: (payload: Partial<Order>) => {
        const id = `ORD-${orderCounter++}`;
        const newOrder: Order = {
          id,
          createdAt: nowStamp(),
          paymentStatus: 'Unpaid',
          bookingStatus: BOOKING_STATUS.DRAFT,
          voucherStatus: VOUCHER_STATUS.NOT_ISSUED,
          whatsappStatus: WHATSAPP_STATUS.NOT_SENT,
          whatsappSentAt: null,
          autoSendVoucher: true,
          hotelId: '',
          hotelName: '',
          destination: '',
          hotelImage: '',
          availability: 'Available Directly',
          mealPlan: 'Breakfast',
          sharedPool: false,
          minStay: 1,
          notes: '',
          rooms: [],
          roomCount: 1,
          checkIn: nowStamp(),
          checkOut: nowStamp(),
          customer: { firstName: '', lastName: '', passport: '', phone: '', email: '', nationality: '' },
          totalPrice: 0,
          currency: 'USD',
          ...payload,
        };

        set((state) => ({
          orders: [newOrder, ...state.orders],
        }));

        useToastStore.getState().showToast(`Booking ${id} created successfully.`, 'success');
        return newOrder;
      },

      updatePaymentStatus: (orderId: string, paymentStatus: PaymentStatus) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o)),
        }));
        useToastStore.getState().showToast(`Payment status updated to "${paymentStatus}" for ${orderId}.`, 'success');
      },

      updateBookingStatus: (orderId: string, bookingStatus: BookingStatus) => {
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;
            let updated: Order = { ...o, bookingStatus };
            if (bookingStatus === BOOKING_STATUS.VOUCHER_RECEIVED) {
              updated.voucherStatus = VOUCHER_STATUS.ISSUED;
              if (o.autoSendVoucher) {
                updated.whatsappStatus = WHATSAPP_STATUS.SENT;
                updated.whatsappSentAt = new Date().toISOString();
              }
            }
            return updated;
          }),
        }));

        useToastStore.getState().showToast(`Booking status updated to "${bookingStatus}" for ${orderId}.`, 'success');

        const order = get().orders.find((o) => o.id === orderId);
        if (bookingStatus === BOOKING_STATUS.VOUCHER_RECEIVED && order?.autoSendVoucher) {
          setTimeout(() => {
            useToastStore.getState().showToast(`Voucher for ${orderId} sent automatically via WhatsApp.`, 'success');
          }, 350);
        }
      },

      toggleAutoSend: (orderId: string, value: boolean) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, autoSendVoucher: value } : o)),
        }));
        useToastStore.getState().showToast(`Auto-send voucher ${value ? 'enabled' : 'disabled'} for ${orderId}.`, 'info');
      },

      sendWhatsApp: (orderId: string) => {
        const timestamp = new Date().toISOString();
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, whatsappStatus: WHATSAPP_STATUS.SENT, whatsappSentAt: timestamp }
              : o
          ),
        }));
        useToastStore.getState().showToast(`Voucher sent to customer via WhatsApp for ${orderId}.`, 'success');
      },

      getOrderById: (orderId: string) => {
        return get().orders.find((o) => o.id === orderId);
      },
    }),
    {
      name: 'voyage-ops-orders',
    }
  )
);
