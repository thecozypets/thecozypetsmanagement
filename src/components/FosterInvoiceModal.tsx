import { useRef } from 'react';
import { Foster, Dog, Owner } from '@/types/boarding';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, Download } from 'lucide-react';
import { calcBilling } from '@/lib/billing';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foster: Foster | null;
  dog: Dog | null;
  owner: Owner | null;
}

export default function FosterInvoiceModal({ open, onOpenChange, foster, dog, owner }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { settings } = useCompanySettings();

  if (!foster || !dog || !owner) return null;

  const days = (() => {
    const diff = new Date(foster.checkOutDate).getTime() - new Date(foster.checkInDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const totalAmount = foster.totalCost + (foster.additionalCost || 0);
  const invoiceNumber = `FINV-${foster.id.slice(0, 8).toUpperCase()}`;
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
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const companyName = settings.companyName || 'The Cozy Pets';
  const animalLabel = foster.animalType === 'cat' ? 'Cat' : 'Dog';
  const animalEmoji = foster.animalType === 'cat' ? '🐱' : '🐕';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">Foster Invoice Preview</DialogTitle>
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
                <div style={{ fontSize: '12px', color: '#666' }}></div>
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

          {/* Owner & Pet Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '8px' }}>Bill To</div>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>{owner.name}</p>
              <p style={{ fontSize: '13px', color: '#555' }}>{owner.phone}</p>
              {owner.email && <p style={{ fontSize: '13px', color: '#555' }}>{owner.email}</p>}
              {owner.address && <p style={{ fontSize: '13px', color: '#555' }}>{owner.address}</p>}
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '8px' }}>Pet Details</div>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>{animalEmoji} {dog.name}</p>
              <p style={{ fontSize: '13px', color: '#555' }}>Type: {animalLabel}</p>
              <p style={{ fontSize: '13px', color: '#555' }}>Breed: {dog.breed}</p>
              <p style={{ fontSize: '13px', color: '#555' }}>Age: {dog.age} yrs {dog.ageMonths ? `${dog.ageMonths} months` : ''} | Weight: {dog.weight} kg</p>
              {foster.kennelNumber && <p style={{ fontSize: '13px', color: '#555' }}>Kennel: #{foster.kennelNumber}</p>}
            </div>
          </div>

          {/* Foster Details */}
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '8px' }}>Foster Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px', fontSize: '13px' }}>
            <div><strong>Check-in:</strong> {foster.checkInDate}</div>
            <div><strong>Check-out:</strong> {foster.checkOutDate}</div>
            <div><strong>Status:</strong> <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
              background: foster.status === 'reserved' ? '#fef3c7' : foster.status === 'checked-in' ? '#d1fae5' : foster.status === 'checked-out' ? '#e5e7eb' : '#fee2e2',
              color: foster.status === 'reserved' ? '#92400e' : foster.status === 'checked-in' ? '#065f46' : foster.status === 'checked-out' ? '#374151' : '#991b1b'
            }}>{foster.status}</span></div>
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
              <tr>
                <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>
                  {animalLabel} Foster Care - {dog.name}
                  {foster.kennelNumber && <span style={{ color: '#888' }}> (Kennel #{foster.kennelNumber})</span>}
                </td>
                <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>{days}</td>
                <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>₹{foster.dailyRate.toFixed(2)}</td>
                <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>₹{foster.totalCost.toFixed(2)}</td>
              </tr>
              {(foster.additionalCost || 0) > 0 && (
                <tr>
                  <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>Additional Charges</td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>-</td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>-</td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>₹{foster.additionalCost.toFixed(2)}</td>
                </tr>
              )}
              {foster.feedingSchedule && (
                <tr>
                  <td colSpan={4} style={{ padding: '8px 14px', fontSize: '12px', borderBottom: '1px solid #e5e7eb', color: '#666' }}>
                    Feeding Schedule: {foster.feedingSchedule}
                  </td>
                </tr>
              )}
              {foster.specialRequests && (
                <tr>
                  <td colSpan={4} style={{ padding: '8px 14px', fontSize: '12px', borderBottom: '1px solid #e5e7eb', color: '#666' }}>
                    Special Requests: {foster.specialRequests}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals & Payment */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <table style={{ width: '280px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 14px', fontSize: '13px' }}>Stay Cost</td>
                  <td style={{ padding: '6px 14px', fontSize: '13px', textAlign: 'right' }}>₹{foster.totalCost.toFixed(2)}</td>
                </tr>
                {(foster.additionalCost || 0) > 0 && (
                  <tr>
                    <td style={{ padding: '6px 14px', fontSize: '13px' }}>Additional Cost</td>
                    <td style={{ padding: '6px 14px', fontSize: '13px', textAlign: 'right' }}>₹{foster.additionalCost.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '10px 14px', fontSize: '16px', fontWeight: 700, color: '#2563eb', borderTop: '2px solid #2563eb' }}>Total Amount</td>
                  <td style={{ padding: '10px 14px', fontSize: '16px', fontWeight: 700, color: '#2563eb', borderTop: '2px solid #2563eb', textAlign: 'right' }}>₹{totalAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 14px', fontSize: '13px', color: '#16a34a' }}>Paid</td>
                  <td style={{ padding: '6px 14px', fontSize: '13px', textAlign: 'right', color: '#16a34a' }}>₹{(foster.paidAmount || 0).toFixed(2)}</td>
                </tr>
                {(totalAmount - (foster.paidAmount || 0)) > 0 && (
                  <tr>
                    <td style={{ padding: '6px 14px', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>Outstanding</td>
                    <td style={{ padding: '6px 14px', fontSize: '13px', textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>₹{(totalAmount - (foster.paidAmount || 0)).toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '6px 14px', fontSize: '12px', color: '#888' }}>Payment Status</td>
                  <td style={{ padding: '6px 14px', fontSize: '12px', textAlign: 'right', textTransform: 'capitalize' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                      background: foster.paymentStatus === 'paid' ? '#d1fae5' : foster.paymentStatus === 'partly-paid' ? '#fef3c7' : '#fee2e2',
                      color: foster.paymentStatus === 'paid' ? '#065f46' : foster.paymentStatus === 'partly-paid' ? '#92400e' : '#991b1b'
                    }}>{foster.paymentStatus || 'outstanding'}</span>
                  </td>
                </tr>
                {foster.paymentMethod && (
                  <tr>
                    <td style={{ padding: '6px 14px', fontSize: '12px', color: '#888' }}>Payment Method</td>
                    <td style={{ padding: '6px 14px', fontSize: '12px', textAlign: 'right', textTransform: 'uppercase', fontWeight: 600 }}>{foster.paymentMethod}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {foster.notes && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '6px' }}>Notes</div>
              <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: '#555' }}>{foster.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '40px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>Thank you for choosing {companyName}! 🐾</p>
            <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>This is a computer-generated invoice.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
