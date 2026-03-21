import { useRef } from 'react';
import { Boarding, Dog, Owner } from '@/types/boarding';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, PawPrint } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boarding: Boarding | null;
  dog: Dog | null;
  owner: Owner | null;
}

export default function InvoiceModal({ open, onOpenChange, boarding, dog, owner }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!boarding || !dog || !owner) return null;

  const days = (() => {
    const diff = new Date(boarding.checkOutDate).getTime() - new Date(boarding.checkInDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

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
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        .invoice-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand-name { font-size: 24px; font-weight: 700; color: #2563eb; }
        .brand-sub { font-size: 12px; color: #666; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 28px; color: #2563eb; font-weight: 700; }
        .invoice-title p { font-size: 13px; color: #666; margin-top: 4px; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; font-weight: 600; margin-bottom: 8px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .info-block p { font-size: 13px; line-height: 1.6; color: #333; }
        .info-block p strong { color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #2563eb; color: white; text-align: left; padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
        .text-right { text-align: right; }
        .totals { margin-top: 16px; display: flex; justify-content: flex-end; }
        .totals-table { width: 280px; }
        .totals-table tr td { padding: 6px 14px; font-size: 13px; border: none; }
        .totals-table .grand-total td { font-size: 16px; font-weight: 700; color: #2563eb; border-top: 2px solid #2563eb; padding-top: 10px; }
        .footer { margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .footer p { font-size: 12px; color: #999; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .status-reserved { background: #fef3c7; color: #92400e; }
        .status-checked-in { background: #d1fae5; color: #065f46; }
        .status-checked-out { background: #e5e7eb; color: #374151; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .notes { background: #f9fafb; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #555; margin-top: 8px; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    // Use print dialog's "Save as PDF" option
    handlePrint();
  };

  const statusClass = `status-${boarding.status}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            Invoice Preview
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={handlePrint} size="sm" className="gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>

        <div ref={invoiceRef} className="bg-white text-foreground p-6 rounded-lg border">
          {/* Header */}
          <div className="invoice-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
            <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <div className="brand-name" style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>🐾 The Cozy Pets</div>
                <div className="brand-sub" style={{ fontSize: '12px', color: '#666' }}>Dog Boarding Management</div>
              </div>
            </div>
            <div className="invoice-title" style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '28px', color: '#2563eb', fontWeight: 700 }}>INVOICE</h2>
              <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{invoiceNumber}</p>
              <p style={{ fontSize: '13px', color: '#666' }}>Date: {invoiceDate}</p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Owner & Dog Info */}
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
              <p style={{ fontSize: '14px', fontWeight: 600 }}>🐕 {dog.name}</p>
              <p style={{ fontSize: '13px', color: '#555' }}>Breed: {dog.breed}</p>
              <p style={{ fontSize: '13px', color: '#555' }}>Age: {dog.age} yrs | Weight: {dog.weight} kg</p>
              {boarding.kennelNumber && <p style={{ fontSize: '13px', color: '#555' }}>Kennel: #{boarding.kennelNumber}</p>}
            </div>
          </div>

          {/* Boarding Details */}
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '8px' }}>Boarding Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px', fontSize: '13px' }}>
            <div><strong>Check-in:</strong> {boarding.checkInDate}</div>
            <div><strong>Check-out:</strong> {boarding.checkOutDate}</div>
            <div><strong>Status:</strong> <span className={`status-badge ${statusClass}`} style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
              background: boarding.status === 'reserved' ? '#fef3c7' : boarding.status === 'checked-in' ? '#d1fae5' : boarding.status === 'checked-out' ? '#e5e7eb' : '#fee2e2',
              color: boarding.status === 'reserved' ? '#92400e' : boarding.status === 'checked-in' ? '#065f46' : boarding.status === 'checked-out' ? '#374151' : '#991b1b',
            }}>{boarding.status}</span></div>
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
                  Dog Boarding - {dog.name}
                  {boarding.kennelNumber && <span style={{ color: '#888' }}> (Kennel #{boarding.kennelNumber})</span>}
                </td>
                <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>{days}</td>
                <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>₹{boarding.dailyRate.toFixed(2)}</td>
                <td style={{ padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>₹{boarding.totalCost.toFixed(2)}</td>
              </tr>
              {boarding.feedingSchedule && (
                <tr>
                  <td colSpan={4} style={{ padding: '8px 14px', fontSize: '12px', borderBottom: '1px solid #e5e7eb', color: '#666' }}>
                    Feeding Schedule: {boarding.feedingSchedule}
                  </td>
                </tr>
              )}
              {boarding.specialRequests && (
                <tr>
                  <td colSpan={4} style={{ padding: '8px 14px', fontSize: '12px', borderBottom: '1px solid #e5e7eb', color: '#666' }}>
                    Special Requests: {boarding.specialRequests}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <table style={{ width: '250px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 14px', fontSize: '13px' }}>Subtotal</td>
                  <td style={{ padding: '6px 14px', fontSize: '13px', textAlign: 'right' }}>₹{boarding.totalCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 14px', fontSize: '13px' }}>Tax (0%)</td>
                  <td style={{ padding: '6px 14px', fontSize: '13px', textAlign: 'right' }}>₹0.00</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 14px', fontSize: '16px', fontWeight: 700, color: '#2563eb', borderTop: '2px solid #2563eb' }}>Total</td>
                  <td style={{ padding: '10px 14px', fontSize: '16px', fontWeight: 700, color: '#2563eb', borderTop: '2px solid #2563eb', textAlign: 'right' }}>₹{boarding.totalCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {boarding.notes && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 600, marginBottom: '6px' }}>Notes</div>
              <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: '#555' }}>{boarding.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '40px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>Thank you for choosing The Cozy Pets! 🐾</p>
            <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>This is a computer-generated invoice.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
