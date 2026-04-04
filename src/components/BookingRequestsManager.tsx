import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Trash2, Clock, Copy, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface BookingRequest {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  dogName: string;
  dogBreed: string;
  specialNeeds: string;
  preferredCheckIn: string;
  preferredCheckOut: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/20 text-warning-foreground border-warning/30',
  approved: 'bg-success/20 text-success-foreground border-success/30',
  rejected: 'bg-destructive/20 text-destructive border-destructive/30',
};

export default function BookingRequestsManager() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [filter, setFilter] = useState<string>('pending');

  const fetchRequests = useCallback(async () => {
    const { data, error } = await supabase.from('booking_requests').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load booking requests'); return; }
    setRequests((data || []).map((r: any) => ({
      id: r.id,
      clientName: r.client_name,
      clientPhone: r.client_phone,
      clientEmail: r.client_email || '',
      dogName: r.dog_name,
      dogBreed: r.dog_breed || '',
      specialNeeds: r.special_needs || '',
      preferredCheckIn: r.preferred_check_in,
      preferredCheckOut: r.preferred_check_out,
      message: r.message || '',
      status: r.status,
      createdAt: r.created_at,
    })));
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('booking_requests').update({ status } as any).eq('id', id);
    if (error) { toast.error('Failed to update request'); return; }
    toast.success(status === 'approved' ? 'Booking approved!' : 'Booking rejected');
    fetchRequests();
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase.from('booking_requests').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Request deleted');
    fetchRequests();
  };

  const bookingLink = `${window.location.origin}/book`;

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    toast.success('Booking link copied to clipboard!');
  };

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Share Link Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h3 className="font-display font-bold text-sm mb-2 flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" /> Share Booking Link with Clients
          </h3>
          <div className="flex gap-2 items-center">
            <code className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-xs truncate text-muted-foreground">
              {bookingLink}
            </code>
            <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0 gap-1">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Share this link with your clients so they can submit boarding requests online.</p>
        </CardContent>
      </Card>

      {/* Filter & Count */}
      <div className="flex gap-2 items-center flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(s => (
          <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)} className="capitalize">
            {s} {s === 'pending' && pendingCount > 0 && <Badge className="ml-1 bg-warning text-warning-foreground h-5 min-w-5 text-xs">{pendingCount}</Badge>}
          </Button>
        ))}
      </div>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="mx-auto h-12 w-12 mb-4 opacity-40" />
          <p className="font-display text-lg">No {filter !== 'all' ? filter : ''} booking requests</p>
          <p className="text-sm">Share your booking link to start receiving requests</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {filtered.map(r => (
              <motion.div key={r.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-display font-bold text-lg text-foreground">{r.clientName}</h3>
                        <p className="text-sm text-muted-foreground">🐕 {r.dogName}{r.dogBreed && ` · ${r.dogBreed}`}</p>
                      </div>
                      <Badge className={statusStyles[r.status]}>{r.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                      <div>📅 In: {r.preferredCheckIn}</div>
                      <div>📅 Out: {r.preferredCheckOut}</div>
                      <div>📞 {r.clientPhone}</div>
                      {r.clientEmail && <div>✉️ {r.clientEmail}</div>}
                    </div>

                    {r.specialNeeds && <p className="text-xs text-muted-foreground mb-1">⚕️ {r.specialNeeds}</p>}
                    {r.message && <p className="text-xs text-muted-foreground italic mb-3">💬 {r.message}</p>}

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex gap-1">
                        {r.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" className="gap-1 text-success border-success/30 hover:bg-success/10" onClick={() => updateStatus(r.id, 'approved')}>
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => updateStatus(r.id, 'rejected')}>
                              <X className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive h-8 w-8 p-0" onClick={() => deleteRequest(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
