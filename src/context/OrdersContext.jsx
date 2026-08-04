import React, { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { initialOrders, BOOKING_STATUS, VOUCHER_STATUS, WHATSAPP_STATUS } from '../data/orders.js';
import { useToast } from './ToastContext.jsx';

const OrdersContext = createContext(null);

let orderCounter = 2000;

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useLocalStorage('voyage-ops-orders', initialOrders);
  const { showToast } = useToast();

  const nowStamp = () => new Date().toISOString().slice(0, 10);

  const createOrder = (payload) => {
    const id = `ORD-${orderCounter++}`;
    const newOrder = {
      id,
      createdAt: nowStamp(),
      paymentStatus: 'Unpaid',
      bookingStatus: BOOKING_STATUS.DRAFT,
      voucherStatus: VOUCHER_STATUS.NOT_ISSUED,
      whatsappStatus: WHATSAPP_STATUS.NOT_SENT,
      whatsappSentAt: null,
      autoSendVoucher: true,
      ...payload,
    };
    setOrders((prev) => [newOrder, ...prev]);
    showToast(`Booking ${id} created successfully.`, 'success');
    return newOrder;
  };

  const updateOrder = (orderId, updates) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)));
  };

  const updatePaymentStatus = (orderId, paymentStatus) => {
    updateOrder(orderId, { paymentStatus });
    showToast(`Payment status updated to "${paymentStatus}" for ${orderId}.`, 'success');
  };

  const updateBookingStatus = (orderId, bookingStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        let updated = { ...o, bookingStatus };
        if (bookingStatus === BOOKING_STATUS.VOUCHER_RECEIVED) {
          updated.voucherStatus = VOUCHER_STATUS.ISSUED;
          if (o.autoSendVoucher) {
            updated.whatsappStatus = WHATSAPP_STATUS.SENT;
            updated.whatsappSentAt = new Date().toISOString();
          }
        }
        return updated;
      })
    );
    showToast(`Booking status updated to "${bookingStatus}" for ${orderId}.`, 'success');

    const order = orders.find((o) => o.id === orderId);
    if (bookingStatus === BOOKING_STATUS.VOUCHER_RECEIVED && order?.autoSendVoucher) {
      setTimeout(() => {
        showToast(`Voucher for ${orderId} sent automatically via WhatsApp.`, 'success');
      }, 350);
    }
  };

  const toggleAutoSend = (orderId, value) => {
    updateOrder(orderId, { autoSendVoucher: value });
    showToast(`Auto-send voucher ${value ? 'enabled' : 'disabled'} for ${orderId}.`, 'info');
  };

  const sendWhatsApp = (orderId) => {
    const timestamp = new Date().toISOString();
    updateOrder(orderId, { whatsappStatus: WHATSAPP_STATUS.SENT, whatsappSentAt: timestamp });
    showToast(`Voucher sent to customer via WhatsApp for ${orderId}.`, 'success');
  };

  const getOrderById = (orderId) => orders.find((o) => o.id === orderId);

  const value = useMemo(
    () => ({
      orders,
      createOrder,
      updatePaymentStatus,
      updateBookingStatus,
      toggleAutoSend,
      sendWhatsApp,
      getOrderById,
    }),
    [orders]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
