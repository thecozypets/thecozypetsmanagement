import { useState } from 'react';
import { Owner } from '@/types/boarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Pencil, Trash2, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OwnerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
}

const emptyForm: OwnerFormData = { name: '', phone: '', email: '', address: '', emergencyContact: '' };

interface Props {
  owners: Owner[];
  onAdd: (data: OwnerFormData) => void;
  onUpdate: (id: string, data: Partial<Owner>) => void;
  onDelete: (id: string) => void;
}

export default function OwnerManager({ owners, onAdd, onUpdate, onDelete }: Props) {
  const [form, setForm] = useState<OwnerFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, form);
    } else {
      onAdd(form);
    }
    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
  };

  const startEdit = (owner: Owner) => {
    setForm({ name: owner.name, phone: owner.phone, email: owner.email, address: owner.address, emergencyContact: owner.emergencyContact });
    setEditingId(owner.id);
    setOpen(true);
  };

  const filtered = owners.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Input
          placeholder="Search owners..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2 h-4 w-4" /> Add Owner</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? 'Edit Owner' : 'Add New Owner'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Full Name *</Label><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Phone *</Label><Input required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div><Label>Emergency Contact</Label><Input value={form.emergencyContact} onChange={e => setForm(p => ({ ...p, emergencyContact: e.target.value }))} /></div>
              <Button type="submit" className="w-full">{editingId ? 'Update' : 'Add Owner'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserPlus className="mx-auto h-12 w-12 mb-4 opacity-40" />
          <p className="font-display text-lg">No owners yet</p>
          <p className="text-sm">Add your first pet owner to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map(owner => (
              <motion.div key={owner.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-display font-bold text-lg">{owner.name}</h3>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(owner)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(owner.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{owner.phone}</div>
                      {owner.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{owner.email}</div>}
                      {owner.address && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{owner.address}</div>}
                      {owner.emergencyContact && <div className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5" />{owner.emergencyContact}</div>}
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
