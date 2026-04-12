import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PawPrint, LayoutDashboard, Users, Dog, CalendarCheck, LogOut, Settings, Globe, Sun, Moon, Heart } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useOwners, useDogs, useBoardings, useFosters, useFosterOwners, useFosterDogs } from '@/hooks/useBoardingStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Dashboard from '@/components/Dashboard';
import OwnerManager from '@/components/OwnerManager';
import DogManager from '@/components/DogManager';
import BoardingManager from '@/components/BoardingManager';
import FosterManager from '@/components/FosterManager';
import DetailPanel from '@/components/DetailPanel';
import CompanySettingsForm from '@/components/CompanySettingsForm';
import BookingRequestsManager from '@/components/BookingRequestsManager';
import { motion } from 'framer-motion';
import { Owner } from '@/types/boarding';

const Index = () => {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { owners, addOwner, updateOwner, deleteOwner } = useOwners();
  const { dogs, addDog, updateDog, deleteDog } = useDogs();
  const { boardings, addBoarding, updateBoarding, deleteBoarding } = useBoardings();
  const { fosters, addFoster, updateFoster, deleteFoster } = useFosters();
  const { fosterOwners, addFosterOwner, updateFosterOwner, deleteFosterOwner } = useFosterOwners();
  const { fosterDogs, addFosterDog, updateFosterDog, deleteFosterDog } = useFosterDogs();
  const [tab, setTab] = useState('dashboard');
  const [boardingSubTab, setBoardingSubTab] = useState('boardings');
  const [fosterSubTab, setFosterSubTab] = useState('fosters');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOwner, setDetailOwner] = useState<Owner | null>(null);
  const [focusDogId, setFocusDogId] = useState<string | null>(null);

  const openDetailByOwner = (ownerId: string) => {
    const owner = owners.find((o) => o.id === ownerId);
    if (owner) { setDetailOwner(owner); setFocusDogId(null); setDetailOpen(true); }
  };

  const openDetailByDog = (dogId: string) => {
    const dog = dogs.find((d) => d.id === dogId);
    if (dog) {
      const owner = owners.find((o) => o.id === dog.ownerId);
      if (owner) { setDetailOwner(owner); setFocusDogId(dogId); setDetailOpen(true); }
    }
  };

  const openDetailByBoarding = (boardingId: string) => {
    const b = boardings.find((x) => x.id === boardingId);
    if (b) {
      const owner = owners.find((o) => o.id === b.ownerId);
      if (owner) { setDetailOwner(owner); setFocusDogId(b.dogId); setDetailOpen(true); }
    }
  };

  const openFosterDetailByOwner = (ownerId: string) => {
    const owner = fosterOwners.find((o) => o.id === ownerId);
    if (owner) { setDetailOwner(owner); setFocusDogId(null); setDetailOpen(true); }
  };

  const openFosterDetailByDog = (dogId: string) => {
    const dog = fosterDogs.find((d) => d.id === dogId);
    if (dog) {
      const owner = fosterOwners.find((o) => o.id === dog.ownerId);
      if (owner) { setDetailOwner(owner); setFocusDogId(dogId); setDetailOpen(true); }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <motion.div initial={{ rotate: -20 }} animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }}>
              <PawPrint className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="font-bold text-foreground text-2xl font-serif">The Cozy Pets</h1>
              <p className="text-xs text-muted-foreground"></p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-muted-foreground" title="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-[1600px] mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 w-full justify-between bg-secondary/50">
            <div className="flex">
              <TabsTrigger value="dashboard" className="gap-2 font-display"><LayoutDashboard className="h-4 w-4" /> Dashboard</TabsTrigger>
              <TabsTrigger value="boarding" className="gap-2 font-display"><CalendarCheck className="h-4 w-4" /> Boarding</TabsTrigger>
              <TabsTrigger value="foster" className="gap-2 font-display"><Heart className="h-4 w-4" /> Foster</TabsTrigger>
              <TabsTrigger value="requests" className="gap-2 font-display"><Globe className="h-4 w-4" /> Online Bookings</TabsTrigger>
            </div>
            <TabsTrigger value="settings" className="font-display" title="Settings"><Settings className="h-4 w-4" /></TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard
              owners={owners} dogs={dogs} boardings={boardings}
              fosters={fosters} fosterOwners={fosterOwners} fosterDogs={fosterDogs}
              onClickOwner={openDetailByOwner} onClickDog={openDetailByDog} onClickBoarding={openDetailByBoarding}
              onClickFosterOwner={openFosterDetailByOwner} onClickFosterDog={openFosterDetailByDog}
            />
          </TabsContent>

          <TabsContent value="boarding">
            <div className="flex items-center gap-2 mb-4">
              <CalendarCheck className="h-5 w-5 text-primary" />
              <h2 className="font-display font-bold text-xl">Boarding</h2>
            </div>
            <Tabs value={boardingSubTab} onValueChange={setBoardingSubTab}>
              <TabsList className="bg-muted/60 w-full">
                <TabsTrigger value="owners" className="gap-1.5 flex-1"><Users className="h-3.5 w-3.5" /> Owners</TabsTrigger>
                <TabsTrigger value="dogs" className="gap-1.5 flex-1"><Dog className="h-3.5 w-3.5" /> Dogs</TabsTrigger>
                <TabsTrigger value="boardings" className="gap-1.5 flex-1"><CalendarCheck className="h-3.5 w-3.5" /> Boardings</TabsTrigger>
              </TabsList>
              <TabsContent value="owners">
                <OwnerManager owners={owners} onAdd={addOwner} onUpdate={updateOwner} onDelete={deleteOwner} onClickOwner={openDetailByOwner} />
              </TabsContent>
              <TabsContent value="dogs">
                <DogManager dogs={dogs} owners={owners} onAdd={addDog} onUpdate={updateDog} onDelete={deleteDog} onClickDog={openDetailByDog} onClickOwner={openDetailByOwner} />
              </TabsContent>
              <TabsContent value="boardings">
                <BoardingManager boardings={boardings} dogs={dogs} owners={owners} onAdd={addBoarding} onUpdate={updateBoarding} onDelete={deleteBoarding} onClickBoarding={openDetailByBoarding} onClickDog={openDetailByDog} onClickOwner={openDetailByOwner} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="foster">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-destructive" />
              <h2 className="font-display font-bold text-xl">Foster</h2>
            </div>
            <Tabs value={fosterSubTab} onValueChange={setFosterSubTab}>
              <TabsList className="bg-muted/60 w-full">
                <TabsTrigger value="owners" className="gap-1.5 flex-1"><Users className="h-3.5 w-3.5" /> Owners</TabsTrigger>
                <TabsTrigger value="dogs" className="gap-1.5 flex-1"><Dog className="h-3.5 w-3.5" /> Dogs</TabsTrigger>
                <TabsTrigger value="fosters" className="gap-1.5 flex-1"><Heart className="h-3.5 w-3.5" /> Fosters</TabsTrigger>
              </TabsList>
              <TabsContent value="owners">
                <OwnerManager owners={fosterOwners} onAdd={addFosterOwner} onUpdate={updateFosterOwner} onDelete={deleteFosterOwner} onClickOwner={openFosterDetailByOwner} />
              </TabsContent>
              <TabsContent value="dogs">
                <DogManager dogs={fosterDogs} owners={fosterOwners} onAdd={addFosterDog} onUpdate={updateFosterDog} onDelete={deleteFosterDog} onClickDog={openFosterDetailByDog} onClickOwner={openFosterDetailByOwner} />
              </TabsContent>
              <TabsContent value="fosters">
                <FosterManager fosters={fosters} dogs={fosterDogs} owners={fosterOwners} onAdd={addFoster} onUpdate={updateFoster} onDelete={deleteFoster} onClickDog={openFosterDetailByDog} onClickOwner={openFosterDetailByOwner} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="requests">
            <BookingRequestsManager />
          </TabsContent>
          <TabsContent value="settings">
            <CompanySettingsForm />
          </TabsContent>
        </Tabs>
      </main>

      <DetailPanel open={detailOpen}
        onOpenChange={setDetailOpen}
        owner={detailOwner}
        dogs={[...dogs, ...fosterDogs]}
        boardings={boardings}
        allOwners={[...owners, ...fosterOwners]}
        allDogs={[...dogs, ...fosterDogs]}
        focusDogId={focusDogId} />
    </div>
  );
};

export default Index;
