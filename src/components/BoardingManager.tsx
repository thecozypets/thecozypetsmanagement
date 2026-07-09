import { useState } from 'react';
import { Boarding, Dog, Owner, BoardingStatus, PaymentStatus, PaymentMethod, LastDayCharge, DiscountType, BookingSource, BookingExtra, ExtraCategory } from '@/types/boarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarPlus, Pencil, Trash2, Calendar, DollarSign, FileText, Plus, X, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceModal from './InvoiceModal';
import { calcBilling, lastDayLabel } from '@/lib/billing';

const EXTRA_CATALOG: { category: ExtraCategory; label: string; defaultAmount: number }[] = [
  { category: 'bath', label: 'Bath', defaultAmount: 300 },
  { category: 'grooming', label: 'Grooming', defaultAmount: 800 },
  { category: 'pickup', label: 'Pickup', defaultAmount: 200 },
  { category: 'drop', label: 'Drop', defaultAmount: 200 },
  { category: 'training', label: 'Training Session', defaultAmount: 500 },
  { category: 'medicine', label: 'Medicine', defaultAmount: 100 },
  { category: 'special-food', label: 'Special Food', defaultAmount: 150 },
  { category: 'vet-visit', label: 'Vet Visit', defaultAmount: 1000 },
];

interface BoardingFormData {
  dogId: string;
  ownerId: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  status: BoardingStatus;
  kennelNumber: string;
  dailyRate: number;
  totalCost: number;
  additionalCost: number;
  specialRequests: string;
  feedingSchedule: string;
  notes: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  lastDayCharge: LastDayCharge;
  daycarePrice: number;
  discountType: DiscountType;
  discountValue: number;
  discountReason: string;
  source: BookingSource;
  tags: string[];
  internalNotes: string;
  couponCode: string;
  extras: BookingExtra[];
}

const emptyForm: BoardingFormData = { dogId: '', ownerId: '', checkInDate: '', checkInTime: '', checkOutDate: '', checkOutTime: '', status: 'reserved', kennelNumber: '', dailyRate: 0, totalCost: 0, additionalCost: 0, specialRequests: '', feedingSchedule: '', notes: '', paymentStatus: 'outstanding', paidAmount: 0, paymentMethod: '', lastDayCharge: 'none', daycarePrice: 0, discountType: 'none', discountValue: 0, discountReason: '', source: 'walk-in', tags: [], internalNotes: '', couponCode: '', extras: [] };

const formatTime12 = (time24: string) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
};

interface Props {
  boardings: Boarding[];
  dogs: Dog[];
  owners: Owner[];
  onAdd: (data: BoardingFormData) => void;
  onUpdate: (id: string, data: Partial<Boarding>) => void;
  onDelete: (id: string) => void;
  onClickBoarding: (boardingId: string) => void;
  onClickDog: (dogId: string) => void;
  onClickOwner: (ownerId: string) => void;
}

const statusColors: Record<BoardingStatus, string> = {
  'reserved': 'bg-warning/20 text-warning-foreground border-warning/30',
  'checked-in': 'bg-success/20 text-success-foreground border-success/30',
  'checked-out': 'bg-muted text-muted-foreground',
  'cancelled': 'bg-destructive/20 text-destructive border-destructive/30',
};

