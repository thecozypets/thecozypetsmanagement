import { useState, useCallback, useEffect } from 'react';
import { Owner, Dog, Boarding, Foster, AnimalType, BookingExtra, ExtraCategory, BookingSource, VaccineRecord, MedicationRecord } from '@/types/boarding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ---- Shared mappers for Phase 3 profile fields ----
const mapOwnerRow = (r: any): Owner => ({
  id: r.id, name: r.name, phone: r.phone, email: r.email || '',
  address: r.address || '', emergencyContact: r.emergency_contact || '',
  altPhone: r.alt_phone || '', city: r.city || '', pincode: r.pincode || '', notes: r.notes || '',
  createdAt: r.created_at,
});
const ownerInsertPayload = (o: Omit<Owner, 'id' | 'createdAt'>, userId: string) => ({
  name: o.name, phone: o.phone, email: o.email || null,
  address: o.address || null, emergency_contact: o.emergencyContact || null,
  alt_phone: o.altPhone || null, city: o.city || null, pincode: o.pincode || null, notes: o.notes || null,
  user_id: userId,
});
const ownerUpdatePayload = (d: Partial<Owner>) => {
  const u: any = {};
  if (d.name !== undefined) u.name = d.name;
  if (d.phone !== undefined) u.phone = d.phone;
  if (d.email !== undefined) u.email = d.email;
  if (d.address !== undefined) u.address = d.address;
  if (d.emergencyContact !== undefined) u.emergency_contact = d.emergencyContact;
  if (d.altPhone !== undefined) u.alt_phone = d.altPhone;
  if (d.city !== undefined) u.city = d.city;
  if (d.pincode !== undefined) u.pincode = d.pincode;
  if (d.notes !== undefined) u.notes = d.notes;
  return u;
};
const mapDogRow = (r: any): Dog => ({
  id: r.id, name: r.name, breed: r.breed, age: r.age, ageMonths: r.age_months || 0, weight: Number(r.weight),
  gender: r.gender, ownerId: r.owner_id,
  specialNeeds: r.special_needs || '', feedingInstructions: r.feeding_instructions || '',
  medications: r.medications || '', vaccinated: r.vaccinated, neutered: r.neutered,
  photoUrl: r.photo_url || '', vaccinePhotoUrl: r.vaccine_photo_url || '',
  animalType: (r.animal_type || 'dog') as AnimalType,
  microchipId: r.microchip_id || '', color: r.color || '',
  vaccines: (r.vaccines || []) as VaccineRecord[],
  dewormingDate: r.deworming_date || '', tickFleaDate: r.tick_flea_date || '',
  allergies: r.allergies || '', medicalConditions: r.medical_conditions || '',
  currentMedications: (r.current_medications || []) as MedicationRecord[],
  behaviourTags: (r.behaviour_tags || []) as string[],
  feedingFood: r.feeding_food || '', feedingTimes: r.feeding_times || '', feedingPortions: r.feeding_portions || '',
  vetName: r.vet_name || '', vetPhone: r.vet_phone || '', vetClinic: r.vet_clinic || '',
  emergencyContactName: r.emergency_contact_name || '',
  emergencyContactPhone: r.emergency_contact_phone || '',
  createdAt: r.created_at,
});
const dogExtraUpdate = (d: Partial<Dog>) => {
  const u: any = {};
  if (d.microchipId !== undefined) u.microchip_id = d.microchipId;
  if (d.color !== undefined) u.color = d.color;
  if (d.vaccines !== undefined) u.vaccines = d.vaccines;
  if (d.dewormingDate !== undefined) u.deworming_date = d.dewormingDate || null;
  if (d.tickFleaDate !== undefined) u.tick_flea_date = d.tickFleaDate || null;
  if (d.allergies !== undefined) u.allergies = d.allergies;
  if (d.medicalConditions !== undefined) u.medical_conditions = d.medicalConditions;
  if (d.currentMedications !== undefined) u.current_medications = d.currentMedications;
  if (d.behaviourTags !== undefined) u.behaviour_tags = d.behaviourTags;
  if (d.feedingFood !== undefined) u.feeding_food = d.feedingFood;
  if (d.feedingTimes !== undefined) u.feeding_times = d.feedingTimes;
  if (d.feedingPortions !== undefined) u.feeding_portions = d.feedingPortions;
  if (d.vetName !== undefined) u.vet_name = d.vetName;
  if (d.vetPhone !== undefined) u.vet_phone = d.vetPhone;
  if (d.vetClinic !== undefined) u.vet_clinic = d.vetClinic;
  if (d.emergencyContactName !== undefined) u.emergency_contact_name = d.emergencyContactName;
  if (d.emergencyContactPhone !== undefined) u.emergency_contact_phone = d.emergencyContactPhone;
  return u;
};

