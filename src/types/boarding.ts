export interface Owner {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  createdAt: string;
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
  createdAt: string;
}

export type BoardingStatus = 'reserved' | 'checked-in' | 'checked-out' | 'cancelled';
export type PaymentStatus = 'paid' | 'partly-paid' | 'outstanding';
export type PaymentMethod = 'upi' | 'cash' | '';

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
  createdAt: string;
}

export type AnimalType = 'dog' | 'cat';

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
