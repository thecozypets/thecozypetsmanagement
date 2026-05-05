import { useState } from 'react';
import { Foster, Dog, Owner, BoardingStatus, PaymentStatus, PaymentMethod, AnimalType } from '@/types/boarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Pencil, Trash2, Calendar, DollarSign, Cat, Dog as DogIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FosterInvoiceModal from './FosterInvoiceModal';
import { calcBilling } from '@/lib/billing';

interface FosterFormData {
  dogId: string;
  ownerId: string;
  animalType: AnimalType;
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

const emptyForm: FosterFormData = { dogId: '', ownerId: '', animalType: 'dog', checkInDate: '', checkInTime: '', checkOutDate: '', checkOutTime: '', status: 'reserved', kennelNumber: '', dailyRate: 0, totalCost: 0, additionalCost: 0, specialRequests: '', feedingSchedule: '', notes: '', paymentStatus: 'outstanding', paidAmount: 0, paymentMethod: '' };

const formatTime12 = (time24: string) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
};

interface Props {
  fosters: Foster[];
  dogs: Dog[];
  owners: Owner[];
  onAdd: (data: FosterFormData) => void;
  onUpdate: (id: string, data: Partial<Foster>) => void;
  onDelete: (id: string) => void;
  onClickDog: (dogId: string) => void;
  onClickOwner: (ownerId: string) => void;
}

const statusColors: Record<BoardingStatus, string> = {
  'reserved': 'bg-warning/20 text-warning-foreground border-warning/30',
  'checked-in': 'bg-success/20 text-success-foreground border-success/30',
  'checked-out': 'bg-muted text-muted-foreground',
  'cancelled': 'bg-destructive/20 text-destructive border-destructive/30',
};

