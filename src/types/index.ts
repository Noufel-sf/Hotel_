export type MealPlan = 'No meals' | 'Breakfast' | 'Breakfast + Lunch' | 'Full board' | string;
export type Availability = 'Available Directly' | 'On Request' | string;

export interface Hotel {
  id: string;
  name: string;
  destination: string;
  stars: number;
  price: number;
  currency: string;
  image: string;
  description: string;
  offerInfo: string;
  availability: Availability;
  disponible?: boolean;
  surDemande?: boolean;
  chambreDisponible?: string | number;
  rembourssable?: boolean;
  source?: string;
  mealPlan: MealPlan;
  sharedPool: boolean;
  minStay: number;
  notes: string;
  roomType?: string;
  cancellationPolicy?: string;
  hasFreeCancellation?: boolean;
  isPromo?: boolean;
  freeChild?: boolean;
  etiquettes?: string[];
  services?: string[];
  raw?: any;
}

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partially Paid';
export type BookingStatus =
  | 'Draft'
  | 'Submitted'
  | 'Waiting for Confirmation'
  | 'Confirmed'
  | 'Voucher Received'
  | 'Rejected'
  | 'Cancelled';
export type VoucherStatus = 'Not Issued' | 'Issued';
export type WhatsAppStatus = 'Not Sent' | 'Sent';

export interface Customer {
  firstName: string;
  lastName: string;
  passport: string;
  phone: string;
  email: string;
  nationality: string;
}

export interface RoomOccupancy {
  adults: number;
  children: number;
  childAges?: number[];
}

export interface Order {
  id: string;
  hotelId: string;
  hotelName: string;
  destination: string;
  hotelImage: string;
  availability: Availability;
  mealPlan: MealPlan;
  sharedPool: boolean;
  minStay: number;
  notes: string;
  rooms: RoomOccupancy[];
  roomCount: number;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  customer: Customer;
  totalPrice: number;
  currency: string;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  voucherStatus: VoucherStatus;
  autoSendVoucher: boolean;
  whatsappStatus: WhatsAppStatus;
  whatsappSentAt: string | null;
  travelInfo?: string;
}

export interface FilterState {
  search: string;
  bookingStatus: string;
  paymentStatus: string;
  voucherStatus: string;
  whatsappStatus: string;
  dateFrom: string;
  dateTo: string;
}

export interface AdvancedFilterState {
  search: string;
  promosOnly: boolean;
  freeChildOnly: boolean;
  availableOnly: boolean;
  freeCancellationOnly: boolean;
  arrangements: string[];
  categories: number[];
  minPrice: number;
  maxPrice: number;
  roomTypes: string[];
  services: string[];
  sortDir: 'asc' | 'desc';
}

export interface HotelFilterState {
  search: string;
  mealPlan: string;
  availability: string;
  minStars: number;
  maxPrice: number;
  sharedPoolOnly: boolean;
}

export interface CityOption {
  id: number | string;
  name: string;
  destination: string;
  region?: string;
  country?: string;
}

export interface RoomConfig {
  id: number;
  adults: number;
  children: number;
  childAges: number[];
}

export interface SearchDetailsParams {
  checkIn?: string;
  checkOut?: string;
  nationality?: string;
  residence?: string;
  city?: string;
  cityName?: string;
  rooms?: Array<{ adults?: number; Adult?: string | number; children?: number; childAges?: Array<number | string>; Child?: string[] }>;
  groupingHotel?: boolean;
  product?: string;
  combinationRooms?: boolean;
  boardingByRooms?: boolean;
  source?: string;
  page?: number;
  sessionId?: string;
  filters?: AdvancedFilterState;
}

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, patches: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  resetOrders: () => void;
}
