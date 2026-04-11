import { useState } from 'react';
import { Dog, Owner, Boarding, BoardingStatus, Foster } from '@/types/boarding';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, PawPrint, CalendarCheck, DollarSign, Phone, Mail, Heart, Cat, Dog as DogIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const statusColors: Record<BoardingStatus, string> = {
  'reserved': 'bg-warning/20 text-warning-foreground border-warning/30',
  'checked-in': 'bg-success/20 text-success-foreground border-success/30',
  'checked-out': 'bg-muted text-muted-foreground',
  'cancelled': 'bg-destructive/20 text-destructive border-destructive/30',
};

interface Props {
  owners: Owner[];
  dogs: Dog[];
  boardings: Boarding[];
  fosters: Foster[];
  onClickOwner: (ownerId: string) => void;
  onClickDog: (dogId: string) => void;
  onClickBoarding: (boardingId: string) => void;
}

type DrilldownType = 'owners' | 'dogs' | 'b-active' | 'b-revenue' | 'b-reserved' | 'b-completed' | 'b-cancelled' | 'f-active' | 'f-revenue' | 'f-reserved' | 'f-completed' | 'f-cancelled' | null;

export default function Dashboard({ owners, dogs, boardings, fosters, onClickOwner, onClickDog, onClickBoarding }: Props) {
  const [drilldown, setDrilldown] = useState<DrilldownType>(null);

  // Boarding stats
  const bActive = boardings.filter(b => b.status === 'checked-in');
  const bReserved = boardings.filter(b => b.status === 'reserved');
  const bCompleted = boardings.filter(b => b.status === 'checked-out');
  const bCancelled = boardings.filter(b => b.status === 'cancelled');
  const bPaid = boardings.filter(b => b.status !== 'cancelled');
  const bRevenue = bPaid.reduce((s, b) => s + b.totalCost, 0);
  const bPaidAmt = bPaid.reduce((s, b) => s + (b.paidAmount || 0), 0);

  // Foster stats
  const fActive = fosters.filter(f => f.status === 'checked-in');
  const fReserved = fosters.filter(f => f.status === 'reserved');
  const fCompleted = fosters.filter(f => f.status === 'checked-out');
  const fCancelled = fosters.filter(f => f.status === 'cancelled');
  const fPaid = fosters.filter(f => f.status !== 'cancelled');
  const fRevenue = fPaid.reduce((s, f) => s + f.totalCost, 0);
  const fPaidAmt = fPaid.reduce((s, f) => s + (f.paidAmount || 0), 0);

  const getDogName = (id: string) => dogs.find(d => d.id === id)?.name || 'Unknown';
  const getOwnerName = (id: string) => owners.find(o => o.id === id)?.name || 'Unknown';

  const drilldownTitle: Record<string, string> = {
    owners: 'All Owners',
    dogs: 'All Registered Dogs',
    'b-active': 'Active Boardings',
    'b-revenue': 'Boarding Revenue',
    'b-reserved': 'Reserved Boardings',
    'b-completed': 'Completed Boardings',
    'b-cancelled': 'Cancelled Boardings',
    'f-active': 'Active Fosters',
    'f-revenue': 'Foster Revenue',
    'f-reserved': 'Reserved Fosters',
    'f-completed': 'Completed Fosters',
    'f-cancelled': 'Cancelled Fosters',
  };

  const renderBookingList = (list: (Boarding | Foster)[]) =>
    list.length === 0 ? <p className="text-sm text-muted-foreground">No entries in this category.</p> : (
      <div className="space-y-2">
        {list.map(b => (
          <Card key={b.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrilldown(null); onClickBoarding(b.id); }}>
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">🐕 {getDogName(b.dogId)}</p>
                  <p className="text-xs text-muted-foreground">Owner: {getOwnerName(b.ownerId)}</p>
                  <p className="text-xs text-muted-foreground">{b.checkInDate} → {b.checkOutDate}</p>
                </div>
                <div className="text-right">
                  <Badge className={`text-xs ${statusColors[b.status]}`}>{b.status}</Badge>
                  <p className="text-sm font-bold mt-1">₹{b.totalCost.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );

  const renderRevenueList = (list: (Boarding | Foster)[], total: number, paid: number) => (
    <div className="space-y-2">
      <div className="space-y-1 px-1 mb-3">
        <div className="flex justify-between font-display font-bold text-lg"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-success"><span>Paid</span><span>₹{paid.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-destructive"><span>Outstanding</span><span>₹{(total - paid).toFixed(2)}</span></div>
      </div>
      {list.map(b => (
        <Card key={b.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrilldown(null); onClickBoarding(b.id); }}>
          <CardContent className="p-3 flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">🐕 {getDogName(b.dogId)}</p>
              <p className="text-xs text-muted-foreground">{b.checkInDate} → {b.checkOutDate}</p>
            </div>
            <p className="font-bold text-sm">₹{b.totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDrilldownContent = () => {
    switch (drilldown) {
      case 'owners':
        return owners.length === 0 ? <p className="text-sm text-muted-foreground">No owners.</p> : (
          <div className="space-y-2">
            {owners.map(o => (
              <Card key={o.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrilldown(null); onClickOwner(o.id); }}>
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
      case 'dogs':
        return dogs.length === 0 ? <p className="text-sm text-muted-foreground">No dogs.</p> : (
          <div className="space-y-2">
            {dogs.map(d => (
              <Card key={d.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrilldown(null); onClickDog(d.id); }}>
                <CardContent className="p-3 flex items-center gap-3">
                  {d.photoUrl ? (
                    <img src={d.photoUrl} alt={d.name} className="h-10 w-10 rounded-full object-cover border border-border shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0"><PawPrint className="h-4 w-4 text-muted-foreground" /></div>
                  )}
                  <div>
                    <p className="font-display font-semibold">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.breed} · {d.age}y · Owner: {getOwnerName(d.ownerId)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case 'b-active': return renderBookingList(bActive);
      case 'b-reserved': return renderBookingList(bReserved);
      case 'b-completed': return renderBookingList(bCompleted);
      case 'b-cancelled': return renderBookingList(bCancelled);
      case 'b-revenue': return bPaid.length === 0 ? <p className="text-sm text-muted-foreground">No revenue.</p> : renderRevenueList(bPaid, bRevenue, bPaidAmt);
      case 'f-active': return renderBookingList(fActive);
      case 'f-reserved': return renderBookingList(fReserved);
      case 'f-completed': return renderBookingList(fCompleted);
      case 'f-cancelled': return renderBookingList(fCancelled);
      case 'f-revenue': return fPaid.length === 0 ? <p className="text-sm text-muted-foreground">No revenue.</p> : renderRevenueList(fPaid, fRevenue, fPaidAmt);
      default: return null;
    }
  };

  const overviewStats = [
    { label: 'Total Owners', value: owners.length, icon: Users, color: 'text-primary', key: 'owners' as DrilldownType },
    { label: 'Registered Dogs', value: dogs.length, icon: PawPrint, color: 'text-accent', key: 'dogs' as DrilldownType },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4">
        {overviewStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="cursor-pointer hover:ring-1 hover:ring-primary/50 hover:shadow-md transition-all" onClick={() => setDrilldown(stat.key)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Boarding & Foster Side by Side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Boarding Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-lg">Boarding</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => setDrilldown('b-active')}>
                  <CardContent className="p-3 text-center">
                    <p className="font-display text-xl font-bold text-success">{bActive.length}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => setDrilldown('b-revenue')}>
                  <CardContent className="p-3 text-center">
                    <p className="font-display text-xl font-bold text-primary">₹{bRevenue.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Reserved', value: bReserved.length, key: 'b-reserved' as DrilldownType },
                  { label: 'Currently Boarding', value: bActive.length, key: 'b-active' as DrilldownType },
                  { label: 'Completed', value: bCompleted.length, key: 'b-completed' as DrilldownType },
                  { label: 'Cancelled', value: bCancelled.length, key: 'b-cancelled' as DrilldownType },
                ].map((qs, i) => (
                  <div key={qs.key} className="flex justify-between py-1.5 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2 transition-colors border-b border-border last:border-0" onClick={() => setDrilldown(qs.key)}>
                    <span className="text-sm text-muted-foreground">{qs.label}</span>
                    <span className="text-sm font-bold">{qs.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Foster Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-destructive" />
                <h3 className="font-display font-bold text-lg">Foster</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => setDrilldown('f-active')}>
                  <CardContent className="p-3 text-center">
                    <p className="font-display text-xl font-bold text-success">{fActive.length}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => setDrilldown('f-revenue')}>
                  <CardContent className="p-3 text-center">
                    <p className="font-display text-xl font-bold text-primary">₹{fRevenue.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Reserved', value: fReserved.length, key: 'f-reserved' as DrilldownType },
                  { label: 'Currently Fostering', value: fActive.length, key: 'f-active' as DrilldownType },
                  { label: 'Completed', value: fCompleted.length, key: 'f-completed' as DrilldownType },
                  { label: 'Cancelled', value: fCancelled.length, key: 'f-cancelled' as DrilldownType },
                ].map((qs) => (
                  <div key={qs.key} className="flex justify-between py-1.5 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2 transition-colors border-b border-border last:border-0" onClick={() => setDrilldown(qs.key)}>
                    <span className="text-sm text-muted-foreground">{qs.label}</span>
                    <span className="text-sm font-bold">{qs.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Bookings */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-display font-bold text-lg mb-4">Recent Boardings</h3>
            {boardings.length === 0 ? <p className="text-muted-foreground text-sm">No boardings yet</p> : (
              <div className="space-y-3">
                {[...boardings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(b => (
                  <div key={b.id} className="flex justify-between items-center py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors" onClick={() => onClickBoarding(b.id)}>
                    <div>
                      <p className="font-medium">🐕 {getDogName(b.dogId)}</p>
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
          <CardContent className="p-5">
            <h3 className="font-display font-bold text-lg mb-4">Recent Fosters</h3>
            {fosters.length === 0 ? <p className="text-muted-foreground text-sm">No fosters yet</p> : (
              <div className="space-y-3">
                {[...fosters].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(f => (
                  <div key={f.id} className="flex justify-between items-center py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors">
                    <div>
                      <p className="font-medium">{f.animalType === 'cat' ? '🐈' : '🐕'} {getDogName(f.dogId)}</p>
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

      {/* Drilldown Dialog */}
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
