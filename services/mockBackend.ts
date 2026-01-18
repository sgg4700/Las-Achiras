import { Booking, BookingStatus, DayStatus, PricingRule, PropertyConfig, PaymentStatus } from '../types';
import { INITIAL_PRICING, INITIAL_PROPERTY_CONFIG } from '../constants';

const KEYS = {
  BOOKINGS: 'qf_bookings',
  CONFIG: 'qf_config',
  PRICING: 'qf_pricing',
  BLOCKED_DATES: 'qf_blocked_dates'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MockBackend = {
  getConfig: async (): Promise<PropertyConfig> => {
    await delay(200);
    const stored = localStorage.getItem(KEYS.CONFIG);
    return stored ? JSON.parse(stored) : INITIAL_PROPERTY_CONFIG;
  },

  updateConfig: async (config: PropertyConfig): Promise<void> => {
    await delay(300);
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  },

  getPricing: async (): Promise<PricingRule> => {
    await delay(200);
    const stored = localStorage.getItem(KEYS.PRICING);
    return stored ? JSON.parse(stored) : INITIAL_PRICING;
  },

  updatePricing: async (pricing: PricingRule): Promise<void> => {
    await delay(300);
    localStorage.setItem(KEYS.PRICING, JSON.stringify(pricing));
  },

  getBookings: async (): Promise<Booking[]> => {
    await delay(400);
    const stored = localStorage.getItem(KEYS.BOOKINGS);
    const data = stored ? JSON.parse(stored) : [];
    return data.map((b: Booking) => ({
      ...b,
      paymentStatus: b.paymentStatus || PaymentStatus.PENDING,
      depositAmount: b.depositAmount || 0
    }));
  },

  createBooking: async (booking: Omit<Booking, 'id' | 'createdAt' | 'status'> & { status?: BookingStatus }): Promise<Booking> => {
    await delay(500);
    const newBooking: Booking = {
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      depositAmount: 0,
      ...booking,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    const bookings = await MockBackend.getBookings();
    bookings.push(newBooking);
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    return newBooking;
  },

  updateBookingStatus: async (id: string, status: BookingStatus): Promise<void> => {
    await delay(300);
    const bookings = await MockBackend.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].status = status;
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    }
  },

  updatePaymentStatus: async (id: string, status: PaymentStatus): Promise<void> => {
    await delay(300);
    const bookings = await MockBackend.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].paymentStatus = status;
      // If marked as FULL, we assume deposit becomes total or we clear it? 
      // Usually, just keep status. If FULL, we might want to ensure depositAmount reflects total or just rely on status.
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    }
  },

  updateDepositAmount: async (id: string, amount: number): Promise<void> => {
    await delay(300);
    const bookings = await MockBackend.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].depositAmount = amount;
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    }
  },

  getBlockedDates: async (): Promise<DayStatus[]> => {
    await delay(200);
    const stored = localStorage.getItem(KEYS.BLOCKED_DATES);
    return stored ? JSON.parse(stored) : [];
  },

  toggleDateBlock: async (date: string): Promise<void> => {
    await delay(200);
    const blocked = await MockBackend.getBlockedDates();
    const index = blocked.findIndex(d => d.date === date);
    if (index !== -1) {
      blocked.splice(index, 1);
    } else {
      blocked.push({ date, isBlocked: true });
    }
    localStorage.setItem(KEYS.BLOCKED_DATES, JSON.stringify(blocked));
  }
};