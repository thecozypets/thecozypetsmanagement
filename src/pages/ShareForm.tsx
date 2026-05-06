import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { PawPrint, Share2, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyInfo {
  companyName: string;
  logoUrl: string;
  whatsappNumber: string;
  companyPhone: string;
}

export default function ShareForm() {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    address: '',
    dogName: '',
    dogBreed: '',
    dogAge: '',
    dogGender: '',
    dogWeight: '',
    vaccinated: '',
    feeding: '',
    specialNeeds: '',
    medications: '',
    emergencyContact: '',
    preferredCheckIn: '',
    preferredCheckOut: '',
    serviceType: 'Boarding',
    message: '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('company_settings').select('*').limit(1).maybeSingle();
      if (data) {
        setCompany({
          companyName: data.company_name,
          logoUrl: data.logo_url || '',
          whatsappNumber: data.whatsapp_number || '',
          companyPhone: data.company_phone || '',
        });
      } else {
        setCompany({ companyName: 'The Cozy Pets', logoUrl: '', whatsappNumber: '', companyPhone: '' });
      }
    })();
  }, []);

  const buildMessage = () => {
    const lines = [
      `🐾 *Booking Enquiry — ${company?.companyName || ''}*`,
      ``,
      `*Service:* ${form.serviceType}`,
      ``,
      `👤 *Owner Details*`,
      `Name: ${form.clientName || '-'}`,
      `Phone: ${form.clientPhone || '-'}`,
      form.clientEmail && `Email: ${form.clientEmail}`,
      form.address && `Address: ${form.address}`,
      form.emergencyContact && `Emergency Contact: ${form.emergencyContact}`,
      ``,
      `🐕 *Pet Details*`,
      `Name: ${form.dogName || '-'}`,
      form.dogBreed && `Breed: ${form.dogBreed}`,
      form.dogAge && `Age: ${form.dogAge}`,
      form.dogGender && `Gender: ${form.dogGender}`,
      form.dogWeight && `Weight: ${form.dogWeight} kg`,
      form.vaccinated && `Vaccinated: ${form.vaccinated}`,
      form.feeding && `Feeding: ${form.feeding}`,
      form.medications && `Medications: ${form.medications}`,
      form.specialNeeds && `Special Needs: ${form.specialNeeds}`,
      ``,
      `📅 *Stay Dates*`,
      `Check-in: ${form.preferredCheckIn || '-'}`,
      `Check-out: ${form.preferredCheckOut || '-'}`,
      form.message && `\n💬 *Message:* ${form.message}`,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const shareWhatsApp = () => {
    if (!form.clientName.trim() || !form.dogName.trim()) {
      toast.error('Please enter your name and pet name');
      return;
    }
    const msg = encodeURIComponent(buildMessage());
    const num = company?.whatsappNumber?.replace(/[^0-9]/g, '') || '';
    const url = num ? `https://wa.me/${num}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(buildMessage());
    toast.success('Booking details copied!');
  };

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.companyName} className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20" />
          ) : (
            <div className="bg-primary/10 p-2 rounded-full">
              <PawPrint className="h-7 w-7 text-primary" />
            </div>
          )}
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{company?.companyName}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Share2 className="h-3 w-3" /> Fill & Share Booking Details
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="font-display font-bold text-base text-primary mb-3">Service</h2>
              <div className="flex gap-2 flex-wrap">
                {['Boarding', 'Foster', 'Day Care'].map(s => (
                  <Button key={s} type="button" variant={form.serviceType === s ? 'default' : 'outline'} size="sm" onClick={() => setForm(p => ({ ...p, serviceType: s }))}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-base text-primary">👤 Owner Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Name *</Label><Input value={form.clientName} onChange={upd('clientName')} maxLength={100} /></div>
                <div className="space-y-1.5"><Label>Phone *</Label><Input value={form.clientPhone} onChange={upd('clientPhone')} maxLength={20} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.clientEmail} onChange={upd('clientEmail')} maxLength={255} /></div>
                <div className="space-y-1.5"><Label>Emergency Contact</Label><Input value={form.emergencyContact} onChange={upd('emergencyContact')} maxLength={100} /></div>
              </div>
              <div className="space-y-1.5"><Label>Address</Label><Textarea value={form.address} onChange={upd('address')} maxLength={300} rows={2} /></div>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-base text-primary">🐕 Pet Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Pet Name *</Label><Input value={form.dogName} onChange={upd('dogName')} maxLength={100} /></div>
                <div className="space-y-1.5"><Label>Breed</Label><Input value={form.dogBreed} onChange={upd('dogBreed')} maxLength={100} /></div>
                <div className="space-y-1.5"><Label>Age</Label><Input value={form.dogAge} onChange={upd('dogAge')} placeholder="e.g. 2 yrs 3 mo" maxLength={50} /></div>
                <div className="space-y-1.5"><Label>Gender</Label><Input value={form.dogGender} onChange={upd('dogGender')} placeholder="Male / Female" maxLength={20} /></div>
                <div className="space-y-1.5"><Label>Weight (kg)</Label><Input value={form.dogWeight} onChange={upd('dogWeight')} maxLength={10} /></div>
                <div className="space-y-1.5"><Label>Vaccinated</Label><Input value={form.vaccinated} onChange={upd('vaccinated')} placeholder="Yes / No" maxLength={20} /></div>
              </div>
              <div className="space-y-1.5"><Label>Feeding Instructions</Label><Textarea value={form.feeding} onChange={upd('feeding')} maxLength={300} rows={2} /></div>
              <div className="space-y-1.5"><Label>Medications</Label><Textarea value={form.medications} onChange={upd('medications')} maxLength={300} rows={2} /></div>
              <div className="space-y-1.5"><Label>Special Needs / Notes</Label><Textarea value={form.specialNeeds} onChange={upd('specialNeeds')} maxLength={500} rows={2} /></div>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-base text-primary">📅 Stay Dates</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Check-in *</Label><Input type="date" value={form.preferredCheckIn} onChange={upd('preferredCheckIn')} /></div>
                <div className="space-y-1.5"><Label>Check-out *</Label><Input type="date" value={form.preferredCheckOut} onChange={upd('preferredCheckOut')} /></div>
              </div>
              <div className="space-y-1.5"><Label>Additional Message</Label><Textarea value={form.message} onChange={upd('message')} maxLength={500} rows={2} /></div>
            </section>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={shareWhatsApp} className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" size="lg">
                <MessageCircle className="h-5 w-5" /> Share on WhatsApp
              </Button>
              <Button onClick={copyText} variant="outline" className="gap-2" size="lg">
                <Copy className="h-4 w-4" /> Copy Details
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Your details will be sent directly to {company?.companyName} via WhatsApp.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