export function useOwners() {
  const [owners, setOwners] = useState<Owner[]>([]);

  const fetchOwners = useCallback(async () => {
    const { data, error } = await supabase.from('owners').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load owners'); return; }
    setOwners((data || []).map(r => ({
      id: r.id, name: r.name, phone: r.phone, email: r.email || '',
      address: r.address || '', emergencyContact: r.emergency_contact || '', createdAt: r.created_at,
    })));
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  const addOwner = useCallback(async (owner: Omit<Owner, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return null; }
    const { data, error } = await supabase.from('owners').insert({
      name: owner.name, phone: owner.phone, email: owner.email || null,
      address: owner.address || null, emergency_contact: owner.emergencyContact || null, user_id: user.id,
    }).select().single();
    if (error) { toast.error('Failed to add owner'); return null; }
    await fetchOwners();
    return { ...owner, id: data.id, createdAt: data.created_at } as Owner;
  }, [fetchOwners]);

  const updateOwner = useCallback(async (id: string, d: Partial<Owner>) => {
    const update: any = {};
    if (d.name !== undefined) update.name = d.name;
    if (d.phone !== undefined) update.phone = d.phone;
    if (d.email !== undefined) update.email = d.email;
    if (d.address !== undefined) update.address = d.address;
    if (d.emergencyContact !== undefined) update.emergency_contact = d.emergencyContact;
    const { error } = await supabase.from('owners').update(update).eq('id', id);
    if (error) { toast.error('Failed to update owner'); return; }
    await fetchOwners();
  }, [fetchOwners]);

  const deleteOwner = useCallback(async (id: string) => {
    const { error } = await supabase.from('owners').delete().eq('id', id);
    if (error) { toast.error('Failed to delete owner'); return; }
    await fetchOwners();
  }, [fetchOwners]);

  return { owners, addOwner, updateOwner, deleteOwner };
}

export function useDogs() {
  const [dogs, setDogs] = useState<Dog[]>([]);

  const fetchDogs = useCallback(async () => {
    const { data, error } = await supabase.from('dogs').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load dogs'); return; }
    setDogs((data || []).map(r => ({
      id: r.id, name: r.name, breed: r.breed, age: r.age, ageMonths: (r as any).age_months || 0, weight: Number(r.weight),
      gender: r.gender as 'male' | 'female', ownerId: r.owner_id,
      specialNeeds: r.special_needs || '', feedingInstructions: r.feeding_instructions || '',
      medications: r.medications || '', vaccinated: r.vaccinated, neutered: r.neutered,
      photoUrl: r.photo_url || '', vaccinePhotoUrl: (r as any).vaccine_photo_url || '', createdAt: r.created_at,
    })));
  }, []);

  useEffect(() => { fetchDogs(); }, [fetchDogs]);

  const addDog = useCallback(async (dog: Omit<Dog, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return null; }
    const { data, error } = await supabase.from('dogs').insert({
      name: dog.name, breed: dog.breed, age: dog.age, age_months: dog.ageMonths || 0, weight: dog.weight,
      gender: dog.gender, owner_id: dog.ownerId, special_needs: dog.specialNeeds || null,
      feeding_instructions: dog.feedingInstructions || null, medications: dog.medications || null,
      vaccinated: dog.vaccinated, neutered: dog.neutered, photo_url: dog.photoUrl || null,
      vaccine_photo_url: (dog as any).vaccinePhotoUrl || null, user_id: user.id,
    } as any).select().single();
    if (error) { toast.error('Failed to add dog'); return null; }
    await fetchDogs();
    return { ...dog, id: data.id, createdAt: data.created_at } as Dog;
  }, [fetchDogs]);

  const updateDog = useCallback(async (id: string, d: Partial<Dog>) => {
    const update: any = {};
    if (d.name !== undefined) update.name = d.name;
    if (d.breed !== undefined) update.breed = d.breed;
    if (d.age !== undefined) update.age = d.age;
    if ((d as any).ageMonths !== undefined) update.age_months = (d as any).ageMonths;
    if (d.weight !== undefined) update.weight = d.weight;
    if (d.gender !== undefined) update.gender = d.gender;
    if (d.ownerId !== undefined) update.owner_id = d.ownerId;
    if (d.specialNeeds !== undefined) update.special_needs = d.specialNeeds;
    if (d.feedingInstructions !== undefined) update.feeding_instructions = d.feedingInstructions;
    if (d.medications !== undefined) update.medications = d.medications;
    if (d.vaccinated !== undefined) update.vaccinated = d.vaccinated;
    if (d.neutered !== undefined) update.neutered = d.neutered;
    if (d.photoUrl !== undefined) update.photo_url = d.photoUrl;
    if (d.vaccinePhotoUrl !== undefined) update.vaccine_photo_url = d.vaccinePhotoUrl;
    const { error } = await supabase.from('dogs').update(update as any).eq('id', id);
    if (error) { toast.error('Failed to update dog'); return; }
    await fetchDogs();
  }, [fetchDogs]);

  const deleteDog = useCallback(async (id: string) => {
    const { error } = await supabase.from('dogs').delete().eq('id', id);
    if (error) { toast.error('Failed to delete dog'); return; }
    await fetchDogs();
  }, [fetchDogs]);

  return { dogs, addDog, updateDog, deleteDog };
}

