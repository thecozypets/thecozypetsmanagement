import { useState } from 'react';
import { Dog, Owner, Boarding, BoardingStatus, Foster } from '@/types/boarding';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, PawPrint, CalendarCheck, DollarSign, Phone, Mail, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { calcBilling } from '@/lib/billing';

const statusColors: Record<BoardingStatus, string> = {
  'reserved': 'bg-warning text-warning-foreground border-transparent font-bold uppercase tracking-wide',
  'checked-in': 'bg-success text-success-foreground border-transparent font-bold uppercase tracking-wide',
  'checked-out': 'bg-muted text-foreground border-transparent font-bold uppercase tracking-wide',
  'cancelled': 'bg-destructive text-destructive-foreground border-transparent font-bold uppercase tracking-wide',
};

interface Props {
  owners: Owner[];
  dogs: Dog[];
  boardings: Boarding[];
  fosters: Foster[];
  fosterOwners: Owner[];
  fosterDogs: Dog[];
  onClickOwner: (ownerId: string) => void;
  onClickDog: (dogId: string) => void;
  onClickBoarding: (boardingId: string) => void;
  onClickFosterOwner: (ownerId: string) => void;
  onClickFosterDog: (dogId: string) => void;
}

type DrilldownType = 'b-owners' | 'b-dogs' | 'f-owners' | 'f-dogs' | 'b-active' | 'b-revenue' | 'b-reserved' | 'b-completed' | 'b-cancelled' | 'f-active' | 'f-revenue' | 'f-reserved' | 'f-completed' | 'f-cancelled' | null;

