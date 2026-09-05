import { useEffect, useMemo, useState } from 'react';
import { Dog, Owner, Boarding, Foster, VaccineRecord, MedicationRecord } from '@/types/boarding';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PawPrint, Plus, Trash2, Save, ShieldCheck, Stethoscope, Utensils, Smile, Phone, History, Cake, Weight, Heart, User } from 'lucide-react';
import { calcBilling } from '@/lib/billing';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dog: Dog | null;
  owner: Owner | null;
  boardings: Boarding[];
  fosters?: Foster[];
  onUpdate: (id: string, data: Partial<Dog>) => void;
}

const PRESET_BEHAVIOUR = [
  'Friendly', 'Anxious', 'Kid-safe', 'Cat-safe', 'Dog-safe', 'Aggressive to dogs',
  'Aggressive to strangers', 'Escapes', 'Barks a lot', 'Shy', 'Playful', 'Loves treats',
];

const daysUntil = (iso: string) => {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  const now = Date.now();
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
};

const expiryBadge = (expiry: string) => {
  const days = daysUntil(expiry);
  if (days === null) return null;
  if (days < 0) return <Badge variant="destructive">Expired {Math.abs(days)}d ago</Badge>;
  if (days < 60) return <Badge className="bg-amber-500 hover:bg-amber-500 text-white">Expires in {days}d</Badge>;
  return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">Valid {days}d</Badge>;
};

