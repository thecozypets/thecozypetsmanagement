import { Dog, Owner, Boarding } from '@/types/boarding';
import { Card, CardContent } from '@/components/ui/card';
import { Users, PawPrint, CalendarCheck, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  owners: Owner[];
  dogs: Dog[];
  boardings: Boarding[];
  onClickOwner: (ownerId: string) => void;
  onClickDog: (dogId: string) => void;
  onClickBoarding: (boardingId: string) => void;
}

export default function Dashboard({ owners, dogs, boardings, onClickOwner, onClickDog, onClickBoarding }: Props) {
  const activeBookings = boardings.filter(b => b.status === 'checked-in').length;
  const reservedBookings = boardings.filter(b => b.status === 'reserved').length;
  const totalRevenue = boardings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalCost, 0);

  const stats = [
    { label: 'Total Owners', value: owners.length, icon: Users, color: 'text-primary' },
    { label: 'Registered Dogs', value: dogs.length, icon: PawPrint, color: 'text-accent' },
    { label: 'Active Boardings', value: activeBookings, icon: CalendarCheck, color: 'text-success' },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
  ];

  const recentBookings = [...boardings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getDogName = (id: string) => dogs.find(d => d.id === id)?.name || 'Unknown';
  const getOwnerName = (id: string) => owners.find(o => o.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
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
                      <p className="font-medium">
                        🐕 <span className="hover:text-primary transition-colors">{getDogName(b.dogId)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{b.checkInDate} → {b.checkOutDate}</p>
                    </div>
                    <span className="text-sm font-medium capitalize">{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-display font-bold text-lg mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Reserved</span>
                <span className="font-bold">{reservedBookings}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Currently Boarding</span>
                <span className="font-bold">{activeBookings}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-bold">{boardings.filter(b => b.status === 'checked-out').length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Cancelled</span>
                <span className="font-bold">{boardings.filter(b => b.status === 'cancelled').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
