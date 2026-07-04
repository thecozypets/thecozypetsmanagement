import { useRef, useMemo } from 'react';
import { Boarding, Dog, Owner } from '@/types/boarding';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, Download } from 'lucide-react';
import { calcBilling } from '@/lib/billing';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boarding: Boarding | null;
  dog: Dog | null;
  owner: Owner | null;
  allBoardings?: Boarding[];
  allDogs?: Dog[];
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
    acc.subtotal += it.bill.subtotal;
    acc.additional += it.bill.additional;
    acc.total += it.bill.total;
    acc.paid += it.bill.paid;
    return acc;
  }, { subtotal: 0, additional: 0, total: 0, paid: 0 });
  const remaining = Math.max(0, totals.total - totals.paid);

  const invoiceNumber = `INV-${boarding.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

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

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ background: '#2563eb', color: 'white', textAlign: 'left', padding: '10px 14px', fontSize: '12px', textTransform: 'uppercase' }}>Description</th>
                <th style={{ background: '#2563eb', color: 'white', textAlign: 'center', padding: '10px 14px', fontSize: '12px', textTransform: 'uppercase' }}>Days</th>
                <th style={{ background: '#2563eb', color: 'white', textAlign: 'right', padding: '10px 14px', fontSize: '12px', textTransform: 'uppercase' }}>Rate</th>
                <th style={{ background: '#2563eb', color: 'white', textAlign: 'right', padding: '10px 14px', fontSize: '12px', textTransform: 'uppercase' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => {
                const isDaycare = ((it.boarding as any).serviceType || 'boarding') === 'daycare';
                return (
                  <tr key={it.boarding.id}>
                    <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>
                      {isDaycare ? '☀️ Dog Daycare' : '🏠 Dog Boarding'} - {it.dog?.name || 'Pet'}
                      {it.boarding.kennelNumber && <span style={{ color: '#888' }}> (Kennel #{it.boarding.kennelNumber})</span>}
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {isDaycare
                          ? `${it.boarding.checkInDate}${it.boarding.checkInTime ? ` ${it.boarding.checkInTime}` : ''} → ${it.boarding.checkOutTime || 'Pick-up'} (same day)`
                          : `${it.boarding.checkInDate} → ${it.boarding.checkOutDate}`}
                      </div>
                      {it.bill.additional > 0 && <div style={{ fontSize: '11px', color: '#888' }}>+ Extra: ₹{it.bill.additional.toFixed(2)}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>{it.bill.days}{isDaycare ? ' day' : ''}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>₹{it.bill.dailyRate.toFixed(2)}{isDaycare ? '/day' : ''}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>₹{it.bill.total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals & Payment */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <table style={{ width: '320px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 14px', fontSize: '13px' }}>Subtotal</td>
                  <td style={{ padding: '6px 14px', fontSize: '13px', textAlign: 'right' }}>₹{totals.subtotal.toFixed(2)}</td>
                </tr>
                {totals.additional > 0 && (
                  <tr>
                    <td style={{ padding: '6px 14px', fontSize: '13px' }}>Extra Amount</td>
                    <td style={{ padding: '6px 14px', fontSize: '13px', textAlign: 'right' }}>₹{totals.additional.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '10px 14px', fontSize: '16px', fontWeight: 700, color: '#2563eb', borderTop: '2px solid #2563eb' }}>Total Amount</td>
                  <td style={{ padding: '10px 14px', fontSize: '16px', fontWeight: 700, color: '#2563eb', borderTop: '2px solid #2563eb', textAlign: 'right' }}>₹{totals.total.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 14px', fontSize: '13px', color: '#16a34a' }}>Paid</td>
                  <td style={{ padding: '6px 14px', fontSize: '13px', textAlign: 'right', color: '#16a34a' }}>₹{totals.paid.toFixed(2)}</td>
                </tr>
                {remaining > 0 && (
                  <tr>
                    <td style={{ padding: '6px 14px', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>Remaining</td>
                    <td style={{ padding: '6px 14px', fontSize: '13px', textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>₹{remaining.toFixed(2)}</td>
                  </tr>
                )}
                {boarding.paymentMethod && (
                  <tr>
                    <td style={{ padding: '6px 14px', fontSize: '12px', color: '#888' }}>Mode of Payment</td>
                    <td style={{ padding: '6px 14px', fontSize: '12px', textAlign: 'right', textTransform: 'uppercase', fontWeight: 600 }}>{boarding.paymentMethod}</td>
                  </tr>
                )}
              </tbody>
            </table>
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

          {/* Footer */}
          <div style={{ marginTop: '40px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>Thank you for choosing {companyName}! 🐾</p>
            <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>This is a computer-generated invoice.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
}
