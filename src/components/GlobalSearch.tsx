import { useEffect, useMemo, useState } from 'react';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import { Users, Dog as DogIcon, CalendarCheck, Search } from 'lucide-react';
import { Owner, Dog, Boarding } from '@/types/boarding';
import { Button } from '@/components/ui/button';

interface Props {
  owners: Owner[];
  dogs: Dog[];
  boardings: Boarding[];
  onOwner: (id: string) => void;
  onDog: (id: string) => void;
  onBoarding: (id: string) => void;
}

export default function GlobalSearch({ owners, dogs, boardings, onOwner, onDog, onBoarding }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ownerName = (id: string) => owners.find(o => o.id === id)?.name || '';
  const dogName = (id: string) => dogs.find(d => d.id === id)?.name || '';

  const bookingItems = useMemo(() => boardings.slice(0, 100), [boardings]);

  const trigger = (fn: () => void) => { setOpen(false); setTimeout(fn, 50); };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 h-9 text-muted-foreground bg-background/70 hidden md:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="text-xs">Search…</span>
        <kbd className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
      </Button>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} title="Search">
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search owners, pets, bookings, phone…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Owners">
            {owners.map(o => (
              <CommandItem key={o.id} value={`owner ${o.name} ${o.phone} ${o.email}`} onSelect={() => trigger(() => onOwner(o.id))}>
                <Users className="h-4 w-4 mr-2 text-primary" />
                <span className="font-medium">{o.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{o.phone}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Pets">
            {dogs.map(d => (
              <CommandItem key={d.id} value={`pet ${d.name} ${d.breed} ${ownerName(d.ownerId)}`} onSelect={() => trigger(() => onDog(d.id))}>
                <DogIcon className="h-4 w-4 mr-2 text-primary" />
                <span className="font-medium">{d.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{d.breed} · {ownerName(d.ownerId)}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Bookings">
            {bookingItems.map(b => (
              <CommandItem
                key={b.id}
                value={`booking ${b.id} ${b.kennelNumber} ${dogName(b.dogId)} ${ownerName(b.ownerId)} ${b.checkInDate}`}
                onSelect={() => trigger(() => onBoarding(b.id))}
              >
                <CalendarCheck className="h-4 w-4 mr-2 text-primary" />
                <span className="font-medium">{dogName(b.dogId)}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  Kennel {b.kennelNumber || '—'} · {b.checkInDate} → {b.checkOutDate}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
