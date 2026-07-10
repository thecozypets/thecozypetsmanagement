export interface Owner {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  altPhone?: string;
  city?: string;
  pincode?: string;
  notes?: string;
  createdAt: string;
}

export type AnimalType = 'dog' | 'cat';

export interface VaccineRecord {
  name: string;       // e.g. Rabies, DHPP, Kennel Cough
  date: string;       // ISO date given
  expiry: string;     // ISO date
  certUrl?: string;
}

export interface MedicationRecord {
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

export interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number;
  ageMonths: number;
  weight: number;
  gender: 'male' | 'female';
  ownerId: string;
  specialNeeds: string;
  feedingInstructions: string;
  medications: string;
  vaccinated: boolean;
  neutered: boolean;
  photoUrl: string;
  vaccinePhotoUrl: string;
  animalType?: AnimalType;
  // Phase 3 — 360° profile fields (all optional)
  microchipId?: string;
  color?: string;
  vaccines?: VaccineRecord[];
  dewormingDate?: string;
  tickFleaDate?: string;
  allergies?: string;
  medicalConditions?: string;
  currentMedications?: MedicationRecord[];
  behaviourTags?: string[];
  feedingFood?: string;
  feedingTimes?: string;
  feedingPortions?: string;
  vetName?: string;
  vetPhone?: string;
  vetClinic?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
}

export type BoardingStatus = 'reserved' | 'checked-in' | 'checked-out' | 'cancelled';
export type PaymentStatus = 'paid' | 'partly-paid' | 'outstanding';
export type PaymentMethod = 'upi' | 'cash' | '';
export type LastDayCharge = 'none' | 'daycare';
export type BookingSource = 'walk-in' | 'website' | 'whatsapp' | 'phone' | 'referral' | 'instagram' | 'google' | 'other';

export type ExtraCategory =
  | 'bath' | 'grooming' | 'pickup' | 'drop' | 'training'
  | 'medicine' | 'special-food' | 'vet-visit' | 'custom';

export interface BookingExtra {
  id?: string;
  category: ExtraCategory;
  label: string;
  amount: number;
  quantity: number;
  notes?: string;
}
export type DiscountType = 'none' | 'percentage' | 'fixed';

export interface Boarding {
  id: string;
  dogId: string;
  ownerId: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  status: BoardingStatus;
  kennelNumber: string;
  dailyRate: number;
  totalCost: number;
  additionalCost: number;
  specialRequests: string;
  feedingSchedule: string;
  notes: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  lastDayCharge: LastDayCharge;
  daycarePrice: number;
  discountType: DiscountType;
  discountValue: number;
  discountReason: string;
  source: BookingSource;
  tags: string[];
  internalNotes: string;
  couponCode: string;
  extras: BookingExtra[];
  createdAt: string;
}


export interface Foster {
  id: string;
  dogId: string;
  ownerId: string;
  animalType: AnimalType;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  status: BoardingStatus;
  kennelNumber: string;
  dailyRate: number;
  totalCost: number;
  additionalCost: number;
  specialRequests: string;
  feedingSchedule: string;
  notes: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
}
