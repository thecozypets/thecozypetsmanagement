import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Boarding, Dog, Owner, Foster } from '@/types/boarding';
import { calcBilling } from '@/lib/billing';
import {
  AlertTriangle, BarChart3, CalendarCheck, CalendarDays, Clock3, CreditCard, Dog as DogIcon,
  FileText, Heart, IndianRupee, LineChart as LineChartIcon, LogIn, LogOut, PawPrint, Plus,
  ShieldAlert, UserPlus, Users,
} from 'lucide-react';

type QuickAction = 'booking' | 'customer' | 'pet' | 'invoice' | 'calendar' | 'reports';
type AlertAction = 'vaccines' | 'payments' | 'checkouts';

interface Props {
  owners: Owner[];
  dogs: Dog[];
  boardings: Boarding[];
  fosters: Foster[];
  fosterOwners: Owner[];
  fosterDogs: Dog[];
  totalKennels?: number;
  onClickOwner: (ownerId: string) => void;
  onClickDog: (dogId: string) => void;
  onClickBoarding: (boardingId: string) => void;
  onClickFosterOwner: (ownerId: string) => void;
  onClickFosterDog: (dogId: string) => void;
  onQuickAction?: (action: QuickAction) => void;
  onAlert?: (action: AlertAction) => void;
}

const isoToday = () => new Date().toISOString().slice(0, 10);
const addDays = (amount: number) => {
  const date = new Date();
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
};
const monthKey = (date: string) => date.slice(0, 7);
const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;
const daysUntil = (date: string) => Math.round((new Date(`${date}T00:00:00`).getTime() - new Date(`${isoToday()}T00:00:00`).getTime()) / 86400000);

type VaccineAlert = { dog: Dog; name: string; expiry: string; days: number };
type AttentionItem =
  | { kind: 'vaccine'; dog: Dog; name: string; days: number }
  | { kind: 'payment'; owner: Owner; amount: number; days: number };

const statusStyles = {
  reserved: 'bg-muted text-muted-foreground border-border',
  'checked-in': 'bg-success/15 text-success border-success/30',
  'checked-out': 'bg-warning/15 text-warning-foreground border-warning/30',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
};

