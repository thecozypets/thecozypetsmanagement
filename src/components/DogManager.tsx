import { useState } from 'react';
import { Dog, Owner, AnimalType } from '@/types/boarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PawPrint, Pencil, Trash2, Plus, Cat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DogFormData {
  name: string;
  breed: string;
  age: number;
  ageMonths: number;
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
  animalType?: AnimalType;
}

const emptyForm: DogFormData = { name: '', breed: '', age: 0, ageMonths: 0, weight: 0, gender: 'male', ownerId: '', specialNeeds: '', feedingInstructions: '', medications: '', vaccinated: false, neutered: false, photoUrl: '', vaccinePhotoUrl: '', animalType: 'dog' };

interface Props {
  dogs: Dog[];
  owners: Owner[];
  onAdd: (data: DogFormData) => void;
  onUpdate: (id: string, data: Partial<Dog>) => void;
  onDelete: (id: string) => void;
  onClickDog: (dogId: string) => void;
  onClickOwner: (ownerId: string) => void;
  enableAnimalType?: boolean;
}

export default function DogManager({ dogs, owners, onAdd, onUpdate, onDelete, onClickDog, onClickOwner, enableAnimalType = false }: Props) {
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
    setForm({ name: dog.name, breed: dog.breed, age: dog.age, ageMonths: dog.ageMonths || 0, weight: dog.weight, gender: dog.gender, ownerId: dog.ownerId, specialNeeds: dog.specialNeeds, feedingInstructions: dog.feedingInstructions, medications: dog.medications, vaccinated: dog.vaccinated, neutered: dog.neutered, photoUrl: dog.photoUrl || '', vaccinePhotoUrl: dog.vaccinePhotoUrl || '', animalType: dog.animalType || 'dog' });
    setEditingId(dog.id);
    setOpen(true);
  };

  const [filterAnimal, setFilterAnimal] = useState<string>('all');

  const getOwnerName = (id: string) => owners.find(o => o.id === id)?.name || 'Unknown';

  const filtered = dogs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.breed.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <Input placeholder="Search dogs..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:max-w-xs" />
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Add Dog</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? 'Edit Dog' : 'Add New Dog'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div><Label>Name *</Label><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Breed *</Label><Input required value={form.breed} onChange={e => setForm(p => ({ ...p, breed: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div><Label>Age (years)</Label><Input type="number" min={0} value={form.age} onChange={e => setForm(p => ({ ...p, age: +e.target.value }))} /></div>
                <div><Label>Months</Label><Input type="number" min={0} max={11} value={form.ageMonths} onChange={e => setForm(p => ({ ...p, ageMonths: Math.min(11, Math.max(0, +e.target.value)) }))} /></div>
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
                <div className="flex items-center gap-2"><Switch checked={form.vaccinated} onCheckedChange={v => setForm(p => ({ ...p, vaccinated: v, vaccinePhotoUrl: v ? p.vaccinePhotoUrl : '' }))} /><Label>Vaccinated</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.neutered} onCheckedChange={v => setForm(p => ({ ...p, neutered: v }))} /><Label>Neutered</Label></div>
              </div>
              {form.vaccinated && (
                <div>
                  <Label>Vaccine Certificate Photo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setForm(p => ({ ...p, vaccinePhotoUrl: reader.result as string }));
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {form.vaccinePhotoUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={form.vaccinePhotoUrl} alt="Vaccine certificate" className="h-24 w-32 rounded-lg object-cover border border-border" />
                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setForm(p => ({ ...p, vaccinePhotoUrl: '' }))}>Remove</Button>
                    </div>
                  )}
                </div>
              )}
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
                          <p className="text-sm text-muted-foreground">{dog.breed} · {dog.age}y {dog.ageMonths ? `${dog.ageMonths}m` : ''} · {dog.weight}kg</p>
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
                    {dog.vaccinated && dog.vaccinePhotoUrl && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">📋 Vaccine Certificate</p>
                        <img src={dog.vaccinePhotoUrl} alt="Vaccine certificate" className="h-20 w-28 rounded-md object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(dog.vaccinePhotoUrl, '_blank')} />
                      </div>
                    )}
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
