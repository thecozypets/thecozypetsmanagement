import { useMemo, useState } from 'react';
import { Dog, Owner, Boarding, BoardingStatus, Foster } from '@/types/boarding';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Users, PawPrint, CalendarCheck, Phone, Mail, Syringe, IndianRupee, LogOut,
  Home, LogIn, TrendingUp, Repeat, Settings2, Plus, UserPlus, Dog as DogIcon,
  FileText, CalendarDays, BarChart3, AlertTriangle, Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import { calcBilling } from '@/lib/billing';

const statusColors: Record<BoardingStatus, string> = {
  'reserved': 'bg-muted text-muted-foreground border-border',
  'checked-in': 'bg-success/20 text-success-foreground border-success/30',
  'checked-out': 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
  'cancelled': 'bg-destructive/20 text-destructive border-destructive/30',
};

const statusLabel: Record<BoardingStatus, string> = {
  'reserved': 'Reserved',
  'checked-in': 'Checked in',
  'checked-out': 'Checked out',
  'cancelled': 'Cancelled',
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
  onQuickAction?: (a: 'booking' | 'customer' | 'pet' | 'invoice' | 'calendar' | 'reports') => void;
}

type Drilldown =
  | { kind: 'bookings'; title: string; list: (Boarding | Foster)[]; dogList: Dog[]; ownerList: Owner[] }
  | { kind: 'dogs'; title: string; list: Dog[]; ownerList: Owner[]; foster?: boolean }
  | null;

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const monthKey = (d: string | Date) => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

const CAPACITY_KEY = 'cozypets_kennel_capacity';