export function useBoardings() {
  const [boardings, setBoardings] = useState<Boarding[]>([]);

  const fetchBoardings = useCallback(async () => {
    const { data, error } = await supabase.from('boardings').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load boardings'); return; }
    // Load extras once and group by boarding_id
    const { data: extrasData } = await supabase.from('booking_extras' as any).select('*');
    const extrasByBooking = new Map<string, BookingExtra[]>();
    (extrasData || []).forEach((e: any) => {
      const arr = extrasByBooking.get(e.boarding_id) || [];
      arr.push({
        id: e.id, category: e.category as ExtraCategory, label: e.label,
        amount: Number(e.amount) || 0, quantity: Number(e.quantity) || 1, notes: e.notes || '',
      });
      extrasByBooking.set(e.boarding_id, arr);
    });
    setBoardings((data || []).map(r => {
      const checkInParts = (r.check_in_date || '').split('T');
      const checkOutParts = (r.check_out_date || '').split('T');
      return {
        id: r.id, dogId: r.dog_id, ownerId: r.owner_id,
        checkInDate: checkInParts[0] || r.check_in_date,
        checkInTime: checkInParts[1]?.slice(0, 5) || '',
        checkOutDate: checkOutParts[0] || r.check_out_date,
        checkOutTime: checkOutParts[1]?.slice(0, 5) || '',
        status: r.status, kennelNumber: r.kennel_number || '',
        dailyRate: Number(r.daily_rate), totalCost: Number(r.total_cost),
        additionalCost: Number((r as any).additional_cost || 0),
        specialRequests: r.special_requests || '', feedingSchedule: r.feeding_schedule || '',
        notes: r.notes || '',
        paymentStatus: ((r as any).payment_status || 'outstanding') as any,
        paidAmount: Number((r as any).paid_amount || 0),
        paymentMethod: ((r as any).payment_method || '') as any,
        lastDayCharge: (((r as any).last_day_charge && (r as any).last_day_charge !== 'none') ? 'daycare' : 'none') as any,
        daycarePrice: Number((r as any).daycare_price || 0),
        discountType: ((r as any).discount_type || 'none') as any,
        discountValue: Number((r as any).discount_value || 0),
        discountReason: (r as any).discount_reason || '',
        source: ((r as any).source || 'walk-in') as BookingSource,
        tags: ((r as any).tags || []) as string[],
        internalNotes: (r as any).internal_notes || '',
        couponCode: (r as any).coupon_code || '',
        extras: extrasByBooking.get(r.id) || [],
        createdAt: r.created_at,
      };
    }));
  }, []);

  useEffect(() => { fetchBoardings(); }, [fetchBoardings]);

  const addBoarding = useCallback(async (boarding: Omit<Boarding, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return null; }
    const checkInFull = boarding.checkInTime ? `${boarding.checkInDate}T${boarding.checkInTime}` : boarding.checkInDate;
    const checkOutFull = boarding.checkOutTime ? `${boarding.checkOutDate}T${boarding.checkOutTime}` : boarding.checkOutDate;
    const { data, error } = await supabase.from('boardings').insert({
      dog_id: boarding.dogId, owner_id: boarding.ownerId, check_in_date: checkInFull,
      check_out_date: checkOutFull, status: boarding.status,
      kennel_number: boarding.kennelNumber || null, daily_rate: boarding.dailyRate,
      total_cost: boarding.totalCost, additional_cost: (boarding as any).additionalCost || 0,
      special_requests: boarding.specialRequests || null,
      feeding_schedule: boarding.feedingSchedule || null, notes: boarding.notes || null,
      payment_status: (boarding as any).paymentStatus || 'outstanding',
      paid_amount: (boarding as any).paidAmount || 0,
      payment_method: (boarding as any).paymentMethod || null,
      last_day_charge: (boarding as any).lastDayCharge || 'none',
      daycare_price: (boarding as any).daycarePrice || 0,
      discount_type: (boarding as any).discountType || 'none',
      discount_value: (boarding as any).discountValue || 0,
      discount_reason: (boarding as any).discountReason || null,
      source: (boarding as any).source || 'walk-in',
      tags: (boarding as any).tags || [],
      internal_notes: (boarding as any).internalNotes || '',
      coupon_code: (boarding as any).couponCode || '',
      user_id: user.id,
    } as any).select().single();
    if (error) { toast.error('Failed to add boarding'); return null; }
    // Persist extras
    const extras: BookingExtra[] = (boarding as any).extras || [];
    if (extras.length > 0) {
      await supabase.from('booking_extras' as any).insert(extras.map(x => ({
        boarding_id: data.id, category: x.category, label: x.label,
        amount: x.amount, quantity: x.quantity, notes: x.notes || '',
      })) as any);
    }
    await fetchBoardings();
    return { ...boarding, id: data.id, createdAt: data.created_at } as Boarding;
  }, [fetchBoardings]);

  const updateBoarding = useCallback(async (id: string, d: Partial<Boarding>) => {
    const update: any = {};
    if (d.dogId !== undefined) update.dog_id = d.dogId;
    if (d.ownerId !== undefined) update.owner_id = d.ownerId;
    if (d.checkInDate !== undefined) update.check_in_date = d.checkInTime ? `${d.checkInDate}T${d.checkInTime}` : d.checkInDate;
    if (d.checkOutDate !== undefined) update.check_out_date = d.checkOutTime ? `${d.checkOutDate}T${d.checkOutTime}` : d.checkOutDate;
    if (d.status !== undefined) update.status = d.status;
    if (d.kennelNumber !== undefined) update.kennel_number = d.kennelNumber;
    if (d.dailyRate !== undefined) update.daily_rate = d.dailyRate;
    if (d.totalCost !== undefined) update.total_cost = d.totalCost;
    if ((d as any).additionalCost !== undefined) update.additional_cost = (d as any).additionalCost;
    if (d.specialRequests !== undefined) update.special_requests = d.specialRequests;
    if (d.feedingSchedule !== undefined) update.feeding_schedule = d.feedingSchedule;
    if (d.notes !== undefined) update.notes = d.notes;
    if ((d as any).paymentStatus !== undefined) update.payment_status = (d as any).paymentStatus;
    if ((d as any).paidAmount !== undefined) update.paid_amount = (d as any).paidAmount;
    if ((d as any).paymentMethod !== undefined) update.payment_method = (d as any).paymentMethod;
    if ((d as any).lastDayCharge !== undefined) update.last_day_charge = (d as any).lastDayCharge;
    if ((d as any).daycarePrice !== undefined) update.daycare_price = (d as any).daycarePrice;
    if ((d as any).discountType !== undefined) update.discount_type = (d as any).discountType;
    if ((d as any).discountValue !== undefined) update.discount_value = (d as any).discountValue;
    if ((d as any).discountReason !== undefined) update.discount_reason = (d as any).discountReason;
    if ((d as any).source !== undefined) update.source = (d as any).source;
    if ((d as any).tags !== undefined) update.tags = (d as any).tags;
    if ((d as any).internalNotes !== undefined) update.internal_notes = (d as any).internalNotes;
    if ((d as any).couponCode !== undefined) update.coupon_code = (d as any).couponCode;
    const { error } = await supabase.from('boardings').update(update).eq('id', id);
    if (error) { toast.error('Failed to update boarding'); return; }
    // Sync extras if provided (delete-and-reinsert)
    if ((d as any).extras !== undefined) {
      const extras: BookingExtra[] = (d as any).extras || [];
      await supabase.from('booking_extras' as any).delete().eq('boarding_id', id);
      if (extras.length > 0) {
        await supabase.from('booking_extras' as any).insert(extras.map(x => ({
          boarding_id: id, category: x.category, label: x.label,
          amount: x.amount, quantity: x.quantity, notes: x.notes || '',
        })) as any);
      }
    }
    await fetchBoardings();
  }, [fetchBoardings]);

  const deleteBoarding = useCallback(async (id: string) => {
    const { error } = await supabase.from('boardings').delete().eq('id', id);
    if (error) { toast.error('Failed to delete boarding'); return; }
    await fetchBoardings();
  }, [fetchBoardings]);

  return { boardings, addBoarding, updateBoarding, deleteBoarding };
}