export default function BoardingManager({ boardings, dogs, owners, onAdd, onUpdate, onDelete, onClickBoarding, onClickDog, onClickOwner }: Props) {
  const [form, setForm] = useState<BoardingFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [invoiceBoarding, setInvoiceBoarding] = useState<Boarding | null>(null);

  const calcDays = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const updateCost = (f: BoardingFormData) => {
    const bill = calcBilling(f);
    return { ...f, totalCost: bill.total };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const final = updateCost(form);
    const bill = calcBilling(final);
    if (bill.discount > bill.subtotal + bill.additional) {
      alert('Discount cannot exceed the subtotal.');
      return;
    }
    if (editingId) { onUpdate(editingId, final); } else { onAdd(final); }
    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
  };

  const startEdit = (b: Boarding) => {
    const legacyLdc: LastDayCharge = (b.lastDayCharge && (b.lastDayCharge as string) !== 'none') ? 'daycare' : 'none';
    setForm({ dogId: b.dogId, ownerId: b.ownerId, checkInDate: b.checkInDate, checkInTime: b.checkInTime || '', checkOutDate: b.checkOutDate, checkOutTime: b.checkOutTime || '', status: b.status, kennelNumber: b.kennelNumber, dailyRate: b.dailyRate, totalCost: b.totalCost, additionalCost: b.additionalCost || 0, specialRequests: b.specialRequests, feedingSchedule: b.feedingSchedule, notes: b.notes, paymentStatus: b.paymentStatus || 'outstanding', paidAmount: b.paidAmount || 0, paymentMethod: b.paymentMethod || '', lastDayCharge: legacyLdc, daycarePrice: (b as any).daycarePrice || 0, discountType: b.discountType || 'none', discountValue: b.discountValue || 0, discountReason: b.discountReason || '', source: (b as any).source || 'walk-in', tags: (b as any).tags || [], internalNotes: (b as any).internalNotes || '', couponCode: (b as any).couponCode || '', extras: (b as any).extras ? [...(b as any).extras] : [] });
    setEditingId(b.id);
    setOpen(true);
  };

  const getDogName = (id: string) => dogs.find(d => d.id === id)?.name || 'Unknown';
  const getOwnerName = (id: string) => owners.find(o => o.id === id)?.name || 'Unknown';

  const filtered = boardings.filter(b => filterStatus === 'all' || b.status === filterStatus);

  const handleDogChange = (dogId: string) => {
    const dog = dogs.find(d => d.id === dogId);
    setForm(p => ({ ...p, dogId, ownerId: dog?.ownerId || p.ownerId }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bookings</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="checked-in">Checked In</SelectItem>
            <SelectItem value="checked-out">Checked Out</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto"><CalendarPlus className="mr-2 h-4 w-4" /> New Booking</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? 'Edit Booking' : 'New Booking'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Dog *</Label>
                  <Select required value={form.dogId} onValueChange={handleDogChange}>
                    <SelectTrigger><SelectValue placeholder="Select dog" /></SelectTrigger>
                    <SelectContent>{dogs.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Owner</Label>
                  <Select value={form.ownerId} onValueChange={v => setForm(p => ({ ...p, ownerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                    <SelectContent>{owners.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Check-in Date *</Label>
                  <Input required type="date" value={form.checkInDate} onChange={e => setForm(p => updateCost({ ...p, checkInDate: e.target.value }))} />
                </div>
                <div>
                  <Label>Check-in Time</Label>
                  <Input type="time" value={form.checkInTime} onChange={e => setForm(p => ({ ...p, checkInTime: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Check-out Date *</Label>
                  <Input required type="date" value={form.checkOutDate} onChange={e => setForm(p => updateCost({ ...p, checkOutDate: e.target.value }))} />
                </div>
                <div>
                  <Label>Check-out Time</Label>
                  <Input type="time" value={form.checkOutTime} onChange={e => setForm(p => ({ ...p, checkOutTime: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div><Label>Kennel #</Label><Input value={form.kennelNumber} onChange={e => setForm(p => ({ ...p, kennelNumber: e.target.value }))} /></div>
                <div><Label>Daily Rate (₹)</Label><Input type="number" min={0} step={0.01} value={form.dailyRate} onChange={e => setForm(p => updateCost({ ...p, dailyRate: +e.target.value }))} /></div>
              </div>

              {/* Last Day Charge + Discount + Breakdown */}
              {(() => {
                const bill = calcBilling(form);
                const invalidDiscount = bill.discountType !== 'none' && (bill.discountValue > 0) && bill.discount >= (bill.subtotal + bill.additional) && bill.discountType === 'fixed' && bill.discountValue > (bill.subtotal + bill.additional);
                return (
                  <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Last Day Charge</Label>
                        <Select value={form.lastDayCharge} onValueChange={(v: LastDayCharge) => setForm(p => updateCost({ ...p, lastDayCharge: v, daycarePrice: v === 'none' ? 0 : p.daycarePrice }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (no extra charge)</SelectItem>
                            <SelectItem value="daycare">Daycare</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Daycare Price (₹)</Label>
                        <Input type="number" min={0} step={0.01} disabled={form.lastDayCharge === 'none'} value={form.daycarePrice} onChange={e => setForm(p => updateCost({ ...p, daycarePrice: +e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Additional Services (₹)</Label>
                        <Input type="number" min={0} step={0.01} value={form.additionalCost} onChange={e => setForm(p => updateCost({ ...p, additionalCost: +e.target.value }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label>Discount Type</Label>
                        <Select value={form.discountType} onValueChange={(v: DiscountType) => setForm(p => ({ ...p, discountType: v, discountValue: v === 'none' ? 0 : p.discountValue }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Discount Value {form.discountType === 'percentage' ? '(%)' : form.discountType === 'fixed' ? '(₹)' : ''}</Label>
                        <Input type="number" min={0} step={0.01} disabled={form.discountType === 'none'} value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: +e.target.value }))} />
                      </div>
                      <div>
                        <Label>Discount Reason</Label>
                        <Input placeholder="Optional" disabled={form.discountType === 'none'} value={form.discountReason} onChange={e => setForm(p => ({ ...p, discountReason: e.target.value }))} />
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="pt-2 border-t space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Boarding ({bill.nights} night{bill.nights === 1 ? '' : 's'} × ₹{bill.dailyRate.toFixed(2)})</span><span>₹{bill.boardingCharge.toFixed(2)}</span></div>
                      {bill.lastDayUnits > 0 && (
                        <div className="flex justify-between"><span className="text-muted-foreground">Daycare (₹{bill.daycarePrice.toFixed(2)})</span><span>₹{bill.daycareCharge.toFixed(2)}</span></div>
                      )}
                      {bill.additional > 0 && (
                        <div className="flex justify-between"><span className="text-muted-foreground">Additional Services</span><span>₹{bill.additional.toFixed(2)}</span></div>
                      )}
                      <div className="flex justify-between font-medium"><span>Subtotal</span><span>₹{(bill.subtotal + bill.additional).toFixed(2)}</span></div>
                      {bill.discount > 0 && (
                        <div className="flex justify-between text-success"><span>Discount {bill.discountType === 'percentage' ? `(${bill.discountValue}%)` : ''}</span><span>− ₹{bill.discount.toFixed(2)}</span></div>
                      )}
                      {invalidDiscount && (
                        <div className="text-xs text-destructive">Discount cannot exceed the subtotal.</div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-display font-bold">Grand Total</span>
                      <span className="font-display font-bold text-lg text-primary">₹{bill.total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Extras / Add-on Services */}
              <div className="rounded-lg border bg-muted/20 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Extra Services</Label>
                  <span className="text-xs text-muted-foreground">{form.extras.length} item{form.extras.length === 1 ? '' : 's'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EXTRA_CATALOG.map(cat => (
                    <Button key={cat.category} type="button" size="sm" variant="outline" className="h-7 text-xs gap-1"
                      onClick={() => setForm(p => ({ ...p, extras: [...p.extras, { category: cat.category, label: cat.label, amount: cat.defaultAmount, quantity: 1 }] }))}>
                      <Plus className="h-3 w-3" /> {cat.label}
                    </Button>
                  ))}
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1"
                    onClick={() => setForm(p => ({ ...p, extras: [...p.extras, { category: 'custom', label: '', amount: 0, quantity: 1 }] }))}>
                    <Plus className="h-3 w-3" /> Custom
                  </Button>
                </div>
                {form.extras.length > 0 && (
                  <div className="space-y-2">
                    {form.extras.map((ex, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Label className="text-xs">Label</Label>
                          <Input className="h-8" value={ex.label} placeholder="Service name" onChange={e => setForm(p => ({ ...p, extras: p.extras.map((x, i) => i === idx ? { ...x, label: e.target.value } : x) }))} />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Amount (₹)</Label>
                          <Input className="h-8" type="number" min={0} step={0.01} value={ex.amount} onChange={e => setForm(p => ({ ...p, extras: p.extras.map((x, i) => i === idx ? { ...x, amount: +e.target.value } : x) }))} />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Qty</Label>
                          <Input className="h-8" type="number" min={1} step={1} value={ex.quantity} onChange={e => setForm(p => ({ ...p, extras: p.extras.map((x, i) => i === idx ? { ...x, quantity: +e.target.value || 1 } : x) }))} />
                        </div>
                        <div className="col-span-1">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            onClick={() => setForm(p => ({ ...p, extras: p.extras.filter((_, i) => i !== idx) }))}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-1 border-t">
                      <span className="text-muted-foreground">Extras Subtotal</span>
                      <span className="font-semibold">₹{form.extras.reduce((s, x) => s + (x.amount || 0) * (x.quantity || 1), 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Booking metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Booking Source</Label>
                  <Select value={form.source} onValueChange={(v: BookingSource) => setForm(p => ({ ...p, source: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Coupon / Promo Code</Label>
                  <Input placeholder="Optional" value={form.couponCode} onChange={e => setForm(p => ({ ...p, couponCode: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Tags</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.tags.map((t, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter((_, idx) => idx !== i) }))}>
                      {t} <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
                <Input placeholder="Type a tag and press Enter (e.g. VIP, aggressive, senior)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !form.tags.includes(val)) {
                        setForm(p => ({ ...p, tags: [...p.tags, val] }));
                      }
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>


              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: BoardingStatus) => setForm(p => ({ ...p, status: v, paymentStatus: v === 'cancelled' && p.paymentStatus === 'outstanding' ? 'paid' : p.paymentStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="checked-out">Checked Out</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Feeding Schedule</Label><Input value={form.feedingSchedule} onChange={e => setForm(p => ({ ...p, feedingSchedule: e.target.value }))} /></div>

              {/* Payment Section */}
              {(() => {
                const bill = calcBilling(form);
                return (
                  <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label>Payment Status</Label>
                        <Select value={form.paymentStatus} onValueChange={(v: PaymentStatus) => setForm(p => ({ ...p, paymentStatus: v, paidAmount: v === 'paid' ? bill.total : v === 'outstanding' ? 0 : p.paidAmount }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partly-paid">Partly Paid</SelectItem>
                            {form.status !== 'cancelled' && <SelectItem value="outstanding">Outstanding</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Mode of Payment</Label>
                        <Select value={form.paymentMethod || 'none'} onValueChange={(v) => setForm(p => ({ ...p, paymentMethod: v === 'none' ? '' : v as PaymentMethod }))}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not set</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Paid Amount (₹)</Label>
                        <Input type="number" min={0} step={0.01} value={form.paidAmount} onChange={e => setForm(p => ({ ...p, paidAmount: +e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                      <div className="text-center"><div className="text-xs text-muted-foreground">Total</div><div className="font-bold text-base">₹{bill.total.toFixed(2)}</div></div>
                      <div className="text-center"><div className="text-xs text-muted-foreground">Paid</div><div className="font-bold text-success text-base">₹{bill.paid.toFixed(2)}</div></div>
                      {bill.remaining > 0 ? (
                        <div className="text-center"><div className="text-xs text-muted-foreground">Remaining</div><div className="font-bold text-destructive text-base">₹{bill.remaining.toFixed(2)}</div></div>
                      ) : (
                        <div className="text-center"><div className="text-xs text-muted-foreground">Status</div><div className="font-bold text-success text-base">Paid ✓</div></div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div><Label>Special Requests</Label><Textarea value={form.specialRequests} onChange={e => setForm(p => ({ ...p, specialRequests: e.target.value }))} /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button type="submit" className="w-full">{editingId ? 'Update' : 'Create Booking'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarPlus className="mx-auto h-12 w-12 mb-4 opacity-40" />
          <p className="font-display text-lg">No bookings found</p>
          <p className="text-sm">Create your first boarding reservation</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {filtered.map(b => (
              <motion.div key={b.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-base sm:text-lg truncate">
                          🐕 <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => onClickDog(b.dogId)}>{getDogName(b.dogId)}</span>
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          Owner: <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => onClickOwner(b.ownerId)}>{getOwnerName(b.ownerId)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-end shrink-0">
                        <Badge className={`cursor-pointer ${statusColors[b.status]}`} onClick={() => onClickBoarding(b.id)}>{b.status}</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Invoice" onClick={() => setInvoiceBoarding(b)}><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    {(() => {
                      const bill = calcBilling(b);
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> In: {b.checkInDate}{b.checkInTime ? ` ${formatTime12(b.checkInTime)}` : ''}</div>
                            <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Out: {b.checkOutDate}{b.checkOutTime ? ` ${formatTime12(b.checkOutTime)}` : ''}</div>
                            {b.kennelNumber && <div>Kennel: #{b.kennelNumber}</div>}
                            <div className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> {bill.days}d × ₹{bill.dailyRate}{bill.additional > 0 ? ` + ₹${bill.additional}` : ''}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t">
                            <div className="rounded-md bg-primary/10 p-2 text-center"><div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Total</div><div className="font-display font-extrabold text-lg sm:text-base text-primary">₹{bill.total.toFixed(2)}</div></div>
                            <div className="rounded-md bg-success/15 p-2 text-center"><div className="text-[10px] uppercase tracking-wide text-success/80 font-semibold">Paid</div><div className="font-display font-extrabold text-lg sm:text-base text-success">₹{bill.paid.toFixed(2)}</div></div>
                            {bill.remaining > 0 ? (
                              <div className="rounded-md bg-destructive/15 p-2 text-center"><div className="text-[10px] uppercase tracking-wide text-destructive/80 font-semibold">Due</div><div className="font-display font-extrabold text-lg sm:text-base text-destructive">₹{bill.remaining.toFixed(2)}</div></div>
                            ) : (
                              <div className="rounded-md bg-success/15 p-2 text-center"><div className="text-[10px] uppercase tracking-wide text-success/80 font-semibold">Status</div><div className="font-display font-extrabold text-lg sm:text-base text-success">Paid ✓</div></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs font-bold uppercase ${b.paymentStatus === 'paid' ? 'bg-success text-success-foreground' : b.paymentStatus === 'partly-paid' ? 'bg-warning text-warning-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                              {b.paymentStatus}
                            </Badge>
                            {b.paymentMethod && <span className="text-xs uppercase font-bold text-foreground bg-muted px-2 py-0.5 rounded">{b.paymentMethod}</span>}
                          </div>
                        </>
                      );
                    })()}
                    {b.notes && <p className="text-xs text-muted-foreground mt-2 italic">{b.notes}</p>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <InvoiceModal
        open={!!invoiceBoarding}
        onOpenChange={(v) => { if (!v) setInvoiceBoarding(null); }}
        boarding={invoiceBoarding}
        dog={invoiceBoarding ? dogs.find(d => d.id === invoiceBoarding.dogId) || null : null}
        owner={invoiceBoarding ? owners.find(o => o.id === invoiceBoarding.ownerId) || null : null}
        allBoardings={boardings}
        allDogs={dogs}
      />
    </div>
  );
}
