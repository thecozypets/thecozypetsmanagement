import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PawPrint, LayoutDashboard, Users, Dog, CalendarCheck, LogOut, Settings, Globe } from 'lucide-react';
import { useOwners, useDogs, useBoardings } from '@/hooks/useBoardingStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Dashboard from '@/components/Dashboard';
import OwnerManager from '@/components/OwnerManager';
import DogManager from '@/components/DogManager';
import BoardingManager from '@/components/BoardingManager';
import DetailPanel from '@/components/DetailPanel';
import CompanySettingsForm from '@/components/CompanySettingsForm';
import BookingRequestsManager from '@/components/BookingRequestsManager';
import { motion } from 'framer-motion';
import { Owner } from '@/types/boarding';

const Index = () => {
  const { signOut } = useAuth();
  const { owners, addOwner, updateOwner, deleteOwner } = useOwners();
  const { dogs, addDog, updateDog, deleteDog } = useDogs();
  const { boardings, addBoarding, updateBoarding, deleteBoarding } = useBoardings();
  const [tab, setTab] = useState('dashboard');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOwner, setDetailOwner] = useState<Owner | null>(null);
  const [focusDogId, setFocusDogId] = useState<string | null>(null);

  const openDetailByOwner = (ownerId: string) => {
    const owner = owners.find((o) => o.id === ownerId);
    if (owner) {setDetailOwner(owner);setFocusDogId(null);setDetailOpen(true);}
  };

  const openDetailByDog = (dogId: string) => {
    const dog = dogs.find((d) => d.id === dogId);
    if (dog) {
      const owner = owners.find((o) => o.id === dog.ownerId);
      if (owner) {setDetailOwner(owner);setFocusDogId(dogId);setDetailOpen(true);}
    }
  };

  const openDetailByBoarding = (boardingId: string) => {
    const b = boardings.find((x) => x.id === boardingId);
    if (b) {
      const owner = owners.find((o) => o.id === b.ownerId);
      if (owner) {setDetailOwner(owner);setFocusDogId(b.dogId);setDetailOpen(true);}
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <motion.div initial={{ rotate: -20 }} animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }}>
              <PawPrint className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="font-bold text-foreground text-2xl font-serif">The Cozy Pets</h1>
              <p className="text-xs text-muted-foreground">
</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 w-full justify-between bg-secondary/50">
            <div className="flex">
              <TabsTrigger value="dashboard" className="gap-2 font-display"><LayoutDashboard className="h-4 w-4" /> Dashboard</TabsTrigger>
              <TabsTrigger value="owners" className="gap-2 font-display"><Users className="h-4 w-4" /> Owners</TabsTrigger>
              <TabsTrigger value="dogs" className="gap-2 font-display"><Dog className="h-4 w-4" /> Dogs</TabsTrigger>
              <TabsTrigger value="boardings" className="gap-2 font-display"><CalendarCheck className="h-4 w-4" /> Boardings</TabsTrigger>
            </div>
            <TabsTrigger value="settings" className="font-display" title="Settings"><Settings className="h-4 w-4" /></TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard owners={owners} dogs={dogs} boardings={boardings} onClickOwner={openDetailByOwner} onClickDog={openDetailByDog} onClickBoarding={openDetailByBoarding} />
          </TabsContent>
          <TabsContent value="owners">
            <OwnerManager owners={owners} onAdd={addOwner} onUpdate={updateOwner} onDelete={deleteOwner} onClickOwner={openDetailByOwner} />
          </TabsContent>
          <TabsContent value="dogs">
            <DogManager dogs={dogs} owners={owners} onAdd={addDog} onUpdate={updateDog} onDelete={deleteDog} onClickDog={openDetailByDog} onClickOwner={openDetailByOwner} />
          </TabsContent>
          <TabsContent value="boardings">
            <BoardingManager boardings={boardings} dogs={dogs} owners={owners} onAdd={addBoarding} onUpdate={updateBoarding} onDelete={deleteBoarding} onClickBoarding={openDetailByBoarding} onClickDog={openDetailByDog} onClickOwner={openDetailByOwner} />
          </TabsContent>
          <TabsContent value="settings">
            <CompanySettingsForm />
          </TabsContent>
        </Tabs>
      </main>

      <DetailPanel open={detailOpen}
      onOpenChange={setDetailOpen}
      owner={detailOwner}
      dogs={dogs}
      boardings={boardings}
      allOwners={owners}
      allDogs={dogs}
      focusDogId={focusDogId} />
      
    </div>);

};

export default Index;