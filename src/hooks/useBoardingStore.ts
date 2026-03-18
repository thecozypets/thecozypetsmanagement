import { useState, useCallback, useEffect } from 'react';
import { Owner, Dog, Boarding } from '@/types/boarding';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useOwners() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOwners = useCallback(async () => {
    const { data, error } = await supabase.from('owners').select('*').order('created_at', { ascending: false });
    if (error) { toast({ title: 'Error loading owners', description: error.message, variant: 'destructive' }); return; }
    setOwners((data || []).map(o => ({
      id: o.id, name: o.name, phone: o.phone, email: o.email || '', address: o.address || '',
      emergencyContact: o.emergency_contact || '', createdAt: o.created_at,
    })));
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  const addOwner = useCallback(async (owner: Omit<Owner, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('owners').insert({
      user_id: user.id, name: owner.name, phone: owner.phone, email: owner.email,
      address: owner.address, emergency_contact: owner.emergencyContact,
    }).select().single();
    if (error) { toast({ title: 'Error adding owner', description: error.message, variant: 'destructive' }); return null; }
    const newOwner: Owner = { id: data.id, name: data.name, phone: data.phone, email: data.email || '', address: data.address || '', emergencyContact: data.emergency_contact || '', createdAt: data.created_at };
    setOwners(prev => [newOwner, ...prev]);
    return newOwner;
  }, [toast]);

  const updateOwner = useCallback(async (id: string, updates: Partial<Owner>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.emergencyContact !== undefined) dbUpdates.emergency_contact = updates.emergencyContact;
    const { error } = await supabase.from('owners').update(dbUpdates).eq('id', id);
    if (error) { toast({ title: 'Error updating owner', description: error.message, variant: 'destructive' }); return; }
    setOwners(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, [toast]);

  const deleteOwner = useCallback(async (id: string) => {
    const { error } = await supabase.from('owners').delete().eq('id', id);
    if (error) { toast({ title: 'Error deleting owner', description: error.message, variant: 'destructive' }); return; }
    setOwners(prev => prev.filter(o => o.id !== id));
  }, [toast]);

  return { owners, loading, addOwner, updateOwner, deleteOwner };
}

export function useDogs() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDogs = useCallback(async () => {
    const { data, error } = await supabase.from('dogs').select('*').order('created_at', { ascending: false });
    if (error) { toast({ title: 'Error loading dogs', description: error.message, variant: 'destructive' }); return; }
    setDogs((data || []).map(d => ({
      id: d.id, name: d.name, breed: d.breed || '', age: d.age || 0, weight: Number(d.weight) || 0,
      gender: (d.gender as 'male' | 'female') || 'male', ownerId: d.owner_id,
      specialNeeds: d.special_needs || '', feedingInstructions: d.feeding_instructions || '',
      medications: d.medications || '', vaccinated: d.vaccinated || false, neutered: d.neutered || false,
      photoUrl: d.photo_url || '', createdAt: d.created_at,
    })));
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchDogs(); }, [fetchDogs]);

  const addDog = useCallback(async (dog: Omit<Dog, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('dogs').insert({
      user_id: user.id, owner_id: dog.ownerId, name: dog.name, breed: dog.breed,
      age: dog.age, weight: dog.weight, gender: dog.gender, special_needs: dog.specialNeeds,
      feeding_instructions: dog.feedingInstructions, medications: dog.medications,
      vaccinated: dog.vaccinated, neutered: dog.neutered, photo_url: dog.photoUrl,
    }).select().single();
    if (error) { toast({ title: 'Error adding dog', description: error.message, variant: 'destructive' }); return null; }
    const newDog: Dog = {
      id: data.id, name: data.name, breed: data.breed || '', age: data.age || 0, weight: Number(data.weight) || 0,
      gender: (data.gender as 'male' | 'female') || 'male', ownerId: data.owner_id,
      specialNeeds: data.special_needs || '', feedingInstructions: data.feeding_instructions || '',
      medications: data.medications || '', vaccinated: data.vaccinated || false, neutered: data.neutered || false,
      photoUrl: data.photo_url || '', createdAt: data.created_at,
    };
    setDogs(prev => [newDog, ...prev]);
    return newDog;
  }, [toast]);

  const updateDog = useCallback(async (id: string, updates: Partial<Dog>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.breed !== undefined) dbUpdates.breed = updates.breed;
    if (updates.age !== undefined) dbUpdates.age = updates.age;
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
    if (updates.specialNeeds !== undefined) dbUpdates.special_needs = updates.specialNeeds;
    if (updates.feedingInstructions !== undefined) dbUpdates.feeding_instructions = updates.feedingInstructions;
    if (updates.medications !== undefined) dbUpdates.medications = updates.medications;
    if (updates.vaccinated !== undefined) dbUpdates.vaccinated = updates.vaccinated;
    if (updates.neutered !== undefined) dbUpdates.neutered = updates.neutered;
    if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;
    const { error } = await supabase.from('dogs').update(dbUpdates).eq('id', id);
    if (error) { toast({ title: 'Error updating dog', description: error.message, variant: 'destructive' }); return; }
    setDogs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, [toast]);

  const deleteDog = useCallback(async (id: string) => {
    const { error } = await supabase.from('dogs').delete().eq('id', id);
    if (error) { toast({ title: 'Error deleting dog', description: error.message, variant: 'destructive' }); return; }
    setDogs(prev => prev.filter(d => d.id !== id));
  }, [toast]);

  return { dogs, loading, addDog, updateDog, deleteDog };
}

export function useBoardings() {
  const [boardings, setBoardings] = useState<Boarding[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBoardings = useCallback(async () => {
    const { data, error } = await supabase.from('boardings').select('*').order('created_at', { ascending: false });
    if (error) { toast({ title: 'Error loading boardings', description: error.message, variant: 'destructive' }); return; }
    setBoardings((data || []).map(b => ({
      id: b.id, dogId: b.dog_id, ownerId: b.owner_id, checkInDate: b.check_in_date,
      checkOutDate: b.check_out_date, status: b.status as Boarding['status'],
      kennelNumber: b.kennel_number || '', dailyRate: Number(b.daily_rate) || 0,
      totalCost: Number(b.total_cost) || 0, specialRequests: b.special_requests || '',
      feedingSchedule: b.feeding_schedule || '', notes: b.notes || '', createdAt: b.created_at,
    })));
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchBoardings(); }, [fetchBoardings]);

  const addBoarding = useCallback(async (boarding: Omit<Boarding, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('boardings').insert({
      user_id: user.id, dog_id: boarding.dogId, owner_id: boarding.ownerId,
      check_in_date: boarding.checkInDate, check_out_date: boarding.checkOutDate,
      status: boarding.status, kennel_number: boarding.kennelNumber,
      daily_rate: boarding.dailyRate, total_cost: boarding.totalCost,
      special_requests: boarding.specialRequests, feeding_schedule: boarding.feedingSchedule,
      notes: boarding.notes,
    }).select().single();
    if (error) { toast({ title: 'Error adding boarding', description: error.message, variant: 'destructive' }); return null; }
    const newBoarding: Boarding = {
      id: data.id, dogId: data.dog_id, ownerId: data.owner_id,
      checkInDate: data.check_in_date, checkOutDate: data.check_out_date,
      status: data.status as Boarding['status'], kennelNumber: data.kennel_number || '',
      dailyRate: Number(data.daily_rate) || 0, totalCost: Number(data.total_cost) || 0,
      specialRequests: data.special_requests || '', feedingSchedule: data.feeding_schedule || '',
      notes: data.notes || '', createdAt: data.created_at,
    };
    setBoardings(prev => [newBoarding, ...prev]);
    return newBoarding;
  }, [toast]);

  const updateBoarding = useCallback(async (id: string, updates: Partial<Boarding>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.dogId !== undefined) dbUpdates.dog_id = updates.dogId;
    if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
    if (updates.checkInDate !== undefined) dbUpdates.check_in_date = updates.checkInDate;
    if (updates.checkOutDate !== undefined) dbUpdates.check_out_date = updates.checkOutDate;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.kennelNumber !== undefined) dbUpdates.kennel_number = updates.kennelNumber;
    if (updates.dailyRate !== undefined) dbUpdates.daily_rate = updates.dailyRate;
    if (updates.totalCost !== undefined) dbUpdates.total_cost = updates.totalCost;
    if (updates.specialRequests !== undefined) dbUpdates.special_requests = updates.specialRequests;
    if (updates.feedingSchedule !== undefined) dbUpdates.feeding_schedule = updates.feedingSchedule;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    const { error } = await supabase.from('boardings').update(dbUpdates).eq('id', id);
    if (error) { toast({ title: 'Error updating boarding', description: error.message, variant: 'destructive' }); return; }
    setBoardings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, [toast]);

  const deleteBoarding = useCallback(async (id: string) => {
    const { error } = await supabase.from('boardings').delete().eq('id', id);
    if (error) { toast({ title: 'Error deleting boarding', description: error.message, variant: 'destructive' }); return; }
    setBoardings(prev => prev.filter(b => b.id !== id));
  }, [toast]);

  return { boardings, loading, addBoarding, updateBoarding, deleteBoarding };
}
