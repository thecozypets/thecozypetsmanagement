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
  weight: number;
  gender: 'male' | 'female';
  ownerId: string;
  specialNeeds: string;
  feedingInstructions: string;
  medications: string;
  vaccinated: boolean;
  neutered: boolean;
  photoUrl: string;
  createdAt: string;
}

export type BoardingStatus = 'reserved' | 'checked-in' | 'checked-out' | 'cancelled';

export interface Boarding {
  id: string;
  dogId: string;
  ownerId: string;
  checkInDate: string;
  checkOutDate: string;
  status: BoardingStatus;
  kennelNumber: string;
  dailyRate: number;
  totalCost: number;
  specialRequests: string;
  feedingSchedule: string;
  notes: string;
  createdAt: string;
}