export default function FosterManager({ fosters, dogs, owners, onAdd, onUpdate, onDelete, onClickDog, onClickOwner }: Props) {
  const [form, setForm] = useState<FosterFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAnimal, setFilterAnimal] = useState<string>('all');
  const [invoiceFoster, setInvoiceFoster] = useState<Foster | null>(null);

  const calcDays = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const updateCost = (f: FosterFormData) => {
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

  const startEdit = (f: Foster) => {
    setForm({ dogId: f.dogId, ownerId: f.ownerId, animalType: f.animalType, checkInDate: f.checkInDate, checkInTime: f.checkInTime || '', checkOutDate: f.checkOutDate, checkOutTime: f.checkOutTime || '', status: f.status, kennelNumber: f.kennelNumber, dailyRate: f.dailyRate, totalCost: f.totalCost, additionalCost: f.additionalCost || 0, specialRequests: f.specialRequests, feedingSchedule: f.feedingSchedule, notes: f.notes, paymentStatus: f.paymentStatus || 'outstanding', paidAmount: f.paidAmount || 0, paymentMethod: f.paymentMethod || '' });
    setEditingId(f.id);
    setOpen(true);
  };

  const getDogName = (id: string) => dogs.find(d => d.id === id)?.name || 'Unknown';
  const getOwnerName = (id: string) => owners.find(o => o.id === id)?.name || 'Unknown';

  const filtered = fosters
    .filter(f => filterStatus === 'all' || f.status === filterStatus)
    .filter(f => filterAnimal === 'all' || f.animalType === filterAnimal);

  const handleDogChange = (dogId: string) => {
    const dog = dogs.find(d => d.id === dogId);
    setForm(p => ({ ...p, dogId, ownerId: dog?.ownerId || p.ownerId }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="checked-in">Checked In</SelectItem>
              <SelectItem value="checked-out">Checked Out</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAnimal} onValueChange={setFilterAnimal}>
            <SelectTrigger className="flex-1 sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Animals</SelectItem>
              <SelectItem value="dog">🐕 Dogs</SelectItem>
              <SelectItem value="cat">🐱 Cats</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto"><Heart className="mr-2 h-4 w-4" /> New Foster</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? 'Edit Foster' : 'New Foster'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Animal Type *</Label>
                <Select value={form.animalType} onValueChange={(v: AnimalType) => setForm(p => ({ ...p, animalType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">🐕 Dog</SelectItem>
                    <SelectItem value="cat">🐱 Cat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Pet *</Label>
                  <Select required value={form.dogId} onValueChange={handleDogChange}>
                    <SelectTrigger><SelectValue placeholder="Select pet" /></SelectTrigger>
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
                <div><Label>Check-in Date *</Label><Input required type="date" value={form.checkInDate} onChange={e => setForm(p => updateCost({ ...p, checkInDate: e.target.value }))} /></div>
                <div><Label>Check-in Time</Label><Input type="time" value={form.checkInTime} onChange={e => setForm(p => ({ ...p, checkInTime: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div><Label>Check-out Date *</Label><Input required type="date" value={form.checkOutDate} onChange={e => setForm(p => updateCost({ ...p, checkOutDate: e.target.value }))} /></div>
                <div><Label>Check-out Time</Label><Input type="time" value={form.checkOutTime} onChange={e => setForm(p => ({ ...p, checkOutTime: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div><Label>Kennel #</Label><Input value={form.kennelNumber} onChange={e => setForm(p => ({ ...p, kennelNumber: e.target.value }))} /></div>
                <div><Label>Daily Rate (₹)</Label><Input type="number" min={0} step={0.01} value={form.dailyRate} onChange={e => setForm(p => updateCost({ ...p, dailyRate: +e.target.value }))} /></div>
              </div>

              {/* Cost Breakdown */}
              {(() => {
                const bill = calcBilling(form);
                return (
                  <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Days × Daily Rate</Label>
                        <Input readOnly value={`${bill.days} × ₹${bill.dailyRate.toFixed(2)} = ₹${bill.subtotal.toFixed(2)}`} className="bg-background" />
                      </div>
                      <div>
                        <Label>Extra Amount (₹)</Label>
                        <Input type="number" min={0} step={0.01} value={form.additionalCost} onChange={e => setForm(p => ({ ...p, additionalCost: +e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-display font-bold">Total Amount</span>
                      <span className="font-display font-bold text-lg text-primary">₹{bill.total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

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
              <Button type="submit" className="w-full">{editingId ? 'Update' : 'Create Foster'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Heart className="mx-auto h-12 w-12 mb-4 opacity-40" />
          <p className="font-display text-lg">No fosters found</p>
          <p className="text-sm">Create your first foster entry</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {filtered.map(f => (
              <motion.div key={f.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-base sm:text-lg">
                          {f.animalType === 'cat' ? '🐱' : '🐕'}{' '}
                          <span className="cursor-pointer hover:text-primary transition-colors break-words" onClick={() => onClickDog(f.dogId)}>{getDogName(f.dogId)}</span>
                          <Badge variant="outline" className="ml-2 text-xs capitalize">{f.animalType}</Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          Owner: <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => onClickOwner(f.ownerId)}>{getOwnerName(f.ownerId)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-end shrink-0">
                        <Badge className={statusColors[f.status]}>{f.status}</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setInvoiceFoster(f)}><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(f)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(f.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    {(() => {
                      const bill = calcBilling(f);
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> In: {f.checkInDate}{f.checkInTime ? ` ${formatTime12(f.checkInTime)}` : ''}</div>
                            <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Out: {f.checkOutDate}{f.checkOutTime ? ` ${formatTime12(f.checkOutTime)}` : ''}</div>
                            {f.kennelNumber && <div>Kennel: #{f.kennelNumber}</div>}
                            <div className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> {bill.days}d × ₹{bill.dailyRate}{bill.additional > 0 ? ` + ₹${bill.additional}` : ''}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t text-sm sm:text-xs">
                            <div><div className="text-muted-foreground">Total</div><div className="font-bold text-base sm:text-sm">₹{bill.total.toFixed(2)}</div></div>
                            <div><div className="text-muted-foreground">Paid</div><div className="font-bold text-success text-base sm:text-sm">₹{bill.paid.toFixed(2)}</div></div>
                            {bill.remaining > 0 ? (
                              <div><div className="text-muted-foreground">Remaining</div><div className="font-bold text-destructive text-base sm:text-sm">₹{bill.remaining.toFixed(2)}</div></div>
                            ) : (
                              <div><div className="text-muted-foreground">Status</div><div className="font-bold text-success text-base sm:text-sm">Paid ✓</div></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={`text-xs ${f.paymentStatus === 'paid' ? 'border-success/50 text-success-foreground' : f.paymentStatus === 'partly-paid' ? 'border-warning/50 text-warning-foreground' : 'border-destructive/50 text-destructive'}`}>
                              {f.paymentStatus}
                            </Badge>
                            {f.paymentMethod && <span className="text-xs uppercase text-muted-foreground">{f.paymentMethod}</span>}
                          </div>
                        </>
                      );
                    })()}
                    {f.notes && <p className="text-xs text-muted-foreground mt-2 italic">{f.notes}</p>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <FosterInvoiceModal
        open={!!invoiceFoster}
        onOpenChange={(o) => { if (!o) setInvoiceFoster(null); }}
        foster={invoiceFoster}
        dog={invoiceFoster ? dogs.find(d => d.id === invoiceFoster.dogId) || null : null}
        owner={invoiceFoster ? owners.find(o => o.id === invoiceFoster.ownerId) || null : null}
      />
    </div>
  );
}
