
export enum BookingStatus {
  PENDING = 'Pendiente',
  APPROVED = 'Aprobada',
  REJECTED = 'Rechazada',
  CANCELLED = 'Cancelada'
}

export enum PaymentStatus {
  PENDING = 'Pendiente',
  PARTIAL = 'Seña',
  FULL = 'Pagado Total'
}

export interface PricingRule {
  dailyPrice: number; 
  weekendMultiplier: number; 
  guestThreshold: number; 
  extraGuestPrice: number;
  specialPriceDates: string[]; // ISO strings of dates that use weekend multiplier
}

export interface PropertyConfig {
  name: string;
  address: string;
  maxCapacity: number;
  description: string;
  rulesAndPolicies: string; 
  aiSystemInstruction: string;
  images: string[];
}

export interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: number;
  startDate: string; 
  endDate: string;   
  totalPrice: number;
  depositAmount?: number; 
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  message?: string;
  createdAt: string;
  isManual?: boolean; 
}

export interface User {
  username: string;
  isAuthenticated: boolean;
}

export interface DayStatus {
  date: string;
  isBlocked: boolean;
  bookingId?: string;
}
