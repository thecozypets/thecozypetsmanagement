import { useState } from 'react';
import { Dog, Owner, Boarding, BoardingStatus } from '@/types/boarding';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, PawPrint, CalendarCheck, DollarSign, Phone, Mail } from 'lucide-react';
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
  onClickOwner: (ownerId: string) => void;
  onClickDog: (dogId: string) => void;
  onClickBoarding: (boardingId: string) => void;
}

type DrilldownType = 'owners' | 'dogs' | 'active' | 'revenue' | 'reserved' | 'boarding' | 'completed' | 'cancelled' | null;

export default function Dashboard({ owners, dogs, boardings, onClickOwner, onClickDog, onClickBoarding }: Props) {
  const [drilldown, setDrilldown] = useState<DrilldownType>(null);

  const activeBookings = boardings.filter(b => b.status === 'checked-in');
  const reservedBookings = boardings.filter(b => b.status === 'reserved');
  const completedBookings = boardings.filter(b => b.status === 'checked-out');
  const cancelledBookings = boardings.filter(b => b.status === 'cancelled');
  const paidBookings = boardings.filter(b => b.status !== 'cancelled');
  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalCost, 0);

  const getDogName = (id: string) => dogs.find(d => d.id === id)?.name || 'Unknown';
  const getOwnerName = (id: string) => owners.find(o => o.id === id)?.name || 'Unknown';

  const stats = [
    { label: 'Total Owners', value: owners.length, icon: Users, color: 'text-primary', key: 'owners' as DrilldownType },
    { label: 'Registered Dogs', value: dogs.length, icon: PawPrint, color: 'text-accent', key: 'dogs' as DrilldownType },
    { label: 'Active Boardings', value: activeBookings.length, icon: CalendarCheck, color: 'text-success', key: 'active' as DrilldownType },
    { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-primary', key: 'revenue' as DrilldownType },
  ];

  const quickStats = [
    { label: 'Reserved', value: reservedBookings.length, key: 'reserved' as DrilldownType },
    { label: 'Currently Boarding', value: activeBookings.length, key: 'boarding' as DrilldownType },
    { label: 'Completed', value: completedBookings.length, key: 'completed' as DrilldownType },
    { label: 'Cancelled', value: cancelledBookings.length, key: 'cancelled' as DrilldownType },
  ];

  const recentBookings = [...boardings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const drilldownTitle: Record<string, string> = {
    owners: 'All Owners',
    dogs: 'All Registered Dogs',
    active: 'Active Boardings (Checked-In)',
    revenue: 'Revenue Breakdown (Non-Cancelled)',
    reserved: 'Reserved Bookings',
    boarding: 'Currently Boarding',
    completed: 'Completed Bookings',
    cancelled: 'Cancelled Bookings',
  };

  const renderDrilldownContent = () => {
    switch (drilldown) {
      case 'owners':
        return owners.length === 0 ? <p className="text-sm text-muted-foreground">No owners registered.</p> : (
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
        return dogs.length === 0 ? <p className="text-sm text-muted-foreground">No dogs registered.</p> : (
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
                    <p className="text-xs text-muted-foreground">{d.breed} · {d.age}y · {d.weight}kg · Owner: {getOwnerName(d.ownerId)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'revenue':
        return paidBookings.length === 0 ? <p className="text-sm text-muted-foreground">No revenue yet.</p> : (
          <div className="space-y-2">
            <div className="flex justify-between font-display font-bold text-lg px-1 mb-2">
              <span>Total</span><span>₹{totalRevenue.toFixed(2)}</span>
            </div>
            {paidBookings.map(b => (
              <Card key={b.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrilldown(null); onClickBoarding(b.id); }}>
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">🐕 {getDogName(b.dogId)}</p>
                    <p className="text-xs text-muted-foreground">{b.checkInDate} → {b.checkOutDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">₹{b.totalCost.toFixed(2)}</p>
                    <Badge className={`text-xs ${statusColors[b.status]}`}>{b.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'active':
      case 'boarding':
        return renderBookingList(activeBookings);
      case 'reserved':
        return renderBookingList(reservedBookings);
      case 'completed':
        return renderBookingList(completedBookings);
      case 'cancelled':
        return renderBookingList(cancelledBookings);
      default:
        return null;
    }
  };

  const renderBookingList = (list: Boarding[]) =>
    list.length === 0 ? <p className="text-sm text-muted-foreground">No bookings in this category.</p> : (
      <div className="space-y-2">
        {list.map(b => (
          <Card key={b.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrilldown(null); onClickBoarding(b.id); }}>
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">🐕 {getDogName(b.dogId)}</p>
                  <p className="text-xs text-muted-foreground">Owner: {getOwnerName(b.ownerId)}</p>
                  <p className="text-xs text-muted-foreground">{b.checkInDate} → {b.checkOutDate}</p>
                  {b.kennelNumber && <p className="text-xs text-muted-foreground">Kennel: #{b.kennelNumber}</p>}
                </div>
                <div className="text-right">
                  <Badge className={`text-xs ${statusColors[b.status]}`}>{b.status}</Badge>
                  <p className="text-sm font-bold mt-1">₹{b.totalCost.toFixed(2)}</p>
                </div>
              </div>
              {b.specialRequests && <p className="text-xs text-muted-foreground mt-1">📝 {b.specialRequests}</p>}
              {b.notes && <p className="text-xs text-muted-foreground italic">{b.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-display font-bold text-lg mb-4">Recent Bookings</h3>
            {recentBookings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map(b => (
                  <div key={b.id} className="flex justify-between items-center py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors" onClick={() => onClickBoarding(b.id)}>
                    <div>
                      <p className="font-medium">🐕 <span className="hover:text-primary transition-colors">{getDogName(b.dogId)}</span></p>
                      <p className="text-xs text-muted-foreground">{b.checkInDate} → {b.checkOutDate}</p>
                    </div>
                    <span className="text-sm font-medium capitalize">{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-display font-bold text-lg mb-4">Quick Stats</h3>
            <div className="space-y-3">
              {quickStats.map((qs, i) => (
                <div
                  key={qs.key}
                  className={`flex justify-between py-2 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2 transition-colors ${i < quickStats.length - 1 ? 'border-b border-border' : ''}`}
                  onClick={() => setDrilldown(qs.key)}
                >
                  <span className="text-muted-foreground">{qs.label}</span>
                  <span className="font-bold">{qs.value}</span>
                </div>
              ))}
            </div>
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