export function useFosters() {
  const [fosters, setFosters] = useState<Foster[]>([]);

  const fetchFosters = useCallback(async () => {
    const { data, error } = await supabase.from('fosters').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load fosters'); return; }
    setFosters((data || []).map((r: any) => {
      const checkInParts = (r.check_in_date || '').split('T');
      const checkOutParts = (r.check_out_date || '').split('T');
      return {
        id: r.id, dogId: r.dog_id, ownerId: r.owner_id,
        animalType: (r.animal_type || 'dog') as AnimalType,
        checkInDate: checkInParts[0] || r.check_in_date,
        checkInTime: checkInParts[1]?.slice(0, 5) || '',
        checkOutDate: checkOutParts[0] || r.check_out_date,
        checkOutTime: checkOutParts[1]?.slice(0, 5) || '',
        status: r.status, kennelNumber: r.kennel_number || '',
        dailyRate: Number(r.daily_rate), totalCost: Number(r.total_cost), additionalCost: Number(r.additional_cost || 0),
        specialRequests: r.special_requests || '', feedingSchedule: r.feeding_schedule || '',
        notes: r.notes || '',
        paymentStatus: (r.payment_status || 'outstanding') as any,
        paidAmount: Number(r.paid_amount || 0),
        paymentMethod: (r.payment_method || '') as any,
        createdAt: r.created_at,
      };
    }));
  }, []);

  useEffect(() => { fetchFosters(); }, [fetchFosters]);

  const addFoster = useCallback(async (foster: Omit<Foster, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return null; }
    const checkInFull = foster.checkInTime ? `${foster.checkInDate}T${foster.checkInTime}` : foster.checkInDate;
    const checkOutFull = foster.checkOutTime ? `${foster.checkOutDate}T${foster.checkOutTime}` : foster.checkOutDate;
    const { data, error } = await supabase.from('fosters' as any).insert({
      dog_id: foster.dogId, owner_id: foster.ownerId, animal_type: foster.animalType,
      check_in_date: checkInFull, check_out_date: checkOutFull, status: foster.status,
      kennel_number: foster.kennelNumber || null, daily_rate: foster.dailyRate,
      total_cost: foster.totalCost, additional_cost: foster.additionalCost || 0, special_requests: foster.specialRequests || null,
      feeding_schedule: foster.feedingSchedule || null, notes: foster.notes || null,
      payment_status: foster.paymentStatus || 'outstanding',
      paid_amount: foster.paidAmount || 0, payment_method: foster.paymentMethod || null,
      user_id: user.id,
    } as any).select().single();
    if (error) { toast.error('Failed to add foster'); return null; }
    await fetchFosters();
    return { ...foster, id: (data as any).id, createdAt: (data as any).created_at } as Foster;
  }, [fetchFosters]);

  const updateFoster = useCallback(async (id: string, d: Partial<Foster>) => {
    const update: any = {};
    if (d.dogId !== undefined) update.dog_id = d.dogId;
    if (d.ownerId !== undefined) update.owner_id = d.ownerId;
    if (d.animalType !== undefined) update.animal_type = d.animalType;
    if (d.checkInDate !== undefined) update.check_in_date = d.checkInTime ? `${d.checkInDate}T${d.checkInTime}` : d.checkInDate;
    if (d.checkOutDate !== undefined) update.check_out_date = d.checkOutTime ? `${d.checkOutDate}T${d.checkOutTime}` : d.checkOutDate;
    if (d.status !== undefined) update.status = d.status;
    if (d.kennelNumber !== undefined) update.kennel_number = d.kennelNumber;
    if (d.dailyRate !== undefined) update.daily_rate = d.dailyRate;
    if (d.totalCost !== undefined) update.total_cost = d.totalCost;
    if (d.additionalCost !== undefined) update.additional_cost = d.additionalCost;
    if (d.specialRequests !== undefined) update.special_requests = d.specialRequests;
    if (d.feedingSchedule !== undefined) update.feeding_schedule = d.feedingSchedule;
    if (d.notes !== undefined) update.notes = d.notes;
    if (d.paymentStatus !== undefined) update.payment_status = d.paymentStatus;
    if (d.paidAmount !== undefined) update.paid_amount = d.paidAmount;
    if (d.paymentMethod !== undefined) update.payment_method = d.paymentMethod;
    const { error } = await supabase.from('fosters' as any).update(update).eq('id', id);
    if (error) { toast.error('Failed to update foster'); return; }
    await fetchFosters();
  }, [fetchFosters]);

  const deleteFoster = useCallback(async (id: string) => {
    const { error } = await supabase.from('fosters' as any).delete().eq('id', id);
    if (error) { toast.error('Failed to delete foster'); return; }
    await fetchFosters();
  }, [fetchFosters]);

  return { fosters, addFoster, updateFoster, deleteFoster };
}

