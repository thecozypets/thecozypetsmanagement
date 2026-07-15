import { useRef, useMemo, useState, useEffect } from 'react';
import { Boarding, Dog, Owner } from '@/types/boarding';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, StickyNote, Save } from 'lucide-react';
import { calcBilling, lastDayLabel } from '@/lib/billing';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boarding: Boarding | null;
  dog: Dog | null;
  owner: Owner | null;
  allBoardings?: Boarding[];
  allDogs?: Dog[];
  onUpdatePaid?: (id: string, paidAmount: number, paymentStatus: 'paid' | 'partly-paid' | 'outstanding') => void;
}

// Two date ranges overlap if a.start <= b.end and b.start <= a.end
const rangesOverlap = (a1: string, a2: string, b1: string, b2: string) => {
  if (!a1 || !a2 || !b1 || !b2) return false;
  return new Date(a1).getTime() <= new Date(b2).getTime() && new Date(b1).getTime() <= new Date(a2).getTime();
};

export default function InvoiceModal({ open, onOpenChange, boarding, dog, owner, allBoardings = [], allDogs = [] }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { settings } = useCompanySettings();

  // Find all overlapping boardings for the same owner (excluding cancelled)
  const groupBoardings = useMemo(() => {
    if (!boarding || !owner) return [];
    const list = allBoardings.length ? allBoardings : [boarding];
    const matched = list.filter(b =>
      b.ownerId === owner.id &&
      b.status !== 'cancelled' &&
      rangesOverlap(boarding.checkInDate, boarding.checkOutDate, b.checkInDate, b.checkOutDate)
    );
    // Always include the selected boarding, and dedupe
    const map = new Map<string, Boarding>();
    matched.forEach(b => map.set(b.id, b));
    map.set(boarding.id, boarding);
    return Array.from(map.values());
  }, [boarding, owner, allBoardings]);

  if (!boarding || !dog || !owner) return null;

  const items = groupBoardings.map(b => {
    const d = allDogs.find(x => x.id === b.dogId) || (b.id === boarding.id ? dog : null);
    return { boarding: b, dog: d, bill: calcBilling(b) };
  });

  const totals = items.reduce((acc, it) => {
    acc.boarding += it.bill.boardingCharge;
    acc.daycare += it.bill.daycareCharge;
    acc.subtotal += it.bill.subtotal;
    acc.additional += it.bill.additional;
    acc.extras += it.bill.extrasTotal;
    acc.discount += it.bill.discount;
    acc.total += it.bill.total;
    acc.paid += it.bill.paid;
    return acc;
  }, { boarding: 0, daycare: 0, subtotal: 0, additional: 0, extras: 0, discount: 0, total: 0, paid: 0 });
  const remaining = Math.max(0, totals.total - totals.paid);

  const invoiceNumber = `INV-${boarding.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const noteKey = `invoice-note-${boarding.id}`;
  const [noteText, setNoteText] = useState('');
  useEffect(() => {
    try { setNoteText(localStorage.getItem(noteKey) || ''); } catch { /* noop */ }
  }, [noteKey]);
  const updateNote = (v: string) => {
    setNoteText(v);
    try { localStorage.setItem(noteKey, v); } catch { /* noop */ }
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
  const multiple = items.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            Invoice Preview {multiple && <span className="text-xs font-normal text-muted-foreground">({items.length} pets)</span>}
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

        <div className="mb-4 rounded-lg border bg-muted/30 p-3 space-y-2">
          <Label className="text-xs uppercase tracking-wide font-semibold flex items-center gap-2">
            <StickyNote className="h-3.5 w-3.5" /> Note / Payment History (editable)
          </Label>
          <Textarea
            rows={3}
            placeholder="e.g. ₹2000 paid via UPI on 10-Jul-2026, ₹1500 cash on check-out..."
            value={noteText}
            onChange={e => updateNote(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">Saved automatically. Appears on the printed invoice.</p>
        </div>



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
            </div>
          </div>

          <Separator className="my-4" />

          {/* Owner & Pets Info */}
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
                <div key={it.boarding.id} style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>🐕 {it.dog.name}</p>
                  <p style={{ fontSize: '12px', color: '#555' }}>
                    {it.dog.breed} • {it.dog.age}y {it.dog.ageMonths ? `${it.dog.ageMonths}m` : ''} • {it.dog.weight}kg
                    {it.boarding.kennelNumber && ` • Kennel #${it.boarding.kennelNumber}`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-pet breakdown cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map(it => {
              const itemTotal = it.bill.total;
              const preDiscount = it.bill.subtotal + it.bill.additional + it.bill.extrasTotal;
              const extras = (it.boarding as any).extras || [];
              return (
                <div key={it.boarding.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* Card header */}
                  <div style={{ background: '#eff6ff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dbeafe' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a' }}>
                        🐕 {it.dog?.name || 'Pet'}
                        {it.boarding.kennelNumber && <span style={{ fontSize: '12px', fontWeight: 500, color: '#475569', marginLeft: '8px' }}>Kennel #{it.boarding.kennelNumber}</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {it.boarding.checkInDate} → {it.boarding.checkOutDate}
                      </div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb' }}>₹{itemTotal.toFixed(2)}</div>
                  </div>

                  {/* Line items */}
                  <div style={{ padding: '8px 14px' }}>
                    {it.bill.nights > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px dashed #f1f5f9' }}>
                        <span style={{ color: '#334155' }}>
                          Overnight Boarding
                          <span style={{ color: '#94a3b8', marginLeft: '6px' }}>{it.bill.nights} night{it.bill.nights === 1 ? '' : 's'} × ₹{it.bill.dailyRate.toFixed(2)}</span>
                        </span>
                        <span style={{ fontWeight: 600 }}>₹{it.bill.boardingCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {it.bill.lastDayUnits > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px dashed #f1f5f9' }}>
                        <span style={{ color: '#334155' }}>
                          Daycare
                          <span style={{ color: '#94a3b8', marginLeft: '6px' }}>₹{it.bill.daycarePrice.toFixed(2)}</span>
                        </span>
                        <span style={{ fontWeight: 600 }}>₹{it.bill.daycareCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {it.bill.additional > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px dashed #f1f5f9' }}>
                        <span style={{ color: '#334155' }}>Additional Services</span>
                        <span style={{ fontWeight: 600 }}>₹{it.bill.additional.toFixed(2)}</span>
                      </div>
                    )}
                    {extras.length > 0 && (
                      <>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: 600, padding: '8px 0 4px' }}>Extras</div>
                        {extras.map((ex: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 10px', fontSize: '12px', borderBottom: '1px dashed #f1f5f9' }}>
                            <span style={{ color: '#334155' }}>
                              {ex.label || ex.category}
                              {ex.quantity > 1 && <span style={{ color: '#94a3b8', marginLeft: '6px' }}>× {ex.quantity}</span>}
                            </span>
                            <span style={{ fontWeight: 600 }}>₹{((ex.amount || 0) * (ex.quantity || 1)).toFixed(2)}</span>
                          </div>
                        ))}
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                      <span style={{ color: '#64748b' }}>Subtotal</span>
                      <span style={{ fontWeight: 600 }}>₹{preDiscount.toFixed(2)}</span>
                    </div>
                    {it.bill.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#16a34a' }}>
                        <span>Discount {it.bill.discountType === 'percentage' ? `(${it.bill.discountValue}%)` : '(Fixed)'}</span>
                        <span style={{ fontWeight: 600 }}>− ₹{it.bill.discount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grand totals summary */}
          <div style={{ marginTop: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px' }}>
            {multiple && (
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '8px' }}>
                Combined Totals ({items.length} pets)
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              {totals.boarding > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Boarding Charges</span>
                  <span>₹{totals.boarding.toFixed(2)}</span>
                </div>
              )}
              {totals.daycare > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Daycare Charges</span>
                  <span>₹{totals.daycare.toFixed(2)}</span>
                </div>
              )}
              {totals.additional > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Additional Services</span>
                  <span>₹{totals.additional.toFixed(2)}</span>
                </div>
              )}
              {totals.extras > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Extras</span>
                  <span>₹{totals.extras.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, paddingTop: '4px' }}>
                <span>Subtotal</span>
                <span>₹{(totals.subtotal + totals.additional + totals.extras).toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>Total Discount</span>
                  <span>− ₹{totals.discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Grand total banner */}
            <div style={{ marginTop: '12px', padding: '12px 14px', background: '#2563eb', color: 'white', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.5px' }}>GRAND TOTAL</span>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>₹{totals.total.toFixed(2)}</span>
            </div>

            {/* Payment */}
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: remaining > 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 600 }}>Paid</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>₹{totals.paid.toFixed(2)}</div>
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
                  {boarding.paymentMethod || '—'}
                </div>
              </div>
            </div>
          </div>


          {/* Notes */}
          {items.some(it => it.boarding.notes) && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '6px' }}>Notes</div>
              <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: '#555' }}>
                {items.filter(it => it.boarding.notes).map(it => (
                  <div key={it.boarding.id}>{multiple && <strong>{it.dog?.name}: </strong>}{it.boarding.notes}</div>
                ))}
              </div>
            </div>
          )}

          {noteText.trim() && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '6px' }}>Note / Payment History</div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: '#555', whiteSpace: 'pre-wrap' }}>
                {noteText}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '40px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>Thank you for choosing {companyName}! 🐾</p>
            <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>This is a computer-generated invoice.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
}
