import { hotels } from './hotels';
import { Order, Customer, BookingStatus, PaymentStatus, VoucherStatus, WhatsAppStatus } from '../types';

export const PAYMENT_STATUS: Record<string, PaymentStatus> = {
  PAID: 'Paid',
  UNPAID: 'Unpaid',
  PARTIAL: 'Partially Paid',
};

export const BOOKING_STATUS: Record<string, BookingStatus> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  WAITING: 'Waiting for Confirmation',
  CONFIRMED: 'Confirmed',
  VOUCHER_RECEIVED: 'Voucher Received',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export const VOUCHER_STATUS: Record<string, VoucherStatus> = {
  NOT_ISSUED: 'Not Issued',
  ISSUED: 'Issued',
};

export const WHATSAPP_STATUS: Record<string, WhatsAppStatus> = {
  NOT_SENT: 'Not Sent',
  SENT: 'Sent',
};

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}
const rand = seededRandom(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number): number => Math.floor(rand() * (max - min + 1)) + min;

const firstNames = [
  'James', 'Maria', 'Ahmed', 'Sophie', 'Liam', 'Fatima', 'Carlos', 'Elena',
  'Yuki', 'Daniel', 'Priya', 'Marco', 'Chloe', 'Omar', 'Nina', 'Lucas',
  'Amara', 'Tomas', 'Grace', 'Hassan',
];
const lastNames = [
  'Whitfield', 'Santos', 'Al-Farsi', 'Bernard', 'O\'Connor', 'Haddad', 'Ruiz',
  'Kowalski', 'Tanaka', 'Reyes', 'Sharma', 'Rossi', 'Dubois', 'Youssef',
  'Petrov', 'Bennett', 'Okafor', 'Novak', 'Murphy', 'Malik',
];
const nationalities = [
  'British', 'Spanish', 'Emirati', 'French', 'Irish', 'Egyptian', 'Mexican',
  'Polish', 'Japanese', 'Filipino', 'Indian', 'Italian', 'Belgian', 'Jordanian',
  'Russian', 'American', 'Nigerian', 'Czech', 'Australian', 'Pakistani',
];
const countryCodes = ['+44', '+34', '+971', '+33', '+353', '+20', '+52', '+48', '+81', '+91'];

const repeatCustomers: Customer[] = [
  { firstName: 'James', lastName: 'Whitfield', passport: 'P4471829', phone: '+44 7911 223344', email: 'james.whitfield@mail.com', nationality: 'British' },
  { firstName: 'Priya', lastName: 'Sharma', passport: 'K8827345', phone: '+91 98200 11234', email: 'priya.sharma@mail.com', nationality: 'Indian' },
  { firstName: 'Marco', lastName: 'Rossi', passport: 'YA553219', phone: '+39 340 998 2211', email: 'marco.rossi@mail.com', nationality: 'Italian' },
];

function randomCustomer(i: number): Customer {
  if (i % 6 === 0) return repeatCustomers[0];
  if (i % 9 === 0) return repeatCustomers[1];
  if (i % 13 === 0) return repeatCustomers[2];
  const firstName = pick(firstNames);
  const lastName = pick(lastNames);
  return {
    firstName,
    lastName,
    passport: `${pick(['A', 'B', 'C', 'D', 'E'])}${between(1000000, 9999999)}`,
    phone: `${pick(countryCodes)} ${between(600, 799)} ${between(100, 999)} ${between(100, 999)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}@mail.com`,
    nationality: pick(nationalities),
  };
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const bookingStatusPool: BookingStatus[] = [
  BOOKING_STATUS.DRAFT,
  BOOKING_STATUS.SUBMITTED,
  BOOKING_STATUS.WAITING,
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.VOUCHER_RECEIVED,
  BOOKING_STATUS.VOUCHER_RECEIVED,
  BOOKING_STATUS.REJECTED,
  BOOKING_STATUS.CANCELLED,
];

const paymentStatusPool: PaymentStatus[] = [
  PAYMENT_STATUS.PAID,
  PAYMENT_STATUS.UNPAID,
  PAYMENT_STATUS.PARTIAL,
];

function buildOrder(index: number): Order {
  const hotel = hotels.length > 0 ? hotels[index % hotels.length] : {
    id: `HTL-00${(index % 5) + 1}`,
    name: 'Sample Reserved Hotel',
    destination: 'Hammamet, Tunisia',
    stars: 4,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    availability: 'Available Directly',
    mealPlan: 'Breakfast',
    sharedPool: true,
    minStay: 2,
    notes: 'Standard booking terms apply.',
    price: 250,
    currency: 'TND',
    description: 'Sample description',
    offerInfo: 'Sample offer info',
  };
  const customer = randomCustomer(index);
  const rooms = between(1, 3);
  const createdAt = addDays('2026-05-01', index * 2 + between(0, 2));
  const checkIn = addDays(createdAt, between(10, 60));
  const checkOut = addDays(checkIn, hotel.minStay + between(0, 4));
  const nights = Math.max(1, (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
  const totalPrice = Math.round(hotel.price * rooms * (nights / Math.max(hotel.minStay, 1)) * 0.6 + hotel.price * rooms);

  const bookingStatus = pick(bookingStatusPool);
  const voucherStatus: VoucherStatus = bookingStatus === BOOKING_STATUS.VOUCHER_RECEIVED ? VOUCHER_STATUS.ISSUED : VOUCHER_STATUS.NOT_ISSUED;
  const autoSend = index % 3 !== 0;
  const whatsappSent = voucherStatus === VOUCHER_STATUS.ISSUED && autoSend && index % 2 === 0;

  return {
    id: `ORD-${String(1000 + index)}`,
    hotelId: hotel.id,
    hotelName: hotel.name,
    destination: hotel.destination,
    hotelImage: hotel.image,
    availability: hotel.availability,
    mealPlan: hotel.mealPlan,
    sharedPool: hotel.sharedPool,
    minStay: hotel.minStay,
    notes: hotel.notes,
    rooms: Array.from({ length: rooms }, () => ({
      adults: between(1, 2),
      children: index % 5 === 0 ? between(1, 2) : 0,
    })),
    roomCount: rooms,
    checkIn,
    checkOut,
    createdAt,
    customer,
    totalPrice,
    currency: hotel.currency,
    paymentStatus: pick(paymentStatusPool),
    bookingStatus,
    voucherStatus,
    autoSendVoucher: autoSend,
    whatsappStatus: whatsappSent ? WHATSAPP_STATUS.SENT : WHATSAPP_STATUS.NOT_SENT,
    whatsappSentAt: whatsappSent ? addDays(createdAt, between(1, 5)) : null,
    travelInfo: index % 4 === 0 ? 'Requires wheelchair-accessible room.' : index % 7 === 0 ? 'Celebrating wedding anniversary — requested late checkout.' : '',
  };
}

export const initialOrders: Order[] = Array.from({ length: 44 }, (_, i) => buildOrder(i));
