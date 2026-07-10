import { useEffect, useMemo, useState } from 'react';
import { Owner, Dog, Boarding, Foster } from '@/types/boarding';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, PawPrint, Save, CalendarClock, History, IndianRupee, Phone, MapPin, Mail } from 'lucide-react';
import { calcBilling } from '@/lib/billing';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  owner: Owner | null;
  dogs: Dog[];
  boardings: Boarding[];
  fosters?: Foster[];
  onUpdate: (id: string, data: Partial<Owner>) => void;
  onOpenPet?: (dogId: string) => void;
}

export default function OwnerProfile360({ open, onOpenChange, owner, dogs, boardings, fosters = [], onUpdate, onOpenPet }: Props) {
  const [state, setState] = useState<Owner | null>(owner);
  useEffect(() => { setState(owner); }, [owner?.id, open]);

  const ownedDogs = useMemo(() => (owner ? dogs.filter(d => d.ownerId === owner.id) : []), [owner?.id, dogs]);

  const stats = useMemo(() => {
    if (!owner) return { spend: 0, paid: 0, pending: 0, upcoming: [] as Array<any>, past: [] as Array<any>, totalBookings: 0 };
    const now = new Date().toISOString().slice(0, 10);
    const upcoming: any[] = []; const past: any[] = [];
    let spend = 0, paid = 0, pending = 0;
    boardings.filter(b => b.ownerId === owner.id).forEach(b => {
      const bill = calcBilling(b);
      spend += bill.total; paid += b.paidAmount || 0;
      if (b.status !== 'cancelled') pending += bill.remaining;
      const dog = dogs.find(d => d.id === b.dogId);
      const row = { id: b.id, kind: 'Boarding', petName: dog?.name || '', checkIn: b.checkInDate, checkOut: b.checkOutDate, status: b.status, total: bill.total, remaining: bill.remaining };
      if (b.checkOutDate >= now && b.status !== 'checked-out' && b.status !== 'cancelled') upcoming.push(row); else past.push(row);
    });
    fosters.filter(f => f.ownerId === owner.id).forEach(f => {
      const total = (Number(f.totalCost) || 0) + (Number(f.additionalCost) || 0);
      const remaining = Math.max(0, total - (f.paidAmount || 0));
      spend += total; paid += f.paidAmount || 0;
      if (f.status !== 'cancelled') pending += remaining;
      const dog = dogs.find(d => d.id === f.dogId);
      const row = { id: f.id, kind: 'Foster', petName: dog?.name || '', checkIn: f.checkInDate, checkOut: f.checkOutDate, status: f.status, total, remaining };
      if (f.checkOutDate >= now && f.status !== 'checked-out' && f.status !== 'cancelled') upcoming.push(row); else past.push(row);
    });
    upcoming.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    past.sort((a, b) => b.checkIn.localeCompare(a.checkIn));
    return { spend, paid, pending, upcoming, past, totalBookings: upcoming.length + past.length };
  }, [owner?.id, boardings, fosters, dogs]);

  if (!state || !owner) return null;
  const s = state;
  const set = (patch: Partial<Owner>) => setState(prev => (prev ? { ...prev, ...patch } : prev));
  const save = () => { onUpdate(owner.id, s); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-display text-2xl">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
            <div className="min-w-0">
              <div className="truncate">{s.name}</div>
              <div className="text-xs text-muted-foreground font-normal flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <Card><CardContent className="p-3 text-center"><div className="text-[11px] text-muted-foreground">Lifetime Spend</div><div className="font-bold text-lg text-primary flex items-center justify-center gap-0.5"><IndianRupee className="h-4 w-4" />{stats.spend.toFixed(0)}</div></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><div className="text-[11px] text-muted-foreground">Paid</div><div className="font-bold text-lg text-emerald-600 flex items-center justify-center gap-0.5"><IndianRupee className="h-4 w-4" />{stats.paid.toFixed(0)}</div></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><div className="text-[11px] text-muted-foreground">Pending</div><div className={`font-bold text-lg flex items-center justify-center gap-0.5 ${stats.pending > 0 ? 'text-destructive' : 'text-muted-foreground'}`}><IndianRupee className="h-4 w-4" />{stats.pending.toFixed(0)}</div></CardContent></Card>
        </div>

        <Tabs defaultValue="overview" className="mt-3">
          <TabsList className="w-full flex-wrap h-auto justify-start">
            <TabsTrigger value="overview" className="gap-1.5"><User className="h-3.5 w-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="pets" className="gap-1.5"><PawPrint className="h-3.5 w-3.5" /> Pets ({ownedDogs.length})</TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Upcoming ({stats.upcoming.length})</TabsTrigger>
            <TabsTrigger value="past" className="gap-1.5"><History className="h-3.5 w-3.5" /> Past ({stats.past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={s.name} onChange={e => set({ name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={s.phone} onChange={e => set({ phone: e.target.value })} /></div>
              <div><Label>Alt Phone</Label><Input value={s.altPhone || ''} onChange={e => set({ altPhone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={s.email} onChange={e => set({ email: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Address</Label><Input value={s.address} onChange={e => set({ address: e.target.value })} /></div>
              <div><Label>City</Label><Input value={s.city || ''} onChange={e => set({ city: e.target.value })} /></div>
              <div><Label>Pincode</Label><Input value={s.pincode || ''} onChange={e => set({ pincode: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Emergency Contact</Label><Input value={s.emergencyContact} onChange={e => set({ emergencyContact: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={s.notes || ''} onChange={e => set({ notes: e.target.value })} placeholder="Anything the team should know about this customer…" /></div>
            </div>
          </TabsContent>

          <TabsContent value="pets" className="pt-4 space-y-2">
            {ownedDogs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No pets registered.</p>}
            {ownedDogs.map(d => (
              <div key={d.id} className="border rounded-md p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer" onClick={() => onOpenPet?.(d.id)}>
                <div className="flex items-center gap-3">
                  {d.photoUrl ? <img src={d.photoUrl} className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"><PawPrint className="h-4 w-4" /></div>}
                  <div>
                    <div className="font-semibold">{d.animalType === 'cat' ? '🐱 ' : '🐕 '}{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.breed} · {d.age}y {d.ageMonths ? `${d.ageMonths}m` : ''}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {d.vaccinated && <Badge className="bg-emerald-600 hover:bg-emerald-600">Vaccinated</Badge>}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="upcoming" className="pt-4 space-y-2">
            {stats.upcoming.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No upcoming stays.</p> : stats.upcoming.map((r: any) => (
              <div key={r.id} className="border rounded-md p-3 flex items-center justify-between">
                <div><div className="font-medium">{r.petName} · {r.kind}</div><div className="text-xs text-muted-foreground">{r.checkIn} → {r.checkOut} · {r.status}</div></div>
                <div className="text-right"><div className="font-semibold">₹{r.total.toFixed(0)}</div>{r.remaining > 0 && <div className="text-xs text-destructive">Due ₹{r.remaining.toFixed(0)}</div>}</div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="past" className="pt-4 space-y-2">
            {stats.past.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No past stays.</p> : stats.past.map((r: any) => (
              <div key={r.id} className="border rounded-md p-3 flex items-center justify-between">
                <div><div className="font-medium">{r.petName} · {r.kind}</div><div className="text-xs text-muted-foreground">{r.checkIn} → {r.checkOut} · {r.status}</div></div>
                <div className="text-right"><div className="font-semibold">₹{r.total.toFixed(0)}</div>{r.remaining > 0 && <div className="text-xs text-destructive">Due ₹{r.remaining.toFixed(0)}</div>}</div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={save}><Save className="h-4 w-4 mr-2" /> Save Profile</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