export default function Dashboard({
  owners, dogs, boardings, fosters, fosterOwners, fosterDogs, totalKennels = 10,
  onClickOwner, onClickDog, onClickBoarding, onClickFosterOwner, onClickFosterDog, onQuickAction, onAlert,
}: Props) {
  const today = isoToday();
  const tomorrow = addDays(1);
  const allDogs = [...dogs, ...fosterDogs];
  const allOwners = [...owners, ...fosterOwners];
  const activeBookings = [...boardings, ...fosters].filter(b => b.status === 'checked-in');
  const validBoardings = boardings.filter(b => b.status !== 'cancelled');
  const validFosters = fosters.filter(f => f.status !== 'cancelled');
  const validBookings = [...validBoardings, ...validFosters];

  const vaccineAlerts = useMemo<VaccineAlert[]>(() => allDogs.flatMap(dog =>
    (dog.vaccines || []).flatMap(vaccine => {
      if (!vaccine.expiry) return [];
      const days = daysUntil(vaccine.expiry);
      return days >= 0 && days <= 7 ? [{ dog, name: vaccine.name || 'Vaccine', expiry: vaccine.expiry, days }] : [];
    })
  ), [allDogs]);

  const stats = useMemo(() => {
    const boardingRevenue = validBoardings.reduce((sum, booking) => sum + calcBilling(booking).total, 0);
    const fosterRevenue = validFosters.reduce((sum, booking) => sum + calcBilling(booking).total, 0);
    const month = monthKey(today);
    const previousMonthDate = new Date(`${month}-01T00:00:00`);
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
    const previousMonth = monthKey(previousMonthDate.toISOString().slice(0, 10));
    const revenueForMonth = (key: string) => validBookings.reduce((sum, booking) => {
      const date = booking.checkOutDate || booking.checkInDate;
      return sum + (monthKey(date) === key ? calcBilling(booking).total : 0);
    }, 0);
    const completed = validBoardings.filter(booking => booking.status === 'checked-out');
    const occupiedDays = validBookings.reduce((sum, booking) => sum + Math.max(1, calcBilling(booking).units), 0);
    const completedStayDays = completed.reduce((sum, booking) => sum + calcBilling(booking).days, 0);
    const recentBookings = validBookings.filter(booking => booking.checkInDate >= addDays(-30));
    const previousOwnerIds = new Set(validBookings.filter(booking => booking.checkInDate < addDays(-30)).map(booking => booking.ownerId));
    const repeatBookings = recentBookings.filter(booking => previousOwnerIds.has(booking.ownerId)).length;
    const pendingPayments = validBookings.reduce((sum, booking) => sum + calcBilling(booking).remaining, 0);
    return {
      allTimeRevenue: boardingRevenue + fosterRevenue,
      boardingRevenue, fosterRevenue,
      monthRevenue: revenueForMonth(month), previousMonthRevenue: revenueForMonth(previousMonth),
      currentOccupancy: activeBookings.length,
      checkins: validBookings.filter(booking => booking.checkInDate === today).length,
      checkouts: validBookings.filter(booking => booking.checkOutDate === today).length,
      upcoming: validBookings.filter(booking => booking.checkInDate > today && booking.checkInDate <= addDays(7)).length,
      averageStay: completed.length ? completedStayDays / completed.length : 0,
      revenuePerDay: occupiedDays ? (boardingRevenue + fosterRevenue) / occupiedDays : 0,
      repeatRate: recentBookings.length ? (repeatBookings / recentBookings.length) * 100 : 0,
      pendingPayments,
    };
  }, [activeBookings.length, today, validBoardings, validBookings, validFosters]);

  const sixMonths = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return monthKey(date.toISOString().slice(0, 10));
  }), []);
  const revenueTrend = useMemo(() => sixMonths.map(key => ({
    month: new Date(`${key}-01T00:00:00`).toLocaleString('en-IN', { month: 'short' }),
    Boarding: Math.round(validBoardings.filter(b => monthKey(b.checkOutDate || b.checkInDate) === key).reduce((sum, b) => sum + calcBilling(b).total, 0)),
    Foster: Math.round(validFosters.filter(f => monthKey(f.checkOutDate || f.checkInDate) === key).reduce((sum, f) => sum + calcBilling(f).total, 0)),
  })), [sixMonths, validBoardings, validFosters]);
  const occupancyTrend = useMemo(() => Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const day = date.toISOString().slice(0, 10);
    return { day: day.slice(5), Occupied: validBookings.filter(b => b.checkInDate <= day && b.checkOutDate >= day).length };
  }), [validBookings]);
  const customerTrend = useMemo(() => sixMonths.map(key => ({
    month: new Date(`${key}-01T00:00:00`).toLocaleString('en-IN', { month: 'short' }),
    Customers: allOwners.filter(owner => monthKey(owner.createdAt) === key).length,
  })), [allOwners, sixMonths]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const vaccineItems: AttentionItem[] = allDogs.flatMap(dog => (dog.vaccines || []).flatMap(vaccine => {
      if (!vaccine.expiry) return [];
      const days = daysUntil(vaccine.expiry);
      return days <= 30 ? [{ kind: 'vaccine' as const, dog, name: vaccine.name || 'Vaccine', days }] : [];
    }));
    const paymentItems: AttentionItem[] = validBookings.flatMap(booking => {
      const amount = calcBilling(booking).remaining;
      const owner = allOwners.find(item => item.id === booking.ownerId);
      return amount > 0 && owner ? [{ kind: 'payment' as const, owner, amount, days: daysUntil(booking.checkOutDate) }] : [];
    });
    return [...vaccineItems, ...paymentItems].sort((a, b) => a.days - b.days).slice(0, 8);
  }, [allDogs, allOwners, validBookings]);

  const recentActivity = useMemo(() => [
    ...validBoardings.map(booking => ({ ...booking, kind: 'Boarding' as const, pet: dogs.find(dog => dog.id === booking.dogId), click: () => onClickBoarding(booking.id) })),
    ...validFosters.map(booking => ({ ...booking, kind: 'Foster' as const, pet: fosterDogs.find(dog => dog.id === booking.dogId), click: () => onClickFosterDog(booking.dogId) })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8), [dogs, fosterDogs, onClickBoarding, onClickFosterDog, validBoardings, validFosters]);

  const alerts = [
    vaccineAlerts.length > 0 ? { label: `${vaccineAlerts.length} vaccine${vaccineAlerts.length === 1 ? '' : 's'} expiring this week`, icon: ShieldAlert, action: 'vaccines' as const } : null,
    stats.pendingPayments > 0 ? { label: `${money(stats.pendingPayments)} in pending payments`, icon: CreditCard, action: 'payments' as const } : null,
    [...validBookings].filter(booking => booking.checkOutDate === tomorrow).length > 0 ? { label: `${validBookings.filter(booking => booking.checkOutDate === tomorrow).length} check-out(s) due tomorrow`, icon: Clock3, action: 'checkouts' as const } : null,
  ].filter(Boolean) as Array<{ label: string; icon: typeof ShieldAlert; action: AlertAction }>;

  const kpis = [
    { label: 'Revenue · all time', value: money(stats.allTimeRevenue), subtext: `Boarding ${money(stats.boardingRevenue)} · Foster ${money(stats.fosterRevenue)}`, icon: IndianRupee, tone: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Revenue · this month', value: money(stats.monthRevenue), subtext: `vs ${money(stats.previousMonthRevenue)} last month`, icon: LineChartIcon, tone: 'text-success', bg: 'bg-success/10' },
    { label: 'Occupancy', value: `${stats.currentOccupancy}/${totalKennels}`, subtext: `${totalKennels ? Math.round((stats.currentOccupancy / totalKennels) * 100) : 0}% of available spots`, icon: PawPrint, tone: 'text-primary', bg: 'bg-primary/10', progress: totalKennels ? Math.min(100, (stats.currentOccupancy / totalKennels) * 100) : 0 },
    { label: 'Check-ins / check-outs today', value: `${stats.checkins} / ${stats.checkouts}`, subtext: `${stats.upcoming} upcoming in 7 days`, icon: CalendarCheck, tone: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Avg stay length', value: `${stats.averageStay.toFixed(1)} days`, subtext: `${money(stats.revenuePerDay)} revenue per occupied day`, icon: CalendarDays, tone: 'text-accent-foreground', bg: 'bg-accent' },
    { label: 'Repeat customers', value: `${Math.round(stats.repeatRate)}%`, subtext: 'of last 30 days', icon: Users, tone: 'text-primary', bg: 'bg-primary/10' },
  ];
  const actions: Array<{ label: string; icon: typeof Plus; key: QuickAction }> = [
    { label: 'New Booking', icon: Plus, key: 'booking' }, { label: 'New Customer', icon: UserPlus, key: 'customer' },
    { label: 'New Pet', icon: DogIcon, key: 'pet' }, { label: 'Invoices', icon: FileText, key: 'invoice' },
    { label: 'Calendar', icon: CalendarDays, key: 'calendar' }, { label: 'Reports', icon: BarChart3, key: 'reports' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {alerts.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-destructive px-4 py-3 text-destructive-foreground shadow-[var(--shadow-soft)]" role="alert">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {alerts.map(alert => <button key={alert.action} type="button" className="flex items-center gap-2 text-left text-sm font-semibold underline-offset-4 hover:underline" onClick={() => onAlert?.(alert.action)}><alert.icon className="h-4 w-4" />{alert.label}</button>)}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(kpi => <Card key={kpi.label} className="border-border/60 shadow-[var(--shadow-soft)]"><CardContent className="p-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{kpi.label}</p><p className="mt-1 truncate font-display text-2xl font-extrabold text-foreground">{kpi.value}</p></div><div className={`rounded-xl p-2 ${kpi.bg}`}><kpi.icon className={`h-4 w-4 ${kpi.tone}`} /></div></div>
          <p className="mt-2 text-xs text-muted-foreground">{kpi.subtext}</p>
          {'progress' in kpi && <Progress value={kpi.progress} className="mt-3 h-1.5" />}
        </CardContent></Card>)}
      </div>

      {onQuickAction && <div className="flex flex-wrap gap-2">{actions.map(action => <Button key={action.key} variant="outline" className="h-10 gap-2 bg-card" onClick={() => onQuickAction(action.key)}><action.icon className="h-4 w-4 text-primary" />{action.label}</Button>)}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent className="p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><LineChartIcon className="h-4 w-4 text-primary" /><h3 className="font-display font-bold">Revenue trend</h3></div><ResponsiveContainer width="100%" height={240}><LineChart data={revenueTrend}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={value => `₹${value}`} /><Tooltip formatter={(value: number) => money(value)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} /><Legend /><Line type="monotone" dataKey="Boarding" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="Foster" stroke="hsl(var(--warning))" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><PawPrint className="h-4 w-4 text-primary" /><h3 className="font-display font-bold">Occupancy trend · 14 days</h3></div><ResponsiveContainer width="100%" height={240}><LineChart data={occupancyTrend}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis domain={[0, totalKennels]} ticks={[0, Math.ceil(totalKennels / 2), totalKennels]} stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} /><Tooltip formatter={(value: number) => [`${value}/${totalKennels}`, 'Occupied']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} /><Line type="monotone" dataKey="Occupied" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 2 }} /></LineChart></ResponsiveContainer></CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /><h3 className="font-display font-bold">New customers / month</h3></div><ResponsiveContainer width="100%" height={240}><BarChart data={customerTrend}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} /><Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} /><Bar dataKey="Customers" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card><CardContent className="p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-primary" /><h3 className="font-display font-bold">Recent activity</h3></div>{recentActivity.length === 0 ? <p className="text-sm text-muted-foreground">No recent activity.</p> : <div className="space-y-1">{recentActivity.map(activity => <button type="button" key={`${activity.kind}-${activity.id}`} onClick={activity.click} className="flex w-full items-center justify-between gap-3 rounded-xl border-b border-border/70 px-2 py-3 text-left last:border-0 hover:bg-muted/50"><div className="flex min-w-0 items-center gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary">{activity.kind === 'Foster' ? <Heart className="h-4 w-4" /> : <DogIcon className="h-4 w-4" />}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{activity.pet?.name || 'Unknown pet'} <span className="font-normal text-muted-foreground">· {activity.kind}</span></p><p className="text-xs text-muted-foreground">{activity.checkInDate} → {activity.checkOutDate}</p></div></div><Badge className={`shrink-0 border ${statusStyles[activity.status]}`}>{activity.status === 'checked-in' ? 'Checked in' : activity.status === 'checked-out' ? 'Checked out' : activity.status === 'reserved' ? 'Reserved' : 'Cancelled'}</Badge></button>)}</div>}</CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /><h3 className="font-display font-bold">Needs attention</h3></div>{attentionItems.length === 0 ? <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p> : <div className="space-y-1">{attentionItems.map((item, index) => item.kind === 'vaccine' ? <button type="button" key={`vaccine-${item.dog.id}-${item.name}-${index}`} onClick={() => onClickDog(item.dog.id)} className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-muted/50"><ShieldAlert className="h-4 w-4 shrink-0 text-warning" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.dog.name}</span><span className="block text-xs text-muted-foreground">{item.name} due · {item.days < 0 ? 'overdue' : `${item.days} days remaining`}</span></span></button> : <button type="button" key={`payment-${item.owner.id}-${index}`} onClick={() => onClickOwner(item.owner.id)} className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-muted/50"><CreditCard className="h-4 w-4 shrink-0 text-destructive" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.owner.name}</span><span className="block text-xs text-muted-foreground">{money(item.amount)} due</span></span><Badge variant="destructive">Overdue</Badge></button>)}</div>}</CardContent></Card>
      </div>
    </div>
  );
}
