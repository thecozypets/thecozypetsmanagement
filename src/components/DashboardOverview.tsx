import { useMemo, useState } from 'react';
import {
  AlertTriangle, CalendarCheck, CalendarClock, CalendarDays, CheckCircle2, Clock3,
  Dog, FileText, Heart, IndianRupee, LogIn, LogOut, PawPrint, Plus, ShieldAlert,
  UserPlus, Users, BarChart3,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Boarding, Dog as Pet, Foster, Owner } from '@/types/boarding';
import { calcBilling, calcNights } from '@/lib/billing';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type QuickAction = 'booking' | 'customer' | 'pet' | 'invoice' | 'calendar' | 'reports';
type Booking = Boarding | Foster;
type BookingKind = 'boarding' | 'foster';
type Scope = 'boarding' | 'foster';

interface Props {
  owners: Owner[];
  dogs: Pet[];
  boardings: Boarding[];
  fosters: Foster[];
  fosterOwners: Owner[];
  fosterDogs: Pet[];
  onClickOwner: (ownerId: string) => void;
  onClickDog: (dogId: string) => void;
  onClickBoarding: (boardingId: string) => void;
  onClickFosterOwner: (ownerId: string) => void;
  onClickFosterDog: (dogId: string) => void;
  onQuickAction?: (action: QuickAction) => void;
}

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const todayKey = () => dateKey(new Date());
const plusDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
};
const monthKey = (date: string | Date) => {
  const value = typeof date === 'string' ? date.slice(0, 7) : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  return value;
};
const money = (value: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(value || 0);
const daysBetween = (from: string, to: string) => Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000);

interface VaccineNotice {
  pet: Pet;
  scope: Scope;
  vaccine: string;
  expiry: string;
  daysLeft: number;
}

interface PaymentNotice {
  booking: Booking;
  kind: BookingKind;
  owner: Owner | undefined;
  due: number;
  daysOverdue: number;
}

type FilterDialog = 'vaccines' | 'payments' | 'checkouts' | null;

