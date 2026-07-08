import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CalendarCheck, LogIn, LogOut, CalendarClock, Home, IndianRupee,
  TrendingUp, AlertCircle, Sun, ShieldAlert, Plus, UserPlus, Dog as DogIcon,
  FileText, CalendarDays, BarChart3, PawPrint,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { Boarding, Dog, Owner, Foster } from '@/types/boarding';
import { calcBilling } from '@/lib/billing';

interface Props {
  owners: Owner[];
  dogs: Dog[];
  boardings: Boarding[];
  fosters: Foster[];
  totalKennels?: number;
  onQuickAction?: (a: 'booking' | 'customer' | 'pet' | 'invoice' | 'calendar' | 'reports') => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const monthKey = (d: string | Date) => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};
const daysAhead = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function DashboardKpis({ owners, dogs, boardings, fosters, totalKennels = 20, onQuickAction }: Props) {
  const t = today();

  const stats = useMemo(() => {
    const active = boardings.filter(b => b.status === 'checked-in');
    const checkinsToday = boardings.filter(b => b.checkInDate === t && b.status !== 'cancelled');
    const checkoutsToday = boardings.filter(b => b.checkOutDate === t && b.status !== 'cancelled');
    const upcoming = boardings.filter(b => b.checkInDate > t && b.checkInDate <= daysAhead(7) && b.status !== 'cancelled');
    const occupancy = totalKennels > 0 ? Math.min(100, Math.round((active.length / totalKennels) * 100)) : 0;

    const revenueToday = boardings
      .filter(b => b.status !== 'cancelled' && b.checkOutDate === t)
      .reduce((s, b) => s + calcBilling(b).total, 0);

    const mKey = monthKey(new Date());
    const revenueMonth = boardings
      .filter(b => b.status !== 'cancelled' && monthKey(b.checkOutDate || b.checkInDate) === mKey)
      .reduce((s, b) => s + calcBilling(b).total, 0);

    const pendingPayments = boardings
      .filter(b => b.status !== 'cancelled')
      .reduce((s, b) => s + calcBilling(b).remaining, 0);

    const activeDaycare = active.filter(b => b.lastDayCharge === 'daycare').length;

    // Vaccinations expiring: dogs not vaccinated flagged as risky
    const vaccinesRisk = dogs.filter(d => !d.vaccinated).length;

    return { active, checkinsToday, checkoutsToday, upcoming, occupancy, revenueToday, revenueMonth, pendingPayments, activeDaycare, vaccinesRisk };
  }, [boardings, dogs, t, totalKennels]);

  // Monthly Revenue (last 6 months)
  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      map.set(monthKey(d), 0);
    }
    boardings.forEach(b => {
      if (b.status === 'cancelled') return;
      const key = monthKey(b.checkOutDate || b.checkInDate);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + calcBilling(b).total);
    });
    return [...map.entries()].map(([m, v]) => ({ month: m.slice(5), Revenue: Math.round(v) }));
  }, [boardings]);

  // Boarding vs Daycare (last 6 months)
  const boardingVsDaycare = useMemo(() => {
    const map = new Map<string, { Boarding: number; Daycare: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      map.set(monthKey(d), { Boarding: 0, Daycare: 0 });
    }
    boardings.forEach(b => {
      const key = monthKey(b.checkInDate);
      if (!map.has(key)) return;
      const bill = calcBilling(b);
      const row = map.get(key)!;
      row.Boarding += bill.nights;
      if (b.lastDayCharge === 'daycare') row.Daycare += 1;
    });
    return [...map.entries()].map(([m, v]) => ({ month: m.slice(5), ...v }));
  }, [boardings]);

  // New customers per month (last 6)
  const newCustomers = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      map.set(monthKey(d), 0);
    }
    owners.forEach(o => {
      const key = monthKey(o.createdAt);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].map(([m, v]) => ({ month: m.slice(5), Customers: v }));
  }, [owners]);

  // Occupancy trend last 14 days
  const occupancyTrend = useMemo(() => {
    const out: { day: string; Occupied: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const occupied = boardings.filter(b =>
        b.status !== 'cancelled' &&
        b.checkInDate <= iso &&
        (b.checkOutDate || iso) >= iso
      ).length;
      out.push({ day: iso.slice(5), Occupied: occupied });
    }
    return out;
  }, [boardings]);

  const kpis = [
    { label: 'Currently Boarding', value: stats.active.length, icon: CalendarCheck, tone: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Check-ins Today', value: stats.checkinsToday.length, icon: LogIn, tone: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'Check-outs Today', value: stats.checkoutsToday.length, icon: LogOut, tone: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Upcoming (7d)', value: stats.upcoming.length, icon: CalendarClock, tone: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Occupancy', value: `${stats.occupancy}%`, icon: Home, tone: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Revenue Today', value: `₹${Math.round(stats.revenueToday)}`, icon: IndianRupee, tone: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'Revenue (Month)', value: `₹${Math.round(stats.revenueMonth)}`, icon: TrendingUp, tone: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pending Payments', value: `₹${Math.round(stats.pendingPayments)}`, icon: AlertCircle, tone: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Active Daycare', value: stats.activeDaycare, icon: Sun, tone: 'text-yellow-600', bg: 'bg-yellow-500/10' },
    { label: 'Vaccines At Risk', value: stats.vaccinesRisk, icon: ShieldAlert, tone: 'text-rose-600', bg: 'bg-rose-500/10' },
  ];

  const actions: { key: NonNullable<Props['onQuickAction']> extends (a: infer K) => void ? K : never; label: string; icon: any }[] = [
    { key: 'booking' as const, label: 'New Booking', icon: Plus },
    { key: 'customer' as const, label: 'New Customer', icon: UserPlus },
    { key: 'pet' as const, label: 'New Pet', icon: DogIcon },
    { key: 'invoice' as const, label: 'Invoices', icon: FileText },
    { key: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
    { key: 'reports' as const, label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="hover-lift border-border/60">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{k.label}</p>
                    <p className="font-display text-lg sm:text-2xl font-extrabold mt-1 truncate">{k.value}</p>
                  </div>
                  <div className={`shrink-0 rounded-lg p-2 ${k.bg}`}>
                    <k.icon className={`h-4 w-4 ${k.tone}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      {onQuickAction && (
        <Card className="border-border/60">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <PawPrint className="h-4 w-4 text-primary" />
              <h3 className="font-display font-semibold text-sm">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {actions.map(a => (
                <Button
                  key={a.key}
                  variant="outline"
                  className="justify-start gap-2 h-10 hover:bg-primary/5 hover:border-primary/40 transition-all"
                  onClick={() => onQuickAction(a.key)}
                >
                  <a.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs sm:text-sm">{a.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <h3 className="font-display font-semibold text-sm mb-3">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <h3 className="font-display font-semibold text-sm mb-3">Occupancy Trend (14d)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={occupancyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="Occupied" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <h3 className="font-display font-semibold text-sm mb-3">Boarding vs Daycare</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={boardingVsDaycare}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Boarding" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Daycare" fill="hsl(var(--sunshine))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <h3 className="font-display font-semibold text-sm mb-3">New Customers / Month</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={newCustomers}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="Customers" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
