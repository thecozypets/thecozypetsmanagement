import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PawPrint, LayoutDashboard, Users, Dog, CalendarCheck, LogOut, Settings, Globe, Sun, Moon, Heart, Bone } from 'lucide-react';
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
import GlobalSearch from '@/components/GlobalSearch';
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
  const [boardingSubTab, setBoardingSubTab] = useState('owners');
  const [fosterSubTab, setFosterSubTab] = useState('owners');

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
      <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-50 gradient-header">
        <div className="container max-w-[1600px] mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between text-sm gap-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 sm:gap-3 min-w-0"
          >
            <motion.div
              whileHover={{ rotate: [0, -15, 15, -10, 10, 0], transition: { duration: 0.6 } }}
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <PawPrint className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0 relative" />
            </motion.div>
            <div className="min-w-0">
              <h1 className="font-bold text-foreground text-lg sm:text-2xl font-serif truncate">The Cozy Pets</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:flex items-center gap-1"><Bone className="h-3 w-3" /> Pet Boarding & Foster Care</p>
            </div>
          </motion.div>
          <div className="flex items-center gap-1 shrink-0">
            <GlobalSearch
              owners={owners}
              dogs={dogs}
              boardings={boardings}
              onOwner={openDetailByOwner}
              onDog={openDetailByDog}
              onBoarding={openDetailByBoarding}
            />
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-muted-foreground hover:rotate-12 transition-transform" title="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground px-2 sm:px-3 hover:text-destructive transition-colors" title="Sign Out">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-[1600px] mx-auto px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4 sm:mb-6 w-full justify-between bg-secondary/50 h-auto flex-wrap gap-1 p-1">
            <div className="flex flex-1 flex-wrap">
              <TabsTrigger value="dashboard" className="gap-1.5 sm:gap-2 font-display px-2 sm:px-3 data-[state=active]:shadow-sm transition-all"><LayoutDashboard className="h-4 w-4" /> <span className="hidden xs:inline sm:inline">Dashboard</span></TabsTrigger>
              <TabsTrigger value="boarding" className="gap-1.5 sm:gap-2 font-display px-2 sm:px-3 data-[state=active]:shadow-sm transition-all group"><Dog className="h-4 w-4 group-data-[state=active]:animate-wag origin-bottom" /> <span className="hidden xs:inline sm:inline">Boarding</span></TabsTrigger>
              <TabsTrigger value="foster" className="gap-1.5 sm:gap-2 font-display px-2 sm:px-3 data-[state=active]:shadow-sm transition-all"><Heart className="h-4 w-4" /> <span className="hidden xs:inline sm:inline">Foster</span></TabsTrigger>
              <TabsTrigger value="requests" className="gap-1.5 sm:gap-2 font-display px-2 sm:px-3 data-[state=active]:shadow-sm transition-all"><Globe className="h-4 w-4" /> <span className="hidden sm:inline">Online Bookings</span></TabsTrigger>
            </div>
            <TabsTrigger value="settings" className="font-display px-2 sm:px-3" title="Settings"><Settings className="h-4 w-4" /></TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard
              owners={owners} dogs={dogs} boardings={boardings}
              fosters={fosters} fosterOwners={fosterOwners} fosterDogs={fosterDogs}
              onClickOwner={openDetailByOwner} onClickDog={openDetailByDog} onClickBoarding={openDetailByBoarding}
              onClickFosterOwner={openFosterDetailByOwner} onClickFosterDog={openFosterDetailByDog}
              onQuickAction={(a) => {
                if (a === 'booking') { setTab('boarding'); setBoardingSubTab('boardings'); }
                else if (a === 'customer') { setTab('boarding'); setBoardingSubTab('owners'); }
                else if (a === 'pet') { setTab('boarding'); setBoardingSubTab('dogs'); }
                else if (a === 'invoice' || a === 'calendar' || a === 'reports') { setTab('boarding'); setBoardingSubTab('boardings'); }
              }}
            />
          </TabsContent>

          <TabsContent value="boarding">
            <div className="flex items-center gap-2 mb-4">
              <CalendarCheck className="h-5 w-5 text-primary" />
              <h2 className="font-display font-bold text-xl">Boarding</h2>
            </div>
            <Tabs value={boardingSubTab} onValueChange={setBoardingSubTab}>
              <TabsList className="bg-muted/60 w-full">
                <TabsTrigger value="owners" className="gap-1 sm:gap-1.5 flex-1 text-xs sm:text-sm px-1"><Users className="h-3.5 w-3.5" /> Owners</TabsTrigger>
                <TabsTrigger value="dogs" className="gap-1 sm:gap-1.5 flex-1 text-xs sm:text-sm px-1"><Dog className="h-3.5 w-3.5" /> Dogs</TabsTrigger>
                <TabsTrigger value="boardings" className="gap-1 sm:gap-1.5 flex-1 text-xs sm:text-sm px-1"><CalendarCheck className="h-3.5 w-3.5" /> Boardings</TabsTrigger>
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
                <TabsTrigger value="owners" className="gap-1 sm:gap-1.5 flex-1 text-xs sm:text-sm px-1"><Users className="h-3.5 w-3.5" /> Owners</TabsTrigger>
                <TabsTrigger value="dogs" className="gap-1 sm:gap-1.5 flex-1 text-xs sm:text-sm px-1"><Dog className="h-3.5 w-3.5" /> Dogs</TabsTrigger>
                <TabsTrigger value="fosters" className="gap-1 sm:gap-1.5 flex-1 text-xs sm:text-sm px-1"><Heart className="h-3.5 w-3.5" /> Fosters</TabsTrigger>
              </TabsList>
              <TabsContent value="owners">
                <OwnerManager owners={fosterOwners} onAdd={addFosterOwner} onUpdate={updateFosterOwner} onDelete={deleteFosterOwner} onClickOwner={openFosterDetailByOwner} />
              </TabsContent>
              <TabsContent value="dogs">
                <DogManager dogs={fosterDogs} owners={fosterOwners} onAdd={addFosterDog} onUpdate={updateFosterDog} onDelete={deleteFosterDog} onClickDog={openFosterDetailByDog} onClickOwner={openFosterDetailByOwner} enableAnimalType />
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
