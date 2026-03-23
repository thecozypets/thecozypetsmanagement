import { useState } from 'react';
import { Dog, Owner } from '@/types/boarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PawPrint, Pencil, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DogFormData {
  name: string;
  breed: string;
  age: number;
  weight: number;
  gender: 'male' | 'female';
  ownerId: string;
  specialNeeds: string;
  feedingInstructions: string;
  medications: string;
  vaccinated: boolean;
  neutered: boolean;
  photoUrl: string;
  vaccinePhotoUrl: string;
}

const emptyForm: DogFormData = { name: '', breed: '', age: 0, weight: 0, gender: 'male', ownerId: '', specialNeeds: '', feedingInstructions: '', medications: '', vaccinated: false, neutered: false, photoUrl: '', vaccinePhotoUrl: '' };

interface Props {
  dogs: Dog[];
  owners: Owner[];
  onAdd: (data: DogFormData) => void;
  onUpdate: (id: string, data: Partial<Dog>) => void;
  onDelete: (id: string) => void;
  onClickDog: (dogId: string) => void;
  onClickOwner: (ownerId: string) => void;
}

export default function DogManager({ dogs, owners, onAdd, onUpdate, onDelete, onClickDog, onClickOwner }: Props) {
  const [form, setForm] = useState<DogFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) { onUpdate(editingId, form); } else { onAdd(form); }
    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
  };

  const startEdit = (dog: Dog) => {
    setForm({ name: dog.name, breed: dog.breed, age: dog.age, weight: dog.weight, gender: dog.gender, ownerId: dog.ownerId, specialNeeds: dog.specialNeeds, feedingInstructions: dog.feedingInstructions, medications: dog.medications, vaccinated: dog.vaccinated, neutered: dog.neutered, photoUrl: dog.photoUrl || '' });
    setEditingId(dog.id);
    setOpen(true);
  };

  const getOwnerName = (id: string) => owners.find(o => o.id === id)?.name || 'Unknown';

  const filtered = dogs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.breed.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Input placeholder="Search dogs..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Dog</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? 'Edit Dog' : 'Add New Dog'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name *</Label><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Breed *</Label><Input required value={form.breed} onChange={e => setForm(p => ({ ...p, breed: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Age (years)</Label><Input type="number" min={0} value={form.age} onChange={e => setForm(p => ({ ...p, age: +e.target.value }))} /></div>
                <div><Label>Weight (kg)</Label><Input type="number" min={0} step={0.1} value={form.weight} onChange={e => setForm(p => ({ ...p, weight: +e.target.value }))} /></div>
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(v: 'male' | 'female') => setForm(p => ({ ...p, gender: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Owner *</Label>
                <Select required value={form.ownerId} onValueChange={v => setForm(p => ({ ...p, ownerId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                  <SelectContent>
                    {owners.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Special Needs</Label><Textarea value={form.specialNeeds} onChange={e => setForm(p => ({ ...p, specialNeeds: e.target.value }))} /></div>
              <div><Label>Feeding Instructions</Label><Textarea value={form.feedingInstructions} onChange={e => setForm(p => ({ ...p, feedingInstructions: e.target.value }))} /></div>
              <div><Label>Medications</Label><Input value={form.medications} onChange={e => setForm(p => ({ ...p, medications: e.target.value }))} /></div>
              <div>
                <Label>Photo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setForm(p => ({ ...p, photoUrl: reader.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {form.photoUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={form.photoUrl} alt="Dog preview" className="h-24 w-24 rounded-lg object-cover border border-border" />
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setForm(p => ({ ...p, photoUrl: '' }))}>Remove</Button>
                  </div>
                )}
              </div>
              <div className="flex gap-8">
                <div className="flex items-center gap-2"><Switch checked={form.vaccinated} onCheckedChange={v => setForm(p => ({ ...p, vaccinated: v }))} /><Label>Vaccinated</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.neutered} onCheckedChange={v => setForm(p => ({ ...p, neutered: v }))} /><Label>Neutered</Label></div>
              </div>
              <Button type="submit" className="w-full">{editingId ? 'Update' : 'Add Dog'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <PawPrint className="mx-auto h-12 w-12 mb-4 opacity-40" />
          <p className="font-display text-lg">No dogs registered</p>
          <p className="text-sm">Register a dog to start boarding</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map(dog => (
              <motion.div key={dog.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-3 items-start cursor-pointer" onClick={() => onClickDog(dog.id)}>
                        {dog.photoUrl ? (
                          <img src={dog.photoUrl} alt={dog.name} className="h-12 w-12 rounded-full object-cover border-2 border-primary/20" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                            <PawPrint className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-display font-bold text-lg hover:text-primary transition-colors">{dog.name}</h3>
                          <p className="text-sm text-muted-foreground">{dog.breed} · {dog.age}y · {dog.weight}kg</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(dog)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(dog.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Owner: <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => onClickOwner(dog.ownerId)}>{getOwnerName(dog.ownerId)}</span>
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={dog.vaccinated ? 'default' : 'destructive'} className="text-xs">{dog.vaccinated ? '✓ Vaccinated' : '✗ Not Vaccinated'}</Badge>
                      {dog.neutered && <Badge variant="secondary" className="text-xs">Neutered</Badge>}
                      {dog.gender === 'male' ? <Badge variant="outline" className="text-xs">♂ Male</Badge> : <Badge variant="outline" className="text-xs">♀ Female</Badge>}
                    </div>
                    {dog.specialNeeds && <p className="text-xs text-muted-foreground mt-2 italic">⚠ {dog.specialNeeds}</p>}
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
