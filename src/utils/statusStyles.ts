import { PAYMENT_STATUS, BOOKING_STATUS, VOUCHER_STATUS, WHATSAPP_STATUS } from '../data/orders.js';

export const paymentStatusStyles: Record<string, string> = {
  [PAYMENT_STATUS.PAID]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [PAYMENT_STATUS.UNPAID]: 'bg-rose-50 text-rose-700 border-rose-200',
  [PAYMENT_STATUS.PARTIAL]: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const bookingStatusStyles: Record<string, string> = {
  [BOOKING_STATUS.DRAFT]: 'bg-gray-100 text-ink-700 border-ink-300',
  [BOOKING_STATUS.SUBMITTED]: 'bg-blue-50 text-blue-700 border-blue-200',
  [BOOKING_STATUS.WAITING]: 'bg-amber-50 text-amber-700 border-amber-200',
  [BOOKING_STATUS.CONFIRMED]: 'bg-sky-50 text-sky-700 border-sky-200',
  [BOOKING_STATUS.VOUCHER_RECEIVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [BOOKING_STATUS.REJECTED]: 'bg-rose-50 text-rose-700 border-rose-200',
  [BOOKING_STATUS.CANCELLED]: 'bg-gray-100 text-gray-500 border-gray-200',
};

export const voucherStatusStyles: Record<string, string> = {
  [VOUCHER_STATUS.ISSUED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [VOUCHER_STATUS.NOT_ISSUED]: 'bg-gray-100 text-gray-500 border-gray-200',
};

export const whatsappStatusStyles: Record<string, string> = {
  [WHATSAPP_STATUS.SENT]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [WHATSAPP_STATUS.NOT_SENT]: 'bg-gray-100 text-gray-500 border-gray-200',
};

export const availabilityStyles: Record<string, string> = {
  'Available Directly': 'bg-sky-50 text-sky-700 border-sky-200',
  'On Request': 'bg-amber-50 text-amber-700 border-amber-200',
};
