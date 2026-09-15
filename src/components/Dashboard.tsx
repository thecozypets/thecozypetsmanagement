import { useMemo, useState } from 'react';
import { Boarding, Dog, Foster, Owner, VaccineRecord } from '@/types/boarding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, ArrowDownLeft, ArrowUpRight, CalendarDays, Clock3, Dog as DogIcon,
  FileText, IndianRupee, LineChart as LineChartIcon, PawPrint, Plus, ReceiptIndianRupee,
  ShieldAlert, TrendingUp, UserPlus, Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import { calcBilling } from '@/lib/billing';
import { useCompanySettings } from '@/hooks/useCompanySettings';

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

type Stay = (Boarding | Foster) & { kind: 'Boarding' | 'Foster'; petName: string; ownerName: string; scope: 'boarding' | 'foster' };
type AttentionItem = { id: string; kind: 'vaccine' | 'payment'; title: string; detail: string; sort: number; petId?: string; scope: 'boarding' | 'foster' };

const DAY = 86_400_000;
const isoToday = () => new Date().toISOString().slice(0, 10);
const addDays = (date: string, count: number) => {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + count);
  return value.toISOString().slice(0, 10);
};
const monthKey = (date: string | Date) => {
  const value = typeof date === 'string' ? new Date(`${date.slice(0, 10)}T12:00:00`) : date;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
};
const stayDays = (start: string, end: string) => Math.max(1, Math.round((new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / DAY));
const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;
const statusLabel = (status: string) => status === 'checked-in' ? 'Checked in' : status === 'checked-out' ? 'Completed' : status === 'reserved' ? 'Reserved' : 'Cancelled';
const statusClass = (status: string) => status === 'checked-in'
  ? 'bg-success/15 text-success border-success/30'
  : status === 'checked-out'
    ? 'bg-warning/20 text-warning-foreground border-warning/40'
    : status === 'reserved'
      ? 'bg-muted text-muted-foreground border-border'
      : 'bg-destructive/15 text-destructive border-destructive/30';

export default function Dashboard({
  owners, dogs, boardings, fosters, fosterOwners, fosterDogs,
  onClickDog, onClickBoarding, onClickFosterDog, onQuickAction,
}: Props) {
  const { settings } = useCompanySettings();
  const capacity = Math.max(1, settings.kennelCapacity || 10);
  const today = isoToday();
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 7);
  const [detail, setDetail] = useState<{ title: string; stays?: Stay[]; vaccines?: AttentionItem[] } | null>(null);

  const allStays = useMemo<Stay[]>(() => [
    ...boardings.map(b => ({ ...b, kind: 'Boarding' as const, scope: 'boarding' as const, petName: dogs.find(d => d.id === b.dogId)?.name || 'Unknown pet', ownerName: owners.find(o => o.id === b.ownerId)?.name || 'Unknown owner' })),
    ...fosters.map(f => ({ ...f, kind: 'Foster' as const, scope: 'foster' as const, petName: fosterDogs.find(d => d.id === f.dogId)?.name || 'Unknown pet', ownerName: fosterOwners.find(o => o.id === f.ownerId)?.name || 'Unknown owner' })),
  ], [boardings, fosters, dogs, fosterDogs, owners, fosterOwners]);

  const vaccineItems = useMemo<AttentionItem[]>(() => {
    const collect = (pets: Dog[], scope: 'boarding' | 'foster') => pets.flatMap(pet => (pet.vaccines || [])
      .filter((v: VaccineRecord) => Boolean(v.expiry))
      .map((v: VaccineRecord) => ({
        id: `${scope}-${pet.id}-${v.name}-${v.expiry}`, kind: 'vaccine' as const,
        title: `${pet.name} · ${v.name}`, detail: v.expiry < today ? `Expired ${v.expiry}` : `Due ${v.expiry}`,
        sort: new Date(`${v.expiry}T12:00:00`).getTime(), petId: pet.id, scope,
      })));
    return [...collect(dogs, 'boarding'), ...collect(fosterDogs, 'foster')].sort((a, b) => a.sort - b.sort);
  }, [dogs, fosterDogs, today]);

  const metrics = useMemo(() => {
    const valid = allStays.filter(s => s.status !== 'cancelled');
    const boardingValid = boardings.filter(b => b.status !== 'cancelled');
    const fosterValid = fosters.filter(f => f.status !== 'cancelled');
    const boardingRevenue = boardingValid.reduce((sum, stay) => sum + calcBilling(stay).total, 0);
    const fosterRevenue = fosterValid.reduce((sum, stay) => sum + calcBilling(stay).total, 0);
    const currentMonth = monthKey(new Date());
    const previousDate = new Date(); previousDate.setMonth(previousDate.getMonth() - 1);
    const previousMonth = monthKey(previousDate);
    const monthRevenue = (key: string) => valid.filter(s => monthKey(s.checkOutDate || s.checkInDate) === key).reduce((sum, stay) => sum + calcBilling(stay).total, 0);
    const active = valid.filter(s => s.status === 'checked-in' || (s.checkInDate <= today && s.checkOutDate >= today && s.status === 'reserved'));
    const checkIns = valid.filter(s => s.checkInDate === today);
    const checkOuts = valid.filter(s => s.checkOutDate === today);
    const upcoming = valid.filter(s => s.checkInDate > today && s.checkInDate <= weekEnd);
    const completedBoardings = boardingValid.filter(b => b.status === 'checked-out');
    const averageStay = completedBoardings.length ? completedBoardings.reduce((sum, b) => sum + stayDays(b.checkInDate, b.checkOutDate), 0) / completedBoardings.length : 0;
    const occupiedDays = valid.reduce((sum, stay) => sum + stayDays(stay.checkInDate, stay.checkOutDate), 0);
    const recentStart = addDays(today, -30);
    const recentBookings = valid.filter(s => s.checkInDate >= recentStart && s.checkInDate <= today);
    const repeatCount = recentBookings.filter(stay => valid.some(previous => previous.ownerId === stay.ownerId && previous.scope === stay.scope && previous.checkInDate < stay.checkInDate)).length;
    const pending = valid.filter(s => calcBilling(s).remaining > 0);
    const pendingTotal = pending.reduce((sum, stay) => sum + calcBilling(stay).remaining, 0);
    const tomorrowCheckouts = valid.filter(s => s.checkOutDate === tomorrow);
    return {
      boardingRevenue, fosterRevenue, totalRevenue: boardingRevenue + fosterRevenue,
      thisMonth: monthRevenue(currentMonth), lastMonth: monthRevenue(previousMonth), active, checkIns, checkOuts, upcoming,
      averageStay, revenuePerDay: occupiedDays ? (boardingRevenue + fosterRevenue) / occupiedDays : 0,
      repeatRate: recentBookings.length ? Math.round((repeatCount / recentBookings.length) * 100) : 0,
      pending, pendingTotal, tomorrowCheckouts,
    };
  }, [allStays, boardings, fosters, today, tomorrow, weekEnd]);

  const expiringThisWeek = vaccineItems.filter(item => item.detail.startsWith('Due') && item.sort <= new Date(`${weekEnd}T23:59:59`).getTime());

  const lastSixMonths = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - (5 - index));
    return { key: monthKey(date), label: date.toLocaleString('en-IN', { month: 'short' }) };
  }), []);

  const revenueTrend = useMemo(() => lastSixMonths.map(month => ({
    month: month.label,
    Revenue: Math.round(allStays.filter(s => s.status !== 'cancelled' && monthKey(s.checkOutDate || s.checkInDate) === month.key).reduce((sum, s) => sum + calcBilling(s).total, 0)),
  })), [allStays, lastSixMonths]);

  const customerTrend = useMemo(() => lastSixMonths.map(month => ({
    month: month.label,
    Customers: [...owners, ...fosterOwners].filter(owner => monthKey(owner.createdAt) === month.key).length,
  })), [owners, fosterOwners, lastSixMonths]);

  const occupancyTrend = useMemo(() => Array.from({ length: 14 }, (_, index) => {
    const date = addDays(today, index - 13);
    return {
      day: date.slice(5),
      Occupied: allStays.filter(s => s.status !== 'cancelled' && s.checkInDate <= date && s.checkOutDate >= date).length,
    };
  }), [allStays, today]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const renewals = vaccineItems.filter(item => item.sort <= new Date(`${addDays(today, 30)}T23:59:59`).getTime());
    const payments = metrics.pending.filter(stay => stay.checkOutDate < today).map(stay => ({
      id: `payment-${stay.scope}-${stay.id}`, kind: 'payment' as const, title: stay.ownerName,
      detail: `${money(calcBilling(stay).remaining)} · Overdue`, sort: new Date(`${stay.checkOutDate}T12:00:00`).getTime(), scope: stay.scope,
    }));
    return [...renewals, ...payments].sort((a, b) => a.sort - b.sort).slice(0, 8);
  }, [vaccineItems, metrics.pending, today]);

  const recentActivity = [...allStays].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  const alerts = [
    expiringThisWeek.length ? { label: `${expiringThisWeek.length} vaccine${expiringThisWeek.length === 1 ? '' : 's'} expiring this week`, icon: ShieldAlert, action: () => setDetail({ title: 'Vaccines expiring this week', vaccines: expiringThisWeek }) } : null,
    metrics.pendingTotal > 0 ? { label: `${money(metrics.pendingTotal)} in pending payments`, icon: ReceiptIndianRupee, action: () => setDetail({ title: 'Pending payments', stays: metrics.pending }) } : null,
    metrics.tomorrowCheckouts.length ? { label: `${metrics.tomorrowCheckouts.length} check-out${metrics.tomorrowCheckouts.length === 1 ? '' : 's'} due tomorrow`, icon: Clock3, action: () => setDetail({ title: 'Check-outs due tomorrow', stays: metrics.tomorrowCheckouts }) } : null,
  ].filter(Boolean) as { label: string; icon: typeof AlertTriangle; action: () => void }[];

  const kpis = [
    { label: 'Revenue (all-time)', value: money(metrics.totalRevenue), subtext: `Boarding ${money(metrics.boardingRevenue)} · Foster ${money(metrics.fosterRevenue)}`, icon: IndianRupee },
    { label: 'Revenue (this month)', value: money(metrics.thisMonth), subtext: `vs ${money(metrics.lastMonth)} last month`, icon: TrendingUp },
    { label: 'Occupancy', value: `${metrics.active.length} / ${capacity} spots`, subtext: `${Math.min(100, Math.round((metrics.active.length / capacity) * 100))}% filled`, icon: PawPrint, progress: Math.min(100, (metrics.active.length / capacity) * 100) },
    { label: 'Check-ins / check-outs today', value: `${metrics.checkIns.length} / ${metrics.checkOuts.length}`, subtext: `${metrics.upcoming.length} upcoming in 7 days`, icon: CalendarDays },
    { label: 'Avg stay length', value: `${metrics.averageStay.toFixed(1)} days`, subtext: `${money(metrics.revenuePerDay)} revenue / occupied day`, icon: LineChartIcon },
    { label: 'Repeat customers', value: `${metrics.repeatRate}%`, subtext: 'of last 30 days', icon: Users },
  ];

  const actions = [
    { key: 'booking' as const, label: 'New Booking', icon: Plus }, { key: 'customer' as const, label: 'New Customer', icon: UserPlus },
    { key: 'pet' as const, label: 'New Pet', icon: DogIcon }, { key: 'invoice' as const, label: 'Invoices', icon: FileText },
    { key: 'calendar' as const, label: 'Calendar', icon: CalendarDays }, { key: 'reports' as const, label: 'Reports', icon: LineChartIcon },
  ];

  const openStay = (stay: Stay) => {
    setDetail(null);
    if (stay.scope === 'boarding') onClickBoarding(stay.id);
    else onClickFosterDog(stay.dogId);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {alerts.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-destructive" role="alert">
          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
            {alerts.map(alert => (
              <Button key={alert.label} variant="ghost" className="h-auto justify-start gap-2 px-1.5 py-1 text-left text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={alert.action}>
                <alert.icon className="h-4 w-4 shrink-0" /><span className="text-sm font-semibold">{alert.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi, index) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}>
            <Card className="h-full border-border/70">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{kpi.label}</p><p className="mt-1 font-display text-2xl font-extrabold text-foreground">{kpi.value}</p></div>
                  <div className="rounded-lg bg-primary/10 p-2.5"><kpi.icon className="h-5 w-5 text-primary" /></div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{kpi.subtext}</p>
                {kpi.progress !== undefined && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${kpi.progress}%` }} /></div>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {onQuickAction && (
        <section aria-label="Quick actions" className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
          {actions.map(action => <Button key={action.key} variant="outline" className="shrink-0 gap-2 bg-card" onClick={() => onQuickAction(action.key)}><action.icon className="h-4 w-4 text-primary" />{action.label}</Button>)}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue trend" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height={230}><LineChart data={revenueTrend}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={(value: number) => money(value)} /><Line type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Occupancy trend" subtitle="Last 14 days">
          <ResponsiveContainer width="100%" height={230}><LineChart data={occupancyTrend}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis domain={[0, capacity]} stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} /><Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} /><Line type="monotone" dataKey="Occupied" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="New customers / month" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height={230}><BarChart data={customerTrend}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} /><Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} /><Bar dataKey="Customers" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Card className="border-border/70">
          <CardHeader className="pb-2"><CardTitle className="font-display text-lg">Recent activity</CardTitle></CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? <EmptyState text="No recent activity." /> : <div className="divide-y divide-border">
              {recentActivity.map(stay => <button key={`${stay.scope}-${stay.id}`} className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/40" onClick={() => openStay(stay)}>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{stay.petName} <span className="font-normal text-muted-foreground">· {stay.kind}</span></p><p className="mt-0.5 text-xs text-muted-foreground">{stay.checkInDate} → {stay.checkOutDate}</p></div>
                <Badge variant="outline" className={`shrink-0 ${statusClass(stay.status)}`}>{statusLabel(stay.status)}</Badge>
              </button>)}
            </div>}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 font-display text-lg"><AlertTriangle className="h-5 w-5 text-warning" />Needs attention</CardTitle></CardHeader>
          <CardContent>
            {attentionItems.length === 0 ? <EmptyState text="Nothing needs attention." /> : <div className="divide-y divide-border">
              {attentionItems.map(item => <button key={item.id} className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-muted/40" onClick={() => item.kind === 'vaccine' && item.petId ? (item.scope === 'boarding' ? onClickDog(item.petId) : onClickFosterDog(item.petId)) : setDetail({ title: 'Overdue payments', stays: metrics.pending.filter(stay => stay.checkOutDate < today) })}>
                <div className={`rounded-lg p-2 ${item.kind === 'vaccine' ? 'bg-warning/15 text-warning-foreground' : 'bg-destructive/10 text-destructive'}`}>{item.kind === 'vaccine' ? <ShieldAlert className="h-4 w-4" /> : <ReceiptIndianRupee className="h-4 w-4" />}</div>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className={`text-xs ${item.kind === 'payment' ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>{item.detail}</p></div>
              </button>)}
            </div>}
          </CardContent>
        </Card>
      </section>

      <Dialog open={Boolean(detail)} onOpenChange={open => { if (!open) setDetail(null); }}>
        <DialogContent className="max-h-[85vh] w-[95vw] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{detail?.title}</DialogTitle></DialogHeader>
          <div className="divide-y divide-border">
            {detail?.stays?.map(stay => <button key={`${stay.scope}-${stay.id}`} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-muted/40" onClick={() => openStay(stay)}><div><p className="text-sm font-semibold">{stay.petName} · {stay.ownerName}</p><p className="text-xs text-muted-foreground">{stay.checkInDate} → {stay.checkOutDate}</p></div>{calcBilling(stay).remaining > 0 ? <span className="font-bold text-destructive">{money(calcBilling(stay).remaining)}</span> : <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}</button>)}
            {detail?.vaccines?.map(item => <button key={item.id} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-muted/40" onClick={() => item.petId && (item.scope === 'boarding' ? onClickDog(item.petId) : onClickFosterDog(item.petId))}><div><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{item.detail}</p></div><ArrowDownLeft className="h-4 w-4 text-muted-foreground" /></button>)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <Card className="border-border/70"><CardHeader className="pb-0"><div className="flex items-baseline justify-between gap-2"><CardTitle className="font-display text-base">{title}</CardTitle><span className="text-xs text-muted-foreground">{subtitle}</span></div></CardHeader><CardContent className="px-2 pb-3 pt-3 sm:px-4">{children}</CardContent></Card>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex min-h-28 items-center justify-center text-sm text-muted-foreground">{text}</div>;
}
