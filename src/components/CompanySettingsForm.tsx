import { useState, useEffect } from 'react';
import { useCompanySettings, CompanySettings } from '@/hooks/useCompanySettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save } from 'lucide-react';

export default function CompanySettingsForm() {
  const { settings, loading, saveSettings } = useCompanySettings();
  const [form, setForm] = useState<CompanySettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await saveSettings({ ...form, id: settings.id });
    setSaving(false);
  };

  if (loading) return <div className="text-muted-foreground text-center py-8">Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2 text-primary">
            <Settings className="h-5 w-5" /> Company Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">Configure your business details for invoices</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="The Cozy Pets" />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input value={form.companyPhone} onChange={e => setForm(f => ({ ...f, companyPhone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.companyEmail} onChange={e => setForm(f => ({ ...f, companyEmail: e.target.value }))} placeholder="info@thecozypets.com" />
            </div>
            <div>
              <Label>GST Number</Label>
              <Input value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))} placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>

          <div>
            <Label>WhatsApp Notification Number</Label>
            <Input value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} placeholder="+91 7378528453" />
            <p className="text-xs text-muted-foreground mt-1">Receive booking notifications on this WhatsApp number</p>
          </div>

          <div>
            <Label>Address</Label>
            <Textarea value={form.companyAddress} onChange={e => setForm(f => ({ ...f, companyAddress: e.target.value }))} placeholder="123 Pet Street, Mumbai, Maharashtra 400001" rows={2} />
          </div>

          <div>
            <Label>Logo URL</Label>
            <Input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://example.com/logo.png" />
            {form.logoUrl && (
              <div className="mt-2 p-2 border rounded-md inline-block bg-white">
                <img src={form.logoUrl} alt="Logo preview" className="h-12 max-w-[200px] object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2 w-full md:w-auto">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