export function useFosterOwners() {
  const [owners, setOwners] = useState<Owner[]>([]);

  const fetchOwners = useCallback(async () => {
    const { data, error } = await supabase.from('foster_owners' as any).select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load foster owners'); return; }
    setOwners((data || []).map((r: any) => ({
      id: r.id, name: r.name, phone: r.phone, email: r.email || '',
      address: r.address || '', emergencyContact: r.emergency_contact || '', createdAt: r.created_at,
    })));
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  const addOwner = useCallback(async (owner: Omit<Owner, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return null; }
    const { data, error } = await supabase.from('foster_owners' as any).insert({
      name: owner.name, phone: owner.phone, email: owner.email || null,
      address: owner.address || null, emergency_contact: owner.emergencyContact || null, user_id: user.id,
    } as any).select().single();
    if (error) { toast.error('Failed to add foster owner'); return null; }
    await fetchOwners();
    return { ...owner, id: (data as any).id, createdAt: (data as any).created_at } as Owner;
  }, [fetchOwners]);

  const updateOwner = useCallback(async (id: string, d: Partial<Owner>) => {
    const update: any = {};
    if (d.name !== undefined) update.name = d.name;
    if (d.phone !== undefined) update.phone = d.phone;
    if (d.email !== undefined) update.email = d.email;
    if (d.address !== undefined) update.address = d.address;
    if (d.emergencyContact !== undefined) update.emergency_contact = d.emergencyContact;
    const { error } = await supabase.from('foster_owners' as any).update(update).eq('id', id);
    if (error) { toast.error('Failed to update foster owner'); return; }
    await fetchOwners();
  }, [fetchOwners]);

  const deleteOwner = useCallback(async (id: string) => {
    const { error } = await supabase.from('foster_owners' as any).delete().eq('id', id);
    if (error) { toast.error('Failed to delete foster owner'); return; }
    await fetchOwners();
  }, [fetchOwners]);

  return { fosterOwners: owners, addFosterOwner: addOwner, updateFosterOwner: updateOwner, deleteFosterOwner: deleteOwner };
}

export function useFosterDogs() {
  const [dogs, setDogs] = useState<Dog[]>([]);

  const fetchDogs = useCallback(async () => {
    const { data, error } = await supabase.from('foster_dogs' as any).select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load foster dogs'); return; }
    setDogs((data || []).map((r: any) => ({
      id: r.id, name: r.name, breed: r.breed, age: r.age, ageMonths: r.age_months || 0, weight: Number(r.weight),
      gender: r.gender as 'male' | 'female', ownerId: r.owner_id,
      specialNeeds: r.special_needs || '', feedingInstructions: r.feeding_instructions || '',
      medications: r.medications || '', vaccinated: r.vaccinated, neutered: r.neutered,
      photoUrl: r.photo_url || '', vaccinePhotoUrl: r.vaccine_photo_url || '',
      animalType: (r.animal_type || 'dog') as AnimalType, createdAt: r.created_at,
    })));
  }, []);

  useEffect(() => { fetchDogs(); }, [fetchDogs]);

  const addDog = useCallback(async (dog: Omit<Dog, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return null; }
    const { data, error } = await supabase.from('foster_dogs' as any).insert({
      name: dog.name, breed: dog.breed, age: dog.age, age_months: dog.ageMonths || 0, weight: dog.weight,
      gender: dog.gender, owner_id: dog.ownerId, special_needs: dog.specialNeeds || null,
      feeding_instructions: dog.feedingInstructions || null, medications: dog.medications || null,
      vaccinated: dog.vaccinated, neutered: dog.neutered, photo_url: dog.photoUrl || null,
      vaccine_photo_url: dog.vaccinePhotoUrl || null, animal_type: (dog as any).animalType || 'dog', user_id: user.id,
    } as any).select().single();
    if (error) { toast.error('Failed to add foster dog'); return null; }
    await fetchDogs();
    return { ...dog, id: (data as any).id, createdAt: (data as any).created_at } as Dog;
  }, [fetchDogs]);

  const updateDog = useCallback(async (id: string, d: Partial<Dog>) => {
    const update: any = {};
    if (d.name !== undefined) update.name = d.name;
    if (d.breed !== undefined) update.breed = d.breed;
    if (d.age !== undefined) update.age = d.age;
    if ((d as any).ageMonths !== undefined) update.age_months = (d as any).ageMonths;
    if (d.weight !== undefined) update.weight = d.weight;
    if (d.gender !== undefined) update.gender = d.gender;
    if (d.ownerId !== undefined) update.owner_id = d.ownerId;
    if (d.specialNeeds !== undefined) update.special_needs = d.specialNeeds;
    if (d.feedingInstructions !== undefined) update.feeding_instructions = d.feedingInstructions;
    if (d.medications !== undefined) update.medications = d.medications;
    if (d.vaccinated !== undefined) update.vaccinated = d.vaccinated;
    if (d.neutered !== undefined) update.neutered = d.neutered;
    if (d.photoUrl !== undefined) update.photo_url = d.photoUrl;
    if ((d as any).animalType !== undefined) update.animal_type = (d as any).animalType;
    if (d.vaccinePhotoUrl !== undefined) update.vaccine_photo_url = d.vaccinePhotoUrl;
    const { error } = await supabase.from('foster_dogs' as any).update(update).eq('id', id);
    if (error) { toast.error('Failed to update foster dog'); return; }
    await fetchDogs();
  }, [fetchDogs]);

  const deleteDog = useCallback(async (id: string) => {
    const { error } = await supabase.from('foster_dogs' as any).delete().eq('id', id);
    if (error) { toast.error('Failed to delete foster dog'); return; }
    await fetchDogs();
  }, [fetchDogs]);

  return { fosterDogs: dogs, addFosterDog: addDog, updateFosterDog: updateDog, deleteFosterDog: deleteDog };
}
