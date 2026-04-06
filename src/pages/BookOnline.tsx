import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { PawPrint, CalendarCheck, CheckCircle2, Camera, Upload, Dog, User, Calendar, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompanyInfo {
  userId: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  logoUrl: string;
  whatsappNumber: string;
}

const steps = ['owner', 'dog', 'dates', 'review'] as const;
type Step = typeof steps[number];

const stepConfig: Record<Step, { icon: React.ElementType; label: string }> = {
  owner: { icon: User, label: 'Your Details' },
  dog: { icon: Dog, label: 'Dog Details' },
  dates: { icon: Calendar, label: 'Dates' },
  review: { icon: MessageSquare, label: 'Review' },
};

export default function BookOnline() {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<Step>('owner');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
          whatsappNumber: data.whatsapp_number || '',
        });
      } else {
        setCompany({ userId: '', companyName: 'The Cozy Pets', companyPhone: '', companyEmail: '', companyAddress: '', logoUrl: '', whatsappNumber: '' });
      }
      setLoading(false);
    })();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const currentStepIdx = steps.indexOf(step);

  const canGoNext = () => {
    if (step === 'owner') return form.clientName.trim() && form.clientPhone.trim();
    if (step === 'dog') return form.dogName.trim();
    if (step === 'dates') return form.preferredCheckIn && form.preferredCheckOut;
    return true;
  };

  const handleSubmit = async () => {
    if (!company?.userId) return;
    setSubmitting(true);

    let dogPhotoUrl: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('booking-photos').upload(path, photoFile);
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('booking-photos').getPublicUrl(path);
        dogPhotoUrl = urlData.publicUrl;
      }
    }

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
      dog_photo_url: dogPhotoUrl,
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
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
          <PawPrint className="h-10 w-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15 }}>
          <Card className="max-w-md w-full overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
            <CardContent className="p-8 text-center space-y-4">
              <motion.div initial={{ y: -20 }} animate={{ y: 0 }} transition={{ delay: 0.2, type: 'spring' }}>
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-foreground">Booking Request Submitted!</h2>
              <p className="text-muted-foreground">
                Thank you! Your booking request has been sent to <strong>{company?.companyName}</strong>. We'll review and confirm soon.
              </p>
              {company?.companyPhone && (
                <p className="text-sm text-muted-foreground">
                  Urgent? Call: <a href={`tel:${company.companyPhone}`} className="text-primary underline">{company.companyPhone}</a>
                </p>
              )}
              <Button onClick={() => { setSubmitted(false); setStep('owner'); setPhotoFile(null); setPhotoPreview(null); setForm({ clientName: '', clientPhone: '', clientEmail: '', dogName: '', dogBreed: '', specialNeeds: '', preferredCheckIn: '', preferredCheckOut: '', message: '' }); }} variant="outline" className="mt-4">
                Submit Another Request
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.companyName} className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20" />
          ) : (
            <motion.div whileHover={{ rotate: 15 }} className="bg-primary/10 p-2 rounded-full">
              <PawPrint className="h-7 w-7 text-primary" />
            </motion.div>
          )}
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{company?.companyName}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarCheck className="h-3 w-3" /> Book Dog Boarding
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-6 px-2">
          {steps.map((s, i) => {
            const Icon = stepConfig[s].icon;
            const active = i === currentStepIdx;
            const done = i < currentStepIdx;
            return (
              <div key={s} className="flex items-center gap-1 flex-1">
                <motion.button
                  onClick={() => i <= currentStepIdx && setStep(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active ? 'bg-primary text-primary-foreground shadow-md' : done ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{stepConfig[s].label}</span>
                </motion.button>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${done ? 'bg-primary/40' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="overflow-hidden border-border/50 shadow-lg">
          <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
          <CardContent className="p-6 min-h-[340px]">
            <AnimatePresence mode="wait" custom={1}>
              {step === 'owner' && (
                <motion.div key="owner" variants={slideVariants} custom={1} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
                  <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Your Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Your Name *</Label>
                      <Input required value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="John Doe" maxLength={100} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone Number *</Label>
                      <Input required value={form.clientPhone} onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))} placeholder="+91 98765 43210" maxLength={20} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={form.clientEmail} onChange={e => setForm(p => ({ ...p, clientEmail: e.target.value }))} placeholder="john@example.com" maxLength={255} />
                  </div>
                </motion.div>
              )}

              {step === 'dog' && (
                <motion.div key="dog" variants={slideVariants} custom={1} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
                  <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <Dog className="h-5 w-5 text-primary" /> Dog Details
                  </h2>

                  {/* Photo Upload */}
                  <div className="flex justify-center">
                    <motion.button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="relative group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className={`w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${
                        photoPreview ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/50'
                      }`}>
                        {photoPreview ? (
                          <img src={photoPreview} alt="Dog" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="text-center space-y-1">
                            <Camera className="h-7 w-7 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
                            <p className="text-[10px] text-muted-foreground">Add Photo</p>
                          </div>
                        )}
                      </div>
                      {photoPreview && (
                        <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </motion.button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Dog's Name *</Label>
                      <Input required value={form.dogName} onChange={e => setForm(p => ({ ...p, dogName: e.target.value }))} placeholder="Buddy" maxLength={100} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Breed</Label>
                      <Input value={form.dogBreed} onChange={e => setForm(p => ({ ...p, dogBreed: e.target.value }))} placeholder="Golden Retriever" maxLength={100} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Special Needs / Medical Info</Label>
                    <Textarea value={form.specialNeeds} onChange={e => setForm(p => ({ ...p, specialNeeds: e.target.value }))} placeholder="Allergies, medications, dietary restrictions..." maxLength={500} rows={3} />
                  </div>
                </motion.div>
              )}

              {step === 'dates' && (
                <motion.div key="dates" variants={slideVariants} custom={1} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
                  <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Preferred Dates
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Check-in Date *</Label>
                      <Input required type="date" value={form.preferredCheckIn} onChange={e => setForm(p => ({ ...p, preferredCheckIn: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Check-out Date *</Label>
                      <Input required type="date" value={form.preferredCheckOut} onChange={e => setForm(p => ({ ...p, preferredCheckOut: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Additional Message</Label>
                    <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Anything else we should know..." maxLength={500} rows={3} />
                  </div>
                </motion.div>
              )}

              {step === 'review' && (
                <motion.div key="review" variants={slideVariants} custom={1} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
                  <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" /> Review & Submit
                  </h2>
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      {photoPreview && (
                        <img src={photoPreview} alt="Dog" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold text-foreground">{form.dogName} {form.dogBreed && <span className="font-normal text-muted-foreground">({form.dogBreed})</span>}</p>
                        <p className="text-muted-foreground">Owner: {form.clientName}</p>
                      </div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <p>📞 {form.clientPhone}</p>
                      {form.clientEmail && <p>✉️ {form.clientEmail}</p>}
                      <p>📅 In: {form.preferredCheckIn}</p>
                      <p>📅 Out: {form.preferredCheckOut}</p>
                    </div>
                    {form.specialNeeds && (
                      <>
                        <div className="h-px bg-border" />
                        <p className="text-muted-foreground">🩺 {form.specialNeeds}</p>
                      </>
                    )}
                    {form.message && (
                      <>
                        <div className="h-px bg-border" />
                        <p className="text-muted-foreground">💬 {form.message}</p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(steps[currentStepIdx - 1])}
                disabled={currentStepIdx === 0}
              >
                ← Back
              </Button>

              {step === 'review' ? (
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button onClick={handleSubmit} size="lg" disabled={submitting} className="gap-2">
                    {submitting ? 'Submitting...' : <><PawPrint className="h-4 w-4" /> Submit Booking</>}
                  </Button>
                </motion.div>
              ) : (
                <Button
                  type="button"
                  onClick={() => setStep(steps[currentStepIdx + 1])}
                  disabled={!canGoNext()}
                >
                  Next →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {(company?.companyPhone || company?.companyEmail || company?.companyAddress) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 text-center text-sm text-muted-foreground space-y-1">
            {company.companyAddress && <p>📍 {company.companyAddress}</p>}
            {company.companyPhone && <p>📞 {company.companyPhone}</p>}
            {company.companyEmail && <p>✉️ {company.companyEmail}</p>}
          </motion.div>
        )}
      </main>
    </div>
  );
}
