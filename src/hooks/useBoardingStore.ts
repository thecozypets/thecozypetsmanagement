import { useState, useCallback, useEffect } from 'react';
import { Owner, Dog, Boarding } from '@/types/boarding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useOwners() {
  const [owners, setOwners] = useState<Owner[]>([]);

  const fetchOwners = useCallback(async () => {
    const { data, error } = await supabase.from('owners').select('*');
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
    const { data, error } = await supabase.from('dogs').select('*');
    if (error) { toast.error('Failed to load dogs'); return; }
    setDogs((data || []).map(r => ({
      id: r.id, name: r.name, breed: r.breed, age: r.age, weight: Number(r.weight),
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
      name: dog.name, breed: dog.breed, age: dog.age, weight: dog.weight,
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
    if (d.weight !== undefined) update.weight = d.weight;
    if (d.gender !== undefined) update.gender = d.gender;
    if (d.ownerId !== undefined) update.owner_id = d.ownerId;
    if (d.specialNeeds !== undefined) update.special_needs = d.specialNeeds;
    if (d.feedingInstructions !== undefined) update.feeding_instructions = d.feedingInstructions;
    if (d.medications !== undefined) update.medications = d.medications;
    if (d.vaccinated !== undefined) update.vaccinated = d.vaccinated;
    if (d.neutered !== undefined) update.neutered = d.neutered;
    if (d.photoUrl !== undefined) update.photo_url = d.photoUrl;
    const { error } = await supabase.from('dogs').update(update).eq('id', id);
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
    const { data, error } = await supabase.from('boardings').select('*');
    if (error) { toast.error('Failed to load boardings'); return; }
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
        specialRequests: r.special_requests || '', feedingSchedule: r.feeding_schedule || '',
        notes: r.notes || '', createdAt: r.created_at,
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
      total_cost: boarding.totalCost, special_requests: boarding.specialRequests || null,
      feeding_schedule: boarding.feedingSchedule || null, notes: boarding.notes || null, user_id: user.id,
    }).select().single();
    if (error) { toast.error('Failed to add boarding'); return null; }
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
    if (d.specialRequests !== undefined) update.special_requests = d.specialRequests;
    if (d.feedingSchedule !== undefined) update.feeding_schedule = d.feedingSchedule;
    if (d.notes !== undefined) update.notes = d.notes;
    const { error } = await supabase.from('boardings').update(update).eq('id', id);
    if (error) { toast.error('Failed to update boarding'); return; }
    await fetchBoardings();
  }, [fetchBoardings]);

  const deleteBoarding = useCallback(async (id: string) => {
    const { error } = await supabase.from('boardings').delete().eq('id', id);
    if (error) { toast.error('Failed to delete boarding'); return; }
    await fetchBoardings();
  }, [fetchBoardings]);

  return { boardings, addBoarding, updateBoarding, deleteBoarding };
}
