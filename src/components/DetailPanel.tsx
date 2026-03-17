import { Owner, Dog, Boarding, BoardingStatus } from '@/types/boarding';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, MapPin, AlertCircle, Calendar, DollarSign, PawPrint, User, Stethoscope, Utensils, Pill } from 'lucide-react';
import { motion } from 'framer-motion';

const statusColors: Record<BoardingStatus, string> = {
  'reserved': 'bg-warning/20 text-warning-foreground border-warning/30',
  'checked-in': 'bg-success/20 text-success-foreground border-success/30',
  'checked-out': 'bg-muted text-muted-foreground',
  'cancelled': 'bg-destructive/20 text-destructive border-destructive/30',
};

interface DetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: Owner | null;
  dogs: Dog[];
  boardings: Boarding[];
  allOwners: Owner[];
  allDogs: Dog[];
  /** If set, highlights this specific dog */
  focusDogId?: string | null;
}

export default function DetailPanel({ open, onOpenChange, owner, dogs, boardings, allOwners, allDogs, focusDogId }: DetailPanelProps) {
  if (!owner) return null;

  const ownerDogs = dogs.filter(d => d.ownerId === owner.id);
  const ownerBoardings = boardings.filter(b => b.ownerId === owner.id);

  const sortedBoardings = [...ownerBoardings].sort((a, b) => {
    const order: Record<BoardingStatus, number> = { 'checked-in': 0, 'reserved': 1, 'checked-out': 2, 'cancelled': 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4) || new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime();
  });

  const getDogName = (id: string) => allDogs.find(d => d.id === id)?.name || 'Unknown';
  const getDog = (id: string) => allDogs.find(d => d.id === id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Complete Profile</DialogTitle>
        </DialogHeader>

        {/* Owner Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <User className="h-5 w-5" />
            <h3 className="font-display font-bold text-lg">Owner Information</h3>
          </div>
          <Card>
            <CardContent className="p-4">
              <h4 className="font-display font-bold text-lg mb-2">{owner.name}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{owner.phone}</div>
                {owner.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" />{owner.email}</div>}
                {owner.address && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{owner.address}</div>}
                {owner.emergencyContact && <div className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{owner.emergencyContact}</div>}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Dogs Section */}
          <div className="flex items-center gap-2 text-primary">
            <PawPrint className="h-5 w-5" />
            <h3 className="font-display font-bold text-lg">Dogs ({ownerDogs.length})</h3>
          </div>
          {ownerDogs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No dogs registered for this owner.</p>
          ) : (
            <div className="space-y-3">
              {ownerDogs.map(dog => (
                <motion.div key={dog.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className={focusDogId === dog.id ? 'ring-2 ring-primary' : ''}>
                    <CardContent className="p-4">
                      <div className="flex gap-3 items-start">
                        {dog.photoUrl ? (
                          <img src={dog.photoUrl} alt={dog.name} className="h-14 w-14 rounded-full object-cover border-2 border-primary/20 shrink-0" />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <PawPrint className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-bold">{dog.name}</h4>
                          <p className="text-sm text-muted-foreground">{dog.breed} · {dog.age}y · {dog.weight}kg · {dog.gender === 'male' ? '♂' : '♀'}</p>
                          <div className="flex gap-1.5 flex-wrap mt-1.5">
                            <Badge variant={dog.vaccinated ? 'default' : 'destructive'} className="text-xs">{dog.vaccinated ? '✓ Vaccinated' : '✗ Not Vaccinated'}</Badge>
                            {dog.neutered && <Badge variant="secondary" className="text-xs">Neutered</Badge>}
                          </div>
                          {dog.specialNeeds && (
                            <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                              <Stethoscope className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{dog.specialNeeds}</span>
                            </div>
                          )}
                          {dog.feedingInstructions && (
                            <div className="flex items-start gap-1.5 mt-1 text-xs text-muted-foreground">
                              <Utensils className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{dog.feedingInstructions}</span>
                            </div>
                          )}
                          {dog.medications && (
                            <div className="flex items-start gap-1.5 mt-1 text-xs text-muted-foreground">
                              <Pill className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{dog.medications}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <Separator />

          {/* Boardings Section */}
          <div className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            <h3 className="font-display font-bold text-lg">Bookings ({sortedBoardings.length})</h3>
          </div>
          {sortedBoardings.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No bookings found for this owner.</p>
          ) : (
            <div className="space-y-2">
              {sortedBoardings.map(b => {
                const dog = getDog(b.dogId);
                return (
                  <Card key={b.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-display font-semibold text-sm">🐕 {getDogName(b.dogId)}</span>
                            <Badge className={`text-xs ${statusColors[b.status]}`}>{b.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />In: {b.checkInDate}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Out: {b.checkOutDate}</span>
                            {b.kennelNumber && <span>Kennel: #{b.kennelNumber}</span>}
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${b.totalCost.toFixed(2)} (${b.dailyRate}/day)</span>
                          </div>
                          {b.feedingSchedule && <p className="text-xs text-muted-foreground mt-1">🍽 {b.feedingSchedule}</p>}
                          {b.specialRequests && <p className="text-xs text-muted-foreground mt-0.5">📝 {b.specialRequests}</p>}
                          {b.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{b.notes}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
