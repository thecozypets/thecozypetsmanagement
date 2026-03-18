import { useState, useCallback, useEffect } from 'react';
import { Owner, Dog, Boarding } from '@/types/boarding';

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useOwners() {
  const [owners, setOwners] = useState<Owner[]>(() => loadFromStorage('boarding_owners', []));
  useEffect(() => saveToStorage('boarding_owners', owners), [owners]);

  const addOwner = useCallback((owner: Omit<Owner, 'id' | 'createdAt'>) => {
    const newOwner: Owner = { ...owner, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setOwners(prev => [...prev, newOwner]);
    return newOwner;
  }, []);

  const updateOwner = useCallback((id: string, data: Partial<Owner>) => {
    setOwners(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
  }, []);

  const deleteOwner = useCallback((id: string) => {
    setOwners(prev => prev.filter(o => o.id !== id));
  }, []);

  return { owners, addOwner, updateOwner, deleteOwner };
}

export function useDogs() {
  const [dogs, setDogs] = useState<Dog[]>(() => loadFromStorage('boarding_dogs', []));
  useEffect(() => saveToStorage('boarding_dogs', dogs), [dogs]);

  const addDog = useCallback((dog: Omit<Dog, 'id' | 'createdAt'>) => {
    const newDog: Dog = { ...dog, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setDogs(prev => [...prev, newDog]);
    return newDog;
  }, []);

  const updateDog = useCallback((id: string, data: Partial<Dog>) => {
    setDogs(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  }, []);

  const deleteDog = useCallback((id: string) => {
    setDogs(prev => prev.filter(d => d.id !== id));
  }, []);

  return { dogs, addDog, updateDog, deleteDog };
}

export function useBoardings() {
  const [boardings, setBoardings] = useState<Boarding[]>(() => loadFromStorage('boarding_reservations', []));
  useEffect(() => saveToStorage('boarding_reservations', boardings), [boardings]);

  const addBoarding = useCallback((boarding: Omit<Boarding, 'id' | 'createdAt'>) => {
    const newBoarding: Boarding = { ...boarding, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setBoardings(prev => [...prev, newBoarding]);
    return newBoarding;
  }, []);

  const updateBoarding = useCallback((id: string, data: Partial<Boarding>) => {
    setBoardings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  }, []);

  const deleteBoarding = useCallback((id: string) => {
    setBoardings(prev => prev.filter(b => b.id !== id));
  }, []);

  return { boardings, addBoarding, updateBoarding, deleteBoarding };
}