export default function Dashboard({ owners, dogs, boardings, fosters, fosterOwners, fosterDogs, onClickOwner, onClickDog, onClickBoarding, onClickFosterOwner, onClickFosterDog }: Props) {
  const [drilldown, setDrilldown] = useState<DrilldownType>(null);

  const bActive = boardings.filter(b => b.status === 'checked-in');
  const bReserved = boardings.filter(b => b.status === 'reserved');
  const bCompleted = boardings.filter(b => b.status === 'checked-out');
  const bCancelled = boardings.filter(b => b.status === 'cancelled');
  const bPaid = boardings.filter(b => b.status !== 'cancelled');
  const bRevenue = bPaid.reduce((s, b) => s + calcBilling(b).total, 0);
  const bPaidAmt = bPaid.reduce((s, b) => s + calcBilling(b).paid, 0);

  const fActive = fosters.filter(f => f.status === 'checked-in');
  const fReserved = fosters.filter(f => f.status === 'reserved');
  const fCompleted = fosters.filter(f => f.status === 'checked-out');
  const fCancelled = fosters.filter(f => f.status === 'cancelled');
  const fPaid = fosters.filter(f => f.status !== 'cancelled');
  const fRevenue = fPaid.reduce((s, f) => s + calcBilling(f).total, 0);
  const fPaidAmt = fPaid.reduce((s, f) => s + calcBilling(f).paid, 0);

  const getDogName = (id: string, list: Dog[]) => list.find(d => d.id === id)?.name || 'Unknown';
  const getOwnerName = (id: string, list: Owner[]) => list.find(o => o.id === id)?.name || 'Unknown';

  const drilldownTitle: Record<string, string> = {
    'b-owners': 'Boarding Owners', 'b-dogs': 'Boarding Dogs',
    'f-owners': 'Foster Owners', 'f-dogs': 'Foster Dogs/Cats',
    'b-active': 'Active Boardings', 'b-revenue': 'Boarding Revenue',
    'b-reserved': 'Reserved Boardings', 'b-completed': 'Completed Boardings', 'b-cancelled': 'Cancelled Boardings',
    'f-active': 'Active Fosters', 'f-revenue': 'Foster Revenue',
    'f-reserved': 'Reserved Fosters', 'f-completed': 'Completed Fosters', 'f-cancelled': 'Cancelled Fosters',
  };

  const renderOwnerList = (list: Owner[], onClick: (id: string) => void) =>
    list.length === 0 ? <p className="text-sm text-muted-foreground">No owners.</p> : (
      <div className="space-y-2">
        {list.map(o => (
          <Card key={o.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrilldown(null); onClick(o.id); }}>
            <CardContent className="p-3">
              <p className="font-display font-semibold">{o.name}</p>
              <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                {o.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{o.phone}</span>}
                {o.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{o.email}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );

  const renderDogList = (list: Dog[], ownerList: Owner[], onClick: (id: string) => void) =>
    list.length === 0 ? <p className="text-sm text-muted-foreground">No pets.</p> : (
      <div className="space-y-2">
        {list.map(d => (
          <Card key={d.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrilldown(null); onClick(d.id); }}>
            <CardContent className="p-3 flex items-center gap-3">
              {d.photoUrl ? (
                <img src={d.photoUrl} alt={d.name} className="h-10 w-10 rounded-full object-cover border border-border shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0"><PawPrint className="h-4 w-4 text-muted-foreground" /></div>
              )}
              <div>
                <p className="font-display font-semibold">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.breed} · {d.age}y · Owner: {getOwnerName(d.ownerId, ownerList)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );

  const renderBookingList = (list: (Boarding | Foster)[], dogList: Dog[], ownerList: Owner[]) =>
    list.length === 0 ? <p className="text-sm text-muted-foreground">No entries.</p> : (
      <div className="space-y-2">
        {list.map(b => {
          const bill = calcBilling(b);
          return (
          <Card key={b.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrilldown(null); onClickBoarding(b.id); }}>
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">🐕 {getDogName(b.dogId, dogList)}</p>
                  <p className="text-xs text-muted-foreground">Owner: {getOwnerName(b.ownerId, ownerList)}</p>
                  <p className="text-xs text-muted-foreground">{b.checkInDate} → {b.checkOutDate}</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={`text-xs ${statusColors[b.status]}`}>{b.status}</Badge>
                  <p className="text-lg sm:text-base font-display font-extrabold text-primary">₹{bill.total.toFixed(2)}</p>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-success/15 text-success text-sm sm:text-xs font-bold">Paid ₹{bill.paid.toFixed(2)}</span>
                  {bill.remaining > 0 && <span className="block sm:inline-block sm:ml-1 px-2 py-0.5 rounded-md bg-destructive/15 text-destructive text-sm sm:text-xs font-bold">Due ₹{bill.remaining.toFixed(2)}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        );})}
      </div>
    );

  const renderRevenueList = (list: (Boarding | Foster)[], total: number, paid: number, dogList: Dog[]) => (
    <div className="space-y-2">
      <div className="space-y-1 px-1 mb-3">
        <div className="flex justify-between font-display font-bold text-lg"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-success"><span>Paid</span><span>₹{paid.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-destructive"><span>Outstanding</span><span>₹{(total - paid).toFixed(2)}</span></div>
      </div>
      {list.map(b => {
        const bill = calcBilling(b);
        return (
        <Card key={b.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrilldown(null); onClickBoarding(b.id); }}>
          <CardContent className="p-3 flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">🐕 {getDogName(b.dogId, dogList)}</p>
              <p className="text-xs text-muted-foreground">{b.checkInDate} → {b.checkOutDate}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="font-display font-extrabold text-lg sm:text-base text-primary">₹{bill.total.toFixed(2)}</p>
              <span className="inline-block px-2 py-0.5 rounded-md bg-success/15 text-success text-sm sm:text-xs font-bold">Paid ₹{bill.paid.toFixed(2)}</span>
              {bill.remaining > 0 && <span className="block sm:inline-block sm:ml-1 px-2 py-0.5 rounded-md bg-destructive/15 text-destructive text-sm sm:text-xs font-bold">Due ₹{bill.remaining.toFixed(2)}</span>}
            </div>
          </CardContent>
        </Card>
      );})}
    </div>
  );

  const renderDrilldownContent = () => {
    switch (drilldown) {
      case 'b-owners': return renderOwnerList(owners, onClickOwner);
      case 'b-dogs': return renderDogList(dogs, owners, onClickDog);
      case 'f-owners': return renderOwnerList(fosterOwners, onClickFosterOwner);
      case 'f-dogs': return renderDogList(fosterDogs, fosterOwners, onClickFosterDog);
      case 'b-active': return renderBookingList(bActive, dogs, owners);
      case 'b-reserved': return renderBookingList(bReserved, dogs, owners);
      case 'b-completed': return renderBookingList(bCompleted, dogs, owners);
      case 'b-cancelled': return renderBookingList(bCancelled, dogs, owners);
      case 'b-revenue': return bPaid.length === 0 ? <p className="text-sm text-muted-foreground">No revenue.</p> : renderRevenueList(bPaid, bRevenue, bPaidAmt, dogs);
      case 'f-active': return renderBookingList(fActive, fosterDogs, fosterOwners);
      case 'f-reserved': return renderBookingList(fReserved, fosterDogs, fosterOwners);
      case 'f-completed': return renderBookingList(fCompleted, fosterDogs, fosterOwners);
      case 'f-cancelled': return renderBookingList(fCancelled, fosterDogs, fosterOwners);
      case 'f-revenue': return fPaid.length === 0 ? <p className="text-sm text-muted-foreground">No revenue.</p> : renderRevenueList(fPaid, fRevenue, fPaidAmt, fosterDogs);
      default: return null;
    }
  };

  const renderSectionCard = (
    title: string, icon: React.ReactNode,
    ownerCount: number, dogCount: number,
    active: number, revenue: number, reserved: number, completed: number, cancelled: number,
    keys: { owners: DrilldownType; dogs: DrilldownType; active: DrilldownType; revenue: DrilldownType; reserved: DrilldownType; completed: DrilldownType; cancelled: DrilldownType }
  ) => (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">{icon}<h3 className="font-display font-extrabold text-xl sm:text-2xl">{title}</h3></div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => setDrilldown(keys.owners)}>
            <CardContent className="p-3 text-center">
              <p className="font-display text-xl font-bold text-primary">{ownerCount}</p>
              <p className="text-xs text-muted-foreground">Owners</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => setDrilldown(keys.dogs)}>
            <CardContent className="p-3 text-center">
              <p className="font-display text-xl font-bold text-accent">{dogCount}</p>
              <p className="text-xs text-muted-foreground">Pets</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => setDrilldown(keys.active)}>
            <CardContent className="p-3 text-center">
              <p className="font-display text-xl font-bold text-success">{active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => setDrilldown(keys.revenue)}>
            <CardContent className="p-3 text-center">
              <p className="font-display text-xl font-bold text-primary">₹{revenue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Reserved', value: reserved, key: keys.reserved },
            { label: 'Active', value: active, key: keys.active },
            { label: 'Completed', value: completed, key: keys.completed },
            { label: 'Cancelled', value: cancelled, key: keys.cancelled },
          ].map(qs => (
            <div key={qs.key as string} className="flex justify-between py-1.5 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2 transition-colors border-b border-border last:border-0" onClick={() => setDrilldown(qs.key)}>
              <span className="text-sm text-muted-foreground">{qs.label}</span>
              <span className="text-sm font-bold">{qs.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {renderSectionCard('Boarding', <CalendarCheck className="h-5 w-5 text-primary" />,
            owners.length, dogs.length, bActive.length, bRevenue, bReserved.length, bCompleted.length, bCancelled.length,
            { owners: 'b-owners', dogs: 'b-dogs', active: 'b-active', revenue: 'b-revenue', reserved: 'b-reserved', completed: 'b-completed', cancelled: 'b-cancelled' }
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {renderSectionCard('Foster', <Heart className="h-5 w-5 text-destructive" />,
            fosterOwners.length, fosterDogs.length, fActive.length, fRevenue, fReserved.length, fCompleted.length, fCancelled.length,
            { owners: 'f-owners', dogs: 'f-dogs', active: 'f-active', revenue: 'f-revenue', reserved: 'f-reserved', completed: 'f-completed', cancelled: 'f-cancelled' }
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-display font-extrabold text-xl sm:text-2xl mb-4 text-primary">Recent Boardings</h3>
            {boardings.length === 0 ? <p className="text-muted-foreground text-sm">No boardings yet</p> : (
              <div className="space-y-3">
                {[...boardings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(b => (
                  <div key={b.id} className="flex justify-between items-center py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors" onClick={() => onClickBoarding(b.id)}>
                    <div>
                      <p className="font-medium">🐕 {getDogName(b.dogId, dogs)}</p>
                      <p className="text-xs text-muted-foreground">{b.checkInDate} → {b.checkOutDate}</p>
                    </div>
                    <Badge className={`text-xs ${statusColors[b.status]}`}>{b.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-display font-extrabold text-xl sm:text-2xl mb-4 text-primary">Recent Fosters</h3>
            {fosters.length === 0 ? <p className="text-muted-foreground text-sm">No fosters yet</p> : (
              <div className="space-y-3">
                {[...fosters].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(f => (
                  <div key={f.id} className="flex justify-between items-center py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors">
                    <div>
                      <p className="font-medium">{f.animalType === 'cat' ? '🐈' : '🐕'} {getDogName(f.dogId, fosterDogs)}</p>
                      <p className="text-xs text-muted-foreground">{f.checkInDate} → {f.checkOutDate}</p>
                    </div>
                    <Badge className={`text-xs ${statusColors[f.status]}`}>{f.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!drilldown} onOpenChange={(open) => { if (!open) setDrilldown(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{drilldown ? drilldownTitle[drilldown] : ''}</DialogTitle>
          </DialogHeader>
          {renderDrilldownContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
