export const calcDays = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export interface BillableRecord {
  checkInDate: string;
  checkOutDate: string;
  dailyRate: number;
  additionalCost?: number;
  discount?: number;
  paidAmount?: number;
  status?: string;
}

export interface Billing {
  days: number;
  dailyRate: number;
  subtotal: number;
  additional: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
}

export const calcBilling = (b: BillableRecord): Billing => {
  const days = calcDays(b.checkInDate, b.checkOutDate);
  const dailyRate = b.dailyRate || 0;
  const subtotal = days * dailyRate;
  const additional = b.additionalCost || 0;
  const discount = Math.max(0, b.discount || 0);
  const total = Math.max(0, subtotal + additional - discount);
  const paid = b.paidAmount || 0;
  const remaining = Math.max(0, total - paid);
  return { days, dailyRate, subtotal, additional, discount, total, paid, remaining };
};
