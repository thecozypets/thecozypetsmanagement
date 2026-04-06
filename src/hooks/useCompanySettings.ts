import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CompanySettings {
  id?: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoUrl: string;
  gstNumber: string;
  whatsappNumber: string;
}

const defaults: CompanySettings = {
  companyName: 'The Cozy Pets',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  logoUrl: '',
  gstNumber: '',
  whatsappNumber: '',
};

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings>(defaults);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase.from('company_settings').select('*').maybeSingle();
    if (error) { setLoading(false); return; }
    if (data) {
      setSettings({
        id: data.id,
        companyName: data.company_name,
        companyAddress: data.company_address || '',
        companyPhone: data.company_phone || '',
        companyEmail: data.company_email || '',
        logoUrl: data.logo_url || '',
        gstNumber: data.gst_number || '',
        whatsappNumber: (data as any).whatsapp_number || '',
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = useCallback(async (s: CompanySettings) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return; }

    const payload = {
      company_name: s.companyName,
      company_address: s.companyAddress,
      company_phone: s.companyPhone,
      company_email: s.companyEmail,
      logo_url: s.logoUrl,
      gst_number: s.gstNumber,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (s.id) {
      const { error } = await supabase.from('company_settings').update(payload).eq('id', s.id);
      if (error) { toast.error('Failed to save settings'); return; }
    } else {
      const { error } = await supabase.from('company_settings').insert(payload);
      if (error) { toast.error('Failed to save settings'); return; }
    }
    toast.success('Company settings saved!');
    await fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, saveSettings };
}
