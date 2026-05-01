import { useState } from 'react';
import { Boarding, Dog, Owner, BoardingStatus, PaymentStatus, PaymentMethod } from '@/types/boarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarPlus, Pencil, Trash2, Calendar, DollarSign, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceModal from './InvoiceModal';

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
}

const emptyForm: BoardingFormData = { dogId: '', ownerId: '', checkInDate: '', checkInTime: '', checkOutDate: '', checkOutTime: '', status: 'reserved', kennelNumber: '', dailyRate: 0, totalCost: 0, additionalCost: 0, specialRequests: '', feedingSchedule: '', notes: '', paymentStatus: 'outstanding', paidAmount: 0, paymentMethod: '' };

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
    const days = calcDays(f.checkInDate, f.checkOutDate);
    return { ...f, totalCost: days * f.dailyRate };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const final = updateCost(form);
    if (editingId) { onUpdate(editingId, final); } else { onAdd(final); }
    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
  };

  const startEdit = (b: Boarding) => {
    setForm({ dogId: b.dogId, ownerId: b.ownerId, checkInDate: b.checkInDate, checkInTime: b.checkInTime || '', checkOutDate: b.checkOutDate, checkOutTime: b.checkOutTime || '', status: b.status, kennelNumber: b.kennelNumber, dailyRate: b.dailyRate, totalCost: b.totalCost, additionalCost: b.additionalCost || 0, specialRequests: b.specialRequests, feedingSchedule: b.feedingSchedule, notes: b.notes, paymentStatus: b.paymentStatus || 'outstanding', paidAmount: b.paidAmount || 0, paymentMethod: b.paymentMethod || '' });
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div><Label>Kennel #</Label><Input value={form.kennelNumber} onChange={e => setForm(p => ({ ...p, kennelNumber: e.target.value }))} /></div>
                <div><Label>Daily Rate (₹)</Label><Input type="number" min={0} step={0.01} value={form.dailyRate} onChange={e => setForm(p => updateCost({ ...p, dailyRate: +e.target.value }))} /></div>
                <div><Label>Total Cost</Label><Input readOnly value={`₹${form.totalCost.toFixed(2)}`} className="bg-muted" /></div>
                <div><Label>Additional Cost (₹)</Label><Input type="number" min={0} step={0.01} value={form.additionalCost} onChange={e => setForm(p => ({ ...p, additionalCost: +e.target.value }))} /></div>
              </div>
              <div>
                <Label className="font-bold">Total Amount: ₹{(form.totalCost + form.additionalCost).toFixed(2)}</Label>
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
              
              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label>Payment Status</Label>
                  <Select value={form.paymentStatus} onValueChange={(v: PaymentStatus) => setForm(p => ({ ...p, paymentStatus: v, paidAmount: v === 'paid' ? p.totalCost : v === 'outstanding' ? 0 : p.paidAmount }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partly-paid">Partly Paid</SelectItem>
                      {form.status !== 'cancelled' && <SelectItem value="outstanding">Outstanding</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Paid Amount (₹)</Label>
                  <Input type="number" min={0} step={0.01} value={form.paidAmount} disabled={form.paymentStatus === 'paid' || form.paymentStatus === 'outstanding'} onChange={e => setForm(p => ({ ...p, paidAmount: +e.target.value }))} />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={form.paymentMethod || 'none'} onValueChange={(v) => setForm(p => ({ ...p, paymentMethod: v === 'none' ? '' : v as PaymentMethod }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-display font-bold text-lg">
                          🐕 <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => onClickDog(b.dogId)}>{getDogName(b.dogId)}</span>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Owner: <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => onClickOwner(b.ownerId)}>{getOwnerName(b.ownerId)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={`cursor-pointer ${statusColors[b.status]}`} onClick={() => onClickBoarding(b.id)}>{b.status}</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Invoice" onClick={() => setInvoiceBoarding(b)}><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> In: {b.checkInDate}{b.checkInTime ? ` ${formatTime12(b.checkInTime)}` : ''}</div>
                      <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Out: {b.checkOutDate}{b.checkOutTime ? ` ${formatTime12(b.checkOutTime)}` : ''}</div>
                      {b.kennelNumber && <div>Kennel: #{b.kennelNumber}</div>}
                       <div className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Total Amount: ₹{(b.totalCost + (b.additionalCost || 0)).toFixed(2)}</div>
                      <div>
                        <Badge variant="outline" className={`text-xs ${b.paymentStatus === 'paid' ? 'border-success/50 text-success-foreground' : b.paymentStatus === 'partly-paid' ? 'border-warning/50 text-warning-foreground' : 'border-destructive/50 text-destructive'}`}>
                          {b.paymentStatus === 'partly-paid' ? `Partly ₹${b.paidAmount}` : b.paymentStatus}
                        </Badge>
                        {b.paymentMethod && <span className="text-xs ml-1 uppercase">{b.paymentMethod}</span>}
                      </div>
                    </div>
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
      />
    </div>
  );
}