export default function DashboardOverview(props: Props) {
  const {
    owners, dogs, boardings, fosters, fosterOwners, fosterDogs,
    onClickOwner, onClickDog, onClickBoarding, onClickFosterOwner, onClickFosterDog, onQuickAction,
  } = props;
  const { settings } = useCompanySettings();
  const capacity = Math.max(1, Number(settings.kennelCapacity) || 10);
  const [filterDialog, setFilterDialog] = useState<FilterDialog>(null);
  const allBookings = useMemo(() => [
    ...boardings.map(booking => ({ booking, kind: 'boarding' as const })),
    ...fosters.map(booking => ({ booking, kind: 'foster' as const })),
  ], [boardings, fosters]);
  const currentDay = todayKey();
  const tomorrow = plusDays(1);

  const vaccineNotices = useMemo(() => {
    const pets: Array<{ pet: Pet; scope: Scope }> = [
      ...dogs.map(pet => ({ pet, scope: 'boarding' as const })),
      ...fosterDogs.map(pet => ({ pet, scope: 'foster' as const })),
    ];
    return pets.flatMap(({ pet, scope }) => (pet.vaccines || [])
      .filter(vaccine => vaccine.expiry)
      .map(vaccine => ({
        pet,
        scope,
        vaccine: vaccine.name || 'Vaccine',
        expiry: vaccine.expiry,
        daysLeft: daysBetween(currentDay, vaccine.expiry),
      }))
      .filter(notice => notice.daysLeft >= 0 && notice.daysLeft <= 30));
  }, [dogs, fosterDogs, currentDay]);

  const weeklyVaccineNotices = vaccineNotices.filter(item => item.daysLeft <= 7);
  const pendingNotices = allBookings.flatMap(({ booking, kind }) => {
    if (booking.status === 'cancelled') return [];
    const due = calcBilling(booking).remaining;
    if (due <= 0) return [];
    const ownersList = kind === 'boarding' ? owners : fosterOwners;
    const overdueBy = booking.checkOutDate < currentDay ? daysBetween(booking.checkOutDate, currentDay) : 0;
    return [{ booking, kind, owner: ownersList.find(owner => owner.id === booking.ownerId), due, daysOverdue: overdueBy }];
  });
  const checkoutsTomorrow = allBookings.filter(({ booking }) => booking.status !== 'cancelled' && booking.checkOutDate === tomorrow);

  const sortedAttention: Array<{ key: string; rank: number; type: 'payment'; item: PaymentNotice } | { key: string; rank: number; type: 'vaccine'; item: VaccineNotice }> = [
    ...pendingNotices.filter(item => item.daysOverdue > 0).map(item => ({ key: `${item.kind}-${item.booking.id}`, rank: -item.daysOverdue, type: 'payment' as const, item })),
    ...vaccineNotices.map(item => ({ key: `${item.scope}-${item.pet.id}-${item.vaccine}-${item.expiry}`, rank: item.daysLeft, type: 'vaccine' as const, item })),
  ].sort((a, b) => a.rank - b.rank).slice(0, 8);

  const thisMonth = monthKey(new Date());
  const priorMonthDate = new Date();
  priorMonthDate.setDate(1);
  priorMonthDate.setMonth(priorMonthDate.getMonth() - 1);
  const lastMonth = monthKey(priorMonthDate);
  const eligible = allBookings.filter(({ booking }) => booking.status !== 'cancelled');
  const revenueTotal = (rows: typeof allBookings) => rows.reduce((sum, row) => sum + calcBilling(row.booking).total, 0);
  const boardingRevenue = revenueTotal(eligible.filter(row => row.kind === 'boarding'));
  const fosterRevenue = revenueTotal(eligible.filter(row => row.kind === 'foster'));
  const revenueAll = boardingRevenue + fosterRevenue;
  const revenueMonth = revenueTotal(eligible.filter(({ booking }) => monthKey(booking.checkOutDate || booking.checkInDate) === thisMonth));
  const revenueLastMonth = revenueTotal(eligible.filter(({ booking }) => monthKey(booking.checkOutDate || booking.checkInDate) === lastMonth));

  const currentOccupancy = eligible.filter(({ booking }) => booking.status === 'checked-in').length;
  const checkInsToday = eligible.filter(({ booking }) => booking.checkInDate === currentDay).length;
  const checkOutsToday = eligible.filter(({ booking }) => booking.checkOutDate === currentDay).length;
  const upcomingSevenDays = eligible.filter(({ booking }) => booking.checkInDate > currentDay && booking.checkInDate <= plusDays(7)).length;
  const completedBoardings = boardings.filter(booking => booking.status === 'checked-out');
  const completedNights = completedBoardings.reduce((sum, booking) => sum + calcNights(booking.checkInDate, booking.checkOutDate), 0);
  const avgStay = completedBoardings.length ? completedNights / completedBoardings.length : 0;
  const occupiedNights = eligible.reduce((sum, { booking }) => sum + calcNights(booking.checkInDate, booking.checkOutDate), 0);
  const revenuePerOccupiedDay = occupiedNights ? revenueAll / occupiedNights : 0;

  const repeatBookings30 = useMemo(() => {
    const cutoff = plusDays(-30);
    const recent = allBookings.filter(({ booking }) => booking.createdAt?.slice(0, 10) >= cutoff && booking.status !== 'cancelled');
    if (recent.length === 0) return 0;
    const priorKeys = new Set(allBookings
      .filter(({ booking }) => booking.createdAt?.slice(0, 10) < cutoff && booking.status !== 'cancelled')
      .map(({ booking, kind }) => `${kind}:${booking.ownerId}`));
    const repeatRecentCount = recent.filter(({ booking, kind }) => priorKeys.has(`${kind}:${booking.ownerId}`)).length;
    return Math.round((repeatRecentCount / recent.length) * 100);
  }, [allBookings]);

  const monthlyChart = useMemo(() => {
    const months: string[] = [];
    const cursor = new Date();
    cursor.setDate(1);
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(cursor);
      date.setMonth(date.getMonth() - i);
      months.push(monthKey(date));
    }
    return months.map(month => {
      const rows = eligible.filter(({ booking }) => monthKey(booking.checkOutDate || booking.checkInDate) === month);
      const date = new Date(`${month}-01T00:00:00`);
      return {
        month: date.toLocaleDateString('en-IN', { month: 'short' }),
        Revenue: Math.round(revenueTotal(rows)),
        Customers: [...owners, ...fosterOwners].filter(owner => monthKey(owner.createdAt) === month).length,
      };
    });
  }, [eligible, owners, fosterOwners]);

  const occupancyChart = useMemo(() => Array.from({ length: 14 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - index));
    const iso = dateKey(day);
    const count = eligible.filter(({ booking }) => booking.checkInDate <= iso && booking.checkOutDate > iso).length;
    return { day: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), Occupied: count };
  }), [eligible]);

  const activity = useMemo(() => [...allBookings].sort((a, b) =>
    new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime()).slice(0, 8), [allBookings]);

  const petName = (id: string, kind: BookingKind) => (kind === 'boarding' ? dogs : fosterDogs).find(pet => pet.id === id)?.name || 'Pet';
  const statusStyle = (status: Booking['status']) => {
    if (status === 'checked-in') return { label: 'Checked in', className: 'border-success/30 bg-success/15 text-success' };
    if (status === 'checked-out') return { label: 'Checked out', className: 'border-warning/40 bg-warning/20 text-warning-foreground' };
    if (status === 'reserved') return { label: 'Reserved', className: 'border-border bg-muted text-muted-foreground' };
    return { label: 'Cancelled', className: 'border-border bg-muted text-muted-foreground' };
  };

  const openBooking = (record: Booking, kind: BookingKind) => {
    setFilterDialog(null);
    if (kind === 'boarding') onClickBoarding(record.id);
    else onClickFosterDog(record.dogId);
  };
  const openPet = (notice: VaccineNotice) => {
    setFilterDialog(null);
    if (notice.scope === 'boarding') onClickDog(notice.pet.id);
    else onClickFosterDog(notice.pet.id);
  };
  const openOwner = (notice: PaymentNotice) => {
    setFilterDialog(null);
    if (!notice.owner) return openBooking(notice.booking, notice.kind);
    if (notice.kind === 'boarding') onClickOwner(notice.owner.id);
    else onClickFosterOwner(notice.owner.id);
  };

  const alertItems = [
    { key: 'vaccines' as const, count: weeklyVaccineNotices.length, text: `${weeklyVaccineNotices.length} vaccines expiring this week`, icon: ShieldAlert },
    { key: 'payments' as const, count: pendingNotices.reduce((sum, item) => sum + item.due, 0), text: `${money(pendingNotices.reduce((sum, item) => sum + item.due, 0))} in pending payments`, icon: IndianRupee },
    { key: 'checkouts' as const, count: checkoutsTomorrow.length, text: `${checkoutsTomorrow.length} check-out${checkoutsTomorrow.length === 1 ? '' : 's'} due tomorrow`, icon: CalendarClock },
  ].filter(item => item.count > 0);

  const kpis = [
    { label: 'Revenue · all time', value: money(revenueAll), detail: `Boarding ${money(boardingRevenue)} · Foster ${money(fosterRevenue)}`, icon: IndianRupee, tone: 'text-primary', tint: 'bg-primary/10' },
    { label: 'Revenue · this month', value: money(revenueMonth), detail: `vs ${money(revenueLastMonth)} last month`, icon: BarChart3, tone: 'text-success', tint: 'bg-success/10' },
    { label: 'Occupancy', value: `${currentOccupancy} / ${capacity} spots`, detail: 'Currently checked in', icon: Heart, tone: 'text-primary', tint: 'bg-primary/10', progress: Math.min(100, (currentOccupancy / capacity) * 100) },
    { label: 'Check-ins / check-outs today', value: `${checkInsToday} / ${checkOutsToday}`, detail: `${upcomingSevenDays} upcoming in 7 days`, icon: CalendarCheck, tone: 'text-warning-foreground', tint: 'bg-warning/20' },
    { label: 'Avg stay length', value: `${avgStay.toFixed(1)} days`, detail: `${money(revenuePerOccupiedDay)} revenue / occupied day`, icon: CalendarDays, tone: 'text-primary', tint: 'bg-primary/10' },
    { label: 'Repeat customers', value: `${repeatBookings30}%`, detail: 'of last 30 days', icon: Users, tone: 'text-success', tint: 'bg-success/10' },
  ];

  const actions: Array<{ action: QuickAction; label: string; icon: typeof Plus }> = [
    { action: 'booking', label: 'New Booking', icon: Plus },
    { action: 'customer', label: 'New Customer', icon: UserPlus },
    { action: 'pet', label: 'New Pet', icon: Dog },
    { action: 'invoice', label: 'Invoices', icon: FileText },
    { action: 'calendar', label: 'Calendar', icon: CalendarDays },
    { action: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const chartTooltip = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 };
  const filteredPayments = [...pendingNotices].sort((a, b) => b.daysOverdue - a.daysOverdue);
  const dialogTitle = filterDialog === 'vaccines' ? 'Vaccines expiring this week' : filterDialog === 'payments' ? 'Pending payments' : 'Check-outs due tomorrow';

  return (
    <div className="space-y-4 sm:space-y-6">
      {alertItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3 text-destructive sm:px-4" role="group" aria-label="Dashboard alerts">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 shrink-0" /> <span className="text-sm">Attention</span></div>
          {alertItems.map(item => (
            <Button key={item.key} variant="ghost" className="h-auto min-h-8 justify-start gap-2 whitespace-normal px-2 py-1 text-left text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setFilterDialog(item.key)}>
              <item.icon className="h-4 w-4 shrink-0" />{item.text}
            </Button>
          ))}
        </div>
      )}

      <section aria-label="Key business metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(({ label, value, detail, icon: Icon, tone, tint, progress }) => (
          <Card key={label} className="border-border/70">
            <CardContent className="flex min-h-[116px] items-start gap-3 p-4 sm:p-5">
              <div className={`mt-0.5 rounded-lg p-2.5 ${tint}`}><Icon className={`h-4 w-4 ${tone}`} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 break-words font-display text-xl font-bold leading-tight text-foreground">{value}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
                {progress !== undefined && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} /></div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {onQuickAction && (
        <section aria-label="Quick actions" className="flex flex-wrap gap-2">
          {actions.map(({ action, label, icon: Icon }) => (
            <Button key={action} variant="outline" className="h-10 flex-1 justify-center gap-2 sm:flex-none sm:justify-start" onClick={() => onQuickAction(action)}>
              <Icon className="h-4 w-4 text-primary" />{label}
            </Button>
          ))}
        </section>
      )}

      <section aria-label="Business trends" className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70"><CardContent className="p-4 sm:p-5">
          <h2 className="mb-4 font-display text-base font-bold">Revenue trend · last 6 months</h2>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={monthlyChart} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={chartTooltip} formatter={(value: number) => money(value)} />
              <Line type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>
        <Card className="border-border/70"><CardContent className="p-4 sm:p-5">
          <h2 className="mb-4 font-display text-base font-bold">Occupancy trend · last 14 days</h2>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={occupancyChart} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} interval="preserveStartEnd" />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} domain={[0, 10]} />
              <Tooltip contentStyle={chartTooltip} />
              <Line type="monotone" dataKey="Occupied" stroke="hsl(var(--success))" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>
        <Card className="border-border/70"><CardContent className="p-4 sm:p-5">
          <h2 className="mb-4 font-display text-base font-bold">New customers · last 6 months</h2>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyChart} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltip} />
              <Bar dataKey="Customers" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Card className="border-border/70"><CardContent className="p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold"><Clock3 className="h-4 w-4 text-primary" />Recent activity</h2>
          {activity.length === 0 ? <p className="py-5 text-sm text-muted-foreground">No recent stays yet.</p> : (
            <div className="divide-y divide-border">
              {activity.map(({ booking, kind }) => {
                const status = statusStyle(booking.status);
                const Icon = kind === 'boarding' ? PawPrint : Heart;
                return <button key={`${kind}-${booking.id}`} type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/50" onClick={() => openBooking(booking, kind)}>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="rounded-md bg-muted p-2"><Icon className="h-4 w-4 text-primary" /></span>
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold">{petName(booking.dogId, kind)}</span><span className="block text-xs text-muted-foreground">{kind === 'boarding' ? 'Boarding' : 'Foster'} · {booking.checkInDate} → {booking.checkOutDate}</span></span>
                  </span>
                  <Badge variant="outline" className={`shrink-0 whitespace-nowrap ${status.className}`}>{status.label}</Badge>
                </button>;
              })}
            </div>
          )}
        </CardContent></Card>

        <Card className="border-border/70"><CardContent className="p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold"><AlertTriangle className="h-4 w-4 text-destructive" />Needs attention</h2>
          {sortedAttention.length === 0 ? <div className="flex items-center gap-2 py-5 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success" />Nothing needs attention.</div> : (
            <div className="divide-y divide-border">
              {sortedAttention.map(item => item.type === 'payment' ? (
                <button key={item.key} type="button" className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-muted/50" onClick={() => openOwner(item.item)}>
                  <span className="rounded-md bg-destructive/10 p-2"><IndianRupee className="h-4 w-4 text-destructive" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.item.owner?.name || petName(item.item.booking.dogId, item.item.kind)}</span><span className="block text-xs text-muted-foreground">{money(item.item.due)} due</span></span>
                  <Badge variant="destructive" className="shrink-0">Overdue</Badge>
                </button>
              ) : (
                <button key={item.key} type="button" className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-muted/50" onClick={() => openPet(item.item)}>
                  <span className="rounded-md bg-warning/20 p-2"><ShieldAlert className="h-4 w-4 text-warning-foreground" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.item.pet.name}</span><span className="block text-xs text-muted-foreground">{item.item.vaccine} due · {item.item.daysLeft === 0 ? 'today' : `${item.item.daysLeft} days`}</span></span>
                  <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent></Card>
      </section>

      <Dialog open={filterDialog !== null} onOpenChange={open => { if (!open) setFilterDialog(null); }}>
        <DialogContent className="max-h-[85vh] w-[95vw] max-w-lg overflow-y-auto p-4 sm:p-6">
          <DialogHeader><DialogTitle className="font-display">{dialogTitle}</DialogTitle></DialogHeader>
          <div className="divide-y divide-border">
            {filterDialog === 'vaccines' && weeklyVaccineNotices.map(item => (
              <button key={`${item.scope}-${item.pet.id}-${item.vaccine}-${item.expiry}`} type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-muted/50" onClick={() => openPet(item)}>
                <span><span className="block font-semibold">{item.pet.name}</span><span className="text-xs text-muted-foreground">{item.vaccine} · {item.expiry}</span></span><Badge variant="outline">{item.daysLeft === 0 ? 'Due today' : `${item.daysLeft} days`}</Badge>
              </button>
            ))}
            {filterDialog === 'payments' && filteredPayments.map(item => (
              <button key={`${item.kind}-${item.booking.id}`} type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-muted/50" onClick={() => openBooking(item.booking, item.kind)}>
                <span><span className="block font-semibold">{item.owner?.name || petName(item.booking.dogId, item.kind)}</span><span className="text-xs text-muted-foreground">{petName(item.booking.dogId, item.kind)} · {item.booking.checkOutDate}</span></span><span className="font-semibold text-destructive">{money(item.due)}</span>
              </button>
            ))}
            {filterDialog === 'checkouts' && checkoutsTomorrow.map(({ booking, kind }) => (
              <button key={`${kind}-${booking.id}`} type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-muted/50" onClick={() => openBooking(booking, kind)}>
                <span><span className="block font-semibold">{petName(booking.dogId, kind)}</span><span className="text-xs text-muted-foreground">{kind === 'boarding' ? 'Boarding' : 'Foster'} · {booking.checkInDate} → {booking.checkOutDate}</span></span><CalendarClock className="h-4 w-4 text-primary" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}