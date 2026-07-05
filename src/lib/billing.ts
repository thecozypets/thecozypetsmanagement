export type LastDayCharge = 'none' | 'daycare';
export type DiscountType = 'none' | 'percentage' | 'fixed';

// Normalize any legacy value ('half-daycare' | 'full-daycare' | 'full-overnight') to the
// simplified two-option model.
export const normalizeLastDayCharge = (lc: any): LastDayCharge => {
  if (lc === 'none' || !lc) return 'none';
  if (lc === 'daycare') return 'daycare';
  // Legacy values all map to daycare
  return 'daycare';
};

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

export const lastDayLabel = (lc: LastDayCharge): string => {
  return normalizeLastDayCharge(lc) === 'daycare' ? 'Daycare' : 'None';
};

export interface BillableRecord {
  checkInDate: string;
  checkOutDate: string;
  dailyRate: number;
  additionalCost?: number;
  paidAmount?: number;
  status?: string;
  lastDayCharge?: LastDayCharge;
  daycarePrice?: number;
  discountType?: DiscountType;
  discountValue?: number;
}

export interface Billing {
  nights: number;
  lastDayCharge: LastDayCharge;
  lastDayUnits: number;    // 1 when daycare selected, else 0
  units: number;           // nights + last-day units
  days: number;            // back-compat display alias
  dailyRate: number;
  daycarePrice: number;
  boardingCharge: number;
  daycareCharge: number;
  subtotal: number;        // boarding + daycare
  additional: number;
  discountType: DiscountType;
  discountValue: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
}

export const calcBilling = (b: BillableRecord): Billing => {
  const nights = calcNights(b.checkInDate, b.checkOutDate);
  const lc: LastDayCharge = normalizeLastDayCharge(b.lastDayCharge);
  const ldUnits = lc === 'daycare' ? 1 : 0;
  const dailyRate = b.dailyRate || 0;
  const daycarePrice = Math.max(0, b.daycarePrice || 0);

  const boardingCharge = nights * dailyRate;
  const daycareCharge = ldUnits * daycarePrice;
  // Fallback: no nights and no daycare -> bill one day at daily rate so same-day
  // bookings created before this feature still show a charge.
  const subtotal = boardingCharge + daycareCharge || (nights === 0 && ldUnits === 0 ? dailyRate : 0);

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
  const units = nights + ldUnits;

  return {
    nights,
    lastDayCharge: lc,
    lastDayUnits: ldUnits,
    units,
    days: Math.max(1, units || 1),
    dailyRate,
    daycarePrice,
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
