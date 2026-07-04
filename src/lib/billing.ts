export type LastDayCharge = 'none' | 'half-daycare' | 'full-daycare' | 'full-overnight';
export type DiscountType = 'none' | 'percentage' | 'fixed';

// Whole overnight nights between two calendar dates (July 1 -> July 4 = 3)
export const calcNights = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn + 'T00:00:00');
  const b = new Date(checkOut + 'T00:00:00');
  const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

// Backwards-compat: legacy day count = at least 1
export const calcDays = (checkIn: string, checkOut: string) => {
  const n = calcNights(checkIn, checkOut);
  return Math.max(1, n);
};

const lastDayUnits = (lc: LastDayCharge): number => {
  switch (lc) {
    case 'half-daycare': return 0.5;
    case 'full-daycare': return 1;
    case 'full-overnight': return 1;
    default: return 0;
  }
};

export const lastDayLabel = (lc: LastDayCharge): string => {
  switch (lc) {
    case 'half-daycare': return 'Half Daycare';
    case 'full-daycare': return 'Full Daycare';
    case 'full-overnight': return 'Full Overnight';
    default: return 'None';
  }
};

export interface BillableRecord {
  checkInDate: string;
  checkOutDate: string;
  dailyRate: number;
  additionalCost?: number;
  paidAmount?: number;
  status?: string;
  lastDayCharge?: LastDayCharge;
  discountType?: DiscountType;
  discountValue?: number;
}

export interface Billing {
  nights: number;
  lastDayCharge: LastDayCharge;
  lastDayUnits: number;
  units: number; // nights + last-day units
  days: number;  // back-compat alias for units (rounded up for display)
  dailyRate: number;
  boardingCharge: number;
  daycareCharge: number;
  subtotal: number;      // boarding + daycare
  additional: number;
  discountType: DiscountType;
  discountValue: number;
  discount: number;      // absolute discount applied
  total: number;         // subtotal + additional - discount
  paid: number;
  remaining: number;
}

export const calcBilling = (b: BillableRecord): Billing => {
  const nights = calcNights(b.checkInDate, b.checkOutDate);
  const lc: LastDayCharge = b.lastDayCharge || 'none';
  const ldUnits = lastDayUnits(lc);
  // If there are zero nights and no last-day charge, fall back to 1 unit
  // so we never bill zero on same-day bookings that predate this feature.
  const units = nights + ldUnits || (nights === 0 && ldUnits === 0 ? 1 : nights + ldUnits);
  const dailyRate = b.dailyRate || 0;

  const boardingCharge = nights * dailyRate;
  const daycareCharge = ldUnits * dailyRate;
  const subtotal = boardingCharge + daycareCharge || units * dailyRate;

  const additional = b.additionalCost || 0;
  const preDiscount = subtotal + additional;

  const dType: DiscountType = b.discountType || 'none';
  const dVal = Math.max(0, b.discountValue || 0);
  let discount = 0;
  if (dType === 'percentage') discount = (preDiscount * Math.min(dVal, 100)) / 100;
  else if (dType === 'fixed') discount = dVal;
  discount = Math.min(discount, preDiscount);

  const total = Math.max(0, preDiscount - discount);
  const paid = b.paidAmount || 0;
  const remaining = Math.max(0, total - paid);

  return {
    nights,
    lastDayCharge: lc,
    lastDayUnits: ldUnits,
    units,
    days: Math.max(1, Math.ceil(units)),
    dailyRate,
    boardingCharge,
    daycareCharge,
    subtotal,
    additional,
    discountType: dType,
    discountValue: dVal,
    discount,
    total,
    paid,
    remaining,
  };
};
