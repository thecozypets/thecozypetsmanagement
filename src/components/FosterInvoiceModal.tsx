import { useRef, useMemo, useState, useEffect } from 'react';
import { Foster, Dog, Owner } from '@/types/boarding';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Printer, Download, Save, StickyNote } from 'lucide-react';
import { calcBilling } from '@/lib/billing';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foster: Foster | null;
  dog: Dog | null;
  owner: Owner | null;
  allFosters?: Foster[];
  allDogs?: Dog[];
  onUpdatePaid?: (id: string, paidAmount: number, paymentStatus: 'paid' | 'partly-paid' | 'outstanding') => void;
}

const rangesOverlap = (a1: string, a2: string, b1: string, b2: string) => {
  if (!a1 || !a2 || !b1 || !b2) return false;
  return new Date(a1).getTime() <= new Date(b2).getTime() && new Date(b1).getTime() <= new Date(a2).getTime();
};

export default function FosterInvoiceModal({ open, onOpenChange, foster, dog, owner, allFosters = [], allDogs = [], onUpdatePaid }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { settings } = useCompanySettings();

  const groupFosters = useMemo(() => {
    if (!foster || !owner) return [];
    const list = allFosters.length ? allFosters : [foster];
    const matched = list.filter(f =>
      f.ownerId === owner.id &&
      f.status !== 'cancelled' &&
      rangesOverlap(foster.checkInDate, foster.checkOutDate, f.checkInDate, f.checkOutDate)
    );
    const map = new Map<string, Foster>();
    matched.forEach(f => map.set(f.id, f));
    map.set(foster.id, foster);
    return Array.from(map.values());
  }, [foster, owner, allFosters]);

  const items = useMemo(() => groupFosters.map(f => {
    const d = allDogs.find(x => x.id === f.dogId) || (foster && f.id === foster.id ? dog : null);
    return { foster: f, dog: d, bill: calcBilling(f) };
  }), [groupFosters, allDogs, dog, foster]);

  const totals = items.reduce((acc, it) => {
    acc.subtotal += it.bill.subtotal;
    acc.additional += it.bill.additional;
    acc.total += it.bill.total;
    acc.paid += it.bill.paid;
    return acc;
  }, { subtotal: 0, additional: 0, total: 0, paid: 0 });

  const [paidInput, setPaidInput] = useState<number>(totals.paid);
  useEffect(() => { setPaidInput(totals.paid); }, [totals.paid, foster?.id]);

  if (!foster || !dog || !owner) return null;

  const remaining = Math.max(0, totals.total - paidInput);
  const invoiceNumber = `FINV-${foster.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const noteKey = `finv-note-${foster.id}`;
  const [noteText, setNoteText] = useState('');
  useEffect(() => {
    try { setNoteText(localStorage.getItem(noteKey) || ''); } catch { /* noop */ }
  }, [noteKey]);
  const updateNote = (v: string) => {
    setNoteText(v);
    try { localStorage.setItem(noteKey, v); } catch { /* noop */ }
  };
  const multiple = items.length > 1;

  const handleSavePaid = () => {
    if (!onUpdatePaid) return;
    const newPaid = Math.max(0, paidInput);
    // Distribute proportionally across fosters by each item's total.
    let remainingToAllocate = newPaid;
    items.forEach((it, idx) => {
      const share = totals.total > 0
        ? (idx === items.length - 1 ? remainingToAllocate : Math.min(remainingToAllocate, (it.bill.total / totals.total) * newPaid))
        : 0;
      remainingToAllocate = Math.max(0, remainingToAllocate - share);
      const rounded = Math.round(share * 100) / 100;
      const status: 'paid' | 'partly-paid' | 'outstanding' =
        rounded >= it.bill.total - 0.01 ? 'paid' : rounded <= 0 ? 'outstanding' : 'partly-paid';
      onUpdatePaid(it.foster.id, rounded, status);
    });
  };

  const handlePrint = () => {
    const content = invoiceRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Invoice ${invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const companyName = settings.companyName || 'The Cozy Pets';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            Foster Invoice {multiple && <span className="text-xs font-normal text-muted-foreground">({items.length} pets)</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={handlePrint} size="sm" className="gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>

        {/* Editable paid amount */}
        {onUpdatePaid && (
          <div className="mb-4 rounded-lg border bg-muted/30 p-3 space-y-2">
            <Label className="text-xs uppercase tracking-wide font-semibold">Total Paid by Owner (editable)</Label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input type="number" min={0} step={0.01} value={paidInput} onChange={e => setPaidInput(+e.target.value)} />
              <Button size="sm" className="gap-2" onClick={handleSavePaid}><Save className="h-4 w-4" /> Save</Button>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="text-center rounded-md bg-background p-2 border">
                <div className="text-[10px] uppercase text-muted-foreground font-semibold">Total</div>
                <div className="font-bold text-base">₹{totals.total.toFixed(2)}</div>
              </div>
              <div className="text-center rounded-md bg-background p-2 border">
                <div className="text-[10px] uppercase text-muted-foreground font-semibold">Paid</div>
                <div className="font-bold text-base text-success">₹{paidInput.toFixed(2)}</div>
              </div>
              <div className="text-center rounded-md bg-background p-2 border">
                <div className="text-[10px] uppercase text-muted-foreground font-semibold">Remaining</div>
                <div className={`font-bold text-base ${remaining > 0 ? 'text-destructive' : 'text-success'}`}>₹{remaining.toFixed(2)}</div>
              </div>
            </div>
            {multiple && <p className="text-[11px] text-muted-foreground">Paid amount will be split proportionally across the {items.length} fosters in this stay.</p>}
          </div>
        )}

        <div ref={invoiceRef} className="bg-white text-foreground p-6 rounded-lg border">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {settings.logoUrl ?
                <img src={settings.logoUrl} alt="Logo" style={{ height: '48px', maxWidth: '120px', objectFit: 'contain' }} /> :
                <span style={{ fontSize: '32px' }}>🐾</span>
              }
              <div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>{companyName}</div>
                {settings.companyPhone && <div style={{ fontSize: '12px', color: '#666' }}>📞 {settings.companyPhone}</div>}
                {settings.companyEmail && <div style={{ fontSize: '12px', color: '#666' }}>✉️ {settings.companyEmail}</div>}
                {settings.companyAddress && <div style={{ fontSize: '12px', color: '#666', maxWidth: '250px' }}>📍 {settings.companyAddress}</div>}
                {settings.gstNumber && <div style={{ fontSize: '11px', color: '#888' }}>GST: {settings.gstNumber}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '28px', color: '#2563eb', fontWeight: 700 }}>INVOICE</h2>
              <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{invoiceNumber}</p>
              <p style={{ fontSize: '13px', color: '#666' }}>Date: {invoiceDate}</p>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Foster Care</p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Owner & Pets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '8px' }}>Bill To</div>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>{owner.name}</p>
              <p style={{ fontSize: '13px', color: '#555' }}>{owner.phone}</p>
              {owner.email && <p style={{ fontSize: '13px', color: '#555' }}>{owner.email}</p>}
              {owner.address && <p style={{ fontSize: '13px', color: '#555' }}>{owner.address}</p>}
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '8px' }}>
                {multiple ? `Pets (${items.length})` : 'Pet Details'}
              </div>
              {items.map(it => it.dog && (
                <div key={it.foster.id} style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>{it.foster.animalType === 'cat' ? '🐱' : '🐕'} {it.dog.name}</p>
                  <p style={{ fontSize: '12px', color: '#555' }}>
                    {it.dog.breed} • {it.dog.age}y {it.dog.ageMonths ? `${it.dog.ageMonths}m` : ''} • {it.dog.weight}kg
                    {it.foster.kennelNumber && ` • Kennel #${it.foster.kennelNumber}`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-pet breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map(it => (
              <div key={it.foster.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ background: '#eff6ff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dbeafe' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a' }}>
                      {it.foster.animalType === 'cat' ? '🐱' : '🐕'} {it.dog?.name || 'Pet'}
                      {it.foster.kennelNumber && <span style={{ fontSize: '12px', fontWeight: 500, color: '#475569', marginLeft: '8px' }}>Kennel #{it.foster.kennelNumber}</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {it.foster.checkInDate} → {it.foster.checkOutDate}
                    </div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb' }}>₹{it.bill.total.toFixed(2)}</div>
                </div>
                <div style={{ padding: '8px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px dashed #f1f5f9' }}>
                    <span style={{ color: '#334155' }}>
                      Foster Care
                      <span style={{ color: '#94a3b8', marginLeft: '6px' }}>{it.bill.days} day{it.bill.days === 1 ? '' : 's'} × ₹{it.bill.dailyRate.toFixed(2)}</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>₹{it.bill.subtotal.toFixed(2)}</span>
                  </div>
                  {it.bill.additional > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                      <span style={{ color: '#334155' }}>Extra Amount</span>
                      <span style={{ fontWeight: 600 }}>₹{it.bill.additional.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Grand totals */}
          <div style={{ marginTop: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px' }}>
            {multiple && (
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '8px' }}>
                Combined Totals ({items.length} pets)
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Foster Charges</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.additional > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Extra Amount</span>
                  <span>₹{totals.additional.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '12px', padding: '12px 14px', background: '#2563eb', color: 'white', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.5px' }}>GRAND TOTAL</span>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>₹{totals.total.toFixed(2)}</span>
            </div>

            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: remaining > 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 600 }}>Paid</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>₹{paidInput.toFixed(2)}</div>
              </div>
              {remaining > 0 && (
                <div style={{ background: 'white', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 600 }}>Remaining</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626', marginTop: '2px' }}>₹{remaining.toFixed(2)}</div>
                </div>
              )}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 600 }}>Mode</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginTop: '4px', textTransform: 'uppercase' }}>
                  {foster.paymentMethod || '—'}
                </div>
              </div>
            </div>
          </div>

          {items.some(it => it.foster.notes) && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '6px' }}>Notes</div>
              <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: '#555' }}>
                {items.filter(it => it.foster.notes).map(it => (
                  <div key={it.foster.id}>{multiple && <strong>{it.dog?.name}: </strong>}{it.foster.notes}</div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '40px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>Thank you for choosing {companyName}! 🐾</p>
            <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>This is a computer-generated invoice.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