export default function Dashboard({ owners, dogs, boardings, fosters, fosterOwners, fosterDogs, onClickOwner, onClickDog, onClickBoarding, onClickFosterOwner, onClickFosterDog, onQuickAction }: Props) {
  const [drill, setDrill] = useState<Drilldown>(null);
  const [capacity, setCapacity] = useState<number>(() => {
    const v = Number(localStorage.getItem(CAPACITY_KEY));
    return v > 0 ? v : 10;
  });
  const [capInput, setCapInput] = useState(String(capacity));

  const t = today();
  const tomorrow = addDays(1);
  const in7 = addDays(7);

  const allDogs = useMemo(() => [...dogs, ...fosterDogs], [dogs, fosterDogs]);
  const allOwners = useMemo(() => [...owners, ...fosterOwners], [owners, fosterOwners]);

  const getDogName = (id: string) => allDogs.find(d => d.id === id)?.name || 'Unknown';
  const getOwnerName = (id: string) => allOwners.find(o => o.id === id)?.name || 'Unknown';

  // ---------- Alert strip data ----------
  const expiringVaccines = useMemo(() => {
    const rows: { dog: Dog; vaccine: string; expiry: string; foster: boolean }[] = [];
    allDogs.forEach(d => {
      (d.vaccines || []).forEach(v => {
        if (v.expiry && v.expiry >= t && v.expiry <= in7) {
          rows.push({ dog: d, vaccine: v.name || 'Vaccine', expiry: v.expiry, foster: fosterDogs.some(fd => fd.id === d.id) });
        }
      });
    });
    return rows.sort((a, b) => a.expiry.localeCompare(b.expiry));
  }, [allDogs, fosterDogs, t, in7]);

  const pendingList = useMemo(() => {
    const rows: { entry: Boarding | Foster; remaining: number; foster: boolean }[] = [];
    boardings.forEach(b => { if (b.status !== 'cancelled') { const r = calcBilling(b).remaining; if (r > 0) rows.push({ entry: b, remaining: r, foster: false }); } });
    fosters.forEach(f => { if (f.status !== 'cancelled') { const r = calcBilling(f).remaining; if (r > 0) rows.push({ entry: f, remaining: r, foster: true }); } });
    return rows;
  }, [boardings, fosters]);
  const pendingTotal = pendingList.reduce((s, r) => s + r.remaining, 0);

  const checkoutsTomorrow = useMemo(() =>
    [...boardings.filter(b => b.checkOutDate === tomorrow && b.status !== 'cancelled' && b.status !== 'checked-out').map(b => ({ entry: b as Boarding | Foster, foster: false })),
     ...fosters.filter(f => f.checkOutDate === tomorrow && f.status !== 'cancelled' && f.status !== 'checked-out').map(f => ({ entry: f, foster: true }))],
    [boardings, fosters, tomorrow]);

  // ---------- KPI data ----------
  const nonCancelledB = boardings.filter(b => b.status !== 'cancelled');
  const nonCancelledF = fosters.filter(f => f.status !== 'cancelled');
  const bRevenue = nonCancelledB.reduce((s, b) => s + calcBilling(b).total, 0);
  const fRevenue = nonCancelledF.reduce((s, f) => s + calcBilling(f).total, 0);
  const totalRevenue = bRevenue + fRevenue;

  const thisMonth = monthKey(new Date());
  const lastMonthDate = new Date(); lastMonthDate.setDate(1); lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = monthKey(lastMonthDate);
  const monthRevenue = (key: string) =>
    nonCancelledB.filter(b => monthKey(b.checkOutDate || b.checkInDate) === key).reduce((s, b) => s + calcBilling(b).total, 0) +
    nonCancelledF.filter(f => monthKey(f.checkOutDate || f.checkInDate) === key).reduce((s, f) => s + calcBilling(f).total, 0);
  const revenueThisMonth = monthRevenue(thisMonth);
  const revenueLastMonth = monthRevenue(lastMonth);

  const occupied = boardings.filter(b => b.status === 'checked-in').length + fosters.filter(f => f.status === 'checked-in').length;

  const checkinsToday = [...nonCancelledB, ...nonCancelledF].filter(b => b.checkInDate === t).length;
  const checkoutsToday = [...nonCancelledB, ...nonCancelledF].filter(b => b.checkOutDate === t).length;
  const upcoming7 = [...nonCancelledB, ...nonCancelledF].filter(b => b.checkInDate > t && b.checkInDate <= in7).length;

  const completed = nonCancelledB.filter(b => b.status === 'checked-out');
  const avgStay = completed.length
    ? completed.reduce((s, b) => s + Math.max(1, calcBilling(b).nights), 0) / completed.length
    : 0;
  const totalOccupiedDays = nonCancelledB.reduce((s, b) => s + Math.max(1, calcBilling(b).nights), 0) +
    nonCancelledF.reduce((s, f) => s + Math.max(1, calcBilling(f).nights), 0);
  const revenuePerDay = totalOccupiedDays > 0 ? totalRevenue / totalOccupiedDays : 0;

  const repeatPct = useMemo(() => {
    const cutoff = addDays(-30);
    const recent = [...nonCancelledB, ...nonCancelledF].filter(b => b.checkInDate >= cutoff);
    if (recent.length === 0) return 0;
    const repeat = recent.filter(b => {
      const earlier = [...nonCancelledB, ...nonCancelledF].some(x => x.ownerId === b.ownerId && x.checkInDate < b.checkInDate);
      return earlier;
    }).length;
    return Math.round((repeat / recent.length) * 100);
  }, [nonCancelledB, nonCancelledF]);

  // ---------- Charts ----------
  const last6Months = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      months.push({ key: monthKey(d), label: d.toLocaleString('en-IN', { month: 'short' }) });
    }
    return months;
  }, []);

  const revenueTrend = useMemo(() => last6Months.map(m => ({ month: m.label, Revenue: Math.round(monthRevenue(m.key)) })), [last6Months, boardings, fosters]);

  const occupancyTrend = useMemo(() => {
    const days: string[] = [];
    for (let i = 13; i >= 0; i--) days.push(addDays(-i));
    return days.map(iso => ({
      day: iso.slice(5),
      Occupied: [...nonCancelledB, ...nonCancelledF].filter(b => b.checkInDate <= iso && (b.checkOutDate || iso) >= iso).length,
    }));
  }, [nonCancelledB, nonCancelledF]);

  const newCustomersTrend = useMemo(() => last6Months.map(m => ({
    month: m.label,
    Customers: allOwners.filter(o => o.createdAt && monthKey(o.createdAt) === m.key).length,
  })), [last6Months, allOwners]);

  // ---------- Bottom section ----------
  const recentActivity = useMemo(() => {
    const rows = [
      ...boardings.map(b => ({ id: b.id, pet: getDogName(b.dogId), type: 'Boarding' as const, in: b.checkInDate, out: b.checkOutDate, status: b.status, createdAt: b.createdAt, foster: false })),
      ...fosters.map(f => ({ id: f.id, pet: getDogName(f.dogId), type: 'Foster' as const, in: f.checkInDate, out: f.checkOutDate, status: f.status, createdAt: f.createdAt, foster: true })),
    ];
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  }, [boardings, fosters, allDogs]);

  const needsAttention = useMemo(() => {
    const items: { key: string; icon: 'vaccine' | 'payment'; title: string; sub: string; urgentDays: number; dogId?: string; fosterDog?: boolean }[] = [];
    allDogs.forEach(d => {
      (d.vaccines || []).forEach(v => {
        if (!v.expiry) return;
        const days = Math.round((new Date(v.expiry).getTime() - Date.now()) / 86400000);
        if (days <= 30) {
          items.push({
            key: `v-${d.id}-${v.name}`,
            icon: 'vaccine',
            title: d.name,
            sub: `${v.name || 'Vaccine'} due ${days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? 'today' : `in ${days}d`}`,
            urgentDays: days,
            dogId: d.id,
            fosterDog: fosterDogs.some(fd => fd.id === d.id),
          });
        }
      });
    });
    pendingList.forEach(p => {
      const overdue = p.entry.checkOutDate < t;
      items.push({
        key: `p-${p.entry.id}`,
        icon: 'payment',
        title: getOwnerName(p.entry.ownerId),
        sub: `₹${Math.round(p.remaining)} due${overdue ? ' · Overdue' : ''}`,
        urgentDays: overdue ? -1 : Math.round((new Date(p.entry.checkOutDate).getTime() - Date.now()) / 86400000),
      });
    });
    return items.sort((a, b) => a.urgentDays - b.urgentDays).slice(0, 8);
  }, [allDogs, pendingList, fosterDogs, t]);

  const saveCapacity = () => {
    const v = Math.max(1, Number(capInput) || 10);
    setCapacity(v);
    localStorage.setItem(CAPACITY_KEY, String(v));
  };

  const kpis = [
    {
      label: 'Revenue (All Time)', value: `₹${Math.round(totalRevenue).toLocaleString('en-IN')}`,
      sub: `Boarding ₹${Math.round(bRevenue).toLocaleString('en-IN')} · Foster ₹${Math.round(fRevenue).toLocaleString('en-IN')}`,
      icon: IndianRupee, tone: 'text-primary', bg: 'bg-primary/10',
    },
    {
      label: 'Revenue (This Month)', value: `₹${Math.round(revenueThisMonth).toLocaleString('en-IN')}`,
      sub: `vs ₹${Math.round(revenueLastMonth).toLocaleString('en-IN')} last month`,
      icon: TrendingUp, tone: 'text-emerald-600', bg: 'bg-emerald-500/10',
    },
    {
      label: 'Occupancy', value: `${occupied}/${capacity}`,
      sub: '', icon: Home, tone: 'text-primary', bg: 'bg-primary/10', occupancy: true,
    },
    {
      label: 'Check-ins / Outs Today', value: `${checkinsToday} / ${checkoutsToday}`,
      sub: `${upcoming7} upcoming in 7 days`,
      icon: LogIn, tone: 'text-blue-600', bg: 'bg-blue-500/10',
    },
    {
      label: 'Avg Stay Length', value: `${avgStay.toFixed(1)} days`,
      sub: `₹${Math.round(revenuePerDay).toLocaleString('en-IN')} per occupied day`,
      icon: Clock, tone: 'text-amber-600', bg: 'bg-amber-500/10',
    },
    {
      label: 'Repeat Customers', value: `${repeatPct}%`,
      sub: 'of last 30 days',
      icon: Repeat, tone: 'text-primary', bg: 'bg-primary/10',
    },
  ];

  const actions = [
    { key: 'booking' as const, label: 'New Booking', icon: Plus },
    { key: 'customer' as const, label: 'New Customer', icon: UserPlus },
    { key: 'pet' as const, label: 'New Pet', icon: DogIcon },
    { key: 'invoice' as const, label: 'Invoices', icon: FileText },
    { key: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
    { key: 'reports' as const, label: 'Reports', icon: BarChart3 },
  ];

  const renderBookingRows = (list: (Boarding | Foster)[], dogList: Dog[], ownerList: Owner[]) =>
    list.length === 0 ? <p className="text-sm text-muted-foreground">No entries.</p> : (
      <div className="space-y-2">
        {list.map(b => {
          const bill = calcBilling(b);
          return (
            <Card key={b.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrill(null); onClickBoarding(b.id); }}>
              <CardContent className="p-3 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">🐕 {dogList.find(d => d.id === b.dogId)?.name || getDogName(b.dogId)}</p>
                  <p className="text-xs text-muted-foreground">Owner: {ownerList.find(o => o.id === b.ownerId)?.name || getOwnerName(b.ownerId)}</p>
                  <p className="text-xs text-muted-foreground">{b.checkInDate} → {b.checkOutDate}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-display font-extrabold text-primary">₹{bill.total.toFixed(0)}</p>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-success/15 text-success text-xs font-bold">Paid ₹{bill.paid.toFixed(0)}</span>
                  {bill.remaining > 0 && <span className="block px-2 py-0.5 rounded-md bg-destructive/15 text-destructive text-xs font-bold">Due ₹{bill.remaining.toFixed(0)}</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. ALERT STRIP */}
      {(expiringVaccines.length > 0 || pendingTotal > 0 || checkoutsTomorrow.length > 0) && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            {expiringVaccines.length > 0 && (
              <button
                className="flex items-center gap-1.5 text-sm font-medium text-destructive hover:underline"
                onClick={() => setDrill({ kind: 'dogs', title: 'Vaccines Expiring This Week', list: expiringVaccines.map(v => v.dog), ownerList: allOwners })}
              >
                <Syringe className="h-3.5 w-3.5" /> {expiringVaccines.length} vaccine{expiringVaccines.length > 1 ? 's' : ''} expiring this week
              </button>
            )}
            {pendingTotal > 0 && (
              <button
                className="flex items-center gap-1.5 text-sm font-medium text-destructive hover:underline"
                onClick={() => setDrill({ kind: 'bookings', title: 'Pending Payments', list: pendingList.map(p => p.entry), dogList: allDogs, ownerList: allOwners })}
              >
                <IndianRupee className="h-3.5 w-3.5" /> ₹{Math.round(pendingTotal).toLocaleString('en-IN')} in pending payments
              </button>
            )}
            {checkoutsTomorrow.length > 0 && (
              <button
                className="flex items-center gap-1.5 text-sm font-medium text-destructive hover:underline"
                onClick={() => setDrill({ kind: 'bookings', title: 'Check-outs Due Tomorrow', list: checkoutsTomorrow.map(c => c.entry), dogList: allDogs, ownerList: allOwners })}
              >
                <LogOut className="h-3.5 w-3.5" /> {checkoutsTomorrow.length} check-out{checkoutsTomorrow.length > 1 ? 's' : ''} due tomorrow
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="hover-lift border-border/60 h-full">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{k.label}</p>
                    <p className="font-display text-xl sm:text-2xl font-extrabold mt-1 truncate">{k.value}</p>
                  </div>
                  <div className={`shrink-0 rounded-lg p-2 ${k.bg} relative`}>
                    <k.icon className={`h-4 w-4 ${k.tone}`} />
                    {k.occupancy && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="absolute -bottom-1.5 -right-1.5 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center shadow-sm" title="Set kennel capacity">
                            <Settings2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-3" align="end">
                          <p className="text-xs font-medium mb-2">Total kennel capacity</p>
                          <div className="flex gap-2">
                            <Input type="number" min={1} value={capInput} onChange={e => setCapInput(e.target.value)} className="h-8" />
                            <Button size="sm" className="h-8" onClick={saveCapacity}>Save</Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
                {k.occupancy ? (
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (occupied / capacity) * 100)}%` }} />
                  </div>
                ) : (
                  k.sub && <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1.5 truncate">{k.sub}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 3. QUICK ACTIONS */}
      {onQuickAction && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {actions.map(a => (
            <Button key={a.key} variant="outline" className="justify-start gap-2 h-10 hover:bg-primary/5 hover:border-primary/40 transition-all" onClick={() => onQuickAction(a.key)}>
              <a.icon className="h-4 w-4 text-primary" />
              <span className="text-xs sm:text-sm">{a.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* 4. CHARTS */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <h3 className="font-display font-semibold text-sm mb-3">Revenue Trend (6 months)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueTrend}>
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
            <h3 className="font-display font-semibold text-sm mb-3">Occupancy Trend (14 days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={occupancyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} domain={[0, capacity]} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="Occupied" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <h3 className="font-display font-semibold text-sm mb-3">New Customers / Month</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={newCustomersTrend}>
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

      {/* 5. BOTTOM SECTION */}
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="lg:col-span-3 border-border/60">
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-display font-bold text-lg mb-4">Recent Activity</h3>
            {recentActivity.length === 0 ? <p className="text-muted-foreground text-sm">No activity yet</p> : (
              <div className="space-y-1">
                {recentActivity.map(r => (
                  <div
                    key={r.id}
                    className="flex justify-between items-center py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                    onClick={() => r.foster ? onClickFosterDog(fosters.find(f => f.id === r.id)?.dogId || '') : onClickBoarding(r.id)}
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">🐕 {r.pet} <span className="text-xs text-muted-foreground font-normal">· {r.type}</span></p>
                      <p className="text-xs text-muted-foreground">{r.in} → {r.out}</p>
                    </div>
                    <Badge className={`text-xs shrink-0 ml-2 ${statusColors[r.status]}`}>{statusLabel[r.status]}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/60">
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-display font-bold text-lg mb-4">Needs Attention</h3>
            {needsAttention.length === 0 ? <p className="text-muted-foreground text-sm">All clear — nothing needs attention.</p> : (
              <div className="space-y-1">
                {needsAttention.map(item => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-3 py-2 border-b border-border last:border-0 rounded px-1 -mx-1 transition-colors ${item.dogId ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                    onClick={() => { if (item.dogId) (item.fosterDog ? onClickFosterDog : onClickDog)(item.dogId); }}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${item.icon === 'vaccine' ? 'bg-amber-500/10' : 'bg-destructive/10'}`}>
                      {item.icon === 'vaccine' ? <Syringe className="h-4 w-4 text-amber-600" /> : <IndianRupee className="h-4 w-4 text-destructive" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className={`text-xs truncate ${item.urgentDays < 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drilldown dialog */}
      <Dialog open={!!drill} onOpenChange={(open) => { if (!open) setDrill(null); }}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-base sm:text-lg">{drill?.title || ''}</DialogTitle>
          </DialogHeader>
          {drill?.kind === 'bookings' && renderBookingRows(drill.list, drill.dogList, drill.ownerList)}
          {drill?.kind === 'dogs' && (
            drill.list.length === 0 ? <p className="text-sm text-muted-foreground">No pets.</p> : (
              <div className="space-y-2">
                {drill.list.map(d => (
                  <Card key={d.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all" onClick={() => { setDrill(null); (drill.foster ? onClickFosterDog : onClickDog)(d.id); }}>
                    <CardContent className="p-3 flex items-center gap-3">
                      {d.photoUrl ? (
                        <img src={d.photoUrl} alt={d.name} className="h-10 w-10 rounded-full object-cover border border-border shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0"><PawPrint className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                      <div>
                        <p className="font-display font-semibold">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.breed} · {d.age}y · Owner: {drill.ownerList.find(o => o.id === d.ownerId)?.name || 'Unknown'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
