import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PawPrint, LayoutDashboard, Users, Dog, CalendarCheck } from 'lucide-react';
import { useOwners, useDogs, useBoardings } from '@/hooks/useBoardingStore';
import Dashboard from '@/components/Dashboard';
import OwnerManager from '@/components/OwnerManager';
import DogManager from '@/components/DogManager';
import BoardingManager from '@/components/BoardingManager';
import { motion } from 'framer-motion';

const Index = () => {
  const { owners, addOwner, updateOwner, deleteOwner } = useOwners();
  const { dogs, addDog, updateDog, deleteDog } = useDogs();
  const { boardings, addBoarding, updateBoarding, deleteBoarding } = useBoardings();
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <motion.div
            initial={{ rotate: -20 }}
            animate={{ rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <PawPrint className="h-8 w-8 text-primary" />
          </motion.div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">PawStay</h1>
            <p className="text-xs text-muted-foreground">Dog Boarding Management</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 w-full justify-start bg-secondary/50">
            <TabsTrigger value="dashboard" className="gap-2 font-display">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="owners" className="gap-2 font-display">
              <Users className="h-4 w-4" /> Owners
            </TabsTrigger>
            <TabsTrigger value="dogs" className="gap-2 font-display">
              <Dog className="h-4 w-4" /> Dogs
            </TabsTrigger>
            <TabsTrigger value="boardings" className="gap-2 font-display">
              <CalendarCheck className="h-4 w-4" /> Boardings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard owners={owners} dogs={dogs} boardings={boardings} />
          </TabsContent>
          <TabsContent value="owners">
            <OwnerManager owners={owners} onAdd={addOwner} onUpdate={updateOwner} onDelete={deleteOwner} />
          </TabsContent>
          <TabsContent value="dogs">
            <DogManager dogs={dogs} owners={owners} onAdd={addDog} onUpdate={updateDog} onDelete={deleteDog} />
          </TabsContent>
          <TabsContent value="boardings">
            <BoardingManager boardings={boardings} dogs={dogs} owners={owners} onAdd={addBoarding} onUpdate={updateBoarding} onDelete={deleteBoarding} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
