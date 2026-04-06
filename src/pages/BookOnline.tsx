import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { PawPrint, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompanyInfo {
  userId: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  logoUrl: string;
  whatsappNumber: string;
}

export default function BookOnline() {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    dogName: '',
    dogBreed: '',
    specialNeeds: '',
    preferredCheckIn: '',
    preferredCheckOut: '',
    message: '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (data) {
        setCompany({
          userId: data.user_id,
          companyName: data.company_name,
          companyPhone: data.company_phone || '',
          companyEmail: data.company_email || '',
          companyAddress: data.company_address || '',
          logoUrl: data.logo_url || '',
          whatsappNumber: (data as any).whatsapp_number || '',
        });
      } else {
        setCompany({ userId: '', companyName: 'The Cozy Pets', companyPhone: '', companyEmail: '', companyAddress: '', logoUrl: '', whatsappNumber: '' });
      }
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.userId) return;
    setSubmitting(true);

    const { error } = await supabase.from('booking_requests').insert({
      user_id: company.userId,
      client_name: form.clientName.trim(),
      client_phone: form.clientPhone.trim(),
      client_email: form.clientEmail.trim(),
      dog_name: form.dogName.trim(),
      dog_breed: form.dogBreed.trim(),
      special_needs: form.specialNeeds.trim(),
      preferred_check_in: form.preferredCheckIn,
      preferred_check_out: form.preferredCheckOut,
      message: form.message.trim(),
      status: 'pending',
    } as any);

    setSubmitting(false);
    if (error) {
      alert('Failed to submit booking request. Please try again.');
      return;
    }
    setSubmitted(true);

    if (company?.whatsappNumber) {
      const waNum = company.whatsappNumber.replace(/[^0-9]/g, '');
      const waMsg = `🐾 *New Booking Request*\n\n👤 *Client:* ${form.clientName}\n📞 *Phone:* ${form.clientPhone}\n✉️ *Email:* ${form.clientEmail || 'N/A'}\n🐕 *Dog:* ${form.dogName}${form.dogBreed ? ` (${form.dogBreed})` : ''}\n🩺 *Special Needs:* ${form.specialNeeds || 'None'}\n📅 *Check-in:* ${form.preferredCheckIn}\n📅 *Check-out:* ${form.preferredCheckOut}\n💬 *Message:* ${form.message || 'None'}`;
      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <PawPrint className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
              <h2 className="font-display text-2xl font-bold text-foreground">Booking Request Submitted!</h2>
              <p className="text-muted-foreground">
                Thank you! Your booking request has been sent to <strong>{company?.companyName}</strong>. We'll review and confirm your reservation soon.
              </p>
              {company?.companyPhone && (
                <p className="text-sm text-muted-foreground">
                  For urgent inquiries, call: <a href={`tel:${company.companyPhone}`} className="text-primary underline">{company.companyPhone}</a>
                </p>
              )}
              <Button onClick={() => { setSubmitted(false); setForm({ clientName: '', clientPhone: '', clientEmail: '', dogName: '', dogBreed: '', specialNeeds: '', preferredCheckIn: '', preferredCheckOut: '', message: '' }); }} variant="outline" className="mt-4">
                Submit Another Request
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-3">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.companyName} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <motion.div initial={{ rotate: -20 }} animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }}>
              <PawPrint className="h-10 w-10 text-primary" />
            </motion.div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{company?.companyName}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5" /> Book Dog Boarding
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-bold mb-1 text-foreground">Request a Boarding Reservation</h2>
              <p className="text-sm text-muted-foreground mb-6">Fill in the details below and we'll get back to you to confirm your booking.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">Your Details</h3>
                  <div className="h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Your Name *</Label>
                    <Input required value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="John Doe" maxLength={100} />
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input required value={form.clientPhone} onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))} placeholder="+91 98765 43210" maxLength={20} />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.clientEmail} onChange={e => setForm(p => ({ ...p, clientEmail: e.target.value }))} placeholder="john@example.com" maxLength={255} />
                </div>

                <div className="space-y-1 pt-2">
                  <h3 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">Dog Details</h3>
                  <div className="h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Dog's Name *</Label>
                    <Input required value={form.dogName} onChange={e => setForm(p => ({ ...p, dogName: e.target.value }))} placeholder="Buddy" maxLength={100} />
                  </div>
                  <div>
                    <Label>Breed</Label>
                    <Input value={form.dogBreed} onChange={e => setForm(p => ({ ...p, dogBreed: e.target.value }))} placeholder="Golden Retriever" maxLength={100} />
                  </div>
                </div>
                <div>
                  <Label>Special Needs / Medical Info</Label>
                  <Textarea value={form.specialNeeds} onChange={e => setForm(p => ({ ...p, specialNeeds: e.target.value }))} placeholder="Allergies, medications, dietary restrictions..." maxLength={500} />
                </div>

                <div className="space-y-1 pt-2">
                  <h3 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">Preferred Dates</h3>
                  <div className="h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Check-in Date *</Label>
                    <Input required type="date" value={form.preferredCheckIn} onChange={e => setForm(p => ({ ...p, preferredCheckIn: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Check-out Date *</Label>
                    <Input required type="date" value={form.preferredCheckOut} onChange={e => setForm(p => ({ ...p, preferredCheckOut: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <Label>Additional Message</Label>
                  <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Any other details you'd like us to know..." maxLength={500} />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Submitting...' : '🐾 Submit Booking Request'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {(company?.companyPhone || company?.companyEmail || company?.companyAddress) && (
            <div className="mt-6 text-center text-sm text-muted-foreground space-y-1">
              {company.companyAddress && <p>📍 {company.companyAddress}</p>}
              {company.companyPhone && <p>📞 {company.companyPhone}</p>}
              {company.companyEmail && <p>✉️ {company.companyEmail}</p>}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