export default function PetProfile360({ open, onOpenChange, dog, owner, boardings, fosters = [], onUpdate }: Props) {
  const [state, setState] = useState<Dog | null>(dog);

  useEffect(() => { setState(dog); }, [dog?.id, open]);

  const history = useMemo(() => {
    if (!dog) return { stays: [] as Array<{ id: string; label: string; checkIn: string; checkOut: string; total: number; paid: number; kind: 'Boarding' | 'Foster' }>, lifetimeSpend: 0, lifetimePaid: 0, count: 0 };
    const stays: Array<{ id: string; label: string; checkIn: string; checkOut: string; total: number; paid: number; kind: 'Boarding' | 'Foster' }> = [];
    boardings.filter(b => b.dogId === dog.id).forEach(b => {
      const bill = calcBilling(b);
      stays.push({ id: b.id, label: b.status, checkIn: b.checkInDate, checkOut: b.checkOutDate, total: bill.total, paid: b.paidAmount || 0, kind: 'Boarding' });
    });
    fosters.filter(f => f.dogId === dog.id).forEach(f => {
      const total = (Number(f.totalCost) || 0) + (Number(f.additionalCost) || 0);
      stays.push({ id: f.id, label: f.status, checkIn: f.checkInDate, checkOut: f.checkOutDate, total, paid: f.paidAmount || 0, kind: 'Foster' });
    });
    stays.sort((a, b) => b.checkIn.localeCompare(a.checkIn));
    const lifetimeSpend = stays.reduce((s, x) => s + x.total, 0);
    const lifetimePaid = stays.reduce((s, x) => s + x.paid, 0);
    return { stays, lifetimeSpend, lifetimePaid, count: stays.length };
  }, [dog?.id, boardings, fosters]);

  if (!state || !dog) return null;

  const s = state;
  const set = (patch: Partial<Dog>) => setState(prev => (prev ? { ...prev, ...patch } : prev));

  const toggleTag = (tag: string) => {
    const cur = new Set(s.behaviourTags || []);
    if (cur.has(tag)) cur.delete(tag); else cur.add(tag);
    set({ behaviourTags: Array.from(cur) });
  };

  const addVaccine = () => set({ vaccines: [...(s.vaccines || []), { name: '', date: '', expiry: '' }] });
  const updateVaccine = (i: number, patch: Partial<VaccineRecord>) => {
    const list = [...(s.vaccines || [])]; list[i] = { ...list[i], ...patch }; set({ vaccines: list });
  };
  const removeVaccine = (i: number) => { const list = [...(s.vaccines || [])]; list.splice(i, 1); set({ vaccines: list }); };

  const addMed = () => set({ currentMedications: [...(s.currentMedications || []), { name: '', dosage: '', frequency: '' }] });
  const updateMed = (i: number, patch: Partial<MedicationRecord>) => {
    const list = [...(s.currentMedications || [])]; list[i] = { ...list[i], ...patch }; set({ currentMedications: list });
  };
  const removeMed = (i: number) => { const list = [...(s.currentMedications || [])]; list.splice(i, 1); set({ currentMedications: list }); };

  const save = () => {
    onUpdate(dog.id, s);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-t-lg bg-[var(--gradient-warm)]">
          <div className="absolute inset-0 paw-pattern opacity-60" />
          <div className="absolute -right-6 -top-8 opacity-15 rotate-12">
            <PawPrint className="h-40 w-40 text-primary-foreground" />
          </div>
          <div className="relative px-5 sm:px-8 pt-8 pb-16 sm:pb-20" />
        </div>

        <div className="relative px-4 sm:px-8 -mt-14 sm:-mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="shrink-0">
              {s.photoUrl ? (
                <img
                  src={s.photoUrl}
                  alt={s.name}
                  className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl object-cover border-4 border-card shadow-[var(--shadow-paw)]"
                />
              ) : (
                <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl bg-secondary border-4 border-card shadow-[var(--shadow-paw)] flex items-center justify-center">
                  <PawPrint className="h-12 w-12 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-2xl sm:text-3xl font-bold truncate">
                  {s.animalType === 'cat' ? '🐱' : '🐕'} {s.name}
                </h2>
                {(s.behaviourTags || []).slice(0, 2).map(t => (
                  <Badge key={t} variant="secondary" className="text-[11px]">{t}</Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {s.breed || 'Mixed breed'}{s.color ? ` · ${s.color}` : ''}
              </p>
              {owner && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-foreground">{owner.name}</span>
                  {owner.phone && <span>· {owner.phone}</span>}
                </div>
              )}
            </div>
          </div>

          {/* HERO STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <div className="surface-card p-3 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0"><Cake className="h-4 w-4 text-primary" /></div>
              <div className="min-w-0"><div className="text-[11px] text-muted-foreground">Age</div><div className="font-bold text-sm truncate">{s.age}y {s.ageMonths}m</div></div>
            </div>
            <div className="surface-card p-3 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0"><Weight className="h-4 w-4 text-primary" /></div>
              <div className="min-w-0"><div className="text-[11px] text-muted-foreground">Weight</div><div className="font-bold text-sm truncate">{s.weight} kg</div></div>
            </div>
            <div className="surface-card p-3 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0"><Heart className="h-4 w-4 text-primary" /></div>
              <div className="min-w-0"><div className="text-[11px] text-muted-foreground">Gender</div><div className="font-bold text-sm truncate capitalize">{s.gender || '—'}</div></div>
            </div>
            <div className="surface-card p-3 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0"><History className="h-4 w-4 text-primary" /></div>
              <div className="min-w-0"><div className="text-[11px] text-muted-foreground">Total Stays</div><div className="font-bold text-sm truncate">{history.count}</div></div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="basic" className="mt-4 px-4 sm:px-8">
          <TabsList className="w-full flex-wrap h-auto justify-start">
            <TabsTrigger value="basic" className="gap-1.5"><PawPrint className="h-3.5 w-3.5" /> Basic</TabsTrigger>
            <TabsTrigger value="medical" className="gap-1.5"><Stethoscope className="h-3.5 w-3.5" /> Medical</TabsTrigger>
            <TabsTrigger value="behaviour" className="gap-1.5"><Smile className="h-3.5 w-3.5" /> Behaviour</TabsTrigger>
            <TabsTrigger value="feeding" className="gap-1.5"><Utensils className="h-3.5 w-3.5" /> Feeding</TabsTrigger>
            <TabsTrigger value="emergency" className="gap-1.5"><Phone className="h-3.5 w-3.5" /> Vet & SOS</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> History</TabsTrigger>
          </TabsList>

          {/* BASIC */}
          <TabsContent value="basic" className="space-y-3 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={s.name} onChange={e => set({ name: e.target.value })} /></div>
              <div><Label>Breed</Label><Input value={s.breed} onChange={e => set({ breed: e.target.value })} /></div>
              <div><Label>Color</Label><Input value={s.color || ''} onChange={e => set({ color: e.target.value })} placeholder="e.g. Golden, Black & White" /></div>
              <div><Label>Microchip ID</Label><Input value={s.microchipId || ''} onChange={e => set({ microchipId: e.target.value })} /></div>
              <div><Label>Age (years)</Label><Input type="number" min={0} value={s.age} onChange={e => set({ age: +e.target.value })} /></div>
              <div><Label>Months</Label><Input type="number" min={0} max={11} value={s.ageMonths} onChange={e => set({ ageMonths: Math.min(11, Math.max(0, +e.target.value)) })} /></div>
              <div><Label>Weight (kg)</Label><Input type="number" min={0} step={0.1} value={s.weight} onChange={e => set({ weight: +e.target.value })} /></div>
              <div><Label>Gender</Label><Input value={s.gender} readOnly className="opacity-70" /></div>
            </div>
          </TabsContent>

          {/* MEDICAL */}
          <TabsContent value="medical" className="space-y-4 pt-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Vaccines</div>
                  <Button size="sm" variant="outline" onClick={addVaccine}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
                </div>
                {(s.vaccines || []).length === 0 && <p className="text-sm text-muted-foreground">No vaccines recorded.</p>}
                {(s.vaccines || []).map((v, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border rounded-md p-2">
                    <div className="sm:col-span-4"><Label className="text-xs">Vaccine</Label><Input placeholder="Rabies / DHPP / Kennel Cough" value={v.name} onChange={e => updateVaccine(i, { name: e.target.value })} /></div>
                    <div className="sm:col-span-3"><Label className="text-xs">Given</Label><Input type="date" value={v.date} onChange={e => updateVaccine(i, { date: e.target.value })} /></div>
                    <div className="sm:col-span-3"><Label className="text-xs">Expires</Label><Input type="date" value={v.expiry} onChange={e => updateVaccine(i, { expiry: e.target.value })} /></div>
                    <div className="sm:col-span-2 flex items-center justify-between gap-1">
                      {v.expiry && expiryBadge(v.expiry)}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeVaccine(i)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Last Deworming</Label><Input type="date" value={s.dewormingDate || ''} onChange={e => set({ dewormingDate: e.target.value })} /></div>
              <div><Label>Last Tick & Flea Treatment</Label><Input type="date" value={s.tickFleaDate || ''} onChange={e => set({ tickFleaDate: e.target.value })} /></div>
            </div>
            <div><Label>Allergies</Label><Textarea value={s.allergies || ''} onChange={e => set({ allergies: e.target.value })} placeholder="Food, environmental, medication…" /></div>
            <div><Label>Medical Conditions</Label><Textarea value={s.medicalConditions || ''} onChange={e => set({ medicalConditions: e.target.value })} /></div>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Current Medications</div>
                  <Button size="sm" variant="outline" onClick={addMed}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
                </div>
                {(s.currentMedications || []).length === 0 && <p className="text-sm text-muted-foreground">No medications.</p>}
                {(s.currentMedications || []).map((m, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border rounded-md p-2">
                    <div className="sm:col-span-4"><Label className="text-xs">Name</Label><Input value={m.name} onChange={e => updateMed(i, { name: e.target.value })} /></div>
                    <div className="sm:col-span-3"><Label className="text-xs">Dosage</Label><Input value={m.dosage} onChange={e => updateMed(i, { dosage: e.target.value })} /></div>
                    <div className="sm:col-span-3"><Label className="text-xs">Frequency</Label><Input placeholder="e.g. 2x daily" value={m.frequency} onChange={e => updateMed(i, { frequency: e.target.value })} /></div>
                    <div className="sm:col-span-2 flex justify-end"><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeMed(i)}><Trash2 className="h-4 w-4" /></Button></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BEHAVIOUR */}
          <TabsContent value="behaviour" className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground">Tap tags that describe this pet. These help staff prepare the right kennel and handling approach.</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_BEHAVIOUR.map(tag => {
                const active = (s.behaviourTags || []).includes(tag);
                const isWarn = /aggressive|escapes|barks|anxious/i.test(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      active
                        ? isWarn
                          ? 'bg-destructive text-destructive-foreground border-destructive'
                          : 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >{tag}</button>
                );
              })}
            </div>
            <div className="pt-2">
              <Label>Add custom tag</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Press Enter to add"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v && !(s.behaviourTags || []).includes(v)) set({ behaviourTags: [...(s.behaviourTags || []), v] });
                      (e.target as HTMLInputElement).value = '';
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              {(s.behaviourTags || []).filter(t => !PRESET_BEHAVIOUR.includes(t)).length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {(s.behaviourTags || []).filter(t => !PRESET_BEHAVIOUR.includes(t)).map(t => (
                    <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => toggleTag(t)}>{t} ✕</Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* FEEDING */}
          <TabsContent value="feeding" className="space-y-3 pt-4">
            <div><Label>Food Brand / Type</Label><Input value={s.feedingFood || ''} onChange={e => set({ feedingFood: e.target.value })} placeholder="e.g. Royal Canin Adult" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Feeding Times</Label><Input value={s.feedingTimes || ''} onChange={e => set({ feedingTimes: e.target.value })} placeholder="e.g. 8am, 1pm, 7pm" /></div>
              <div><Label>Portions</Label><Input value={s.feedingPortions || ''} onChange={e => set({ feedingPortions: e.target.value })} placeholder="e.g. 1 cup per meal" /></div>
            </div>
            <div><Label>Additional Instructions</Label><Textarea value={s.feedingInstructions || ''} onChange={e => set({ feedingInstructions: e.target.value })} /></div>
          </TabsContent>

          {/* EMERGENCY */}
          <TabsContent value="emergency" className="space-y-3 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Vet Name</Label><Input value={s.vetName || ''} onChange={e => set({ vetName: e.target.value })} /></div>
              <div><Label>Vet Clinic</Label><Input value={s.vetClinic || ''} onChange={e => set({ vetClinic: e.target.value })} /></div>
              <div><Label>Vet Phone</Label><Input value={s.vetPhone || ''} onChange={e => set({ vetPhone: e.target.value })} /></div>
              <div />
              <div><Label>Emergency Contact Name</Label><Input value={s.emergencyContactName || ''} onChange={e => set({ emergencyContactName: e.target.value })} /></div>
              <div><Label>Emergency Contact Phone</Label><Input value={s.emergencyContactPhone || ''} onChange={e => set({ emergencyContactPhone: e.target.value })} /></div>
            </div>
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history" className="space-y-3 pt-4">
            <div className="grid grid-cols-3 gap-2">
              <Card><CardContent className="p-3 text-center"><div className="text-xs text-muted-foreground">Total Stays</div><div className="font-bold text-lg">{history.count}</div></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><div className="text-xs text-muted-foreground">Lifetime Spend</div><div className="font-bold text-lg text-primary">₹{history.lifetimeSpend.toFixed(0)}</div></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><div className="text-xs text-muted-foreground">Paid</div><div className="font-bold text-lg text-emerald-600">₹{history.lifetimePaid.toFixed(0)}</div></CardContent></Card>
            </div>
            {history.stays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No stays yet.</p>
            ) : (
              <div className="space-y-2">
                {history.stays.map(st => (
                  <div key={st.id} className="border rounded-md p-2 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{st.kind} · {st.checkIn} → {st.checkOut}</div>
                      <div className="text-xs text-muted-foreground capitalize">{st.label}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{st.total.toFixed(0)}</div>
                      <div className="text-xs text-emerald-600">Paid ₹{st.paid.toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 px-4 sm:px-8 py-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}><Save className="h-4 w-4 mr-2" /> Save Profile</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
